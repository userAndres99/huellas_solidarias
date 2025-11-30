import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEventBus } from '@/EvenBus';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/solid';
import MessageItem from '@/Components/App/MessageItem';
import MessageInput from '@/Components/App/MessageInput';
import ConversationItem from '@/Components/App/ConversationItem';
import GroupModal from '@/Components/App/GroupModal';

export default function ChatWidget() {
    const { on, emit } = useEventBus();
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
    const [isMobile, setIsMobile] = useState(false);
    const initialInnerHeightRef = useRef(null);
    const sentinelRef = useRef(null);
    const inputContainerRef = useRef(null);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState({});

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

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // para manejar el enfoque del input y ajustar la vista para modo responsive
    const handleInputFocus = () => {
        try {
            if (!messagesRef.current) return;

            // recalcular la altura disponible usando visualViewport 
            try {
                const vv = window.visualViewport;
                const viewportHeight = (vv && vv.height) || window.innerHeight;
                const top = messagesRef.current.getBoundingClientRect().top;
                const inputH = inputContainerRef.current ? inputContainerRef.current.getBoundingClientRect().height : 64;
                const available = Math.max(100, Math.floor(viewportHeight - top - inputH - 12));
                messagesRef.current.style.height = `${available}px`;
                messagesRef.current.style.maxHeight = `${available}px`;
            } catch (e) {}

            if (!messagesRef.current.style.paddingBottom) messagesRef.current.style.paddingBottom = '220px';
            messagesRef.current.style.touchAction = 'pan-y';

            const start = Date.now();
            const timeout = 900; // ms
            const tryScroll = () => {
                try {
                    if (!messagesRef.current) return;
                    const atBottom = messagesRef.current.scrollTop + messagesRef.current.clientHeight >= messagesRef.current.scrollHeight - 2;
                    if (!atBottom) {
                        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                    }
                    if (sentinelRef.current) {
                        sentinelRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
                    }
                } catch (e) {}
                if (Date.now() - start < timeout) {
                    requestAnimationFrame(tryScroll);
                }
            };
            tryScroll();
        } catch (e) {}
    };

    const handleInputBlur = () => {
        try {
            if (messagesRef.current) messagesRef.current.style.paddingBottom = '';
        } catch (e) {}
    };

    // manejo de visualViewport para teclados móviles
    useEffect(() => {
        try {
            initialInnerHeightRef.current = window.innerHeight;
        } catch (e) {
            initialInnerHeightRef.current = null;
        }

        const onResize = () => {
            try {
                const initial = initialInnerHeightRef.current || window.innerHeight;
                const current = window.innerHeight;
                const delta = initial - current;
                if (delta > 100 && messagesRef.current) {
                    messagesRef.current.style.paddingBottom = `${delta + 80}px`;
                    messagesRef.current.scrollTop = messagesRef.current.scrollHeight + delta;
                } else if (messagesRef.current) {
                    messagesRef.current.style.paddingBottom = '';
                }
            } catch (e) {}
        };

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Seguimiento de usuarios en línea para el widget (misma lógica que en ChatLayout)
    useEffect(() => {
        try {
            Echo.join('online')
                .here((users) => {
                    const onlineUsersObj = Object.fromEntries(users.map((u) => [u.id, u]));
                    setOnlineUsers((prev) => ({ ...prev, ...onlineUsersObj }));
                })
                .joining((user) => setOnlineUsers((prev) => ({ ...prev, [user.id]: user })))
                .leaving((user) =>
                    setOnlineUsers((prev) => {
                        const updated = { ...prev };
                        delete updated[user.id];
                        return updated;
                    })
                )
                .error((error) => console.error('Echo error:', error));
        } catch (e) {
            
        }

        return () => {
            try {
                Echo.leave('online');
            } catch (e) {}
        };
    }, []);

    // Uso de visualViewport para ajustar alturas en móviles
    useEffect(() => {
        const updateHeights = () => {
            try {
                if (!messagesRef.current) return;
                const vv = window.visualViewport;
                const viewportHeight = (vv && vv.height) || window.innerHeight;
                const top = messagesRef.current.getBoundingClientRect().top;
                const inputH = inputContainerRef.current ? inputContainerRef.current.getBoundingClientRect().height : 64;
                const available = Math.max(100, Math.floor(viewportHeight - top - inputH - 12));
                messagesRef.current.style.height = `${available}px`;
                messagesRef.current.style.maxHeight = `${available}px`;
            } catch (e) {}
        };

        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener('resize', updateHeights);
            vv.addEventListener('scroll', updateHeights);
        }
        window.addEventListener('resize', updateHeights);
        setTimeout(updateHeights, 120);
        return () => {
            if (vv) {
                vv.removeEventListener('resize', updateHeights);
                vv.removeEventListener('scroll', updateHeights);
            }
            window.removeEventListener('resize', updateHeights);
        };
    }, [selectedConversation, messages]);

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
                    <div className="fixed bottom-4 right-4 w-[92vw] max-h-[85vh] h-auto rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-50 sm:fixed sm:bottom-16 sm:right-4 sm:left-auto sm:w-[760px] sm:max-h-[520px] sm:h-auto sm:rounded-lg">
                        <div className="h-full flex flex-col sm:flex-row">

                            {!(isMobile && selectedConversation) && (
                                <div className="w-full sm:w-72 border-r bg-slate-800 text-white flex flex-col flex-1 overflow-y-auto">
                                    <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-white">Usuarios Conectados</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="tooltip tooltip-left" data-tip="Create new Group">
                                                <button
                                                    onClick={() => {
                                                        if (emit) emit('GroupModal.show', { name: '', description: '', users: [], owner_id: user.id });
                                                        setShowGroupModal(true);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-200"
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                            <div className="tooltip tooltip-left" data-tip="Cerrar chat">
                                                <button
                                                    onClick={() => setOpen(false)}
                                                    className="text-gray-400 hover:text-gray-200"
                                                    aria-label="Cerrar chat"
                                                    title="Cerrar chat"
                                                >
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <GroupModal show={showGroupModal} onClose={() => setShowGroupModal(false)} />
                                    </div>

                                    <div className="p-3">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Filtrar usuarios y grupos"
                                            className="input input-bordered w-full bg-white text-slate-800"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                                        {conversations.length === 0 ? (
                                            <div className="text-sm text-blue-200 p-4">No hay conversaciones</div>
                                        ) : (
                                            conversations
                                                .filter((c) => c && (((c.name || c.title || '') + '').toString().toLowerCase().includes(search.toLowerCase())))
                                                .map((c, idx) => {
                                                    if (!c) return null;
                                                    const keyId = c.id ?? idx;
                                                    return (
                                                        <ConversationItem
                                                            key={`${c.is_group ? 'group' : 'user'}_${keyId}_${idx}`}
                                                            conversation={c}
                                                            online={!!onlineUsers[c.id]}
                                                            selectedConversation={selectedConversation}
                                                            onSelect={async (conv) => {
                                                                setSelectedConversation(conv);
                                                                setLoadingMessages(true);
                                                                try {
                                                                    const url = conv.is_user ? route('message.user.json', conv.id) : route('message.group.json', conv.id);
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
                                                        />
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={`flex-1 bg-white flex flex-col ${isMobile && !selectedConversation ? 'hidden' : ''}`}>
                                <div className="px-4 py-3 border-b">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Mensajes</h3>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                                    {!selectedConversation ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                            <div className="text-lg text-slate-800">Por favor selecciona una conversación</div>
                                        </div>
                                    ) : (
                                        <div className={`flex flex-col h-full sm:h-[520px] min-h-0 ${isMobile ? 'h-[60vh]' : ''}`}>
                                            <div className="flex items-center justify-between px-3 py-2 border-b">
                                                <button
                                                    onClick={() => { setSelectedConversation(null); setMessages([]); }}
                                                    className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
                                                >
                                                    Volver
                                                </button>
                                                <div className="text-sm font-medium truncate">
                                                    {selectedConversation.title ?? selectedConversation.name ?? (selectedConversation.is_user ? selectedConversation.other_name : `Grupo ${selectedConversation.id}`)}
                                                </div>
                                            </div>

                                            <div
                                                ref={messagesRef}
                                                className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 bg-gray-50 min-w-0"
                                                style={{ WebkitOverflowScrolling: 'touch' }}
                                            >
                                                {loadingMessages ? (
                                                    <div className="text-sm text-gray-500 p-2">Cargando mensajes...</div>
                                                ) : messages.length === 0 ? (
                                                    <div className="text-sm text-gray-500 p-2">No hay mensajes</div>
                                                ) : (
                                                    messages.map((m) => <MessageItem key={m.id} message={m} />)
                                                )}
                                                <div ref={sentinelRef}></div>
                                            </div>

                                            <div className="flex-shrink-0 p-2 border-t bg-white" ref={inputContainerRef}>
                                                <MessageInput conversation={selectedConversation} onFocus={handleInputFocus} onBlur={handleInputBlur} isMobile={isMobile} compact={true} />
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