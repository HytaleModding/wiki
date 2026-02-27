<?php

namespace Tests\Feature;

use App\Models\Mod;
use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PageTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_owner_can_view_pages_index()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $response = $this->get(route('pages.index', $mod));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Pages/Index'));
    }

    public function test_collaborator_can_view_pages_index()
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($collaborator->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($collaborator);

        $response = $this->get(route('pages.index', $mod));
        $response->assertOk();
    }

    public function test_unauthorized_user_cannot_view_pages_index()
    {
        $owner = User::factory()->create();
        $user = User::factory()->create();
        $mod = Mod::factory()->private()->create(['owner_id' => $owner->id]);
        $this->actingAs($user);

        $response = $this->get(route('pages.index', $mod));
        $response->assertForbidden();
    }

    public function test_owner_can_create_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $pageData = [
            'title' => 'Test Page',
            'content' => 'This is test content.',
            'parent_id' => null,
            'is_index' => false,
            'published' => true,
        ];

        $response = $this->post(route('pages.store', $mod), $pageData);

        if ($response->status() === 422) {
            $this->fail('Validation failed: '.json_encode($response->json()));
        } elseif ($response->status() !== 302) {
            $this->fail('Expected redirect (302) but got status: '.$response->status());
        }

        $page = Page::where('title', 'Test Page')->first();
        $this->assertNotNull($page);
        $this->assertEquals($mod->id, $page->mod_id);
        $this->assertEquals($user->id, $page->created_by);
        $this->assertEquals('test-page', $page->slug);

        $response->assertRedirect(route('pages.show', [$mod, $page]));
    }

    public function test_editor_can_create_page()
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($editor->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($editor);

        $pageData = [
            'title' => 'Editor Page',
            'content' => 'This is test content.',
            'parent_id' => null,
            'is_index' => false,
            'published' => true,
        ];

        $response = $this->post(route('pages.store', $mod), $pageData);

        $page = Page::where('title', 'Editor Page')->first();
        $this->assertNotNull($page);
        $this->assertEquals($editor->id, $page->created_by);
    }

    public function test_viewer_cannot_create_page()
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $mod->collaborators()->attach($viewer->id, [
            'role' => 'viewer',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($viewer);

        $response = $this->post(route('pages.store', $mod), [
            'title' => 'Viewer Page',
            'content' => 'Should not work.',
        ]);

        $response->assertForbidden();
    }

    public function test_page_creation_requires_title()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $response = $this->post(route('pages.store', $mod), [
            'content' => 'Content without title',
        ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_user_can_view_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id, 'published' => true]);
        $this->actingAs($user);

        $response = $this->get(route('pages.show', [$mod, $page]));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Pages/Show'));
    }

    public function test_guest_can_view_published_page_in_public_mod()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->public()->create(['owner_id' => $user->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id, 'published' => true]);

        $response = $this->get("/docs/{$mod->slug}/{$page->slug}");
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Public/Page'));
    }

    public function test_guest_cannot_view_unpublished_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->public()->create(['owner_id' => $user->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id, 'published' => false]);

        $response = $this->get("/docs/{$mod->slug}/{$page->slug}");
        $response->assertNotFound();
    }

    public function test_owner_can_view_unpublished_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id, 'published' => false]);
        $this->actingAs($user);

        $response = $this->get(route('pages.show', [$mod, $page]));
        $response->assertOk();
    }

    public function test_owner_can_update_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id]);
        $this->actingAs($user);

        $updateData = [
            'title' => 'Updated Page Title',
            'content' => 'Updated content.',
            'parent_id' => $page->parent_id,
            'is_index' => $page->is_index,
            'published' => $page->published,
        ];

        $response = $this->patch(route('pages.update', [$mod, $page]), $updateData);

        $page->refresh();
        $this->assertEquals('Updated Page Title', $page->title);
        $this->assertEquals('Updated content.', $page->content);
        $this->assertEquals($user->id, $page->updated_by);

        $response->assertRedirect(route('pages.show', [$mod, $page]));
    }

    public function test_editor_can_update_page()
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id]);

        $mod->collaborators()->attach($editor->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($editor);

        $response = $this->patch(route('pages.update', [$mod, $page]), [
            'title' => 'Editor Updated',
            'content' => $page->content,
            'parent_id' => $page->parent_id,
            'is_index' => $page->is_index,
            'published' => $page->published,
        ]);

        $page->refresh();
        $this->assertEquals('Editor Updated', $page->title);
        $this->assertEquals($editor->id, $page->updated_by);
    }

    public function test_viewer_cannot_update_page()
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id]);

        $mod->collaborators()->attach($viewer->id, [
            'role' => 'viewer',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($viewer);

        $response = $this->patch(route('pages.update', [$mod, $page]), [
            'title' => 'Should not update',
        ]);

        $response->assertForbidden();
    }

    public function test_owner_can_delete_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id]);
        $this->actingAs($user);

        $response = $this->delete(route('pages.destroy', [$mod, $page]));

        $this->assertSoftDeleted($page);
        $response->assertRedirect(route('mods.show', $mod));
    }

    public function test_editor_can_delete_page()
    {
        $owner = User::factory()->create();
        $editor = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id]);

        $mod->collaborators()->attach($editor->id, [
            'role' => 'editor',
            'invited_by' => $owner->id,
        ]);

        $this->actingAs($editor);

        $response = $this->delete(route('pages.destroy', [$mod, $page]));
        $this->assertSoftDeleted($page);
    }

    public function test_can_create_child_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $parentPage = Page::factory()->create(['mod_id' => $mod->id]);
        $this->actingAs($user);

        $pageData = [
            'title' => 'Child Page',
            'content' => 'Child content.',
            'parent_id' => $parentPage->id,
            'published' => true,
        ];

        $response = $this->post(route('pages.store', $mod), $pageData);

        $childPage = Page::where('title', 'Child Page')->first();
        $this->assertNotNull($childPage);
        $this->assertEquals($parentPage->id, $childPage->parent_id);
    }

    public function test_can_reorder_pages()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $page1 = Page::factory()->create(['mod_id' => $mod->id, 'order_index' => 1]);
        $page2 = Page::factory()->create(['mod_id' => $mod->id, 'order_index' => 2]);
        $this->actingAs($user);

        $response = $this->post(route('pages.reorder', $mod), [
            'pages' => [
                ['id' => $page2->id, 'parent_id' => null, 'order_index' => 1],
                ['id' => $page1->id, 'parent_id' => null, 'order_index' => 2],
            ],
        ]);

        $response->assertRedirect();

        $page1->refresh();
        $page2->refresh();
        $this->assertEquals(2, $page1->order_index);
        $this->assertEquals(1, $page2->order_index);
    }

    public function test_can_autosave_page()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $page = Page::factory()->create(['mod_id' => $mod->id]);
        $this->actingAs($user);

        $response = $this->post(route('pages.autosave', [$mod, $page]), [
            'content' => 'Autosaved content',
        ]);

        $response->assertOk();
    }

    public function test_page_slug_is_generated_from_title()
    {
        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);
        $this->actingAs($user);

        $response = $this->post(route('pages.store', $mod), [
            'title' => 'My Amazing Page Title',
            'content' => 'Content',
            'parent_id' => null,
            'is_index' => false,
            'published' => true,
        ]);
        $page = Page::where('title', 'My Amazing Page Title')->first();
        $this->assertEquals('my-amazing-page-title', $page->slug);
    }

    public function test_page_validates_parent_belongs_to_same_mod()
    {
        $user = User::factory()->create();
        $mod1 = Mod::factory()->create(['owner_id' => $user->id]);
        $mod2 = Mod::factory()->create(['owner_id' => $user->id]);
        $parentPage = Page::factory()->create(['mod_id' => $mod2->id]);
        $this->actingAs($user);

        $response = $this->post(route('pages.store', $mod1), [
            'title' => 'Invalid Parent Page',
            'content' => 'Content',
            'parent_id' => $parentPage->id,
        ]);

        $response->assertStatus(422);
    }
}
