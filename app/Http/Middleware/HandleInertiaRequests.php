<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;
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

            'conversations' => Auth::id() ? Conversation::getConversationsForSidebar(Auth::user()) : [],

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