import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import LoadingImagenes from '@/Components/LoadingImagenes';
import MapaInteractivo from '@/Components/MapaInteractivo';

export default function EventShow({ event, status = 'active' }) {
  const image = event?.image_url ?? null;
  const [mapCenter, setMapCenter] = useState(event?.lat && event?.lng ? [Number(event.lat), Number(event.lng)] : null);

  return (
    <>
      <Head title={event?.title || 'Evento'} />

      <div className="container mx-auto p-4 max-w-3xl">
        <Link href={route('organizacion.index')} className="text-blue-600 mb-4 inline-block">← Volver</Link>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-4">
            <LoadingImagenes src={image} alt={event?.title} wrapperClass="w-full h-64 rounded-md overflow-hidden bg-gray-100" imgClass="w-full h-full object-cover" placeholderText="Cargando imagen del evento..." />
          </div>

          {status === 'finalizado' ? (
            <div className="mb-4 p-3 rounded bg-yellow-50 text-yellow-800">Evento finalizado</div>
          ) : null}

          {event?.lat && event?.lng ? (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Ubicación del evento</div>
                <div>
                  <button
                    type="button"
                    onClick={() => setMapCenter([Number(event.lat), Number(event.lng)])}
                    className="text-sm px-3 py-1 bg-white border rounded shadow-sm hover:bg-gray-50"
                  >
                    Centrar
                  </button>
                </div>
              </div>

              <div className="h-64 rounded overflow-hidden border">
                <MapaInteractivo
                  readOnly={true}
                  center={mapCenter}
                  initialPosition={[Number(event.lat), Number(event.lng)]}
                  marker={true}
                  markerType="org"
                  showMarkers={false}
                />
              </div>
            </div>
          ) : (
            <div className="mb-4 text-sm text-gray-500">Sin ubicación disponible</div>
          )}

          <h1 className="text-2xl font-bold mb-2">{event?.title}</h1>

          {event?.organizacion ? (
            <div className="text-sm text-gray-600 mb-2">Organizado por: <Link href={`/organizacion/${event.organizacion.id}`} className="text-blue-600">{event.organizacion.name || event.organizacion.nombre}</Link></div>
          ) : null}

          <div className="text-sm text-gray-500 mb-4">
            {event?.start ? new Date(event.start).toLocaleString() : ''}
            {event?.end ? ` — ${new Date(event.end).toLocaleString()}` : ''}
          </div>

          <div className="prose max-w-none text-gray-700">
            {event?.description || event?.descripcion || 'Sin descripción.'}
          </div>
        </div>
      </div>
    </>
  );
}

EventShow.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
    header={<h2 className="text-xl font-semibold">Detalle del evento</h2>}
  >
    {page}
  </AuthenticatedLayout>
);