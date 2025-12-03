<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = (int) $request->query('per_page', 15);
        $notifs = $user->notifications()->latest()->paginate($perPage);
        return response()->json($notifs);
    }

    public function markRead(Request $request, $id)
    {
        $n = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $n->markAsRead();
        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request)
    {
        $u = $request->user();
        $u->unreadNotifications->markAsRead();
        return response()->json(['ok' => true]);
    }

    /**
     * borrar todas las notificaciones del usuario
     */
    public function destroyAll(Request $request)
    {
        $user = $request->user();
        // delete all notifications (read and unread)
        $user->notifications()->delete();
        return response()->json(['ok' => true]);
    }

    /**
     * Borrar una notificación específica del usuario autenticado.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $n = $user->notifications()->where('id', $id)->first();
        if (! $n) {
            return response()->json(['ok' => false, 'message' => 'Notificación no encontrada'], 404);
        }
        try {
            $n->delete();
            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'message' => 'Error al borrar la notificación'], 500);
        }
    }
}
