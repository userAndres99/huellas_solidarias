import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import MapaInteractivo from '../../Components/MapaInteractivo';

export default function Show({ initialId }) {
  const id = initialId || window.location.pathname.split('/').pop();
  const [caso, setCaso] = useState(undefined);

  useEffect(() => {
    fetch(`/casos/json/${id}`, { headers: { Accept: 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setCaso)
      .catch(() => setCaso(null));
  }, [id]);

  if (caso === undefined) return <div className="p-4">Cargando...</div>;
  if (caso === null) return <div className="p-4">No encontrado</div>;

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Link href="/casos" className="text-blue-600 mb-4 inline-block">← Volver</Link>

      <div className="bg-white shadow rounded overflow-hidden">
        {caso.fotoAnimal ? (
          <img src={caso.fotoAnimal} alt={caso.tipoAnimal} className="w-full h-96 object-cover" />
        ) : (
          <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-gray-500">Sin imagen</div>
        )}

        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">{caso.tipoAnimal || 'Animal'}</h2>
          <p className="text-gray-700 mb-2">{caso.descripcion}</p>

          <div className="text-sm text-gray-600 mb-2 space-y-1">
            <div><strong>Situación:</strong> {caso.situacion}</div>
            <div><strong>Ciudad:</strong> {caso.ciudad}</div>
            <div><strong>Teléfono:</strong> {caso.telefonoContacto || 'No disponible'}</div>
            <div><strong>Publicado:</strong> {new Date(caso.fechaPublicacion).toLocaleString()}</div>
          </div>

          {caso.latitud && caso.longitud && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Ubicación</h3>
              <MapaInteractivo
                readOnly={true}
                initialPosition={[Number(caso.latitud), Number(caso.longitud)]}
                marker={true}
                tipoAnimal={caso.tipoAnimal}
                showMarkers={false} // opcional, para ocultar otros marcadores
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}