<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Caso extends Model
{
    use HasFactory;

    protected $appends = ['foto_url'];

    protected $table = 'casos';

    protected $fillable = [
        'idUsuario',
        'fotoAnimal',
        'tipoAnimal',
        'descripcion',
        'situacion',
        'sexo',
        'tamano',
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
        return $this->belongsTo(User::class, 'idUsuario');
    }

    public function comentarios()
    {
        return $this -> morphMany(Comentario::class, 'comentable')
        ->whereNull('parent_id')->with('respuesta.user');
    }

    public function getFotoUrlAttribute()
    {
        return $this->fotoAnimal ? Storage::url($this->fotoAnimal) : null;
    }

}