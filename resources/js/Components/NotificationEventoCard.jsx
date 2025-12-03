import React from 'react';
import LoadingImagenes from '@/Components/LoadingImagenes';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export default function NotificationEventoCard({ notification, onDelete = null }) {
  const data = notification.data || {};
  async function handleDelete() {
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const res = await fetch(route('notifications.destroy', notification.id), { method: 'DELETE', headers: {'X-CSRF-TOKEN': token} });
      if (res.ok) {
        if (typeof onDelete === 'function') onDelete(notification.id);
      }
    } catch (e) {}
  }
  // soportar varios nombres posibles para la imagen en el payload
  const image = data.image || data.image_url || data.image_path || data.organizacion_image || null;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm p-3 flex items-start gap-3">
      <div className="w-28 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        {image ? (
          <LoadingImagenes src={image} alt={data.organizacion_name ?? 'Evento'} wrapperClass="w-28 h-20" imgClass="w-full h-full object-cover" placeholderText="Cargando imagen..." />
        ) : (
          <div className="w-28 h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-500">Sin imagen</div>
        )}
      </div>

      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-800">{data.organizacion_name ?? 'Nuevo evento'}</div>
        <div className="text-sm text-gray-600 mt-1">Nuevo Evento Publicado</div>
        <div className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <a href={data.url} className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">Ir al evento</a>
          </div>
          <div>
            <button onClick={handleDelete} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
