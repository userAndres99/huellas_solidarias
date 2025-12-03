<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Evento;
use Carbon\Carbon;

class EventController extends Controller
{
    /**
     * Mostrar un evento públicamente (para usuarios que reciben notificaciones)
     * Si el evento fue borrado por la organización, devolvemos un status 'cancelado'
     * Si el evento existe pero ya finalizó, devolvemos status 'finalizado'
     */
    public function show($id)
    {
        $e = Evento::find($id);

        if (! $e) {
            return Inertia::render('Eventos/Show', [
                'event' => null,
                'status' => 'cancelado',
            ]);
        }

        $now = Carbon::now();
        $status = 'active';
        if ($e->ends_at && $e->ends_at->lt($now)) {
            $status = 'finalizado';
        }

        return Inertia::render('Eventos/Show', [
            'event' => [
                'id' => $e->id,
                'title' => $e->titulo,
                'description' => $e->descripcion,
                'start' => $e->starts_at,
                'end' => $e->ends_at,
                'lat' => $e->lat,
                'lng' => $e->lng,
                'image_url' => $e->image_path ? '/storage/' . ltrim($e->image_path, '/') : null,
                'organizacion' => $e->organizacion ? ['id' => $e->organizacion->id, 'name' => $e->organizacion->nombre ?? $e->organizacion->name ?? null] : null,
            ],
            'status' => $status,
        ]);
    }
}
