<?php
namespace App\Http\Controllers;
use App\Models\Evento;
use App\Models\Organizacion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Auth;
use Illuminate\Support\Facades\Redirect;

class OrganizationController extends Controller
{
    public function index()
    {
        // return al frontend los eventos de la organización 
        $user = Auth::user();
        $events = Evento::where('organizacion_id', $user->id)->get();
        return Inertia::render('Organizacion/Index', [
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

        // opcional: notificar (tengo que hacerlo todavia)

        return redirect()->route('organizacion.index')->with('success', 'Evento creado con éxito');
    }

    public function create()
    {
        // Renderiza el formulario de creación de evento (JSX Inertia)
        return Inertia::render('Organizacion/CreateEvento');
    }

    public function show($id)
    {
        $user = Auth::user();
        $e = Evento::where('id', $id)->where('organizacion_id', $user->id)->firstOrFail();

        return Inertia::render('Organizacion/EventShow', [
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
}