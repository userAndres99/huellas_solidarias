import React, { useEffect, useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MapaInteractivo from '../../Components/MapaInteractivo';
import Comentarios from '@/Components/Comentarios';

export default function Show(props) {
  const { initialId } = props;
  const id = initialId || window.location.pathname.split('/').pop();
  const [caso, setCaso] = useState(undefined);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchCaso = async() => {
      try {
        const res = await fetch(`/casos/json/${id}`,{
          headers: { Accept: 'application/json' },
          signal,
        });
        if (!res.ok) throw new Error('Not found');

        const data = await res.json();
        setCaso(data);
      }catch (error){
        if(error.name !== 'AbortError'){
          console.error('Error al obtener el caso:', error);
          setCaso(null);
        }
      }finally{
        setLoading(false);
      }
    };

    fetchCaso();

    return () => controller.abort();


  },[id]);


  if (loading){
    return (
      <div className='flex flex-col items-center justify-center h-64'>
        <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin-low'></div>
        <p className='mt-2 text-gray-600'>Cargando caso...</p>
      </div>
    )
  }



 if (caso === null){
  return (
    <div className='flex items-center justify-center h-64 text-red-600'>
      No se pudo cargar el caso o no existe
    </div>
  )
 }

  return (
    <AuthenticatedLayout
      {...props}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Detalle del Caso</h2>}
    >
      <Head title="Detalle del Caso" />

      <div className="container mx-auto p-4 max-w-4xl">
        <Link href="/casos" className="text-blue-600 mb-4 inline-block">← Volver</Link>

        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative h-96 md:h-[520px] bg-gray-100">
            {caso.fotoAnimal ? (
              <img src={caso.fotoAnimal} alt={caso.tipoAnimal} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-500">Sin imagen</div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

            <div className="absolute left-6 bottom-6 text-white">
              <h1 className="text-2xl md:text-3xl font-bold drop-shadow">{caso.tipoAnimal || 'Animal'}</h1>
              <p className="text-sm md:text-base mt-1 drop-shadow">{caso.ciudad ? `${caso.ciudad} · ` : ''}{new Date(caso.fechaPublicacion || caso.created_at).toLocaleString()}</p>
            </div>

            <div className="absolute right-6 top-6 flex items-center gap-2">
              <span className="px-3 py-1 bg-white/90 rounded-full text-sm text-gray-800 font-semibold">{caso.situacion || 'Publicación'}</span>
              <span className="px-3 py-1 bg-white/90 rounded-full text-sm text-gray-800">{caso.tipoAnimal || 'Animal'}</span>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:gap-6">
              <div className="md:w-2/3">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Descripción</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{caso.descripcion}</p>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                  <div><strong className="text-gray-800">Teléfono:</strong> {caso.telefonoContacto || 'No disponible'}</div>
                  <div><strong className="text-gray-800">Publicado:</strong> {new Date(caso.fechaPublicacion || caso.created_at).toLocaleString()}</div>
                  <div><strong className="text-gray-800">Sexo:</strong> {caso.sexo || '—'}</div>
                  <div><strong className="text-gray-800">Tamaño:</strong> {caso.tamano || '—'}</div>
                </div>

                {caso.latitud && caso.longitud && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Ubicación</h3>
                    <MapaInteractivo
                      readOnly={true}
                      initialPosition={[Number(caso.latitud), Number(caso.longitud)]}
                      marker={true}
                      tipoAnimal={caso.tipoAnimal}
                      showMarkers={false}
                    />
                  </div>
                )}
              </div>

              <aside className="md:w-1/3 mt-6 md:mt-0">
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-3">
                  <div className="text-sm text-gray-600">
                    <div><strong className="text-gray-800">Ciudad:</strong> {caso.ciudad || '—'}</div>
                    <div><strong className="text-gray-800">Situación:</strong> {caso.situacion || '—'}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {caso.telefonoContacto ? (
                      <a href={`tel:${caso.telefonoContacto}`} className="w-full text-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">Contactar</a>
                    ) : (
                      <button disabled className="w-full text-center px-3 py-2 bg-gray-300 text-gray-700 rounded-md">Contactar</button>
                    )}

                    <a href={`https://www.openstreetmap.org/?mlat=${caso.latitud}&mlon=${caso.longitud}#map=16/${caso.latitud}/${caso.longitud}`} target="_blank" rel="noreferrer" className="w-full text-center px-3 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100 transition">Abrir en mapa</a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </article>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Comentarios</h3>
          <Comentarios
            comentableType="App\\Models\\Caso"
            comentableId={caso.id}
          />
        </div>
      </div>
    </AuthenticatedLayout>

    
  );
}