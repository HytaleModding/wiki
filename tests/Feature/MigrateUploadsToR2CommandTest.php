<?php

namespace Tests\Feature;

use App\Models\File;
use App\Models\Mod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MigrateUploadsToR2CommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_migrates_local_assets_to_r2(): void
    {
        Storage::fake('public');
        Storage::fake('r2');
        config(['filesystems.upload_disk' => 'r2']);

        $user = User::factory()->create([
            'avatar_url' => 'http://localhost/storage/avatars/user.png',
            'avatar_path' => null,
        ]);

        $mod = Mod::factory()->create([
            'owner_id' => $user->id,
            'icon_url' => 'http://localhost/storage/mods/icons/mod.png',
            'icon_path' => null,
        ]);

        $file = File::create([
            'mod_id' => $mod->id,
            'page_id' => null,
            'original_name' => 'readme.png',
            'filename' => 'readme.png',
            'path' => 'mods/'.$mod->id.'/files/readme.png',
            'mime_type' => 'image/png',
            'size' => 1024,
            'storage_driver' => 'local',
            'url' => '/storage/mods/'.$mod->id.'/files/readme.png',
            'uploaded_by' => $user->id,
        ]);

        Storage::disk('public')->put('avatars/user.png', 'avatar-bytes');
        Storage::disk('public')->put('mods/icons/mod.png', 'icon-bytes');
        Storage::disk('public')->put($file->path, 'file-bytes');

        $this->artisan('uploads:migrate-to-r2')->assertSuccessful();

        $file->refresh();
        $user->refresh();
        $mod->refresh();

        $this->assertSame('s3', $file->storage_driver);
        $this->assertNotNull($file->url);
        $this->assertSame('avatars/user.png', $user->avatar_path);
        $this->assertSame('mods/icons/mod.png', $mod->icon_path);

        Storage::disk('r2')->assertExists($file->path);
        Storage::disk('r2')->assertExists($user->avatar_path);
        Storage::disk('r2')->assertExists($mod->icon_path);
    }

    public function test_command_dry_run_does_not_write_anything(): void
    {
        Storage::fake('public');
        Storage::fake('r2');
        config(['filesystems.upload_disk' => 'r2']);

        $user = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $user->id]);

        $file = File::create([
            'mod_id' => $mod->id,
            'page_id' => null,
            'original_name' => 'readme.png',
            'filename' => 'readme.png',
            'path' => 'mods/'.$mod->id.'/files/readme.png',
            'mime_type' => 'image/png',
            'size' => 1024,
            'storage_driver' => 'local',
            'url' => '/storage/mods/'.$mod->id.'/files/readme.png',
            'uploaded_by' => $user->id,
        ]);

        Storage::disk('public')->put($file->path, 'file-bytes');

        $this->artisan('uploads:migrate-to-r2', ['--dry-run' => true])->assertSuccessful();

        $file->refresh();
        $this->assertSame('local', $file->storage_driver);
        Storage::disk('r2')->assertMissing($file->path);
    }
}

