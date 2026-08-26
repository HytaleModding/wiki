<?php

namespace App\Services;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class PublicAssetStorage
{
    public const DISK = 'r2';

    public static function disk(): FilesystemAdapter
    {
        return Storage::disk(self::DISK);
    }

    public static function url(string $path): string
    {
        return self::disk()->url($path);
    }

    /**
     * Remove an asset stored by this application, including legacy local URLs.
     */
    public static function deleteUrl(?string $url): void
    {
        if (blank($url)) {
            return;
        }

        $path = '/'.ltrim((string) parse_url($url, PHP_URL_PATH), '/');
        $cdnUrl = (string) config('filesystems.disks.r2.url');
        $cdnPath = '/'.trim((string) parse_url($cdnUrl, PHP_URL_PATH), '/');
        $isCdnUrl = parse_url($url, PHP_URL_HOST) === parse_url($cdnUrl, PHP_URL_HOST);

        if ($isCdnUrl && $cdnPath !== '/' && str_starts_with($path, $cdnPath.'/')) {
            self::disk()->delete(ltrim(substr($path, strlen($cdnPath)), '/'));

            return;
        }

        if (str_starts_with($path, '/storage/')) {
            Storage::disk('public')->delete(ltrim(substr($path, strlen('/storage/')), '/'));
        }
    }
}
