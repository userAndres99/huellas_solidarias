import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import axios from 'axios';
import { Link } from '@inertiajs/react';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import EstadoBadge from '@/Components/EstadoBadge';
import Modal from '@/Components/Modal';
import LoadingImagenes from '@/Components/LoadingImagenes';

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

export default function TarjetaPublicacion({ publicacion, showEdit = true, onRemove = null }) {
  const p = publicacion;
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null });
  const [imgLoaded, setImgLoaded] = useState(false);

  // reset imagen
  useEffect(() => {
    setImgLoaded(false);
  }, [p?.fotoAnimal]);

  return (
  <div className="card-surface-alt rounded-xl overflow-hidden fade-in card-hover relative">
      <div className="relative h-56 md:h-48 lg:h-56">
        {p.fotoAnimal ? (
          <LoadingImagenes
            src={p.fotoAnimal}
            alt={`Foto de ${p.tipoAnimal || 'animal'}`}
            wrapperClass="h-full w-full"
            imgClass="object-contain object-center w-full h-full transform transition-transform duration-300 hover:scale-105"
            placeholderText="Cargando imagen..."
          />
        ) : (
          <div className="h-full w-full bg-[rgba(2,132,199,0.06)] flex items-center justify-center text-slate-500">Sin imagen</div>
        )}

        <div className="absolute top-3 right-3 z-30">
          <span className="px-2 py-1 bg-white/90 rounded text-xs text-slate-700">{p.tipoAnimal || 'Animal'}</span>
        </div>
      </div>

      <div className="p-4 pb-20 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{formatDate(p.fechaPublicacion)}</span>
        </div>

        <p className="mt-2 text-sm text-slate-800 line-clamp-3">{p.descripcion}</p>

        
      </div>

      <div className="absolute right-3 bottom-3 flex flex-col items-end gap-2">
        <div>
          <EstadoBadge situacion={p.situacion} />
        </div>

        <div className="flex items-center gap-2">
          {showEdit && (
            <Link
              href={`/casos/${p.id}/edit`}
              className="text-sm inline-block px-3 py-1 border rounded btn-gradient text-white transition btn-animate-gradient"
            >
              Editar
            </Link>
          )}

          {p.estado === 'activo' && (
            <>
              <button
                type="button"
                onClick={() => setConfirmModal({ open: true, type: 'finalizar' })}
                className="text-sm inline-block px-3 py-1 border rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              >
                Finalizar
              </button>

              <button
                type="button"
                onClick={() => setConfirmModal({ open: true, type: 'cancelar' })}
                className="text-sm inline-block px-3 py-1 border rounded bg-red-50 text-red-700 hover:bg-red-100"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="absolute left-3 bottom-3 z-30">
        <EnlaceRequiereLogin href={`/casos/${p.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm hover:shadow-md transition transform hover:-translate-y-0.5" ariaLabel={`Ver caso ${p.id}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block">
            <path d="M12 5c-7 0-11 6-11 7s4 7 11 7 11-6 11-7-4-7-11-7zm0 11a4 4 0 110-8 4 4 0 010 8z" fill="currentColor"/>
            <path d="M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="white"/>
          </svg>
          Ver detalle
        </EnlaceRequiereLogin>
      </div>

      {p.estado === 'activo' && (
        <Modal show={confirmModal.open} onClose={() => setConfirmModal({ open: false, type: null })} maxWidth="md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {confirmModal.type === 'finalizar' ? 'Finalizar publicación' : 'Cancelar publicación'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {confirmModal.type === 'finalizar' ? (
                  "Si considerás que esta publicación cumplió su objetivo (por ejemplo: la mascota fue encontrada o adoptada), seleccioná 'Finalizar' para marcarla como completada y dejar de mostrarla como activa. ¿Deseás continuar?"
                ) : (
                  "Si por algún motivo querés cancelar esta publicación (por ejemplo: datos incorrectos o publicación duplicada), seleccioná 'Cancelar' para retirarla. ¿Deseás continuar?"
                )}
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ open: false, type: null })}
                  className="px-4 py-2 rounded bg-white border text-sm"
                >
                  No, volver
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const status = confirmModal.type === 'finalizar' ? 'finalizado' : 'cancelado';
                    try {
                      const url = route('casos.update_status', p.id);
                      const resp = await axios.post(url, { status });
                      if (resp && resp.data) {
                        if (typeof onRemove === 'function') {
                          onRemove(p.id);
                        }
                        setConfirmModal({ open: false, type: null });
                      }
                    } catch (err) {
                      console.error('Error updating status', err);
                      setConfirmModal({ open: false, type: null });
                    }
                  }}
                  className={"px-4 py-2 rounded text-sm font-semibold " + (confirmModal.type === 'finalizar' ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white')}
                >
                  {confirmModal.type === 'finalizar' ? 'Sí, deseo finalizar' : 'Sí, deseo cancelar'}
                </button>
              </div>
            </div>
          </Modal>
        )}
    </div>
  );
}
