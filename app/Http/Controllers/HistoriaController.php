<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Historia;
use Illuminate\Support\Facades\Storage;

class HistoriaController extends Controller
{
    //


    public function index(Request $request){
      if($request->wantsJson()){
        $historias = Historia::with('user:id,name')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function($historia){
            $historia->imagen_antes = $historia->imagen_antes ? Storage::url($historia->imagen_antes) : null;
            $historia->imagen_despues = $historia->imagen_despues ? Storage::url($historia->imagen_despues) : null;
            return $historia;
        });
        return response()->json($historias);
      }
      return Inertia::render('PublicarHistoria');
    }


    public function create(){
        return Inertia::render('PublicarHistoria');
    }


    public function store(Request $request){
        $request -> validate([
            'antes'=> 'required|image|mimes:jpg,png,jpeg|max:10240',
            'despues'=> 'required|image|mimes:jpg,png,jpeg|max:10240',
            'descripcion'=> 'required|string|max:255',
            'testimonio'=> 'required|string',
        ]);

        $antesPath = $request->file('antes')->store('historias', 'public');
        $despuesPath = $request->file('despues')->store('historias', 'public');

        $request->user()->historias()->create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'testimonio' => $request->testimonio,
            'imagen_antes' => $antesPath,
            'imagen_despues' => $despuesPath,
        ]);

        return back()->with('success', 'Historia de éxito creada exitosamente.');
    }


    public function show(Historia $historia){

        $historia->imagen_antes = $historia->imagen_antes ? Storage::url($historia->imagen_antes) : null;
        $historia->imagen_despues = $historia->imagen_despues ? Storage::url($historia->imagen_despues) : null;
        return response()->json($historia);
    }


    public function jsonIndex() {
    $historias = Historia::with('user:id,name')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function($historia){
            $historia->imagen_antes = $historia->imagen_antes ? Storage::url($historia->imagen_antes) : null;
            $historia->imagen_despues = $historia->imagen_despues ? Storage::url($historia->imagen_despues) : null;
            return $historia;
        });

    return response()->json($historias);
}

}
