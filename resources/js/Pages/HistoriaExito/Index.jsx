import { useEffect, useState } from "react";
import { Link, usePage, Head } from "@inertiajs/react";
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import { FaEye, FaPlus } from 'react-icons/fa';
import Loading from '@/Components/Loading';
import { preloadImages } from '@/helpers';

export default function Historias() {
    const pageProps = usePage().props; // 🔹 obtenemos todas las props de la página (incluye auth, canLogin, canRegister)
    const { auth } = pageProps;
    const [historias, setHistorias] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <div className="flex justify-between items-center mb-8">

                {auth.user && (
                    <Link
                        href="/publicar-historia" // Ruta para crear nueva historia
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 hover:scale-105 transform transition-all duration-200"
                    >
                        <FaPlus className="mr-2" />
                        Nueva Historia
                    </Link>
                )}
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historias.map(h => (
                    <div
                        key={h.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
                    >
                        {/* Imágenes */}
                        <div className="grid grid-cols-2 gap-1">
                            {h.imagen_antes ? (
                                <img
                                    src={h.imagen_antes}
                                    alt="Antes"
                                    className="w-full h-40 object-cover"
                                />
                            ) : (
                                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                                    Sin Imagen
                                </div>
                            )}
                            {h.imagen_despues ? (
                                <img
                                    src={h.imagen_despues}
                                    alt="Después"
                                    className="w-full h-40 object-cover"
                                />
                            ) : (
                                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                                    Sin Imagen
                                </div>
                            )}
                        </div>

                        {/* Contenido */}
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="text-xl font-semibold mb-2 text-gray-800">{h.titulo}</h3>
                            <p className="text-gray-600 mb-3 line-clamp-3">{h.descripcion}</p>
                            {h.testimonio && (
                                <blockquote className="italic text-blue-700 mb-4">"{h.testimonio}"</blockquote>
                            )}

                            {/* Boton */}
                            <div className="mt-auto flex justify-end">
                                <EnlaceRequiereLogin
                                    href={`/historias/${h.id}`}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 hover:scale-105 transform transition-all duration-200"
                                >
                                    <FaEye className="mr-2" />
                                    Ver Historia
                                </EnlaceRequiereLogin>
                            </div>
                        </div>
                    </div>
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
