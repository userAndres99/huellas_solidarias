import React, { useState } from 'react';
import MapaInteractivo from '@/Components/MapaInteractivo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import FiltroCiudad from '@/Components/FiltroCiudad';

export default function MapaPage() {
  // posición inicial 
  const [center, setCenter] = useState([-38.9339, -67.9900]);

  // recibe lat y lon
  const handleCiudadSelect = (coords) => {
    if (coords && coords.length === 2) {
      setCenter(coords);
    } else {
      //default
      setCenter([-38.9339, -67.9900]);
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Mapa
        </h2>
      }
    >
      <Head title="Mapa de casos" />

      <div className="py-6">
        {/* Buscador de ciudades */}
        <FiltroCiudad onCiudadSelect={handleCiudadSelect} />

        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm sm:rounded-lg p-6">
            {/* Mapa */}
            <MapaInteractivo center={center} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}