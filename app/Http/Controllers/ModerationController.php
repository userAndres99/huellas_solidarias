<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ModerationController extends Controller
{
    /**
     * Moderar texto usando OpenModerator API
     */
    public function moderate(Request $request)
    {
        $request->validate([
            'texto' => 'required_without:image|string|max:5000',
        ]);

        $texto = $request->input('texto');

        $apiKey = env('OPEN_MODERATOR_API_KEY');
        if (! $apiKey) {
            return response()->json(['error' => 'OpenModerator API key not configured'], 500);
        }

        try {
            $payload = ['prompt' => $texto, 'config' => ['provider' => 'google-perspective-api']];

            $resp = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-api-key' => $apiKey,
            ])->timeout(10)->post('https://www.openmoderator.com/api/moderate/text', $payload);

            if (! $resp->successful()) {
                return response()->json(['error' => 'Moderation provider error'], 502);
            }

            $data = $resp->json();

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error('Moderation error: ' . $e->getMessage());
            return response()->json(['error' => 'Moderation request failed'], 500);
        }
    }
}
