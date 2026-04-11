<?php

namespace App\Services;

use App\Models\Mod;
use App\Models\Page;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GitHubMarkdownSyncService
{
    /**
     * @return array{created:int,updated:int,deleted:int,total:int}
     */
    public function syncMod(Mod $mod, bool $prune = true, bool $dryRun = false): array
    {
        [$owner, $repo] = $this->parseRepository($mod->github_repository_url);
        $basePath = $this->normalizeBasePath($mod->github_repository_path);
        $branch = $this->fetchDefaultBranch($owner, $repo);

        $files = [];
        $this->fetchMarkdownFiles($owner, $repo, $branch, $basePath, $basePath, $files);

        usort($files, fn (array $a, array $b) => strcmp($a['path'], $b['path']));

        if ($dryRun) {
            return [
                'created' => 0,
                'updated' => 0,
                'deleted' => 0,
                'total' => count($files),
            ];
        }

        return DB::transaction(function () use ($mod, $files, $prune) {
            $created = 0;
            $updated = 0;
            $deleted = 0;
            $indexPageId = null;

            /** @var array<string, \App\Models\Page> $pagesBySourcePath */
            $pagesBySourcePath = [];

            $legacyPagesQuery = Page::where('mod_id', $mod->id)
                ->where(function ($query) {
                    $query->whereNull('source_type')
                        ->orWhere('source_type', '!=', 'github');
                });

            $deleted += (clone $legacyPagesQuery)->count();
            $legacyPagesQuery->delete();

            $existingGithubPages = Page::withTrashed()
                ->where('mod_id', $mod->id)
                ->where('source_type', 'github')
                ->get()
                ->keyBy('source_path');

            $filesByFolder = $this->groupFilesByFolder($files);
            $indexFiles = $this->extractIndexFiles($filesByFolder);
            $metaFiles = $this->extractMetaFiles($filesByFolder);

            if ($prune) {
                $expectedSourcePaths = $this->buildExpectedSourcePathSet($files, $filesByFolder, $indexFiles);

                $pagesToDelete = $existingGithubPages
                    ->filter(function (Page $page) use ($expectedSourcePaths): bool {
                        if ($page->trashed()) {
                            return false;
                        }

                        if ($page->source_path === null) {
                            return true;
                        }

                        return ! isset($expectedSourcePaths[$page->source_path]);
                    })
                    ->values();

                foreach ($pagesToDelete as $page) {
                    $page->delete();
                    $deleted++;
                }
            }

            $categoryResults = $this->processFolderCategories($mod, $filesByFolder, $indexFiles, $metaFiles, $existingGithubPages, $pagesBySourcePath);
            $created += $categoryResults['created'];
            $updated += $categoryResults['updated'];
            $deleted += $categoryResults['deleted'];

            foreach ($files as $orderIndex => $file) {
                $sourcePath = $file['path'];

                if ($this->isIndexFile($sourcePath)) {
                    continue;
                }

                if ($this->isMetaFile($sourcePath)) {
                    continue;
                }

                $page = $existingGithubPages->get($sourcePath);
                $parsedContent = $this->parseFrontMatter($file['content']);
                $metadata = $parsedContent['metadata'];

                $isNew = false;

                if (! $page) {
                    $isNew = true;
                    $page = new Page([
                        'mod_id' => $mod->id,
                        'created_by' => $mod->owner_id,
                    ]);
                } elseif ($page->trashed()) {
                    $page->restore();
                }

                $page->source_type = 'github';
                $page->source_path = $sourcePath;
                $page->source_sha = $file['sha'];
                $page->kind = Page::KIND_PAGE;
                $page->title = $this->resolveTitle($sourcePath, $metadata);
                $page->content = $parsedContent['content'];
                $page->published = $this->resolvePublished($metadata);
                $page->updated_by = $mod->owner_id;
                $page->order_index = $this->resolveOrderIndex($metadata, $orderIndex);
                $page->is_index = false;

                if (! $page->slug) {
                    $page->slug = $this->buildUniqueSlug($mod, $page->title, $page->id);
                }

                $page->save();

                $pagesBySourcePath[$sourcePath] = $page;

                if ($isNew) {
                    $created++;
                } else {
                    $updated++;
                }
            }

            foreach ($pagesBySourcePath as $sourcePath => $page) {
                $parentSourcePath = $this->getParentFolderSourcePath($sourcePath, $filesByFolder, $indexFiles);
                $parentId = $parentSourcePath ? ($pagesBySourcePath[$parentSourcePath]->id ?? null) : null;

                if ($page->parent_id !== $parentId) {
                    $page->parent_id = $parentId;
                    $page->updated_by = $mod->owner_id;
                    $page->save();
                }
            }

            if ($indexPageId) {
                Page::where('mod_id', $mod->id)
                    ->where('is_index', true)
                    ->where('id', '!=', $indexPageId)
                    ->update(['is_index' => false]);
            }

            return [
                'created' => $created,
                'updated' => $updated,
                'deleted' => $deleted,
                'total' => count($files),
            ];
        });
    }

    /**
     * @return array{0:string,1:string}
     */
    private function parseRepository(?string $repositoryUrl): array
    {
        if (! $repositoryUrl) {
            throw new RuntimeException('Missing GitHub repository URL.');
        }

        $trimmed = trim($repositoryUrl);

        if (! preg_match('~github\.com[:/](?<owner>[A-Za-z0-9_.-]+)/(?<repo>[A-Za-z0-9_.-]+?)(?:\.git)?/?$~', $trimmed, $matches)) {
            throw new RuntimeException("Invalid GitHub repository URL: {$repositoryUrl}");
        }

        return [$matches['owner'], $matches['repo']];
    }

    private function normalizeBasePath(?string $repositoryPath): string
    {
        $path = trim((string) $repositoryPath);

        if ($path === '' || $path === '/') {
            return '';
        }

        return trim($path, '/');
    }

    private function fetchDefaultBranch(string $owner, string $repo): string
    {
        $response = $this->githubClient()
            ->get("https://api.github.com/repos/{$owner}/{$repo}");

        if (! $response->successful()) {
            throw new RuntimeException("Unable to read repository metadata for {$owner}/{$repo}. {$response->body()}");
        }

        return (string) $response->json('default_branch', 'main');
    }

    /**
     * @param  array<int, array{path:string,sha:string,content:string}>  $files
     */
    private function fetchMarkdownFiles(string $owner, string $repo, string $branch, string $basePath, string $currentPath, array &$files): void
    {
        $contentsUrl = "https://api.github.com/repos/{$owner}/{$repo}/contents";

        if ($currentPath !== '') {
            $contentsUrl .= '/'.$this->encodePath($currentPath);
        }

        $response = $this->githubClient()->get($contentsUrl, ['ref' => $branch]);

        if ($response->status() === 404) {
            return;
        }

        if (! $response->successful()) {
            throw new RuntimeException("Unable to read repository contents from {$owner}/{$repo} ({$currentPath}).");
        }

        $items = $response->json();

        if (isset($items['type'])) {
            $items = [$items];
        }

        foreach ($items as $item) {
            if (($item['type'] ?? null) === 'dir') {
                $this->fetchMarkdownFiles($owner, $repo, $branch, $basePath, $item['path'], $files);

                continue;
            }

            if (($item['type'] ?? null) !== 'file') {
                continue;
            }

            $name = (string) ($item['name'] ?? '');
            $isMarkdownFile = str_ends_with(strtolower($name), '.md');
            $isMetaFile = strtolower($name) === 'meta.json';

            if (! ($isMarkdownFile || $isMetaFile)) {
                continue;
            }

            $downloadUrl = (string) ($item['download_url'] ?? '');
            if ($downloadUrl === '') {
                continue;
            }

            $contentResponse = Http::timeout(30)->get($downloadUrl);

            if (! $contentResponse->successful()) {
                throw new RuntimeException("Unable to download file: {$downloadUrl}");
            }

            $fullPath = (string) ($item['path'] ?? '');
            $relativePath = $this->toRelativePath($fullPath, $basePath);

            if ($relativePath === '') {
                continue;
            }

            $files[] = [
                'path' => $relativePath,
                'sha' => (string) ($item['sha'] ?? ''),
                'content' => $contentResponse->body(),
            ];
        }
    }

    /**
     * Group files by their folder path.
     *
     * @param  array<int, array{path:string,sha:string,content:string}>  $files
     * @return array<string, array<int, array{path:string,sha:string,content:string}>>
     */
    private function groupFilesByFolder(array $files): array
    {
        $grouped = [];

        foreach ($files as $file) {
            $folder = dirname($file['path']);
            if ($folder === '.') {
                $folder = '';
            }

            if (! isset($grouped[$folder])) {
                $grouped[$folder] = [];
            }

            $grouped[$folder][] = $file;
        }

        return $grouped;
    }

    /**
     * Extract index files from grouped files by folder.
     *
     * @param  array<string, array<int, array{path:string,sha:string,content:string}>>  $filesByFolder
     * @return array<string, array{path:string,sha:string,content:string}>
     */
    private function extractIndexFiles(array $filesByFolder): array
    {
        $indexFiles = [];

        foreach ($filesByFolder as $folder => $files) {
            foreach ($files as $file) {
                if ($this->isIndexFile($file['path'])) {
                    $indexFiles[$folder] = $file;
                }
            }
        }

        return $indexFiles;
    }

    /**
     * Extract meta.json files from grouped files by folder.
     *
     * @param  array<string, array<int, array{path:string,sha:string,content:string}>>  $filesByFolder
     * @return array<string, array{path:string,sha:string,content:string}>
     */
    private function extractMetaFiles(array $filesByFolder): array
    {
        $metaFiles = [];

        foreach ($filesByFolder as $folder => $files) {
            foreach ($files as $file) {
                if (basename($file['path']) === 'meta.json') {
                    $metaFiles[$folder] = $file;
                }
            }
        }

        return $metaFiles;
    }

    /**
     * Build the expected source paths for this sync so stale rows can be pruned before upserts.
     *
     * @param  array<int, array{path:string,sha:string,content:string}>  $files
     * @param  array<string, array<int, array{path:string,sha:string,content:string}>>  $filesByFolder
     * @param  array<string, array{path:string,sha:string,content:string}>  $indexFiles
     * @return array<string, true>
     */
    private function buildExpectedSourcePathSet(array $files, array $filesByFolder, array $indexFiles): array
    {
        $expectedSourcePaths = [];

        foreach ($filesByFolder as $folder => $folderFiles) {
            if (isset($indexFiles[$folder])) {
                $expectedSourcePaths[$indexFiles[$folder]['path']] = true;

                continue;
            }

            if ($folder !== '') {
                $expectedSourcePaths[$folder] = true;
            }
        }

        foreach ($files as $file) {
            if ($this->isIndexFile($file['path']) || $this->isMetaFile($file['path'])) {
                continue;
            }

            $expectedSourcePaths[$file['path']] = true;
        }

        return $expectedSourcePaths;
    }

    /**
     * Check if a file is an index file (index.md or README.md).
     */
    private function isIndexFile(string $sourcePath): bool
    {
        $filename = basename($sourcePath);

        return in_array(strtolower($filename), ['index.md', 'readme.md'], true);
    }

    /**
     * Check if a file is a meta.json file.
     */
    private function isMetaFile(string $sourcePath): bool
    {
        return basename($sourcePath) === 'meta.json';
    }

    /**
     * Get the source path for the parent folder's index.md or category.
     * Returns null if at root level.
     *
     * @param  array<string, array<int, array{path:string,sha:string,content:string}>>  $filesByFolder
     * @param  array<string, array{path:string,sha:string,content:string}>  $indexFiles
     */
    private function getParentFolderSourcePath(string $sourcePath, array $filesByFolder, array $indexFiles): ?string
    {
        if ($this->isIndexFile($sourcePath)) {
            $directory = dirname($sourcePath);

            if ($directory === '' || $directory === '.') {
                return null;
            }

            $parentDirectory = dirname($directory);

            if ($parentDirectory === '' || $parentDirectory === '.') {
                return null;
            }

            if (isset($indexFiles[$parentDirectory])) {
                return $indexFiles[$parentDirectory]['path'];
            }

            if (isset($filesByFolder[$parentDirectory])) {
                return $parentDirectory;
            }

            return null;
        }

        $directory = dirname($sourcePath);

        if ($directory === '' || $directory === '.') {
            return null;
        }

        if (isset($indexFiles[$directory])) {
            return $indexFiles[$directory]['path'];
        }

        if (isset($filesByFolder[$directory])) {
            return $directory;
        }

        return null;
    }

    /**
     * Process folder categories and index pages.
     *
     * @param  array<string, array<int, array{path:string,sha:string,content:string}>>  $filesByFolder
     * @param  array<string, array{path:string,sha:string,content:string}>  $indexFiles
     * @param  array<string, array{path:string,sha:string,content:string}>  $metaFiles
     * @param  \Illuminate\Support\Collection<string, Page>  $existingGithubPages
     * @param  array<string, \App\Models\Page>  &$pagesBySourcePath
     * @return array{created:int,updated:int,deleted:int}
     */
    private function processFolderCategories(
        Mod $mod,
        array $filesByFolder,
        array $indexFiles,
        array $metaFiles,
        $existingGithubPages,
        array &$pagesBySourcePath
    ): array {
        $created = 0;
        $updated = 0;
        $deleted = 0;
        $processedFolders = [];

        foreach ($filesByFolder as $folder => $folderFiles) {
            $hasIndexFile = isset($indexFiles[$folder]);

            if ($hasIndexFile) {
                $indexFile = $indexFiles[$folder];
                $sourcePath = $indexFile['path'];
                $page = $existingGithubPages->get($sourcePath);
                $parsedContent = $this->parseFrontMatter($indexFile['content']);
                $metadata = $parsedContent['metadata'];

                $isNew = false;
                if (! $page) {
                    $isNew = true;
                    $page = new Page([
                        'mod_id' => $mod->id,
                        'created_by' => $mod->owner_id,
                    ]);
                } elseif ($page->trashed()) {
                    $page->restore();
                }

                $page->source_type = 'github';
                $page->source_path = $sourcePath;
                $page->source_sha = $indexFile['sha'];
                $page->kind = Page::KIND_PAGE;
                $page->title = $this->resolveTitle($sourcePath, $metadata);
                $page->content = $parsedContent['content'];
                $page->published = $this->resolvePublished($metadata);
                $page->updated_by = $mod->owner_id;
                $page->order_index = $this->resolveOrderIndex($metadata, 0);
                $page->is_index = $sourcePath === 'index.md' || $sourcePath === 'README.md';

                if (! $page->slug) {
                    $page->slug = $this->buildUniqueSlug($mod, $page->title, $page->id);
                }

                $page->save();
                $pagesBySourcePath[$sourcePath] = $page;

                if ($isNew) {
                    $created++;
                } else {
                    $updated++;
                }
            } elseif ($folder !== '') {
                $categorySourcePath = $folder;
                $page = $existingGithubPages->get($categorySourcePath);

                $isNew = false;
                if (! $page) {
                    $isNew = true;
                    $page = new Page([
                        'mod_id' => $mod->id,
                        'created_by' => $mod->owner_id,
                    ]);
                } elseif ($page->trashed()) {
                    $page->restore();
                }

                $categoryTitle = $this->titleFromPath($folder.'/index.md');
                $categoryMetadata = [];
                if (isset($metaFiles[$folder])) {
                    $metaData = json_decode($metaFiles[$folder]['content'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($metaData)) {
                        if (isset($metaData['title']) && is_string($metaData['title'])) {
                            $categoryTitle = $metaData['title'];
                        }
                        $categoryMetadata = $metaData;
                    } else {
                        \Log::warning('Invalid JSON in meta.json for folder: '.$folder, [
                            'error' => json_last_error_msg(),
                            'path' => $metaFiles[$folder]['path'],
                        ]);
                    }
                }

                $page->source_type = 'github';
                $page->source_path = $categorySourcePath;
                $page->source_sha = '';
                $page->kind = Page::KIND_CATEGORY;
                $page->title = $categoryTitle;
                $page->content = '';
                $page->published = $categoryMetadata['published'] ?? true;
                $page->updated_by = $mod->owner_id;
                $page->order_index = $categoryMetadata['order'] ?? 0;
                $page->is_index = false;

                if (! $page->slug) {
                    $page->slug = $this->buildUniqueSlug($mod, $page->title, $page->id);
                }

                $page->save();
                $pagesBySourcePath[$categorySourcePath] = $page;

                if ($isNew) {
                    $created++;
                } else {
                    $updated++;
                }
            }

            $processedFolders[] = $folder;
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'deleted' => $deleted,
        ];
    }

    private function toRelativePath(string $fullPath, string $basePath): string
    {
        $normalizedFullPath = ltrim($fullPath, '/');

        if ($basePath === '') {
            return $normalizedFullPath;
        }

        $prefix = $basePath.'/';

        if ($normalizedFullPath === $basePath) {
            return '';
        }

        if (str_starts_with($normalizedFullPath, $prefix)) {
            return substr($normalizedFullPath, strlen($prefix));
        }

        return $normalizedFullPath;
    }

    private function encodePath(string $path): string
    {
        $segments = array_filter(explode('/', $path), fn (string $segment) => $segment !== '');

        return implode('/', array_map('rawurlencode', $segments));
    }

    private function titleFromPath(string $sourcePath): string
    {
        $directory = dirname($sourcePath);
        $filename = pathinfo($sourcePath, PATHINFO_FILENAME);

        if (strtoupper($filename) === 'README') {
            if ($directory === '.') {
                return 'Home';
            }

            return Str::headline(basename($directory));
        }

        return Str::headline($filename);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function resolveTitle(string $sourcePath, array $metadata): string
    {
        $title = $metadata['title'] ?? null;

        if (is_string($title) && trim($title) !== '') {
            return trim($title);
        }

        return $this->titleFromPath($sourcePath);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function resolvePublished(array $metadata): bool
    {
        if (isset($metadata['published']) && is_bool($metadata['published'])) {
            return $metadata['published'];
        }

        if (isset($metadata['draft']) && is_bool($metadata['draft'])) {
            return ! $metadata['draft'];
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function resolveOrderIndex(array $metadata, int $default): int
    {
        $order = $metadata['order'] ?? null;

        return is_int($order) ? $order : $default;
    }

    /**
     * @return array{metadata: array<string, mixed>, content: string}
     */
    private function parseFrontMatter(string $rawContent): array
    {
        if (! preg_match('/\A---\r?\n(?<frontmatter>.*?)\r?\n---\r?\n(?<content>.*)\z/s', $rawContent, $matches)) {
            return [
                'metadata' => [],
                'content' => $rawContent,
            ];
        }

        $metadata = [];

        foreach (preg_split('/\r?\n/', (string) $matches['frontmatter']) as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            [$key, $value] = array_pad(explode(':', $line, 2), 2, null);

            if ($value === null) {
                continue;
            }

            $key = trim((string) $key);
            $value = trim((string) $value);

            if ($key === '') {
                continue;
            }

            $metadata[$key] = $this->parseFrontMatterValue($value);
        }

        return [
            'metadata' => $metadata,
            'content' => (string) $matches['content'],
        ];
    }

    /**
     * @return string|bool|int
     */
    private function parseFrontMatterValue(string $value)
    {
        if ($value === 'true') {
            return true;
        }

        if ($value === 'false') {
            return false;
        }

        if (preg_match('/^-?\d+$/', $value)) {
            return (int) $value;
        }

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            return substr($value, 1, -1);
        }

        return $value;
    }

    private function buildUniqueSlug(Mod $mod, string $title, ?string $ignorePageId = null): string
    {
        $baseSlug = Str::slug($title);
        $slugRoot = $baseSlug !== '' ? $baseSlug : 'page';
        $slug = $slugRoot;
        $counter = 1;

        while (Page::where('mod_id', $mod->id)
            ->where('slug', $slug)
            ->when($ignorePageId, fn ($query) => $query->where('id', '!=', $ignorePageId))
            ->exists()) {
            $slug = $slugRoot.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    private function githubClient()
    {
        return Http::timeout(30)
            ->acceptJson()
            ->withHeaders([
                'User-Agent' => 'wiki-mod-sync',
                'X-GitHub-Api-Version' => '2022-11-28',
            ]);
    }
}
