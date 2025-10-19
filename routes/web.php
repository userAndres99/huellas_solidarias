<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CasoController;
use App\Http\Controllers\DashboardController;
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
Route::get('/casos/json', [CasoController::class, 'index'])->name('casos.json');
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

// Rutas de autenticación (login, register, etc.)
require __DIR__.'/auth.php';