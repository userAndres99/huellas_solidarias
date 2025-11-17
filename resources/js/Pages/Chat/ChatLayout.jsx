import TextInput from "@/Components/TextInput";
import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import ConversationItem from "../../Components/App/ConversationItem";

const ChatLayouts = ({ children }) => {
    const { conversations, selectedConversation } = usePage().props;
    const [onlineUsers, setOnlineUsers] = useState({});
    const [localConversations, setLocalConversations] = useState([]);
    const [sortedConversations, setSortedConversations] = useState([]);

    const isUserOnline = (userId) => onlineUsers[userId];

    const onSearch = (ev) => {
        const search = ev.target.value.toLowerCase();
        setLocalConversations(
            conversations.filter((conversation) =>
                conversation.name.toLowerCase().includes(search)
            )
        );
    };

    useEffect(() => {
        setSortedConversations(
            localConversations.sort((a, b) => {
                if (a.blocked_at && b.blocked_at) {
                    return a.blocked_at > b.blocked_at ? 1 : -1;
                } else if (a.blocked_at) return 1;
                else if (b.blocked_at) return -1;

                if (a.last_message_date && b.last_message_date)
                    return b.last_message_date.localeCompare(a.last_message_date);
                else if (a.last_message_date) return -1;
                else if (b.last_message_date) return 1;
                else return 0;
            })
        );
    }, [localConversations]);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    // Canal de presencia (usuarios conectados)
    useEffect(() => {
        Echo.join("online")
            .here((users) => {
                const onlineUsersObj = Object.fromEntries(
                    users.map((user) => [user.id, user])
                );
                setOnlineUsers((prev) => ({ ...prev, ...onlineUsersObj }));
            })
            .joining((user) => {
                setOnlineUsers((prev) => ({ ...prev, [user.id]: user }));
            })
            .leaving((user) => {
                setOnlineUsers((prev) => {
                    const updated = { ...prev };
                    delete updated[user.id];
                    return updated;
                });
            })
            .error((error) => console.error("Echo error:", error));

        return () => Echo.leave("online");
    }, []);

    return (
        <>
            <div className="flex w-full h-screen">
                <div
                    className="flex flex-col sm:w-[220px] md:w-[300px] bg-slate-800"
                >
                    <div className="flex items-center justify-between py-2 px-3 text-xl font-medium text-gray-200">
                        My Conversations
                        <div
                            className="tooltip tooltip-left"
                            data-tip="Create new Group"
                        >
                            <button
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
                        {sortedConversations &&
                            sortedConversations.map((conversation, index)=>(
                                <ConversationItem
                                    key={`${conversation.is_group ? "group" : "user"}_${conversation.id}_${index}`}
                                    conversation={conversation}
                                    online={!!isUserOnline(conversation.id)}
                                    selectedConversation={selectedConversation}
                                />
                            ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </div>

            </div>


        </>
    );
};

export default ChatLayouts;
