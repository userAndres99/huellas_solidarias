<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConversacionOculta extends Model
{
    use HasFactory;

    protected $table = 'conversaciones_ocultas';

    protected $fillable = [
        'user_id',
        'otro_user_id',
    ];
}
