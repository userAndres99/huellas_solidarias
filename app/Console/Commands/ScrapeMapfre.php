<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FeliwayScraper;
use App\Services\MapfreScraper;
use App\Services\OceanScraper;
use Illuminate\Support\Facades\Cache;

class ScrapeMapfre extends Command
{
    /**
     * el nombre y la firma del comando 
     *
     * @var string
     */
    protected $signature = 'scrape:mapfre {--count=3}';

    /**
     * La descripción del comando de consola.
     *
     * @var string
     */
    protected $description = 'Scrape hogar.mapfre.es mascotas and cache random items for the dashboard';

    public function handle(): int
    {
        $this->info('Starting combined scrape: Mapfre, Ocean, Feliway');
        $items = [];
        try {
            $mapfre = new MapfreScraper();
            $m = $mapfre->getRandomItems(1);
            if (!empty($m) && isset($m[0])) {
                $m[0]['source'] = 'mapfre';
                $items[] = $m[0];
                $this->info('Mapfre: found 1 item');
            } else {
                $this->info('Mapfre: no items');
            }
        } catch (\Throwable $e) {
            $this->error('Mapfre scrape error: ' . $e->getMessage());
        }

        // Ocean
        try {
            $ocean = new OceanScraper();
            $o = $ocean->getRandomItems(1);
            if (!empty($o) && isset($o[0])) {
                $o[0]['source'] = 'ocean';
                $items[] = $o[0];
                $this->info('Ocean: found 1 item');
            } else {
                $this->info('Ocean: no items');
            }
        } catch (\Throwable $e) {
            $this->error('Ocean scrape error: ' . $e->getMessage());
        }

        // Feliway
        try {
            $feliway = new FeliwayScraper();
            $f = $feliway->getRandomItems(1, 88);
            if (!empty($f) && isset($f[0])) {
                $f[0]['source'] = 'feliway';
                $items[] = $f[0];
                $this->info('Feliway: found 1 item');
            } else {
                $this->info('Feliway: no items');
            }
        } catch (\Throwable $e) {
            $this->error('Feliway scrape error: ' . $e->getMessage());
        }

        // Asegurar unicidad 
        $unique = [];
        foreach ($items as $it) {
            if (!empty($it['link'])) {
                $unique[$it['link']] = $it;
            }
        }
        $items = array_values($unique);

        Cache::put('scraped.items', $items, now()->addDay());
        $this->info('Cached ' . count($items) . ' items to cache key `scraped.items`');

        return 0;
    }
}
