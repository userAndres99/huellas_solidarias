<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\MpCuenta;

class Organizacion extends Model
{
    protected $table = 'organizaciones';

    protected $fillable = [
        'usuario_creador_id',
        'nombre',
        'telefono',
        'email',
        'descripcion',
        'latitud',
        'longitud',
        'documentacion',
        'verificado_en',
    ];

    protected $casts = [
        'documentacion' => 'array',
        'latitud' => 'float',
        'longitud' => 'float',
        'verificado_en' => 'datetime',
    ];

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_creador_id');
    }

    /**
     * relación uno a uno con MpCuenta
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function mp_cuenta(): HasOne
    {
        return $this->hasOne(MpCuenta::class, 'organizacion_id');
    }
}
