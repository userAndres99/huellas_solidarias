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
            'buscarCoincidencias' => 'sometimes|boolean',
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

        // si es "abandonado" -> subir a Nyckel y llevar al dashboard
        if ($situ === 'abandonado' && $caso->fotoAnimal) {
            UploadToNyckel::dispatchSync($caso);
            return redirect()->route('dashboard')->with('success', 'Caso creado exitosamente');
        }

        //solo intentar buscar coincidencias si el usuario marca el check
        $buscarCoincidencias = $request->boolean('buscarCoincidencias');

        if ($situ === 'perdido' && $caso->fotoAnimal && $buscarCoincidencias) {
            $noBgTempPath = null;
            try {
                $ny = app(NyckelClient::class);
                $rm = app(RemoveBgClient::class);

                // ruta física de la imagen original
                $filePath = storage_path('app/public/' . $caso->fotoAnimal);

                // Intentamos generar una version sin fondo (temporal)
                try {
                    $noBgFullPath = $rm->removeBackgroundFromFile($filePath);
                } catch (\Throwable $e) {
                    Log::warning("RemoveBgClient threw: " . $e->getMessage());
                    $noBgFullPath = null;
                }

                if ($noBgFullPath && file_exists($noBgFullPath)) {
                    $fileToSearch = $noBgFullPath;
                    $noBgTempPath = $noBgFullPath;
                    Log::info("Usando imagen sin fondo para búsqueda Nyckel: {$noBgFullPath}");
                } else {
                    //usar la original si remove.bg falla
                    $fileToSearch = $filePath;
                    Log::warning("Remove.bg falló o devolvió null, usando imagen original para búsqueda: {$filePath}");
                }

                // Llamada a Nyckel con la ruta del archivo 
                $raw = $ny->searchByImageBytes($fileToSearch, 100, true);
                Log::info('Nyckel search raw response for caso ' . $caso->id . ': ' . json_encode($raw));

                // normalizar respuesta
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
                        $score = max(0.0, min(100.0, $rawSimilarity)) / 100.0;
                    } elseif ($rawScore !== null) {
                        if ($rawScore > 1.0) {
                            $score = max(0.0, min(100.0, $rawScore)) / 100.0;
                        } else {
                            $score = max(0.0, min(1.0, $rawScore));
                        }
                    } elseif ($distance !== null) {
                        if ($distance <= 1.0) {
                            $score = max(0.0, min(1.0, 1.0 - $distance));
                        } else {
                            // si Nyckel devuelve >1
                            $score = max(0.0, min(1.0, 1.0 - ($distance / 4.0)));
                        }
                    }

                    $similarityPct = $score !== null ? ($score * 100.0) : ($rawSimilarity ?? null);

                    // si la coincidencia apunta a un caso local, buscamos 
                    $localCasoData = null;
                    if ($external && preg_match('/caso_(\d+)/', $external, $m)) {
                        $found = Caso::find((int)$m[1]);
                        if ($found) {
                            $localCasoData = [
                                'id' => $found->id,
                                'descripcion' => $found->descripcion,
                                'ciudad' => $found->ciudad,
                                'situacion' => $found->situacion,
                                'fotoAnimal' => $found->fotoAnimal ? Storage::url($found->fotoAnimal) : null,
                                'latitud' => $found->latitud,
                                'longitud' => $found->longitud,
                                'fechaPublicacion' => $found->fechaPublicacion,
                                'tipoAnimal' => $found->tipoAnimal,
                            ];
                        }
                    }

                    $matches[] = [
                        'sampleId'   => $sampleId,
                        'externalId' => $external,
                        'distance'   => $distance,
                        'score'      => $score,
                        'similarity' => $similarityPct,
                        'data'       => $data,
                        'localCaso'  => $localCasoData,
                    ];
                }

                // aplicar en porcentaje 
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

                // convertir foto del caso buscado a URL para el render
                $caso->fotoAnimal = $caso->fotoAnimal ? Storage::url($caso->fotoAnimal) : null;

                // limpiar archivo temporal no-bg (porque la usamos temporalmente)
                if (!empty($noBgTempPath) && file_exists($noBgTempPath)) {
                    try {
                        $keep = filter_var(env('REMOVEBG_KEEP_NO_BG', false), FILTER_VALIDATE_BOOLEAN);
                        if (!$keep) {
                            // normalizar separadores para evitar problemas en Windows
                            $storagePublicPath = str_replace('\\', '/', storage_path('app/public/'));
                            $noBgNormalized = str_replace('\\', '/', $noBgTempPath);

                            // obtener ruta relativa dentro de disk('public')
                            $rel = null;
                            if (strpos($noBgNormalized, $storagePublicPath) === 0) {
                                $rel = substr($noBgNormalized, strlen($storagePublicPath));
                            } else {
                                // fallback: intentar basename (si por alguna razón no está en storage/public)
                                $rel = basename($noBgNormalized);
                            }

                            if ($rel) {
                                // delete devuelve true/false
                                if (Storage::disk('public')->delete($rel)) {
                                    Log::info("Archivo no-bg temporal eliminado: {$rel}");
                                } else {
                                    Log::warning("No se pudo eliminar archivo no-bg (posible que ya no exista): {$rel}");
                                }
                            }
                        } else {
                            Log::info("Archivo no-bg temporal conservado por REMOVEBG_KEEP_NO_BG=true: {$noBgTempPath}");
                        }
                    } catch (\Throwable $ex) {
                        Log::warning("Error al intentar eliminar temp no-bg: " . $ex->getMessage());
                    }
                }

                return Inertia::render('Casos/PerdidoResults', [
                    'caso' => $caso,
                    'matches' => array_values($filtered),
                    'flash' => ['success' => 'Caso creado exitosamente'],
                ]);
            } catch (\Exception $e) {
                Log::error("Error buscando similares en Nyckel para caso {$caso->id}: " . $e->getMessage());

                // intentar eliminar temp si algo quedo
                try {
                    if (!empty($noBgTempPath) && file_exists($noBgTempPath)) {
                        $rel = str_replace(storage_path('app/public/'), '', $noBgTempPath);
                        if ($rel) Storage::disk('public')->delete($rel);
                    }
                } catch (\Throwable $ex) {
                    Log::warning("No se pudo eliminar temp no-bg: " . $ex->getMessage());
                }

                // aseguramos convertir foto del caso cuando mostramos el error tambien
                $caso->fotoAnimal = $caso->fotoAnimal ? Storage::url($caso->fotoAnimal) : null;

                return Inertia::render('Casos/PerdidoResults', [
                    'caso' => $caso,
                    'matches' => [],
                    'error' => 'No se pudieron obtener coincidencias (error externo).',
                    'flash' => ['success' => 'Caso creado exitosamente'],
                ]);
            }
        }

        // fallback normal (si no pidió buscar coincidencias o no era 'perdido')
        return redirect()->route('dashboard')->with('success', 'Caso creado exitosamente');
    }

    // Devuelve JSON de un solo caso (para detalle para fetch)
    public function show($id)
{
    $caso = Caso::where('id', $id)
        ->where('estado', 'activo')
        ->with('comentarios.user', 'comentarios.respuesta')
        ->first();

    if (!$caso) {
        return response()->json(['message' => 'Caso no encontrado'], 404);
    }

    $caso->fotoAnimal = $caso->fotoAnimal ? Storage::url($caso->fotoAnimal) : null;

    return response()->json($caso);
}

    public function json(Request $request)
    {
        // parametros de filtro / paginación
        $perPage = (int) $request->input('per_page', 9); // por defecto 9 por pagina (lo podemos cambiar)
        $tipo = $request->input('tipo', null);
        $ciudad = $request->input('ciudad', null);
        $situacion = $request->input('situacion', null);
        $sexo = $request->input('sexo', null);
        $tamano = $request->input('tamano', null);
        $ordenFecha = $request->input('ordenFecha', 'reciente'); // 'reciente' o 'antigua'

        $query = Caso::with('usuario.organizacion')
            ->where('estado', 'activo');

        // aplicar filtros si vienen
        if ($tipo) {
            $query->where('tipoAnimal', $tipo);
        }

        if ($ciudad) {
            $query->where('ciudad', 'LIKE', '%' . $ciudad . '%');
        }

        if ($situacion) {
            $query->where('situacion', $situacion);
        }

        if ($sexo) {
            $query->where('sexo', $sexo);
        }

        if ($tamano) {
            $query->where('tamano', $tamano);
        }

        // orden
        if ($ordenFecha === 'antigua') {
            $query->orderBy('fechaPublicacion', 'asc');
        } else {
            $query->orderBy('fechaPublicacion', 'desc');
        }

        // select 
        $query->select(['id','idUsuario','tipoAnimal','descripcion','situacion','sexo','tamano','ciudad','latitud','longitud','telefonoContacto','fechaPublicacion','fotoAnimal']);

        // paginar
        $casos = $query->paginate($perPage);

        // transformar la coleccion interna 
        $casos->getCollection()->transform(function ($c) {
            return [
                'id' => $c->id,
                'tipoAnimal' => $c->tipoAnimal ?? $c->tipo_animal ?? null,
                'descripcion' => $c->descripcion,
                'ciudad' => $c->ciudad,
                'situacion' => $c->situacion,
                'fechaPublicacion' => $c->fechaPublicacion ?? $c->created_at,
                'fotoAnimal' => $c->fotoAnimal ? Storage::url($c->fotoAnimal) : null,
                'latitud' => $c->latitud,
                'longitud' => $c->longitud,
                'usuario' => $c->usuario ? [
                    'id' => $c->usuario->id,
                    'name' => $c->usuario->name,
                    'profile_photo_url' => $c->usuario->profile_photo_url ?? ($c->usuario->profile_photo_path ? Storage::url($c->usuario->profile_photo_path) : null),
                    'organizacion' => $c->usuario->organizacion ? [
                        'id' => $c->usuario->organizacion->id,
                        'nombre' => $c->usuario->organizacion->nombre,
                    ] : null,
                ] : null,
            ];
        });

        return response()->json($casos);
    }

    /**
     * Cambiar estado de un caso (finalizar o cancelar).
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => ['required', 'in:finalizado,cancelado'],
        ]);

        $caso = Caso::where('id', $id)->where('estado', 'activo')->firstOrFail();

        // solo el autor puede cambiar
        if ($caso->idUsuario !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $caso->estado = $request->input('status');
        $caso->save();

        return response()->json(['success' => true, 'estado' => $caso->estado]);
    }
}