<?php

namespace Tests\Unit;

use App\Models\Mod;
use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_mod_belongs_to_owner()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);

        $this->assertInstanceOf(User::class, $mod->owner);
        $this->assertEquals($user->id, $mod->owner->id);
    }

    public function test_mod_has_many_collaborators()
    {
        $owner = User::factory()->create();
        $collaborator1 = User::factory()->create();
        $collaborator2 = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($collaborator1->id, ['role' => 'editor', 'invited_by' => $owner->id]);
        $mod->collaborators()->attach($collaborator2->id, ['role' => 'viewer', 'invited_by' => $owner->id]);

        $this->assertCount(2, $mod->collaborators);
        $this->assertEquals('editor', $mod->collaborators->first()->pivot->role);
    }

    public function test_mod_has_many_pages()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $page1 = Page::factory()->create(['mod_id' => $mod->id]);
        $page2 = Page::factory()->create(['mod_id' => $mod->id]);

        $this->assertCount(2, $mod->pages);
        $this->assertTrue($mod->pages->contains($page1));
        $this->assertTrue($mod->pages->contains($page2));
    }

    public function test_mod_has_root_pages()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $rootPage = Page::factory()->create(['mod_id' => $mod->id, 'parent_id' => null]);
        $childPage = Page::factory()->create(['mod_id' => $mod->id, 'parent_id' => $rootPage->id]);

        $rootPages = $mod->rootPages;
        $this->assertCount(1, $rootPages);
        $this->assertTrue($rootPages->contains($rootPage));
        $this->assertFalse($rootPages->contains($childPage));
    }

    public function test_public_mod_can_be_accessed_by_anyone()
    {
        $user = User::factory()->create();
        $guest = User::factory()->create();
        $mod = Mod::factory()->public()->create(['owner_id' => $user->id]);

        $this->assertTrue($mod->canBeAccessedBy($user));
        $this->assertTrue($mod->canBeAccessedBy($guest));
        $this->assertTrue($mod->canBeAccessedBy(null)); // Guest
    }

    public function test_private_mod_can_only_be_accessed_by_owner_and_collaborators()
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $outsider = User::factory()->create();
        $mod = Mod::factory()->private()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($collaborator->id, ['role' => 'viewer', 'invited_by' => $owner->id]);

        $this->assertTrue($mod->canBeAccessedBy($owner));
        $this->assertTrue($mod->canBeAccessedBy($collaborator));
        $this->assertFalse($mod->canBeAccessedBy($outsider));
        $this->assertFalse($mod->canBeAccessedBy(null));
    }

    public function test_unlisted_mod_access()
    {
        $owner = User::factory()->create();
        $guest = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id, 'visibility' => 'unlisted']);

        $this->assertTrue($mod->canBeAccessedBy($owner));
        $this->assertFalse($mod->canBeAccessedBy($guest));
        $this->assertFalse($mod->canBeAccessedBy(null));
    }

    public function test_get_user_role_returns_correct_role()
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $editor = User::factory()->create();
        $viewer = User::factory()->create();
        $outsider = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($admin->id, ['role' => 'admin', 'invited_by' => $owner->id]);
        $mod->collaborators()->attach($editor->id, ['role' => 'editor', 'invited_by' => $owner->id]);
        $mod->collaborators()->attach($viewer->id, ['role' => 'viewer', 'invited_by' => $owner->id]);

        $this->assertEquals('owner', $mod->getUserRole($owner));
        $this->assertEquals('admin', $mod->getUserRole($admin));
        $this->assertEquals('editor', $mod->getUserRole($editor));
        $this->assertEquals('viewer', $mod->getUserRole($viewer));
        $this->assertNull($mod->getUserRole($outsider));
    }

    public function test_owner_has_all_permissions()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);

        $this->assertTrue($mod->userCan($user, 'view'));
        $this->assertTrue($mod->userCan($user, 'edit'));
        $this->assertTrue($mod->userCan($user, 'delete'));
        $this->assertTrue($mod->userCan($user, 'manage_collaborators'));
        $this->assertTrue($mod->userCan($user, 'manage_settings'));
    }

    public function test_admin_has_correct_permissions()
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($admin->id, ['role' => 'admin', 'invited_by' => $owner->id]);

        $this->assertTrue($mod->userCan($admin, 'view'));
        $this->assertTrue($mod->userCan($admin, 'edit'));
        $this->assertTrue($mod->userCan($admin, 'manage_collaborators'));
        $this->assertFalse($mod->userCan($admin, 'delete'));
        $this->assertFalse($mod->userCan($admin, 'manage_settings'));
    }

    public function test_editor_has_correct_permissions()
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($editor->id, ['role' => 'editor', 'invited_by' => $owner->id]);

        $this->assertTrue($mod->userCan($editor, 'view'));
        $this->assertTrue($mod->userCan($editor, 'edit'));
        $this->assertFalse($mod->userCan($editor, 'delete'));
        $this->assertFalse($mod->userCan($editor, 'manage_collaborators'));
        $this->assertFalse($mod->userCan($editor, 'manage_settings'));
    }

    public function test_viewer_has_correct_permissions()
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($viewer->id, ['role' => 'viewer', 'invited_by' => $owner->id]);

        $this->assertTrue($mod->userCan($viewer, 'view'));
        $this->assertFalse($mod->userCan($viewer, 'edit'));
        $this->assertFalse($mod->userCan($viewer, 'delete'));
        $this->assertFalse($mod->userCan($viewer, 'manage_collaborators'));
        $this->assertFalse($mod->userCan($viewer, 'manage_settings'));
    }

    public function test_outsider_has_no_permissions()
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $this->assertFalse($mod->userCan($outsider, 'view'));
        $this->assertFalse($mod->userCan($outsider, 'edit'));
        $this->assertFalse($mod->userCan($outsider, 'delete'));
        $this->assertFalse($mod->userCan($outsider, 'manage_collaborators'));
        $this->assertFalse($mod->userCan($outsider, 'manage_settings'));
    }

    public function test_slug_is_generated_on_creation()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $user->id,
            'name' => 'My Amazing Mod',
            'slug' => null,
        ]);

        $this->assertEquals('my-amazing-mod', $mod->slug);
    }

    public function test_custom_slug_is_preserved()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create([
            'owner_id' => $user->id,
            'name' => 'Original Name',
            'slug' => 'custom-slug',
        ]);

        $mod->update(['name' => 'New Name']);

        $this->assertEquals('custom-slug', $mod->slug);
    }

    public function test_route_key_name_is_slug()
    {
        $mod = new Mod;
        $this->assertEquals('slug', $mod->getRouteKeyName());
    }

    public function test_published_pages_scope()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $publishedPage = Page::factory()->create(['mod_id' => $mod->id, 'published' => true]);
        $unpublishedPage = Page::factory()->create(['mod_id' => $mod->id, 'published' => false]);

        $publishedPages = $mod->publishedPages;
        $this->assertCount(1, $publishedPages);
        $this->assertTrue($publishedPages->contains($publishedPage));
        $this->assertFalse($publishedPages->contains($unpublishedPage));
    }

    public function test_index_page_relationship()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $indexPage = Page::factory()->create(['mod_id' => $mod->id, 'is_index' => true]);
        $regularPage = Page::factory()->create(['mod_id' => $mod->id, 'is_index' => false]);

        $retrievedIndexPage = $mod->indexPage;
        $this->assertNotNull($retrievedIndexPage);
        $this->assertEquals($indexPage->id, $retrievedIndexPage->id);
    }
}
