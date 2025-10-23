<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comentario extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'comentable_id',
        'comentable_type',
        'user_id',
        'usuario_nombre',
        'usuario_avatar',
        'texto',
        'parent_id',
        'likes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function comentable()
    {
        return $this -> morphTo();
    }

    public function respuesta()
    {
        return $this->hasMany(Comentario::class, 'parent_id');
    }
}
