import React, { useEffect, useMemo, useState, useRef } from 'react';
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

// Componente LazyImage: (evita usar "loading=\"lazy\"" nativo y controla cuando renderizar la imagen)
// despues lo separamos en un componente aparte para que no haya tanto codigo aca
function LazyImage({ src, alt = '', className = '', rootMargin = '200px', threshold = 0.01, priority = false }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={`w-full h-full ${className}`}>
      {inView ? (
        // cargamos la imagen con loading="eager" cuando sabemos que está en pantalla
        <img
          src={src}
          alt={alt}
          className="object-cover w-full h-full"
          loading="eager"
          decoding="async"
          {...(priority ? { fetchPriority: 'high' } : {})}
        />
      ) : (
        <div className="bg-gray-100 w-full h-full" />
      )}
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
              <article key={c.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                <div className="relative h-56 md:h-48 lg:h-56">
                  {c.fotoAnimal ? (
                    <LazyImage src={c.fotoAnimal} alt={c.tipoAnimal || 'Foto'} className="h-full w-full" priority={page === 1} />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-500">Sin imagen</div>
                  )}

                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-gray-800 shadow">{c.situacion || 'Publicación'}</span>
                  </div>

                  
                    <a href={usuario ? `/users/${usuario.id}` : '#'} className="absolute left-3 bottom-3 flex items-center gap-3 bg-white/80 backdrop-blur rounded-full px-2 py-1">
                    {userPhoto ? (
                      <img src={userPhoto} alt={userName} className="w-10 h-10 rounded-full object-cover border" loading="eager" decoding="async" fetchPriority="high" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-200 border">{getInitials(userName)}</div>
                    )}
                    <div className="text-sm">
                      <div className="text-xs text-gray-700 font-medium">
                        {userName}
                        {usuario?.organizacion?.nombre ? (
                          <span className="text-xs text-gray-500"> ({usuario.organizacion.nombre})</span>
                        ) : null}
                      </div>
                      <div className="text-2xs text-gray-600">{c.ciudad || '—'}</div>
                    </div>
                  </a>

                  
                  <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                    <span className="px-2 py-1 bg-white/90 rounded text-xs text-gray-700">{c.tipoAnimal || 'Animal'}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-sm text-gray-500">{new Date(c.fechaPublicacion || c.created_at).toLocaleDateString()}</p>
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{c.descripcion}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{c.descripcion}</p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/casos/${c.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition">Ver detalle</Link>
                      {c.latitud && c.longitud && (
                        <a href={`https://www.openstreetmap.org/?mlat=${c.latitud}&mlon=${c.longitud}#map=16/${c.latitud}/${c.longitud}`} target="_blank" rel="noreferrer" className="text-sm text-gray-600 hover:text-gray-800">Ver mapa</a>
                      )}
                    </div>

                    <div className="text-sm text-gray-500">{c.situacion ? c.situacion : ''}</div>
                  </div>
                </div>
              </article>
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