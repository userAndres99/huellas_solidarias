import { useState } from "react";
import { router, usePage } from "@inertiajs/react";

export default function StartChatModal({ show, onClose }) {
    const { users = [] } = usePage().props; // SIEMPRE tiene un array
    const [search, setSearch] = useState("");

    if (!show) return null;

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const startConversation = (userId) => {
        router.post(route("conversations.start"), { user_id: userId });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 w-80">
                <h3 className="text-xl font-bold mb-3">Iniciar Chat</h3>

                <input
                    className="border p-2 w-full mb-3"
                    placeholder="Buscar usuario..."
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="max-h-60 overflow-auto">
                    {filtered.map(user => (
                        <button
                            key={user.id}
                            onClick={() => startConversation(user.id)}
                            className="w-full text-left p-2 hover:bg-gray-200"
                        >
                            {user.name}
                        </button>
                    ))}
                </div>

                <button className="mt-3 w-full p-2 bg-gray-800 text-white" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>
    );
}
