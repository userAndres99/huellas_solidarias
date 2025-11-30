<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Historia;
use Illuminate\Support\Facades\Storage;
use App\Jobs\ModerateImageJob;

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

        $historia = $request->user()->historias()->create([
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'testimonio' => $request->testimonio,
            'imagen_antes' => $antesPath,
            'imagen_despues' => $despuesPath,
        ]);

        // dispatch jobs de moderación de imágenes
        try {
            $antesFull = Storage::disk('public')->path($antesPath);
            $despuesFull = Storage::disk('public')->path($despuesPath);

            ModerateImageJob::dispatch($antesFull, 'historia', $historia->id);
            ModerateImageJob::dispatch($despuesFull, 'historia', $historia->id);
        } catch (\Throwable $e) {
            // No bloquear la creación si falla el dispatch; solo loguear
            \Log::error('Error dispatching ModerateImageJob', ['err' => $e->getMessage()]);
        }

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

    /**
     * remover una historia de éxito
     */
    public function destroy(Request $request, Historia $historia)
    {
        // Solo el propietario puede eliminar su historia
        if ($request->user()->id !== $historia->user_id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        try {
            // Eliminar archivos si están presentes
            if ($historia->imagen_antes) {
                try { Storage::disk('public')->delete($historia->imagen_antes); } catch (\Throwable $e) { /* ignore */ }
            }
            if ($historia->imagen_despues) {
                try { Storage::disk('public')->delete($historia->imagen_despues); } catch (\Throwable $e) { /* ignore */ }
            }

            $historia->delete();

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            \Log::error('Error deleting historia', ['err' => $e->getMessage(), 'id' => $historia->id]);
            return response()->json(['message' => 'Error al eliminar la historia'], 500);
        }
    }

}
