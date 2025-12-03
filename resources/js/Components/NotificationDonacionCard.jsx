import React from 'react';
import LoadingImagenes from '@/Components/LoadingImagenes';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export default function NotificationDonacionCard({ notification, onDelete = null }) {
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

  const imageSrc = data.image_url || data.image || '/images/mercadopagologo.png';

  // mostrar el nombre del donante de forma segura y truncada si es muy largo
  const donorDisplay = (data.donor || data.donor_name || data.donor_email || 'Donación recibida');

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm p-3 flex items-start gap-3">
      <div className="w-28 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        <LoadingImagenes src={imageSrc} alt={donorDisplay} wrapperClass="w-28 h-20" imgClass="w-full h-full object-cover" />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="text-sm font-semibold text-slate-800 truncate max-w-full">{donorDisplay}</div>
        <div className="text-sm text-gray-600 mt-1">Donación recibida</div>
        <div className="text-xs text-gray-500 mt-1">{data.amount ? `${data.amount} ${data.currency ?? ''}` : ''}</div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href={data.url} className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">Ir</a>
            <div className="text-xs text-gray-400">{formatDate(notification.created_at)}</div>
          </div>
          <div>
            <button onClick={handleDelete} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
