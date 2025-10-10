<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Caso extends Model
{
    //

    use HasFactory;

    protected $table = 'casos';

    protected $fillable = [
        'idUsuario',
        'fotoAnimal',
        'tipoAnimal',
        'descripcion',
        'situacion',
        'ciudad',
        'latitud',
        'longitud',
        'telefonoContacto',
        'fechaPublicacion',
        'estado',
    ];

    protected $casts = [
        'fechaPublicacion' => 'datetime',
        'latitud' => 'decimal:7',
        'longitud' => 'decimal:7',
    ];



    public function usuario()
    {
        return $this -> belongsTo(User::class, 'idUsuario');
    }
}
