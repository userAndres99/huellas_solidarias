import React, { useEffect, useMemo, useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Select from 'react-select';
import debounce from 'lodash.debounce';

const opcionesTipo = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Perro', label: 'Perro' },
  { value: 'Gato', label: 'Gato' },
  { value: 'Otro', label: 'Otro' },
];

const opcionesSituacion = [
  { value: '', label: 'Todas las situaciones' },
  { value: 'Perdido', label: 'Perdido' },
  { value: 'Encontrado', label: 'Encontrado' },
  { value: 'Adopcion', label: 'Adopcion' },
];

const opcionesOrden = [
  { value: 'reciente', label: 'Más reciente'},
  { value: 'antigua', label: 'Fecha más antigua'}
];

function Filtros({ filtros, setFiltros }) {
  const handleCiudadChange = useMemo(
    () =>
      debounce(value => {
        setFiltros(prev => ({ ...prev, ciudad: value }));
      }, 300),
    [setFiltros]
  );

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="w-48">
        <Select
          options={opcionesTipo}
          value={opcionesTipo.find(o => o.value === filtros.tipo)}
          onChange={option => setFiltros(prev => ({ ...prev, tipo: option.value }))}
        />
      </div>

      <div className="w-48">
        <Select
          options={opcionesSituacion} // ✅ corregido
          value={opcionesSituacion.find(o => o.value === filtros.situacion)}
          onChange={option => setFiltros(prev => ({ ...prev, situacion: option.value }))}
        />
      </div>
      <div className='w-48'>
        <Select
          options={opcionesOrden}
          value={opcionesOrden.find(o => o.value === filtros.ordenFecha)}
          onChange={option => setFiltros(prev => ({...prev, ordenFecha: option.value}))}
        />
      </div>

      <input
        type="text"
        placeholder="Ciudad"
        defaultValue={filtros.ciudad}
        onChange={e => handleCiudadChange(e.target.value)}
        className="border p-2 rounded w-48" // ✅ corregido
      />
    </div>
  );
}

export default function Index(props) {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ tipo: '', ciudad: '', situacion: '', ordenFecha: 'reciente' });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const obtenerCasos = async () => {
      try {
        const res = await fetch('/casos/json', {
          headers: { Accept: 'application/json' },
          signal,
        });
        if (!res.ok) throw new Error('Error en la respuesta del servidor');

        const data = await res.json();
        setCasos(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error al obtener los casos:', error);
          setCasos([]);
        }
      } finally {
        setLoading(false);
      }
    };

    obtenerCasos();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin-slow"></div>
      </div>
    );
  }

  // ✅ Filtrar casos según filtros
  const casosFiltrados = casos.filter(c => {
    return (
      (filtros.tipo === '' || c.tipoAnimal === filtros.tipo) &&
      (filtros.ciudad === '' || c.ciudad.toLowerCase().includes(filtros.ciudad.toLowerCase())) &&
      (filtros.situacion === '' || c.situacion === filtros.situacion)
    );
  })
  .sort((a,b) => {
    const fechaA = new Date(a.fechaPublicacion);
    const fechaB = new Date(b.fechaPublicacion);
    if(filtros.ordenFecha === 'reciente'){
      return fechaB - fechaA; // más reciente primero
    }else{
      return fechaA - fechaB; // mas antigua primero
    }
  });

  return (
    <AuthenticatedLayout
      {...props}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicaciones</h2>}
    >
      <Head title="Publicaciones" />

      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Publicaciones</h1>

        <Filtros filtros={filtros} setFiltros={setFiltros} />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {casosFiltrados.map(c => (
            <div key={c.id} className="bg-white shadow rounded overflow-hidden">
              <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {c.fotoAnimal ? (
                  <img
                    src={c.fotoAnimal}
                    alt={c.tipoAnimal || 'Foto'}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-500">Sin imagen</div>
                )}
              </div>

              <div className="p-3">
                <div className="text-sm text-gray-500 mb-1">{c.tipoAnimal || 'No especificado'}</div>
                <div className="font-medium line-clamp-2 mb-2">{c.descripcion}</div>
                <div className="text-sm text-gray-600 mb-2">{c.ciudad} · {c.situacion}</div>

                <div className="flex items-center justify-between">
                  <Link href={`/casos/${c.id}`} className="text-blue-600">Ver detalle</Link>
                  {c.latitud && c.longitud && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${c.latitud}&mlon=${c.longitud}#map=16/${c.latitud}/${c.longitud}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-600"
                    >
                      Ver mapa
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
