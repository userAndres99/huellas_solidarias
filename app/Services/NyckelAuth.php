<?php
namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Throwable;

class NyckelAuth
{
    protected Client $http;
    protected string $tokenCacheKey = 'nyckel.access_token';
    protected string $tokenExpiresCacheKey = 'nyckel.access_token_expires_at';
    protected string $lockKey = 'nyckel.access_token_lock';

    public function __construct()
    {
        $this->http = new Client(['base_uri' => 'https://www.nyckel.com/']);
    }

    /**
     * Devuelve un access token valido (renueva si hace falta).
     *
     * @return string
     * @throws \Exception
     */
    public function getAccessToken(): string
    {
        // Si ya lo tenemos en cache, devolver
        $token = Cache::get($this->tokenCacheKey);
        if ($token) {
            return $token;
        }

        $lock = Cache::lock($this->lockKey, 10); 
        if ($lock->get()) {
            try {
                
                $token = Cache::get($this->tokenCacheKey);
                if ($token) {
                    return $token;
                }

                $clientId = env('NYCKEL_CLIENT_ID');
                $clientSecret = env('NYCKEL_CLIENT_SECRET');

                if (!$clientId || !$clientSecret) {
                    throw new \Exception('Missing NYCKEL_CLIENT_ID or NYCKEL_CLIENT_SECRET in .env');
                }

                $resp = $this->http->post('connect/token', [
                    'headers' => [
                        'Content-Type' => 'application/x-www-form-urlencoded'
                    ],
                    'form_params' => [
                        'grant_type' => 'client_credentials',
                        'client_id' => $clientId,
                        'client_secret' => $clientSecret,
                    ],
                    'timeout' => 10,
                    'connect_timeout' => 5,
                ]);

                $body = json_decode((string)$resp->getBody(), true);
                if (!isset($body['access_token'])) {
                    Log::error('Nyckel token response missing access_token: ' . json_encode($body));
                    throw new \Exception('Nyckel token request failed');
                }

                $accessToken = $body['access_token'];
                $expiresIn = isset($body['expires_in']) ? (int)$body['expires_in'] : 3600;

                $ttl = max(30, $expiresIn - 30);
                Cache::put($this->tokenCacheKey, $accessToken, $ttl);

                Cache::put($this->tokenExpiresCacheKey, now()->addSeconds($ttl)->toDateTimeString(), $ttl);

                return $accessToken;

            } catch (Throwable $e) {
                Log::error('Nyckel token fetch error: ' . $e->getMessage());
                // si fallo y hay token en cache (aunque expirado)
                $cached = Cache::get($this->tokenCacheKey);
                if ($cached) return $cached;
                throw $e;
            } finally {
                $lock->release();
            }
        } else {
            // si no conseguimos lock, esperamos un poco y leemos cache otra vez
            usleep(200000); // 200ms
            $token = Cache::get($this->tokenCacheKey);
            if ($token) return $token;
            //intentar obtener sin lock (puede fallar xd)
            return $this->getAccessToken();
        }
    }
}