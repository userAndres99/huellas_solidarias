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
          <div className="mt-6 mx-auto max-w-4xl bg-gradient-to-r from-white via-gray-50 to-white shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6 flex items-center gap-4">
              <div className="flex-shrink-0">
                {profileUrl ? (
                  <img src={profileUrl} alt={auth?.user?.name ?? 'Perfil'} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm" />
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
              <div className="inline-flex items-center gap-3 bg-white/60 p-2 rounded-xl shadow-sm">
                <Link
                  href="/mapa"
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:shadow-md transition transform hover:-translate-y-0.5"
                >
                  Ver mapa
                </Link>
                <Link
                  href="/publicar-caso"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:opacity-95 transition transform hover:-translate-y-0.5"
                >
                  Publicar nuevo caso
                </Link>
              </div>
            </div>
          </div>

          {/* Mis publicaciones */}
          <div className="mt-8">
            <div className="mx-auto max-w-6xl bg-white shadow-lg sm:rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-6 text-center">Mis publicaciones</h3>

              {(!misPublicaciones || misPublicaciones.length === 0) ? (
                <div className="text-gray-600 text-center py-8">No tenés publicaciones todavía.</div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
                  {misPublicaciones.map((p) => (
                    <TarjetaPublicacion key={p.id} publicacion={p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}