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
        <>
            {/* Mobile: centrado*/}
            <div className="fixed top-4 left-0 right-0 flex justify-center pointer-events-none z-[9999] sm:hidden">
                <div className="toast pointer-events-auto w-full max-w-[92vw]">
                    {toasts.map((toast) => (
                        <div key={toast.uuid} className="alert alert-success py-3 px-4 text-gray-100 rounded-md">
                            <span className="text-sm break-words">{toast.message}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop/tablet: fijo a la derecha */}
            <div className="hidden sm:block fixed top-4 right-4 pointer-events-none z-[9999]">
                <div className="toast pointer-events-auto w-auto max-w-[9rem]">
                    {toasts.map((toast) => (
                        <div key={toast.uuid} className="alert alert-success py-3 px-4 text-gray-100 rounded-md">
                            <span className="text-sm break-words">{toast.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}