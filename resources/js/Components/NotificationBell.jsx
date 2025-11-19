import { useEffect, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';

export default function NotificationBell() {
    const page = usePage();
    const user = page.props.auth?.user;
    const initialCount = page.props['auth']?.user?.unread_notifications_count ?? 0;
    const initialList = page.props['auth']?.user?.recent_notifications ?? [];

    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(initialCount);
    const [items, setItems] = useState(initialList);
    const ref = useRef();

    useEffect(() => {
        function handleClick(e){
            if(ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    },[]);

    useEffect(()=>{
        if (!user || !window.Echo) return;
        let channel = null;
        try{
            channel = Echo.private(`App.Models.User.${user.id}`);
            const handler = (n) => {
                //try para normalizar la forma de la notificación desde broadcast
                try {
                    if (!n.created_at) {
                        n.created_at = new Date().toISOString();
                    }
                    
                    if (!n.data) n.data = n;
                } catch (err) {
                    
                }

                setItems(prev => [n, ...prev].slice(0,10));
                setUnread(prev => prev + 1);
            };
            channel.notification(handler);
            
            return () => {
                try {
                    
                    Echo.leave(`private-App.Models.User.${user.id}`);
                } catch (err) {
                    
                }
            };
        }catch(e){
            
        }
    },[user]);

    async function markRead(id, url){
        try{
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            await fetch(route('notifications.read', id), { method: 'POST', headers: {'X-CSRF-TOKEN': token} });
            setItems(prev => prev.map(i => i.id === id ? {...i, read_at: new Date().toISOString()} : i));
            setUnread(prev => Math.max(0, prev-1));
            if (url) window.location = url;
        }catch(e){
            console.error(e);
        }
    }

    async function markAll(){
        try{
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            await fetch(route('notifications.mark_all_read'), { method: 'POST', headers: {'X-CSRF-TOKEN': token} });
            setItems(prev => prev.map(i => ({...i, read_at: new Date().toISOString()})));
            setUnread(0);
        }catch(e){ console.error(e); }
    }

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)} className="relative p-2 rounded-md hover:bg-[var(--color-surface)]">
                <svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{unread}</span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                        <div className="font-medium">Notificaciones</div>
                        <button onClick={markAll} className="text-xs text-gray-500">Marcar todas leídas</button>
                    </div>
                    <div className="max-h-72 overflow-auto">
                        {items.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Sin notificaciones</div>}
                        {items.map(n => (
                            <div key={n.id} className={`px-3 py-2 hover:bg-gray-50 ${!n.read_at ? 'bg-gray-50' : ''}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="text-sm text-slate-800">{n.data?.message ?? n.data?.message}</div>
                                    <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button onClick={() => markRead(n.id, n.data?.url)} className="text-xs text-[var(--color-primary)]">Abrir</button>
                                    {!n.read_at && <button onClick={() => markRead(n.id, null)} className="text-xs text-gray-500">Marcar leída</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
