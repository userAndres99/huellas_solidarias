<?php

namespace App\Models;

use App\Notifications\CustomVerifyEmail;
use App\Notifications\CustomResetPassword;
use App\Models\Rol;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    // roles como constantes 
    public const ROLE_USER = 'Usuario';
    public const ROLE_ADMIN = 'Admin';
    public const ROLE_ORG = 'Organizacion';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'profile_photo_path', 
        'apellido', 
        'rol_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be appended to the model's array / JSON.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'profile_photo_url',
        'role_name',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Usar la notificación personalizada para verificar email.
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmail());
    }

    /**
     * Usar la notificación personalizada para restablecer contraseña.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPassword($token));
    }

    /**
     * Accessor para la URL pública de la foto de perfil.
     *
     * @return string
     */
    public function getProfilePhotoUrlAttribute(): string
    {
        if ($this->profile_photo_path) {
            // Devuelve una ruta RELATIVA (no me mostraba correctamente la foto asi que lo cambie a este) 
            return '/storage/' . ltrim($this->profile_photo_path, '/');
            //return Storage::disk('public')->url($this->profile_photo_path);
        }

        return asset('images/DefaultPerfil.jpg');
    }
    // helpers de rol
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    /**
     * Accessor conveniente que devuelve el nombre del rol.
     */
    public function getRoleNameAttribute()
    {
        return $this->rol?->nombre ?? null;
    }

    public function isAdmin(): bool
    {
        return $this->rol?->nombre === self::ROLE_ADMIN;
    }

    public function isOrganization(): bool
    {
        return $this->rol?->nombre === self::ROLE_ORG;
    }

    public function isUser(): bool
    {
        return $this->rol?->nombre === self::ROLE_USER;
    }

    public function casos()
    {
        return $this -> hasMany(Caso::class, 'idUsuario');
    }

    public function historias()
    {
        return $this->hasMany(Historia::class);
    }
}