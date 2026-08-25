<?php

namespace App\Jobs;

use App\Models\Mod;
use App\Services\GitHubMarkdownSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncGithubMod implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public string $modId)
    {
    }

    public function handle(GitHubMarkdownSyncService $syncService): void
    {
        $mod = Mod::find($this->modId);

        if ($mod && filled($mod->github_repository_url)) {
            $syncService->syncMod($mod);
        }
    }
}
