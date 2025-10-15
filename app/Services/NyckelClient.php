<?php
namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class NyckelClient
{
    protected Client $client;
    protected string $functionId;
    protected NyckelAuth $auth;

    public function __construct(NyckelAuth $auth)
    {
        $this->client = new Client(['base_uri' => 'https://www.nyckel.com/']);
        $this->functionId = env('NYCKEL_FUNCTION_ID');
        $this->auth = $auth;
    }

    protected function headers(): array
    {
        $token = $this->auth->getAccessToken();
        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

    
    public function searchByUrl(string $imageUrl, int $sampleCount = 5, bool $includeData = false): array
    {
        if (!$this->functionId) {
            Log::error('NYCKEL_FUNCTION_ID missing');
            return ['error' => 'missing function id'];
        }

        try {
            $query = [];
            if ($sampleCount) $query['sampleCount'] = (int)$sampleCount;
            if ($includeData) $query['includeData'] = 'true';

            $resp = $this->client->post(
                "v1/functions/{$this->functionId}/invoke",
                [
                    'headers' => $this->headers(),
                    'query'   => $query,
                    'json'    => ['data' => $imageUrl],
                    'timeout' => 30,
                ]
            );

            return json_decode((string)$resp->getBody(), true) ?? [];
        } catch (\Throwable $e) {
            Log::error('Nyckel searchByUrl error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }


    public function searchByImageBytes(string $filePath, int $sampleCount = 5, bool $includeData = false): array
    {
        if (!$this->functionId) {
            Log::error('NYCKEL_FUNCTION_ID missing');
            return ['error' => 'missing function id'];
        }

        if (!file_exists($filePath)) {
            return ['error' => "file_not_found", 'message' => $filePath];
        }

        try {
            $query = [];
            if ($sampleCount) $query['sampleCount'] = (int)$sampleCount;
            if ($includeData) $query['includeData'] = 'true';

            $resp = $this->client->post(
                "v1/functions/{$this->functionId}/invoke",
                [
                    'headers' => $this->headers(),
                    'query'   => $query,
                    'multipart' => [
                        [
                            'name'     => 'data', 
                            'contents' => fopen($filePath, 'r'),
                            'filename' => basename($filePath),
                        ],
                    ],
                    'timeout' => 60,
                    'connect_timeout' => 10,
                ]
            );

            return json_decode((string)$resp->getBody(), true) ?? [];
        } catch (\Throwable $e) {
            Log::error('Nyckel searchByImageBytes error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
}