<?php

namespace Tests\Feature;

use App\Models\Mod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
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

        $this->assertSoftDeleted($mod);
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
        $mod = Mod::factory()->public()->create(['owner_id' => $owner->id]);

        $response = $this->get("/docs/{$mod->slug}");
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Public/Mod'));
    }

    public function test_guest_cannot_view_private_mod_page()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->private()->create(['owner_id' => $owner->id]);

        $response = $this->get("/docs/{$mod->slug}");
        $response->assertNotFound(); // Private mods are not found in public routes
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
}
