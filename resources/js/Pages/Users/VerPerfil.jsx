import { Link, usePage, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import DonationModal from '@/Components/DonationModal';

export default function VerPerfil(props){
    const page = usePage();
    const pageProps = page.props;
    const usuario = pageProps.usuario;
    const authUser = pageProps.auth?.user ?? null;

    if(!usuario) return <div className="p-6">Usuario no encontrado</div>;

    const isSelf = authUser && authUser.id === usuario.id;
    const initialFollowing = pageProps.is_following ?? false;
    const [following, setFollowing] = useState(initialFollowing);
    const [followersCount, setFollowersCount] = useState(pageProps.followers_count ?? 0);
    const [donationModalOpen, setDonationModalOpen] = useState(false);
    const [donationTarget, setDonationTarget] = useState(null);

    async function toggleFollow(){
        if(!authUser){
            window.location = route('login');
            return;
        }

        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        if(following){
            const res = await fetch(route('usuarios.dejar_seguir', usuario.id), { method: 'DELETE', headers: {'X-Requested-With':'XMLHttpRequest','X-CSRF-TOKEN': token} });
            if(res.ok){
                const json = await res.json();
                setFollowing(false);
                setFollowersCount(json.followers_count ?? Math.max(0, followersCount-1));
            }
        } else {
            const res = await fetch(route('usuarios.seguir', usuario.id), { method: 'POST', headers: {'X-Requested-With':'XMLHttpRequest','X-CSRF-TOKEN': token} });
            if(res.ok){
                const json = await res.json();
                setFollowing(true);
                setFollowersCount(json.followers_count ?? (followersCount+1));
            }
        }
    }

    return (
        <AuthenticatedLayout {...pageProps} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Perfil de {usuario.name}</h2>}>
            <Head title={`Perfil - ${usuario.name}`} />
            <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-6">
                <img src={usuario.profile_photo_url || '/images/DefaultPerfil.jpg'} alt="avatar" className="h-24 w-24 rounded-full object-cover" />
                <div>
                    <h1 className="text-2xl font-semibold">{usuario.name}</h1>
                    <div className="text-sm text-gray-600">{usuario.email}</div>
                    {usuario.organizacion && (
                        <div className="mt-2">
                            <div className="text-sm font-medium">Organización</div>
                            <div className="text-sm text-gray-700">{usuario.organizacion.nombre}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex gap-3 items-center">
                {!isSelf && (
                    <>
                        <Link href={route('chat.user', usuario.id)} className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white">Enviar mensaje</Link>

                        <button onClick={toggleFollow}
                            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${following ? 'bg-gray-200 text-slate-800' : 'bg-[var(--color-primary)] text-white'}`}>
                            {following ? 'Dejar de seguir' : 'Seguir'}
                        </button>

                        {usuario?.organizacion && (usuario.organizacion.mp_user_id || usuario.organizacion.mp_cuenta?.mp_user_id) ? (
                            <button onClick={() => { setDonationTarget({ id: usuario.organizacion.id, nombre: usuario.organizacion.nombre }); setDonationModalOpen(true); }} className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-yellow-500 text-white">Donar</button>
                        ) : null}

                        <div className="text-sm text-gray-600">{followersCount} seguidores</div>
                    </>
                )}
                {isSelf && (
                    <Link href={route('profile.edit')} className="inline-flex items-center rounded-md border px-4 py-2 text-sm">Editar perfil</Link>
                )}
            </div>

            {/* Publicaciones (Casos) del usuario */}
                        <DonationModal
                            open={donationModalOpen}
                            onClose={(result) => {
                                setDonationModalOpen(false);
                                if (result === true) {
                                    // opcional: recargar props o mostrar toast
                                }
                            }}
                            organizacion={donationTarget}
                            userEmail={authUser?.email ?? null}
                        />
            <div className="mt-8">
                <h2 className="text-lg font-semibold">Publicaciones</h2>
                {usuario.casos && usuario.casos.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-4">
                        {usuario.casos.map((caso) => (
                            <Link key={caso.id} href={route('casos.show', caso.id)} className="flex items-center gap-4 rounded-md border p-3 hover:shadow">
                                <img src={caso.foto_url || caso.fotoAnimal || '/images/default-caso.jpg'} alt="foto" className="h-20 w-28 rounded object-cover" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-800">{caso.tipoAnimal ?? 'Caso'}</div>
                                    <div className="text-xs text-gray-500 truncate">{caso.descripcion}</div>
                                    <div className="text-xs text-gray-400 mt-1">{caso.ciudad ? caso.ciudad + ' · ' : ''}{caso.fechaPublicacion ? new Date(caso.fechaPublicacion).toLocaleString() : ''}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 text-sm text-gray-500">Este usuario no tiene publicaciones.</div>
                )}
            </div>
            </div>
        </AuthenticatedLayout>
    )
}
