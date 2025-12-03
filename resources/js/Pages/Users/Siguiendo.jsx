import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Usuario from '@/Components/Usuario';

export default function Siguiendo({ usuario, siguiendo = [] }) {
  const page = usePage();
  const authUser = page.props.auth?.user ?? null;
  const isOwner = authUser && usuario && authUser.id === usuario.id;
  const [lista, setLista] = useState(Array.isArray(siguiendo) ? siguiendo : []);

  async function handleUnfollow(targetId) {
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const res = await fetch(route('usuarios.dejar_seguir', targetId), { method: 'DELETE', headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': token } });
      if (!res.ok) throw new Error('Error al dejar de seguir');
      const json = await res.json().catch(() => ({}));
      // remover de la lista
      setLista(prev => prev.filter(u => u.id !== targetId));
      //si es el usuario autenticado, disparar evento para actualizar contador en el perfil
      if (json.following_count !== undefined && isOwner) {
        const ev = new CustomEvent('usuario.following_updated', { detail: { following_count: json.following_count } });
        window.dispatchEvent(ev);
      }
    } catch (err) {
      console.error(err);
      alert('No se pudo dejar de seguir. Intente nuevamente.');
    }
  }

  return (
    <>
      <Head title={`Siguiendo - ${usuario?.name ?? ''}`} />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <Link href={`/usuarios/${usuario.id}`} className="text-blue-600">← Volver al perfil</Link>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">{usuario.name} - Seguidos</h2>

          {lista && lista.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lista.map(u => (
                <div key={u.id} className="p-3 border rounded flex items-center justify-between"> 
                  <div className="flex-1">
                    <Usuario usuario={u} inline={true} />
                  </div>
                  {isOwner && (
                    <div className="ml-3">
                      <button onClick={() => handleUnfollow(u.id)} className="inline-flex items-center rounded-md px-3 py-1 text-sm font-medium bg-red-600 hover:bg-red-700 text-white">Dejar de seguir</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No sigue a ningún usuario.</div>
          )}
        </div>
      </div>
    </>
  );
}

Siguiendo.layout = (page) => (
  <AuthenticatedLayout {...page.props} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Siguiendo</h2>}>{page}</AuthenticatedLayout>
);
