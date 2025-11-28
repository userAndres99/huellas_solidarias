<?php

namespace App\Jobs;

use App\Events\SocketMessageDeleted;
use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class ModerateMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Message $message)
    {
        // mensaje a moderar
    }

    public function handle()
    {
        $m = Message::find($this->message->id);
        if (! $m) return; // ya eliminado

        $apiKey = env('OPEN_MODERATOR_API_KEY');
        if (! $apiKey) return; // no hay nada que hacer

        try {
            $payload = ['prompt' => $m->message ?? '', 'config' => ['provider' => 'google-perspective-api']];
            $resp = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-api-key' => $apiKey,
            ])->timeout(15)->post('https://www.openmoderator.com/api/moderate/text', $payload);

            if ($resp->successful()) {
                $body = $resp->json();
                if (! empty($body['profane'])) {
                    // calcular el mensaje anterior para la conversación/grupo 
                    $prev = null;
                    if ($m->group_id) {
                        $prevMsg = Message::where('group_id', $m->group_id)->where('id', '<>', $m->id)->latest()->first();
                    } else {
                        $prevMsg = Message::where(function($q) use ($m) {
                            $q->where('sender_id', $m->sender_id)->where('receiver_id', $m->receiver_id);
                        })->orWhere(function($q) use ($m) {
                            $q->where('sender_id', $m->receiver_id)->where('receiver_id', $m->sender_id);
                        })->where('id', '<>', $m->id)->latest()->first();
                    }

                    if ($prevMsg) {
                        $prev = [
                            'id' => $prevMsg->id,
                            'message' => $prevMsg->message,
                            'created_at' => $prevMsg->created_at?->toIsoString() ?? null,
                        ];
                    }

                    $deletedMessage = [
                        'id' => $m->id,
                        'sender_id' => $m->sender_id,
                        'receiver_id' => $m->receiver_id,
                        'group_id' => $m->group_id,
                        'message' => $m->message,
                        'created_at' => $m->created_at?->toIsoString() ?? null,
                    ];

                    // borrar el mensaje
                    $m->delete();
                    SocketMessageDeleted::dispatch(['deletedMessage' => $deletedMessage, 'prevMessage' => $prev]);
                }
            }
        } catch (\Exception $e) {
            \Log::error('ModerateMessageJob error: ' . $e->getMessage());
        }
    }
}
