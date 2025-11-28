import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import LoadingImagenes from '@/Components/LoadingImagenes';

export default function TarjetaHistorias({ historia }) {
  const usuario = historia.usuario || historia.user || null;

  return (
    <article key={historia.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="grid grid-cols-2 gap-1">
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
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{historia.titulo}</h3>
        <p className="text-gray-600 mb-3 line-clamp-3">{historia.descripcion}</p>
        {historia.testimonio && (
          <blockquote className="italic text-blue-700 mb-4">"{historia.testimonio}"</blockquote>
        )}

        <div className="mt-auto flex justify-end">
          <EnlaceRequiereLogin
            href={`/historias/${historia.id}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 hover:scale-105 transform transition-all duration-200"
          >
            Ver Historia
          </EnlaceRequiereLogin>
        </div>
      </div>
    </article>
  );
}
