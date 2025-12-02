import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEventBus } from '@/EvenBus';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/solid';
import MessageItem from '@/Components/App/MessageItem';
import MessageInput from '@/Components/App/MessageInput';
import ConversationItem from '@/Components/App/ConversationItem';
import GroupModal from '@/Components/App/GroupModal';

export default function ChatWidget() {
    const { on, emit, hasDeletedMessage, isConversationTombstoned } = useEventBus();
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
    const [hiddenConversations, setHiddenConversations] = useState([]);
    const [localConversations, setLocalConversations] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const subscribedChannels = useRef(new Set());
    // evitar recargas repetidas para la misma conversación cuando falta avatar
    const pendingConvReloads = useRef(new Set());

    useEffect(() => {
        if (!on) return;
        const off = on('newMessageNotification', (payload) => {
            setUnread((u) => u + 1);
            try {
                
                const key = payload.group_id ? `g_${payload.group_id}` : payload.user?.id;
                if (!key) return;
                setUnreadCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
            } catch (e) {}
        });

        // Si recibimos un nuevo mensaje en tiempo real y la conversación con el remitente
        // estaba oculta para nosotros, la desocultamos 
        const offUnhide = on('message.created', (message) => {
            try {
                
                try {
                    const msgId = message?.id;
                    const createdAt = message?.created_at || null;
                    const keys = [];
                    if (message?.group_id) keys.push(`g_${message.group_id}`);
                    if (message?.sender_id && message?.receiver_id) {
                        keys.push(`u_${message.sender_id}_${message.receiver_id}`);
                        keys.push(`u_${message.receiver_id}_${message.sender_id}`);
                    }
                    if (msgId && hasDeletedMessage && hasDeletedMessage(msgId)) {
                        console.debug('[ChatWidget] Skipping message.created because id is recently deleted', msgId);
                        return;
                    }
                    if (isConversationTombstoned && isConversationTombstoned(keys, createdAt)) {
                        console.debug('[ChatWidget] Skipping message.created because conversation is tombstoned', { keys, createdAt });
                        return;
                    }
                } catch (e) {}

                const authId = page.props.auth?.user?.id;
                if (!authId) return;
                // Solo para mensajes privados dirigidos al usuario autenticado
                if (message.group_id) return;
                if (message.receiver_id && parseInt(message.receiver_id) === parseInt(authId)) {
                    const senderId = parseInt(message.sender_id);
                    setHiddenConversations((prev) => {
                        if (!prev.includes(senderId)) return prev;
                        return prev.filter((id) => id !== senderId);
                    });
                    // Construir objeto de conversación mínimo a partir del remitente
                    const sender = message.sender || {};
                    const serverConvs = page.props.conversations || [];

                    setLocalConversations((prev) => {
                        const existingServerConv = serverConvs.find((c) => parseInt(c.id) === parseInt(sender.id || senderId));
                        const existingLocal = (prev || []).find((c) => parseInt(c.id) === parseInt(sender.id || senderId));
                        const name = sender.name || sender.display_name || existingLocal?.name || existingServerConv?.name || `Usuario ${senderId}`;
                        const avatarFromSender = sender.avatar || sender.avatar_url || sender.profile_photo_url || null;
                        const defaultAvatar = (typeof window !== 'undefined' && window.location ? `${window.location.origin}/images/DefaultPerfil.jpg` : '/images/DefaultPerfil.jpg');
                        const avatar = existingLocal?.avatar || existingLocal?.avatar_url || avatarFromSender || existingServerConv?.avatar || existingServerConv?.avatar_url || existingServerConv?.profile_photo_url || defaultAvatar;
                        const convObj = {
                            is_user: true,
                            is_group: false,
                            id: sender.id || senderId,
                            name,
                            avatar,
                            avatar_url: avatar || existingLocal?.avatar_url || existingServerConv?.avatar_url || existingServerConv?.profile_photo_url || defaultAvatar,
                            last_message: message.message || '',
                            last_message_date: message.created_at || null,
                            conversation_id: message.conversation_id || null,
                            with_user_id: sender.id || senderId,
                        };

                        // Upsert: eliminar cualquier entrada previa con la misma clave (id + is_group) y reinsertar al frente
                        const convId = parseInt(convObj.id);
                        const convIsGroup = !!convObj.is_group;
                        const filtered = (prev || []).filter((c) => {
                            try {
                                const cid = parseInt(c.id);
                                const cisGroup = !!c.is_group;
                                return !(cid === convId && cisGroup === convIsGroup);
                            } catch (e) { return true; }
                        });
                        return [convObj, ...filtered];
                    });
                    // si no tenemos avatar confiable, pedir al servidor que refresque las `conversations`
                    try {
                        const serverHasAvatar = (page.props.conversations || []).some((c) => parseInt(c.id) === parseInt(sender.id || senderId) && (c.avatar || c.avatar_url || c.profile_photo_url));
                        const createdAvatar = sender.avatar || sender.avatar_url || sender.profile_photo_url || null;
                        const needReload = !createdAvatar && !serverHasAvatar && !pendingConvReloads.current.has(senderId);
                        if (needReload) {
                            pendingConvReloads.current.add(senderId);
                            try { router.reload({ only: ['conversations'] }); } catch (e) {}
                            // permitir reintento más tarde si algo falla
                            setTimeout(() => pendingConvReloads.current.delete(senderId), 10000);
                        }
                    } catch (e) {}
                }
                
                    if (message.sender_id && parseInt(message.sender_id) === parseInt(authId)) {
                    const receiverId = parseInt(message.receiver_id || message.to || 0);
                    if (receiverId) {
                        // protection similar a arriba para mensajes que nos enviamos a nosotros mismos
                        try {
                            const msgId = message?.id;
                            const createdAt = message?.created_at || null;
                            const keys = [];
                            if (message?.group_id) keys.push(`g_${message.group_id}`);
                            if (message?.sender_id && message?.receiver_id) {
                                keys.push(`u_${message.sender_id}_${message.receiver_id}`);
                                keys.push(`u_${message.receiver_id}_${message.sender_id}`);
                            }
                            if (msgId && hasDeletedMessage && hasDeletedMessage(msgId)) {
                                console.debug('[ChatWidget] Skipping self message.created because id is recently deleted', msgId);
                                return;
                            }
                            if (isConversationTombstoned && isConversationTombstoned(keys, createdAt)) {
                                console.debug('[ChatWidget] Skipping self message.created because conversation is tombstoned', { keys, createdAt });
                                return;
                            }
                        } catch (e) {}
                        const receiver = message.receiver || null;
                        const serverConvs = page.props.conversations || [];

                        setHiddenConversations((prevHidden) => prevHidden.filter((id) => parseInt(id) !== parseInt(receiverId)));

                        setLocalConversations((prev) => {
                            const existingServer = serverConvs.find((c) => parseInt(c.id) === parseInt(receiverId));
                            const existingLocal = (prev || []).find((c) => parseInt(c.id) === parseInt(receiverId));
                            const name = (receiver && (receiver.name || receiver.display_name)) || existingLocal?.name || existingServer?.name || `Usuario ${receiverId}`;
                            const avatarFromReceiver = (receiver && (receiver.avatar_url || receiver.avatar || receiver.profile_photo_url)) || null;
                            const avatar = existingLocal?.avatar || existingLocal?.avatar_url || avatarFromReceiver || existingServer?.avatar || existingServer?.avatar_url || existingServer?.profile_photo_url || null;
                            const defaultAvatar = (typeof window !== 'undefined' && window.location ? `${window.location.origin}/images/DefaultPerfil.jpg` : '/images/DefaultPerfil.jpg');
                            const convObjMe = {
                                is_user: true,
                                is_group: false,
                                id: receiverId,
                                name,
                                avatar: avatar || defaultAvatar,
                                avatar_url: avatar || existingLocal?.avatar_url || existingServer?.avatar_url || existingServer?.profile_photo_url || defaultAvatar,
                                last_message: (message.message ? `Yo: ${message.message}` : 'Yo'),
                                last_message_date: message.created_at || null,
                                conversation_id: message.conversation_id || null,
                                with_user_id: receiverId,
                            };

                            const convIdMe = parseInt(convObjMe.id);
                            const convIsGroupMe = !!convObjMe.is_group;
                            const filtered = (prev || []).filter((c) => {
                                try {
                                    const cid = parseInt(c.id);
                                    const cisGroup = !!c.is_group;
                                    return !(cid === convIdMe && cisGroup === convIsGroupMe);
                                } catch (e) { return true; }
                            });
                            const result = [convObjMe, ...filtered];
                            // Si no hay avatar conocido, intentar recargar las `conversations` desde el servidor
                            try {
                                const createdAvatar = (message.receiver && (message.receiver.avatar || message.receiver.avatar_url || message.receiver.profile_photo_url)) || null;
                                const serverHasAvatar = (page.props.conversations || []).some((c) => parseInt(c.id) === parseInt(receiverId) && (c.avatar || c.avatar_url || c.profile_photo_url));
                                if (!createdAvatar && !serverHasAvatar && !pendingConvReloads.current.has(receiverId)) {
                                    pendingConvReloads.current.add(receiverId);
                                    try { router.reload({ only: ['conversations'] }); } catch (e) {}
                                    setTimeout(() => pendingConvReloads.current.delete(receiverId), 10000);
                                }
                            } catch (e) {}
                            return result;
                        });
                    }
                }
            } catch (e) {}
        });

        const offDeleted = on('message.deleted', (payload) => {
            try {
                const deletedMessage = payload?.deletedMessage || payload?.message || payload?.deleted_message || null;
                const prevMessage = payload?.prevMessage || payload?.prev_message || null;
                if (!deletedMessage) return;

                // si hay un conversationPayload, actualizar o insertar la conversación/grupo en el sidebar
                const convPayload = payload?.conversation || null;
                if (convPayload) {
                    try {
                        setLocalConversations((prev) => {
                            const convId = parseInt(convPayload.id);
                            const convIsGroup = !!convPayload.is_group;
                            const filtered = (prev || []).filter((c) => {
                                try {
                                    const cid = parseInt(c.id);
                                    const cisGroup = !!c.is_group;
                                    return !(cid === convId && cisGroup === convIsGroup);
                                } catch (e) { return true; }
                            });
                            const existingLocal = (prev || []).find((c) => { try { return parseInt(c.id) === convId && (!!c.is_group) === convIsGroup; } catch (e) { return false; } });
                            const defaultAvatar = (typeof window !== 'undefined' && window.location ? `${window.location.origin}/images/DefaultPerfil.jpg` : '/images/DefaultPerfil.jpg');
                            const avatar = existingLocal?.avatar || existingLocal?.avatar_url || convPayload.avatar || convPayload.avatar_url || existingLocal?.profile_photo_url || defaultAvatar;
                            const avatar_url = existingLocal?.avatar_url || existingLocal?.avatar || convPayload?.avatar_url || convPayload?.avatar || existingLocal?.profile_photo_url || defaultAvatar;
                            const merged = { ...convPayload, avatar, avatar_url };
                            return [merged, ...filtered];
                        });
                        try { router.reload({ only: ['conversations'] }); } catch (e) {}
                        return;
                    } catch (e) {}
                }

                console.debug('[ChatWidget] message.deleted payload=', { deletedMessage, prevMessage });

                setLocalConversations((prev) => {
                    let found = false;
                    const updated = prev.map((u) => {
                        const matchUser =
                            (!u.is_group &&
                                (u.id == deletedMessage.sender_id || u.id == deletedMessage.receiver_id)) ||
                            (u.is_group && deletedMessage.group_id && u.id == deletedMessage.group_id);

                        if (!matchUser) return u;
                        found = true;

                        // solo actualizar la vista previa si el mensaje eliminado era el último mensaje visible
                        const lastDate = u.last_message_date || null;
                        const lastText = ((u.last_message || '') + '').toString();
                        const deletedDate = deletedMessage.created_at || null;
                        const deletedText = ((deletedMessage.message || '') + '').toString();

                        const normalize = (s) => (s || '').toString().replace(/^\s*Yo:\s*/i, '').trim();
                        const normalizedLast = normalize(lastText);
                        const normalizedDeleted = normalize(deletedText);

                        const isDeletedTheLast =
                            (lastDate && deletedDate && lastDate === deletedDate) ||
                            (normalizedLast && normalizedDeleted && normalizedLast === normalizedDeleted) ||
                            (normalizedLast && normalizedDeleted && normalizedLast.includes(normalizedDeleted));

                        if (!isDeletedTheLast) {
                            return u;
                        }

                        const defaultAvatar = (typeof window !== 'undefined' && window.location ? `${window.location.origin}/images/DefaultPerfil.jpg` : '/images/DefaultPerfil.jpg');

                        if (prevMessage) {
                            try {
                                const authId = page.props.auth?.user?.id;
                                const text = prevMessage.message || '';
                                const shouldPrefix = authId && parseInt(prevMessage.sender_id) === parseInt(authId);
                                const display = shouldPrefix ? (text.startsWith('Yo:') ? text : `Yo: ${text}`) : text;
                                const avatarFromPrev = prevMessage.sender?.profile_photo_url || prevMessage.sender?.avatar_url || prevMessage.sender?.avatar || null;
                                return {
                                    ...u,
                                    avatar: u.avatar || u.avatar_url || avatarFromPrev || u.profile_photo_url || defaultAvatar,
                                    avatar_url: u.avatar_url || u.avatar || avatarFromPrev || u.profile_photo_url || defaultAvatar,
                                    last_message: display,
                                    last_message_date: prevMessage.created_at,
                                };
                            } catch (e) {
                                return {
                                    ...u,
                                    avatar: u.avatar || u.avatar_url || u.profile_photo_url || defaultAvatar,
                                    avatar_url: u.avatar_url || u.avatar || u.profile_photo_url || defaultAvatar,
                                    last_message: prevMessage.message,
                                    last_message_date: prevMessage.created_at,
                                };
                            }
                        }

                        // Si no hay mensaje previo, mostramos indicador de mensaje borrado pero preservamos avatar (o fallback)
                        return {
                            ...u,
                            avatar: u.avatar || u.avatar_url || u.profile_photo_url || defaultAvatar,
                            avatar_url: u.avatar_url || u.avatar || u.profile_photo_url || defaultAvatar,
                            last_message: 'Mensaje borrado',
                            last_message_date: deletedMessage.created_at || u.last_message_date,
                        };
                    });

                    if (found) return updated;

                    // Si no existe en localConversations, intentamos actualizar/insertar desde page props
                    try {
                        const convs = (conversations || []);
                        // buscar conversation por group o por user id
                        let match = null;
                        if (deletedMessage.group_id) {
                            match = convs.find((c) => c.is_group && parseInt(c.id) === parseInt(deletedMessage.group_id));
                        } else {
                            // buscar por sender o receiver id
                            match = convs.find((c) => !c.is_group && (parseInt(c.id) === parseInt(deletedMessage.sender_id) || parseInt(c.id) === parseInt(deletedMessage.receiver_id)));
                        }

                        if (match) {
                            // solo actualizar la vista previa si el mensaje eliminado era el último mensaje visible
                            const convLastDate = match.last_message_date || null;
                            const convLastText = ((match.last_message || '') + '').toString();
                            const deletedDate = deletedMessage.created_at || null;
                            const deletedText = ((deletedMessage.message || '') + '').toString();
                            const normalizeC = (s) => (s || '').toString().replace(/^\s*Yo:\s*/i, '').trim();
                            const convNorm = normalizeC(convLastText);
                            const delNorm = normalizeC(deletedText);
                            const isDeletedTheLastConv = (convLastDate && deletedDate && convLastDate === deletedDate) || (convNorm && delNorm && convNorm === delNorm) || (convNorm && delNorm && convNorm.includes(delNorm));

                            if (!isDeletedTheLastConv) {
                                return prev;
                            }

                            const authId = page.props.auth?.user?.id;
                            const prevText = prevMessage ? (prevMessage.message || '') : null;
                            const shouldPrefixPrev = prevText && authId && parseInt(prevMessage?.sender_id) === parseInt(authId);
                            const displayPrev = shouldPrefixPrev ? (prevText.startsWith('Yo:') ? prevText : `Yo: ${prevText}`) : prevText;

                            const existingLocal = prev.find((c) => c && (function(){ try { return parseInt(c.id) === parseInt(match.id) && (!!c.is_group) === !!match.is_group; } catch(e){ return false; } })());

                            const newConv = {
                                ...match,
                                // preservar avatar si existe en local antes de sobreescribir
                                avatar: existingLocal?.avatar ?? match.avatar ?? match.profile_photo_url ?? null,
                                avatar_url: existingLocal?.avatar_url ?? match.avatar_url ?? match.profile_photo_url ?? null,
                                last_message: prevMessage ? displayPrev : 'Mensaje borrado',
                                last_message_date: prevMessage ? prevMessage.created_at : deletedMessage.created_at || match.last_message_date,
                            };
                            const newConvId = parseInt(newConv.id);
                            const newConvIsGroup = !!newConv.is_group;
                            const filtered = prev.filter((c) => {
                                try {
                                    const cid = parseInt(c.id);
                                    const cisGroup = !!c.is_group;
                                    return !(cid === newConvId && cisGroup === newConvIsGroup);
                                } catch (e) { return true; }
                            });
                            return [newConv, ...filtered];
                        }
                    } catch (e) {}

                    return prev;
                });
            } catch (e) {}
        });

        const offHidden = on('conversation.hidden', ({ id }) => {
            setHiddenConversations((prev) => {
                if (prev.includes(id)) return prev;
                return [...prev, id];
            });
        });

        // Manual para desocultar conversación (por ejemplo, al enviar un mensaje)
        const offManualUnhide = on('conversation.unhide', ({ id }) => {
            try {
                setHiddenConversations((prev) => prev.filter((x) => parseInt(x) !== parseInt(id)));
            } catch (e) {}
        });

        
        const offLastMessage = on('conversation.last_message', (conv) => {
            try {
                if (!conv || !conv.id) return;
                try {
                    // comprobar tombstone antes de aplicar un conversation.last_message que pudiera revertir un borrado
                    const createdAt = conv?.last_message_date || null;
                    const keys = [];
                    if (conv?.is_group) keys.push(`g_${conv.id}`);
                    const authId = page.props.auth?.user?.id;
                    if (!conv?.is_group && authId) {
                        keys.push(`u_${authId}_${conv.id}`);
                        keys.push(`u_${conv.id}_${authId}`);
                    }
                    if (isConversationTombstoned && isConversationTombstoned(keys, createdAt)) {
                        console.debug('[ChatWidget] Ignoring conversation.last_message due tombstone', { conv: conv.id, keys, createdAt });
                        return;
                    }
                } catch (e) {}

                setLocalConversations((prev) => {
                    try {
                        const convId = parseInt(conv.id);
                        const convIsGroup = !!conv.is_group;
                        const filtered = (prev || []).filter((c) => {
                            try {
                                const cid = parseInt(c.id);
                                const cisGroup = !!c.is_group;
                                return !(cid === convId && cisGroup === convIsGroup);
                            } catch (e) {
                                return true;
                            }
                        });
                        return [conv, ...filtered];
                    } catch (e) {
                        return prev;
                    }
                });

                setHiddenConversations((prev) => prev.filter((x) => parseInt(x) !== parseInt(conv.id)));
            } catch (e) {}
        });

        return () => {
            off();
            try { offHidden(); } catch (e) {}
            try { offManualUnhide(); } catch (e) {}
            try { offUnhide(); } catch (e) {}
            try { offDeleted(); } catch (e) {}
        };
    }, [on]);

    
    useEffect(() => {
        if (!on) return;

        const handleCreated = (message) => {
            if (!selectedConversation) return;

            
                if (selectedConversation.is_group && message.group_id && selectedConversation.id == message.group_id) {
                setMessages((prev) => {
                    try {
                        if (prev.some((m) => m.id === message.id)) return prev;
                    } catch (e) {}
                    return [...prev, message];
                });
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
                        setMessages((prev) => {
                            try {
                                if (prev.some((m) => m.id === message.id)) return prev;
                            } catch (e) {}
                            return [...prev, message];
                        });
                        setTimeout(() => {
                            if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                        }, 30);
                    }
                }
            }
        };

        const handleDeleted = (payload) => {
            const deleted = payload?.deletedMessage || payload?.message || payload?.deleted_message || null;
            if (!deleted) return;
            if (!selectedConversation) return;
            try {
                setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
            } catch (e) {}
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

    // Manejo de apertura de conversación 
    useEffect(() => {
        if (!on) return;

        const openHandler = async (conv) => {
            try {
                if (!conv) return;
                // Construir objeto de conversación mínimo
                const conversation = {
                    is_user: conv.is_user ?? true,
                    is_group: conv.is_group ?? false,
                    id: conv.id || conv.user_id || conv.with_user_id,
                    name: conv.name || conv.display_name || conv.title || `Usuario ${conv.id}`,
                    avatar: conv.avatar || conv.profile_photo_url || null,
                };

                setOpen(true);
                setSelectedConversation(conversation);

                try {
                    const subscribeToChannel = (conversation) => {
                        if (!conversation) return;
                        let channel = conversation.is_group ? `message.group.${conversation.id}` : `message.user.${[
                            parseInt(user.id),
                            parseInt(conversation.id),
                        ]
                            .sort((a, b) => a - b)
                            .join("-")}`;

                        if (subscribedChannels.current.has(channel)) return;

                        try {
                            // capture channel and conversation so we can be defensive
                            {
                                const _channel = channel;
                                const _conversation = conversation;
                                Echo.private(channel)
                                    .listen("SocketMessage", (e) => {
                                        const message = e.message;
                                        console.debug('[ChatWidget] SocketMessage received', message && message.id ? {id: message.id, sender_id: message.sender_id, receiver_id: message.receiver_id, group_id: message.group_id, channel: _channel} : message);

                                        // Defensive: if we're on a user channel but the payload is a group message, ignore it
                                        try {
                                            if (_channel && _channel.startsWith('message.user.') && message && message.group_id) {
                                                console.debug('[ChatWidget] Ignoring group message on user channel', { channel: _channel, message });
                                                return;
                                            }
                                        } catch (err) {}

                                        if (message) {
                                            emit("message.created", message);
                                        }
                                        if (message && message.sender_id !== user.id) {
                                            emit("newMessageNotification", {
                                                user: message.sender,
                                                group_id: message.group_id,
                                                message: message.message || (message.attachments ? `Shared ${message.attachments.length} attachments` : ""),
                                            });
                                        }
                                    })
                                    .listen("SocketMessageDeleted", (e) => {
                                        const deletedMessage = e.deletedMessage || e.deleted_message || null;
                                        const prevMessage = e.prevMessage || e.prev_message || null;
                                        emit('message.deleted', { deletedMessage, prevMessage });
                                    })
                                    .error(() => {});
                            }

                            subscribedChannels.current.add(channel);
                        } catch (e) {
                            
                        }
                    };

                    subscribeToChannel(conversation);
                } catch (e) {}

                try {
                    if (conversation.is_group) {
                        setUnreadCounts((prev) => {
                            const copy = { ...prev };
                            delete copy[`g_${conversation.id}`];
                            return copy;
                        });
                    } else {
                        setUnreadCounts((prev) => {
                            const copy = { ...prev };
                            delete copy[conversation.id];
                            return copy;
                        });
                    }
                } catch (e) {}

                setLoadingMessages(true);
                try {
                    if (conversation.is_group) {
                        const { data } = await axios.get(route('message.group.json', conversation.id));
                        setMessages(data.data.reverse());
                    } else {
                        const { data } = await axios.get(route('message.user.json', conversation.id));
                        setMessages(data.data.reverse());
                    }
                    setTimeout(() => {
                        if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                    }, 30);
                } catch (err) {
                    console.error('Error loading messages from open event', err);
                } finally {
                    setLoadingMessages(false);
                }
            } catch (e) {}
        };

        const offOpen = on('chat.openConversation', openHandler);
        return () => {
            try { offOpen(); } catch (e) {}
        };
    }, [on]);

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

    const panelBottom = selectedConversation ? 'bottom-28' : 'bottom-20';

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
                    <div className={`fixed ${panelBottom} right-4 w-[92vw] max-h-[85vh] h-auto rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-50 sm:fixed sm:${panelBottom} sm:right-4 sm:left-auto sm:w-[760px] sm:max-h-[520px] sm:h-auto sm:rounded-lg`}>
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
                                        {(() => {
                                            // Combinar las conversaciones del servidor con las locales inyectadas
                                                                    const pageConvs = (conversations || [])
                                                                        .filter((c) => c && (((c.name || c.title || '') + '').toString().toLowerCase().includes(search.toLowerCase())))
                                                                        .filter((c) => c && !hiddenConversations.includes(c.id));

                                                                    const localConvs = (localConversations || [])
                                                                        .filter((c) => c && (((c.name || c.title || '') + '').toString().toLowerCase().includes(search.toLowerCase())))
                                                                        .filter((c) => c && !hiddenConversations.includes(c.id));

                                            // localConvs tiene prioridad y sobreescribe entradas de pageConvs con el mismo id
                                            const localKeys = new Set(localConvs.map((c) => `${c.is_group ? 'g' : 'u'}_${parseInt(c.id)}`));
                                            const filteredPageConvs = pageConvs.filter((c) => !localKeys.has(`${c.is_group ? 'g' : 'u'}_${parseInt(c.id)}`));

                                            let combined = [...localConvs, ...filteredPageConvs];

                                            // Ordenar por fecha del último mensaje 
                                            combined = combined.sort((a, b) => {
                                                try {
                                                    if (a?.last_message_date && b?.last_message_date) return b.last_message_date.localeCompare(a.last_message_date);
                                                    if (a?.last_message_date) return -1;
                                                    if (b?.last_message_date) return 1;
                                                    return 0;
                                                } catch (e) { return 0; }
                                            });

                                            if (combined.length === 0) {
                                                return <div className="text-sm text-blue-200 p-4">No hay conversaciones</div>;
                                            }

                                            return combined.map((c, idx) => {
                                                if (!c) return null;
                                                const keyId = c.id ?? idx;
                                                return (
                                                    <ConversationItem
                                                        key={`${c.is_group ? 'group' : 'user'}_${keyId}_${idx}`}
                                                        conversation={c}
                                                            online={!!onlineUsers[c.id]}
                                                            unreadCount={(() => {
                                                                try {
                                                                    return c.is_group ? (unreadCounts[`g_${c.id}`] || 0) : (unreadCounts[c.id] || 0);
                                                                } catch (e) { return 0; }
                                                            })()}
                                                        selectedConversation={selectedConversation}
                                                        onSelect={async (conv) => {
                                                                setSelectedConversation(conv);
                                                                try {
                                                                    // limpiar no leídos para esta conversación cuando se abre
                                                                    if (conv.is_group) {
                                                                        setUnreadCounts((prev) => {
                                                                            const copy = { ...prev };
                                                                            delete copy[`g_${conv.id}`];
                                                                            return copy;
                                                                        });
                                                                    } else {
                                                                        setUnreadCounts((prev) => {
                                                                            const copy = { ...prev };
                                                                            delete copy[conv.id];
                                                                            return copy;
                                                                        });
                                                                    }
                                                                } catch (e) {}
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
                                            });
                                        })()}
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