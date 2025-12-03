import React from 'react';
import LoadingImagenes from '@/Components/LoadingImagenes';
import NotificationSkeleton from '@/Components/NotificationSkeleton';

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
  // normalizar la imagen
  const imageRaw = data.image || data.image_url || data.image_path || data.organizacion_image || null;

  // normalizar imagen según reglas similares a LoadingImagenes
  function normalizeImage(src) {
    if (!src) return null;
    try {
      let s = String(src).trim();
      // eliminar cualquier comilla accidental al principio o al final
      s = s.replace(/^"|"$/g, '').replace(/^'|'$/g, '');

      // si es URL absoluta, devolver tal cual
      if (/^https?:\/\//i.test(s)) {
        try {
          const u = new URL(s);
          if (u.pathname && u.pathname.startsWith('/storage/')) {
            const out = u.pathname;
            console.debug && console.debug('[NotificationEventoCard] normalized remote storage url', s, '->', out);
            return out;
          }
        } catch (e) {
          
        }
        return s;
      }

      // Si comienza con '//' (relativo al protocolo) probablemente esté malformado para nuestro uso — tratar como nombre de archivo simple
      if (/^\/\//.test(s)) {
        s = s.replace(/^\/+/, '');
      }

      // Ahora, si es una ruta absoluta que comienza con '/', mantenerla
      if (s.startsWith('/')) return s;

      // rutas de almacenamiento que pueden carecer de barra inicial
      if (s.startsWith('storage/')) return '/' + s;

      // carpetas de almacenamiento conocidas -> prefijo con /storage/
      if (s.startsWith('foto_animales/') || s.startsWith('usuarios/foto_animales/') || s.startsWith('uploads/') || s.startsWith('images/') || s.startsWith('historias/') || s.startsWith('historias\\')) return '/storage/' + s;

      // si contiene una barra, tratar como ruta absoluta
      if (s.indexOf('/') !== -1) return '/' + s;

      // fallback: tratar como nombre de archivo almacenado bajo /storage/
      return '/storage/' + s;
    } catch (e) {
      return src;
    }
  }

  const image = normalizeImage(imageRaw);
  const ready = Boolean(image || data.organizacion_name || data.name || data.title);

  if (!ready) return <NotificationSkeleton />;

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
