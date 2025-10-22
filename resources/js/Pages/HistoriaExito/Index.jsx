import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";

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
    <h2 className="text-3xl font-bold mb-6 text-center">Historias de Éxito</h2>

    <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {historias.map(h => (
        <div
          key={h.id}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className="grid grid-cols-2 gap-1">
            {h.imagen_antes && (
              <img
                src={h.imagen_antes}
                alt="Antes"
                className="w-full h-40 object-cover"
              />
            )}
            {h.imagen_despues && (
              <img
                src={h.imagen_despues}
                alt="Después"
                className="w-full h-40 object-cover"
              />
            )}
          </div>

          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">{h.titulo}</h3>
            <p className="text-gray-600 mb-2 line-clamp-3">{h.descripcion}</p>
            <blockquote className="italic text-blue-700">"{h.testimonio}"</blockquote>
          </div>


            <div className="flex items-center justify-between">
              <Link href={`/historias/${h.id}`}>Ver</Link>
            </div>

        </div>
      ))}
    </div>
  </div>
    );
}
