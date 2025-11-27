import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import EstadoBadge from '@/Components/EstadoBadge';
import TarjetaPublicaciones from '@/Components/TarjetaPublicaciones';
import TarjetaMisPublicaciones from '@/Components/TarjetaMisPublicaciones';
import Loading from '@/Components/Loading';
import MensajeFlash from '@/Components/MensajeFlash';
import { preloadImages } from '@/helpers';
import FiltroGeneral from '@/Components/FiltroGeneral';
import Paginacion from '@/Components/Paginacion';



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


export default function Index(props) {
  const initialView = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'mine') ? 'mine' : 'all';
  const [casos, setCasos] = useState([]); 
  const [meta, setMeta] = useState(null); 
  const [links, setLinks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ tipo: '', ciudad: '', situacion: '', ordenFecha: 'reciente', sexo: '', tamanio: '' });
  const [page, setPage] = useState(1);
  const [perPage] = useState(9);
  const [viewMode, setViewMode] = useState(initialView);
  const [clientFlash, setClientFlash] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('flash_message');
      if (raw) {
        const data = JSON.parse(raw);
        setClientFlash(data);
        sessionStorage.removeItem('flash_message');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      
    }
  }, []);
  

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

        // si estamos en modo 'mine', pedimos solo los casos del usuario autenticado
        if (viewMode === 'mine') {
          params.append('mio', '1');
        }

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
  }, [page, filtros, perPage, viewMode]);
  
  // cuando cambiamos el modo de vista volvemos a la primera pagina
  useEffect(() => {
    setPage(1);
  }, [viewMode]);

  if (loading) {
    return (
      <>
        <Head title={viewMode === 'mine' ? 'Mis publicaciones' : 'Publicaciones'} />
        <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
          <Loading variant="centered" message="Cargando publicaciones..." />
        </div>
      </>
    );
  }

  // layout will be selected by Index.layout below

  function handleRemovePublicacion(id) {
    setCasos(prev => prev.filter(p => p.id !== id));
  }

  return (
    <>
      <Head title="Publicaciones" />

      <div className="container mx-auto p-4">

        {/* Mensaje flash de creación  */}
        {props?.flash?.success && viewMode === 'mine' && (
          <MensajeFlash tipo="success">{props.flash.success}</MensajeFlash>
        )}

        {/* Mensaje flash */}
        {clientFlash && viewMode === 'mine' && (
          <MensajeFlash tipo={clientFlash.type}>{clientFlash.message}</MensajeFlash>
        )}

        {props?.auth?.user && (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex rounded-md bg-[var(--color-surface)] p-1 shadow-sm" role="tablist" aria-label="Ver publicaciones">
              <button
                type="button"
                role="tab"
                aria-pressed={viewMode === 'all'}
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-sm transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full ${viewMode === 'all' ? 'bg-[#C8E7F5] text-black font-semibold shadow-md border border-black scale-105' : 'text-gray-700 bg-transparent border border-transparent hover:bg-[#EAF8FF] hover:shadow-sm'}`}
              >
                Publicaciones
              </button>

              <button
                type="button"
                role="tab"
                aria-pressed={viewMode === 'mine'}
                onClick={() => setViewMode('mine')}
                className={`px-3 py-1 text-sm transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full ${viewMode === 'mine' ? 'bg-[#C8E7F5] text-black font-semibold shadow-md border border-black scale-105' : 'text-gray-700 bg-transparent border border-transparent hover:bg-[#EAF8FF] hover:shadow-sm'}`}
              >
                Mis publicaciones
              </button>
            </div>
          </div>
        )}

        {viewMode === 'all' && (
          <div>
            <FiltroGeneral filtros={filtros} setFiltros={setFiltros} />
          </div>
        )}

        <div className="mt-4 mx-auto max-w-6xl card-surface shadow-lg sm:rounded-2xl p-8 fade-in">
          {/* PAGINACIÓN ARRIBA */}
          <Paginacion
            meta={meta}
            links={links}
            onPage={(p) => {
              if (p < 1) p = 1;
              if (meta && p > meta.last_page) p = meta.last_page;
              setPage(p);
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }}
          />

          {viewMode === 'mine' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {casos.map(c => (
                <TarjetaMisPublicaciones key={c.id} publicacion={c} showEdit={false} onRemove={handleRemovePublicacion} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {casos.map(c => (
                <TarjetaPublicaciones key={c.id} caso={c} />
              ))}
            </div>
          )}

        {/* PAGINACIÓN ABAJO*/}
        <Paginacion
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
      </div>
    </>
  );
}

Index.layout = (page) => {
  const LayoutComp = page.props?.auth?.user ? AuthenticatedLayout : PublicLayout;
  return (
    <LayoutComp {...page.props} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicaciones</h2>}>
      {page}
    </LayoutComp>
  );
};