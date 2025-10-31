<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CasoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoriaController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\SolicitudVerificacionController; 
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ComentarioController;
use Inertia\Inertia;

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

// Mapa interactivo (solo usuarios autenticados)
Route::get('/mapa', function () {
    return Inertia::render('MapaPage');
})->middleware(['auth'])->name('mapa');

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
});

/* -----------------------------------------------------------------
| Solicitudes de verificación de usuario
----------------------------------------------------------------- */

// Página con el formulario (solo usuarios con rol Usuario)
Route::get('/profile/solicitud-verificacion', [SolicitudVerificacionController::class, 'create'])
    ->name('profile.solicitud_form')
    ->middleware(['auth', 'role:Usuario']);

// Guardar solicitud (solo usuarios autenticados con rol Usuario)
Route::post('/profile/request-verification', [SolicitudVerificacionController::class, 'store'])
    ->name('profile.request_verification')
    ->middleware(['auth', 'role:Usuario']);

/* -----------------------------------------------------------------
| Rutas para administradores 
----------------------------------------------------------------- */
Route::middleware(['auth', 'role:Admin'])->group(function () {
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
Route::middleware(['auth', 'role:Organizacion'])->group(function () {
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

    // Estadísticas para la organización
    Route::get('/organizacion/estadisticas', [OrganizationController::class, 'estadisticas'])
        ->name('organizacion.estadisticas');
    // Endpoint JSON para obtener counts filtrados (usado por el frontend para peticiones AJAX)
    Route::get('/organizacion/estadisticas/data', [OrganizationController::class, 'estadisticasData'])
        ->name('organizacion.estadisticas.data');
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

    // Actualizar comentario o respuesta
    Route::put('/comentarios/{id}', [ComentarioController::class, 'update'])->name('comentario.update');

    Route::delete('/comentarios/{id}', [ComentarioController::class,'destroy'])->name('comentario.destroy');
});


Route::get('/comentarios/json', [ComentarioController::class, 'index'])->name('comentarios.json');
/* -----------------------------------------------------------------
| Rutas de autenticación (login, register, etc.)
----------------------------------------------------------------- */
require __DIR__.'/auth.php';