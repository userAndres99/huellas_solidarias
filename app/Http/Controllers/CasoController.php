<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Caso;
use Illuminate\Support\Facades\Auth;
class CasoController extends Controller
{
    //

    public function index()
    {
        $casos = Caso::where('estado', 'activo')-> get();
        return response()->json($casos);
    }


    public function store(Request $request)
    {
        $request -> validate([
            'fotoAnimal' => 'nullable|string|max:255',
            'tipoAnimal' => 'nullable|string|max:100',
            'descripcion' => 'required|strign',
            'situacion' => 'required|strign|max:100',
            'ciudad' => 'required|string|max:100',
            'telefonoContacto' => 'nullable|string|max:20',
        ]);

        Caso::create([
            'idUsuario' => Auth::id(),
            'fotoAnimal' => $request ->fotoAnimal,
            'tipoAnimal' => $request -> tipoAnimal,
            'descripcion' => $request ->descripcion,
            'situacion' => $request ->situacion,
            'ciudad' => $request ->ciudad,
            'latitud' => $request ->latitud,
            'longitud' => $request ->longitud,
            'telefonoContacto' => $request ->telefonoContacto,
            'fechaPublicacion' => now(),
            'estado' => 'activo',
        ]);

        return response()->json(['message' => 'Caso creado exitosamente'], 201);
    }
}
