import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import Footer from '@/Components/Footer';
import BuscadorUsuarios from '@/Components/BuscadorUsuarios';
import NotificationBell from '@/Components/NotificationBell';
import { Link, usePage, router } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { useEventBus } from '@/EvenBus';
import Toast from '@/Components/App/Toast';
import NewMessageNotification from '@/Components/App/NewMessageNotification';
import ChatWidget from '@/Components/ChatWidget';
import PrimaryButton from '@/Components/PrimaryButton';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import NewUserModal from '@/Components/App/NewUserModal';
import ConfirmDeleteGroup from '@/Components/App/ConfirmDeleteGroup';

export default function AuthenticatedLayout({ header, children }) {
    // obtener user 
    const page = usePage();
    const user = page.props.auth?.user;
    const conversations = page.props.conversations;
    const logoHref = user ? route('dashboard') : '/';
    const { emit, on } = useEventBus();
    const subscribedChannelsRef = useRef(new Set());

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [mobileOrgOpen, setMobileOrgOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const searchContainerRef = useRef(null);
    const [showNewUserModal, setShowNewUserModal] = useState(false);

    useEffect(() => {

        function handleProfileUpdated() {
            // Recargar solo los props 'auth' para que la información del usuario.
            try {
                router.reload({ only: ['auth'] });
            } catch (e) {
                // Fallback a reload del navegador si Inertia falla
                window.location.reload();
            }
        }

        window.addEventListener('profile-updated', handleProfileUpdated);
        function handleOutside(e) {
            if (!showSearch) return;
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowSearch(false);
            }
        }
        document.addEventListener('mousedown', handleOutside);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            window.removeEventListener('profile-updated', handleProfileUpdated);
        };
    }, [showSearch]);

    useEffect(() => {
        // Escuchar eventos de WebSocket para mensajes nuevos y borrados
        try {
            if (user) {
                Echo.private(`App.Models.User.${user.id}`)
                    .listen('SocketMessage', (e) => {
                        console.debug('[AuthenticatedLayout] SocketMessage (user channel)', e);
                        const message = e.message;
                                if (message) {
                                    // defensivo: si es un mensaje de grupo en un canal de usuario, ignorarlo
                                    if (message.group_id) {
                                        console.debug('[AuthenticatedLayout] Ignoring group message on user channel', { userChannel: user.id, message });
                                    } else {
                                        emit('message.created', message);
                                        if (message && message.sender_id !== user.id) {
                                            emit('newMessageNotification', {
                                                user: message.sender,
                                                group_id: message.group_id,
                                                message: message.message || (message.attachments ? `Shared ${message.attachments.length} attachments` : ''),
                                            });
                                        }
                                    }
                                }
                    })
                    .listen('SocketMessageDeleted', (e) => {
                        console.debug('[AuthenticatedLayout] SocketMessageDeleted (user channel)', e);
                        const deletedMessage = e.deletedMessage || e.deleted_message || null;
                        const prevMessage = e.prevMessage || e.prev_message || null;
                        emit('message.deleted', { deletedMessage, prevMessage });

                        // Si el borrado fue por moderación y el current user es el remitente,
                        // mostrar un aviso 
                        try {
                            if (e?.moderated && deletedMessage && deletedMessage.sender_id && parseInt(deletedMessage.sender_id) === parseInt(user.id)) {
                                if (emit) emit('toast.show', 'Por favor, evita enviar mensajes inapropiados en la web. Tu mensaje ha sido eliminado por moderación.');
                            }
                        } catch (err) {}
                    })
                    .listen('GroupDeleted', (e) => {
                        try {
                            console.debug('[AuthenticatedLayout] GroupDeleted (user channel)', e);
                            emit('group.deleted', { id: e.id, name: e.name });
                        } catch (err) {}
                    })
                    .listen('.group.users.updated', (e) => {
                         try{
                            console.debug('[AuthenticatedLayout] GroupUserUpdated (user channel)', e);
                            emit('group.updated', {group: e.group, userIds: e.userIds });
                         } catch(err){}
                    })
                    .error((err) => {
                        // ignore
                    });
            }
        } catch (e) {}

        conversations.forEach((conversation) => {
            let channel = `message.group.${conversation.id}`;

            if (conversation.is_user) {
                channel = `message.user.${[
                    parseInt(user.id),
                    parseInt(conversation.id),
                ]
                    .sort((a, b) => a - b)
                    .join("-")}`;
            }

                // capturar la cadena del canal para que la devolución de llamada pueda ser defensiva sobre message.group_id
                {
                    const _channel = channel;
                    Echo.private(channel)
                        .error((error) => {
                            console.log(error);
                        })
                            .listen("SocketMessage", (e) => {
                            console.log("SocketMessage", e);
                            const message = e.message;
                            console.debug('[AuthenticatedLayout] SocketMessage received', message && message.id ? {id: message.id, sender_id: message.sender_id, receiver_id: message.receiver_id, group_id: message.group_id, channel: _channel} : message);

                            // defensivo: si es un mensaje de grupo en un canal de usuario, ignorarlo
                            try {
                                if (_channel && _channel.startsWith('message.user.') && message && message.group_id) {
                                    console.debug('[AuthenticatedLayout] Ignoring group message received on message.user channel', { channel: _channel, message });
                                    return;
                                }
                            } catch (e) {}

                            if (message) emit("message.created", message);
                            if (message && message.sender_id === user.id) {
                                return;
                            }
                            emit("newMessageNotification", {
                                user: message.sender,
                                group_id: message.group_id,
                                message:
                                    message.message ||
                                    `Shared ${message.attachments.length === 1
                                        ? "an attachment"
                                        : message.attachments.length +
                                        " attachmnets"
                                    }`,
                            });
                        });
                            // marcar canal como suscrito para evitar duplicados
                            try { subscribedChannelsRef.current.add(_channel); } catch (e) {}
                }

                // Escuchar evento de mensaje borrado 
                Echo.private(channel)
                    .listen("SocketMessageDeleted", (e) => {
                        console.log("SocketMessageDeleted", e);
                        const deletedMessage = e.deletedMessage || e.deleted_message || null;
                        const prevMessage = e.prevMessage || e.prev_message || null;
                        emit('message.deleted', { deletedMessage, prevMessage });
                    })
                    .error((err) => {
                        // no bloquear si el evento no existe
                    });

            if (conversation.is_group) {
                Echo.private(`group.deleted.${conversation.id}`)
                    .listen("GroupDeleted", (e) => {
                        emit("group.deleted", {id: e.id, name: e.name}) ;
                    })
                     .error((err) => {
                        console.log(err);
                    });
                try { subscribedChannelsRef.current.add(`group.deleted.${conversation.id}`); } catch (e) {}

                Echo.private(`group.updated.${conversation.id}`)
                    .listen(".group.users.updated", (e) => {
                        console.log("GroupUserUpdated recibido:", e);

                        emit("group.updated", {
                            group: e.group, userIds: e.userIds
                        });
                    })
                    .error((err) => console.log(err));

                try{
                    subscribedChannelsRef.current.add(`group.updated.${conversation.id}`);
                } catch (e) {}
            }

        });

        return () => {
            conversations.forEach((conversation) => {
                let channel = `message.group.${conversation.id}`;

                if (conversation.is_user) {
                    channel = `message.user.${[
                        parseInt(user.id),
                        parseInt(conversation.id),
                    ]
                        .sort((a, b) => a - b)
                        .join("-")}`;
                }
                Echo.leave(channel);
                try { subscribedChannelsRef.current.delete(channel); } catch (e) {}

                if (conversation.is_group) {
                    Echo.leave(`group.deleted.${conversation.id}`);
                    try { subscribedChannelsRef.current.delete(`group.deleted.${conversation.id}`); } catch (e) {}
                }
            });
        };
    }, [conversations]);

    useEffect(() => {
        if (!on) return;

        const off = on('group.created', (group) => {
            try {
                if (!group || !group.id) return;
                const channel = `message.group.${group.id}`;
                if (subscribedChannelsRef.current.has(channel)) return;

                const _channel = channel;
                Echo.private(channel)
                    .error((error) => { console.log(error); })
                    .listen('SocketMessage', (e) => {
                        const message = e.message;
                        console.debug('[AuthenticatedLayout][dynamic] SocketMessage received', message && message.id ? {id: message.id, sender_id: message.sender_id, receiver_id: message.receiver_id, group_id: message.group_id, channel: _channel} : message);
                        if (message) emit('message.created', message);
                        if (message && message.sender_id === user.id) return;
                        emit('newMessageNotification', { user: message.sender, group_id: message.group_id, message: message.message || (message.attachments ? `Shared ${message.attachments.length} attachments` : '') });
                    });

                Echo.private(channel)
                    .listen('SocketMessageDeleted', (e) => {
                        const deletedMessage = e.deletedMessage || e.deleted_message || null;
                        const prevMessage = e.prevMessage || e.prev_message || null;
                        emit('message.deleted', { deletedMessage, prevMessage });
                    })
                    .error(() => {});

                Echo.private(`group.deleted.${group.id}`)
                    .listen('GroupDeleted', (e) => {
                        emit('group.deleted', { id: e.id, name: e.name });
                    })
                    .error(() => {});

                subscribedChannelsRef.current.add(channel);
                subscribedChannelsRef.current.add(`group.deleted.${group.id}`);
            } catch (e) {
                console.error(e);
            }
        });

        return () => { try { off && off(); } catch (e) {} };
    }, [on, emit, user]);


    useEffect(() => {
    if (!user) return;

    Echo.private(`group.created.${user.id}`)
        .listen("GroupCreated", (e) => {
            emit("group.created", e.group); // disparar evento local
        })
        .error((err) => console.log(err));

    return () => Echo.leave(`group.created.${user.id}`);
}, [user]);


    return (
        <>
            <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
                <nav className="border-b border-transparent bg-[var(--color-footer)] shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex items-center">
                                <div className="flex shrink-0 items-center">
                                    <Link href={logoHref}>
                                        <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 icon-float" />
                                    </Link>
                                    {!user && (
                                        <Link href={logoHref} className="ms-3">
                                            <span className="text-lg font-semibold brand-hover-scale text-gradient-animated">Huellas Solidarias</span>
                                        </Link>
                                    )}
                                </div>


                            </div>

                            <div className="hidden xl:ms-12 xl:flex xl:items-center">
                                {user ? (
                                    <div className="flex items-center">
                                        <div className="hidden xl:flex xl:items-center xl:me-6 xl:gap-3">

                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    title="Buscar"
                                                    aria-label="Abrir buscador"
                                                    onClick={() => setShowSearch(s => !s)}
                                                    className="header-search-btn"
                                                >
                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <circle cx="11" cy="11" r="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>

                                                {showSearch && (
                                                    <div ref={searchContainerRef} className="absolute left-0 mt-2 z-50">
                                                        <BuscadorUsuarios autoFocus={true} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="nav-container xl:flex xl:items-center xl:gap-3">
                                                {/* Mis publicaciones (dashboard del usuario) */}
                                                <NavLink
                                                    href={route('dashboard')}
                                                    active={route().current('dashboard')}
                                                >
                                                    Inicio
                                                </NavLink>

                                                {/* Publicaciones (lista pública) */}
                                                <NavLink
                                                    href={route('casos.index')}
                                                    active={route().current('casos.index')}
                                                >
                                                    Ver Publicaciones
                                                </NavLink>

                                                <NavLink href="/historias">
                                                    Historias de Éxito
                                                </NavLink>

                                                {user?.role_name === 'Organizacion' && (
                                                    <div className="relative">
                                                        <Dropdown>
                                                            <Dropdown.Trigger>
                                                                <span className="inline-flex rounded-md">
                                                                    <span
                                                                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                                                        aria-hidden
                                                                    >
                                                                        Gestion de actividades
                                                                        <svg
                                                                            className="-me-0.5 ms-2 h-4 w-4"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 20 20"
                                                                            fill="currentColor"
                                                                        >
                                                                            <path
                                                                                fillRule="evenodd"
                                                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                                clipRule="evenodd"
                                                                            />
                                                                        </svg>
                                                                    </span>
                                                                </span>
                                                            </Dropdown.Trigger>
                                                            <Dropdown.Content>
                                                                <Dropdown.Link
                                                                    href={route('organizacion.index')}
                                                                >
                                                                    Eventos
                                                                </Dropdown.Link>
                                                                <Dropdown.Link
                                                                    href={route('organizacion.estadisticas')}
                                                                >
                                                                    Estadísticas
                                                                </Dropdown.Link>
                                                                <Dropdown.Link
                                                                    href={route('organizacion.donaciones')}
                                                                >
                                                                    Donaciones
                                                                </Dropdown.Link>
                                                            </Dropdown.Content>
                                                        </Dropdown>
                                                    </div>
                                                )}



                                                {user?.role_name === 'Admin' && (
                                                    <NavLink
                                                        href={route('admin.solicitudes.index')}
                                                        active={route().current('admin.solicitudes.index')}
                                                    >
                                                        Solicitudes
                                                    </NavLink>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">

                                            {user && (
                                                <Link
                                                    href={route('casos.create')}
                                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md transition hover:-translate-y-0.5"
                                                >
                                                    <span className="text-base">+</span>
                                                    <span>Publicar nuevo caso</span>
                                                </Link>
                                            )}
                                            <NotificationBell />
                                            <div className="flex relative ms-3">
                                                {!!user.is_admin && (
                                                    <PrimaryButton 
                                                        onClick={(ev) => 
                                                            setShowNewUserModal(true)
                                                            }
                                                        >
                                                        <UserPlusIcon className='h-5 w-5 mr-2' />
                                                        Añadir Nuevo Usuario
                                                    </PrimaryButton>
                                                )}
                                                <Dropdown>
                                                    <Dropdown.Trigger>
                                                        <span className="inline-flex rounded-md">
                                                            <span
                                                                className="inline-flex items-center rounded-md bg-[var(--color-surface)] px-3 py-2 text-sm font-medium leading-4 text-slate-800 transition duration-150 ease-in-out hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                                                aria-hidden
                                                            >
                                                                {user.name}

                                                                <svg
                                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </span>
                                                        </span>
                                                    </Dropdown.Trigger>

                                                    <Dropdown.Content>
                                                            <Dropdown.Link href={route('usuarios.show', user.id)}>
                                                                Perfil
                                                            </Dropdown.Link>
                                                        <Dropdown.Link
                                                            href={route('logout')}
                                                            method="post"
                                                            as="button"
                                                        >
                                                            Cerrar sesión
                                                        </Dropdown.Link>
                                                    </Dropdown.Content>
                                                </Dropdown>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <NavLink href={route('login')}>Iniciar sesión</NavLink>
                                        <NavLink href={route('register')}>Crear cuenta</NavLink>
                                    </div>
                                )}
                            </div>

                            <div className="-me-2 flex items-center xl:hidden">
                                <button
                                    onClick={() =>
                                        setShowingNavigationDropdown(
                                            (previousState) => !previousState,
                                        )
                                    }
                                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition duration-150 ease-in-out hover:bg-[var(--color-surface)] hover:text-gray-600 focus:bg-[var(--color-surface)] focus:text-gray-600 focus:outline-none"
                                >
                                    <svg
                                        className="h-6 w-6"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            className={
                                                !showingNavigationDropdown
                                                    ? 'inline-flex'
                                                    : 'hidden'
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                        <path
                                            className={
                                                showingNavigationDropdown
                                                    ? 'inline-flex'
                                                    : 'hidden'
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className={
                            (showingNavigationDropdown ? 'block' : 'hidden') +
                            ' xl:hidden'
                        }
                    >
                        <div className="px-4 pt-3 pb-2">

                            {user && (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="w-[65%] max-w-[320px]">
                                        <BuscadorUsuarios mobile={true} />
                                    </div>
                                    <div className="flex-shrink-0">
                                        <NotificationBell />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1 pb-3 pt-2">
                            {user && (
                                <div className="px-4">
                                    <Link
                                        href={route('casos.create')}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md transition w-[65%] max-w-[320px] mx-auto justify-center"
                                    >
                                        <span className="text-base">+</span>
                                        <span>Publicar nuevo caso</span>
                                    </Link>
                                </div>
                            )}
                            <ResponsiveNavLink
                                href={route('dashboard')}
                                active={route().current('dashboard')}
                            >
                                Inicio
                            </ResponsiveNavLink>

                            <ResponsiveNavLink
                                href={route('casos.index')}
                                active={route().current('casos.index')}
                            >
                                Ver Publicaciones
                            </ResponsiveNavLink>

                            <ResponsiveNavLink href="/historias">
                                Historias de Éxito
                            </ResponsiveNavLink>

                            {user?.role_name === 'Organizacion' && (
                                <ResponsiveNavLink
                                    href={route('organizacion.index')}
                                    active={route().current('organizacion.index')}
                                >
                                    Eventos
                                </ResponsiveNavLink>
                            )}
                            {user?.role_name === 'Organizacion' && (
                                <ResponsiveNavLink
                                    href={route('organizacion.estadisticas')}
                                    active={route().current('organizacion.estadisticas')}
                                >
                                    Estadísticas
                                </ResponsiveNavLink>
                            )}

                            {user?.role_name === 'Organizacion' && (
                                <>
                                    <div className="">
                                        <button
                                            type="button"
                                            onClick={() => setMobileOrgOpen(v => !v)}
                                            className="w-full text-left px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md inline-flex items-center justify-between"
                                        >
                                            <span>Gestion de actividades</span>
                                            <svg
                                                className={`${mobileOrgOpen ? 'rotate-180' : ''} h-4 w-4 transition-transform ms-2`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {mobileOrgOpen && (
                                            <div className="mt-2 space-y-1">
                                                <ResponsiveNavLink
                                                    href={route('organizacion.index')}
                                                    active={route().current('organizacion.index')}
                                                >
                                                    Eventos
                                                </ResponsiveNavLink>
                                                <ResponsiveNavLink
                                                    href={route('organizacion.estadisticas')}
                                                    active={route().current('organizacion.estadisticas')}
                                                >
                                                    Estadísticas
                                                </ResponsiveNavLink>
                                                <ResponsiveNavLink
                                                    href={route('organizacion.donaciones')}
                                                    active={route().current('organizacion.donaciones')}
                                                >
                                                    Donaciones
                                                </ResponsiveNavLink>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}


                        </div>

                        <div className="border-t border-gray-200 pb-1 pt-4">
                            <div className="px-4">
                                <div className="text-base font-medium text-gray-800">
                                    {user?.name ?? 'Invitado'}
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                    {user?.email ?? ''}
                                </div>
                            </div>

                            <div className="mt-3 space-y-1">
                                {user ? (
                                    <>
                                        <ResponsiveNavLink href={route('usuarios.show', user.id)}>
                                            Perfil
                                        </ResponsiveNavLink>
                                        <ResponsiveNavLink
                                            method="post"
                                            href={route('logout')}
                                            as="button"
                                        >
                                            Cerrar sesión
                                        </ResponsiveNavLink>
                                    </>
                                ) : (
                                    <>
                                        <ResponsiveNavLink href={route('login')}>
                                            Iniciar sesión
                                        </ResponsiveNavLink>
                                        <ResponsiveNavLink href={route('register')}>
                                            Crear cuenta
                                        </ResponsiveNavLink>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {header && (
                    <header className="bg-[var(--color-surface)] shadow">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main className="flex-1">{children}</main>

                <Footer />
            </div>

            <Toast/>
            <NewMessageNotification/>
            {user && <ChatWidget />}
            <ConfirmDeleteGroup />
            <NewUserModal show={showNewUserModal} onClose={(ev) => setShowNewUserModal(false)} />

        </>
    );
}