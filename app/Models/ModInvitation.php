<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ModInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'mod_id',
        'user_id',
        'invited_by',
        'role',
        'token',
        'expires_at',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function mod(): BelongsTo
    {
        return $this->belongsTo(Mod::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }

    public function accept(): bool
    {
        if ($this->isExpired() || $this->isAccepted()) {
            return false;
        }

        $this->mod->collaborators()->syncWithoutDetaching([
            $this->user_id => [
                'role' => $this->role,
                'invited_by' => $this->invited_by,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->update(['accepted_at' => now()]);

        return true;
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }

    public static function createInvitation(Mod $mod, User $user, User $inviter, string $role): self
    {
        return self::create([
            'mod_id' => $mod->id,
            'user_id' => $user->id,
            'invited_by' => $inviter->id,
            'role' => $role,
            'token' => self::generateToken(),
            'expires_at' => Carbon::now()->addDays(7), // 7 days expiry
        ]);
    }
}
