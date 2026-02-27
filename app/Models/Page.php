<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'mod_id',
        'parent_id',
        'title',
        'slug',
        'content',
        'order_index',
        'is_index',
        'published',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'id' => 'string',
        'mod_id' => 'string',
        'parent_id' => 'string',
        'is_index' => 'boolean',
        'published' => 'boolean',
        'order_index' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($page) {
            if (empty($page->slug)) {
                $page->slug = Str::slug($page->title);
            }
        });

        static::updating(function ($page) {
            if ($page->isDirty('title') && empty($page->getOriginal('slug'))) {
                $page->slug = Str::slug($page->title);
            }
        });
    }

    /**
     * Get the mod this page belongs to.
     */
    public function mod()
    {
        return $this->belongsTo(Mod::class);
    }

    /**
     * Get the parent page.
     */
    public function parent()
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    /**
     * Get all child pages.
     */
    public function children()
    {
        return $this->hasMany(Page::class, 'parent_id')->orderBy('order_index');
    }

    /**
     * Get published child pages only.
     */
    public function publishedChildren()
    {
        return $this->hasMany(Page::class, 'parent_id')
            ->where('published', true)
            ->orderBy('order_index');
    }

    /**
     * Get the user who created this page.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this page.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get all files attached to this page.
     */
    public function files()
    {
        return $this->hasMany(File::class);
    }

    /**
     * Get the full path of the page (breadcrumbs).
     */
    public function getPathAttribute(): array
    {
        $path = [];
        $current = $this;

        while ($current) {
            array_unshift($path, [
                'id' => $current->id,
                'title' => $current->title,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }

        return $path;
    }

    /**
     * Get the depth level of this page.
     */
    public function getDepthAttribute(): int
    {
        $depth = 0;
        $current = $this->parent;

        while ($current) {
            $depth++;
            $current = $current->parent;
        }

        return $depth;
    }

    /**
     * Scope to get only published pages.
     */
    public function scopePublished($query)
    {
        return $query->where('published', true);
    }

    /**
     * Scope to get only root pages (no parent).
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Get route key name for model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
