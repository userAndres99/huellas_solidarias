<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- CSRF -->
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <link rel="icon" href="/images/icono.jpg" type="image/jpeg">
    <link rel="apple-touch-icon" href="/images/icono.jpg">

    <!-- FullCalendar CSS: para prevenir errores -->
    @php
        $fcCore = public_path('css/fullcalendar-core.min.css');
        $fcDay = public_path('css/fullcalendar-daygrid.min.css');
        $fcTime = public_path('css/fullcalendar-timegrid.min.css');
    @endphp

    @if(file_exists($fcCore) && file_exists($fcDay) && file_exists($fcTime))
        @php
            // Prefer the current request scheme: if the current request is secure, use secure_asset(),
            // otherwise use asset(). This prevents forcing https when serving locally over http.
            $useHttps = request()->isSecure();
        @endphp
        @if($useHttps)
            <link rel="stylesheet" href="{{ secure_asset('css/fullcalendar-core.min.css') }}" />
            <link rel="stylesheet" href="{{ secure_asset('css/fullcalendar-daygrid.min.css') }}" />
            <link rel="stylesheet" href="{{ secure_asset('css/fullcalendar-timegrid.min.css') }}" />
        @else
            <link rel="stylesheet" href="{{ asset('css/fullcalendar-core.min.css') }}" />
            <link rel="stylesheet" href="{{ asset('css/fullcalendar-daygrid.min.css') }}" />
            <link rel="stylesheet" href="{{ asset('css/fullcalendar-timegrid.min.css') }}" />
        @endif
    @else
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.19/main.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.19/main.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.19/main.min.css" />
    @endif

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>