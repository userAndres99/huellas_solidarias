<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Caso;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CasoController extends Controller
{
    // Devuelve JSON (para el mapa-listado por fetch)
    public function index(Request $request)
    {
        //devolvemos los casos como JSON (para fetch-mapa)
        if ($request->wantsJson()) {
            $casos = Caso::where('estado', 'activo')
                ->select(['id','idUsuario','tipoAnimal','descripcion','situacion','ciudad','latitud','longitud','telefonoContacto','fechaPublicacion','fotoAnimal'])
                ->orderBy('fechaPublicacion', 'desc')
                ->get()
                ->map(function ($caso) {
                    $caso->fotoAnimal = $caso->fotoAnimal ? Storage::url($caso->fotoAnimal) : null;
                    return $caso;
                });

            return response()->json($casos);
        }

        // Si no es peticion JSON, renderiza la pagina Inertia
        return Inertia::render('Casos/Index');
    }

    // usamos la vista Inertia para publicar
    public function create()
    {
        return Inertia::render('PublicarCaso');
    }

    public function store(Request $request)
    {
        $request->validate([
            'fotoAnimal' => 'nullable|image|max:10240',
            'tipoAnimal' => 'nullable|string|max:100',
            'descripcion' => 'required|string',
            'situacion' => 'required|string|max:100',
            'ciudad' => 'required|string|max:100',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'telefonoContacto' => 'nullable|string|max:20',
        ]);

        $path = null;
        if ($request->hasFile('fotoAnimal')) {
            $path = $request->file('fotoAnimal')->store('foto_animales', 'public');
        }

        $caso = Caso::create([
            'idUsuario' => Auth::id(),
            'fotoAnimal' => $path,
            'tipoAnimal' => $request->tipoAnimal,
            'descripcion' => $request->descripcion,
            'situacion' => $request->situacion,
            'ciudad' => $request->ciudad,
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
            'telefonoContacto' => $request->telefonoContacto,
            'fechaPublicacion' => now(),
            'estado' => 'activo',
        ]);

        return redirect()->route('casos.create')->with('success', 'Caso creado exitosamente');
    }

    // Devuelve JSON de un solo caso (para detalle para fetch)
    public function show(Caso $caso)
    {
        if ($caso->estado !== 'activo') {
            return response()->json(['message' => 'Not found'], 404);
        }

        $caso->fotoAnimal = $caso->fotoAnimal ? Storage::url($caso->fotoAnimal) : null;

        return response()->json($caso);
    }
}