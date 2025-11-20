import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import EstadoBadge from '@/Components/EstadoBadge';
import TarjetaPublicaciones from '@/Components/TarjetaPublicaciones';
import Loading from '@/Components/Loading';
import { preloadImages } from '@/helpers';
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

function normalizeSituacionSimple(s) {
  if (!s) return 'activo';
  try {
    return s
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, '')
      .replace(/ó/g, 'o')
      .replace(/á/g, 'a');
  } catch (e) {
    return s.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  }
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
        const items = data.data || data;
        // Preload imagen
        try {
          const urls = items.flatMap(i => [i.fotoAnimal, i.usuario?.profile_photo_url]).filter(Boolean);
          setCasos(items);
          setMeta(data);
          setLinks(data.links || []);
          await preloadImages(urls);
        } catch (e) {
          // fallback si el preload falla
          setCasos(items);
          setMeta(data);
          setLinks(data.links || []);
          console.warn('Error preloading caso images', e);
        }
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
      <LayoutPlaceholder />
    );
  }

  function LayoutPlaceholder() {
    const LayoutToUse = props?.auth?.user ? AuthenticatedLayout : PublicLayout;
    return (
      <LayoutToUse {...props} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicaciones</h2>}>
        <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
          <Loading variant="centered" message="Cargando publicaciones..." />
        </div>
      </LayoutToUse>
    );
  }

  const Layout = props?.auth?.user ? AuthenticatedLayout : PublicLayout;

  return (
    <Layout
      {...props}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicaciones</h2>}
    >
      <Head title="Publicaciones" />

      <div className="container mx-auto p-4">

        <Filtros filtros={filtros} setFiltros={setFiltros} />

        <div className="mt-4 mx-auto max-w-6xl card-surface shadow-lg sm:rounded-2xl p-8 fade-in">
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
            {casos.map(c => (
              <TarjetaPublicaciones key={c.id} caso={c} />
            ))}
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
        {/* Donation modal moved to user profile view */}
      </div>
    </Layout>
  );
}