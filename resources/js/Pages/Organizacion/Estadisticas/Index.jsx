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

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Index(props) {
  const initialCounts = props.counts || usePage().props.counts || { activo: 0, finalizado: 0, cancelado: 0 };
  const initialTipo = props.selectedTipo ?? usePage().props.selectedTipo ?? '';
  const initialSituacion = props.selectedSituacion ?? usePage().props.selectedSituacion ?? '';

  const [counts, setCounts] = useState(initialCounts);
  const [selectedTipo, setSelectedTipo] = useState(initialTipo);
  const [selectedSituacion, setSelectedSituacion] = useState(initialSituacion);

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
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-lg font-semibold mb-4">Resumen de casos</h3>

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

            <div className="w-full h-96">
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
    </AuthenticatedLayout>
  );
}
