<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Caso;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Jobs\UploadToNyckel; 
use Log;

use App\Services\NyckelClient;

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

        $situ = strtolower($caso->situacion);

        if ($situ === 'abandonado' && $caso->fotoAnimal) {
            UploadToNyckel::dispatchSync($caso);
            return redirect()->route('casos.create')->with('success', 'Caso creado exitosamente');
        }

   if ($situ === 'perdido' && $caso->fotoAnimal) {
    try {
        // Obtener instancia de NyckelClient que usará NyckelAuth internamente
        $ny = app(\App\Services\NyckelClient::class);

        // ruta física del archivo en storage
        $filePath = storage_path('app/public/' . $caso->fotoAnimal);

        // pedimos hasta 100 matches y pedimos includeData para recibir la imagen si la API lo devuelve
        $raw = $ny->searchByImageBytes($filePath, 100, true);

        \Log::info('Nyckel search raw response for caso ' . $caso->id . ': ' . json_encode($raw));

        // raw podría ser un array de resultados directamente (según tus pruebas)
        $rawMatches = $raw;
        if (isset($raw['results'])) $rawMatches = $raw['results'];
        if (isset($raw['matches'])) $rawMatches = $raw['matches'];

        $matches = [];
        foreach ($rawMatches as $r) {
            $sampleId = $r['sampleId'] ?? $r['id'] ?? null;
            $external = $r['externalId'] ?? $r['external_id'] ?? null;
            $distance = isset($r['distance']) ? (float)$r['distance'] : (isset($r['score']) ? (float)$r['score'] : null);
            $data = $r['data'] ?? null;

            // convertimos distancia -> % similitud (distance 0 -> 100%)
            $similarity = null;
            if ($distance !== null) {
                if ($distance <= 1.0) {
                    $similarity = max(0, min(100, (1 - $distance) * 100));
                } else {
                    $similarity = max(0, min(100, 100 - ($distance * 100 / 4)));
                }
            }

            $localCaso = null;
            if ($external && preg_match('/caso_(\d+)/', $external, $m)) {
                $localCaso = Caso::find((int)$m[1]);
            }

            $matches[] = [
                'sampleId'   => $sampleId,
                'externalId' => $external,
                'distance'   => $distance,
                'similarity' => $similarity,
                'data'       => $data,
                'localCaso'  => $localCaso,
            ];
        }

        // filtrar por threshold >= 80%
        $threshold = 80;
        $filtered = array_filter($matches, function ($m) use ($threshold) {
            return isset($m['similarity']) && $m['similarity'] >= $threshold;
        });

        // ordenar descendente por similitud
        usort($filtered, function ($a, $b) {
            return ($b['similarity'] ?? 0) <=> ($a['similarity'] ?? 0);
        });

        return Inertia::render('Casos/PerdidoResults', [
            'caso' => $caso,
            'matches' => array_values($filtered),
        ]);
    } catch (\Exception $e) {
        \Log::error("Error buscando similares en Nyckel para caso {$caso->id}: " . $e->getMessage());
        return Inertia::render('Casos/PerdidoResults', [
            'caso' => $caso,
            'matches' => [],
            'error' => 'No se pudieron obtener coincidencias (error externo).',
        ]);
    }
}
        // fallback normal
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