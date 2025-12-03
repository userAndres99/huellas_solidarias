<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CasoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoriaController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\BuscadorUsuariosController;
use App\Http\Controllers\CiudadController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\SolicitudVerificacionController; 
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ComentarioController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\GroupController;
use App\Models\Donacion;
use App\Models\Organizacion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\UserController;

Route::middleware(['auth', 'verified', 'active'])->group(function(){
    Route::get('/chat', [ChatController::class, 'chat'])->name('chat');
   Route::get('user/{user}', [MessageController::class, 'byUser'])->name('chat.user');
   Route::get('group/{group}', [MessageController::class, 'byGroup'])->name('chat.group');
    // Endpoints JSON para el mini-widget de chat
    Route::get('/messages/user/{user}', [MessageController::class, 'messagesByUserJson'])->name('message.user.json');
    Route::get('/messages/group/{group}', [MessageController::class, 'messagesByGroupJson'])->name('message.group.json');

   // Buscador de usuarios (nombre de usuario o nombre de organización)
   Route::get('/buscador-usuarios', [BuscadorUsuariosController::class, 'search'])
        ->name('buscador.usuarios');
   // Endpoint JSON público para obtener un usuario por id (usado por frontend)
   Route::get('/usuarios/json/{user}', [BuscadorUsuariosController::class, 'jsonShow'])->name('usuarios.json.show');

   // Página pública (para usuarios autenticados) de ver perfil
   Route::get('/usuarios/{user}', [BuscadorUsuariosController::class, 'show'])
       ->name('usuarios.show');

   // Seguir / dejar de seguir usuarios
   Route::post('/usuarios/{user}/seguir', [\App\Http\Controllers\SeguimientoController::class, 'store'])
       ->name('usuarios.seguir');
   Route::delete('/usuarios/{user}/seguir', [\App\Http\Controllers\SeguimientoController::class, 'destroy'])
       ->name('usuarios.dejar_seguir');

    Route::post('/message', [MessageController::class, 'store'])->name('message.store');
    Route::delete('/message/{message}', [MessageController::class, 'destroy'])->name('message.destroy');
    Route::get('/message/older/{message}', [MessageController::class, 'loadOlder'])->name('message.loadOlder');

    Route::post('/conversations/start', [ConversationController::class, 'start'])->name('conversations.start');
    Route::delete('/conversations/hide/{user}', [ConversationController::class, 'hide'])->name('conversations.hide');
    Route::post('/conversations/unhide/{user}', [ConversationController::class, 'unhide'])->name('conversations.unhide');

    Route::post('/group', [GroupController::class, 'store'])->name('group.store');
    Route::put('/group/{group}', [GroupController::class, 'update'])->name('group.update');
    Route::delete('/group/{group}', [GroupController::class, 'destroy'])->name('group.destroy');

    Route::middleware(['admin'])->group(function(){
        Route::post('/user',[UserController::class,'store'])->name('user.name');
        Route::post('/user/change-role/{user}', [UserController::class,'changeRole'])->name('user.changeRole');
        Route::post('/user/block-unblock/{user}', [UserController::class, 'blockUnblock'])->name('user.blockUnblock');
    });



        // Notificaciones: listar y marcar lectura
        Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markRead'])->name('notifications.read');
        Route::post('/notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllRead'])->name('notifications.mark_all_read');
        Route::delete('/notifications', [\App\Http\Controllers\NotificationController::class, 'destroyAll'])->name('notifications.destroy_all');
        // Borrar una notificación específica para el usuario autenticado
        Route::delete('/notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');
});

/* -----------------------------------------------------------------
| Página principal
----------------------------------------------------------------- */
Route::get('/', function () {
    return Inertia::render('Home', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

/* -----------------------------------------------------------------
| Dashboard 
| En vez de renderizar aca la vista directamente, delegamos en DashboardController
| para que pueda proporcionar "misPublicaciones",etc.
----------------------------------------------------------------- */
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Endpoint para obtener items scrapados 
Route::get('/scraped-items', [\App\Http\Controllers\ScrapedItemsController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('scraped.items');

/* -----------------------------------------------------------------
| Perfil de usuario
----------------------------------------------------------------- */
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Actualizar datos de la organización a la que pertenece el usuario autenticado
    Route::patch('/organizacion', [OrganizationController::class, 'update'])
        ->name('organizacion.update');

    // Cambiar estado de un caso (finalizar / cancelar) por su autor
    Route::post('/casos/{id}/status', [\App\Http\Controllers\CasoController::class, 'updateStatus'])
        ->name('casos.update_status');
    // Buscar coincidencias por imagen sin crear un caso
    Route::post('/casos/search-image', [\App\Http\Controllers\CasoController::class, 'searchByImage'])
        ->name('casos.search_image');
});

/* -----------------------------------------------------------------
| JSON endpoints para API interna
----------------------------------------------------------------- */
// Cambié 'index' por 'json' para que devuelva la colección con la relación usuario
Route::get('/casos/json', [CasoController::class, 'json'])->name('casos.json');
Route::get('/casos/json/{id}', [CasoController::class, 'show'])->name('casos.json.show');

/* -----------------------------------------------------------------
| Rutas Inertia (vistas React)
----------------------------------------------------------------- */

// Listado general de casos
Route::get('/casos', function () {
    return Inertia::render('Casos/Index');
})->name('casos.index');

// Autocompletado de ciudades
Route::get('/ciudades', [CiudadController::class, 'search'])->name('ciudades.search');

// Vista de un caso individual
Route::get('/casos/{id}', function ($id) {
    return Inertia::render('Casos/Show', ['initialId' => $id]);
})->name('casos.show');

// Publicar un caso (solo usuarios autenticados)
Route::middleware(['auth'])->group(function () {
    Route::get('/publicar-caso', [CasoController::class, 'create'])->name('casos.create');
    Route::post('/casos', [CasoController::class, 'store'])->name('casos.store');
});

// Resultados de coincidencias de "Perdido" (si necesitás ruta pública para ver la vista)
Route::get('/casos/perdido-results', function () {
    return Inertia::render('Casos/PerdidoResults');
})->name('casos.perdido-results');

/* -----------------------------------------------------------------
| Paginas legales 
----------------------------------------------------------------- */
Route::get('/politica-privacidad', function () {
    return Inertia::render('Static/Privacy');
})->name('politica.privacidad');

Route::get('/terminos', function () {
    return Inertia::render('Static/Terms');
})->name('terminos');

/* -----------------------------------------------------------------
| Historias de éxito
----------------------------------------------------------------- */
Route::get('/historias/json', [HistoriaController::class, 'jsonIndex'])->name('historias.json');
Route::get('/historias/json/{historia}', [HistoriaController::class, 'show'])->name('historia.json.show');

Route::get('/historias', function () {
    return Inertia::render('HistoriaExito/Index');
});

Route::get('/historias/{id}', function ($id) {
    return Inertia::render('HistoriaExito/Show', ['initialId' => $id]);
})->name('historias.show');

// Publicar una Historia (solo usuarios autenticado)
Route::middleware(['auth'])->group(function () {
    Route::get('/publicar-historia', [HistoriaController::class, 'create'])->name('historias.create');
    Route::post('/historias', [HistoriaController::class, 'store'])->name('historias.store');
    Route::delete('/historias/{historia}', [HistoriaController::class, 'destroy'])->name('historias.destroy');
});

/* -----------------------------------------------------------------
| Solicitudes de verificación de usuario
----------------------------------------------------------------- */

// Página con el formulario (solo usuarios con rol Usuario)
Route::get('/profile/solicitud-verificacion', [SolicitudVerificacionController::class, 'create'])
    ->name('profile.solicitud_form')
    ->middleware(['auth', \App\Http\Middleware\RoleMiddleware::class . ':Usuario']);

// Guardar solicitud (solo usuarios autenticados con rol Usuario)
Route::post('/profile/request-verification', [SolicitudVerificacionController::class, 'store'])
    ->name('profile.request_verification')
    ->middleware(['auth', \App\Http\Middleware\RoleMiddleware::class . ':Usuario']);

/* -----------------------------------------------------------------
| Rutas para administradores 
----------------------------------------------------------------- */
Route::middleware(['auth', \App\Http\Middleware\RoleMiddleware::class . ':Admin'])->group(function () {
    Route::get('/admin', [AdminController::class, 'index'])->name('admin.index');

    // listado de solicitudes gestionado por controller
    Route::get('/admin/solicitudes', [SolicitudVerificacionController::class, 'index'])
        ->name('admin.solicitudes.index');

    // ver detalle de una solicitud
    Route::get('/admin/solicitudes/{id}', [SolicitudVerificacionController::class, 'show'])
        ->name('admin.solicitudes.show');

    // actualizar estado (aprobar/rechazar)
    Route::post('/admin/solicitudes/{id}/status', [SolicitudVerificacionController::class, 'updateStatus'])
        ->name('admin.solicitudes.update_status');

    // aca rutas para los admins
});

/* -----------------------------------------------------------------
| Rutas para organizaciones 
----------------------------------------------------------------- */
Route::middleware(['auth', \App\Http\Middleware\RoleMiddleware::class . ':Organizacion'])->group(function () {
    Route::get('/organizacion', [OrganizationController::class, 'index'])->name('organizacion.index');

    // ruta para mostrar el formulario "Crear evento"
    Route::get('/organizacion/eventos/create', [OrganizationController::class, 'create'])
        ->name('organizacion.eventos.create');

    // ruta para guardar el evento 
    Route::post('/organizacion/eventos', [OrganizationController::class, 'store'])
        ->name('organizacion.eventos.store');
    
    // ver detalle de un evento (organizacion)
    Route::get('/organizacion/eventos/{id}', [OrganizationController::class, 'show'])
        ->name('organizacion.eventos.show');

    // editar evento (form)
    Route::get('/organizacion/eventos/{id}/edit', [OrganizationController::class, 'edit'])
        ->name('organizacion.eventos.edit');

    // actualizar evento (PUT y PATCH por compatibilidad con Inertia)
    Route::put('/organizacion/eventos/{id}', [OrganizationController::class, 'updateEvent'])
        ->name('organizacion.eventos.update');
    Route::patch('/organizacion/eventos/{id}', [OrganizationController::class, 'updateEvent']);
    // eliminar evento
    Route::delete('/organizacion/eventos/{id}', [OrganizationController::class, 'destroy'])
        ->name('organizacion.eventos.destroy');

    // Estadísticas para la organización
    Route::get('/organizacion/estadisticas', [OrganizationController::class, 'estadisticas'])
        ->name('organizacion.estadisticas');
    // Endpoint JSON para obtener counts filtrados (usado por el frontend para peticiones AJAX)
    Route::get('/organizacion/estadisticas/data', [OrganizationController::class, 'estadisticasData'])
        ->name('organizacion.estadisticas.data');
    // Endpoint JSON para obtener la serie anual (casos por año) con los mismos filtros
    Route::get('/organizacion/estadisticas/years', [OrganizationController::class, 'estadisticasYearsData'])
        ->name('organizacion.estadisticas.years');

});

   Route::prefix('comentarios')
    ->middleware('auth')
    ->group(function () {
        Route::post('/{comentario}/like', [ComentarioController::class, 'like'])->name('comentarios.like');
        Route::delete('/{comentario}/like', [ComentarioController::class, 'unlike'])->name('comentarios.unlike');
    });

/* -----------------------------------------------------------------
| Rutas para comentarios
----------------------------------------------------------------- */
Route::middleware('auth')->group(function(){
    Route::post('/comentarios', [ComentarioController::class, 'store'])->name('comentarios.store');

    // moderacion de texto via OpenModerator
    Route::post('/moderate', [\App\Http\Controllers\ModerationController::class, 'moderate'])->name('moderate');
    // moderacion de imagenes via Sightengine
    Route::post('/moderate/image', [\App\Http\Controllers\ModerationController::class, 'moderateImage'])->name('moderate.image');

    // Actualizar comentario o respuesta
    Route::put('/comentarios/{id}', [ComentarioController::class, 'update'])->name('comentario.update');

    Route::delete('/comentarios/{id}', [ComentarioController::class,'destroy'])->name('comentario.destroy');
});


Route::get('/comentarios/json', [ComentarioController::class, 'index'])->name('comentarios.json');



/* -----------------------------------------------------------------
| Rutas de autenticación (login, register, etc.)
----------------------------------------------------------------- */
require __DIR__.'/auth.php';

// Public OAuth callback de Mercado Pago
Route::get('/mercadopago/callback', [\App\Http\Controllers\MercadoPagoController::class, 'callback'])
    ->name('mercadopago.callback');

// Rutas Mercado Pago (connect/disconnect)
Route::get('/mercadopago/connect', [\App\Http\Controllers\MercadoPagoController::class, 'connect'])
    ->name('mercadopago.connect')
    ->middleware(['auth', \App\Http\Middleware\RoleMiddleware::class . ':Organizacion']);

Route::post('/mercadopago/disconnect', [\App\Http\Controllers\MercadoPagoController::class, 'disconnect'])
    ->name('mercadopago.disconnect')
    ->middleware(['auth', \App\Http\Middleware\RoleMiddleware::class . ':Organizacion']);

// Donaciones: listado para la organizacion autenticada 
Route::get('/organizacion/donaciones', [\App\Http\Controllers\OrganizationController::class, 'donaciones'])
    ->name('organizacion.donaciones')
    ->middleware(['auth', \App\Http\Middleware\RoleMiddleware::class . ':Organizacion']);

// Endpoint para iniciar una donación (crea preference en Mercado Pago)
Route::post('/donar', [\App\Http\Controllers\DonationController::class, 'store'])
    ->name('donar.store');

// Webhook endpoint de notificaciones de Mercado Pago 
Route::post('/webhooks/mp', [\App\Http\Controllers\WebhookController::class, 'mp'])
    ->name('webhooks.mp')
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class, \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

// También exponer la ruta que la UI 
Route::post('/api/mercadopago/webhook', [\App\Http\Controllers\WebhookController::class, 'mp'])
    ->name('webhooks.mp.api')
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class, \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

// simple endpoint para obtener el token CSRF 
Route::get('/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

// Resultado público de una donación (retorno desde Mercado Pago)
Route::get('/donaciones/resultado', function (Request $request) {
    // pasar todos los query params a la vista para mostrar detalles
    $query = $request->query();

    $donacion = null;
    $organizacion = null;

    // intentar resolver la donación por varios parámetros comunes (payment_id, collection_id, preference_id)
    $paymentId = $request->query('payment_id') ?? $request->query('collection_id') ?? null;
    $preferenceId = $request->query('preference_id') ?? null;

    if ($paymentId) {
        $donacion = Donacion::where('mp_payment_id', $paymentId)->first();
    }

    if (! $donacion && $preferenceId) {
        // algunos webhooks guardan preference_id dentro
        $donacion = Donacion::where('payload_crudo->preference_id', $preferenceId)->first();
    }

    if ($donacion) {
        $organizacion = Organizacion::find($donacion->organizacion_id);
    }

    return Inertia::render('Donaciones/Resultado', [
        'query' => $query,
        'donacion' => $donacion ? $donacion->toArray() : null,
        'organizacion' => $organizacion ? ['id' => $organizacion->id, 'nombre' => $organizacion->nombre] : null,
    ]);
})->name('donaciones.resultado');