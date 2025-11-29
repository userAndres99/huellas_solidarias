<?php
namespace App\Jobs;

use App\Services\SightengineService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ModerateImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $imagePath; 
    public ?int $resourceId; 
    public string $resourceType; 

    /**
     * crea el trabajo de moderación de imagen
     */
    public function __construct(string $imagePath, string $resourceType = 'historia', ?int $resourceId = null)
    {
        $this->imagePath = $imagePath;
        $this->resourceType = $resourceType;
        $this->resourceId = $resourceId;
        $this->onQueue(config('moderation.queue', 'moderation'));
    }

    /**
     * Ejecuta el trabajo.
     */
    public function handle(SightengineService $sight)
    {
        // Modelos y umbrales por defecto vienen de config/moderation.php
        $models = config('moderation.sightengine_models', ['nudity','offensive','wad','celebrities']);
        $threshold = (float) config('moderation.image_threshold', 0.6);
        $suspicious = (float) config('moderation.image_suspicious_threshold', 0.45);

        $result = $sight->checkImage($this->imagePath, $models);

        // Registrar resultado sin procesar para auditoría
        \Log::info('ModerateImageJob result', ['path' => $this->imagePath, 'result' => $result]);

        //recorrer valores numéricos en respuesta y detectar si alguno supera el umbral
        $maxScore = 0.0;
        $reasons = [];

        array_walk_recursive($result, function ($value, $key) use (&$maxScore, &$reasons) {
            if (is_numeric($value)) {
                $val = (float) $value;
                if ($val > $maxScore) $maxScore = $val;
                if ($val >= 0.01) {
                    $reasons[] = "$key=$val";
                }
            }
        });

        $action = 'approve';
        if ($maxScore >= $threshold) {
            $action = 'reject';
        } elseif ($maxScore >= $suspicious) {
            $action = 'suspicious';
        }

        // Aplicar acción: por ahora registramos y disparar evento.
        if ($action === 'reject') {
            \Log::warning('ModerateImageJob: image rejected', ['path' => $this->imagePath, 'reasons' => $reasons]);
            // intentamos borrar el archivo local si existe
            try {
                if (file_exists($this->imagePath)) {
                    @unlink($this->imagePath);
                }
            } catch (\Throwable $e) {
                \Log::error('Error deleting moderated image', ['err' => $e->getMessage()]);
            }

            // aca podría notificar al usuario, admin, o marcar DB (por ahora no lo hacemos)
        } elseif ($action === 'suspicious') {
            \Log::notice('ModerateImageJob: image suspicious', ['path' => $this->imagePath, 'reasons' => $reasons]);
            // Marcar para revisión 
        } else {
            \Log::info('ModerateImageJob: image approved', ['path' => $this->imagePath]);
            // Mover a storage permanente o actualizar 
        }
    }
}
