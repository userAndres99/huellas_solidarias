<?php

namespace App\Observers;

use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Support\Facades\Storage;

class MessageObserver
{
    //Escucha cuando un mensaje es eliminado
    public function deleting(Message $message)
    {
        // Iterar sobre los archivos adjuntos del mensaje y eliminarlos del sistema de archivos
        $message -> attachments->each(function ($attachment){
            // Eliminar archivo adjunto del sistema de archivos guardado en un disco público
            $dir = dirname($attachment->path);
            Storage::disk('public')->deleteDirectory($dir);
        });  
        //Elimine todos los archivos adjuntos relacionados con el mensaje de la base de datos
        $message->attachments()->delete();
        
        //Actualice el último mensaje del grupo y la conversación si el mensaje es el último mensaje
        if ($message->group_id){
            $group = Group::where('last_message_id', $message->id)->first();

            if($group) {
                $prevMessage = Message::where('group_id', $message->group_id)
                    ->where('id', '!=', $message->id)
                    ->latest()
                    ->limit(1)
                    ->first();
                    
                if ($prevMessage){
                    $group->last_message_id = $prevMessage->id;
                    $group->save();
                }
            }
        }else{
            $conversation = Conversation::where('last_message_id', $message->id)->first();

            // si el mensaje es el último mensaje de la conversación
            if ($conversation){
                $prevMessage = Message::where(function($query) use ($message){
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                    ->where('id', "!=", $message->id)
                    ->latest()
                    ->limit(1)
                    ->first();

                
                if ($prevMessage) {
                    $conversation->last_message_id = $prevMessage->id;
                    $conversation->save();
                }
            }
        }
    }
}
