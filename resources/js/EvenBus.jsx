
import React from "react";

export const EventBusContext = React.createContext();

export const EventBusProvider = ({ children }) => {
    const [events, setEvents] = React.useState({});

    // Guardar IDs de mensajes borrados recientemente
    const deletedMessagesRef = React.useRef(new Set());
    // Guardar conversaciones borradas recientemente: key -> timestamp
    const deletedConversationsRef = React.useRef(new Map());

    const emit = (name, data ) => {
        try {
            // Si el evento es de creación de mensaje, aplicamos filtros de protección
            if (name === 'message.created') {
                try {
                    // ignorar si el ID del mensaje está en la lista de borrados recientes
                    if (data && data.id && deletedMessagesRef.current.has(String(data.id))) {
                        console.debug('[EventBus] Ignoring message.created for recently deleted id=', String(data.id));
                        return;
                    }

                    // ignorar si la conversación está "tombstoned" recientemente
                    const createdAt = data?.created_at ? Date.parse(data.created_at) : null;
                    const keysToCheck = [];
                    if (data?.group_id) keysToCheck.push(`g_${data.group_id}`);
                    if (data?.sender_id && data?.receiver_id) {
                        keysToCheck.push(`u_${data.sender_id}_${data.receiver_id}`);
                        keysToCheck.push(`u_${data.receiver_id}_${data.sender_id}`);
                    }
                    for (const k of keysToCheck) {
                        if (deletedConversationsRef.current.has(k)) {
                            const deletedAt = deletedConversationsRef.current.get(k);
                            // si el mensaje fue creado antes de 2 segundos tras el borrado, ignorar
                            if (createdAt && createdAt <= (deletedAt + 2000)) {
                                console.debug('[EventBus] Ignoring message.created for conversation key=', k, 'createdAt=', createdAt, 'deletedAt=', deletedAt);
                                return;
                            }
                        }
                    }
                } catch (e) {}
            }

            // Si se emite un evento de borrado, registramos el ID y la conversación en caches temporales
            if (name === 'message.deleted') {
                try {
                    const deleted = data?.deletedMessage || data?.message || data?.deleted_message || null;
                    const id = deleted?.id;
                    if (id) {
                        deletedMessagesRef.current.add(String(id));
                        console.debug('[EventBus] Registered deleted message id=', String(id), 'setSize=', deletedMessagesRef.current.size);
                        // Expirar después de 20 segundos (ajustable)
                        setTimeout(() => {
                            deletedMessagesRef.current.delete(String(id));
                            console.debug('[EventBus] Expired deleted message id=', String(id), 'setSize=', deletedMessagesRef.current.size);
                        }, 20000);
                    }

                    try {
                        const keys = [];
                        if (deleted?.group_id) keys.push(`g_${deleted.group_id}`);
                        if (deleted?.sender_id && deleted?.receiver_id) {
                            keys.push(`u_${deleted.sender_id}_${deleted.receiver_id}`);
                            keys.push(`u_${deleted.receiver_id}_${deleted.sender_id}`);
                        }
                        const now = Date.now();
                        for (const k of keys) {
                            deletedConversationsRef.current.set(k, now);
                            // expirar la key después del mismo timeout
                            setTimeout(() => {
                                deletedConversationsRef.current.delete(k);
                                console.debug('[EventBus] Expired deleted conversation key=', k);
                            }, 20000);
                            console.debug('[EventBus] Registered deleted conversation key=', k, 'at', now);
                        }
                    } catch (e) {}
                } catch (e) {}
            }

            if (events[name]){
                for (let cb of events[name]){
                     cb(data);
                }
            }
        } catch (e) {
            // Protección contra errores en handlers
            console.error('EventBus emit error', e);
        }
    };

    const hasDeletedMessage = (id) => {
        try {
            if (!id) return false;
            return deletedMessagesRef.current.has(String(id));
        } catch (e) { return false; }
    };

    const isConversationTombstoned = (keys = [], createdAt = null) => {
        try {
            if (!keys || !keys.length) return false;
            const createdTs = createdAt ? Date.parse(createdAt) : null;
            for (const k of keys) {
                if (deletedConversationsRef.current.has(k)) {
                    const deletedAt = deletedConversationsRef.current.get(k);
                    if (!createdTs) return true;
                    if (createdTs <= (deletedAt + 2000)) return true;
                }
            }
            return false;
        } catch (e) { return false; }
    };

    const on = (name, cb) => {
        if (!events[name]){
            events[name] = [];
        }

        events[name].push(cb);
        
        return () => {
            events[name] = events[name].filter((callback) => callback !== cb);
        };
    };
    return (
        <EventBusContext.Provider value={{ emit, on, hasDeletedMessage, isConversationTombstoned }}>
            {children}
        </EventBusContext.Provider>
    );
};

export const useEventBus = () => {
    return React.useContext(EventBusContext);
}