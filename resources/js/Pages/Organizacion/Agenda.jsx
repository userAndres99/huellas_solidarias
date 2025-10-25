import React from 'react';
import { Link } from '@inertiajs/react';

export default function Agenda({ events = [] }) {
  if (!events.length) {
    return (
      <div className="py-12 text-center text-gray-500">No hay eventos creados aún.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map(ev => (
        <article key={ev.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col">
          {ev.image_url ? (
            <div className="h-40 w-full mb-3 overflow-hidden rounded-lg">
              <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-40 w-full mb-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-400">Sin imagen</div>
          )}

          <h3 className="text-lg font-semibold text-gray-800">{ev.title}</h3>
          {ev.description && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{ev.description}</p>}

          <div className="mt-3 text-sm text-gray-600">
            <div><strong>Inicio:</strong> {ev.start ? new Date(ev.start).toLocaleString() : '-'}</div>
            <div><strong>Fin:</strong> {ev.end ? new Date(ev.end).toLocaleString() : '-'}</div>
          </div>

          <div className="mt-auto pt-3 flex items-center justify-between">
            <Link href={route('organizacion.eventos.show', ev.id)} className="text-blue-600 text-sm">Ver</Link>
            <div className="text-xs text-gray-500">{ev.lat && ev.lng ? 'Con ubicación' : 'Sin ubicación'}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
