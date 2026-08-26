<?php

namespace Tests\Feature;

use App\Jobs\SyncGithubMod;
use App\Models\GitHubConnection;
use App\Models\Mod;
use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GitHubWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_signed_push_webhook_queues_sync_for_matching_repository(): void
    {
        config()->set('services.github.webhook_secret', 'test-secret');
        Bus::fake();
        $owner = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => 'https://github.com/acme/docs-repo/',
        ]);
        $payload = json_encode(['repository' => ['html_url' => 'https://github.com/acme/docs-repo']], JSON_THROW_ON_ERROR);

        $response = $this->call('POST', route('webhooks.github'), [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_GITHUB_EVENT' => 'push',
            'HTTP_X_HUB_SIGNATURE_256' => 'sha256='.hash_hmac('sha256', $payload, 'test-secret'),
        ], $payload);

        $response->assertAccepted();
        Bus::assertDispatched(SyncGithubMod::class, fn (SyncGithubMod $job) => $job->modId === $mod->id);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        config()->set('services.github.webhook_secret', 'test-secret');

        $this->postJson(route('webhooks.github'), ['repository' => ['html_url' => 'https://github.com/acme/docs-repo']], [
            'X-GitHub-Event' => 'push',
            'X-Hub-Signature-256' => 'sha256=invalid',
        ])->assertUnauthorized();
    }

    public function test_pages_can_store_large_markdown_documents(): void
    {
        $page = Page::factory()->create(['content' => str_repeat('A', 100_000)]);

        $this->assertSame(100_000, strlen((string) Page::findOrFail($page->id)->content));
    }

    public function test_connected_user_can_list_and_select_an_accessible_github_repository(): void
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        GitHubConnection::create([
            'user_id' => $owner->id,
            'github_user_id' => 123,
            'github_login' => 'octocat',
            'access_token' => 'user-token',
        ]);
        Http::fake([
            'https://api.github.com/user/installations/456/repositories*' => Http::response(['repositories' => [[
                'id' => 789,
                'full_name' => 'octocat/docs',
                'html_url' => 'https://github.com/octocat/docs',
                'private' => true,
                'default_branch' => 'main',
            ]]]),
            'https://api.github.com/user/installations*' => Http::response(['installations' => [['id' => 456]]]),
        ]);

        $this->actingAs($owner)
            ->getJson(route('mods.github.repositories', $mod))
            ->assertOk()
            ->assertJsonPath('repositories.0.full_name', 'octocat/docs');

        $this->actingAs($owner)
            ->postJson(route('mods.github.repository.select', $mod), ['repository_id' => 789])
            ->assertOk()
            ->assertJsonPath('repository.html_url', 'https://github.com/octocat/docs');

        $this->assertDatabaseHas('mods', [
            'id' => $mod->id,
            'github_repository_url' => 'https://github.com/octocat/docs',
        ]);
    }

    public function test_disconnect_removes_github_management_from_the_mod(): void
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => 'https://github.com/octocat/docs',
            'github_repository_path' => 'docs',
        ]);
        $connection = GitHubConnection::create([
            'user_id' => $owner->id,
            'github_user_id' => 123,
            'github_login' => 'octocat',
            'access_token' => 'user-token',
        ]);

        $this->actingAs($owner)
            ->deleteJson(route('mods.github.disconnect', $mod))
            ->assertNoContent();

        $this->assertDatabaseHas('mods', [
            'id' => $mod->id,
            'github_repository_url' => null,
            'github_repository_path' => null,
        ]);
        $this->assertDatabaseMissing('github_connections', ['id' => $connection->id]);
    }
}
