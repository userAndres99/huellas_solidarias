import React, { useState } from 'react';
import MapaInteractivo from '@/Components/MapaInteractivo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import FiltroCiudad from '@/Components/FiltroCiudad';

export default function MapaPage() {
    const [center , setCenter] = useState([-38.9339, -67.9900]);


    const handleCiudadSelect =  (ciudad) => {
            //Coords por ciudad

           const coords = {
      cipolletti: [-38.9339, -67.9900],
      neuquen: [-38.9516, -68.0591],
      "general roca": [-39.0333, -67.5833],
    };

    // si no hay ciudad seleccionada, vuelve al centro inicial
    setCenter(coords[ciudad] || [-38.9339, -67.9900]);
    }


    
    return (
      <AuthenticatedLayout
      header={ <h2 className='text-xl font-semibold leading-tight text-gray-800'>Mapa</h2>}
      >
        <Head title='Mapa de casos'/>
        <div className='py-6'>
            <FiltroCiudad onCiudadSelect={handleCiudadSelect}/>
            <div className='mx-auto max-w-3xl sm:px-6 lg:px-8'>
                <div className='bg-white shadow-sm sm:rounded-lg p-6'>
                    <MapaInteractivo center={center} />
                </div>
            </div>
        </div>
        
      </AuthenticatedLayout>
    );
}
