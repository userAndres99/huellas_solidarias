import React, { useEffect, useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index(props) {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/casos/json', { headers: { Accept: 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setCasos(data))
      .catch(() => setCasos([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Cargando...</div>;

  return (
    <AuthenticatedLayout
      {...props}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicaciones</h2>}
    >
      <Head title="Publicaciones" />

      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Publicaciones</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {casos.map(c => (
            <div key={c.id} className="bg-white shadow rounded overflow-hidden">
              <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {c.fotoAnimal ? (
                  <img
                    src={c.fotoAnimal}
                    alt={c.tipoAnimal || 'Foto'}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-500">Sin imagen</div>
                )}
              </div>

              <div className="p-3">
                <div className="text-sm text-gray-500 mb-1">{c.tipoAnimal || 'No especificado'}</div>
                <div className="font-medium line-clamp-2 mb-2">{c.descripcion}</div>
                <div className="text-sm text-gray-600 mb-2">{c.ciudad} · {c.situacion}</div>

                <div className="flex items-center justify-between">
                  <Link href={`/casos/${c.id}`} className="text-blue-600">Ver detalle</Link>
                  {c.latitud && c.longitud && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${c.latitud}&mlon=${c.longitud}#map=16/${c.latitud}/${c.longitud}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-600"
                    >
                      Ver mapa
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}