import React, { useEffect, useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MapaInteractivo from '../../Components/MapaInteractivo';

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

      <div className="container mx-auto p-4 max-w-3xl">
        <Link href="/casos" className="text-blue-600 mb-4 inline-block">← Volver</Link>

        <div className="bg-white shadow rounded overflow-hidden">
          {caso.fotoAnimal ? (
            <img src={caso.fotoAnimal} alt={caso.tipoAnimal} className="w-full h-96 object-cover" />
          ) : (
            <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-gray-500">Sin imagen</div>
          )}

          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">{caso.tipoAnimal || 'Animal'}</h2>
            <p className="text-gray-700 mb-2">{caso.descripcion}</p>

            <div className="text-sm text-gray-600 mb-2 space-y-1">
              <div><strong>Situación:</strong> {caso.situacion}</div>
              <div><strong>Ciudad:</strong> {caso.ciudad}</div>
              <div><strong>Teléfono:</strong> {caso.telefonoContacto || 'No disponible'}</div>
              <div><strong>Sexo:</strong> { caso.sexo }</div>
              <div><strong>Tamaño:</strong> { caso.tamano }</div>
              <div><strong>Publicado:</strong> {new Date(caso.fechaPublicacion).toLocaleString()}</div>
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}