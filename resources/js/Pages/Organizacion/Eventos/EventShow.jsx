import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function EventShow({ event }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Detalle del evento</h2>}>
      <Head title={event.title || 'Evento'} />

      <div className="container mx-auto p-4 max-w-3xl">
        <Link href={route('organizacion.index')} className="text-blue-600 mb-4 inline-block">← Volver</Link>

        <div className="bg-white shadow rounded overflow-hidden">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-500">Sin imagen</div>
          )}

          <div className="p-4">
            <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
            <p className="text-gray-700 mb-3">{event.description}</p>

            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Inicio:</strong> {event.start ? new Date(event.start).toLocaleString() : '-'}</div>
              <div><strong>Fin:</strong> {event.end ? new Date(event.end).toLocaleString() : '-'}</div>
              <div><strong>Ubicación:</strong> {event.lat && event.lng ? `${event.lat}, ${event.lng}` : 'No especificada'}</div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}