<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'mod_id',
        'page_id',
        'original_name',
        'filename',
        'path',
        'mime_type',
        'size',
        'storage_driver',
        'url',
        'uploaded_by',
    ];

    protected $casts = [
        'id' => 'string',
        'mod_id' => 'string',
        'page_id' => 'string',
        'size' => 'integer',
    ];

    /**
     * Get the mod this file belongs to.
     */
    public function mod()
    {
        return $this->belongsTo(Mod::class);
    }

    /**
     * Get the page this file is attached to (if any).
     */
    public function page()
    {
        return $this->belongsTo(Page::class);
    }

    /**
     * Get the user who uploaded this file.
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the full URL for the file.
     */
    public function getUrlAttribute($value): string
    {
        if ($value) {
            return $value;
        }

        if ($this->storage_driver === 's3') {
            return Storage::disk('s3')->url($this->path);
        }

        return Storage::disk('public')->url($this->path);
    }

    /**
     * Get human readable file size.
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }

    /**
     * Check if file is an image.
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if file is a document.
     */
    public function isDocument(): bool
    {
        $documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];

        return in_array($this->mime_type, $documentTypes);
    }

    /**
     * Delete file from storage when model is deleted.
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($file) {
            if ($file->storage_driver === 's3') {
                Storage::disk('s3')->delete($file->path);
            } else {
                Storage::disk('public')->delete($file->path);
            }
        });
    }
}
