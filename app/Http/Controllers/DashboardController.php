<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Caso;
use App\Models\SolicitudVerificacion;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use App\Services\FeliwayScraper;
use App\Services\MapfreScraper;
use App\Services\OceanScraper;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();

        $misPublicaciones = Caso::where('idUsuario', $userId)
            ->orderBy('fechaPublicacion', 'desc')
            ->get()
            ->map(function ($c) {
                $c->fotoAnimal = $c->fotoAnimal ? Storage::url($c->fotoAnimal) : null;
                return $c;
            });

        $cached = [];

        // Check para notificaciones de solicitud de verificación
        $notif = SolicitudVerificacion::where('user_id', $userId)
            ->whereIn('status', ['approved', 'rejected'])
            ->where('notified_user', false)
            ->orderBy('updated_at', 'desc')
            ->first();

        $verificationNotification = null;
        if ($notif) {
            $message = $notif->status === 'approved'
                ? 'Tu solicitud para representar a una organización fue aprobada.'
                : 'Tu solicitud para representar a una organización fue rechazada.';

            if ($notif->response_message) {
                $message .= ' ' . $notif->response_message;
            }

            $verificationNotification = [
                'message' => $message,
                'status' => $notif->status,
            ];

            // marcar como notificado para que solo se muestre una vez
            $notif->notified_user = true;
            $notif->save();
        }

        return Inertia::render('Dashboard', [
            'misPublicaciones' => $misPublicaciones,
            'scrapedItems' => $cached,
            'verificationNotification' => $verificationNotification,
        ]);
    }
}