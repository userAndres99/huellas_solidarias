<?php
namespace App\Services;

use GuzzleHttp\Client;

class SightengineService
{
    protected Client $client;
    protected string $user;
    protected string $secret;

    public function __construct()
    {
        $this->client = new Client(['base_uri' => 'https://api.sightengine.com/1.0/']);
        $this->user = config('services.sightengine.user') ?: env('SIGHTENGINE_USER', '');
        $this->secret = config('services.sightengine.secret') ?: env('SIGHTENGINE_SECRET', '');
    }

    /**
     * chequea una imagen usando la API de Sightengine
     * @param string $pathOrUrl
     * @param array $models
     * @return array
     */
    public function checkImage(string $pathOrUrl, array $models = []) : array
    {
        $models = $models ?: config('moderation.sightengine_models', ['nudity','offensive','wad','celebrities']);

        $multipart = [
            ['name' => 'models', 'contents' => implode(',', $models)],
            ['name' => 'api_user', 'contents' => $this->user],
            ['name' => 'api_secret', 'contents' => $this->secret],
        ];

        if (filter_var($pathOrUrl, FILTER_VALIDATE_URL)) {
            $multipart[] = ['name' => 'media', 'contents' => $pathOrUrl];
        } else {
            // archivo local
            if (!file_exists($pathOrUrl)) {
                throw new \InvalidArgumentException("File not found: {$pathOrUrl}");
            }
            $multipart[] = ['name' => 'media', 'contents' => fopen($pathOrUrl, 'r')];
        }

        $res = $this->client->post('check.json', [
            'multipart' => $multipart,
            'timeout' => 60,
        ]);

        $body = (string) $res->getBody();
        $decoded = json_decode($body, true) ?: [];
        return $decoded;
    }
}
