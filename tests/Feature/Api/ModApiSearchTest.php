<?php

namespace Tests\Feature\Api;

use App\Models\ApiKey;
use App\Models\Mod;
use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModApiSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_endpoint_requires_api_key()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'external_access' => true,
        ]);

        $response = $this->getJson("/api/mods/{$mod->slug}/pages/search?query=beast");

        $response->assertStatus(401);
    }

    public function test_search_endpoint_requires_search_scope()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'external_access' => true,
        ]);
        $apiKey = $this->createApiKey($owner, ['read:mods']);

        $response = $this
            ->withHeader('X-API-Key', $apiKey->key)
            ->getJson("/api/mods/{$mod->slug}/pages/search?query=beast");

        $response
            ->assertStatus(403)
            ->assertJsonPath('required_scope', 'read:mods:search');
    }

    public function test_search_endpoint_returns_ranked_matches_for_published_pages()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'external_access' => true,
        ]);

        $exactTitlePage = Page::factory()->published()->create([
            'mod_id' => $mod->id,
            'title' => 'Beast Taming Reference',
            'slug' => 'beast-taming-reference',
            'content' => 'Reference data for taming creatures.',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        $contentMatchPage = Page::factory()->published()->create([
            'mod_id' => $mod->id,
            'title' => 'Advanced Handling',
            'slug' => 'advanced-handling',
            'content' => 'This page includes beast taming techniques and notes.',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        $draftPage = Page::factory()->draft()->create([
            'mod_id' => $mod->id,
            'title' => 'Draft Beast Notes',
            'slug' => 'draft-beast-notes',
            'content' => 'beast taming draft notes',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        $apiKey = $this->createApiKey($owner, ['read:mods', 'read:mods:search']);

        $response = $this
            ->withHeader('X-API-Key', $apiKey->key)
            ->getJson("/api/mods/{$mod->slug}/pages/search?query=beast%20taming");

        $response->assertOk();
        $response->assertJsonPath('mod.slug', $mod->slug);
        $response->assertJsonPath('query', 'beast taming');
        $response->assertJsonCount(2, 'results');
        $response->assertJsonPath('results.0.slug', $exactTitlePage->slug);
        $response->assertJsonPath('results.0.url', route('public.page', [
            'mod' => $mod->slug,
            'page' => $exactTitlePage->slug,
        ]));
        $response->assertJsonFragment(['slug' => $contentMatchPage->slug]);
        $response->assertJsonMissing(['slug' => $draftPage->slug]);
    }

    public function test_search_endpoint_accepts_mod_id_and_honors_limit()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'external_access' => true,
        ]);

        Page::factory()->published()->create([
            'mod_id' => $mod->id,
            'title' => 'Beast One',
            'slug' => 'beast-one',
            'content' => 'beast entry one',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        Page::factory()->published()->create([
            'mod_id' => $mod->id,
            'title' => 'Beast Two',
            'slug' => 'beast-two',
            'content' => 'beast entry two',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        Page::factory()->published()->create([
            'mod_id' => $mod->id,
            'title' => 'Beast Three',
            'slug' => 'beast-three',
            'content' => 'beast entry three',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        $apiKey = $this->createApiKey($owner, ['read:mods', 'read:mods:search']);

        $response = $this
            ->withHeader('X-API-Key', $apiKey->key)
            ->getJson("/api/mods/{$mod->id}/pages/search?query=beast&limit=2");

        $response->assertOk();
        $response->assertJsonCount(2, 'results');
    }

    public function test_search_endpoint_rejects_mod_with_external_access_disabled()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'external_access' => false,
        ]);

        Page::factory()->published()->create([
            'mod_id' => $mod->id,
            'title' => 'Beast Taming Reference',
            'slug' => 'beast-taming-reference',
            'content' => 'beast taming reference',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        $apiKey = $this->createApiKey($owner, ['read:mods', 'read:mods:search']);

        $response = $this
            ->withHeader('X-API-Key', $apiKey->key)
            ->getJson("/api/mods/{$mod->slug}/pages/search?query=beast");

        $response
            ->assertStatus(403)
            ->assertJsonPath('error', 'Access denied. You do not have permission to view this mod.');
    }

    public function test_search_endpoint_rejects_query_with_insufficient_searchable_length_after_normalization()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'external_access' => true,
        ]);

        $apiKey = $this->createApiKey($owner, ['read:mods', 'read:mods:search']);

        $response = $this
            ->withHeader('X-API-Key', $apiKey->key)
            ->getJson("/api/mods/{$mod->slug}/pages/search?query=%25a");

        $response
            ->assertStatus(422)
            ->assertJsonPath('errors.query.0', 'Query must include at least two searchable characters.');
    }

    public function test_page_slug_search_still_resolves_get_page_content_route()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'external_access' => true,
        ]);

        Page::factory()->published()->create([
            'mod_id' => $mod->id,
            'title' => 'Search',
            'slug' => 'search',
            'content' => 'Content for a page that uses the search slug.',
            'created_by' => $owner->id,
            'updated_by' => $owner->id,
        ]);

        $apiKey = $this->createApiKey($owner, ['read:mods', 'read:mods:getPageContent']);

        $response = $this
            ->withHeader('X-API-Key', $apiKey->key)
            ->getJson("/api/mods/{$mod->id}/search");

        $response
            ->assertOk()
            ->assertJsonPath('page.slug', 'search');
    }

    private function createApiKey(User $user, array $scopes): ApiKey
    {
        return $user->apiKeys()->create([
            'name' => 'Test API Key',
            'key' => ApiKey::generate(),
            'scopes' => $scopes,
            'rate_limit' => 60,
        ]);
    }
}
