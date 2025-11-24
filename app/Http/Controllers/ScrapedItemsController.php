<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Services\MapfreScraper;
use App\Services\OceanScraper;

class ScrapedItemsController extends Controller
{
    /**
     * Return random items. Supports querying by `site` (mapfre|ocean|feliway) and `count`.
     * If `site` is omitted, preserves previous behaviour (one per site).
     * Results are cached per-site for 60s unless `refresh=1` is provided.
     */
    public function index(Request $request)
    {
        $site = $request->query('site');
        $count = (int) max(1, $request->query('count', 3));
        $refresh = (bool) $request->query('refresh');

        // If a site is provided, return $count random items for that site
        if ($site) {
            $allowed = ['mapfre', 'ocean', 'feliway'];
            if (!in_array($site, $allowed)) {
                return response()->json(['error' => 'site not supported'], 400);
            }

            $cacheKey = "scraped.items.site.{$site}.count.{$count}";
            if (!$refresh && Cache::has($cacheKey)) {
                return response()->json(Cache::get($cacheKey));
            }

            $items = [];
            try {
                if ($site === 'mapfre') {
                    $svc = new MapfreScraper();
                    $items = $svc->getRandomItems($count);
                } elseif ($site === 'ocean') {
                    $svc = new OceanScraper();
                    $items = $svc->getRandomItems($count);
                } elseif ($site === 'feliway') {
                    $svc = new FeliwayScraper();
                    $items = $svc->getRandomItems($count, 88);
                }
            } catch (\Throwable $_) {
                $items = [];
            }

            // attach source
            foreach ($items as &$it) { $it['source'] = $site; }
            unset($it);

            Cache::put($cacheKey, $items, now()->addSeconds(60));
            return response()->json($items);
        }

        // No site provided: previous behaviour (one item per site)
        $cached = Cache::get('scraped.items');
        if ($cached && is_array($cached) && count($cached) > 0 && !$refresh) {
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
        Cache::put('scraped.items', $items, now()->addSeconds(60));
        return response()->json($items);
    }

}
