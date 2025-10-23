<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Evento extends Model
{
    protected $table = 'eventos';
    protected $fillable = [
        'organizacion_id','titulo','descripcion','tipo',
        'starts_at','ends_at','lat','lng','image_path'
    ];
    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function organizacion()
    {
        return $this->belongsTo(User::class, 'organizacion_id');
    }

    public function getImageUrlAttribute()
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }
}