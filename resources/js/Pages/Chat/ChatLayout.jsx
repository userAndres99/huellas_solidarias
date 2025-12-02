import TextInput from "@/Components/TextInput";
import { router, usePage } from "@inertiajs/react";
import { useEffect, useState, useRef } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import ConversationItem from "../../Components/App/ConversationItem";
import { useEventBus } from "@/EvenBus";
import GroupModal from "@/Components/App/GroupModal";
import StartChatModal from "@/Components/App/StartChatModal";

const ChatLayouts = ({ children }) => {
    const page = usePage();
    const conversations = page.props.conversations;
    const selectedConversation = page.props.selectedConversation;
    const users = page.props.users;

    const selectedConversationRef = useRef(selectedConversation);
    
    const tombstonedConversationsRef = useRef(new Map());
    // evitar recargas repetidas para la misma conversación cuando falta avatar
    const pendingConvReloads = useRef(new Set());
    const [onlineUsers, setOnlineUsers] = useState({});
    const [localConversations, setLocalConversations] = useState([]);
    const [sortedConversations, setSortedConversations] = useState([]);
    const { on, emit, hasDeletedMessage, isConversationTombstoned } = useEventBus();
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showStartChatModal, setShowStartChatModal] = useState(false);

    // Mantener siempre actualizado el ref
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    const isUserOnline = (userId) => onlineUsers[userId];

    const onSearch = (ev) => {
        const search = ev.target.value.toLowerCase();
        setLocalConversations(
            conversations.filter((conversation) =>
                conversation.name.toLowerCase().includes(search)
            )
        );
    };

    const messageCreated = (message) => {
        try {
            // Protecciones y mensajes borrados
            try {
                if (message?.id && hasDeletedMessage && hasDeletedMessage(message.id)) {
                    console.debug('[ChatLayout] Skipping message.created because id is recently deleted', message.id);
                    return;
                }
            } catch (e) {}
            const createdAt = message?.created_at ? Date.parse(message.created_at) : null;
            const keysToCheck = [];
            if (message?.group_id) keysToCheck.push(`g_${message.group_id}`);
            if (message?.sender_id && message?.receiver_id) {
                keysToCheck.push(`u_${message.sender_id}_${message.receiver_id}`);
                keysToCheck.push(`u_${message.receiver_id}_${message.sender_id}`);
            }
            // Comprobar tombstone central antes de aplicar el mensaje
            try {
                if (isConversationTombstoned && isConversationTombstoned(keysToCheck, message?.created_at)) {
                    console.debug('[ChatLayout] Skipping message.created due to EventBus tombstone', { keysToCheck, createdAt });
                    return;
                }
            } catch (e) {
                for (const k of keysToCheck) {
                    const tomb = tombstonedConversationsRef.current.get(k);
                    if (tomb && createdAt && createdAt <= (tomb + 2000)) {
                        console.debug('[ChatLayout] Skipping message.created due to tombstone', { key: k, createdAt, tomb });
                        return;
                    }
                }
            }
        } catch (e) {}

        setLocalConversations((oldUsers) =>
            oldUsers.map((u) => {
                if (
                    message.receiver_id &&
                    !u.is_group &&
                    (u.id == message.sender_id || u.id == message.receiver_id)
                ) {
                    try {
                        const authId = page.props.auth?.user?.id;
                        // Si el remitente es el usuario autenticado, 'Yo:'
                        if (authId && parseInt(message.sender_id) === parseInt(authId)) {
                            // Si ya existe el prefijo, no duplicarlo
                            const existing = (u.last_message || '');
                            if (!existing.startsWith('Yo:')) {
                                u.last_message = `Yo: ${message.message}`;
                            }
                        } else {

                            const existing = (u.last_message || '');
                            if (!(existing.startsWith('Yo:') && parseInt(message.sender_id) === parseInt(authId))) {
                                u.last_message = message.message;
                            }
                        }
                    } catch (e) {
                        u.last_message = message.message;
                    }
                    u.last_message_date = message.created_at;
                    return u;
                }

                if (message.group_id && u.is_group && u.id == message.group_id) {
                    u.last_message = message.message;
                    u.last_message_date = message.created_at;
                    return u;
                }
                return u;
            })
        );
    };

    // Escuchar creación de mensajes para actualizar conversaciones locales
    try {
        const authId = page.props.auth?.user?.id;
        if (authId) {
            // si hay un usuario autenticado, escuchar mensajes creados
            on && on('message.created', (message) => {
                try {
                    if (!message) return;
                    if (message.group_id) return;
                    const createdForMe = message.receiver_id && parseInt(message.receiver_id) === parseInt(authId);
                    const sentByMe = message.sender_id && parseInt(message.sender_id) === parseInt(authId);

                    if (!createdForMe && !sentByMe) return;

                    // verificar si ya existe en page.props.conversations o local
                    const serverConvs = page.props.conversations || [];
                    const existsServer = serverConvs.some((c) => !c.is_group && (parseInt(c.id) === parseInt(message.sender_id) || parseInt(c.id) === parseInt(message.receiver_id)));
                    const existsLocal = (tombstonedConversationsRef.current && Array.from(tombstonedConversationsRef.current.values())) ? null : null; // noop placeholder

                    // construir convObj similar al widget
                    if (createdForMe) {
                        const sender = message.sender || {};
                        const senderId = sender.id || message.sender_id;
                        const name = sender.name || sender.display_name || `Usuario ${senderId}`;
                        const avatarFromSender = sender.avatar || sender.avatar_url || sender.profile_photo_url || null;
                        const avatar = avatarFromSender || null;

                        // si ya existe en page props no hacer nada
                        if (existsServer) return;

                        setLocalConversations((prev) => {
                            const existingLocal = (prev || []).find((c) => !c.is_group && parseInt(c.id) === parseInt(senderId));
                            if (existingLocal) return prev;
                                const defaultAvatar = (typeof window !== 'undefined' && window.location ? `${window.location.origin}/images/DefaultPerfil.jpg` : '/images/DefaultPerfil.jpg');
                                const convObj = {
                                    is_user: true,
                                    is_group: false,
                                    id: senderId,
                                    name,
                                    avatar: avatar || defaultAvatar,
                                    avatar_url: avatar || defaultAvatar,
                                    last_message: message.message || '',
                                    last_message_date: message.created_at || null,
                                    conversation_id: message.conversation_id || null,
                                    with_user_id: senderId,
                                };
                            return [convObj, ...(prev || [])];
                        });

                        try {
                                const createdAvatar = sender.avatar || sender.avatar_url || sender.profile_photo_url || null;
                            const serverHasAvatar = (page.props.conversations || []).some((c) => !c.is_group && parseInt(c.id) === parseInt(senderId) && (c.avatar || c.avatar_url || c.profile_photo_url));
                            if (!createdAvatar && !serverHasAvatar && !pendingConvReloads.current.has(senderId)) {
                                pendingConvReloads.current.add(senderId);
                                try { router.reload({ only: ['conversations'] }); } catch (e) {}
                                setTimeout(() => pendingConvReloads.current.delete(senderId), 10000);
                            }
                        } catch (e) {}
                    }

                    if (sentByMe) {
                        const receiverId = parseInt(message.receiver_id || message.to || 0);
                        if (!receiverId) return;
                        const receiver = message.receiver || {};
                        const createdAvatar = receiver.avatar || receiver.avatar_url || receiver.profile_photo_url || null;
                        const serverHasAvatar = (page.props.conversations || []).some((c) => !c.is_group && parseInt(c.id) === parseInt(receiverId) && (c.avatar || c.avatar_url || c.profile_photo_url));

                        setLocalConversations((prev) => {
                            const existingLocal = (prev || []).find((c) => !c.is_group && parseInt(c.id) === parseInt(receiverId));
                            if (existingLocal) return prev;
                            const name = (receiver && (receiver.name || receiver.display_name)) || `Usuario ${receiverId}`;
                            const avatar = createdAvatar || null;
                            const defaultAvatar = (typeof window !== 'undefined' && window.location ? `${window.location.origin}/images/DefaultPerfil.jpg` : '/images/DefaultPerfil.jpg');
                            const convObjMe = {
                                is_user: true,
                                is_group: false,
                                id: receiverId,
                                name,
                                avatar: avatar || defaultAvatar,
                                avatar_url: avatar || defaultAvatar,
                                last_message: (message.message ? `Yo: ${message.message}` : 'Yo'),
                                last_message_date: message.created_at || null,
                                conversation_id: message.conversation_id || null,
                                with_user_id: receiverId,
                            };
                            return [convObjMe, ...(prev || [])];
                        });

                        try {
                            if (!createdAvatar && !serverHasAvatar && !pendingConvReloads.current.has(receiverId)) {
                                pendingConvReloads.current.add(receiverId);
                                try { router.reload({ only: ['conversations'] }); } catch (e) {}
                                setTimeout(() => pendingConvReloads.current.delete(receiverId), 10000);
                            }
                        } catch (e) {}
                    }
                } catch (e) {}
            });
        }
    } catch (e) {}

    const messageDeleted = (payload) => {
        const deletedMessage = payload.deletedMessage || payload.message || payload.deleted_message || null;
        const prevMessage = payload.prevMessage || payload.prev_message || null;

        console.debug('[ChatLayout] message.deleted payload=', { deletedMessage, prevMessage });

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
                // Forzar recarga parcial de Inertia para actualizar la prop `conversations` en otras partes de la UI
                try { router.reload({ only: ['conversations'] }); } catch (e) {}
                return;
            } catch (e) {}
        }

        setLocalConversations((oldUsers) =>
            oldUsers.map((u) => {
                const matchUser =
                    (!u.is_group &&
                        (u.id == deletedMessage.sender_id ||
                            u.id == deletedMessage.receiver_id)) ||
                    (u.is_group &&
                        deletedMessage.group_id &&
                        u.id == deletedMessage.group_id);

                if (!matchUser) return u;

                // solo actualizar si el mensaje eliminado era el último mensaje mostrado
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
                        // intentar preservar avatar 
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

                // Si no hay mensaje previo, mostramos un placeholder indicando eliminación
                try {
                    const key = deletedMessage.group_id ? `g_${deletedMessage.group_id}` : `u_${deletedMessage.sender_id}_${deletedMessage.receiver_id}`;
                    const now = Date.now();
                    tombstonedConversationsRef.current.set(key, now);
                    setTimeout(() => tombstonedConversationsRef.current.delete(key), 20000);
                    console.debug('[ChatLayout] Tombstoned conversation', { key, at: now });
                } catch (e) {}

                return {
                    ...u,
                    avatar: u.avatar || u.avatar_url || u.profile_photo_url || defaultAvatar,
                    avatar_url: u.avatar_url || u.avatar || u.profile_photo_url || defaultAvatar,
                    last_message: 'Mensaje borrado',
                    last_message_date: deletedMessage.created_at || u.last_message_date,
                };
            })
        );
    };

    useEffect(() => {
        const offCreated = on("message.created", messageCreated);
        const offDeleted = on("message.deleted", messageDeleted);
        const offModalShow = on("GroupModal.show", () => setShowGroupModal(true));
        const offLastMessage = on('conversation.last_message', (conv) => {
            try {
                if (!conv || !conv.id) return;
                try {
                    // comprobar central antes de aplicar un conversation.last_message
                    const createdAt = conv?.last_message_date || null;
                    const keys = [];
                    if (conv?.is_group) keys.push(`g_${conv.id}`);
                    const authId = page.props.auth?.user?.id;
                    if (!conv?.is_group && authId) {
                        keys.push(`u_${authId}_${conv.id}`);
                        keys.push(`u_${conv.id}_${authId}`);
                    }
                    if (isConversationTombstoned && isConversationTombstoned(keys, createdAt)) {
                        console.debug('[ChatLayout] Ignoring conversation.last_message due tombstone', { conv: conv.id, keys, createdAt });
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
                        const existingLocal = (prev || []).find((c) => {
                            try { return parseInt(c.id) === convId && (!!c.is_group) === convIsGroup; } catch (e) { return false; }
                        });
                        const existingServer = (conversations || []).find((c) => {
                            try { return parseInt(c.id) === convId && (!!c.is_group) === convIsGroup; } catch (e) { return false; }
                        });
                        const defaultAvatar = (typeof window !== 'undefined' && window.location ? `${window.location.origin}/images/DefaultPerfil.jpg` : '/images/DefaultPerfil.jpg');

                        const avatarFromConv = conv.avatar || conv.avatar_url || conv.profile_photo_url || null;
                        const avatar = existingLocal?.avatar || existingLocal?.avatar_url || avatarFromConv || existingServer?.avatar || existingServer?.avatar_url || existingServer?.profile_photo_url || defaultAvatar;
                        const avatar_url = existingLocal?.avatar_url || existingLocal?.avatar || avatarFromConv || existingServer?.avatar_url || existingServer?.avatar || existingServer?.profile_photo_url || defaultAvatar;

                        const merged = {
                            ...conv,
                            avatar,
                            avatar_url,
                        };

                        return [merged, ...filtered];
                    } catch (e) {
                        return prev;
                    }
                });
            } catch (e) {}
        });

        const offGroupDelete = on("group.deleted", ({ id, name }) => {
            setLocalConversations((oldConversations) =>
                oldConversations.filter((con) => con.id != id)
            );

            emit("toast.show", `Group "${name}" was deleted`);

            // Usamos el ref para acceder al selectedConversation actualizado
            const selConv = selectedConversationRef.current;

            if (!selConv || (selConv.is_group && selConv.id === id)) {
                router.visit(route("chat"));
            }
        });

        const offStarChat = on("StartChat.show", () => setShowStartChatModal(true));

        return () => {
            offCreated();
            offDeleted();
            offModalShow();
            try { offLastMessage(); } catch (e) {}
            offGroupDelete();
            offStarChat();
        };
    }, [on, emit]);

    useEffect(() => {
        setSortedConversations(
            [...localConversations].sort((a, b) => {
                if (a.blocked_at && b.blocked_at) return a.blocked_at > b.blocked_at ? 1 : -1;
                if (a.blocked_at) return 1;
                if (b.blocked_at) return -1;

                if (a.last_message_date && b.last_message_date)
                    return b.last_message_date.localeCompare(a.last_message_date);
                if (a.last_message_date) return -1;
                if (b.last_message_date) return 1;
                return 0;
            })
        );
    }, [localConversations]);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        Echo.join("online")
            .here((users) => {
                const onlineUsersObj = Object.fromEntries(
                    users.map((user) => [user.id, user])
                );
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
            .error((error) => console.error("Echo error:", error));

        return () => Echo.leave("online");
    }, []);

    return (
        <>
            <div className="flex w-full h-screen">
                <div className="flex flex-col sm:w-[220px] md:w-[300px] bg-slate-800">
                    <div className="flex items-center justify-between py-2 px-3 text-xl font-medium text-gray-200">
                        Usuarios Conectados
                        <div className="flex items-center gap-3">
                            <div className="tooltip tooltip-left" data-tip="Iniciar Conversacion">
                                <button
                                    onClick={() => emit("StartChat.show")}
                                    className="text-gray-400 hover:text-gray-200"
                                >
                                    <span className="text-sm">💬</span>
                                </button>
                            </div>

                        </div>
                        <div className="tooltip tooltip-left" data-tip="Create new Group">
                            <button
                                onClick={() => setShowGroupModal(true)}
                                className="text-gray-400 hover:text-gray-200"
                            >
                                <PencilSquareIcon className="w-4 h-4 inline-block ml-2" />
                            </button>
                        </div>
                    </div>
                    <div className="p-3">
                        <TextInput
                            onKeyUp={onSearch}
                            placeholder="Filter users and group"
                            className="w-full"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        {sortedConversations.map((conversation, index) => (
                            <ConversationItem
                                key={`${conversation.is_group ? "group" : "user"}_${conversation.id}_${index}`}
                                conversation={conversation}
                                online={!!isUserOnline(conversation.id)}
                                selectedConversation={selectedConversation}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
            </div>

            <GroupModal show={showGroupModal} onClose={() => setShowGroupModal(false)} />

            <StartChatModal
                show={showStartChatModal}
                onClose={() => setShowStartChatModal(false)}
                users = {users}
            
            />
        </>
    );
};

export default ChatLayouts;
