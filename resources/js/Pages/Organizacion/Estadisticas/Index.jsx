import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

import MapaInteractivo from '@/Components/MapaInteractivo';
import FiltroCiudad from '@/Components/FiltroCiudad';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Index(props) {
  const initialCounts = props.counts || usePage().props.counts || { activo: 0, finalizado: 0, cancelado: 0 };
  const initialTipo = props.selectedTipo ?? usePage().props.selectedTipo ?? '';
  const initialSituacion = props.selectedSituacion ?? usePage().props.selectedSituacion ?? '';

  const [counts, setCounts] = useState(initialCounts);
  const [selectedTipo, setSelectedTipo] = useState(initialTipo);
  const [selectedSituacion, setSelectedSituacion] = useState(initialSituacion);
  // center for the interactive map (lat, lon)
  const [center, setCenter] = useState([-38.9339, -67.9900]);
  const [selectedCiudad, setSelectedCiudad] = useState('');

  // Georef API para resolver etiquetas de ciudad similares a como se guardan en `casos.ciudad`
  const GEOREF_BASE = 'https://apis.datos.gob.ar/georef/api/v2.0';

  const handleTipoChange = async (e) => {
    const val = e.target.value;
    setSelectedTipo(val);

  // Construir URL del endpoint JSON 
  const base = route('organizacion.estadisticas.data');
  const params = [];
  if (val) params.push(`tipo=${encodeURIComponent(val)}`);
  if (selectedSituacion) params.push(`situacion=${encodeURIComponent(selectedSituacion)}`);
  const url = params.length ? `${base}?${params.join('&')}` : base;

    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();
      if (json && json.counts) {
        setCounts(json.counts);
      }
    } catch (err) {
      console.error('Error fetching stats data:', err);
    }
  };

  const handleSituacionChange = async (e) => {
    const val = e.target.value;
    setSelectedSituacion(val);

    // Construir URL con ambos filtros
    const base = route('organizacion.estadisticas.data');
    const params = [];
    if (selectedTipo) params.push(`tipo=${encodeURIComponent(selectedTipo)}`);
    if (val) params.push(`situacion=${encodeURIComponent(val)}`);
    const url = params.length ? `${base}?${params.join('&')}` : base;

    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();
      if (json && json.counts) {
        setCounts(json.counts);
      }
    } catch (err) {
      console.error('Error fetching stats data:', err);
    }
  };

  // recibe lat y lon desde el buscador de ciudad
  const handleCiudadSelect = (coords) => {
    if (coords && coords.length === 2) {
      setCenter(coords);
      // obtener la etiqueta de ciudad y actualizar estadisticas
      (async () => {
        const [lat, lon] = coords.map(Number);
        const label = await reverseGeocodeToLabel(lat, lon);
        setSelectedCiudad(label || '');
        // fetch para actualizar counts
        fetchCounts(selectedTipo, selectedSituacion, label);
      })();
    } else {
      setCenter([-38.9339, -67.9900]);
    }
  };

  // Rreverse geocode para obtener etiqueta ciudad similar a como se guarda en `casos.ciudad`
  const reverseGeocodeToLabel = async (lat, lon) => {
    try {
      // Nominatim usa OpenStreetMap para la geocodificación inversa
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&accept-language=es`;

      const nomRes = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'HuellasSolidarias/1.0 (contacto@example.com)' },
      });
      if (nomRes.ok) {
        const nomJson = await nomRes.json();
        const addr = nomJson.address || {};
        const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        if (cityName) {
          try {
            const params = new URLSearchParams({
              nombre: cityName,
              max: '5',
              campos: 'nombre,centroide,provincia,id',
              formato: 'json',
            });

            const geoRes = await fetch(`${GEOREF_BASE}/localidades?${params.toString()}`);
            if (geoRes.ok) {
              const geoJson = await geoRes.json();
              const localidades = geoJson.localidades || [];

              let chosen = null;
              if (localidades.length === 1) {
                chosen = localidades[0];
              } else if (localidades.length > 1) {
                let minDist = Infinity;
                for (const loc of localidades) {
                  const centro = loc.centroide || {};
                  if (centro.lat !== undefined && centro.lon !== undefined) {
                    const d = Math.hypot(Number(centro.lat) - Number(lat), Number(centro.lon) - Number(lon));
                    if (d < minDist) {
                      minDist = d;
                      chosen = loc;
                    }
                  }
                }
                if (!chosen) chosen = localidades[0];
              }

              if (chosen) {
                const nombre = chosen.nombre || cityName;
                const prov = chosen.provincia?.nombre || '';
                const labelParts = [nombre];
                if (prov) labelParts.push(prov);
                return labelParts.join(' - ');
              }
            }
          } catch (e) {
            console.warn('Georef lookup failed:', e);
          }
          // fallback to the name from nominatim
          return cityName;
        }
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
    return '';
  };

  // fetch counts para los filtros
  const fetchCounts = async (tipoVal, situacionVal, ciudadVal) => {
    const base = route('organizacion.estadisticas.data');
    const params = [];
    if (tipoVal) params.push(`tipo=${encodeURIComponent(tipoVal)}`);
    if (situacionVal) params.push(`situacion=${encodeURIComponent(situacionVal)}`);
    if (ciudadVal) params.push(`ciudad=${encodeURIComponent(ciudadVal)}`);
    const url = params.length ? `${base}?${params.join('&')}` : base;

    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();
      if (json && json.counts) {
        setCounts(json.counts);
      }
    } catch (err) {
      console.error('Error fetching stats data:', err);
    }
  };

  const data = {
    labels: ['Activos', 'Finalizados', 'Cancelados'],
    datasets: [
      {
        label: 'Casos',
        data: [counts.activo || 0, counts.finalizado || 0, counts.cancelado || 0],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
        hoverBackgroundColor: ['#60a5fa', '#34d399', '#f87171'],
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Estadísticas</h2>}
    >
      <Head title="Estadísticas" />

      <div className="py-6">
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-lg font-semibold mb-4">Resumen de casos</h3>

            {/* Buscador de ciudades centered */}
            <div className="mb-4 flex justify-center">
              <div className="w-full sm:w-2/3">
                <FiltroCiudad onCiudadSelect={handleCiudadSelect} />
              </div>
            </div>

            {/* filtros de tipo y situacion arriba, aligned left */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Filtrar por tipo:</label>
                <select value={selectedTipo} onChange={handleTipoChange} className="border rounded px-2 py-1 text-sm pr-8 w-36 appearance-none bg-white">
                  <option value="">Todos</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Otro">Otro</option>
                </select>

                <label className="text-sm text-gray-600 ml-4">Situación:</label>
                <select value={selectedSituacion} onChange={handleSituacionChange} className="border rounded px-2 py-1 text-sm pr-8 w-36 appearance-none bg-white">
                  <option value="">Todas</option>
                  <option value="Adopcion">Adopcion</option>
                  <option value="Abandonado">Abandonado</option>
                  <option value="Perdido">Perdido</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">Mostrando: {selectedTipo ? selectedTipo : 'Todos'}</div>
            </div>

            {/* Layout: map on left, stats on right */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gray-50 rounded p-2">
                <div className="w-full h-96">
                  <MapaInteractivo center={center} />
                </div>
              </div>

              <div className="md:col-span-1 bg-white">
                <div className="p-4">
                  <div className="w-full h-56">
                    <Pie data={data} options={options} />
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded border">
                      <div className="text-sm text-gray-500">Activos</div>
                      <div className="text-2xl font-bold text-blue-600">{counts.activo}</div>
                    </div>
                    <div className="p-4 rounded border">
                      <div className="text-sm text-gray-500">Finalizados</div>
                      <div className="text-2xl font-bold text-green-600">{counts.finalizado}</div>
                    </div>
                    <div className="p-4 rounded border">
                      <div className="text-sm text-gray-500">Cancelados</div>
                      <div className="text-2xl font-bold text-red-600">{counts.cancelado}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
