<?php
namespace App\Http\Controllers;
use App\Models\Evento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Auth;

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
                    'start' => $e->starts_at,
                    'end' => $e->ends_at,
                    'lat' => $e->lat,
                    'lng' => $e->lng,
                    'image_url' => $e->image_url,
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

        // opcional: notificar

        return redirect()->route('organizacion.index')->with('success', 'Evento creado con éxito');
    }

    public function create()
    {
        // Renderiza el formulario de creación de evento (JSX Inertia)
        return Inertia::render('Organizacion/CreateEvento');
    }
}