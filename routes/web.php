<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CasoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoriaController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\OrganizationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Página principal
Route::get('/', function () {
    return Inertia::render('Home', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

// Dashboard 
// En vez de renderizar aca la vista directamente, delegamos en DashboardController
// para que pueda proporcionar "misPublicaciones",etc.
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Perfil de usuario
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/* -----------------------------------------------------------------
| JSON endpoints para API interna
----------------------------------------------------------------- */
// Cambié 'index' por 'json' para que devuelva la colección con la relación usuario
Route::get('/casos/json', [CasoController::class, 'json'])->name('casos.json');
Route::get('/casos/json/{caso}', [CasoController::class, 'show'])->name('casos.json.show');

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


Route::get('/historias/json', [HistoriaController::class, 'jsonIndex'])->name('historias.json');


Route::get('/historias', function(){
    return Inertia::render('HistoriaExito/Index');
});

//Publicar una Historia (solo usuarios autenticado)
Route::middleware(['auth'])->group(function (){
    Route::get('/publicar-historia', [HistoriaController::class, 'create'])->name('historias.create');
    Route::post('/historias', [HistoriaController::class, 'store'])->name('historias.store');
    
});

// Rutas para administradores 
Route::middleware(['auth', 'role:Admin'])->group(function () {
    Route::get('/admin', [AdminController::class, 'index'])->name('admin.index');
    Route::get('/admin/solicitudes', function () {
        return Inertia::render('Admin/Solicitudes');
    })->name('admin.solicitudes');
    // aca rutas para los admins
});

// Rutas para organizaciones 
Route::middleware(['auth', 'role:Organizacion'])->group(function () {
    Route::get('/organizacion', [OrganizationController::class, 'index'])->name('organizacion.index');
    // aca rutas para organizaciones
});

// Rutas de autenticación (login, register, etc.)
require __DIR__.'/auth.php';