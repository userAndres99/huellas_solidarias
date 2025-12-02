<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Conversation;

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