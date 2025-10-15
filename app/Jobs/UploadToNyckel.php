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
        // ruta física del archivo guardado en storage/app/public/...
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

        try {
            /** @var NyckelAuth $auth */
            $auth = app(NyckelAuth::class);
            $token = $auth->getAccessToken();

            $client = new Client(['base_uri' => 'https://www.nyckel.com/']);

            Log::info("🔄 Intentando subir a Nyckel: caso_id={$this->caso->id}, archivo={$filePath}");

            $response = $client->post("v1/functions/{$functionId}/samples", [
                'headers' => [
                    'Authorization' => "Bearer {$token}",
                    'Accept' => 'application/json',
                ],
                'multipart' => [
                    [
                        'name'     => 'file', // Nyckel espera archivo en multipart 
                        'contents' => fopen($filePath, 'r'),
                        'filename' => basename($filePath),
                    ],
                    [
                        'name'     => 'externalId',
                        'contents' => "caso_{$this->caso->id}",
                    ],
                ],
                'timeout' => 30,
                'connect_timeout' => 10,
            ]);

            $body = json_decode((string)$response->getBody(), true);
            Log::info("✅ Respuesta Nyckel para caso {$this->caso->id}: " . json_encode($body));

            $sampleId = $body['id'] ?? $body['sampleId'] ?? null;
            if ($sampleId) {
                $this->caso->nyckel_sample_id = $sampleId;
                $this->caso->save();
                Log::info("✅ Sample guardado: caso_id={$this->caso->id} sampleId={$sampleId}");
            } else {
                Log::warning("⚠️ Nyckel subió pero no devolvió sampleId para caso {$this->caso->id}");
            }
        } catch (\Throwable $e) {
            Log::error("❌ Error subiendo a Nyckel caso {$this->caso->id}: " . $e->getMessage());
        }
    }
}