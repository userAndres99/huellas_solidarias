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
          {/* Mensaje de éxito */}
          {flash?.success && (
            <MensajeFlash>{flash.success}</MensajeFlash>
          )}

          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              Bienvenido, {auth?.user?.name ?? auth?.user?.email}!
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="mt-6 flex gap-3">
            <Link
              href="/mapa"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Ver mapa
            </Link>
            <Link
              href="/publicar-caso"
              className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Publicar nuevo caso
            </Link>
          </div>

          {/* Mis publicaciones */}
          <div className="mt-8 bg-white shadow-sm sm:rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Mis publicaciones</h3>

            {(!misPublicaciones || misPublicaciones.length === 0) ? (
              <div className="text-gray-600">No tenés publicaciones todavía.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {misPublicaciones.map((p) => (
                  <TarjetaPublicacion key={p.id} publicacion={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}