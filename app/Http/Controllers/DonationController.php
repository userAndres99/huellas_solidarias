<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\Organizacion;
use App\Models\MpCuenta;

class DonationController extends Controller
{
    /**
     * crea una preferencia de pago en Mercado Pago para una donación a una organización.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'organizacion_id' => ['required', 'integer'],
            'monto' => ['required', 'numeric', 'min:1'],
            'payer_email' => ['nullable', 'email'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $organizacion = Organizacion::find($data['organizacion_id']);
        if (! $organizacion) {
            return response()->json(['message' => 'Organización no encontrada'], 422);
        }

        $amount = round(floatval($data['monto']), 2);

        $preference = [
            'items' => [
                [
                    'title' => 'Donación a: ' . ($organizacion->nombre ?? 'Organización'),
                    'quantity' => 1,
                    'unit_price' => $amount,
                    'currency_id' => 'ARS',
                ]
            ],
            'payer' => [],
            'auto_return' => 'approved',
            'back_urls' => [
                'success' => rtrim(config('app.url'), '/') . '/donaciones/resultado?status=success',
                'failure' => rtrim(config('app.url'), '/') . '/donaciones/resultado?status=failure',
                'pending' => rtrim(config('app.url'), '/') . '/donaciones/resultado?status=pending',
            ],
        ];

        if (! empty($data['payer_email'])) {
            $preference['payer'] = ['email' => $data['payer_email']];
        }

        // Preferir usar el access_token de la organización para que MP haga el split (marketplace_fee)
        $mpCuenta = MpCuenta::where('organizacion_id', $organizacion->id)->first();
        $usingOrgToken = false;
        $mpToken = env('MP_INTEGRATOR_ACCESS_TOKEN'); 

        if ($mpCuenta && $mpCuenta->access_token) {
            $mpToken = $mpCuenta->access_token;
            $usingOrgToken = true;

            // calcular marketplace_fee según porcentaje de env
            $percent = floatval(env('MP_MARKETPLACE_FEE_PERCENT', 5));
            $marketplaceFee = round($amount * ($percent / 100), 2);
            // agregar marketplace_fee a la preferencia para que MP reparta automáticamente
            $preference['marketplace_fee'] = $marketplaceFee;
        }

        $endpoint = 'https://api.mercadopago.com/checkout/preferences';

        try {
            $response = Http::withToken($mpToken)
                ->acceptJson()
                ->post($endpoint, $preference);

            // si usamos token de organización y recibimos 401, intentamos refrescar token y reintentar una vez
            if ($response->status() === 401 && $usingOrgToken && $mpCuenta && $mpCuenta->refresh_token) {
                Log::info('MP preference 401, intentando refrescar token de la organización', ['organizacion_id' => $organizacion->id]);
                $refreshed = $this->refreshMpToken($mpCuenta);
                if ($refreshed && $mpCuenta->access_token) {
                    $response = Http::withToken($mpCuenta->access_token)
                        ->acceptJson()
                        ->post($endpoint, $preference);
                }
            }

            if ($response->status() === 201 || $response->ok()) {
                $body = $response->json();
                return response()->json([
                    'init_point' => $body['init_point'] ?? null,
                    'sandbox_init_point' => $body['sandbox_init_point'] ?? null,
                    'id' => $body['id'] ?? null,
                ]);
            }

            Log::warning('MP preference creation failed', ['status' => $response->status(), 'body' => $response->body(), 'using_org_token' => $usingOrgToken]);
            return response()->json(['message' => 'Error al crear la preferencia de pago', 'details' => $response->json()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating MP preference: ' . $e->getMessage(), ['exception' => $e, 'organizacion_id' => $organizacion->id]);
            return response()->json(['message' => 'Error interno al procesar la donación'], 500);
        }
    }

    /**
     * Refresca el token OAuth de Mercado Pago para una cuenta y actualiza `mp_cuentas`.
     * Devuelve true si se actualizó correctamente.
     */
    protected function refreshMpToken(MpCuenta $mpCuenta)
    {
        try {
            $endpoint = 'https://api.mercadopago.com/oauth/token';
            $clientId = env('MP_CLIENT_ID');
            $clientSecret = env('MP_CLIENT_SECRET');

            if (! $clientId || ! $clientSecret) {
                Log::error('MP client credentials missing for refresh');
                return false;
            }

            $response = Http::asForm()->post($endpoint, [
                'grant_type' => 'refresh_token',
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'refresh_token' => $mpCuenta->refresh_token,
            ]);

            if (! $response->ok()) {
                Log::warning('Refresh token request failed', ['status' => $response->status(), 'body' => $response->body()]);
                return false;
            }

            $body = $response->json();
            // actualizar campos relevantes
            $mpCuenta->access_token = $body['access_token'] ?? $mpCuenta->access_token;
            $mpCuenta->refresh_token = $body['refresh_token'] ?? $mpCuenta->refresh_token;
            $mpCuenta->token_type = $body['token_type'] ?? $mpCuenta->token_type;
            if (! empty($body['expires_in'])) {
                $mpCuenta->expires_at = now()->addSeconds(intval($body['expires_in']));
            }
            if (! empty($body['scope'])) {
                $mpCuenta->scopes = $body['scope'];
            }
            $mpCuenta->save();

            Log::info('MP access token refreshed', ['organizacion_id' => $mpCuenta->organizacion_id]);
            return true;
        } catch (\Exception $e) {
            Log::error('Error refreshing MP token: ' . $e->getMessage(), ['exception' => $e, 'mp_cuenta_id' => $mpCuenta->id ?? null]);
            return false;
        }
    }
}
