import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
import EstadoBadge from '@/Components/EstadoBadge';
import DonationModal from '@/Components/DonationModal';
import LoadingImagenes from '@/Components/LoadingImagenes';

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
    <article key={caso.id} className="card-surface-alt rounded-xl overflow-hidden fade-in card-hover relative">
      <div className="relative h-56 md:h-48 lg:h-56">
        {caso.fotoAnimal ? (
          <LoadingImagenes src={caso.fotoAnimal} alt={caso.tipoAnimal || 'Foto'} wrapperClass="h-full w-full" imgClass="object-cover w-full h-full" placeholderText={null} />
        ) : (
          <div className="h-full w-full bg-[rgba(2,132,199,0.06)] flex items-center justify-center text-slate-500">Sin imagen</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

        <PopoverTrigger usuario={usuario} caso={caso} userPhoto={userPhoto} userName={userName} />

        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          <span className="px-2 py-1 bg-white/90 rounded text-xs text-slate-700">{caso.tipoAnimal || 'Animal'}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-600">
            {new Date(caso.fechaPublicacion || caso.created_at).toLocaleDateString()}
            {caso.ciudad ? (
              <span className="text-sm text-slate-500"> · {caso.ciudad}</span>
            ) : null}
          </p>
        </div>
        <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{caso.descripcion}</h3>
        <p className="text-sm text-slate-800 line-clamp-3">{caso.descripcion}</p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <EnlaceRequiereLogin href={`/casos/${caso.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-full text-sm hover:shadow-md transition transform hover:-translate-y-0.5" ariaLabel={`Ver caso ${caso.id}`}>
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

function PopoverTrigger({ usuario, caso, userPhoto, userName }) {
  const [open, setOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationTarget, setDonationTarget] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  if (!usuario) return null;

  const hasMp = usuario.organizacion && (usuario.organizacion.mp_user_id || usuario.organizacion.mp_cuenta?.mp_user_id);

  return (
    <div ref={ref} className="absolute left-3 bottom-3">
      <button type="button" aria-haspopup="true" aria-expanded={open} className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-full px-2 py-1" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        {userPhoto ? (
          <LoadingImagenes src={userPhoto} alt={userName} wrapperClass="w-10 h-10 rounded-full overflow-hidden" imgClass="w-10 h-10 rounded-full object-cover border" placeholderText={null} />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-200 border">{getInitials(userName)}</div>
        )}
        <div className="text-sm">
          <div className="text-xs text-slate-900 font-medium">
            {userName}
            {usuario?.organizacion?.nombre ? (
              <span className="text-xs text-slate-600"> ({usuario.organizacion.nombre})</span>
            ) : null}
          </div>
        </div>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-44 bg-white rounded shadow-md p-2 text-sm" role="menu" aria-label="Opciones usuario">
          <div className="flex flex-col">
            <Link href={route('usuarios.show', usuario.id)} className="px-3 py-2 hover:bg-gray-50 rounded">Ver perfil</Link>
            <Link href={route('chat.user', usuario.id)} className="px-3 py-2 hover:bg-gray-50 rounded">Enviar mensaje</Link>
            {hasMp && (
              <button onClick={() => { setDonationTarget({ id: usuario.organizacion.id, nombre: usuario.organizacion.nombre }); setDonationModalOpen(true); setOpen(false); }} className="text-left px-3 py-2 hover:bg-gray-50 rounded">Donar</button>
            )}
          </div>
        </div>
      )}

      <DonationModal
        open={donationModalOpen}
        onClose={(result) => { setDonationModalOpen(false); if (result === true) { /* optionally refresh */ } }}
        organizacion={donationTarget}
        userEmail={null}
      />
    </div>
  );
}
