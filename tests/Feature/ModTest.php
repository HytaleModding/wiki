<?php

namespace Tests\Feature;

use App\Models\Mod;
use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ModTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_authenticated_user_can_view_mods_index()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('mods.index'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Mods/Index'));
    }

    public function test_guest_cannot_view_mods_index()
    {
        $response = $this->get(route('mods.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_create_mod()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $modData = [
            'name' => 'Test Mod',
            'description' => 'A test mod description',
            'visibility' => 'public',
            'storage_driver' => 'local',
        ];

        $response = $this->post(route('mods.store'), $modData);

        $mod = Mod::where('name', 'Test Mod')->first();
        $this->assertNotNull($mod);
        $this->assertEquals($user->id, $mod->owner_id);
        $this->assertEquals('test-mod', $mod->slug);

        $response->assertRedirect(route('mods.show', $mod));
    }

    public function test_unverified_user_cannot_create_mod()
    {
        $user = User::factory()->unverified()->create();
        $this->actingAs($user);

        $modData = [
            'name' => 'Test Mod',
            'description' => 'A test mod description',
            'visibility' => 'public',
            'storage_driver' => 'local',
        ];

        $response = $this->post(route('mods.store'), $modData);
        $response->assertRedirect(route('verification.notice'));

        $this->assertDatabaseMissing('mods', ['name' => 'Test Mod']);
    }

    public function test_mod_creation_requires_name()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('mods.store'), [
            'description' => 'A test mod description',
            'visibility' => 'public',
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_mod_creation_validates_visibility()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('mods.store'), [
            'name' => 'Test Mod',
            'description' => 'A test mod description',
            'visibility' => 'invalid',
        ]);

        $response->assertSessionHasErrors('visibility');
    }

    public function test_user_can_view_their_own_mod()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $response = $this->get(route('mods.show', $mod));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Mods/Show'));
    }

    public function test_user_can_view_public_mod()
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $mod = Mod::factory()->public()->create(['owner_id' => $owner->id]);
        $this->actingAs($viewer);

        $response = $this->get(route('mods.show', $mod));
        $response->assertOk();
    }

    public function test_user_cannot_view_private_mod_they_dont_have_access_to()
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $mod = Mod::factory()->private()->create(['owner_id' => $owner->id]);
        $this->actingAs($viewer);

        $response = $this->get(route('mods.show', $mod));
        $response->assertForbidden();
    }

    public function test_collaborator_can_view_private_mod()
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $mod = Mod::factory()->private()->create(['owner_id' => $owner->id]);

        // Add collaborator
        $mod->collaborators()->attach($collaborator->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($collaborator);

        $response = $this->get(route('mods.show', $mod));
        $response->assertOk();
    }

    public function test_owner_can_update_mod()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $updateData = [
            'name' => 'Updated Mod Name',
            'description' => 'Updated description',
            'visibility' => 'private',
            'storage_driver' => 'local', // Add required field
        ];

        $response = $this->patch(route('mods.update', $mod), $updateData);

        $mod->refresh();
        $this->assertEquals('Updated Mod Name', $mod->name);
        $this->assertEquals('private', $mod->visibility);

        $response->assertRedirect(route('mods.show', $mod));
    }

    public function test_non_owner_cannot_update_mod()
    {
        $owner = User::factory()->create();
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $this->actingAs($user);

        $response = $this->patch(route('mods.update', $mod), [
            'name' => 'Updated Name',
        ]);

        $response->assertForbidden();
    }

    public function test_owner_can_delete_mod()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $response = $this->delete(route('mods.destroy', $mod));

        $this->assertDatabaseMissing($mod);
        $response->assertRedirect(route('mods.index'));
    }

    public function test_non_owner_cannot_delete_mod()
    {
        $owner = User::factory()->create();
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $this->actingAs($user);

        $response = $this->delete(route('mods.destroy', $mod));
        $response->assertForbidden();
    }

    public function test_guest_can_view_public_mod_page()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'custom_css' => '.prose h1 { color: #8b5cf6; }',
        ]);

        $response = $this->get("/mod/{$mod->slug}");
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Mod')
            ->where('mod.custom_css', '.prose h1 { color: #8b5cf6; }')
        );
    }

    public function test_public_mod_page_does_not_expose_unsafe_custom_css()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create([
            'owner_id' => $owner->id,
            'custom_css' => 'body { background-image: url(javascript:alert(1)); }',
        ]);

        $response = $this->get(route('public.mod', $mod));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Mod')
            ->where('mod.custom_css', null)
        );
    }

    public function test_public_mod_navigation_includes_nested_descendants()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->public()->create(['owner_id' => $owner->id]);

        $rootCategory = Page::factory()->category()->published()->create([
            'mod_id' => $mod->id,
            'parent_id' => null,
            'title' => 'Guides',
            'slug' => 'guides',
            'order_index' => 0,
        ]);

        $childCategory = Page::factory()->category()->published()->create([
            'mod_id' => $mod->id,
            'parent_id' => $rootCategory->id,
            'title' => 'Advanced',
            'slug' => 'advanced',
            'order_index' => 0,
        ]);

        Page::factory()->published()->create([
            'mod_id' => $mod->id,
            'parent_id' => $childCategory->id,
            'title' => 'Deep Topic',
            'slug' => 'deep-topic',
            'order_index' => 0,
        ]);

        $response = $this->get(route('public.mod', $mod));

        $response->assertOk();
        $response->assertInertia(fn (Assert $inertia) => $inertia
            ->component('Public/Mod')
            ->where('mod.root_pages.0.slug', 'guides')
            ->where('mod.root_pages.0.children.0.slug', 'advanced')
            ->where('mod.root_pages.0.children.0.children.0.slug', 'deep-topic')
        );
    }

    public function test_public_mod_page_does_not_expose_owner_email()
    {
        $owner = User::factory()->create(['email' => 'owner@example.com']);
        $mod = Mod::factory()->public()->create(['owner_id' => $owner->id]);

        $response = $this->get(route('public.mod', $mod));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Mod')
            ->missing('mod.owner.email')
        );
    }

    public function test_public_mod_list_does_not_expose_owner_email()
    {
        $owner = User::factory()->create(['email' => 'owner@example.com']);
        Mod::factory()->public()->create(['owner_id' => $owner->id]);

        $response = $this->get(route('public.mods'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Mods')
            ->missing('mods.data.0.owner.email')
        );
    }

    public function test_guest_cannot_view_private_mod_page()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->private()->create(['owner_id' => $owner->id]);

        $response = $this->get("/docs/{$mod->slug}");
        $response->assertNotFound(); // Private mods are not found in public routes
    }

    public function test_owner_can_preview_private_mod_page()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->private()->create(['owner_id' => $owner->id]);
        $this->actingAs($owner);

        $response = $this->get(route('public.mod', $mod));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Mod')
        );
    }

    public function test_mod_slug_is_generated_from_name()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('mods.store'), [
            'name' => 'My Awesome Mod Name',
            'description' => 'Description',
            'visibility' => 'public',
            'storage_driver' => 'local', // Add required field
        ]);

        $mod = Mod::where('name', 'My Awesome Mod Name')->first();
        $this->assertNotNull($mod);
        $this->assertEquals('my-awesome-mod-name', $mod->slug);
    }

    public function test_owner_can_update_mod_with_github_settings()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $response = $this->patch(route('mods.update', $mod), [
            'name' => $mod->name,
            'description' => $mod->description,
            'visibility' => $mod->visibility,
            'storage_driver' => $mod->storage_driver,
            'external_access' => true,
            'github_repository_url' => 'https://github.com/acme/docs-repo',
            'github_repository_path' => '/docs/guides/',
        ]);

        $response->assertRedirect(route('mods.show', $mod));

        $mod->refresh();
        $this->assertSame('https://github.com/acme/docs-repo', $mod->github_repository_url);
        $this->assertSame('docs/guides', $mod->github_repository_path);
    }

    public function test_owner_can_run_manual_github_sync_for_a_mod()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => 'https://github.com/acme/docs-repo',
            'github_repository_path' => '/docs/',
        ]);

        $this->actingAs($owner);

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
            ], 200),
            'https://raw.githubusercontent.com/acme/docs-repo/main/docs/README.md' => Http::response('# Welcome', 200),
        ]);

        $response = $this->from(route('mods.edit', $mod))
            ->post(route('mods.github-sync.run', $mod));

        $response->assertRedirect(route('mods.edit', $mod));
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('pages', [
            'mod_id' => $mod->id,
            'source_type' => 'github',
            'source_path' => 'README.md',
        ]);
    }

    public function test_manual_github_sync_requires_repository_url()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => null,
        ]);

        $this->actingAs($owner);

        $response = $this->from(route('mods.edit', $mod))
            ->post(route('mods.github-sync.run', $mod));

        $response->assertRedirect(route('mods.edit', $mod));
        $response->assertSessionHasErrors('github_repository_url');
    }

    public function test_non_owner_cannot_run_manual_github_sync()
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'github_repository_url' => 'https://github.com/acme/docs-repo',
        ]);

        $this->actingAs($otherUser);

        $response = $this->post(route('mods.github-sync.run', $mod));

        $response->assertForbidden();
    }

    public function test_owner_can_update_custom_css()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'custom_css' => null,
        ]);

        $this->actingAs($owner);

        $response = $this->patch(route('mods.css.update', $mod), [
            'custom_css' => '.prose h1 { color: red; }',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mods', [
            'id' => $mod->id,
            'custom_css' => '.prose h1 { color: red; }',
        ]);
    }

    public function test_non_owner_cannot_update_custom_css()
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'custom_css' => '.prose h1 { color: blue; }',
        ]);

        $this->actingAs($otherUser);

        $response = $this->patch(route('mods.css.update', $mod), [
            'custom_css' => '.prose h1 { color: red; }',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('mods', [
            'id' => $mod->id,
            'custom_css' => '.prose h1 { color: blue; }',
        ]);
    }

    public function test_owner_cannot_save_dangerous_custom_css_in_css_editor()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'custom_css' => '.prose h1 { color: blue; }',
        ]);

        $this->actingAs($owner);

        $response = $this->from(route('mods.css-editor', $mod))->patch(route('mods.css.update', $mod), [
            'custom_css' => '</style><script>alert(1)</script>@import url(https://evil.test/payload.css);',
        ]);

        $response->assertRedirect(route('mods.css-editor', $mod));
        $response->assertSessionHasErrors('custom_css');

        $this->assertDatabaseHas('mods', [
            'id' => $mod->id,
            'custom_css' => '.prose h1 { color: blue; }',
        ]);
    }

    public function test_owner_cannot_save_dangerous_custom_css_in_mod_settings()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'custom_css' => null,
        ]);

        $this->actingAs($owner);

        $response = $this->from(route('mods.edit', $mod))->patch(route('mods.update', $mod), [
            'name' => $mod->name,
            'description' => $mod->description,
            'visibility' => $mod->visibility,
            'storage_driver' => $mod->storage_driver,
            'custom_css' => 'body { background-image: url(javascript:alert(1)); }',
        ]);

        $response->assertRedirect(route('mods.edit', $mod));
        $response->assertSessionHasErrors('custom_css');

        $this->assertDatabaseHas('mods', [
            'id' => $mod->id,
            'custom_css' => null,
        ]);
    }

    public function test_mod_icon_is_uploaded_to_r2_on_create()
    {
        Storage::fake('r2');
        config(['filesystems.upload_disk' => 'r2']);

        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('mods.store'), [
            'name' => 'R2 Icon Mod',
            'description' => 'R2 icon upload test',
            'visibility' => 'public',
            'storage_driver' => 'local',
            'icon' => UploadedFile::fake()->image('icon.png', 128, 128),
        ]);

        $mod = Mod::where('name', 'R2 Icon Mod')->firstOrFail();

        $response->assertRedirect(route('mods.show', $mod));
        $this->assertNotNull($mod->icon_path);
        Storage::disk('r2')->assertExists($mod->icon_path);
    }

    public function test_updating_mod_icon_replaces_previous_r2_file()
    {
        Storage::fake('r2');
        config(['filesystems.upload_disk' => 'r2']);

        $owner = User::factory()->create();
        $oldPath = 'mods/icons/old-icon.png';
        Storage::disk('r2')->put($oldPath, 'old-icon-bytes');

        $mod = Mod::factory()->create([
            'owner_id' => $owner->id,
            'icon_url' => 'https://cdn.example.com/'.$oldPath,
            'icon_path' => $oldPath,
        ]);

        $this->actingAs($owner);

        $response = $this->patch(route('mods.update', $mod), [
            'name' => $mod->name,
            'description' => $mod->description,
            'visibility' => $mod->visibility,
            'storage_driver' => $mod->storage_driver,
            'icon' => UploadedFile::fake()->image('new-icon.png', 128, 128),
        ]);

        $response->assertRedirect(route('mods.show', $mod));
        Storage::disk('r2')->assertMissing($oldPath);

        $mod->refresh();
        $this->assertNotNull($mod->icon_path);
        Storage::disk('r2')->assertExists($mod->icon_path);
    }
}
