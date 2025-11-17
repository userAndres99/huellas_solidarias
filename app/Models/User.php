<?php

namespace App\Models;

use App\Notifications\CustomVerifyEmail;
use App\Notifications\CustomResetPassword;
use App\Models\Rol;
use App\Models\Organizacion;
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
        'email_verified_at',
        'password',
        'is_admin',
        'profile_photo_path', 
        'apellido', 
        'rol_id',
        'organizacion_id',
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
     * Relacion con la organizacion a la que pertenece el usuario 
     */
    public function organizacion()
    {
        return $this->belongsTo(Organizacion::class, 'organizacion_id');
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

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_users');
    }

    public static function getUsersExceptUser(User $user)
    {
        // Se usa para excluir al usuario y filtrar sus conversaciones
        $userId = $user->id;
        //Crea una consulta sobre la tabla users y pide: todos los campos del usuario, el texto del ultimo mensaje, la fecha de creación de ese mensaje
        // Evita que el usuario vea su propia cuenta en la lista de contactos
        //Si el usuario NO es admin no puede ver usuarios bloqueados. Si SI es admin, se ignora este filtro y puede ver a todos.
        $query = User::select(['users.*', 'messages.message as last_message', 'messages.created_at as last_message_date'])
        ->where('users.id', '!=', $userId)
        ->when(!$user->is_admin, function($query){
            $query->whereNull('users.blocked_at');
        })
        // Se une la tabla conversations con users, busca conversaciones donde el usuario actual esté involucrado
        ->leftJoin('conversations', function($join) use ($userId){
            $join->on('conversations.user_id1', '=', 'users.id')
            ->where('conversations.user_id2', '=', $userId)
            ->orWhere(function($query) use ($userId){
                $query->on('conversations.user_id2', '=', 'users.id')
                ->where('conversations.user_id1', '=', $userId);
            });
        })
        // Esto toma el último mensaje de esa conversacion, para poder msotrarlo en el sidebar (tipo "último mensaje enviado")
        
        ->leftJoin('messages', 'messages.id', '=', 'conversations.last_message_id')
        /**
         * Esto determina cómo se muestran los contactos:
         * Los bloqueados (si los hay ) van al final
         * Luego, los que tienen mensajes recientes primero
         * Si no hay mensajes, ordena alfabeticamente por nombre
         */
        ->orderByRaw('IFNULL(users.blocked_at, 1)')
        ->orderBy('messages.created_at', 'desc')
        ->orderBy('users.name')
        ;

        //dd($query->toSql());

        return $query->get();
    }

    public function toConversationArray()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_group' => false,
            'is_user' => true,
            'is_admin'=>(bool) $this->is_admin,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'blocked_at' => $this->blocked_at,
            'last_message' => $this->last_message,
            'last_message_date' => $this->last_message_date,
        ];
    }
}