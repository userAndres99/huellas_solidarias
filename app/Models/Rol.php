<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    /**
     * Tabla asociada.
     *
     * @var string
     */
    protected $table = 'roles';

    /**
     * Atributos asignables masivamente.
     *
     * @var array<int,string>
     */
    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    /**
     * Relación: un rol tiene muchos usuarios.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'rol_id');
    }
}
