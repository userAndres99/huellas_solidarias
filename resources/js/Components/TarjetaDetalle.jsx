import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import Usuario from '@/Components/Usuario';
import EstadoBadge from '@/Components/EstadoBadge';
import MapaInteractivo from '@/Components/MapaInteractivo';
import LoadingImagenes from '@/Components/LoadingImagenes';

// ICONOS
import { 
  FiPhone,
  FiClock,
  FiUser,
  FiMaximize,
  FiMapPin,
  FiAlertTriangle
} from "react-icons/fi";
import { FaExclamationTriangle } from 'react-icons/fa';

export default function TarjetaDetalle({ caso }) {
  if (!caso) return null;

  const usuario = caso.usuario || caso.user || null;
  const userName = usuario?.name ?? 'Anónimo';
  const userPhoto = usuario?.profile_photo_url ?? null;
  const [mapCenter, setMapCenter] = useState(null);

  return (
    <article className="bg-white rounded-2xl shadow-lg overflow-hidden">

      {/* Imagen de portada */}
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
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-500">
            Sin imagen
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {usuario && (
          <Usuario usuario={usuario} caso={caso} userPhoto={userPhoto} userName={userName} />
        )}

        {/* Título y ciudad */}
        <div className="absolute left-6 bottom-20 text-white">
          <h1 className="text-2xl md:text-3xl font-bold drop-shadow">
            {caso.tipoAnimal || 'Animal'}
          </h1>
          <p className="text-sm md:text-base mt-1 drop-shadow flex items-center gap-1">
            {caso.ciudad && (
              <>
                <FiMapPin className="text-white/90" />
                {caso.ciudad} ·
              </>
            )}
            {new Date(caso.fechaPublicacion || caso.created_at).toLocaleString()}
          </p>
        </div>

        {/* Badges */}
        <div className="absolute right-6 top-6 flex items-center gap-2">
          <EstadoBadge situacion={caso.situacion} />

          <span className="px-3 py-1 bg-white/90 rounded-full text-sm text-gray-800 flex items-center gap-1">
            <FiMapPin className="text-emerald-600" /> {caso.tipoAnimal || 'Animal'}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        <div className="flex flex-col md:gap-6">
          <div className="w-full">

            {/* Descripción*/}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Descripción</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{caso.descripcion}</p>
              </div>
            </div>

            {/* Separador  */}
            <div className="max-w-2xl mx-auto">
              <hr className="border-t border-gray-200 my-6" />

              {/*tarjetas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 w-full">

              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <FiPhone className="text-emerald-600" />
                  <strong className="text-gray-800">Teléfono</strong>
                </div>
                <div className="text-gray-700 font-medium">{caso.telefonoContacto || 'No disponible'}</div>
                <div className="w-full border-t mt-3 pt-3 text-sm text-gray-500 flex items-center justify-center gap-2">
                  <FiClock /> <strong className="text-gray-800">Publicado:</strong> <span className="font-medium text-gray-700">{new Date(caso.fechaPublicacion || caso.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <FiUser className="text-blue-600" />
                  <strong className="text-gray-800">Sexo</strong>
                </div>
                <div className="text-gray-700 font-medium">{caso.sexo || '—'}</div>
                <div className="w-full border-t mt-3 pt-3 text-sm text-gray-500 flex items-center justify-center gap-2">
                  <FiMaximize /> <strong className="text-gray-800">Tamaño:</strong> <span className="font-medium text-gray-700">{caso.tamano || '—'}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <FiMapPin className="text-rose-600" />
                  <strong className="text-gray-800">Ciudad</strong>
                </div>
                <div className="text-gray-700 font-medium">{caso.ciudad || '—'}</div>
                <div className="w-full border-t mt-3 pt-3 text-sm text-gray-500 flex items-center justify-center gap-2">
                  <strong className="text-gray-800">Situación:</strong>
                  <EstadoBadge situacion={caso.situacion} />
                </div>
              </div>

              </div>
            </div>

            {/* UBICACIÓN*/}
            {caso.latitud && caso.longitud && (
              <div className="mt-4 max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="p-4 border-b flex items-center">
                  <h3 className="font-medium mb-0 flex items-center gap-2 text-gray-800">
                    <FiMapPin className="text-emerald-600" />
                    Ubicación
                  </h3>
                  {/* Centrar*/}
                  <div className="ml-auto">
                    <button
                      type="button"
                      onClick={() => setMapCenter([Number(caso.latitud), Number(caso.longitud)])}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md shadow-sm"
                    >
                      Centrar
                    </button>
                  </div>
                </div>
                <div className="h-64 md:h-48">
                  <MapaInteractivo
                    readOnly={true}
                    center={mapCenter}
                    initialPosition={[Number(caso.latitud), Number(caso.longitud)]}
                    marker={true}
                    tipoAnimal={caso.tipoAnimal}
                    showMarkers={false}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </article>
  );
}