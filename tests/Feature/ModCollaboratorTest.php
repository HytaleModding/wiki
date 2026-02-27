<?php

namespace Tests\Feature;

use App\Mail\CollaboratorInvitation;
use App\Models\Mod;
use App\Models\ModInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ModCollaboratorTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_owner_can_view_collaborators_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $response = $this->get(route('mods.collaborators.index', $mod));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Mods/ManageCollaborators'));
    }

    public function test_admin_can_view_collaborators_page()
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($admin->id, [
            'role' => 'admin',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($admin);

        $response = $this->get(route('mods.collaborators.index', $mod));
        $response->assertOk();
    }

    public function test_editor_cannot_view_collaborators_page()
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($editor->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($editor);

        $response = $this->get(route('mods.collaborators.index', $mod));
        $response->assertForbidden();
    }

    public function test_owner_can_add_collaborator_by_email()
    {
        Mail::fake();

        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $this->actingAs($owner);

        $response = $this->post(route('mods.collaborators.store', $mod), [
            'username' => $collaborator->username,
            'role' => 'editor',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('mod_users', [
            'mod_id' => $mod->id,
            'user_id' => $collaborator->id,
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        Mail::assertSent(CollaboratorInvitation::class);
    }

    public function test_owner_can_add_collaborator_by_username()
    {
        Mail::fake();

        $owner = User::factory()->create();
        $collaborator = User::factory()->create(['username' => 'testuser']);
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $this->actingAs($owner);

        $response = $this->post(route('mods.collaborators.store', $mod), [
            'username' => 'testuser',
            'role' => 'viewer',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('mod_users', [
            'mod_id' => $mod->id,
            'user_id' => $collaborator->id,
            'role' => 'viewer',
        ]);
    }

    public function test_cannot_add_nonexistent_user()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $this->actingAs($owner);

        $response = $this->post(route('mods.collaborators.store', $mod), [
            'username' => 'nonexistent@example.com',
            'role' => 'editor',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_cannot_add_owner_as_collaborator()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $this->actingAs($owner);

        $response = $this->post(route('mods.collaborators.store', $mod), [
            'username' => $owner->email,
            'role' => 'editor',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_cannot_add_existing_collaborator()
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($collaborator->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($owner);

        $response = $this->post(route('mods.collaborators.store', $mod), [
            'username' => $collaborator->email,
            'role' => 'admin',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_role_validation()
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $this->actingAs($owner);

        $response = $this->post(route('mods.collaborators.store', $mod), [
            'username' => $collaborator->email,
            'role' => 'invalid_role',
        ]);

        $response->assertSessionHasErrors('role');
    }

    public function test_owner_can_update_collaborator_role()
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($collaborator->id, [
            'role' => 'viewer',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($owner);

        $response = $this->patch(route('mods.collaborators.update', [$mod, $collaborator]), [
            'role' => 'editor',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('mod_users', [
            'mod_id' => $mod->id,
            'user_id' => $collaborator->id,
            'role' => 'editor',
        ]);
    }

    public function test_admin_can_update_collaborator_role_but_not_to_admin()
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $editor = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($admin->id, [
            'role' => 'admin',
            'invited_by' => $owner->id,
        ]);
        $mod->collaborators()->attach($editor->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($admin);

        // Admin should be able to downgrade editor to viewer
        $response = $this->patch(route('mods.collaborators.update', [$mod, $editor]), [
            'role' => 'viewer',
        ]);
        $response->assertRedirect();

        // But admin should not be able to promote to admin
        $response = $this->patch(route('mods.collaborators.update', [$mod, $editor]), [
            'role' => 'admin',
        ]);
        $response->assertForbidden();
    }

    public function test_editor_cannot_update_collaborator_role()
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create();
        $viewer = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($editor->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);
        $mod->collaborators()->attach($viewer->id, [
            'role' => 'viewer',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($editor);

        $response = $this->patch(route('mods.collaborators.update', [$mod, $viewer]), [
            'role' => 'editor',
        ]);

        $response->assertForbidden();
    }

    public function test_owner_can_remove_collaborator()
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($collaborator->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($owner);

        $response = $this->delete(route('mods.collaborators.destroy', [$mod, $collaborator]));

        $response->assertRedirect();

        $this->assertDatabaseMissing('mod_users', [
            'mod_id' => $mod->id,
            'user_id' => $collaborator->id,
        ]);
    }

    public function test_admin_can_remove_non_admin_collaborator()
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $editor = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($admin->id, [
            'role' => 'admin',
            'invited_by' => $owner->id,
        ]);
        $mod->collaborators()->attach($editor->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($admin);

        $response = $this->delete(route('mods.collaborators.destroy', [$mod, $editor]));
        $response->assertRedirect();
    }

    public function test_admin_cannot_remove_other_admin()
    {
        $owner = User::factory()->create();
        $admin1 = User::factory()->create();
        $admin2 = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($admin1->id, [
            'role' => 'admin',
            'invited_by' => $owner->id,
        ]);
        $mod->collaborators()->attach($admin2->id, [
            'role' => 'admin',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($admin1);

        $response = $this->delete(route('mods.collaborators.destroy', [$mod, $admin2]));
        $response->assertForbidden();
    }

    public function test_collaborator_can_remove_themselves()
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($collaborator->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($collaborator);

        $response = $this->delete(route('mods.collaborators.destroy', [$mod, $collaborator]));

        $response->assertRedirect();

        $this->assertDatabaseMissing('mod_users', [
            'mod_id' => $mod->id,
            'user_id' => $collaborator->id,
        ]);
    }

    public function test_can_show_invitation_page()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $invitee = User::factory()->create(['email' => 'invited@example.com']);
        $this->actingAs($invitee);

        $invitation = ModInvitation::create([
            'mod_id' => $mod->id,
            'user_id' => $invitee->id,
            'email' => $invitee->email,
            'role' => 'editor',
            'token' => 'invitation-token',
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->get(route('invitations.show', $invitation->token));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Invitations/Accept'));
    }

    public function test_can_accept_invitation()
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create(['email' => 'invited@example.com']);
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $invitation = ModInvitation::create([
            'mod_id' => $mod->id,
            'user_id' => $invitee->id,
            'email' => 'invited@example.com',
            'role' => 'editor',
            'token' => 'invitation-token',
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(7),
        ]);

        $this->actingAs($invitee);

        $response = $this->post(route('invitations.accept', $invitation->token));

        $response->assertRedirect(route('mods.show', $mod));

        $this->assertDatabaseHas('mod_users', [
            'mod_id' => $mod->id,
            'user_id' => $invitee->id,
            'role' => 'editor',
        ]);

    }

    public function test_guest_cannot_accept_invitation()
    {
        $owner = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $invitee = User::factory()->create(['email' => 'invited@example.com']);

        $invitation = ModInvitation::create([
            'mod_id' => $mod->id,
            'user_id' => $invitee->id,
            'email' => $invitee->email,
            'role' => 'editor',
            'token' => 'invitation-token',
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->post(route('invitations.accept', $invitation->token));
        $response->assertRedirect(route('login'));
    }
}
