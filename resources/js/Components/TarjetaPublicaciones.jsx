import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import EstadoBadge from '@/Components/EstadoBadge';
import LoadingImagenes from '@/Components/LoadingImagenes';
import Usuario from '@/Components/Usuario';

function getInitials(name = '') {
  return name
    .split(' ')
    .map(s => s[0] || '')
    .filter(Boolean)
    .slice(0,2)
    .join('')
    .toUpperCase();
}

export default function TarjetaPublicaciones({ caso }) {
  const usuario = caso.usuario || caso.user || null;
  const userName = usuario?.name ?? 'Anónimo';
  const userPhoto = usuario?.profile_photo_url ?? null;

  return (
    <article key={caso.id} className="card-surface-alt rounded-xl overflow-hidden fade-in card-hover relative flex flex-col h-full">
      <div className="relative h-56 md:h-48 lg:h-56">
        {caso.fotoAnimal ? (
          <LoadingImagenes src={caso.fotoAnimal} alt={caso.tipoAnimal || 'Foto'} wrapperClass="h-full w-full" imgClass="object-contain object-center w-full h-full" placeholderText={null} />
        ) : (
          <div className="h-full w-full bg-[rgba(2,132,199,0.06)] flex items-center justify-center text-slate-500">Sin imagen</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

        <Usuario usuario={usuario} caso={caso} userPhoto={userPhoto} userName={userName} />

        <div className="absolute right-3 top-3 flex flex-col items-end gap-2 z-30">
          <span className="px-2 py-1 bg-white/90 rounded text-xs text-slate-700">{caso.tipoAnimal || 'Animal'}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-600">
            {new Date(caso.fechaPublicacion || caso.created_at).toLocaleDateString()}
            {caso.ciudad ? (
              <span className="text-sm text-slate-500"> · {caso.ciudad}</span>
            ) : null}
          </p>
        </div>
        <h3 className="text-lg font-bold text-slate-900 line-clamp-3">{caso.descripcion}</h3>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <EnlaceRequiereLogin href={`/casos/${caso.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm hover:shadow-md transition transform hover:-translate-y-0.5" ariaLabel={`Ver caso ${caso.id}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block">
                <path d="M12 5c-7 0-11 6-11 7s4 7 11 7 11-6 11-7-4-7-11-7zm0 11a4 4 0 110-8 4 4 0 010 8z" fill="currentColor"/>
                <path d="M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="white"/>
              </svg>
              Ver detalle
            </EnlaceRequiereLogin>
          </div>

          <div className="flex items-center">
            <EstadoBadge situacion={caso.situacion} />
          </div>
        </div>
      </div>
    </article>
  );
}
