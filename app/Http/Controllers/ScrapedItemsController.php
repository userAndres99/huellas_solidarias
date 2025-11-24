<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Services\MapfreScraper;
use App\Services\OceanScraper;
use App\Services\FeliwayScraper;

class ScrapedItemsController extends Controller
{
    /**
     * retorna un artículo aleatorio por sitio configurado.
     */
    public function index(Request $request)
    {
        $cached = Cache::get('scraped.items');
        if ($cached && is_array($cached) && count($cached) > 0 && !$request->query('refresh')) {
            return response()->json($cached);
        }

        $items = [];

        // Mapfre
        try {
            $mapfre = new MapfreScraper();
            $m = $mapfre->getRandomItems(1);
            if (!empty($m) && isset($m[0])) {
                $m[0]['source'] = 'mapfre';
                $items[] = $m[0];
            }
        } catch (\Throwable $_) {}

        // Ocean
        try {
            $ocean = new OceanScraper();
            $o = $ocean->getRandomItems(1);
            if (!empty($o) && isset($o[0])) {
                $o[0]['source'] = 'ocean';
                $items[] = $o[0];
            }
        } catch (\Throwable $_) {}

        // Feliway
        try {
            $feliway = new FeliwayScraper();
            $f = $feliway->getRandomItems(1, 88);
            if (!empty($f) && isset($f[0])) {
                $f[0]['source'] = 'feliway';
                $items[] = $f[0];
            }
        } catch (\Throwable $_) {}

        $unique = [];
        foreach ($items as $it) {
            if (!empty($it['link'])) {
                $unique[$it['link']] = $it;
            }
        }

        $items = array_values($unique);

        // para que se actualice con frecuencia (60 sec)
        Cache::put('scraped.items', $items, now()->addSeconds(60));

        return response()->json($items);
    }
}
