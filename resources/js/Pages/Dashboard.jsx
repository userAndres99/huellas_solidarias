import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

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
          Dashboard
        </h2>
      }
    >
      <Head title="Dashboard" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Mensaje de éxito */}
          {flash?.success && (
            <div className="mb-4 rounded bg-green-50 border border-green-200 p-4 text-green-800">
              {flash.success}
            </div>
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
                  <div key={p.id} className="border rounded-lg overflow-hidden">
                    {p.fotoAnimal ? (
                      <img
                        src={p.fotoAnimal}
                        alt={`Foto de ${p.tipoAnimal || 'animal'}`}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                        Sin imagen
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-bold">
                            {p.tipoAnimal || '—'} • {p.situacion}
                          </h4>
                          <p className="text-sm text-gray-600">{p.ciudad}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(p.fechaPublicacion)}
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-gray-700 truncate">{p.descripcion}</p>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/casos/${p.id}`}
                          className="text-sm inline-block px-3 py-1 border rounded hover:bg-gray-50"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/casos/${p.id}/edit`}
                          className="text-sm inline-block px-3 py-1 border rounded hover:bg-gray-50"
                        >
                          Editar
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}