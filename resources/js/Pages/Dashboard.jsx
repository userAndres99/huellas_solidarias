import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import MensajeFlash from '@/Components/MensajeFlash';
import confirmToast from '@/Utils/confirmToast';
import TarjetaMisPublicaciones from '@/Components/TarjetaMisPublicaciones';
import NotificationCasoCard from '@/Components/NotificationCasoCard';
import NotificationEventoCard from '@/Components/NotificationEventoCard';
import NotificationDonacionCard from '@/Components/NotificationDonacionCard';
import LoadingImagenes from '@/Components/LoadingImagenes';
import ImageSearchModal from '@/Components/ImageSearchModal';

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
  const { flash, verificationNotification } = usePage().props;
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

  // sitios que rotan 
  const SITES = ['mapfre', 'ocean', 'feliway'];
  const SITE_NAMES = {
    mapfre: 'Mapfre',
    ocean: 'Ocean Petfood',
    feliway: 'Feliway'
  };
  const [activeTab, setActiveTab] = useState('consejos');

  const [publicacionesActivasState, setPublicacionesActivasState] = useState(() => (misPublicaciones || []).filter(p => p.estado === 'activo'));
  const [notificationsState, setNotificationsState] = useState(() => (auth?.user?.recent_notifications || []));
  const [showImageModal, setShowImageModal] = useState(false);

  function handleRemovePublicacion(id) {
    setPublicacionesActivasState(prev => prev.filter(p => p.id !== id));
  }

  useEffect(() => {
    // rotaciona entre sitios y obtiene 3 items randoms
    let mounted = true;
    let idx = 0;

    const fetchSite = (i) => {
      const site = SITES[i % SITES.length];
      setCurrentSiteIndex(i % SITES.length);
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
      idx = (idx + 1) % SITES.length;
      fetchSite(idx);
    }, 60000);

    return () => { mounted = false; clearInterval(interval); };
  }, []);
  
  return (
    <>
      <Head title="Inicio" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

          {/* Notificación única de resultado de solicitud de verificación */}
          {verificationNotification && (
            <div className="mb-6">
              <MensajeFlash tipo={verificationNotification.status === 'approved' ? 'success' : 'error'}>
                {verificationNotification.message}
              </MensajeFlash>
            </div>
          )}

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
                <p className="text-gray-900 text-lg font-semibold">Bienvenido a Huellas Solidarias, {auth?.user?.name ?? auth?.user?.email}!</p>
                <p className="text-sm text-gray-500">
                  En la pantalla de inicio, a tu derecha, vas a encontrar accesos rápidos a información relevante (<strong>Consejos</strong>) y a tus notificaciones (<strong>Notificaciones</strong>).
                  Para explorar el contenido de la plataforma, ingresá a la sección <strong>Ver Publicaciones</strong> en la parte superior. Allí vas a encontrar dos opciones:
                </p>
                <ul className="text-sm text-gray-500 mt-2 list-disc list-inside">
                  <li><strong>Publicaciones</strong>, donde podés ver todas las publicaciones disponibles.</li>
                  <li><strong>Mis publicaciones</strong>, donde podés consultar y gestionar tus propias publicaciones.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Acceso rápido: Buscar por imagen (modal) */}
          <div className="mt-6 mx-auto max-w-4xl">
            <div className="card-surface shadow-lg rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3">Buscá tu mascota</h3>
              <p className="text-sm text-gray-600 mb-4">¿Perdiste a tu mascota? Subí una foto y nuestro sistema buscará coincidencias por imagen para decirte si fue reportada en nuestra web.</p>

              <div className="flex items-center gap-3">
                <button onClick={() => setShowImageModal(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">Buscar por imagen</button>
              </div>
            </div>
          </div>

          <ImageSearchModal show={showImageModal} onClose={() => setShowImageModal(false)} />

          {/* Sección: Items scrapeados  */}
          <div className="mt-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-end mb-4">
              {auth?.user ? (
                <div className="mb-4 flex justify-center">
                  <div className="inline-flex rounded-md bg-[var(--color-surface)] p-1 shadow-sm" role="tablist" aria-label="Ver recomendaciones">
                    <button
                      type="button"
                      role="tab"
                      aria-pressed={activeTab === 'consejos'}
                      onClick={() => setActiveTab('consejos')}
                      className={`px-3 py-1 text-sm transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full ${activeTab === 'consejos' ? 'bg-[#C8E7F5] text-black font-semibold shadow-md border border-black scale-105' : 'text-gray-700 bg-transparent border border-transparent hover:bg-[#EAF8FF] hover:shadow-sm'}`}
                    >
                      Consejos
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-pressed={activeTab === 'notificaciones'}
                      onClick={() => setActiveTab('notificaciones')}
                      className={`px-3 py-1 text-sm transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full ${activeTab === 'notificaciones' ? 'bg-[#C8E7F5] text-black font-semibold shadow-md border border-black scale-105' : 'text-gray-700 bg-transparent border border-transparent hover:bg-[#EAF8FF] hover:shadow-sm'}`}
                    >
                      Notificaciones
                    </button>
                  </div>
                </div>
                  ) : (
                <div className="inline-flex rounded-md bg-gray-100 p-1">
                  <button onClick={() => setActiveTab('consejos')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'consejos' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>Consejos</button>
                  <button onClick={() => setActiveTab('notificaciones')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'notificaciones' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>Notificaciones</button>
                </div>
              )}
            </div>

            <div className="card-surface shadow-lg rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">{activeTab === 'consejos' ? 'Información que podría interesarte' : 'Mis Notificaciones'}</h3>
              {activeTab === 'consejos' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {loadingScraped ? (
                      [0,1,2].map(i => (
                        <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm h-56 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-3 p-6">
                            <svg className="w-12 h-12 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.15" />
                              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                            <div className="text-xs text-slate-500">Cargando recomendaciones...</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      scrapedItems && scrapedItems.length > 0 ? (
                        scrapedItems.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-sm">
                            {item.image ? (
                                  <LoadingImagenes src={item.image} alt={item.title} wrapperClass="w-full h-40" imgClass="w-full h-40 object-cover" placeholderText="Cargando imagen..." />
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
                  <p className="text-xs text-gray-500 mt-4">Fuente: {SITE_NAMES[SITES[currentSiteIndex] || SITES[0]]}</p>
                </>
              ) : (
                <div className="bg-white rounded-lg overflow-hidden shadow-sm p-6">
                  {activeTab === 'notificaciones' && (
                    <div className="flex items-center justify-end gap-2 mb-4">
                      <button
                        onClick={async () => {
                          try {
                            if(!(await confirmToast('¿Borrar todas las notificaciones? Esta acción no se puede deshacer.'))) return;
                            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                            const res = await fetch(route('notifications.destroy_all'), { method: 'DELETE', headers: {'X-CSRF-TOKEN': token} });
                            if (res.ok) {
                              setNotificationsState([]);
                              try { sessionStorage.setItem('flash_message', JSON.stringify({ type: 'success', message: 'Notificaciones vaciadas' })); } catch(e){}
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-xs text-red-700 bg-red-50 px-3 py-1 rounded"
                      >
                        Vaciar
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notificationsState && notificationsState.length > 0 ? (
                      notificationsState.map((n) => {
                        const type = n.data?.type || n.type || '';
                        if (type === 'new_caso') {
                          return (<div key={n.id}><NotificationCasoCard notification={n} onDelete={(id) => setNotificationsState(prev => prev.filter(x => x.id !== id))} /></div>);
                        }
                        if (type === 'new_evento') {
                          return (<div key={n.id}><NotificationEventoCard notification={n} onDelete={(id) => setNotificationsState(prev => prev.filter(x => x.id !== id))} /></div>);
                        }
                        if (type === 'new_donation' || type === 'new_donacion' || type === 'donation') {
                          return (<div key={n.id}><NotificationDonacionCard notification={n} onDelete={(id) => setNotificationsState(prev => prev.filter(x => x.id !== id))} /></div>);
                        }

                        // fallback: mostrar mensaje sencillo
                        return (
                          <div key={n.id} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm font-semibold text-slate-800">{n.data?.message ?? 'Notificación'}</div>
                                <div className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</div>
                                {n.data?.url && <div className="mt-3"><a href={n.data.url} className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">Ir</a></div>}
                              </div>
                              <div className="ml-4">
                                <button onClick={async () => {
                                  try {
                                    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                    const res = await fetch(route('notifications.destroy', n.id), { method: 'DELETE', headers: {'X-CSRF-TOKEN': token} });
                                    if (res.ok) setNotificationsState(prev => prev.filter(x => x.id !== n.id));
                                  } catch (e) {}
                                }} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">Eliminar</button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-3 text-sm text-gray-500">Aún no hay notificaciones. Aquí aparecerán avisos y novedades relevantes.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Dashboard.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
    header={
      <h2 className="text-xl font-semibold leading-tight text-gray-800">
        Inicio
      </h2>
    }
  >
    {page}
  </AuthenticatedLayout>
);