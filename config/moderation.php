<?php

return [
    // Umbral general para marcar una imagen como "inapropiada" (0..1).
    'image_threshold' => env('MODERATION_IMAGE_THRESHOLD', 0.60),

    // Umbral para marcar como "sospechosa" y pasar a revisión manual.
    'image_suspicious_threshold' => env('MODERATION_IMAGE_SUSPICIOUS_THRESHOLD', 0.45),

    // Modelos por defecto a solicitar a Sightengine
    'sightengine_models' => ['nudity','offensive','wad','celebrities','weapon','violence','gore'],

    // Umbrales por modelo (0..1) — ajustar según tus pruebas
    'model_thresholds' => [
        'nudity' => 0.6,
        'offensive' => 0.6,
        'weapon' => 0.5,
        'violence' => 0.5,
        'gore' => 0.5,
        'drugs' => 0.6,
        'alcohol' => 0.6,
    ],

    // Cola donde se enviarán los jobs de moderación
    'queue' => env('MODERATION_QUEUE', 'moderation'),
];
