import { useEventBus } from "@/EvenBus"
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import UserAvatar from "./UserAvatar";
import { Link } from "@inertiajs/react";

export default function NewMessageNotification({}){
    const [toasts, setToasts] = useState([]);
    const { on } = useEventBus();

    useEffect(() => {
        const off = on('newMessageNotification', ({message, user, group_id}) => {
            const uuid = uuidv4();

            setToasts((oldToasts) => {
                try {
                    // evitar duplicados iguales que lleguen en ráfaga
                    const exists = oldToasts.some((t) => t.message === message && (t.user?.id || null) === (user?.id || null) && (t.group_id || null) === (group_id || null));
                    if (exists) return oldToasts;
                } catch (e) {}

                return [
                    ...oldToasts,
                    {message, uuid, user, group_id},
                ];
            });

            setTimeout(() => {
                setToasts((oldToasts) => 
                    oldToasts.filter((toast) => toast.uuid !== uuid)
                );
            }, 5000);
        });

        return () => { try { off(); } catch (e) {} };
    }, [on]);
    return(
        <div className="fixed top-4 left-0 right-0 flex justify-center pointer-events-none z-[9999]">
            <div className="toast toast-top toast-center min-w-[280px] pointer-events-auto">
            {toasts.map((toast, index)=>(
                <div
                    key={toast.uuid}
                    className="alert alert-success py-3 px-4 text-gray-100 rounded-md"
                >
                    <Link 
                        href={
                            toast.group_id
                             ? route('chat.group', toast.group_id) 
                             : route('chat.user', toast.user.id)
                        }
                        className="flex items-center gap-2"
                    >
                    <UserAvatar user={toast.user}/>
                    <span>{toast.message}</span>
                    </Link>
                </div>
            ))}
            </div>
        </div>
    );
}