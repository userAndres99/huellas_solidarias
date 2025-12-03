import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Usuario from '@/Components/Usuario';

export default function Seguidores({ usuario, seguidores = [] }) {
  return (
    <>
      <Head title={`Seguidores - ${usuario?.name ?? ''}`} />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <Link href={`/usuarios/${usuario.id}`} className="text-blue-600">← Volver al perfil</Link>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">{usuario.name} - Seguidores</h2>

          {seguidores && seguidores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {seguidores.map(u => (
                <div key={u.id} className="p-3 border rounded"> 
                  <Usuario usuario={u} inline={true} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No tiene seguidores aún.</div>
          )}
        </div>
      </div>
    </>
  );
}

Seguidores.layout = (page) => (
  <AuthenticatedLayout {...page.props} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Seguidores</h2>}>{page}</AuthenticatedLayout>
);
