@component('mail::message')
# ¡Hola {{ $user->name ?? '' }}!

Gracias por registrarte en **Huellas Solidarias**. Para activar tu cuenta, hacé clic en el botón:

@component('mail::button', ['url' => $url])
Verificar mi correo
@endcomponent

Si no solicitaste este registro, ignorá este correo.

{{-- Subcopy explícita en español --}}
@slot('subcopy')
Si tenés problemas para usar el botón "Verificar mi correo", copiá y pegá la siguiente URL en tu navegador: {{ $url }}
@endslot

Saludos,  
{{ config('app.name') }}
@endcomponent
