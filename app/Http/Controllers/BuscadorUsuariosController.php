<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class BuscadorUsuariosController extends Controller
{
    /**
     * Buscar usuarios por nombre o por nombre de la organización.
     */
    public function search(Request $request)
    {
        $q = trim($request->query('q', ''));

        if ($q === '') {
            return response()->json(['data' => []]);
        }

        $users = User::with('organizacion')
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhere('email', 'like', "%{$q}%")
                      ->orWhereHas('organizacion', function ($q2) use ($q) {
                          $q2->where('nombre', 'like', "%{$q}%");
                      });
            })
            ->limit(10)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'organizacion' => $user->organizacion ? ['id' => $user->organizacion->id, 'nombre' => $user->organizacion->nombre] : null,
                    'profile_photo_url' => $user->profile_photo_url,
                ];
            });

        return response()->json(['data' => $users]);
    }

    /**
     * Mostrar la página de perfil público de un usuario.
     */
    public function show(User $user, Request $request)
    {
        // Cargar organización y los últimos casos del usuario
        $user->load([
            'organizacion.mp_cuenta',
            'casos' => function ($q) {
                $q->orderBy('fechaPublicacion', 'desc')->limit(12);
            },
            'historias' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(12);
            },
        ]);

        //URL pública de la foto 
        $user->casos = $user->casos->map(function ($caso) {
            $arr = $caso->toArray();
            $url = $caso->fotoAnimal ? Storage::url($caso->fotoAnimal) : null;
            $arr['foto_url'] = $url;
            // también sobreescribimos fotoAnimal 
            $arr['fotoAnimal'] = $url;
            return $arr;
        });

        // Mapear historias para exponer URLs públicas de las imágenes
        $user->historias = $user->historias->map(function ($h) {
            $arr = $h->toArray();
            $arr['imagen_antes'] = $h->imagen_antes ? Storage::url($h->imagen_antes) : null;
            $arr['imagen_despues'] = $h->imagen_despues ? Storage::url($h->imagen_despues) : null;
            // incluir también información del usuario si es necesaria en frontend
            if ($h->user) {
                $arr['usuario'] = [
                    'id' => $h->user->id,
                    'name' => $h->user->name,
                    'profile_photo_url' => $h->user->profile_photo_path ? Storage::url($h->user->profile_photo_path) : $h->user->profile_photo_url,
                ];
            }
            return $arr;
        });

        $auth = $request->user();
        $isFollowing = $auth ? $auth->isFollowing($user) : false;
        $followersCount = $user->seguidores()->count();
        $followingCount = $user->siguiendo()->count();

        return Inertia::render('Users/VerPerfil', [
            'usuario' => $user,
            'is_following' => $isFollowing,
            'followers_count' => $followersCount,
            'following_count' => $followingCount,
        ]);
    }

    /**
     * Mostrar la lista de usuarios a los que sigue el usuario dado.
     */
    public function siguiendo(User $user)
    {
        $list = $user->siguiendo()->with('organizacion')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'profile_photo_url' => $u->profile_photo_url,
                'organizacion' => $u->organizacion ? ['id' => $u->organizacion->id, 'nombre' => $u->organizacion->nombre] : null,
            ];
        })->toArray();

        return Inertia::render('Users/Siguiendo', [
            'usuario' => $user,
            'siguiendo' => $list,
        ]);
    }

    /**
     * Mostrar la lista de usuarios que siguen al usuario dado.
     */
    public function seguidores(User $user)
    {
        $list = $user->seguidores()->with('organizacion')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'profile_photo_url' => $u->profile_photo_url,
                'organizacion' => $u->organizacion ? ['id' => $u->organizacion->id, 'nombre' => $u->organizacion->nombre] : null,
            ];
        })->toArray();

        return Inertia::render('Users/Seguidores', [
            'usuario' => $user,
            'seguidores' => $list,
        ]);
    }

    /**
     * Devuelve un usuario en formato JSON 
     */
    public function jsonShow(User $user)
    {
        $user->load('organizacion');

        $result = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'organizacion' => $user->organizacion ? ['id' => $user->organizacion->id, 'nombre' => $user->organizacion->nombre] : null,
            'profile_photo_url' => $user->profile_photo_url,
        ];

        return response()->json($result);
    }
}
