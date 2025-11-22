import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEventBus } from '@/EvenBus';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import MessageItem from '@/Components/App/MessageItem';
import MessageInput from '@/Components/App/MessageInput';

export default function ChatWidget() {
    const { on } = useEventBus();
    const [mounted, setMounted] = useState(false);
    const page = usePage();
    const user = page.props.auth?.user;
    const conversations = page.props.conversations || [];

    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesRef = useRef(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!on) return;
        const off = on('newMessageNotification', (payload) => {
            setUnread((u) => u + 1);
        });

        return off;
    }, [on]);

    
    useEffect(() => {
        if (!on) return;

        const handleCreated = (message) => {
            if (!selectedConversation) return;

            
            if (selectedConversation.is_group && message.group_id && selectedConversation.id == message.group_id) {
                setMessages((prev) => [...prev, message]);
                setTimeout(() => {
                    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                }, 30);
                return;
            }

           
            if (selectedConversation.is_user) {
                const isRelevant = (message.receiver_id && (message.receiver_id == selectedConversation.id || message.sender_id == selectedConversation.id)) || (message.sender_id && message.receiver_id && (message.sender_id == selectedConversation.id || message.receiver_id == selectedConversation.id));
                
                if (isRelevant) {
                    
                    const authId = page.props.auth?.user?.id;
                    if (authId && (message.sender_id == authId || message.receiver_id == authId)) {
                        setMessages((prev) => [...prev, message]);
                        setTimeout(() => {
                            if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                        }, 30);
                    }
                }
            }
        };

        const handleDeleted = ({ message }) => {
            if (!selectedConversation) return;
            setMessages((prev) => prev.filter((m) => m.id !== message.id));
        };

        const offCreated = on('message.created', handleCreated);
        const offDeleted = on('message.deleted', handleDeleted);

        return () => {
            offCreated();
            offDeleted();
        };
    }, [on, selectedConversation]);

    useEffect(() => {
        
        if (open) setUnread(0);
    }, [open]);

    if (!user) return null;

    useEffect(() => setMounted(true), []);

    const widget = (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="relative">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:scale-105 transition"
                    aria-label="Abrir chat"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    {unread > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">{unread}</span>
                    )}
                </button>

                {open && (
                    <div className="fixed bottom-0 left-0 right-0 w-full h-[70vh] rounded-t-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-50 sm:absolute sm:bottom-16 sm:right-full sm:mr-4 sm:left-auto sm:w-[760px] sm:max-h-[520px] sm:h-auto sm:rounded-lg">
                        <div className="h-full flex flex-col sm:flex-row">

                            <div className="w-full sm:w-72 border-r border-blue-800 bg-blue-900 text-white flex flex-col">
                                <div className="px-4 py-3 border-b border-blue-800">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-white">Mis conversaciones</h3>
                                        <button onClick={() => setOpen(false)} className="text-sm text-white/90">Cerrar</button>
                                    </div>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Filtrar usuarios y grupos"
                                            className="input input-bordered w-full bg-white text-slate-800"
                                        />
                                    </div>
                                </div>
                                <div className="p-2 overflow-auto">
                                    {conversations.length === 0 ? (
                                        <div className="text-sm text-blue-200 p-4">No hay conversaciones</div>
                                    ) : (
                                        conversations.filter(c => ( (c.name||c.title||'') .toString().toLowerCase().includes(search.toLowerCase()) ) ).map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={async () => {
                                                    setSelectedConversation(c);
                                                    setLoadingMessages(true);
                                                    try {
                                                        const url = c.is_user ? route('message.user.json', c.id) : route('message.group.json', c.id);
                                                        const { data } = await axios.get(url);
                                                        setMessages(data.data.reverse());
                                                        setTimeout(() => {
                                                            if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                                                        }, 30);
                                                    } catch (err) {
                                                        console.error('Error loading messages', err);
                                                    } finally {
                                                        setLoadingMessages(false);
                                                    }
                                                }}
                                                className="w-full text-left block px-3 py-2 border border-blue-800/30 rounded-md mb-2 last:mb-0 hover:bg-blue-800"
                                            >
                                                <div className="text-sm font-medium text-white">{c.title ?? c.name ?? (c.is_user ? c.other_name : `Grupo ${c.id}`)}</div>
                                                <div className="text-xs text-blue-200 truncate">{c.last_message?.message ?? c.last_message?.text ?? ''}</div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 bg-white flex flex-col">
                                <div className="px-4 py-3 border-b">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Mensajes</h3>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {!selectedConversation ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                            <div className="text-lg text-slate-800">Por favor selecciona una conversación</div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full sm:h-[520px]">
                                            <div className="flex items-center justify-between px-3 py-2 border-b">
                                                <button
                                                    onClick={() => { setSelectedConversation(null); setMessages([]); }}
                                                    className="text-sm text-gray-600"
                                                >
                                                    Volver
                                                </button>
                                                <div className="text-sm font-medium truncate">
                                                    {selectedConversation.title ??
                                                        selectedConversation.name ??
                                                        (selectedConversation.is_user
                                                            ? selectedConversation.other_name
                                                            : `Grupo ${selectedConversation.id}`)}
                                                </div>
                                                <a
                                                    href={
                                                        selectedConversation.is_user
                                                            ? route('chat.user', selectedConversation.id)
                                                            : route('chat.group', selectedConversation.id)
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-blue-600"
                                                >
                                                    Abrir
                                                </a>
                                            </div>

                                            <div
                                                ref={messagesRef}
                                                className="flex-1 overflow-auto px-3 py-2 bg-gray-50 min-w-0"
                                            >
                                                {loadingMessages ? (
                                                    <div className="text-sm text-gray-500 p-2">Cargando mensajes...</div>
                                                ) : messages.length === 0 ? (
                                                    <div className="text-sm text-gray-500 p-2">No hay mensajes</div>
                                                ) : (
                                                    messages.map((m) => <MessageItem key={m.id} message={m} />)
                                                )}
                                            </div>

                                            <div className="flex-shrink-0 p-2 border-t bg-white">
                                                <MessageInput conversation={selectedConversation} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (!mounted) return null;

    return createPortal(widget, document.body);
}