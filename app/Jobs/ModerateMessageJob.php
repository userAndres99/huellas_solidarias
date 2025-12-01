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
                        try { \Log::info('ModerateMessageJob: prevMsg id=' . $prevMsg->id); } catch (\Throwable $e) {}
                        $prev = [
                            'id' => $prevMsg->id,
                            'message' => $prevMsg->message,
                            'created_at' => $prevMsg->created_at?->toIsoString() ?? null,
                        ];

                        // asegurar que prev no es el mismo mensaje que se va a borrar
                        if (isset($prev['id']) && $prev['id'] == $m->id) {
                            try { \Log::warning('ModerateMessageJob: prevMsg id equals deleted message id; nulling prev'); } catch (\Throwable $e) {}
                            $prev = null;
                        }
                    }

                    $deletedMessage = [
                        'id' => $m->id,
                        'sender_id' => $m->sender_id,
                        'receiver_id' => $m->receiver_id,
                        'group_id' => $m->group_id,
                        'message' => $m->message,
                        'created_at' => $m->created_at?->toIsoString() ?? null,
                    ];

                    // preparar conversationPayload para actualizar la conversación o grupo en los clientes
                    $conversationPayload = null;
                    try {
                        if (! empty($m->group_id)) {
                            $group = \App\Models\Group::find($m->group_id);
                            if ($group) {
                                $conversationPayload = [
                                    'is_group' => true,
                                    'id' => $group->id,
                                    'name' => $group->name ?? ('Grupo ' . $group->id),
                                    'last_message' => $prev ? ($prev['message'] ?? 'Mensaje borrado') : 'Mensaje borrado',
                                    'last_message_date' => $prev ? ($prev['created_at'] ?? $deletedMessage['created_at']) : ($deletedMessage['created_at'] ?? null),
                                    'avatar' => $group->avatar ?? null,
                                    'avatar_url' => $group->avatar_url ?? null,
                                ];
                            }
                        } else {
                            // conversación entre usuarios: elegir el ID del otro usuario
                            $otherId = ($m->sender_id == auth()->id()) ? $m->receiver_id : $m->sender_id;
                            $other = \App\Models\User::find($otherId);
                            $conversationPayload = [
                                'is_user' => true,
                                'is_group' => false,
                                'id' => $other?->id ?? $otherId,
                                'name' => $other?->name ?? ('Usuario ' . $otherId),
                                'last_message' => $prev ? ($prev['message'] ?? 'Mensaje borrado') : 'Mensaje borrado',
                                'last_message_date' => $prev ? ($prev['created_at'] ?? $deletedMessage['created_at']) : ($deletedMessage['created_at'] ?? null),
                                'avatar' => $other?->avatar ?? $other?->profile_photo_url ?? null,
                                'avatar_url' => $other?->profile_photo_url ?? $other?->avatar ?? null,
                            ];
                        }
                    } catch (\Throwable $e) {
                        // ignorar y dejar conversationPayload como null
                    }

                    // Log y borrar el mensaje
                    try { \Log::info('ModerateMessageJob: deleting message_id=' . $m->id . ' due to moderation'); } catch (\Throwable $e) {}
                    $m->delete();

                    // Asegurarse de actualizar el last_message_id en la conversación o grupo
                    try {
                        if (! empty($m->group_id)) {
                            $group = \App\Models\Group::find($m->group_id);
                            if ($group) {
                                $prevMsgAfter = Message::where('group_id', $m->group_id)->where('id', '<>', $m->id)->latest()->first();
                                $group->last_message_id = $prevMsgAfter?->id ?? null;
                                $group->save();
                                // reconstruir conversationPayload autoritativo desde el group actualizado
                                $conversationPayload = [
                                    'is_group' => true,
                                    'id' => $group->id,
                                    'name' => $group->name ?? ('Grupo ' . $group->id),
                                    'last_message' => $prevMsgAfter?->message ?? 'Mensaje borrado',
                                    'last_message_date' => $prevMsgAfter?->created_at?->toIsoString() ?? null,
                                    'avatar' => $group->avatar ?? null,
                                    'avatar_url' => $group->avatar_url ?? null,
                                ];
                            }
                        } else {
                            // conversación entre usuarios: actualizar Conversation.last_message_id
                            $conversation = \App\Models\Conversation::where('last_message_id', $m->id)->first();
                            if ($conversation) {
                                $prevMsgAfter = Message::where(function($q) use ($m) {
                                    $q->where('sender_id', $m->sender_id)->where('receiver_id', $m->receiver_id);
                                })->orWhere(function($q) use ($m) {
                                    $q->where('sender_id', $m->receiver_id)->where('receiver_id', $m->sender_id);
                                })->where('id', '<>', $m->id)->latest()->first();

                                $conversation->last_message_id = $prevMsgAfter?->id ?? null;
                                $conversation->save();

                                $otherId = ($m->sender_id == auth()->id()) ? $m->receiver_id : $m->sender_id;
                                $other = \App\Models\User::find($otherId);
                                $conversationPayload = [
                                    'is_user' => true,
                                    'is_group' => false,
                                    'id' => $other?->id ?? $otherId,
                                    'name' => $other?->name ?? ('Usuario ' . $otherId),
                                    'last_message' => $prevMsgAfter?->message ?? 'Mensaje borrado',
                                    'last_message_date' => $prevMsgAfter?->created_at?->toIsoString() ?? null,
                                    'avatar' => $other?->avatar ?? $other?->profile_photo_url ?? null,
                                    'avatar_url' => $other?->profile_photo_url ?? $other?->avatar ?? null,
                                ];
                            }
                        }
                    } catch (\Throwable $e) {
                       
                    }

                    try { \Log::info('ModerateMessageJob: dispatching SocketMessageDeleted for message_id=' . $deletedMessage['id']); } catch (\Throwable $e) {}
                    $payload = ['deletedMessage' => $deletedMessage, 'prevMessage' => $prev];
                    if ($conversationPayload) $payload['conversation'] = $conversationPayload;
                    SocketMessageDeleted::dispatch($payload);
                }
            }
        } catch (\Exception $e) {
            \Log::error('ModerateMessageJob error: ' . $e->getMessage());
        }
    }
}
