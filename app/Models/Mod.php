<?php

namespace App\Models;

use App\Support\CustomCssSanitizer;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Mod extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon_url',
        'icon_path',
        'owner_id',
        'visibility',
        'storage_driver',
        'external_access',
        'github_repository_url',
        'github_repository_path',
        'custom_css',
        'custom_domain',
        'domain_verified',
        'domain_verification_token',
    ];

    protected $casts = [
        'id' => 'string',
        'external_access' => 'boolean',
        'domain_verified' => 'boolean',
    ];

    protected function customCss(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => CustomCssSanitizer::normalize($value),
        );
    }

    protected function safeCustomCss(): Attribute
    {
        return Attribute::make(
            get: fn () => CustomCssSanitizer::sanitizeForOutput($this->attributes['custom_css'] ?? null),
        );
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($mod) {
            if (empty($mod->slug)) {
                $mod->slug = Str::slug($mod->name);
            }
        });

        static::updating(function ($mod) {
            if ($mod->isDirty('name') && empty($mod->getOriginal('slug'))) {
                $mod->slug = Str::slug($mod->name);
            }
        });
    }

    /**
     * Get the owner of the mod.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get all collaborators of the mod.
     */
    public function collaborators()
    {
        return $this->belongsToMany(User::class, 'mod_users')
            ->withPivot('role', 'invited_by')
            ->withTimestamps();
    }

    /**
     * Get all pages in this mod.
     */
    public function pages()
    {
        return $this->hasMany(Page::class);
    }

    /**
     * Get published pages only.
     */
    public function publishedPages()
    {
        return $this->hasMany(Page::class)->where('published', true);
    }

    /**
     * Get root pages (pages without parents).
     */
    public function rootPages()
    {
        return $this->hasMany(Page::class)->whereNull('parent_id')->orderBy('order_index');
    }

    /**
     * Get the index page for this mod.
     */
    public function indexPage()
    {
        return $this->hasOne(Page::class)->where('is_index', true);
    }

    /**
     * Get all files uploaded to this mod.
     */
    public function files()
    {
        return $this->hasMany(File::class);
    }

    /**
     * Check if user can access this mod.
     */
    public function canBeAccessedBy(?User $user): bool
    {
        if ($this->visibility === 'public') {
            return true;
        }

        if (! $user) {
            return false;
        }

        if ($this->owner_id === $user->id) {
            return true;
        }

        return $this->collaborators()->where('user_id', $user->id)->exists();
    }

    /**
     * Get user's role in this mod.
     */
    public function getUserRole(User $user): ?string
    {
        if ($this->owner_id === $user->id) {
            return 'owner';
        }

        $collaborator = $this->collaborators()->where('user_id', $user->id)->first();

        return $collaborator?->pivot->role;
    }

    /**
     * Check if user has specific permission.
     */
    public function userCan(User $user, string $permission): bool
    {
        $role = $this->getUserRole($user);

        if (! $role) {
            return false;
        }

        $permissions = [
            'owner' => ['view', 'edit', 'delete', 'manage_collaborators', 'manage_settings'],
            'admin' => ['view', 'edit', 'manage_collaborators'],
            'editor' => ['view', 'edit'],
            'viewer' => ['view'],
        ];

        return in_array($permission, $permissions[$role] ?? []);
    }

    /**
     * Get route key name for model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
