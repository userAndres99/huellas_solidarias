import { useEffect, useState } from "react";
import { Link, usePage, Head } from "@inertiajs/react";
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import { FaEye, FaPlus } from 'react-icons/fa';
import Loading from '@/Components/Loading';
import { preloadImages } from '@/helpers';
import TarjetaHistorias from '@/Components/TarjetaHistorias';

export default function Historias() {
    const pageProps = usePage().props; 
    const { auth } = pageProps;
    const [historias, setHistorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all'); // 'all' | 'mine'

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const fetchHistorias = async () => {
            try {
                setLoading(true);
                const res = await fetch('/historias/json', {
                    headers: { Accept: 'application/json' },
                    signal,
                });

                if(!res.ok) throw new Error("Error al obtener historias");
                const data = await res.json();
                const items = data.data || data;
                setHistorias(items);
                // Preload images 
                try {
                    const urls = items.flatMap(h => [h.imagen_antes, h.imagen_despues]).filter(Boolean);
                    await preloadImages(urls);
                } catch (e) {
                    // no bloquear si falla el preload
                    console.warn('Error preloading historia images', e);
                }
            } catch(err) {
                if(err.name !== 'AbortError') console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistorias();
        return () => controller.abort();
    }, []);

     if (loading) return (
         <>
             <Head title="Historias de Éxito" />
             <div className="container mx-auto p-6 min-h-[60vh] flex items-center justify-center">
                 <Loading variant="centered" message="Cargando historias..." />
             </div>
         </>
     );

     return (
         <>
            <Head title="Historias de Éxito" />
            <div className="container mx-auto p-6">
            {auth.user && (
                <div className="mb-4 flex justify-center">
                    <div className="inline-flex rounded-md bg-[var(--color-surface)] p-1 shadow-sm" role="tablist" aria-label="Ver historias">
                        <button
                            type="button"
                            role="tab"
                            aria-pressed={tab === 'all'}
                            onClick={() => setTab('all')}
                            className={`px-3 py-1 text-sm transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full ${tab === 'all' ? 'bg-[#C8E7F5] text-black font-semibold shadow-md border border-black scale-105' : 'text-gray-700 bg-transparent border border-transparent hover:bg-[#EAF8FF] hover:shadow-sm'}`}
                        >
                            Historias de Éxito
                        </button>

                        <button
                            type="button"
                            role="tab"
                            aria-pressed={tab === 'mine'}
                            onClick={() => setTab('mine')}
                            className={`px-3 py-1 text-sm transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full ${tab === 'mine' ? 'bg-[#C8E7F5] text-black font-semibold shadow-md border border-black scale-105' : 'text-gray-700 bg-transparent border border-transparent hover:bg-[#EAF8FF] hover:shadow-sm'}`}
                        >
                            Mis Historias de Éxito
                        </button>
                    </div>
                </div>
            )}

            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historias
                    .filter(h => {
                        if (tab === 'all') return true;
                        if (!auth.user) return false;
                        
                        return (h.user && h.user.id === auth.user.id) || h.user_id === auth.user.id;
                    })
                    .map(h => (
                        <TarjetaHistorias key={h.id} historia={h} />
                    ))}
            </div>
        </div>
       </>
    );
}

Historias.layout = (page) => {
    const LayoutComp = page.props?.auth?.user ? AuthenticatedLayout : PublicLayout;
    return (
        <LayoutComp {...page.props} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Historias de Éxito</h2>}>
            {page}
        </LayoutComp>
    );
};
