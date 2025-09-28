<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class CustomResetPassword extends BaseResetPassword
{   
    //Arma el correo que se enviará al usuario para restablecer su contraseña.
    public function toMail($notifiable)
    {   
        // Genera el enlace para restablecer la contraseña con el token único y el email del usuario
        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        // Construye el correo usando Markdown y la plantilla personalizada
        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('Restablecé tu contraseña — Huellas Solidarias')
            ->markdown('emails.reset', [
                'url' => $url,
                'user' => $notifiable,
            ]);
    }

}