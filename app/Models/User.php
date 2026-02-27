<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'avatar_url',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'avatar',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the mods owned by this user.
     */
    public function ownedMods()
    {
        return $this->hasMany(Mod::class, 'owner_id');
    }

    /**
     * Get all mods this user has access to (including collaborations).
     */
    public function mods()
    {
        return $this->belongsToMany(Mod::class, 'mod_users')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Check if user has access to a mod with specific role.
     */
    public function canAccessMod(Mod $mod, ?string $role = null): bool
    {
        if ($mod->owner_id === $this->id) {
            return true;
        }

        $userMod = $this->mods()->where('mod_id', $mod->id)->first();

        if (! $userMod) {
            return false;
        }

        if ($role === null) {
            return true;
        }

        $roleHierarchy = ['viewer', 'editor', 'admin'];
        $userRoleIndex = array_search($userMod->pivot->role, $roleHierarchy);
        $requiredRoleIndex = array_search($role, $roleHierarchy);

        return $userRoleIndex >= $requiredRoleIndex;
    }

    /**
     * Get the user's avatar URL with fallback to UI Avatars API.
     */
    protected function avatar(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->avatar_url ?:
                'https://ui-avatars.com/api/?name='.urlencode($this->name).'&background=random'
        );
    }
}
