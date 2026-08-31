<?php

namespace Tests\Feature;

use App\Jobs\SyncGithubMod;
use App\Models\AdminAuditLog;
use App\Models\Mod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admins_cannot_access_platform_admin_routes(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.index'))
            ->assertForbidden();
    }

    public function test_platform_admin_can_open_each_admin_workspace(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->get(route('admin.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Overview'));
        $this->actingAs($admin)->get(route('admin.users.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Users'));
        $this->actingAs($admin)->get(route('admin.mods.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Mods'));
        $this->actingAs($admin)->get(route('admin.api-keys.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/ApiKeys'));
        $this->actingAs($admin)->get(route('admin.audit.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/AuditLog'));
    }

    public function test_admin_can_suspend_a_mod_and_the_action_is_audited(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $mod = Mod::factory()->create();

        $this->actingAs($admin)->patch(route('admin.mods.suspension', $mod))->assertRedirect();

        $this->assertTrue($mod->fresh()->is_suspended);
        $this->assertDatabaseHas('admin_audit_logs', ['actor_id' => $admin->id, 'subject_id' => $mod->id, 'action' => 'mod.suspended']);
    }

    public function test_admin_can_queue_a_manual_github_sync(): void
    {
        Queue::fake();
        $admin = User::factory()->create(['is_admin' => true]);
        $mod = Mod::factory()->create(['github_repository_url' => 'https://github.com/example/docs']);

        $this->actingAs($admin)->post(route('admin.mods.sync', $mod))->assertRedirect();

        Queue::assertPushed(SyncGithubMod::class, fn (SyncGithubMod $job) => $job->modId === $mod->id && $job->initiatedBy === $admin->id);
        $this->assertTrue(AdminAuditLog::where('action', 'mod.github_sync_queued')->where('subject_id', $mod->id)->exists());
    }

    public function test_admin_cannot_suspend_or_demote_themselves(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->patch(route('admin.users.suspension', $admin))->assertStatus(422);
        $this->actingAs($admin)->patch(route('admin.users.admin', $admin))->assertStatus(422);
    }
}
