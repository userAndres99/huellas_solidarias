<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MpCuenta extends Model
{
    use HasFactory;

    protected $table = 'mp_cuentas';

    protected $fillable = [
        'organizacion_id',
        'mp_user_id',
        'access_token',
        'refresh_token',
        'token_type',
        'expires_at',
        'scopes',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'expires_at' => 'datetime',
    ];

    /**
     * Relación con la organización.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function organizacion(): BelongsTo
    {
        return $this->belongsTo(Organizacion::class, 'organizacion_id');
    }
}
