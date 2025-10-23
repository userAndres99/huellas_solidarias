<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudVerificacion extends Model
{
    protected $table = 'solicitud_verificacion';

    protected $fillable = [
        'user_id',
        'organization_name',
        'organization_phone',
        'organization_email',
        'message',
        'documents',
        'status',
        'reviewed_by',
        'response_message',
    ];

    protected $casts = [
        'documents' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}