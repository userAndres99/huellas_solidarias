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
  { value: 'Abandonado', label: 'Abandonado' },
  { value: 'Adopcion', label: 'Adopcion' },
];

const opcionesOrden = [
  { value: 'reciente', label: 'Más reciente'},
  { value: 'antigua', label: 'Fecha más antigua'}
];

const opcionesSexo  = [
  { value: '', label: 'Cualquier sexo'},
  { value: 'Macho', label: 'Macho'},
  { value: 'Hembra', label: 'Hembra'}
];

const opcionesTamanio = [
  { value: '', label: 'Cualquier tamaño'},
  { value: 'Chico', label: 'Chico'},
  { value: 'Mediano', label: 'Mediano'},
  { value: 'Grande', label: 'Grande'}
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
          options={opcionesSituacion} 
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

      <div className='w-48'>
        <Select
        options={opcionesSexo}
        value={opcionesSexo.find(o => o.value === filtros.sexo)}
        onChange={option => setFiltros(prev => ({ ...prev, sexo: option.value}))}
        />
      </div>
      <div className='w-48'>
        <Select
        options={opcionesTamanio}
        value={opcionesTamanio.find(o => o.value === filtros.tamanio)}
        onChange={option => setFiltros(prev => ({ ...prev, tamanio: option.value}))}
        />
      </div>

      <input
        type="text"
        placeholder="Ciudad"
        defaultValue={filtros.ciudad}
        onChange={e => handleCiudadChange(e.target.value)}
        className="border p-2 rounded w-48" 
      />
    </div>
  );
}

function getInitials(name = '') {
  return name
    .split(' ')
    .map(s => s[0] || '')
    .filter(Boolean)
    .slice(0,2)
    .join('')
    .toUpperCase();
}

function Pagination({ meta, links, onPage }) {
  if (!meta) return null;

  const current = meta.current_page;
  const last = meta.last_page;

  // rango de paginas a mostrar 
  const delta = 2;
  let start = Math.max(1, current - delta);
  let end = Math.min(last, current + delta);

  if (current <= 2) end = Math.min(last, 5);
  if (current >= last - 1) start = Math.max(1, last - 4);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between mt-4 mb-4">
      <div className="text-sm text-gray-600">
        Mostrando página {meta.current_page} de {meta.last_page} · {meta.total} resultados
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(1)}
          disabled={current === 1}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          « Primero
        </button>

        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          ‹ Anterior
        </button>

        {pages[0] > 1 && <span className="px-2">…</span>}

        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`px-3 py-1 border rounded ${p === current ? 'bg-gray-200 font-semibold' : ''}`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length -1] < last && <span className="px-2">…</span>}

        <button
          onClick={() => onPage(current + 1)}
          disabled={current === last}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Siguiente ›
        </button>

        <button
          onClick={() => onPage(last)}
          disabled={current === last}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Último »
        </button>
      </div>
    </div>
  );
}

export default function Index(props) {
  const [casos, setCasos] = useState([]); // array de items 
  const [meta, setMeta] = useState(null); 
  const [links, setLinks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ tipo: '', ciudad: '', situacion: '', ordenFecha: 'reciente', sexo: '', tamanio: '' });
  const [page, setPage] = useState(1);
  const [perPage] = useState(9);

  // cuando cambian filtros, volver a la primera pagina
  useEffect(() => {
    setPage(1);
  }, [filtros.tipo, filtros.ciudad, filtros.situacion, filtros.sexo, filtros.tamanio, filtros.ordenFecha]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const obtenerCasos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('per_page', perPage);

        //filtros si existen (para que el backend los aplique)
        if (filtros.tipo) params.append('tipo', filtros.tipo);
        if (filtros.ciudad) params.append('ciudad', filtros.ciudad);
        if (filtros.situacion) params.append('situacion', filtros.situacion);
        if (filtros.sexo) params.append('sexo', filtros.sexo);
        if (filtros.tamanio) params.append('tamano', filtros.tamanio);
        if (filtros.ordenFecha) params.append('ordenFecha', filtros.ordenFecha);

        const url = `/casos/json?${params.toString()}`;

        const res = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal,
        });
        if (!res.ok) throw new Error('Error en la respuesta del servidor');

        const data = await res.json();
        setCasos(data.data || data); // fallback si cambia estructura
        setMeta(data);
        setLinks(data.links || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error al obtener los casos:', error);
          setCasos([]);
          setMeta(null);
          setLinks([]);
        }
      } finally {
        setLoading(false);
      }
    };

    obtenerCasos();
    return () => controller.abort();
  }, [page, filtros, perPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin-slow"></div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout
      {...props}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicaciones</h2>}
    >
      <Head title="Publicaciones" />

      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Publicaciones</h1>

        <Filtros filtros={filtros} setFiltros={setFiltros} />

        {/* PAGINACIÓN ARRIBA */}
        <Pagination
          meta={meta}
          links={links}
          onPage={(p) => {
            if (p < 1) p = 1;
            if (meta && p > meta.last_page) p = meta.last_page;
            setPage(p);
            window.scrollTo({ top: 200, behavior: 'smooth' });
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {casos.map(c => {
            const usuario = c.usuario || c.user || null;
            const userName = usuario?.name ?? 'Anónimo';
            const userPhoto = usuario?.profile_photo_url ?? null;

            return (
              <div key={c.id} className="bg-white shadow rounded overflow-hidden">
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
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

                  <div className="absolute top-2 left-2 flex items-center gap-2 bg-white/90 px-2 py-1 rounded-full shadow-sm">
                    <a href={usuario ? `/users/${usuario.id}` : '#'} className="flex items-center gap-2">
                      {userPhoto ? (
                        <img
                          src={userPhoto}
                          alt={userName}
                          className="w-9 h-9 rounded-full object-cover border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-medium border text-sm bg-gray-100">
                          {getInitials(userName)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-800">{userName}</span>
                    </a>
                  </div>
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
            );
          })}
        </div>

        {/* PAGINACIÓN ABAJO*/}
        <Pagination
          meta={meta}
          links={links}
          onPage={(p) => {
            if (p < 1) p = 1;
            if (meta && p > meta.last_page) p = meta.last_page;
            setPage(p);
            window.scrollTo({ top: 200, behavior: 'smooth' });
          }}
        />
      </div>
    </AuthenticatedLayout>
  );
}