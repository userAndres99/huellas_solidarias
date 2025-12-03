<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user) {
            $userData = $user->loadMissing(['organizacion.mp_cuenta'])->toArray();
            $userData['unread_notifications_count'] = $user->unreadNotifications()->count();
            $userData['recent_notifications'] = $user->notifications()
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($n) {
                    return [
                        'id' => $n->id,
                        'data' => $n->data,
                        'read_at' => $n->read_at,
                        'created_at' => $n->created_at,
                    ];
                });

            // Calcular contadores persistentes de mensajes no leídos desde actividad_usuarios.ultimo_visto
            try {
                // Intentar usar vistas por-conversacion en actividad_conversaciones
                $globalLastSeen = DB::table('actividad_usuarios')->where('usuario_id', $user->id)->value('ultimo_visto');

                // Mensajes privados: usar (actividad_conversaciones.ultimo_visto, actividad_usuarios.ultimo_visto)
                $private = DB::table('messages as m')
                    ->leftJoin('actividad_conversaciones as ac', function ($join) use ($user) {
                        $join->on('ac.usuario_id', DB::raw($user->id))
                            ->whereRaw("ac.clave = concat('u_', m.sender_id)");
                    })
                    ->leftJoin('actividad_usuarios as au', function ($join) use ($user) {
                        $join->on('au.usuario_id', DB::raw($user->id));
                    })
                    ->select('m.sender_id', DB::raw('count(*) as cnt'))
                    ->where('m.receiver_id', $user->id)
                    ->where('m.sender_id', '<>', $user->id)
                    ->whereRaw("m.created_at > COALESCE(ac.ultimo_visto, au.ultimo_visto, '1970-01-01')")
                    ->groupBy('m.sender_id')
                    ->get();

                // Mensajes de grupos donde el usuario es miembro (contar por group_id)
                $groups = [];
                try {
                    $groups = Group::getGroupsForUser($user)->pluck('id')->toArray();
                } catch (\Throwable $_) { $groups = []; }

                $groupCounts = collect([]);
                if (!empty($groups)) {
                    $groupCounts = DB::table('messages as m')
                        ->leftJoin('actividad_conversaciones as ac', function ($join) use ($user) {
                            $join->on('ac.usuario_id', DB::raw($user->id))
                                ->whereRaw("ac.clave = concat('g_', m.group_id)");
                        })
                        ->leftJoin('actividad_usuarios as au', function ($join) use ($user) {
                            $join->on('au.usuario_id', DB::raw($user->id));
                        })
                        ->select('m.group_id', DB::raw('count(*) as cnt'))
                        ->whereIn('m.group_id', $groups)
                        ->whereRaw("m.created_at > COALESCE(ac.ultimo_visto, au.ultimo_visto, '1970-01-01')")
                        ->where('m.sender_id', '<>', $user->id)
                        ->groupBy('m.group_id')
                        ->get();
                }

                $unreadBy = [];
                foreach ($private as $p) {
                    $k = (string) ($p->sender_id);
                    $unreadBy[$k] = (int) $p->cnt;
                }
                foreach ($groupCounts as $g) {
                    $k = 'g_' . $g->group_id;
                    $unreadBy[$k] = (int) $g->cnt;
                }

                $userData['mensajes_no_leidos_total'] = array_sum($unreadBy);
                $userData['mensajes_no_leidos_por'] = $unreadBy;
            } catch (\Throwable $e) {
                Log::warning('Error calculando mensajes no leidos persistentes: ' . $e->getMessage());
                $userData['mensajes_no_leidos_total'] = 0;
                $userData['mensajes_no_leidos_por'] = [];
            }
        } else {
            $userData = null;
        }

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $userData,
            ],

            // debug
            'conversations' => Auth::id() ? tap(Conversation::getConversationsForSidebar(Auth::user()), function ($c) use ($user) {
                try {
                    $summary = collect($c->toArray())->map(fn($x) => [
                        'id' => $x['id'] ?? null,
                        'is_group' => $x['is_group'] ?? null,
                        'last_message_date' => $x['last_message_date'] ?? $x['created_at'] ?? null,
                    ])->values()->take(20)->toArray();
                    Log::info('INERTIA_CONVERSATIONS_ORDER', ['user_id' => $user?->id ?? null, 'conversations' => $summary]);
                } catch (\Throwable $e) {
                   
                }
            }) : [],

            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}