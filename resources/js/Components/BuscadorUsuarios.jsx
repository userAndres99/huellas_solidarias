import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';

export default function BuscadorUsuarios({ mobile = false, autoFocus = false }){
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(null);
    const [announce, setAnnounce] = useState('');
    const timer = useRef(null);
    const inputRef = useRef(null);
    const itemRefs = useRef([]);

    useEffect(()=>{
        return ()=> {
            if(timer.current) clearTimeout(timer.current);
        }
    },[]);

    useEffect(() => {
        if (autoFocus) {
            inputRef.current?.focus();
        }
    }, [autoFocus]);

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
        setFocusedIndex(null);
        if(timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(()=> doSearch(v), 300);
    }

    useEffect(()=>{
        // reset para que los items se actualicen cuando cambian los resultados
        itemRefs.current = [];
        setFocusedIndex(null);
    }, [results]);

    function focusItem(index){
        const el = itemRefs.current[index];
        if(el) el.focus();
        // asegurar que el elemento sea visible 
        if(el && typeof el.scrollIntoView === 'function'){
            el.scrollIntoView({ block: 'nearest' });
        }
    }

    useEffect(()=>{
        if(focusedIndex === null){
            setAnnounce('');
            return;
        }
        const user = results[focusedIndex];
        if(user){
            const pos = focusedIndex + 1;
            setAnnounce(`${pos} de ${results.length}: ${user.name}`);
        }
    }, [focusedIndex, results]);

    function onInputKeyDown(e){
        if(results.length === 0) return;
        if(e.key === 'ArrowDown'){
            e.preventDefault();
            const next = focusedIndex === null ? 0 : Math.min(focusedIndex + 1, results.length - 1);
            setFocusedIndex(next);
            focusItem(next);
        } else if(e.key === 'ArrowUp'){
            e.preventDefault();
            const prev = focusedIndex === null ? results.length - 1 : Math.max(focusedIndex - 1, 0);
            setFocusedIndex(prev);
            focusItem(prev);
        } else if(e.key === 'Enter'){
            if(focusedIndex !== null){
                e.preventDefault();
                const user = results[focusedIndex];
                if(user) window.location.href = route('usuarios.show', user.id);
            }
        } else if(e.key === 'Escape'){
            setResults([]);
            setFocusedIndex(null);
        }
    }

    const containerClass = mobile ? 'relative block w-[65%] max-w-[320px] mx-auto mb-3' : 'relative ms-6 hidden md:block w-48 flex-shrink-0';

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
                onKeyDown={onInputKeyDown}
                aria-haspopup="listbox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                placeholder="buscar usuario"
                className={mobile ? "w-full rounded-md border px-3 py-2 pl-12 text-sm bg-[var(--color-surface)]" : "w-full rounded-md border px-3 py-2 pl-12 text-sm bg-[var(--color-surface)]"}
            />


            { (results.length > 0 || loading) && (
                <div id="search-results" role="listbox" className="absolute z-50 mt-1 w-auto min-w-full rounded-md bg-white shadow-lg">
                    {loading && (
                        <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
                    )}
                    {results.map((user, idx) => (
                        <a
                            key={user.id}
                            href={route('usuarios.show', user.id)}
                            ref={el => itemRefs.current[idx] = el}
                            role="option"
                            aria-selected={focusedIndex === idx}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if(e.key === 'ArrowDown'){
                                    e.preventDefault();
                                    const next = Math.min(idx + 1, results.length - 1);
                                    setFocusedIndex(next);
                                    focusItem(next);
                                } else if(e.key === 'ArrowUp'){
                                    e.preventDefault();
                                    const prev = Math.max(idx - 1, 0);
                                    setFocusedIndex(prev);
                                    focusItem(prev);
                                }
                            }}
                            className={"flex items-center gap-3 px-3 py-2 hover:bg-gray-50 " + (focusedIndex === idx ? 'bg-indigo-50 ring-2 ring-indigo-400 rounded-md border border-indigo-200' : '')}
                        >
                            <img src={user.profile_photo_url || '/images/DefaultPerfil.jpg'} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-800 whitespace-normal break-words">{user.name}</div>
                                <div className="text-xs text-gray-500 whitespace-normal break-words">{user.organizacion ? user.organizacion.nombre : user.email}</div>
                            </div>
                        </a>
                    ))}
                    <div aria-live="polite" className="sr-only">{announce}</div>
                    {(!loading && results.length === 0) && (
                        <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                    )}
                </div>
            )}
        </div>
    )
}