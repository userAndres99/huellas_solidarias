<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Donacion extends Model
{
    use HasFactory;

    protected $table = 'donaciones';

    protected $fillable = [
        'organizacion_id',
        'mp_payment_id',
        'monto',
        'comision_marketplace',
        'estado',
        'fecha_disponible',
        'payload_crudo',
        'moneda',
        'email_donante',
    ];

    protected $casts = [
        'payload_crudo' => 'array',
        'fecha_disponible' => 'datetime',
        'monto' => 'decimal:2',
        'comision_marketplace' => 'decimal:2',
        'moneda' => 'string',
        'email_donante' => 'string',
    ];
}
