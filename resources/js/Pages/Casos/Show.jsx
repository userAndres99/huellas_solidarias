import React, { useEffect, useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Comentarios from '@/Components/Comentarios';
import TarjetaDetalle from '@/Components/TarjetaDetalle';
import Loading from '@/Components/Loading';

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

        if ((!data.usuario && !data.user) && data.idUsuario) {
          try {
            const ures = await fetch(`/usuarios/json/${data.idUsuario}`, { headers: { Accept: 'application/json' }, signal });
            if (ures.ok) {
              const udata = await ures.json();
              
              data.usuario = udata;
            }
          } catch (err) {
            if (err.name !== 'AbortError') console.error('Error fetching usuario fallback', err);
          }
        }

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
      <>
        <Head title="Detalle del Caso" />

        <div className="container mx-auto p-4 max-w-4xl min-h-[60vh] flex items-center justify-center">
          <Loading message="Cargando caso..." />
        </div>
      </>
    );
  }



 if (caso === null){
  return (
    <div className='flex items-center justify-center h-64 text-red-600'>
      No se pudo cargar el caso o no existe
    </div>
  )
 }

  return (
    <>
      <Head title="Detalle del Caso" />

      <div className="container mx-auto p-4 max-w-4xl">
        <Link href="/casos" className="text-blue-600 mb-4 inline-block">← Volver</Link>

        <TarjetaDetalle caso={caso} />

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Comentarios</h3>
          <Comentarios
            comentableType="App\\Models\\Caso"
            comentableId={caso.id}
          />
        </div>
      </div>
    </>

  );
}

Show.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
    header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Detalle del Caso</h2>}
  >
    {page}
  </AuthenticatedLayout>
);