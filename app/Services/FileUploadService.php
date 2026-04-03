<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    public function upload(UploadedFile $file, string $directory): array
    {
        $directory = trim($directory, '/');
        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
        $path = $directory.'/'.$filename;

        $disk = $this->uploadDisk();
        $file->storeAs($directory, $filename, $disk);

        return [
            'disk' => $disk,
            'storage_driver' => $this->storageDriverForDisk($disk),
            'path' => $path,
            'filename' => $filename,
            'url' => Storage::disk($disk)->url($path),
        ];
    }

    public function delete(?string $path, ?string $storageDriver = null): void
    {
        if (blank($path)) {
            return;
        }

        Storage::disk($this->diskForStorageDriver($storageDriver))->delete($path);
    }

    public function url(string $path, ?string $storageDriver = null): string
    {
        return Storage::disk($this->diskForStorageDriver($storageDriver))->url($path);
    }

    public function diskForStorageDriver(?string $storageDriver = null): string
    {
        return match ($storageDriver) {
            's3' => $this->uploadDisk(),
            default => 'public',
        };
    }

    public function uploadDisk(): string
    {
        return (string) config('filesystems.upload_disk', 'r2');
    }

    public function defaultStorageDriver(): string
    {
        return $this->storageDriverForDisk($this->uploadDisk());
    }

    private function storageDriverForDisk(string $disk): string
    {
        return in_array($disk, ['r2', 's3'], true) ? 's3' : 'local';
    }
}

