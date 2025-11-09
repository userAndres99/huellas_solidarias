import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import MensajeFlash from '@/Components/MensajeFlash';
import TarjetaPublicacion from '@/Components/TarjetaPublicacion';

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

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Mis publicaciones
        </h2>
      }
    >
      <Head title="Mis publicaciones" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Mensaje de exito (si se publica un caso)*/}
          {flash?.success && (
            <MensajeFlash>{flash.success}</MensajeFlash>
          )}

          {/* bienvenida  */}
          <div className="mt-6 mx-auto max-w-4xl card-surface shadow-lg rounded-2xl overflow-hidden fade-in">
            <div className="p-6 flex items-center gap-4">
              <div className="flex-shrink-0">
                {profileUrl ? (
                  <img src={profileUrl} alt={auth?.user?.name ?? 'Perfil'} className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-sm" />
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

          {/* Mis publicaciones */}
          <div className="mt-8">
            <div className="mx-auto max-w-6xl card-surface shadow-lg sm:rounded-2xl p-8 fade-in">
              <h3 className="text-2xl font-semibold mb-6 text-center">Mis publicaciones</h3>

                  {(() => {
                    const publicacionesActivas = (misPublicaciones || []).filter(p => p.estado === 'activo');
                    if (publicacionesActivas.length === 0) {
                      return <div className="text-gray-600 text-center py-8">No tenés publicaciones activas todavía.</div>;
                    }

                    return (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
                        {publicacionesActivasState.map((p, i) => (
                          <div key={p.id} className={`w-full md:w-auto fade-in ${i % 3 === 0 ? 'fade-delay-1' : i % 3 === 1 ? 'fade-delay-2' : 'fade-delay-3'}`}>
                            <TarjetaPublicacion publicacion={p} showEdit={false} onRemove={handleRemovePublicacion} />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}