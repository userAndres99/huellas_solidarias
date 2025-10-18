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
use App\Services\RemoveBgClient;

class CasoController extends Controller
{
    // Devuelve JSON (para el mapa-listado por fetch)
    public function index(Request $request)
    {
        if ($request->wantsJson()) {
            $casos = Caso::where('estado', 'activo')
                ->select(['id','idUsuario','tipoAnimal','descripcion','situacion','sexo','tamano','ciudad','latitud','longitud','telefonoContacto','fechaPublicacion','fotoAnimal'])
                ->orderBy('fechaPublicacion', 'desc')
                ->get()
                ->map(function ($caso) {
                    $caso->fotoAnimal = $caso->fotoAnimal ? Storage::url($caso->fotoAnimal) : null;
                    return $caso;
                });

            return response()->json($casos);
        }

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
            'sexo' => 'nullable|in:Macho,Hembra',
            'tamano' => 'nullable|in:Chico,Mediano,Grande',
            'ciudad' => 'required|string|max:100',
            'ciudad_id' => 'nullable|string|max:100',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'telefonoContacto' => ['nullable','regex:/^\d+$/','min:6','max:30'],
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
            'sexo' => $request->sexo,
            'tamano' => $request->tamano,
            'ciudad' => $request->ciudad,
            'ciudad_id' => $request->ciudad_id ?? null,
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
            'telefonoContacto' => $request->telefonoContacto,
            'fechaPublicacion' => now(),
            'estado' => 'activo',
        ]);

        $situ = strtolower($caso->situacion);

        // si es "abandonado" -> subir a Nyckel (job)
        if ($situ === 'abandonado' && $caso->fotoAnimal) {
            UploadToNyckel::dispatchSync($caso);
            return redirect()->route('casos.create')->with('success', 'Caso creado exitosamente');
        }

        // si es "perdido" -> quitar fondo (solo para la comparacion) y buscar similares
        if ($situ === 'perdido' && $caso->fotoAnimal) {
            $noBgTempPath = null;
            try {
                $ny = app(NyckelClient::class);
                $rm = app(RemoveBgClient::class);

                // ruta física de la imagen original
                $filePath = storage_path('app/public/' . $caso->fotoAnimal);

                // $noBgFullPath = null;   (si queremos usar la imagen original podemos descomentar
                // esto y comentar lo de abajo)
                // Intentamos generar una versión sin fondo (temporal) usando remove.bg
                try {
                   $noBgFullPath = $rm->removeBackgroundFromFile($filePath);   //esto comentar y descomentar lo de arriba
                } catch (\Throwable $e) {
                    Log::warning("RemoveBgClient threw: " . $e->getMessage());
                    $noBgFullPath = null;
                }

                if ($noBgFullPath && file_exists($noBgFullPath)) {
                    $fileToSearch = $noBgFullPath;
                    $noBgTempPath = $noBgFullPath; 
                    Log::info("Usando imagen sin fondo para búsqueda Nyckel: {$noBgFullPath}");
                } else {
                    // fallback: usar la original si remove.bg falla (como son 50 pruebas gratis por las dudas lo dejo)
                    $fileToSearch = $filePath;
                    Log::warning("Remove.bg falló o devolvió null, usando imagen original para búsqueda: {$filePath}");
                }

                // Llamada a Nyckel con la ruta del archivo 
                $raw = $ny->searchByImageBytes($fileToSearch, 100, true);
                Log::info('Nyckel search raw response for caso ' . $caso->id . ': ' . json_encode($raw));

                //la respuesta
                $rawMatches = $raw;
                if (isset($raw['results'])) $rawMatches = $raw['results'];
                if (isset($raw['matches'])) $rawMatches = $raw['matches'];

                $matches = [];
                foreach ($rawMatches as $r) {
                    $sampleId = $r['sampleId'] ?? $r['id'] ?? null;
                    $external = $r['externalId'] ?? $r['external_id'] ?? null;
                    $distance = isset($r['distance']) ? (float)$r['distance'] : null;
                    $rawScore = isset($r['score']) ? (float)$r['score'] : null;
                    $rawSimilarity = isset($r['similarity']) ? (float)$r['similarity'] : null;
                    $data = $r['data'] ?? null;

                    // calcular score (0..1) a partir de diferente input
                    $score = null;
                    if ($rawSimilarity !== null) {
                        // si viniera 0..100
                        $score = max(0.0, min(100.0, $rawSimilarity)) / 100.0;
                    } elseif ($rawScore !== null) {
                        // si rawScore está en 0..1 o 0..100
                        if ($rawScore > 1.0) {
                            $score = max(0.0, min(100.0, $rawScore)) / 100.0;
                        } else {
                            $score = max(0.0, min(1.0, $rawScore));
                        }
                    } elseif ($distance !== null) {
                        if ($distance <= 1.0) {
                            $score = max(0.0, min(1.0, 1.0 - $distance));
                        } else {
                            //si Nyckel devuelve >1
                            $score = max(0.0, min(1.0, 1.0 - ($distance / 4.0)));
                        }
                    }

                    $similarityPct = $score !== null ? ($score * 100.0) : ($rawSimilarity ?? null);

                    $localCaso = null;
                    if ($external && preg_match('/caso_(\d+)/', $external, $m)) {
                        $localCaso = Caso::find((int)$m[1]);
                    }

                    $matches[] = [
                        'sampleId'   => $sampleId,
                        'externalId' => $external,
                        'distance'   => $distance,
                        'score'      => $score,          // 0..1
                        'similarity' => $similarityPct,  // 0..100
                        'data'       => $data,
                        'localCaso'  => $localCaso,
                    ];
                }

                // aplicar en porcentaje (94%) 
                // el porcentaje que tiene que tener la imagen para mostrarla podemos cambiarla como veamos mejor
                $thresholdPct = 94;
                $filtered = array_filter($matches, function ($m) use ($thresholdPct) {
                    return isset($m['similarity']) && $m['similarity'] >= $thresholdPct;
                });

                // ordenar descendente por score (nulls al final)
                usort($filtered, function ($a, $b) {
                    $sa = $a['score'] ?? -1;
                    $sb = $b['score'] ?? -1;
                    return ($sb <=> $sa);
                });

                // limpiar archivo temporal no-bg (porque la usamos temp nada mas la foto sin fondo)
                if ($noBgTempPath && file_exists($noBgTempPath)) {
                    $keep = filter_var(env('REMOVEBG_KEEP_NO_BG', false), FILTER_VALIDATE_BOOLEAN);
                    if (!$keep) {
                        $rel = str_replace(storage_path('app/public/'), '', $noBgTempPath);
                        if ($rel) {
                            Storage::disk('public')->delete($rel);
                            Log::info("Archivo no-bg temporal eliminado: {$rel}");
                        }
                    } else {
                        Log::info("Archivo no-bg temporal conservado por REMOVEBG_KEEP_NO_BG=true: {$noBgTempPath}");
                    }
                }

                return Inertia::render('Casos/PerdidoResults', [
                    'caso' => $caso,
                    'matches' => array_values($filtered),
                ]);
            } catch (\Exception $e) {
                Log::error("Error buscando similares en Nyckel para caso {$caso->id}: " . $e->getMessage());

                // intentar eliminar temp si algo quedó
                try {
                    if (!empty($noBgTempPath) && file_exists($noBgTempPath)) {
                        $rel = str_replace(storage_path('app/public/'), '', $noBgTempPath);
                        if ($rel) Storage::disk('public')->delete($rel);
                    }
                } catch (\Throwable $ex) {
                    Log::warning("No se pudo eliminar temp no-bg: " . $ex->getMessage());
                }

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