<?php
namespace App\Http\Controllers;
use App\Models\Evento;
use App\Models\Donacion;
use App\Models\Organizacion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\NewEventoNotification;

class OrganizationController extends Controller
{
    public function index()
    {
        // return al frontend los eventos de la organización 
        $user = Auth::user();
        $events = Evento::where('organizacion_id', $user->id)->get();
    return Inertia::render('Organizacion/Eventos/Index', [
            'events' => $events->map(function($e){
                return [
                    'id' => $e->id,
                    'title' => $e->titulo,
                    'description' => $e->descripcion,
                    'start' => $e->starts_at,
                    'end' => $e->ends_at,
                    'lat' => $e->lat,
                    'lng' => $e->lng,
                    // ruta relativa para evitar depender de APP_URL/ngrok
                    'image_url' => $e->image_path ? '/storage/' . ltrim($e->image_path, '/') : null,
                ];
            })
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'nullable|string|max:100',
            'starts_at' => 'required|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'image' => 'nullable|image|max:4096',
        ]);

        $path = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('eventos', 'public');
        }

        $evento = Evento::create([
            'organizacion_id' => $request->user()->id,
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo' => $request->tipo,
            'starts_at' => $request->starts_at,
            'ends_at' => $request->ends_at,
            'lat' => $request->lat,
            'lng' => $request->lng,
            'image_path' => $path
        ]);

        // Notificar a los seguidores de la organización (si los hay)
        try {
            $author = $request->user();
            if ($author) {
                $followers = $author->seguidores()->get();
                if ($followers->isNotEmpty()) {
                    Notification::send($followers, new NewEventoNotification($evento));
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Error enviando notificaciones NewEvento: ' . $e->getMessage());
        }

        return redirect()->route('organizacion.index')->with('success', 'Evento creado con éxito');
    }

    public function create()
    {
    // Renderiza el formulario de creación de evento 
    return Inertia::render('Organizacion/Eventos/CreateEvento');
    }

    public function show($id)
    {
        $user = Auth::user();
        $e = Evento::where('id', $id)->where('organizacion_id', $user->id)->firstOrFail();

    return Inertia::render('Organizacion/Eventos/EventShow', [
            'event' => [
                'id' => $e->id,
                'title' => $e->titulo,
                'description' => $e->descripcion,
                'start' => $e->starts_at,
                'end' => $e->ends_at,
                'lat' => $e->lat,
                'lng' => $e->lng,
                'image_url' => $e->image_path ? '/storage/' . ltrim($e->image_path, '/') : null,
            ]
        ]);
    }

    /**
     * Mostrar el formulario de edición para un evento.
     */
    public function edit($id)
    {
        $user = Auth::user();
        $e = Evento::where('id', $id)->where('organizacion_id', $user->id)->firstOrFail();

        return Inertia::render('Organizacion/Eventos/CreateEvento', [
            'event' => [
                'id' => $e->id,
                'title' => $e->titulo,
                'description' => $e->descripcion,
                'start' => $e->starts_at,
                'end' => $e->ends_at,
                'lat' => $e->lat,
                'lng' => $e->lng,
                'tipo' => $e->tipo,
                'image_url' => $e->image_path ? '/storage/' . ltrim($e->image_path, '/') : null,
            ]
        ]);
    }

    /**
     * Procesar la actualización de un evento existente.
     */
    public function updateEvent(Request $request, $id)
    {
        $user = $request->user();
        $e = Evento::where('id', $id)->where('organizacion_id', $user->id)->firstOrFail();

        $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'nullable|string|max:100',
            'starts_at' => 'required|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'image' => 'nullable|image|max:4096',
            'remove_image' => 'nullable|boolean',
        ]);

        $path = $e->image_path;
        if ($request->hasFile('image')) {
            // nueva imagen, borrar la anterior si existe
            if ($e->image_path) {
                try { Storage::disk('public')->delete($e->image_path); } catch (\Throwable $ex) { Log::warning('Failed to delete old event image: '.$ex->getMessage()); }
            }
            $path = $request->file('image')->store('eventos', 'public');
        } elseif ($request->boolean('remove_image')) {
            // si el usuario solicitó eliminar la imagen existente
            if ($e->image_path) {
                try { Storage::disk('public')->delete($e->image_path); } catch (\Throwable $ex) { Log::warning('Failed to delete event image on remove request: '.$ex->getMessage()); }
            }
            $path = null;
        }

        $e->update([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo' => $request->tipo,
            'starts_at' => $request->starts_at,
            'ends_at' => $request->ends_at,
            'lat' => $request->lat,
            'lng' => $request->lng,
            'image_path' => $path,
        ]);

        return redirect()->route('organizacion.index')->with('success', 'Evento actualizado con éxito');
    }

    /**
     * eliminar un evento y su imagen (si tiene).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $e = Evento::where('id', $id)->where('organizacion_id', $user->id)->firstOrFail();

        if ($e->image_path) {
            try { Storage::disk('public')->delete($e->image_path); } catch (\Throwable $ex) { Log::warning('Failed to delete event image on destroy: '.$ex->getMessage()); }
        }

        $e->delete();

        return redirect()->route('organizacion.index')->with('success', 'Evento eliminado con éxito');
    }

    /**
     * Actualizar los datos de la organización asociada al usuario autenticado.
     * Solo permite modificar nombre, email, telefono y descripcion.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->organizacion_id) {
            return Redirect::back()->with('error', 'No pertenecés a una organización para editar.');
        }

        $org = Organizacion::findOrFail($user->organizacion_id);

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telefono' => 'nullable|string|max:50',
            'descripcion' => 'nullable|string',
        ]);

        $org->update([
            'nombre' => $validated['nombre'],
            'email' => $validated['email'] ?? $org->email,
            'telefono' => $validated['telefono'] ?? $org->telefono,
            'descripcion' => $validated['descripcion'] ?? $org->descripcion,
        ]);

        return Redirect::route('profile.edit')->with('success', 'Datos de la organización actualizados.');
    }

    /**
     * Página de estadísticas para la organizacion
     */
    public function estadisticas(Request $request)
    {
        $user = $request->user();

        // Filtro opcional por tipo de animal (Perro, Gato, Otro)
        $tipo = $request->query('tipo');
        $situacion = $request->query('situacion');
        $ciudad = $request->query('ciudad');

        $query = \App\Models\Caso::query();
        if (!empty($tipo)) {
            $allowed = ['Perro', 'Gato', 'Otro'];
            $normalized = ucfirst(strtolower($tipo));
            if (in_array($normalized, $allowed)) {
                $query->where('tipoAnimal', $normalized);
            }
        }

        if (!empty($situacion)) {
            $allowedSituacion = ['Adopcion', 'Abandonado', 'Perdido'];
            $normalizedS = ucfirst(strtolower($situacion));
            if (in_array($normalizedS, $allowedSituacion)) {
                $query->where('situacion', $normalizedS);
            }
        }

        if (!empty($ciudad)) {
            // Filtrar por la busqueda del usuario.
            $query->where('ciudad', $ciudad);
        }

        $counts = $query->selectRaw('estado, COUNT(*) as cnt')
            ->groupBy('estado')
            ->pluck('cnt', 'estado')
            ->toArray();

        // normalizar
        $data = [
            'activo' => isset($counts['activo']) ? (int)$counts['activo'] : 0,
            'finalizado' => isset($counts['finalizado']) ? (int)$counts['finalizado'] : 0,
            'cancelado' => isset($counts['cancelado']) ? (int)$counts['cancelado'] : 0,
        ];

        return Inertia::render('Organizacion/Estadisticas/Index', [
            'counts' => $data,
            'selectedTipo' => $tipo ?? '',
            'selectedSituacion' => $situacion ?? '',
            'selectedCiudad' => $ciudad ?? '',
        ]);
    }

    /**
     * Endpoint JSON que devuelve los counts (activo/finalizado/cancelado).
     */
    public function estadisticasData(Request $request)
    {
        $tipo = $request->query('tipo');
        $situacion = $request->query('situacion');
        $ciudad = $request->query('ciudad');

        $query = \App\Models\Caso::query();
        if (!empty($tipo)) {
            $allowed = ['Perro', 'Gato', 'Otro'];
            $normalized = ucfirst(strtolower($tipo));
            if (in_array($normalized, $allowed)) {
                $query->where('tipoAnimal', $normalized);
            }
        }

        if (!empty($situacion)) {
            $allowedSituacion = ['Adopcion', 'Abandonado', 'Perdido'];
            $normalizedS = ucfirst(strtolower($situacion));
            if (in_array($normalizedS, $allowedSituacion)) {
                $query->where('situacion', $normalizedS);
            }
        }

        if (!empty($ciudad)) {
            $query->where('ciudad', $ciudad);
        }

        $counts = $query->selectRaw('estado, COUNT(*) as cnt')
            ->groupBy('estado')
            ->pluck('cnt', 'estado')
            ->toArray();

        $data = [
            'activo' => isset($counts['activo']) ? (int)$counts['activo'] : 0,
            'finalizado' => isset($counts['finalizado']) ? (int)$counts['finalizado'] : 0,
            'cancelado' => isset($counts['cancelado']) ? (int)$counts['cancelado'] : 0,
        ];

        return response()->json(['counts' => $data]);
    }

    /**
     * Devuelve la serie anual de casos 
     */
    public function estadisticasYearsData(Request $request)
    {
        $tipo = $request->query('tipo');
        $situacion = $request->query('situacion');
        $ciudad = $request->query('ciudad');
        $period = $request->query('period', 'year'); 

        $query = \App\Models\Caso::query();
        if (!empty($tipo)) {
            $allowed = ['Perro', 'Gato', 'Otro'];
            $normalized = ucfirst(strtolower($tipo));
            if (in_array($normalized, $allowed)) {
                $query->where('tipoAnimal', $normalized);
            }
        }

        if (!empty($situacion)) {
            $allowedSituacion = ['Adopcion', 'Abandonado', 'Perdido'];
            $normalizedS = ucfirst(strtolower($situacion));
            if (in_array($normalizedS, $allowedSituacion)) {
                $query->where('situacion', $normalizedS);
            }
        }

        if (!empty($ciudad)) {
            $query->where('ciudad', $ciudad);
        }

        // Dependiendo de la granularidad, agrupamos distinto
        if ($period === 'month') {
            $rows = $query->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as period, COUNT(*) as cnt")
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        } elseif ($period === 'day') {
            $rows = $query->selectRaw("DATE(created_at) as period, COUNT(*) as cnt")
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        } elseif ($period === 'week') {
            $rows = $query->selectRaw("DATE_FORMAT(created_at, '%x-W%v') as period, COUNT(*) as cnt")
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        } else {
            // default
            $rows = $query->selectRaw('YEAR(created_at) as period, COUNT(*) as cnt')
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        }

        $series = $rows->map(function ($r) {
            return ['period' => (string)$r->period, 'total' => (int)$r->cnt];
        })->values();

        return response()->json(['series' => $series]);
    }

    /**
     * Mostrar las donaciones asociadas a la organización del usuario autenticado.
     */
    public function donaciones(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->organizacion_id) {
            return \Redirect::back()->with('error', 'No pertenecés a una organización.');
        }

        $perPage = 20;
        $donaciones = Donacion::where('organizacion_id', $user->organizacion_id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Transformar para el frontend
        $items = $donaciones->getCollection()->map(function ($d) {
            return [
                'id' => $d->id,
                'mp_payment_id' => $d->mp_payment_id,
                'monto' => (string) $d->monto,
                'comision_marketplace' => (string) $d->comision_marketplace,
                'estado' => $d->estado,
                'fecha_disponible' => $d->fecha_disponible ? $d->fecha_disponible->toDateTimeString() : null,
                'moneda' => $d->moneda,
                'email_donante' => $d->email_donante,
                'created_at' => $d->created_at->toDateTimeString(),
            ];
        })->values();

        $meta = [
            'current_page' => $donaciones->currentPage(),
            'last_page' => $donaciones->lastPage(),
            'per_page' => $donaciones->perPage(),
            'total' => $donaciones->total(),
        ];

        return Inertia::render('Organizacion/Donaciones/Index', [
            'donaciones' => [
                'data' => $items,
                'meta' => $meta,
            ],
        ]);
    }
}