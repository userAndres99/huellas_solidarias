<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class CustomVerifyEmail extends BaseVerifyEmail
{
    /**
     * Genera un enlace seguro para que el usuario pueda verificar su correo.
     * Funciona igual que la versión original de Laravel, solo que podemos personalizarlo si queremos.
     */
    protected function verificationUrl($notifiable)
    {   
        // Crea una URL que expira después de X minutos (configurado en auth.verification.expire)
        // Incluye el ID del usuario y un hash del email para mayor seguridad
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())]
        );
    }
    /**
     * Arma el correo de verificación que se enviará al usuario.
     */
    public function toMail($notifiable)
    {
        $url = $this->verificationUrl($notifiable); // Llama a la función de arriba para generar el enlace

        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('Activa tu cuenta en Huellas Solidarias')
            ->markdown('emails.verify', [
                'url' => $url,
                'user' => $notifiable,
            ]);
    }

}
