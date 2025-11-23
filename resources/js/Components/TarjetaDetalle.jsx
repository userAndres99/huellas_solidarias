import React from 'react';
import MapaInteractivo from '@/Components/MapaInteractivo';
import LoadingImagenes from '@/Components/LoadingImagenes';

export default function TarjetaDetalle({ caso }) {
  if (!caso) return null;

  return (
    <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="relative h-96 md:h-[520px] bg-gray-100">
        {caso.fotoAnimal ? (
          <LoadingImagenes
            src={caso.fotoAnimal}
            alt={caso.tipoAnimal || 'Foto'}
            wrapperClass="w-full h-full"
            imgClass="object-cover w-full h-full"
            placeholderText={null}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-500">Sin imagen</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="absolute left-6 bottom-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold drop-shadow">{caso.tipoAnimal || 'Animal'}</h1>
          <p className="text-sm md:text-base mt-1 drop-shadow">{caso.ciudad ? `${caso.ciudad} · ` : ''}{new Date(caso.fechaPublicacion || caso.created_at).toLocaleString()}</p>
        </div>

        <div className="absolute right-6 top-6 flex items-center gap-2">
          <span className="px-3 py-1 bg-white/90 rounded-full text-sm text-gray-800 font-semibold">{caso.situacion || 'Publicación'}</span>
          <span className="px-3 py-1 bg-white/90 rounded-full text-sm text-gray-800">{caso.tipoAnimal || 'Animal'}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:gap-6">
          <div className="w-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Descripción</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{caso.descripcion}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4 mx-auto w-full max-w-2xl">
              <div className="flex flex-col items-center text-center">
                <div><strong className="text-gray-800">Teléfono:</strong> {caso.telefonoContacto || 'No disponible'}</div>
                <div className="mt-2"><strong className="text-gray-800">Publicado:</strong> {new Date(caso.fechaPublicacion || caso.created_at).toLocaleString()}</div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div><strong className="text-gray-800">Sexo:</strong> {caso.sexo || '—'}</div>
                <div className="mt-2"><strong className="text-gray-800">Tamaño:</strong> {caso.tamano || '—'}</div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div><strong className="text-gray-800">Ciudad:</strong> {caso.ciudad || '—'}</div>
                <div className="mt-2"><strong className="text-gray-800">Situación:</strong> {caso.situacion || '—'}</div>
              </div>
            </div>

            {caso.latitud && caso.longitud && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Ubicación</h3>
                <div className="flex justify-center">
                  <div className="h-64 md:h-48 rounded overflow-hidden w-full max-w-2xl">
                    <MapaInteractivo
                      readOnly={true}
                      center={[Number(caso.latitud), Number(caso.longitud)]}
                      initialPosition={[Number(caso.latitud), Number(caso.longitud)]}
                      marker={true}
                      tipoAnimal={caso.tipoAnimal}
                      showMarkers={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
