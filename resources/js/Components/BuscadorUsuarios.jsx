import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';

export default function BuscadorUsuarios({ mobile = false }){
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const timer = useRef(null);
    const inputRef = useRef(null);

    useEffect(()=>{
        return ()=> {
            if(timer.current) clearTimeout(timer.current);
        }
    },[]);

    function doSearch(q){
        if(!q || q.trim() === ''){
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(route('buscador.usuarios') + '?q=' + encodeURIComponent(q), {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        }).then(r => r.json())
        .then(data => {
            setResults(data.data || []);
        }).catch(err => {
            console.error('Search error', err);
            setResults([]);
        }).finally(()=> setLoading(false));
    }

    function onChange(e){
        const v = e.target.value;
        setQuery(v);
        if(timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(()=> doSearch(v), 300);
    }

    const containerClass = mobile ? 'relative block w-1/2 mb-3 mx-auto' : 'relative ms-6 hidden md:block w-48';

    return (
        <div className={containerClass}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={onChange}
                placeholder="buscar usuario"
                className={mobile ? "w-full rounded-md border px-3 py-2 pl-12 text-sm bg-[var(--color-surface)]" : "w-full rounded-md border px-3 py-2 pl-12 text-sm bg-[var(--color-surface)]"}
            />

            {mobile && (
                <button
                    type="button"
                    aria-label="Buscar"
                    onClick={() => { if(timer.current) clearTimeout(timer.current); doSearch(query); inputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            )}

            { (results.length > 0 || loading) && (
                <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg max-h-64 overflow-auto">
                    {loading && (
                        <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
                    )}
                    {results.map(user => (
                        <a
                            key={user.id}
                            href={route('usuarios.show', user.id)}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                        >
                            <img src={user.profile_photo_url || '/images/DefaultPerfil.jpg'} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-slate-800">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.organizacion ? user.organizacion.nombre : user.email}</div>
                            </div>
                        </a>
                    ))}
                    {(!loading && results.length === 0) && (
                        <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                    )}
                </div>
            )}
        </div>
    )
}
