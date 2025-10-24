import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FaEye } from 'react-icons/fa';

export default function Historias() {
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
                setHistorias(data);
            } catch(err) {
                if(err.name !== 'AbortError') console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistorias();
        return () => controller.abort();
    }, []);

    if(loading) return <div>Cargando...</div>;

    return (
       <div className="container mx-auto p-6">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Historias de Éxito</h2>

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

                            {/* Botón */}
                            <div className="mt-auto flex justify-end">
                                <Link
                                    href={`/historias/${h.id}`}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 hover:scale-105 transform transition-all duration-200"
                                >
                                    <FaEye className="mr-2" />
                                    Ver Historia
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
