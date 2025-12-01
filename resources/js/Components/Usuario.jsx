import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useEventBus } from '@/EvenBus';
import EnlaceRequiereLogin from '@/Components/EnlaceRequiereLogin';
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

export default function Usuario({ usuario, caso = null, userPhoto = null, userName = null }) {
  const page = usePage();
  const authUser = page.props.auth?.user ?? null;
  const [open, setOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationTarget, setDonationTarget] = useState(null);
  const ref = useRef(null);
  const { emit } = useEventBus();

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  if (!usuario) return null;

  const name = userName ?? usuario.name ?? 'Anónimo';
  const photo = userPhoto ?? usuario.profile_photo_url ?? null;

  const hasMp = usuario.organizacion && (usuario.organizacion.mp_user_id || usuario.organizacion.mp_cuenta?.mp_user_id);

  if (!authUser) {
    return (
      <div className="absolute left-3 bottom-3 z-30">
        <EnlaceRequiereLogin href={`/usuarios/${usuario.id}`} className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-full px-2 py-1">
          {photo ? (
            <LoadingImagenes src={photo} alt={name} wrapperClass="w-10 h-10 rounded-full overflow-hidden" imgClass="w-10 h-10 rounded-full object-cover border" placeholderText={null} avatar={true} />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-200 border">{getInitials(name)}</div>
          )}
          <div className="text-sm">
            <div className="text-xs text-slate-900 font-medium">
              {name}
              {usuario?.organizacion?.nombre ? (
                <span className="text-xs text-slate-600"> ({usuario.organizacion.nombre})</span>
              ) : null}
            </div>
          </div>
        </EnlaceRequiereLogin>
      </div>
    );
  }

  return (
    <div ref={ref} className="absolute left-3 bottom-3 z-30">
      <button type="button" aria-haspopup="true" aria-expanded={open} className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-full px-2 py-1" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        {photo ? (
          <LoadingImagenes src={photo} alt={name} wrapperClass="w-10 h-10 rounded-full overflow-hidden" imgClass="w-10 h-10 rounded-full object-cover border" placeholderText={null} avatar={true} />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-200 border">{getInitials(name)}</div>
        )}
        <div className="text-sm">
          <div className="text-xs text-slate-900 font-medium">
            {name}
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
            {authUser && authUser.id !== usuario.id && (
              <button onClick={(e) => { e.stopPropagation(); emit('chat.openConversation', { is_user: true, is_group: false, id: usuario.id, name: usuario.name, avatar: usuario.profile_photo_url }); setOpen(false); }} className="px-3 py-2 text-left hover:bg-gray-50 rounded">Enviar mensaje</button>
            )}
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
        requireEmail={false}
      />
    </div>
  );
}
