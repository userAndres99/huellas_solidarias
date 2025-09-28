@component('mail::message')
# Restablecer contraseña

Hola {{ $user->name ?? '' }},

Recibimos una solicitud para restablecer la contraseña. Hacé clic en el botón para continuar:

@component('mail::button', ['url' => $url])
Restablecer mi contraseña
@endcomponent

Este enlace expirará en {{ config('auth.passwords.users.expire') }} minutos.

Si no solicitaste esto, ignorá este mensaje.

{{-- Subcopy explícita en español --}}
@slot('subcopy')
Si tenés problemas para usar el botón "Restablecer mi contraseña", copiá y pegá la siguiente URL en tu navegador: {{ $url }}
@endslot

Saludos,  
{{ config('app.name') }}
@endcomponent