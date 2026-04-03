<?php

namespace Tests\Feature;

use App\Models\File;
use App\Models\Mod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_uploads_files_to_r2_disk()
    {
        Storage::fake('r2');
        config(['filesystems.upload_disk' => 'r2']);

        $owner = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)->post(route('files.store', $mod), [
            'files' => [
                UploadedFile::fake()->image('guide.png'),
            ],
        ]);

        $response->assertSessionHasNoErrors();

        $file = File::query()->firstOrFail();
        $this->assertSame('s3', $file->storage_driver);
        Storage::disk('r2')->assertExists($file->path);
    }

    public function test_quick_upload_stores_file_on_r2_disk()
    {
        Storage::fake('r2');
        config(['filesystems.upload_disk' => 'r2']);

        $owner = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson(route('files.quick-upload', $mod), [
            'file' => UploadedFile::fake()->image('quick.png'),
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        $file = File::query()->firstOrFail();
        $this->assertSame('s3', $file->storage_driver);
        Storage::disk('r2')->assertExists($file->path);
    }

    public function test_destroy_removes_file_from_r2_disk()
    {
        Storage::fake('r2');
        config(['filesystems.upload_disk' => 'r2']);

        $owner = User::factory()->create();
        $mod = Mod::factory()->create(['owner_id' => $owner->id]);

        $path = 'mods/'.$mod->id.'/files/existing.png';
        Storage::disk('r2')->put($path, 'existing-file');

        $file = File::create([
            'mod_id' => $mod->id,
            'page_id' => null,
            'original_name' => 'existing.png',
            'filename' => 'existing.png',
            'mime_type' => 'image/png',
            'size' => 100,
            'storage_driver' => 's3',
            'path' => $path,
            'url' => 'https://cdn.example.com/'.$path,
            'uploaded_by' => $owner->id,
        ]);

        $this->actingAs($owner)
            ->delete(route('files.destroy', [$mod, $file]))
            ->assertRedirect();

        Storage::disk('r2')->assertMissing($path);
    }
}


