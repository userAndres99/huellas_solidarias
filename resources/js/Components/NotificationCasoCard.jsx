import React, { useEffect, useState } from 'react';
import TarjetaCompacta from '@/Components/TarjetaCompacta';
import LoadingImagenes from '@/Components/LoadingImagenes';

export default function NotificationCasoCard({ notification, onDelete = null }) {
  const [caso, setCaso] = useState(null);
  const casoId = notification.data?.caso_id;

  useEffect(() => {
    let mounted = true;
    async function fetchCaso() {
      if (!casoId) return;
      try {
        const res = await fetch(`/casos/json/${casoId}`);
        if (!res.ok) throw new Error('network');
        const data = await res.json();
        if (!mounted) return;
        // normalizar datos a formato esperado por TarjetaCompacta
        const pub = {
          id: data.id,
          descripcion: data.descripcion,
          fotoAnimal: data.fotoAnimal,
          fechaPublicacion: data.fechaPublicacion || data.created_at,
          tipoAnimal: data.tipoAnimal,
          situacion: data.situacion,
          estado: data.estado ?? 'activo',
          // incluir información del autor (si viene en el payload)
          autor: data.usuario ? {
            id: data.usuario.id,
            name: data.usuario.name,
            profile_photo_url: data.usuario.profile_photo_url ?? null,
          } : null,
        };
        setCaso(pub);
      } catch (e) {
        // ignore
      }
    }
    fetchCaso();
    return () => { mounted = false; };
  }, [casoId]);

  if (!caso) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <LoadingImagenes wrapperClass="w-28 h-20 flex-shrink-0 rounded overflow-hidden" forceLoading={true} overlay={false} />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/5 mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  async function handleDelete() {
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const res = await fetch(route('notifications.destroy', notification.id), { method: 'DELETE', headers: {'X-CSRF-TOKEN': token} });
      if (res.ok) {
        if (typeof onDelete === 'function') onDelete(notification.id);
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div>
      <TarjetaCompacta
        publicacion={caso}
        actions={(
          <button onClick={handleDelete} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">Eliminar</button>
        )}
      />
    </div>
  );
}
