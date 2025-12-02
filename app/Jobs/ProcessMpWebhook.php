<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\MpWebhookReceipt;
use App\Models\MpCuenta;
use App\Models\Donacion;
use Illuminate\Support\Facades\Notification;
use App\Notifications\NewDonationNotification;

class ProcessMpWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $receipt;

    /**
     * crea una nueva instancia del trabajo.
     *
     * @return void
     */
    public function __construct(MpWebhookReceipt $receipt)
    {
        $this->receipt = $receipt;
    }

    /**
     * Ejecuta el trabajo.
     *
     * @return void
     */
    public function handle()
    {
        $receipt = $this->receipt->fresh();
        if (! $receipt) return;

        $payload = $receipt->raw_payload ?? [];

        // Intenta determinar el id del recurso MP (id de pago / id de orden de comerciante)
        $resourceId = $receipt->resource_id;
        if (empty($resourceId)) {
            $resourceId = $payload['data']['id'] ?? $payload['id'] ?? null;
        }

        if (! $resourceId) {
            Log::warning('ProcessMpWebhook: no resource id found', ['receipt_id' => $receipt->id]);
            $receipt->processed = true;
            $receipt->save();
            return;
        }

        // Prefiere el token de la organización si podemos encontrar un MpCuenta con user_id coincidente
        $mpCuenta = null;
        $userId = $payload['user_id'] ?? null;
        if ($userId) {
            $mpCuenta = MpCuenta::where('mp_user_id', $userId)->first();
        }

        $token = env('MP_INTEGRATOR_ACCESS_TOKEN');
        if ($mpCuenta && $mpCuenta->access_token) {
            $token = $mpCuenta->access_token;
        }

        try {
            // Primer intento: obtener usando resourceId
            $endpoint = "https://api.mercadopago.com/v1/payments/{$resourceId}";
            $response = Http::withToken($token)->acceptJson()->get($endpoint);

            // Si el primer intento devuelve 404 y el payload contiene un data.id diferente, intenta con ese
            if ($response->status() === 404) {
                $dataId = $payload['data']['id'] ?? null;
                if ($dataId && (string)$dataId !== (string)$resourceId) {
                    Log::info('ProcessMpWebhook: first fetch 404, retrying with data.id', ['receipt_id' => $receipt->id, 'data_id' => $dataId]);
                    $endpoint2 = "https://api.mercadopago.com/v1/payments/{$dataId}";
                    $response2 = Http::withToken($token)->acceptJson()->get($endpoint2);
                    if ($response2->ok()) {
                        $response = $response2;
                        $resourceId = $dataId; // se actualiza resourceId para uso posterior
                    } else {
                        $response = $response2;
                    }
                }
            }

            if ($response->ok()) {
                $body = $response->json();
                // Guarda el recurso obtenido en raw_payload para inspección posterior
                $payload['_mp_fetched'] = $body;
                // persiste el payload obtenido en el recibo
                $receipt->raw_payload = $payload;

                // Crea o actualiza un registro Donacion
                try {
                    $amount = $body['transaction_amount'] ?? $body['transaction_details']['total_paid_amount'] ?? null;
                    $status = $body['status'] ?? null;
                    // fallback de comisión de marketplace: calcular desde env si no está presente
                    $marketplaceFee = null;
                    if (isset($body['marketplace_fee'])) {
                        $marketplaceFee = $body['marketplace_fee'];
                    } elseif ($amount) {
                        $percent = floatval(env('MP_MARKETPLACE_FEE_PERCENT', 5));
                        $marketplaceFee = round($amount * ($percent / 100), 2);
                    }

                    $organizacionId = $mpCuenta->organizacion_id ?? null;

                    $moneda = $body['currency_id'] ?? $body['currency'] ?? null;
                    $emailDonante = $body['payer']['email'] ?? $body['payer_email'] ?? null;

                    $donacion = Donacion::updateOrCreate(
                        ['mp_payment_id' => (string) $resourceId],
                        [
                            'organizacion_id' => $organizacionId,
                            'monto' => $amount,
                            'comision_marketplace' => $marketplaceFee,
                            'estado' => $status,
                            'payload_crudo' => $body,
                            'moneda' => $moneda,
                            'email_donante' => $emailDonante,
                        ]
                    );

                    // Opcionalmente establece fecha_disponible si MP la proporciona
                    if (isset($body['date_approved'])) {
                        $donacion->fecha_disponible = $body['date_approved'];
                        $donacion->save();
                    }

                    // marcar recibo como procesado
                    $receipt->processed = true;
                    $receipt->save();

                    Log::info('ProcessMpWebhook: payment fetched, stored and Donacion created/updated', ['receipt_id' => $receipt->id, 'payment_id' => $resourceId, 'donacion_id' => $donacion->id]);

                    // Enviar notificación a los usuarios asociados a la organización
                    try {
                        // intentar obtener un nombre legible del donante
                        $donorName = null;
                        if (!empty($body['payer'])) {
                            $p = $body['payer'];
                            $parts = [];
                            if (!empty($p['first_name'])) $parts[] = $p['first_name'];
                            if (!empty($p['last_name'])) $parts[] = $p['last_name'];
                            if (!empty($p['nickname']) && empty($parts)) $parts[] = $p['nickname'];
                            if (!empty($p['email']) && empty($parts)) $parts[] = $p['email'];
                            if (!empty($parts)) $donorName = implode(' ', $parts);
                        }

                        // fallback al campo email_donante o null
                        if (empty($donorName)) $donorName = $donacion->email_donante ?? null;

                        // obtener todos los usuarios que pertenecen a esta organización (users.organizacion_id == organizacion.id)
                        $users = \App\Models\User::where('organizacion_id', $donacion->organizacion_id)->get();
                        if ($users->isNotEmpty()) {
                            Notification::send($users, new NewDonationNotification($donacion, $donorName));
                        } else {
                            // como fallback, si existe un owner/creador registrado en la tabla organizaciones, notificar a ese usuario
                            try {
                                $org = \App\Models\Organizacion::find($donacion->organizacion_id);
                                if ($org && $org->usuario_creador_id) {
                                    $owner = \App\Models\User::find($org->usuario_creador_id);
                                    if ($owner) Notification::send($owner, new NewDonationNotification($donacion, $donorName));
                                }
                            } catch (\Throwable $_) {}
                        }
                    } catch (\Throwable $e) {
                        Log::warning('ProcessMpWebhook: failed to send donation notification: ' . $e->getMessage(), ['donacion_id' => $donacion->id]);
                    }

                    return;
                } catch (\Exception $e) {
                    Log::error('ProcessMpWebhook: error saving Donacion: ' . $e->getMessage(), ['receipt_id' => $receipt->id]);
                    // dejar processed en false para permitir reintento
                }
                return;
            }

            Log::warning('ProcessMpWebhook: failed to fetch payment', ['status' => $response->status(), 'body' => $response->body(), 'receipt_id' => $receipt->id]);

            // Si ambos intentos de obtención fallaron y estamos en sandbox, intenta construir Donacion desde raw_payload
            if (env('MP_MODE') === 'sandbox') {
                try {
                    Log::info('ProcessMpWebhook: attempting sandbox fallback to create Donacion from raw_payload', ['receipt_id' => $receipt->id]);

                    // Intenta extraer campos sensibles del payload
                    $dataId = $payload['data']['id'] ?? $payload['id'] ?? $resourceId;
                    $amount = $payload['transaction_amount'] ?? $payload['data']['transaction_amount'] ?? ($payload['amount'] ?? null);
                    // Valores de respaldo si no están presentes
                    $amount = $amount ?? ($payload['_mp_fetched']['transaction_amount'] ?? null);
                    $moneda = $payload['currency_id'] ?? ($payload['_mp_fetched']['currency_id'] ?? null) ?? 'ARS';
                    $emailDonante = $payload['payer']['email'] ?? $payload['payer_email'] ?? ($payload['_mp_fetched']['payer']['email'] ?? null) ?? null;

                    $organizacionId = $mpCuenta->organizacion_id ?? null;

                    $marketplaceFee = null;
                    if ($amount) {
                        $percent = floatval(env('MP_MARKETPLACE_FEE_PERCENT', 5));
                        $marketplaceFee = round($amount * ($percent / 100), 2);
                    }

                    $donacion = Donacion::updateOrCreate(
                        ['mp_payment_id' => (string) $dataId],
                        [
                            'organizacion_id' => $organizacionId,
                            'monto' => $amount,
                            'comision_marketplace' => $marketplaceFee,
                            'estado' => $payload['action'] ?? 'unknown',
                            'payload_crudo' => $payload,
                            'moneda' => $moneda,
                            'email_donante' => $emailDonante,
                        ]
                    );

                    $receipt->processed = true;
                    $receipt->save();

                    Log::info('ProcessMpWebhook: sandbox fallback created Donacion', ['receipt_id' => $receipt->id, 'donacion_id' => $donacion->id]);
                    return;
                } catch (\Exception $e) {
                    Log::error('ProcessMpWebhook: sandbox fallback failed: ' . $e->getMessage(), ['receipt_id' => $receipt->id]);
                }
            }
        } catch (\Exception $e) {
            Log::error('ProcessMpWebhook: exception fetching payment: ' . $e->getMessage(), ['receipt_id' => $receipt->id]);
        }

        // marcar processed en false para reintento posterior
        $receipt->processed = false;
        $receipt->save();
    }
}
