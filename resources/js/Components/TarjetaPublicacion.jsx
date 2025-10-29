import React from 'react';
import { Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export default function TarjetaPublicacion({ publicacion }) {
  const p = publicacion;

  return (
    <div className="border rounded-lg overflow-hidden">
      {p.fotoAnimal ? (
        <img
          src={p.fotoAnimal}
          alt={`Foto de ${p.tipoAnimal || 'animal'}`}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
          Sin imagen
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-bold">
              {p.tipoAnimal || '—'} • {p.situacion}
            </h4>
            <p className="text-sm text-gray-600">{p.ciudad}</p>
          </div>
          <div className="text-sm text-gray-500">{formatDate(p.fechaPublicacion)}</div>
        </div>

        <p className="mt-2 text-sm text-gray-700 truncate">{p.descripcion}</p>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/casos/${p.id}`}
            className="text-sm inline-block px-3 py-1 border rounded hover:bg-gray-50"
          >
            Ver
          </Link>
          <Link
            href={`/casos/${p.id}/edit`}
            className="text-sm inline-block px-3 py-1 border rounded hover:bg-gray-50"
          >
            Editar
          </Link>

          {p.estado === 'activo' && (
            <> 
              <button
                type="button"
                onClick={() => {
                  if (!confirm('¿Querés finalizar esta publicación?')) return;
                  Inertia.post(route('casos.update_status', p.id), { status: 'finalizado' }, {
                    onSuccess: () => { window.location.href = route('dashboard'); }
                  });
                }}
                className="text-sm inline-block px-3 py-1 border rounded bg-green-50 text-green-700 hover:bg-green-100"
              >
                Finalizar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!confirm('¿Querés cancelar esta publicación?')) return;
                  Inertia.post(route('casos.update_status', p.id), { status: 'cancelado' }, {
                    onSuccess: () => { window.location.href = route('dashboard'); }
                  });
                }}
                className="text-sm inline-block px-3 py-1 border rounded bg-red-50 text-red-700 hover:bg-red-100"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
