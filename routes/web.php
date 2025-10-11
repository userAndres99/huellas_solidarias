<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasoController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/* ---------------- INERTIA / JSON ENDPOINTS ---------------- */

/* JSON endpoints*/
Route::get('/casos/json', [CasoController::class, 'index'])->name('casos.json');
Route::get('/casos/json/{caso}', [CasoController::class, 'show'])->name('casos.json.show');

/* Inertia*/
Route::get('/casos', function () {
    return Inertia::render('Casos/Index');
})->name('casos.index');
Route::get('/casos/{id}', function ($id) {
    return Inertia::render('Casos/Show', ['initialId' => $id]);
})->name('casos.show');

/* Publicar */
Route::middleware(['auth'])->group(function () {
    Route::get('/publicar-caso', [CasoController::class, 'create'])->name('casos.create');
    Route::post('/casos', [CasoController::class, 'store'])->name('casos.store');
});

Route::get('/mapa', function () {
    return Inertia::render('MapaPage');
})->middleware(['auth'])->name('mapa');

require __DIR__.'/auth.php';