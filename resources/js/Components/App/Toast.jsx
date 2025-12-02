import { useEventBus } from "@/EvenBus"
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Toast({}){
    const [toasts, setToasts] = useState([]);
    const { on } = useEventBus();

    useEffect(() => {
        const off = on('toast.show', (message) => {
            const uuid = uuidv4();

            setToasts((oldToasts) => {
                try {
                    // evitar toasts duplicados en ráfaga (mismo texto)
                    const exists = oldToasts.some((t) => (t.message || '') === (message || ''));
                    if (exists) return oldToasts;
                } catch (e) {}
                return [...oldToasts, {message, uuid}];
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
            <div className="toast min-w-[280px] w-full xs:w-auto pointer-events-auto">
                {toasts.map((toast, index)=>(
                    <div
                        key={toast.uuid}
                        className="alert alert-success py-3 px-4 text-gray-100 rounded-md"
                    >
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}