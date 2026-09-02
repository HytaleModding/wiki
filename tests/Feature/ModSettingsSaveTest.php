<?php

namespace Tests\Feature;

use App\Models\Mod;
use App\Models\User;
use App\Services\PublicAssetStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ModSettingsSaveTest extends TestCase
{
    use RefreshDatabase;

    public static function iconUploads(): array
    {
        return [
            'without an icon' => [false],
            'with an icon' => [true],
        ];
    }

    #[DataProvider('iconUploads')]
    public function test_settings_saved_via_method_override_persist_after_reload(bool $uploadIcon): void
    {
        $this->withoutVite();
        Storage::fake(PublicAssetStorage::DISK);

        $owner = User::factory()->create();
        $mod = Mod::factory()->private()->create([
            'owner_id' => $owner->id,
            'name' => 'Original Name',
            'slug' => 'original-name',
        ]);

        $payload = [
            '_method' => 'patch',
            'settings_section' => 'general',
            'name' => 'Updated Mod Name',
            'description' => 'Updated description',
            'visibility' => 'public',
            'storage_driver' => $mod->storage_driver,
            'external_access' => '1',
            'github_repository_url' => '',
            'github_repository_path' => '',
            'custom_css' => '',
            'icon' => $uploadIcon ? UploadedFile::fake()->image('icon.png') : '',
        ];

        $response = $this->actingAs($owner)->post(route('mods.update', $mod), $payload, [
            'X-Inertia' => 'true',
        ]);

        $response->assertSessionHasNoErrors();
        $mod->refresh();
        $this->assertSame('Updated Mod Name', $mod->name);
        $this->assertSame('updated-mod-name', $mod->slug);
        $this->assertSame('Updated description', $mod->description);
        $this->assertSame('public', $mod->visibility);
        $this->assertTrue($mod->external_access);

        $settingsUrl = route('mods.settings', ['mod' => $mod, 'section' => 'general']);
        $response->assertRedirect($settingsUrl);

        if ($uploadIcon) {
            $files = Storage::disk(PublicAssetStorage::DISK)->allFiles('mods/icons');
            $this->assertCount(1, $files);
            $this->assertSame(PublicAssetStorage::url($files[0]), $mod->icon_url);
        } else {
            $this->assertNull($mod->icon_url);
        }

        $this->get($settingsUrl)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Mods/Edit')
            ->where('mod.name', 'Updated Mod Name')
            ->where('mod.slug', 'updated-mod-name')
            ->where('mod.description', 'Updated description')
            ->where('mod.visibility', 'public')
            ->where('mod.icon_url', $mod->icon_url)
        );
    }
}
