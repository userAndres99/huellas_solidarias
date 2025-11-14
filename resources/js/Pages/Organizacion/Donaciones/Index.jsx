import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index(props) {
  const donaciones = props.donaciones?.data || [];
  const meta = props.donaciones?.meta || { current_page: 1, last_page: 1, per_page: 20, total: 0 };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Donaciones</h2>}>
      <Head title="Donaciones" />

      <div className="py-6">
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Donaciones recibidas</h3>
              <div className="text-sm text-gray-500">Total: {meta.total}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase bg-gray-50">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">MP Payment ID</th>
                    <th className="px-3 py-2">Monto</th>
                    <th className="px-3 py-2">Comisión</th>
                    <th className="px-3 py-2">Moneda</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Fecha disponible</th>
                    <th className="px-3 py-2">Email donante</th>
                    <th className="px-3 py-2">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {donaciones.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-3 py-4 text-center text-gray-500">No hay donaciones aún.</td>
                    </tr>
                  )}
                  {donaciones.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="px-3 py-2 align-top">{d.id}</td>
                      <td className="px-3 py-2 align-top">{d.mp_payment_id}</td>
                      <td className="px-3 py-2 align-top">{d.monto}</td>
                      <td className="px-3 py-2 align-top">{d.comision_marketplace}</td>
                      <td className="px-3 py-2 align-top">{d.moneda}</td>
                      <td className="px-3 py-2 align-top">{d.estado}</td>
                      <td className="px-3 py-2 align-top">{d.fecha_disponible ?? '-'}</td>
                      <td className="px-3 py-2 align-top">{d.email_donante ?? '-'}</td>
                      <td className="px-3 py-2 align-top">{d.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* paginacion*/}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Página {meta.current_page} de {meta.last_page}</div>
              <div className="space-x-2">
                {meta.current_page > 1 && (
                  <a href={route('organizacion.donaciones') + '?page=' + (meta.current_page - 1)} className="inline-block px-3 py-1 bg-gray-100 rounded">Anterior</a>
                )}
                {meta.current_page < meta.last_page && (
                  <a href={route('organizacion.donaciones') + '?page=' + (meta.current_page + 1)} className="inline-block px-3 py-1 bg-gray-100 rounded">Siguiente</a>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
