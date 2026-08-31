<?php

namespace App\Jobs;

use App\Models\AdminAuditLog;
use App\Models\Mod;
use App\Services\GitHubMarkdownSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncGithubMod implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public string $modId, public ?int $initiatedBy = null)
    {
    }

    public function handle(GitHubMarkdownSyncService $syncService): void
    {
        $mod = Mod::find($this->modId);

        if ($mod && filled($mod->github_repository_url)) {
            $result = $syncService->syncMod($mod);
            AdminAuditLog::create([
                'actor_id' => $this->initiatedBy,
                'subject_type' => 'mod',
                'subject_id' => $mod->id,
                'action' => 'mod.github_sync_completed',
                'description' => "GitHub sync completed for {$mod->name}.",
                'metadata' => $result,
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        $mod = Mod::find($this->modId);
        AdminAuditLog::create([
            'actor_id' => $this->initiatedBy,
            'subject_type' => 'mod',
            'subject_id' => $this->modId,
            'action' => 'mod.github_sync_failed',
            'description' => 'GitHub sync failed'.($mod ? " for {$mod->name}" : '').'.',
            'metadata' => ['error' => $exception->getMessage()],
        ]);
    }
}
