<?php

namespace Tests\Feature;

use App\Models\Mod;
use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SyncGithubMarkdownCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_syncs_markdown_files_from_github_into_pages(): void
    {
        $owner = User::factory()->create();

        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Docs Mod',
            'slug' => 'docs-mod',
            'github_repository_url' => 'https://github.com/acme/docs-repo',
            'github_repository_path' => '/docs/',
        ]);

        Http::fake([
            'https://api.github.com/repos/acme/docs-repo' => Http::response([
                'default_branch' => 'main',
            ], 200),
            'https://api.github.com/repos/acme/docs-repo/contents/docs?ref=main' => Http::response([
                [
                    'type' => 'file',
                    'name' => 'README.md',
                    'path' => 'docs/README.md',
                    'sha' => 'sha-root-readme',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/README.md',
                ],
                [
                    'type' => 'file',
                    'name' => 'getting-started.md',
                    'path' => 'docs/getting-started.md',
                    'sha' => 'sha-getting-started',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/getting-started.md',
                ],
                [
                    'type' => 'dir',
                    'name' => 'guide',
                    'path' => 'docs/guide',
                ],
            ], 200),
            'https://api.github.com/repos/acme/docs-repo/contents/docs/guide?ref=main' => Http::response([
                [
                    'type' => 'file',
                    'name' => 'README.md',
                    'path' => 'docs/guide/README.md',
                    'sha' => 'sha-guide-readme',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/README.md',
                ],
                [
                    'type' => 'file',
                    'name' => 'install.md',
                    'path' => 'docs/guide/install.md',
                    'sha' => 'sha-install',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/install.md',
                ],
                [
                    'type' => 'file',
                    'name' => 'notes.txt',
                    'path' => 'docs/guide/notes.txt',
                    'sha' => 'sha-notes',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/notes.txt',
                ],
            ], 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/README.md' => Http::response("# Welcome\n\nRoot docs", 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/getting-started.md' => Http::response('# Getting Started', 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/README.md' => Http::response('# Guide', 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/install.md' => Http::response("---\ntitle: Installation Guide\norder: 7\npublished: false\n---\n# Install", 200),
        ]);

        $this->artisan('mods:sync-github-markdown')->assertSuccessful();

        $this->assertDatabaseCount('pages', 4);
        $this->assertDatabaseHas('pages', [
            'mod_id' => $mod->id,
            'source_type' => 'github',
            'source_path' => 'README.md',
            'is_index' => true,
            'title' => 'Home',
        ]);

        $guideReadme = Page::where('mod_id', $mod->id)
            ->where('source_path', 'guide/README.md')
            ->firstOrFail();

        $installPage = Page::where('mod_id', $mod->id)
            ->where('source_path', 'guide/install.md')
            ->firstOrFail();

        $this->assertSame('Installation Guide', $installPage->title);
        $this->assertSame(7, $installPage->order_index);
        $this->assertFalse($installPage->published);
        $this->assertSame($guideReadme->id, $installPage->parent_id);
    }

    public function test_it_updates_existing_synced_pages_without_creating_duplicates(): void
    {
        $owner = User::factory()->create();

        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Docs Mod',
            'slug' => 'docs-mod',
            'github_repository_url' => 'https://github.com/acme/docs-repo',
            'github_repository_path' => '/docs/',
        ]);

        $this->fakeRepoContents('# Install v1', 'sha-install-v1');
        $this->artisan('mods:sync-github-markdown')->assertSuccessful();

        $this->fakeRepoContents('# Install v2', 'sha-install-v2');
        $this->artisan('mods:sync-github-markdown')->assertSuccessful();

        $this->assertDatabaseCount('pages', 4);
        $this->assertDatabaseHas('pages', [
            'mod_id' => $mod->id,
            'source_path' => 'guide/install.md',
        ]);
    }

    public function test_it_deletes_non_github_pages_for_github_managed_mods(): void
    {
        $owner = User::factory()->create();

        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => 'https://github.com/acme/docs-repo',
            'github_repository_path' => '/docs/',
        ]);

        $legacyPage = Page::factory()->create([
            'mod_id' => $mod->id,
            'title' => 'Legacy Manual Page',
            'source_type' => null,
        ]);

        $this->fakeRepoContents('# Install');

        $this->artisan('mods:sync-github-markdown')->assertSuccessful();

        $legacyPage->refresh();
        $this->assertNotNull($legacyPage->deleted_at);

        $this->assertDatabaseHas('pages', [
            'mod_id' => $mod->id,
            'source_type' => 'github',
            'source_path' => 'README.md',
        ]);
    }

    public function test_dry_run_does_not_delete_non_github_pages(): void
    {
        $owner = User::factory()->create();

        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => 'https://github.com/acme/docs-repo',
            'github_repository_path' => '/docs/',
        ]);

        $legacyPage = Page::factory()->create([
            'mod_id' => $mod->id,
            'title' => 'Legacy Manual Page',
            'source_type' => null,
        ]);

        $this->fakeRepoContents('# Install');

        $this->artisan('mods:sync-github-markdown', ['--dry-run' => true])->assertSuccessful();

        $legacyPage->refresh();
        $this->assertNull($legacyPage->deleted_at);
        $this->assertDatabaseMissing('pages', [
            'mod_id' => $mod->id,
            'source_type' => 'github',
        ]);
    }

    public function test_it_prunes_removed_github_pages_by_default(): void
    {
        $owner = User::factory()->create();

        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => 'https://github.com/acme/docs-repo',
            'github_repository_path' => '/docs/',
        ]);

        $this->fakeRepoContents('# Install', 'sha-install', includeGettingStarted: true);
        $this->artisan('mods:sync-github-markdown')->assertSuccessful();

        $stalePage = Page::where('mod_id', $mod->id)
            ->where('source_path', 'getting-started.md')
            ->firstOrFail();

        $this->fakeRepoContents('# Install', 'sha-install', includeGettingStarted: false);
        $this->artisan('mods:sync-github-markdown')->assertSuccessful();

        $stalePage->refresh();

        $this->assertNull($stalePage->deleted_at);
    }

    public function test_it_reuses_slug_after_pruning_stale_page_before_upsert(): void
    {
        $owner = User::factory()->create();

        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => 'https://github.com/acme/docs-repo',
            'github_repository_path' => '/docs/',
        ]);

        Page::factory()->create([
            'mod_id' => $mod->id,
            'source_type' => 'github',
            'source_path' => 'install.md',
            'kind' => Page::KIND_PAGE,
            'title' => 'Installation Guide',
            'slug' => 'installation-guide',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        $this->fakeRepoContentsWithInstallInGuideFolder();
        $this->artisan('mods:sync-github-markdown')->assertSuccessful();

        $movedInstallPage = Page::where('mod_id', $mod->id)
            ->where('source_path', 'guide/install.md')
            ->firstOrFail();

        $this->assertSame('installation-guide', $movedInstallPage->slug);
    }

    private function fakeRepoContents(string $installContent, string $installSha = 'sha-install', bool $includeGettingStarted = true): void
    {
        $rootListing = [
            [
                'type' => 'file',
                'name' => 'README.md',
                'path' => 'docs/README.md',
                'sha' => 'sha-root-readme',
                'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/README.md',
            ],
            [
                'type' => 'dir',
                'name' => 'guide',
                'path' => 'docs/guide',
            ],
        ];

        if ($includeGettingStarted) {
            array_splice($rootListing, 1, 0, [[
                'type' => 'file',
                'name' => 'getting-started.md',
                'path' => 'docs/getting-started.md',
                'sha' => 'sha-getting-started',
                'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/getting-started.md',
            ]]);
        }

        Http::fake([
            'https://api.github.com/repos/acme/docs-repo' => Http::response([
                'default_branch' => 'main',
            ], 200),
            'https://api.github.com/repos/acme/docs-repo/contents/docs?ref=main' => Http::response($rootListing, 200),
            'https://api.github.com/repos/acme/docs-repo/contents/docs/guide?ref=main' => Http::response([
                [
                    'type' => 'file',
                    'name' => 'README.md',
                    'path' => 'docs/guide/README.md',
                    'sha' => 'sha-guide-readme',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/README.md',
                ],
                [
                    'type' => 'file',
                    'name' => 'install.md',
                    'path' => 'docs/guide/install.md',
                    'sha' => $installSha,
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/install.md',
                ],
            ], 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/README.md' => Http::response("# Welcome\n\nRoot docs", 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/getting-started.md' => Http::response('# Getting Started', 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/README.md' => Http::response('# Guide', 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/install.md' => Http::response($installContent, 200),
        ]);
    }


    private function fakeRepoContentsWithInstallInGuideFolder(): void
    {
        Http::fake([
            'https://api.github.com/repos/acme/docs-repo' => Http::response([
                'default_branch' => 'main',
            ], 200),
            'https://api.github.com/repos/acme/docs-repo/contents/docs?ref=main' => Http::response([
                [
                    'type' => 'file',
                    'name' => 'README.md',
                    'path' => 'docs/README.md',
                    'sha' => 'sha-root-readme',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/README.md',
                ],
                [
                    'type' => 'dir',
                    'name' => 'guide',
                    'path' => 'docs/guide',
                ],
            ], 200),
            'https://api.github.com/repos/acme/docs-repo/contents/docs/guide?ref=main' => Http::response([
                [
                    'type' => 'file',
                    'name' => 'README.md',
                    'path' => 'docs/guide/README.md',
                    'sha' => 'sha-guide-readme',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/README.md',
                ],
                [
                    'type' => 'file',
                    'name' => 'install.md',
                    'path' => 'docs/guide/install.md',
                    'sha' => 'sha-install-guide',
                    'download_url' => 'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/install.md',
                ],
            ], 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/README.md' => Http::response('# Welcome', 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/README.md' => Http::response('# Guide', 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/guide/install.md' => Http::response("---\ntitle: Installation Guide\n---\n# Install", 200),
        ]);
    }
}
