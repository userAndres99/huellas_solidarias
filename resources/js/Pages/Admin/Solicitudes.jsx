import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import MensajeFlash from '@/Components/MensajeFlash';

export default function Solicitudes(props) {
  const { solicitudes = [] } = props;
  const { flash } = usePage().props;

  return (
    <>
      <Head title="Solicitudes de verificación" />

      <div className="p-6">
        {flash?.success && (
          <div className="mb-4">
            <MensajeFlash tipo="success">{flash.success}</MensajeFlash>
          </div>
        )}

        <h1 className="text-2xl font-semibold mb-4">Solicitudes de verificación</h1>

        {solicitudes.length === 0 ? (
          <div className="rounded-md bg-yellow-50 border p-4 text-sm text-yellow-800">
            No hay solicitudes en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">#</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Solicitante</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Organización</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Contacto</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Creada</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {solicitudes.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.user?.name ?? '—'}
                      <div className="text-xs text-gray-500">{s.user?.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.organization_name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.organization_phone ?? ''}
                      <div className="text-xs text-gray-500">{s.organization_email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          s.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : s.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link
                        href={route('admin.solicitudes.show', s.id)}
                        className="inline-flex items-center rounded bg-indigo-600 px-3 py-1 text-white text-sm hover:bg-indigo-700"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

Solicitudes.layout = (page) => (
  <AuthenticatedLayout {...page.props}>{page}</AuthenticatedLayout>
);