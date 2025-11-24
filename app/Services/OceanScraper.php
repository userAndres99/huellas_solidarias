<?php

namespace App\Services;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

class OceanScraper
{
    protected string $baseUrl = 'https://www.ocean-petfood.com/es-es/blog/';
    protected Client $client;

    public function __construct(Client $client = null)
    {
        $this->client = $client ?: new Client([
            'timeout' => 10,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (compatible; HuellasScraper/1.0)'
            ],
        ]);
    }

    /**
     * retorna hasta $count elementos aleatorios del blog (intenta obtener varios de "cargar más").
     */
    public function getRandomItems(int $count = 3): array
    {
        $all = [];

        try {
            
            $html = $this->fetchUrl($this->baseUrl);
            $all = array_merge($all, $this->parseItems($html));

            $pageUrls = [];

            if (preg_match_all('#href=["\']([^"\']*page=\d+[^"\']*)["\']#i', $html, $m)) {
                foreach ($m[1] as $u) {
                    $pageUrls[] = $this->normalizeUrl($u);
                }
            }

            if (preg_match_all('#href=["\']([^"\']*/page/\d+[^"\']*)["\']#i', $html, $m2)) {
                foreach ($m2[1] as $u) {
                    $pageUrls[] = $this->normalizeUrl($u);
                }
            }

            if (empty($pageUrls)) {
                if (preg_match_all('#[?&]page=(\d+)#i', $html, $pm)) {
                    $max = max(array_map('intval', $pm[1]));
                    if ($max > 1) {
                        for ($p = 1; $p <= $max; $p++) {
                            $pageUrls[] = rtrim($this->baseUrl, '/') . '/?page=' . $p . '&page_size=9&total_page_gap=-1&sort=Date&sort_type=desc&view_size=54';
                        }
                    }
                }
            }
         
            $pageUrls = array_values(array_unique(array_filter($pageUrls)));
            $cap = 60; 

            if (!empty($pageUrls)) {
                $countPages = min(count($pageUrls), $cap);
                for ($i = 0; $i < $countPages; $i++) {
                    if (count($all) >= 200) break; 
                    $url = $pageUrls[$i];
                    try {
                        $htmlPage = $this->fetchUrl($url);
                        $all = array_merge($all, $this->parseItems($htmlPage));
                    } catch (\Throwable $e) {
                       
                        continue;
                    }
                }
            } else {
            
                $probeCap = 20; 
                for ($p = 2; $p <= $probeCap; $p++) {
                    if (count($all) >= 200) break;
                    $probeUrl = rtrim($this->baseUrl, '/') . '/?page=' . $p . '&page_size=9&total_page_gap=-1&sort=Date&sort_type=desc&view_size=54';
                    try {
                        $htmlPage = $this->fetchUrl($probeUrl);
                        $itemsOnPage = $this->parseItems($htmlPage);
                        if (empty($itemsOnPage)) break;
                        $all = array_merge($all, $itemsOnPage);
                    } catch (\Throwable $e) {
                        break;
                    }
                }
            }

            if (count($all) < 10) {
                $nextUrls = $this->extractLoadMoreUrls($html);
                foreach ($nextUrls as $url) {
                    if (count($all) >= 200) break;
                    try {
                        $html = $this->fetchUrl($url);
                        $all = array_merge($all, $this->parseItems($html));
                    } catch (\Throwable $e) {
                        continue;
                    }
                }
            }
        } catch (\Throwable $e) {
           
        }

        if (count($all) === 0) return [];

        $unique = [];
        foreach ($all as $it) {
            if (!empty($it['link'])) {
                $unique[$it['link']] = $it;
            }
        }

        $items = array_values($unique);

        shuffle($items);
        return array_slice($items, 0, $count);
    }

    protected function fetchUrl(string $url): string
    {
        $res = $this->client->request('GET', $url);
        return (string) $res->getBody();
    }

    protected function parseItems(string $html): array
    {
        $crawler = new Crawler($html);
        $results = [];

        $candidates = $crawler->filter('article, .post, .post-item, .blog-list-item, .blog-item');
        if ($candidates->count() === 0) {
            $candidates = $crawler->filter('.card, .entry, .teaser');
        }

        foreach ($candidates as $node) {
            $nodeCrawler = new Crawler($node);

            $title = '';
            $link = null;
            $titleSelectors = [
                'h3[data-webid="item-title"] a',
                'h3.h4 a',
                '.c-card__heading h3 a',
                '.c-detail-intro__title h3 a',
                'h3 a',
                'h2 a',
                '.c-card__heading a',
                'a[data-webid="item-title"]',
                'a[href]'
            ];

            foreach ($titleSelectors as $sel) {
                try {
                    $tn = $nodeCrawler->filter($sel)->first();
                    if ($tn->count()) {
                        $text = trim($tn->text());
                        if ($text !== '') {
                            $title = $text;
                            $link = $tn->attr('href') ?? $link;
                            break;
                        }
                        
                        $link = $tn->attr('href') ?? $link;
                    }
                } catch (\Exception $e) {
                    
                }
            }

            if (!$link) {
                
                try {
                    $a = $nodeCrawler->filter('a[href]')->first();
                    if ($a->count()) $link = $a->attr('href');
                } catch (\Exception $e) {}
            }

            $imgNode = $nodeCrawler->filter('img')->first();
            $image = $imgNode->count() ? $imgNode->attr('src') : null;

            $excerptNode = $nodeCrawler->filter('.excerpt, .summary, p')->first();
            $excerpt = $excerptNode->count() ? trim($excerptNode->text()) : '';

            $results[] = [
                'title' => $title,
                'link' => $this->normalizeUrl($link),
                'image' => $this->normalizeUrl($image),
                'excerpt' => $excerpt,
            ];
        }

        return $results;
    }

    protected function normalizeUrl(?string $url): ?string
    {
        if (!$url) return null;

        if (strpos($url, 'http') === 0) return $url;

        if (strpos($url, '//') === 0) {
            return (parse_url($this->baseUrl, PHP_URL_SCHEME) ?: 'https') . ':' . $url;
        }

        if (strpos($url, '/') === 0) {
            $parts = parse_url($this->baseUrl);
            $root = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');
            return rtrim($root, '/') . $url;
        }

        $baseParts = parse_url($this->baseUrl);
        $basePath = rtrim($baseParts['scheme'] . '://' . $baseParts['host'] . ($baseParts['path'] ?? ''), '/');
        return $basePath . '/' . ltrim($url, '/');
    }

    /**
     * funcion que busca posibles enlaces de "cargar más" o endpoints XHR en la página. (esto es para los scroll infinitos)
     */
    protected function extractLoadMoreUrls(string $html): array
    {
        $crawler = new Crawler($html);
        $urls = [];

        $buttons = $crawler->filter('button.load-more, a.load-more, .load-more, .btn-load-more, .cargar-mas');
        foreach ($buttons as $b) {
            $c = new Crawler($b);
            $href = $c->attr('data-url') ?? $c->attr('data-next') ?? $c->attr('href') ?? null;
            if ($href) $urls[] = $this->normalizeUrl($href);
        }

        if (preg_match_all('#(index.php\?page=\d+|/page/\d+/|/wp-json/[^"\']+)#i', $html, $m)) {
            foreach ($m[1] as $u) {
                $urls[] = $this->normalizeUrl($u);
            }
        }

        $urls = array_values(array_unique($urls));
        return $urls;
    }
}
