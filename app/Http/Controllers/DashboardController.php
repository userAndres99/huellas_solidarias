<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Caso;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use App\Services\FeliwayScraper;
use App\Services\MapfreScraper;
use App\Services\OceanScraper;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();

        $misPublicaciones = Caso::where('idUsuario', $userId)
            ->orderBy('fechaPublicacion', 'desc')
            ->get()
            ->map(function ($c) {
                $c->fotoAnimal = $c->fotoAnimal ? Storage::url($c->fotoAnimal) : null;
                return $c;
            });

        $cached = [];

        return Inertia::render('Dashboard', [
            'misPublicaciones' => $misPublicaciones,
            'scrapedItems' => $cached,
        ]);
    }
}