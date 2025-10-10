import React from 'react';
import MapaInteractivo from '@/Components/MapaInteractivo';

export default function MapaPage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Mapa de casos</h1>
            <MapaInteractivo />
        </div>
    );
}
