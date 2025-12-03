import React from 'react';
import LoadingImagenes from '@/Components/LoadingImagenes';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export default function TarjetaCompacta({ publicacion, actions = null }) {
  const p = publicacion || {};

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm p-3 flex items-start gap-3">
      <div className="w-28 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        {p.fotoAnimal ? (
          <LoadingImagenes src={p.fotoAnimal} alt={p.tipoAnimal || 'Imagen'} wrapperClass="w-28 h-20" imgClass="w-full h-full object-cover" />
        ) : (
          <div className="w-28 h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-500">Sin imagen</div>
        )}
      </div>

      <div className="flex-1">
        {p.autor && (
          <div className="text-sm font-semibold text-slate-800">{p.autor.name}</div>
        )}

        <div className="text-sm text-gray-600">Nuevo Caso Publicado</div>
        <div className="text-xs text-gray-500">{formatDate(p.fechaPublicacion)}</div>

        {/* descripción removida para notificaciones: se mantiene sólo el enlace a detalle */}

        <div className="mt-3 flex items-center justify-between">
          <div>
            <EnlaceRequiereLogin href={`/casos/${p.id}`} className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">Ver detalle</EnlaceRequiereLogin>
          </div>
          {actions ? (
            <div>
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
