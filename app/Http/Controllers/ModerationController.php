<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Services\SightengineService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ModerationController extends Controller
{
    /**
     * Moderar texto usando OpenModerator API
     */
    public function moderate(Request $request)
    {
        $request->validate([
            'texto' => 'required_without:image|string|max:5000',
        ]);

        $texto = $request->input('texto');

        $apiKey = env('OPEN_MODERATOR_API_KEY');
        if (! $apiKey) {
            return response()->json(['error' => 'OpenModerator API key not configured'], 500);
        }

        try {
            $payload = ['prompt' => $texto, 'config' => ['provider' => 'google-perspective-api']];

            $resp = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-api-key' => $apiKey,
            ])->timeout(10)->post('https://www.openmoderator.com/api/moderate/text', $payload);

            if (! $resp->successful()) {
                return response()->json(['error' => 'Moderation provider error'], 502);
            }

            $data = $resp->json();

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error('Moderation error: ' . $e->getMessage());
            return response()->json(['error' => 'Moderation request failed'], 500);
        }
    }

    /**
     * Moderar imagen subida (devuelve el resultado de Sightengine y una lista simplificada de detecciones)
     */
    public function moderateImage(Request $request, SightengineService $sight)
    {
        $request->validate([
            'image' => 'required|image|max:15360', // max 15MB
            'models' => 'nullable|string',
        ]);

        $file = $request->file('image');
        if (! $file || ! $file->isValid()) {
            return response()->json(['error' => 'Invalid image upload'], 422);
        }

        // usa el archivo temporal
        $path = $file->getRealPath();
        $models = $request->input('models') ? explode(',', $request->input('models')) : config('moderation.sightengine_models', []);

        try {
            $result = $sight->checkImage($path, $models);
        } catch (\Throwable $e) {
            Log::error('Sightengine error: ' . $e->getMessage());
            return response()->json(['error' => 'Moderation provider error'], 502);
        }

        // Construir una lista simplificada de detecciones basada en umbrales por modelo
        $thresholds = config('moderation.model_thresholds', []);
        $detections = [];

        // helper para verificar claves anidadas
        $checkValue = function($value) use (&$detections, $thresholds) {
            // $value es un array con 'key' y 'score
        };

        // Check para cada modelo relevante
        // nudity es para contenido sexual explícito
        if (isset($result['nudity'])) {
            $score = $result['nudity']['raw'] ?? ($result['nudity']['partial'] ?? 0);
            $th = $thresholds['nudity'] ?? 0.6;
            if ($score >= $th) $detections['nudity'] = $score;
            elseif ($score >= ($th * 0.6)) $detections['nudity_sus'] = $score;
        }

        // offensive contenido ofensivo
        if (isset($result['offensive'])) {
            $score = $result['offensive']['prob'] ?? 0;
            $th = $thresholds['offensive'] ?? 0.6;
            if ($score >= $th) $detections['offensive'] = $score;
            elseif ($score >= ($th * 0.6)) $detections['offensive_sus'] = $score;
        }

        // weapons para armas
        if (isset($result['weapon'])) {
            $weapon = $result['weapon'];
            $score = 0;

            // tomar el máximo score de clase como score de arma
            if (is_array($weapon) && isset($weapon['classes']) && is_array($weapon['classes'])) {
                $classes = $weapon['classes'];
                $max = 0;
                foreach ($classes as $k => $v) {
                    if (is_numeric($v) && $v > $max) $max = (float)$v;
                }
                $score = $max;

                // exponer clase específica como arma de fuego si está disponible
                if (isset($classes['firearm'])) {
                    $detections['weapon_firearm'] = (float)$classes['firearm'];
                }
            } elseif (is_numeric($weapon)) {
                $score = (float)$weapon;
            }

            $th = $thresholds['weapon'] ?? 0.5;
            if ($score >= $th) $detections['weapon'] = $score;
            elseif ($score >= ($th * 0.6)) $detections['weapon_sus'] = $score;
        }

        // violence para violencia
        if (isset($result['violence'])) {
            $score = $result['violence']['prob'] ?? 0;
            $th = $thresholds['violence'] ?? 0.5;
            if ($score >= $th) $detections['violence'] = $score;
            elseif ($score >= ($th * 0.6)) $detections['violence_sus'] = $score;
        }

        // gore para contenido sangriento
        if (isset($result['gore'])) {
            $score = $result['gore']['prob'] ?? (is_numeric($result['gore']) ? (float)$result['gore'] : 0);
            $th = $thresholds['gore'] ?? 0.5;
            if ($score >= $th) $detections['gore'] = $score;
            elseif ($score >= ($th * 0.6)) $detections['gore_sus'] = $score;
        }

        // retornar resultado completo y detecciones simplificadas
        return response()->json([
            'result' => $result,
            'detections' => $detections,
        ]);
    }
}
