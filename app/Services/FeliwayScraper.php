<?php

namespace App\Services;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

class FeliwayScraper
{
    protected string $baseUrl = 'https://www.feliway.es/blogs/articulos';
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
     * agarra elementos aleatorios 
     */
    public function getRandomItems(int $count = 3, int $maxPage = 88): array
    {
        $items = [];
        $seen = [];
        $attempts = 0;
        $maxAttempts = min(80, $maxPage * 2);

        while (count($items) < $count && $attempts < $maxAttempts) {
            $page = rand(1, max(1, $maxPage));
            $url = $this->baseUrl . ($page > 1 ? '?page=' . $page : '');
            try {
                $html = $this->fetchUrl($url);
                $candidates = $this->parseItems($html);
                if (count($candidates) === 0) { $attempts++; continue; }

                $pick = $candidates[array_rand($candidates)];
                $link = $pick['link'] ?? null;
                if ($link && !isset($seen[$link])) {
                    $seen[$link] = true;
                    $items[] = $pick;
                }
            } catch (\Throwable $e) {
                
            }
            $attempts++;
        }

        return $items;
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

        $candidates = $crawler->filter('article, .article, .article-list__item, .article-card, .grid-item, .blog-item, .post, .card, .teaser');
        $seen = [];
        if ($candidates->count() > 0) {
            foreach ($candidates as $node) {
                $nodeCrawler = new Crawler($node);
                $anchors = $nodeCrawler->filter('a[href]');
                if ($anchors->count() === 0) continue;

                // encuentra el primer anchor que coincide con artículo válido
                $found = null;
                foreach ($anchors as $aNode) {
                    $aC = new Crawler($aNode);
                    $href = $aC->attr('href') ?? '';
                    if (!$href) continue;
                    if (strpos($href, '/blogs/articulos/') === false) continue;
                    if (strpos($href, '/tagged/') !== false) continue;
                    $found = $aC; break;
                }
                if (!$found) continue;

                $norm = $this->normalizeUrl($found->attr('href'));
                if (!$norm) continue;
                if (isset($seen[$norm])) continue;
                $seen[$norm] = true;

                $title = trim($found->text());
                if ($title === '') {
                    $parsed = parse_url($norm);
                    $slug = basename($parsed['path'] ?? '');
                    $title = $slug ? ucwords(str_replace(['-', '_'], ' ', $slug)) : $norm;
                }

                $imgSrc = null;
                try {
                    $imgs = $nodeCrawler->filter('img');
                    if ($imgs->count()) {
                        $imgSrc = $imgs->eq(0)->attr('src');
                    }
                } catch (\Throwable $_) {}

                $results[] = [
                    'title' => $title,
                    'link' => $norm,
                    'image' => $this->normalizeUrl($imgSrc),
                    'excerpt' => '',
                ];
            }
        } else {
            // Fallback
            $anchors = $crawler->filter('a[href]');
            foreach ($anchors as $i => $aNode) {
                if ($i > 1000) break; // safety
                $a = new Crawler($aNode);
                $href = $a->attr('href') ?? '';
                if (!$href) continue;
                if (strpos($href, '/blogs/articulos/') === false) continue;
                if (strpos($href, '/tagged/') !== false) continue;

                $norm = $this->normalizeUrl($href);
                if (!$norm) continue;

                $parsed = parse_url($norm);
                $path = $parsed['path'] ?? '';
                if (rtrim($path, '/') === '/blogs/articulos') continue;

                $slug = basename($path);
                if (!$slug) continue;
                if (isset($seen[$norm])) continue;
                $seen[$norm] = true;

                $title = trim($a->text());
                if ($title === '') {
                    $title = ucwords(str_replace(['-', '_'], ' ', $slug));
                }

                $imgSrc = null;
                $dom = $aNode;
                $parent = $dom->parentNode;
                for ($lvl = 0; $lvl < 4 && $parent; $lvl++) {
                    try {
                        $pc = new Crawler($parent);
                        $imgs = $pc->filter('img');
                        if ($imgs->count()) {
                            $imgSrc = $imgs->eq(0)->attr('src');
                            break;
                        }
                    } catch (\Throwable $_) {}
                    $parent = $parent->parentNode;
                }

                $results[] = [
                    'title' => $title,
                    'link' => $norm,
                    'image' => $this->normalizeUrl($imgSrc),
                    'excerpt' => '',
                ];
            }
        }

        return $results;
    }

    protected function normalizeUrl(?string $url): ?string
    {
        if (!$url) return null;
        if (strpos($url, 'http') === 0) return $url;
        if (strpos($url, '//') === 0) return (parse_url($this->baseUrl, PHP_URL_SCHEME) ?: 'https') . ':' . $url;
        if (strpos($url, '/') === 0) {
            $parts = parse_url($this->baseUrl);
            $root = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');
            return rtrim($root, '/') . $url;
        }
        $baseParts = parse_url($this->baseUrl);
        $basePath = rtrim($baseParts['scheme'] . '://' . $baseParts['host'] . ($baseParts['path'] ?? ''), '/');
        return $basePath . '/' . ltrim($url, '/');
    }
}
