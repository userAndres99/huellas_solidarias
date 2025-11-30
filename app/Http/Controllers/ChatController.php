<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Conversation;

class ChatController extends Controller
{
    public function chat()
    {
        $authUser = auth()->user();

        return inertia('Chat/ChatDashboard', [
            'conversations' => Conversation::getConversationsForSidebar($authUser), 
            'selectedConversation' => null, // o la que corresponda
            'users' => User::where('id', '!=', $authUser->id)->get(),
        ]);
    }
}
