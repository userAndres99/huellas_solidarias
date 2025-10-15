<?php


namespace App\Jobs;


use App\Models\Caso;
use GuzzleHttp\Client;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Log;


class UploadToNyckel implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;


    protected $caso;


    public function __construct(Caso $caso)
    {
        $this->caso = $caso;
    }


   public function handle(): void
    {
        $url = asset(\Illuminate\Support\Facades\Storage::url($this->caso->fotoAnimal));
        \Log::info("Intentando subir a Nyckel: caso_id={$this->caso->id}, url={$url}");


        $functionId = env('NYCKEL_FUNCTION_ID');
        $token = env('NYCKEL_ACCESS_TOKEN');


        if (!$functionId || !$token) {
            \Log::error("Faltan credenciales NYCKEL_FUNCTION_ID o NYCKEL_ACCESS_TOKEN en el .env");
            return;
        }


        try {
            $client = new \GuzzleHttp\Client(['base_uri' => 'https://www.nyckel.com/']);


            $response = $client->post("v1/functions/".env('NYCKEL_FUNCTION_ID')."/samples", [
        'headers' => [
            'Authorization' => 'Bearer ' . env('NYCKEL_ACCESS_TOKEN'),
            'Accept' => 'application/json',
        ],
        'multipart' => [
            [
                'name' => 'file', // nombre que Nyckel espera
                'contents' => fopen(storage_path('app/public/' . $this->caso->fotoAnimal), 'r'),
                'filename' => basename($this->caso->fotoAnimal)
            ],
            [
                'name' => 'externalId',
                'contents' => "caso_{$this->caso->id}"
            ],
        ],
        'timeout' => 30
    ]);


        $body = json_decode((string) $response->getBody(), true);
        \Log::info("Respuesta Nyckel: " . json_encode($body));


        $sampleId = $body['id'] ?? $body['sampleId'] ?? null;
        if ($sampleId) {
            $this->caso->nyckel_sample_id = $sampleId;
            $this->caso->save();
            \Log::info("✅ Subida exitosa a Nyckel, sampleId={$sampleId}");
        } else {
            \Log::warning("⚠️ Nyckel respondió sin sampleId para caso {$this->caso->id}");
        }


    } catch (\Exception $e) {
        \Log::error("❌ Error subiendo a Nyckel caso {$this->caso->id}: " . $e->getMessage());
    }
}
}