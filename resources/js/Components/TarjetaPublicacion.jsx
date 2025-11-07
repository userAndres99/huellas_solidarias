import React from 'react';
import { Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import EstadoBadge from '@/Components/EstadoBadge';

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
  <div className="card-surface-alt rounded-xl overflow-hidden fade-in card-hover relative">
      {p.fotoAnimal ? (
        <div className="w-full h-44 overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 relative">
          <img
            src={p.fotoAnimal}
            alt={`Foto de ${p.tipoAnimal || 'animal'}`}
            className="w-full h-44 object-cover transform transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        <div className="w-full h-44 bg-[rgba(2,132,199,0.06)] flex items-center justify-center text-slate-500">
          Sin imagen
        </div>
      )}

      <div className="absolute top-3 right-3">
        <span className="px-2 py-1 bg-white/90 rounded text-xs text-slate-700">{p.tipoAnimal || 'Animal'}</span>
      </div>

  <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
                <div className="flex items-center gap-3">
                  <EstadoBadge situacion={p.situacion} />
                  <span className="text-sm text-slate-600">{formatDate(p.fechaPublicacion)}</span>
                </div>
          </div>
        </div>

  <p className="mt-2 text-sm text-slate-800 line-clamp-3">{p.descripcion}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/casos/${p.id}`}
            aria-label={`Ver caso ${p.id}`}
            className="text-sm inline-flex items-center gap-2 px-3 py-1 rounded bg-[var(--color-primary)] text-white font-semibold shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block">
              <path d="M12 5c-7 0-11 6-11 7s4 7 11 7 11-6 11-7-4-7-11-7zm0 11a4 4 0 110-8 4 4 0 010 8z" fill="currentColor"/>
              <path d="M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="white"/>
            </svg>
            Ver
          </Link>
          <Link
            href={`/casos/${p.id}/edit`}
            className="text-sm inline-block px-3 py-1 border rounded btn-gradient text-white transition btn-animate-gradient"
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
                className="text-sm inline-block px-3 py-1 border rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
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
