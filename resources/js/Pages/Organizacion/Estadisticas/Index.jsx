import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

import MapaInteractivo from '@/Components/MapaInteractivo';
import FiltroCiudad from '@/Components/FiltroCiudad';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function Index(props) {
  const initialCounts = props.counts || usePage().props.counts || { activo: 0, finalizado: 0, cancelado: 0 };
  const initialTipo = props.selectedTipo ?? usePage().props.selectedTipo ?? '';
  const initialSituacion = props.selectedSituacion ?? usePage().props.selectedSituacion ?? '';

  const [counts, setCounts] = useState(initialCounts);
  const [selectedTipo, setSelectedTipo] = useState(initialTipo);
  const [selectedSituacion, setSelectedSituacion] = useState(initialSituacion);
  // centro para el mapa interactivo (lat, lon)
  const [center, setCenter] = useState([-38.9339, -67.9900]);
  const [selectedCiudad, setSelectedCiudad] = useState('');
  const [yearly, setYearly] = useState([]);
  const [period, setPeriod] = useState('year'); // usamos 'year' | 'month' | 'day'


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
  const handleCiudadSelect = (option) => {
    if (!option) {
      setCenter([-38.9339, -67.9900]);
      setSelectedCiudad('');
      fetchCounts(selectedTipo, selectedSituacion, '');
      return;
    }

    const centroide = option.data?.centroide;
    const lat = centroide?.lat ?? null;
    const lon = centroide?.lon ?? null;

    if (lat !== null && lon !== null) {
      const coords = [Number(lat), Number(lon)];
      setCenter(coords);
      const label = option.label || '';
      setSelectedCiudad(label);
      fetchCounts(selectedTipo, selectedSituacion, label);
    }
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
          fetchYearly(tipoVal, situacionVal, ciudadVal, period);
        }
    } catch (err) {
      console.error('Error fetching stats data:', err);
    }
  };

  const fetchYearly = async (tipoVal, situacionVal, ciudadVal, periodParam = 'year') => {
    const base = route('organizacion.estadisticas.years');
    const params = [];
    if (tipoVal) params.push(`tipo=${encodeURIComponent(tipoVal)}`);
    if (situacionVal) params.push(`situacion=${encodeURIComponent(situacionVal)}`);
    if (ciudadVal) params.push(`ciudad=${encodeURIComponent(ciudadVal)}`);
    if (periodParam) params.push(`period=${encodeURIComponent(periodParam)}`);
    const url = params.length ? `${base}?${params.join('&')}` : base;

    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();
      if (json && json.series) {
        setYearly(json.series);
      }
    } catch (err) {
      console.error('Error fetching yearly stats:', err);
    }
  };


  React.useEffect(() => {
    fetchYearly(selectedTipo, selectedSituacion, selectedCiudad, period);
  }, []);

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

  const lineData = {
    labels: yearly.map((r) => r.period),
    datasets: [
      {
        label: period === 'year' ? 'Casos por año' : period === 'month' ? 'Casos por mes' : period === 'week' ? 'Casos por semana' : 'Casos por día',
        data: yearly.map((r) => r.total),
        fill: false,
        borderColor: '#3b82f6',
        backgroundColor: '#60a5fa',
        tension: 0.2,
      },
    ],
  };

  const lineOptions = {
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: period === 'year' ? 'Casos por año' : period === 'month' ? 'Casos por mes' : period === 'week' ? 'Casos por semana' : 'Casos por día' },
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: period === 'year' ? 'Año' : period === 'month' ? 'Mes' : period === 'week' ? 'Semana (inicio)' : 'Día' },
        ticks: {
          callback: function (value, index, ticks) {
            const label = this.getLabelForValue ? this.getLabelForValue(value) : value;
            try {
              return formatPeriodLabel(String(label), period);
            } catch (e) {
              return String(label);
            }
          }
        }
      },
      y: { title: { display: true, text: 'Cantidad de casos' }, beginAtZero: true },
    },
  };

  // Funciones auxiliares para formatear etiquetas
  const formatPeriodLabel = (label, periodType) => {
    const monthOptions = { month: 'short', year: 'numeric' };
    const dayOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    if (periodType === 'year') return label;
    if (periodType === 'month') {
      const date = new Date(label + '-01');
      if (isNaN(date)) return label;
      return date.toLocaleDateString('es-ES', monthOptions).replace('.', '');
    }
    if (periodType === 'week') {
      const m = label.match(/(\d{4})-W(\d{1,2})/);
      if (m) {
        const y = Number(m[1]);
        const w = Number(m[2]);
        const start = isoWeekToDate(y, w); 
        return start.toLocaleDateString('es-ES', dayOptions).replace('.', '');
      }
      // fallback: intentar parsear como fecha
      const d = new Date(label);
      if (!isNaN(d)) return d.toLocaleDateString('es-ES', dayOptions).replace('.', '');
      return label;
    }
    // dia
    if (periodType === 'day') {
      const d = new Date(label);
      if (isNaN(d)) return label;
      return d.toLocaleDateString('es-ES', dayOptions).replace('.', '');
    }
    return label;
  };

  // Convierte semana 
  const isoWeekToDate = (isoYear, isoWeek) => {
    const simple = new Date(Date.UTC(isoYear, 0, 1 + (isoWeek - 1) * 7));
    const dow = simple.getUTCDay();
    const ISOweekStart = new Date(simple);
    const diff = (dow <= 4 ? dow - 1 : dow - 8); 
    ISOweekStart.setUTCDate(simple.getUTCDate() - diff);
    return ISOweekStart;
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

      <div className="py-6">
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
          <div className="bg-white p-4 rounded-2xl shadow">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold">Evolución de casos</h4>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Granularidad:</label>
                  <select value={period} onChange={(e) => { setPeriod(e.target.value); fetchYearly(selectedTipo, selectedSituacion, selectedCiudad, e.target.value); }} className="border rounded px-3 py-1 text-sm bg-white pr-8 w-40 appearance-none">
                    <option value="year">Año</option>
                    <option value="month">Mes</option>
                    <option value="week">Semana</option>
                    <option value="day">Día</option>
                  </select>
                </div>
              </div>
              <div className="w-full h-72">
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </AuthenticatedLayout>
  );
}
