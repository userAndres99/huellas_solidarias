<?php
namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class RemoveBgClient
{
    protected string $pythonCmd;

    public function __construct()
    {
        // Comando a usar para invocar Python (puede ser ruta absoluta)
        $this->pythonCmd = env('REMOVEBG_PYTHON_CMD', 'py -3.10');
    }

    /**
     * remove para background de un archivo local usando el script local `tools/remove_bg.py`.
     * Devuelve la ruta física completa al nuevo archivo sin fondo (storage_path('app/public/...')) o null en caso de error.
     */
    public function removeBackgroundFromFile(string $filePath): ?string
    {
        if (!file_exists($filePath)) {
            Log::error("RemoveBg: file not found: {$filePath}");
            return null;
        }

        try {
            $ext = 'png';
            $fileName = 'no-bg-' . Str::random(10) . '.' . $ext;
            $rel = 'foto_animales_nobg/' . $fileName;
            $fullOut = storage_path('app/public/' . $rel);

            // Asegurar carpeta
            $outDir = dirname($fullOut);
            if (!is_dir($outDir)) {
                @mkdir($outDir, 0755, true);
            }

            // Construir comando seguro
            $script = base_path('tools/remove_bg.py');
            $cmd = sprintf('%s %s %s %s', $this->pythonCmd, escapeshellarg($script), escapeshellarg($filePath), escapeshellarg($fullOut));

            exec($cmd . ' 2>&1', $outLines, $ret);
            if ($ret !== 0) {
                Log::warning('RemoveBg local failed: ' . implode("\n", $outLines));
                return null;
            }

            if (file_exists($fullOut)) {
                Log::info("RemoveBg: saved no-bg image to {$fullOut}");
                return $fullOut;
            }

            Log::warning('RemoveBg: command succeeded but output file missing: ' . $fullOut);
            return null;
        } catch (\Throwable $e) {
            Log::error('RemoveBg error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Opcional: remueve el background de una imagen dada por URL.
     * Devuelve la ruta física completa al nuevo archivo sin fondo (storage_path('app/public/...')) o null en caso de error.
     */
    public function removeBackgroundFromUrl(string $imageUrl): ?string
    {
        try {
            $tmpDir = storage_path('app/tmp');
            if (!is_dir($tmpDir)) {
                @mkdir($tmpDir, 0755, true);
            }

            $path = parse_url($imageUrl, PHP_URL_PATH) ?? '';
            $ext = pathinfo($path, PATHINFO_EXTENSION) ?: 'jpg';
            $tmpFile = $tmpDir . DIRECTORY_SEPARATOR . 'download_' . Str::random(8) . '.' . $ext;

            $contents = @file_get_contents($imageUrl);
            if ($contents === false) {
                Log::error('RemoveBg: failed to download image from URL: ' . $imageUrl);
                return null;
            }

            file_put_contents($tmpFile, $contents);
            $result = $this->removeBackgroundFromFile($tmpFile);
            @unlink($tmpFile);
            return $result;
        } catch (\Throwable $e) {
            Log::error('RemoveBg::removeBackgroundFromUrl error: ' . $e->getMessage());
            return null;
        }
    }
}
