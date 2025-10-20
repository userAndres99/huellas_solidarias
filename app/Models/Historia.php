<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Historia extends Model
{
    //
    use HasFactory;


    protected $fillable = [
        'titulo',
        'descripcion',
        'contenido',
        'testimonio',
        'imagen_antes',
        'imagen_despues',
    ];



    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
