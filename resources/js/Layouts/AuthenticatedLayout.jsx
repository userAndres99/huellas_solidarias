import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import Footer from '@/Components/Footer';
import BuscadorUsuarios from '@/Components/BuscadorUsuarios';
import NotificationBell from '@/Components/NotificationBell';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { useEventBus } from '@/EvenBus';
import Toast from '@/Components/App/Toast';
import NewMessageNotification from '@/Components/App/NewMessageNotification';

export default function AuthenticatedLayout({ header, children }) {
    // obtener user 
    const page = usePage();
    const user = page.props.auth?.user;
    const conversations = page.props.conversations;
    const logoHref = user ? route('dashboard') : '/';
    const { emit } = useEventBus();

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [mobileOrgOpen, setMobileOrgOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const searchContainerRef = useRef(null);

    useEffect(() => {
        function handleOutside(e) {
            if (!showSearch) return;
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowSearch(false);
            }
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showSearch]);

    useEffect(() => {
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

            Echo.private(channel)
                .error((error) => {
                    console.log(error);
                })
                .listen("SocketMessage", (e) => {
                    console.log("SocketMessage", e);
                    const message = e.message;

                    emit("message.created", message);
                    if (message.sender_id === user.id) {
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
            });
        };
    }, [conversations]);

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
                                                    aria-label="Abrir buscador"
                                                    onClick={() => setShowSearch(s => !s)}
                                                    className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-[var(--color-surface)] text-gray-700"
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
                                            <div className="relative ms-3">
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
                                                        <Dropdown.Link href={route('profile.edit')}>
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
                                {user && <BuscadorUsuarios mobile={true} />}
                            </div>

                            {user && (
                                <div className="px-4 mt-2 mb-2 flex items-center">
                                    <NotificationBell />
                                </div>
                            )}
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
                                        <ResponsiveNavLink href={route('profile.edit')}>
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
        </>
    );
}