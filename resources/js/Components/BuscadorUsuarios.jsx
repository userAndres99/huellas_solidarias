import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';

export default function BuscadorUsuarios(){
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

    return (
        <div className="relative ms-6 hidden md:block w-80">
            <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={onChange}
                placeholder="Buscar usuarios u organizaciones..."
                className="w-full rounded-md border px-3 py-2 text-sm bg-[var(--color-surface)]"
            />

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
