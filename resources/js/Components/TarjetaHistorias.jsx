import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import LoadingImagenes from '@/Components/LoadingImagenes';
import Usuario from '@/Components/Usuario';
import axios from 'axios';
import Modal from '@/Components/Modal';

export default function TarjetaHistorias({ historia, showDelete = false, onRemove = null }) {
  const usuario = historia.usuario || historia.user || null;
  const [confirmModal, setConfirmModal] = useState({ open: false });

  return (
    <article key={historia.id} className="relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="relative grid grid-cols-2 gap-1">
        {historia.imagen_antes ? (
          <LoadingImagenes src={historia.imagen_antes} alt="Antes" wrapperClass="w-full h-40" imgClass="w-full h-40 object-cover" placeholderText={null} />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">Sin Imagen</div>
        )}

        {historia.imagen_despues ? (
          <LoadingImagenes src={historia.imagen_despues} alt="Después" wrapperClass="w-full h-40" imgClass="w-full h-40 object-cover" placeholderText={null} />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">Sin Imagen</div>
        )}
        {/* Usuario donde esta la foto,nombre,etc*/}
        <Usuario usuario={usuario} />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{historia.titulo}</h3>
        <p className="text-gray-600 mb-3 line-clamp-3">{historia.descripcion}</p>
        {historia.testimonio && (
          <blockquote className="italic text-blue-700 mb-4">"{historia.testimonio}"</blockquote>
        )}

        <div className="mt-auto flex justify-start">
          <EnlaceRequiereLogin
            href={`/historias/${historia.id}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 hover:scale-105 transform transition-all duration-200"
          >
            Ver Historia
          </EnlaceRequiereLogin>
        </div>
      </div>

      {showDelete && (
        <div className="hidden sm:block absolute right-3 bottom-3 z-30">
          <button onClick={() => setConfirmModal({ open: true })} className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100">Eliminar</button>
        </div>
      )}

      {confirmModal.open && (
        <Modal show={confirmModal.open} onClose={() => setConfirmModal({ open: false })} maxWidth="md">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Eliminar historia</h3>
            <p className="text-sm text-gray-600 mb-4">¿Deseás eliminar esta historia de éxito? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal({ open: false })} className="px-4 py-2 rounded bg-white border text-sm">No, volver</button>
              <button onClick={async () => {
                try {
                  const url = route('historias.destroy', historia.id);
                  const resp = await axios.delete(url);
                  if (resp && resp.data) {
                    try { sessionStorage.setItem('flash_message', JSON.stringify({ type: 'success', message: 'Historia eliminada con éxito' })); } catch (e) {}
                    if (typeof onRemove === 'function') onRemove(historia.id);
                    setConfirmModal({ open: false });
                  }
                } catch (err) {
                  console.error('Error deleting historia', err);
                  setConfirmModal({ open: false });
                  alert('No se pudo eliminar la historia. Intenta de nuevo.');
                }
              }} className="px-4 py-2 rounded bg-red-600 text-white font-semibold">Sí, eliminar</button>
            </div>
          </div>
        </Modal>
      )}

    </article>
  );
}
