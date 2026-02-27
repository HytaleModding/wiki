<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ModUser extends Pivot
{
    use HasFactory;

    protected $table = 'mod_users';

    protected $fillable = [
        'mod_id',
        'user_id',
        'role',
        'invited_by',
    ];

    protected $casts = [
        'mod_id' => 'string',
    ];

    /**
     * Get the mod this collaboration belongs to.
     */
    public function mod()
    {
        return $this->belongsTo(Mod::class);
    }

    /**
     * Get the user who is a collaborator.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who invited this collaborator.
     */
    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Get role hierarchy for permission checking.
     */
    public static function getRoleHierarchy(): array
    {
        return [
            'viewer' => 0,
            'editor' => 1,
            'admin' => 2,
        ];
    }

    /**
     * Check if this role has permission for a specific action.
     */
    public function hasPermission(string $permission): bool
    {
        $permissions = [
            'viewer' => ['view'],
            'editor' => ['view', 'edit_pages', 'create_pages'],
            'admin' => ['view', 'edit_pages', 'create_pages', 'delete_pages', 'manage_collaborators'],
        ];

        return in_array($permission, $permissions[$this->role] ?? []);
    }
}
