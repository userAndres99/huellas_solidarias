<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
