<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;

class VerifyCsrfToken extends BaseVerifier
{
    /**
     * el URIs que deben estar excluidos de la verificación CSRF.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Endpoints de webhook de Mercadopago (servicios externos)
        'webhooks/mp',
        'api/mercadopago/webhook',
        'mercadopago/webhook',
    ];
}
