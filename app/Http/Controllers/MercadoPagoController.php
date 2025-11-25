<?php

namespace App\Http\Controllers;

use App\Models\MpCuenta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Crypt;

class MercadoPagoController extends Controller
{
    /**
     * Redirige al usuario a la página de autorización de Mercado Pago.
     */
    public function connect(Request $request)
    {
        $user = Auth::user();

        if (! $user || ! $user->organizacion_id) {
            return Redirect::route('profile.edit')->with('error', 'No perteneces a una organización válida.');
        }

        $clientId = config('app.mp_client_id', env('MP_CLIENT_ID')) ?: env('MP_CLIENT_ID');
        $redirectUri = env('MP_REDIRECT_URI');
        $scopes = env('MP_OAUTH_SCOPES', 'read payments write');

        // Construir URL de autorización
        try {
            $statePayload = json_encode([
                'organizacion_id' => $user->organizacion_id,
                'ts' => time(),
            ]);
            $state = Crypt::encryptString($statePayload);
        } catch (\Throwable $e) {
            Log::warning('Failed to encrypt MP oauth state', ['error' => $e->getMessage()]);
            $state = null;
        }

        $params = http_build_query(array_filter([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'scope' => $scopes,
            'state' => $state,
        ]));

        $authUrl = 'https://auth.mercadopago.com.ar/authorization?' . $params;

        return redirect()->away($authUrl);
    }

    /**
     * Desvincula (elimina) la cuenta de Mercado Pago asociada
     */
    public function disconnect(Request $request)
    {
        $user = Auth::user();

        if (! $user || ! $user->organizacion_id) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => 'No perteneces a una organización válida.'], 403);
            }

            return Redirect::route('profile.edit')->with('error', 'No perteneces a una organización válida.');
        }

        try {
            $mpCuenta = MpCuenta::where('organizacion_id', $user->organizacion_id)->first();
            if ($mpCuenta) {
                $mpCuenta->delete();
                Log::info('MpCuenta disconnected', ['organizacion_id' => $user->organizacion_id, 'mp_cuenta_id' => $mpCuenta->id]);
            }

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['success' => true, 'message' => 'Cuenta de Mercado Pago desvinculada. La organización no podrá recibir donaciones hasta que se vuelva a conectar una cuenta.']);
            }

            return Redirect::route('profile.edit')->with('success', 'Cuenta de Mercado Pago desvinculada. La organización no podrá recibir donaciones hasta que se vuelva a conectar una cuenta.');
        } catch (\Throwable $e) {
            Log::error('Error disconnecting MpCuenta', ['error' => $e->getMessage(), 'organizacion_id' => $user->organizacion_id ?? null]);
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => 'Ocurrió un error al desvincular la cuenta de Mercado Pago.'], 500);
            }

            return Redirect::route('profile.edit')->with('error', 'Ocurrió un error al desvincular la cuenta de Mercado Pago.');
        }
    }

    /**
     * Callback que recibe el 'code' y lo intercambia por tokens.
     */
    public function callback(Request $request)
    {
        $user = Auth::user();

        // try para determinar el organizacion_id. Preferir el usuario autenticado,
        $organizacionId = $user->organizacion_id ?? null;
        if (! $organizacionId && $request->has('state')) {
            try {
                $decrypted = Crypt::decryptString($request->get('state'));
                $payload = json_decode($decrypted, true);
                if (is_array($payload) && isset($payload['organizacion_id'])) {
                    $organizacionId = $payload['organizacion_id'];
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to decrypt MP oauth state', ['error' => $e->getMessage()]);
            }
        }

        if (! $organizacionId) {
            return Redirect::route('profile.edit')->with('error', 'Debes iniciar sesión y pertenecer a una organización para conectar Mercado Pago.');
        }

        $code = $request->get('code');
        if (! $code) {
            return Redirect::route('organizacion.index')->with('error', 'No se recibió el código de autorización.');
        }

        try {
            $response = Http::asForm()->post('https://api.mercadopago.com/oauth/token', [
                'client_id' => env('MP_CLIENT_ID'),
                'client_secret' => env('MP_CLIENT_SECRET'),
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => env('MP_REDIRECT_URI'),
            ]);

            if (! $response->successful()) {
                Log::error('MP OAuth token exchange failed', ['status' => $response->status(), 'body' => $response->body()]);
                return Redirect::route('organizacion.index')->with('error', 'Error al conectar con Mercado Pago.');
            }

            $data = $response->json();
            Log::info('MP OAuth token response', ['status' => $response->status(), 'body' => $data]);

            Log::info('Saving MP account for organizacion', [
                'organizacion_id' => $organizacionId,
                'auth_user_id' => $user->id ?? null,
                'auth_user_email' => $user->email ?? null,
            ]);

            $expiresAt = null;
            if (isset($data['expires_in'])) {
                $expiresAt = now()->addSeconds(intval($data['expires_in']));
            }

            try {
                $mpCuenta = MpCuenta::updateOrCreate(
                    ['organizacion_id' => $organizacionId],
                    [
                        'mp_user_id' => $data['user_id'] ?? null,
                        'access_token' => $data['access_token'] ?? null,
                        'refresh_token' => $data['refresh_token'] ?? null,
                        'token_type' => $data['token_type'] ?? null,
                        'expires_at' => $expiresAt,
                        'scopes' => $data['scope'] ?? null,
                        'meta' => $data,
                    ]
                );

                Log::info('MpCuenta saved', ['mp_cuenta_id' => $mpCuenta->id, 'organizacion_id' => $mpCuenta->organizacion_id, 'mp_user_id' => $mpCuenta->mp_user_id]);
            } catch (\Throwable $e) {
                Log::error('Error saving MpCuenta', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
                return Redirect::route('organizacion.index')->with('error', 'Error al guardar la cuenta de Mercado Pago.');
            }

            return Redirect::route('organizacion.index')->with('success', 'Cuenta de Mercado Pago conectada correctamente.');

        } catch (\Throwable $e) {
            Log::error('MP OAuth callback exception', ['error' => $e->getMessage()]);
            return Redirect::route('organizacion.index')->with('error', 'Ocurrió un error al conectar con Mercado Pago.');
        }
    }
}
