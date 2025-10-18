<?php

namespace App\Jobs;

use App\Models\Caso;
use App\Services\NyckelAuth;
use GuzzleHttp\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UploadToNyckel implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Caso $caso;

    public function __construct(Caso $caso)
    {
        $this->caso = $caso;
    }

    public function handle(): void
    {
        $filePath = storage_path('app/public/' . $this->caso->fotoAnimal);

        if (!$this->caso->fotoAnimal || !file_exists($filePath)) {
            Log::error("❌ Archivo no encontrado para el caso {$this->caso->id}: {$filePath}");
            return;
        }

        $functionId = env('NYCKEL_FUNCTION_ID');
        if (!$functionId) {
            Log::error("❌ NYCKEL_FUNCTION_ID no configurado en .env");
            return;
        }

        // si la situación es 'abandonado' usamos ahora agregamos remove
        $fileToUpload = $filePath;
        if (strtolower($this->caso->situacion) === 'abandonado') {
            try {
                /** @var \App\Services\RemoveBgClient $rm */
                $rm = app(\App\Services\RemoveBgClient::class);
                $noBgPath = $rm->removeBackgroundFromFile($filePath);
                if ($noBgPath && file_exists($noBgPath)) {
                    $fileToUpload = $noBgPath;
                    Log::info("UploadToNyckel: usando imagen sin fondo {$noBgPath} para el caso {$this->caso->id}");
                } else {
                    Log::warning("UploadToNyckel: remove.bg falló; se subirá la original para caso {$this->caso->id}");
                }
            } catch (\Throwable $e) {
                Log::error("UploadToNyckel - error remove.bg: " . $e->getMessage());
            }
        }

        try {
            $auth = app(\App\Services\NyckelAuth::class);
            $token = $auth->getAccessToken();

            $client = new \GuzzleHttp\Client(['base_uri' => 'https://www.nyckel.com/']);
            Log::info("🔄 Intentando subir a Nyckel: caso_id={$this->caso->id}, archivo={$fileToUpload}");

            $response = $client->post("v1/functions/{$functionId}/samples", [
                'headers' => [
                    'Authorization' => "Bearer {$token}",
                    'Accept' => 'application/json',
                ],
                'multipart' => [
                    ['name' => 'file', 'contents' => fopen($fileToUpload, 'r'), 'filename' => basename($fileToUpload)],
                    ['name' => 'externalId', 'contents' => "caso_{$this->caso->id}"],
                ],
                'timeout' => 30,
                'connect_timeout' => 10,
            ]);

            $bodyRaw = (string) $response->getBody();
            $body = json_decode($bodyRaw, true) ?? [];
            Log::info("Nyckel response: " . $bodyRaw);

            $sampleId = $body['id'] ?? $body['sampleId'] ?? null;
            if (!$sampleId && isset($body[0])) {
                $sampleId = $body[0]['sampleId'] ?? $body[0]['id'] ?? null;
            }

            if ($sampleId) {
                $this->caso->nyckel_sample_id = $sampleId;
                $this->caso->save();
                Log::info("✅ Sample guardado: caso_id={$this->caso->id} sampleId={$sampleId}");
            } else {
                Log::warning("⚠️ Nyckel subió pero no devolvió sampleId para caso {$this->caso->id} - body: {$bodyRaw}");
            }

            // borrar el no-bg si no queremos guardarlo
            if ($fileToUpload !== $filePath) {
                $keep = filter_var(env('REMOVEBG_KEEP_NO_BG', false), FILTER_VALIDATE_BOOLEAN);
                if (!$keep) {
                    // ruta relativa en storage/public
                    $rel = str_replace(storage_path('app/public/'), '', $fileToUpload);
                    if ($rel) {
                        \Storage::disk('public')->delete($rel);
                        Log::info("RemoveBg: archivo temporal eliminado: {$rel}");
                    }
                }
            }

        } catch (\Throwable $e) {
            Log::error("❌ Error subiendo a Nyckel caso {$this->caso->id}: " . $e->getMessage());
        }
    }
}