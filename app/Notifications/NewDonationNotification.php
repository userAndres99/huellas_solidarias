<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Donacion;

class NewDonationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $donacion;
    protected $donorName;

    public function __construct(Donacion $donacion, ?string $donorName = null)
    {
        $this->donacion = $donacion;
        $this->donorName = $donorName;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        $amount = $this->donacion->monto;
        $currency = $this->donacion->moneda ?? 'ARS';
        $donor = $this->donorName ?: ($this->donacion->email_donante ?? 'Alguien');
        // Permitir forzar URL local mediante variable de entorno LOCAL_APP_URL
        $localBase = env('LOCAL_APP_URL') ?: 'http://127.0.0.1:8000';
        // route(..., [], false) devuelve la ruta relativa (/organizacion/donaciones)
        $relative = route('organizacion.donaciones', [], false);
        $url = rtrim($localBase, '/') . $relative;

        return [
            'type' => 'new_donation',
            'donacion_id' => $this->donacion->id,
            'organizacion_id' => $this->donacion->organizacion_id,
            'amount' => $amount,
            'currency' => $currency,
            'donor' => $donor,
            'message' => sprintf('%s te ha donado %s %s', $donor, $amount, $currency),
            'url' => $url,
            'created_at' => $this->donacion->created_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
