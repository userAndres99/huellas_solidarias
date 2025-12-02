import { Link, usePage, Head } from '@inertiajs/react';
import { useEventBus } from '@/EvenBus';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import DonationModal from '@/Components/DonationModal';
import TarjetaPublicaciones from '@/Components/TarjetaPublicaciones';
import TarjetaHistorias from '@/Components/TarjetaHistorias';
import Carrusel3D from '@/Components/Carrusel3D';

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
    const { emit } = useEventBus();

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
        <>
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
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const conv = { is_user: true, is_group: false, id: usuario.id, name: usuario.name, avatar: usuario.profile_photo_url };
                                        emit('chat.openConversation', conv);
                                    }}
                                    className="inline-flex items-center rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white"
                                >Enviar mensaje</button>

                        <button onClick={toggleFollow}
                            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${following ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                            {following ? 'Dejar de seguir' : 'Seguir'}
                        </button>

                        {usuario?.organizacion && (usuario.organizacion.mp_user_id || usuario.organizacion.mp_cuenta?.mp_user_id) ? (
                            <button onClick={() => { setDonationTarget({ id: usuario.organizacion.id, nombre: usuario.organizacion.nombre }); setDonationModalOpen(true); }} className="inline-flex items-center rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white">
                                <img src="/images/mercadopagologo.png" alt="Mercado Pago" className="h-4 w-auto mr-2 object-contain" />
                                Donar
                            </button>
                        ) : null}

                        <div className="text-sm text-gray-600">{followersCount} seguidores</div>
                    </>
                )}
                {isSelf && (
                    <Link href={route('profile.edit')} className="inline-flex items-center rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white">Editar perfil</Link>
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
                <h2 className="text-2xl font-extrabold text-sky-700 flex items-center gap-3">
                    <span className="inline-block w-10 h-1 bg-sky-400 rounded-full" />
                    Publicaciones
                </h2>
                {usuario.casos && usuario.casos.length > 0 ? (
                    <div className="mt-4">
                        <Carrusel3D
                            items={usuario.casos}
                            renderItem={(caso) => (
                                <div className="mx-auto h-[420px] w-[260px] overflow-hidden">
                                    <div className="scale-[0.92] origin-top">
                                        <TarjetaPublicaciones caso={caso} />
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                ) : (
                    <div className="mt-4 text-sm text-gray-500">Este usuario no tiene publicaciones.</div>
                )}
            </div>
            {/* Historias de éxito del usuario */}
            <div className="mt-8">
                <h2 className="text-2xl font-extrabold text-sky-700 flex items-center gap-3">
                    <span className="inline-block w-10 h-1 bg-sky-400 rounded-full" />
                    Historias de Éxito
                </h2>
                {usuario.historias && usuario.historias.length > 0 ? (
                    <div className="mt-4">
                        <Carrusel3D
                            horizontal
                            items={usuario.historias}
                            renderItem={(h) => (
                                <div className="mx-auto w-[90%] h-[340px] max-w-[480px] overflow-hidden md:h-[320px] md:w-[480px]">
                                    <div className="scale-[0.92] origin-top">
                                        <TarjetaHistorias historia={h} />
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                ) : (
                    <div className="mt-4 text-sm text-gray-500">Este usuario no tiene historias de éxito.</div>
                )}
            </div>
                        </div>
                </>
        )
}

VerPerfil.layout = (page) => (
    <AuthenticatedLayout
        {...page.props}
        header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Perfil de {page.props.usuario?.name ?? ''}</h2>}
    >
        {page}
    </AuthenticatedLayout>
);
