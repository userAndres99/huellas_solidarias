import { useEffect, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import confirmToast from '@/Utils/confirmToast';

export default function NotificationBell() {
    const page = usePage();
    const user = page.props.auth?.user;
    const initialCount = page.props['auth']?.user?.unread_notifications_count ?? 0;
    const initialList = page.props['auth']?.user?.recent_notifications ?? [];

    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(initialCount);
    const [items, setItems] = useState(initialList);
    const ref = useRef();

    const STORAGE_KEY = 'hs.notifications.v1';

    useEffect(() => {
        function handleClick(e){
            if(ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    },[]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const map = new Map();
                    (parsed || []).forEach(i => map.set(String(i.id), i));
                    (initialList || []).forEach(i => map.set(String(i.id), i));
                    const merged = Array.from(map.values()).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)).slice(0,10);
                    setItems(merged);
                    const unreadCached = merged.filter(i => !i.read_at).length;
                    setUnread(unreadCached || initialCount);
                }
            }
        } catch (e) {
           
        }
    }, []);

    useEffect(()=>{
        if (!user || !window.Echo) return;
        let channel = null;
        try{
            channel = Echo.private(`App.Models.User.${user.id}`);
            const handler = (n) => {
                // normalizar la notificación 
                try {
                    if (!n.created_at) n.created_at = new Date().toISOString();
                    if (!n.data) n.data = n;

                    if (!n.id) {
                        
                        const fallbackId = n.data?.id ?? (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
                        n.id = String(fallbackId);
                    }
                } catch (err) {
                    
                }

                setItems(prev => {
                    
                    const map = new Map();
                    [n, ...prev].forEach(i => map.set(String(i.id), i));
                    return Array.from(map.values()).slice(0,10);
                });

                setUnread(prev => prev + 1);

                setTimeout(() => {
                    refreshNotifications();
                }, 700);
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

    useEffect(() => {
        try {
            const serverList = page.props['auth']?.user?.recent_notifications ?? [];
            const serverCount = page.props['auth']?.user?.unread_notifications_count ?? 0;

            const normalized = (serverList || []).map(n => ({ id: n.id, data: n.data, read_at: n.read_at, created_at: n.created_at }));

            const localMap = new Map(items.map(i => [String(i.id), i]));
            normalized.forEach(n => localMap.set(String(n.id), n));

            const merged = Array.from(localMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

            setItems(merged);
            setUnread(serverCount);
        } catch (e) {
            
        }
    
    }, [page.props.auth?.user?.recent_notifications, page.props.auth?.user?.unread_notifications_count]);

    
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            
        }
    }, [items]);

    async function refreshNotifications() {
        try {
            const res = await fetch(route('notifications.index') + '?per_page=10', { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            
            const list = data.data || data;
            setItems(list.map(n => ({ id: n.id, data: n.data, read_at: n.read_at, created_at: n.created_at })));
            const unreadCount = list.filter(i => !i.read_at).length;
            setUnread(unreadCount);
        } catch (e) {
            
        }
    }

    async function markRead(id, url){
        try{
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            await fetch(route('notifications.read', id), { method: 'POST', headers: {'X-CSRF-TOKEN': token} });
            setItems(prev => prev.map(i => i.id === id ? {...i, read_at: new Date().toISOString()} : i));
            setUnread(prev => Math.max(0, prev-1));
            if (url) window.location = url;
            
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) || [];
                    const updated = parsed.map(i => i.id === id ? {...i, read_at: new Date().toISOString()} : i);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                }
            } catch (e) {}
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

    async function clearAll(){
        try{
            if(!(await confirmToast('¿Borrar todas las notificaciones? Esta acción no se puede deshacer.'))) return;
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const res = await fetch(route('notifications.destroy_all'), { method: 'DELETE', headers: {'X-CSRF-TOKEN': token} });
            if (!res.ok) throw new Error('Network error');
            setItems([]);
            setUnread(0);
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        }catch(e){ console.error(e); }
    }

    function timeAgo(iso){
        try{
            const d = new Date(iso);
            const now = new Date();
            const sec = Math.floor((now - d) / 1000);
            if (sec < 60) return `${sec}s`;
            const min = Math.floor(sec/60);
            if (min < 60) return `${min}m`;
            const h = Math.floor(min/60);
            if (h < 24) return `${h}h`;
            const days = Math.floor(h/24);
            return `${days}d`;
        }catch(e){
            return '';
        }
    }

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)} className="relative p-2 rounded-md bg-gray-100 hover:bg-gray-200">
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
                        <div className="flex items-center gap-2">
                            <button onClick={markAll} className="text-xs text-gray-800 bg-gray-200 border border-gray-200 px-2 py-1 rounded-md hover:bg-gray-300 transition">Marcar todas</button>
                            <button onClick={clearAll} className="text-xs text-red-700 bg-gray-200 border border-red-100 px-2 py-1 rounded-md hover:bg-red-100 transition">Vaciar</button>
                        </div>
                    </div>
                    <div className="max-h-72 overflow-auto">
                        {items.length === 0 && <div className="px-3 py-6 text-center text-sm text-gray-500">🔔<div className="mt-1">No hay notificaciones</div></div>}
                        {items.map(n => (
                            <div
                                key={n.id}
                                onClick={() => markRead(n.id, n.data?.url)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if(e.key === 'Enter') markRead(n.id, n.data?.url); }}
                                className={`cursor-pointer px-3 py-3 hover:bg-gray-50 transition flex items-start gap-3 ${!n.read_at ? 'bg-indigo-50' : ''}`}
                            >
                                <div className="flex-shrink-0 relative">
                                    {n.data?.author_avatar ? (
                                        <img src={n.data.author_avatar} alt="avatar" className="h-9 w-9 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">🔔</div>
                                    )}
                                    {!n.read_at && (
                                        <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className={`text-sm ${!n.read_at ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>{n.data?.message ?? ''}</div>
                                        <div className="text-xs text-gray-400">{timeAgo(n.created_at)}</div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <button onClick={(e) => { e.stopPropagation(); markRead(n.id, n.data?.url); }} className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md shadow-sm transition">Abrir</button>
                                        {!n.read_at && <button onClick={(e) => { e.stopPropagation(); markRead(n.id, null); }} className="text-xs text-gray-800 bg-gray-200 px-2 py-1 rounded-md hover:bg-gray-300 transition ring-1 ring-gray-200">Marcar leída</button>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
