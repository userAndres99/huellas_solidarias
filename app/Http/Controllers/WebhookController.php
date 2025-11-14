<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\MpWebhookReceipt;

class WebhookController extends Controller
{
    /**
     * funcion para manejar los webhooks de MercadoPago
     */
    public function mp(Request $request)
    {
        $raw = $request->getContent();
        $payload = $request->json()->all();

        $hash = hash('sha256', $raw);

        // Idempotencia: si ya procesamos esta carga útil, devolver 200
        if (MpWebhookReceipt::where('payload_hash', $hash)->exists()) {
            Log::info('Duplicate MP webhook received, ignoring', ['hash' => $hash]);
            return response('OK', 200);
        }

        $secret = env('MP_WEBHOOK_SECRET');
        $signature = null;
        $possibleHeaders = [
            'x-hub-signature',
            'x-meli-signature',
            'x-mercadopago-signature',
            'x-mercadopago-signature-sha256',
            'x-mp-signature',
        ];

        foreach ($possibleHeaders as $h) {
            if ($request->headers->has($h)) {
                $signature = $request->header($h);
                break;
            }
        }

        // determinar si permitimos la falta de firma en sandbox/local
        $allowMissingSignature = env('MP_MODE') === 'sandbox' || app()->environment(['local', 'testing']);

        if ($secret) {
            if (! $signature) {
                if ($allowMissingSignature) {
                    Log::warning('MP webhook secret configured but no signature header present — accepting in sandbox/local mode');
                } else {
                    Log::warning('MP webhook secret configured but no signature header present');
                    return response('Missing signature', 401);
                }
            } else {
                $sig = $signature;
                if (stripos($sig, 'sha256=') === 0) {
                    $sig = substr($sig, 7);
                } elseif (stripos($sig, 'sha256:') === 0) {
                    $sig = substr($sig, 7);
                }
                $sig = trim($sig);

                $computedHex = hash_hmac('sha256', $raw, $secret, false);
                $computedBin = hash_hmac('sha256', $raw, $secret, true);
                $computedBase64 = base64_encode($computedBin);

                if (! (hash_equals($computedHex, $sig) || hash_equals($computedBase64, $sig))) {
                    Log::warning('MP webhook signature mismatch', ['header' => $signature]);
                    return response('Invalid signature', 401);
                }
            }
        } else {
            if (! app()->environment(['local', 'testing']) && env('MP_MODE') !== 'sandbox') {
                Log::warning('No MP_WEBHOOK_SECRET configured while not in sandbox/local environment');
            }
        }

        $topic = $request->input('topic') ?? $payload['type'] ?? null;
        $resource = $request->input('resource') ?? ($payload['resource'] ?? null);
        $resourceId = $request->input('id') ?? ($payload['data']['id'] ?? $payload['id'] ?? null);

        // Persistir recibo para idempotencia y procesamiento posterior
        try {
            $receipt = MpWebhookReceipt::create([
                'topic' => $topic,
                'resource' => is_string($resource) ? $resource : json_encode($resource),
                'resource_id' => is_scalar($resourceId) ? (string) $resourceId : null,
                'payload_hash' => $hash,
                'raw_payload' => $payload,
                'received_at' => now(),
                'processed' => false,
            ]);

            Log::info('MP webhook stored', ['id' => $receipt->id, 'topic' => $topic, 'resource_id' => $resourceId]);
        } catch (\Exception $e) {
            Log::error('Error storing MP webhook receipt: ' . $e->getMessage());
            return response('Error', 500);
        }

        // Enviar trabajo para procesar el webhook de forma asíncrona (obtener detalles del pago y actualizar donación)
        try {
            \App\Jobs\ProcessMpWebhook::dispatch($receipt);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch ProcessMpWebhook job: ' . $e->getMessage(), ['receipt_id' => $receipt->id ?? null]);
        }

        return response('OK', 200);
    }
}
