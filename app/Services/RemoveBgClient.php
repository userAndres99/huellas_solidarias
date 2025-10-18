<?php
namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class RemoveBgClient
{
    protected Client $http;
    protected ?string $apiKey;

    public function __construct()
    {
        $this->http = new Client(['base_uri' => 'https://api.remove.bg/']);
        $this->apiKey = env('REMOVEBG_API_KEY');
    }

    /**
     * Remove background from a local file.
     * Returns full physical path to the new no-bg file (storage_path('app/public/...')) or null on error.
     */
    public function removeBackgroundFromFile(string $filePath): ?string
    {
        if (!$this->apiKey) {
            Log::error('RemoveBg: REMOVEBG_API_KEY missing');
            return null;
        }
        if (!file_exists($filePath)) {
            Log::error("RemoveBg: file not found: {$filePath}");
            return null;
        }

        try {
            $res = $this->http->post('v1.0/removebg', [
                'multipart' => [
                    [
                        'name' => 'image_file',
                        'contents' => fopen($filePath, 'r'),
                        'filename' => basename($filePath),
                    ],
                    [
                        'name' => 'size',
                        'contents' => 'auto',
                    ],
                    // opcional: 'bg_color' o 'bg_image' si quisieras
                ],
                'headers' => [
                    'X-Api-Key' => $this->apiKey,
                ],
                'timeout' => 60,
                'connect_timeout' => 10,
            ]);

            $status = $res->getStatusCode();
            $body = $res->getBody()->getContents();

            if ($status !== 200) {
                Log::error("RemoveBg: unexpected status {$status}: " . $body);
                return null;
            }

            // remove.bg devuelve PNG (transparencia)
            $ext = 'png';
            $fileName = 'no-bg-' . Str::random(10) . '.' . $ext;
            $rel = 'foto_animales_nobg/' . $fileName;

            // Guardar en storage/public
            Storage::disk('public')->put($rel, $body);

            $fullPath = storage_path('app/public/' . $rel);
            Log::info("RemoveBg: saved no-bg image to {$fullPath}");

            return $fullPath;
        } catch (\Throwable $e) {
            Log::error("RemoveBg error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Opcional: remove background from remote URL
     */
    public function removeBackgroundFromUrl(string $imageUrl): ?string
    {
        if (!$this->apiKey) {
            Log::error('RemoveBg: REMOVEBG_API_KEY missing');
            return null;
        }

        try {
            $res = $this->http->post('v1.0/removebg', [
                'multipart' => [
                    ['name' => 'image_url', 'contents' => $imageUrl],
                    ['name' => 'size', 'contents' => 'auto'],
                ],
                'headers' => ['X-Api-Key' => $this->apiKey],
                'timeout' => 60,
            ]);

            if ($res->getStatusCode() !== 200) {
                Log::error("RemoveBg URL: unexpected status " . $res->getStatusCode() . ' body: ' . $res->getBody());
                return null;
            }

            $body = $res->getBody()->getContents();
            $ext = 'png';
            $fileName = 'no-bg-' . Str::random(10) . '.' . $ext;
            $rel = 'foto_animales_nobg/' . $fileName;
            Storage::disk('public')->put($rel, $body);
            $fullPath = storage_path('app/public/' . $rel);

            Log::info("RemoveBg: saved no-bg image (from url) to {$fullPath}");
            return $fullPath;
        } catch (\Throwable $e) {
            Log::error("RemoveBg::removeBackgroundFromUrl error: " . $e->getMessage());
            return null;
        }
    }
}
