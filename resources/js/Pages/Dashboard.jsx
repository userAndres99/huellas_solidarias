import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import MensajeFlash from '@/Components/MensajeFlash';
import TarjetaMisPublicaciones from '@/Components/TarjetaMisPublicaciones';
import LoadingImagenes from '@/Components/LoadingImagenes';

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  // Formato
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export default function Dashboard({ auth, misPublicaciones }) {
  const { flash } = usePage().props;
  const [profileUrl, setProfileUrl] = useState(null);
  const [scrapedItems, setScrapedItems] = useState([]);
  const [loadingScraped, setLoadingScraped] = useState(true);
  const [currentSiteIndex, setCurrentSiteIndex] = useState(0);

  //useEffect para manejar la URL de la foto de perfil
  useEffect(() => {
    const photo = auth?.user?.profile_photo_url;
    if (!photo) {
      setProfileUrl(null);
      return;
    }

    if (typeof window !== 'undefined' && !/^https?:\/\//.test(photo)) {
      setProfileUrl(`${window.location.origin}${photo}`);
    } else {
      setProfileUrl(photo);
    }
  }, [auth?.user?.profile_photo_url]);

  const [publicacionesActivasState, setPublicacionesActivasState] = useState(() => (misPublicaciones || []).filter(p => p.estado === 'activo'));

  function handleRemovePublicacion(id) {
    setPublicacionesActivasState(prev => prev.filter(p => p.id !== id));
  }

  useEffect(() => {
    // rotaciona entre sitios y obtiene 3 items aleatorios del sitio actual.
    const sites = ['mapfre', 'ocean', 'feliway'];
    let mounted = true;
    let idx = 0;

    const fetchSite = (i) => {
      const site = sites[i % sites.length];
      setCurrentSiteIndex(i % sites.length);
      setLoadingScraped(true);
      fetch(`/scraped-items?site=${site}&count=3`)
        .then(res => res.json())
        .then(data => {
          if (!mounted) return;
          setScrapedItems(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!mounted) return;
          setScrapedItems([]);
        })
        .finally(() => {
          if (!mounted) return;
          setLoadingScraped(false);
        });
    };

    fetchSite(idx);

    const interval = setInterval(() => {
      idx = (idx + 1) % sites.length;
      fetchSite(idx);
    }, 60000);

    return () => { mounted = false; clearInterval(interval); };
  }, []);

  function forceRefresh() {
    const sites = ['mapfre', 'ocean', 'feliway'];
    const site = sites[currentSiteIndex % sites.length];
    setLoadingScraped(true);
    fetch(`/scraped-items?site=${site}&count=3&refresh=1`)
      .then(res => res.json())
      .then(data => setScrapedItems(Array.isArray(data) ? data : []))
      .catch(() => setScrapedItems([]))
      .finally(() => setLoadingScraped(false));
  }


  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Inicio
        </h2>
      }
    >
      <Head title="Inicio" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

          {/* bienvenida  */}
          <div className="mt-6 mx-auto max-w-4xl card-surface shadow-lg rounded-2xl overflow-hidden fade-in">
            <div className="p-6 flex items-center gap-4">
              <div className="flex-shrink-0">
                {profileUrl ? (
                  <LoadingImagenes src={profileUrl} alt={auth?.user?.name ?? 'Perfil'} wrapperClass="h-14 w-14 rounded-full overflow-hidden" imgClass="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-sm" avatar={true} />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">{(auth?.user?.name || auth?.user?.email || "?").charAt(0)}</div>
                )}
              </div>
              <div>
                <p className="text-gray-900 text-lg font-semibold">Bienvenido, {auth?.user?.name ?? auth?.user?.email}!</p>
                <p className="text-sm text-gray-500">Aquí podés ver y gestionar tus publicaciones.</p>
              </div>
            </div>
          </div>

          {/* Sección: Items scrapeados */}
          <div className="mt-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="card-surface shadow-lg rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Artículos recomendados</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">Recomendaciones de 3 sitios</div>
                <div>
                  <button onClick={forceRefresh} disabled={loadingScraped} className={`inline-flex items-center gap-2 text-xs px-3 py-1 rounded ${loadingScraped ? 'bg-gray-200 text-gray-600' : 'bg-blue-500 text-white'}`}>
                    {loadingScraped ? (
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" /></svg>
                    ) : null}
                    Actualizar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {loadingScraped ? (
                  
                  [0,1,2].map(i => (
                    <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
                      <LoadingImagenes forceLoading={true} wrapperClass="w-full h-40" />
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  scrapedItems && scrapedItems.length > 0 ? (
                    scrapedItems.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-sm">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">Sin imagen</div>
                        )}
                        <div className="p-4">
                          <a href={item.link} target="_blank" rel="noreferrer" className="font-semibold text-sm block mb-2 text-gray-800 hover:underline">{item.title}</a>
                          <p className="text-xs text-gray-600">{item.excerpt ? item.excerpt.substring(0, 140) + (item.excerpt.length > 140 ? '…' : '') : ''}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-sm text-gray-500">No se encontraron artículos.</div>
                  )
                )}
              </div>
              <p className="text-xs text-gray-500 mt-4">Fuente: artículos aleatorios — actualiza cada vez que cargas (o hasta 60s de caché).</p>
            </div>
          </div>

          {/* Acciones rapidas centradas */}
          <div className="mt-6">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 bg-[var(--color-surface)] p-3 rounded-xl shadow-sm card-hover">
              <Link
                href={route('casos.create')}
                className="inline-flex items-center gap-2 btn-gradient btn-animate-gradient text-white px-4 py-2 rounded-lg hover:opacity-95 transition transform hover:-translate-y-0.5"
              >
                Publicar nuevo caso
              </Link>
            </div>
          </div>
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}