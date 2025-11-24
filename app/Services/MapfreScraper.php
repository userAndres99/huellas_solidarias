<?php

namespace App\Services;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

class MapfreScraper
{
    protected string $baseUrl = 'https://www.hogar.mapfre.es/mascotas';
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

    public function getRandomItems(int $count = 3): array
    {
        $items = [];

        for ($i = 0; $i < $count; $i++) {
            $page = rand(1, 23);
            try {
                $html = $this->fetchPage($page);
                $candidates = $this->parseItems($html);
                if (count($candidates) === 0) {
                    continue;
                }
                $items[] = $candidates[array_rand($candidates)];
            } catch (\Throwable $e) {
                
                continue;
            }
        }

        $unique = [];
        foreach ($items as $it) {
            if (!empty($it['link'])) {
                $unique[$it['link']] = $it;
            }
        }

        return array_values(array_slice($unique, 0, $count));
    }

    protected function fetchPage(int $page): string
    {
        $url = $this->baseUrl . ($page > 1 ? "/page/{$page}/" : '/');
        $res = $this->client->request('GET', $url);
        return (string) $res->getBody();
    }

    protected function parseItems(string $html): array
    {
        $crawler = new Crawler($html);

        $nodes = $crawler->filter('article, .post, .entry, .blog-post');
        if ($nodes->count() === 0) {
            $nodes = $crawler->filter('.post-list li, .news-list li, .listado-entradas li');
        }

        $results = [];

        foreach ($nodes as $node) {
            $nodeCrawler = new Crawler($node);

            $titleNode = $nodeCrawler->filter('h2 a, h3 a, .entry-title a, a[rel="bookmark"]')->first();
            if (!$titleNode->count()) {
                continue;
            }

            $title = trim($titleNode->text());
            $link = $this->normalizeUrl($titleNode->attr('href') ?? null);

            $excerptNode = $nodeCrawler->filter('.entry-summary, .excerpt, .post-excerpt, p')->first();
            $excerpt = $excerptNode->count() ? trim($excerptNode->text()) : '';

            $imgNode = $nodeCrawler->filter('img')->first();
            $image = $imgNode->count() ? $this->normalizeUrl($imgNode->attr('src')) : null;

            $results[] = [
                'title' => $title,
                'link' => $link,
                'excerpt' => $excerpt,
                'image' => $image,
            ];
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