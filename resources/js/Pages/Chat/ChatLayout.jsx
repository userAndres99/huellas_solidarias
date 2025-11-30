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
    const [onlineUsers, setOnlineUsers] = useState({});
    const [localConversations, setLocalConversations] = useState([]);
    const [sortedConversations, setSortedConversations] = useState([]);
    const { on, emit } = useEventBus();
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
        setLocalConversations((oldUsers) =>
            oldUsers.map((u) => {
                if (
                    message.receiver_id &&
                    !u.is_group &&
                    (u.id == message.sender_id || u.id == message.receiver_id)
                ) {
                    u.last_message = message.message;
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

    const messageDeleted = ({ deletedMessage, prevMessage }) => {
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

                if (prevMessage) {
                    return {
                        ...u,
                        last_message: prevMessage.message,
                        last_message_date: prevMessage.created_at,
                    };
                }

                return {
                    ...u,
                    last_message: null,
                    last_message_date: null,
                };
            })
        );
    };

    useEffect(() => {
        const offCreated = on("message.created", messageCreated);
        const offDeleted = on("message.deleted", messageDeleted);
        const offModalShow = on("GroupModal.show", () => setShowGroupModal(true));

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
                    <div className="flex-1 overflow-auto">
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
