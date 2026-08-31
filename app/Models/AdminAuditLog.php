<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminAuditLog extends Model
{
    protected $fillable = [
        'actor_id',
        'subject_type',
        'subject_id',
        'action',
        'description',
        'metadata',
    ];

    protected $casts = ['metadata' => 'array'];

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
