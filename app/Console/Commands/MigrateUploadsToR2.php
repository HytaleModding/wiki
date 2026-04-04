<?php

namespace App\Console\Commands;

use App\Models\File;
use App\Models\Mod;
use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateUploadsToR2 extends Command
{
    protected $signature = 'uploads:migrate-to-r2
                            {--dry-run : Show what would be migrated without writing files or DB updates}
                            {--delete-source : Delete local source files after a successful copy}
                            {--chunk=100 : Number of records to process per chunk}';

    protected $description = 'Migrate local uploaded assets (files, avatars, icons) from public storage to Cloudflare R2';

    public function handle(FileUploadService $fileUploadService): int
    {
        $uploadDisk = $fileUploadService->uploadDisk();
        $targetStorageDriver = $fileUploadService->defaultStorageDriver();
        $dryRun = (bool) $this->option('dry-run');
        $deleteSource = (bool) $this->option('delete-source');
        $chunkSize = max((int) $this->option('chunk'), 1);

        if ($uploadDisk === 'public') {
            $this->error('FILESYSTEM_UPLOAD_DISK is set to public. Set it to r2 before running this command.');

            return self::FAILURE;
        }

        $this->info('Target disk: '.$uploadDisk);
        $this->info('Dry run: '.($dryRun ? 'yes' : 'no'));
        $this->newLine();

        $stats = [
            'files_migrated' => 0,
            'files_skipped' => 0,
            'avatars_migrated' => 0,
            'avatars_skipped' => 0,
            'icons_migrated' => 0,
            'icons_skipped' => 0,
        ];

        File::query()
            ->where('storage_driver', 'local')
            ->whereNotNull('path')
            ->chunk($chunkSize, function ($files) use (&$stats, $dryRun, $deleteSource, $uploadDisk, $targetStorageDriver, $fileUploadService) {
                foreach ($files as $file) {
                    $path = (string) $file->path;

                    if (! $this->copyPath($path, $uploadDisk, $dryRun, $deleteSource)) {
                        $stats['files_skipped']++;
                        continue;
                    }

                    if (! $dryRun) {
                        $file->forceFill([
                            'storage_driver' => $targetStorageDriver,
                            'url' => $fileUploadService->url($path, $targetStorageDriver),
                        ])->save();
                    }

                    $stats['files_migrated']++;
                }
            });

        User::query()
            ->whereNotNull('avatar_url')
            ->chunk($chunkSize, function ($users) use (&$stats, $dryRun, $deleteSource, $uploadDisk, $fileUploadService) {
                foreach ($users as $user) {
                    if (str_contains((string) $user->avatar_url, 'ui-avatars.com')) {
                        continue;
                    }

                    $path = $user->avatar_path ?: $this->pathFromPublicUrl($user->avatar_url);

                    if (blank($path) || ! $this->copyPath($path, $uploadDisk, $dryRun, $deleteSource)) {
                        $stats['avatars_skipped']++;
                        continue;
                    }

                    if (! $dryRun) {
                        $user->forceFill([
                            'avatar_path' => $path,
                            'avatar_url' => Storage::disk($uploadDisk)->url($path),
                        ])->save();
                    }

                    $stats['avatars_migrated']++;
                }
            });

        Mod::query()
            ->whereNotNull('icon_url')
            ->chunk($chunkSize, function ($mods) use (&$stats, $dryRun, $deleteSource, $uploadDisk) {
                foreach ($mods as $mod) {
                    $path = $mod->icon_path ?: $this->pathFromPublicUrl($mod->icon_url);

                    if (blank($path) || ! $this->copyPath($path, $uploadDisk, $dryRun, $deleteSource)) {
                        $stats['icons_skipped']++;
                        continue;
                    }

                    if (! $dryRun) {
                        $mod->forceFill([
                            'icon_path' => $path,
                            'icon_url' => Storage::disk($uploadDisk)->url($path),
                        ])->save();
                    }

                    $stats['icons_migrated']++;
                }
            });

        $this->table(
            ['Category', 'Migrated', 'Skipped'],
            [
                ['Files', $stats['files_migrated'], $stats['files_skipped']],
                ['Avatars', $stats['avatars_migrated'], $stats['avatars_skipped']],
                ['Mod Icons', $stats['icons_migrated'], $stats['icons_skipped']],
            ]
        );

        return self::SUCCESS;
    }

    private function copyPath(string $path, string $targetDisk, bool $dryRun, bool $deleteSource): bool
    {
        if (! Storage::disk('public')->exists($path)) {
            $this->warn("Missing local file: {$path}");

            return false;
        }

        if ($dryRun) {
            return true;
        }

        Storage::disk($targetDisk)->put($path, Storage::disk('public')->get($path));

        if ($deleteSource) {
            Storage::disk('public')->delete($path);
        }

        return true;
    }

    private function pathFromPublicUrl(?string $url): ?string
    {
        if (blank($url)) {
            return null;
        }

        $path = (string) parse_url($url, PHP_URL_PATH);

        if (! str_starts_with($path, '/storage/')) {
            return null;
        }

        return ltrim(substr($path, strlen('/storage/')), '/');
    }
}

