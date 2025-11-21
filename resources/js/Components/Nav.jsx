import { Link } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import React, { useState } from 'react';

export default function Nav({ auth, canLogin, canRegister }) {
  const [open, setOpen] = useState(false);

  return (
    <nav aria-label="Navegación principal" className="flex items-center nav-container">
      {/* Desktop links */}
      <div className="hidden xl:flex xl:items-center xl:space-x-4">
        <NavLink href={route('home')} active={route().current('home')}>Inicio</NavLink>
        <NavLink href={route('casos.index')} active={route().current('casos.index')}>Publicaciones</NavLink>
        <NavLink href="/historias">Historias</NavLink>

        {auth?.user ? (
          <>
            <NavLink href={route('dashboard')} active={route().current('dashboard')}>Panel</NavLink>
            <form method="POST" action={route('logout')} className="inline" id="logout-form">
              <input
                type="hidden"
                name="_token"
                defaultValue={typeof document !== 'undefined' && document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''}
              />
              <button type="submit" className="text-sm hover:text-gray-700">Cerrar sesión</button>
            </form>
          </>
        ) : (
          <>
            {canLogin && <NavLink href={route('login')}>Iniciar sesión</NavLink>}
            {canRegister && <NavLink href={route('register')}>Crear cuenta</NavLink>}
          </>
        )}

        <Dropdown>
          <Dropdown.Trigger>
            <span className="text-sm px-2 py-1 border rounded" aria-hidden>Más</span>
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Link href="/politica-privacidad">Política de privacidad</Dropdown.Link>
            <Dropdown.Link href="/terminos">Términos</Dropdown.Link>
          </Dropdown.Content>
        </Dropdown>
      </div>

      {/* Mobile hamburger */}
      <div className="xl:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
          aria-expanded={open}
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="xl:hidden absolute right-4 top-16 z-50 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 xl:right-8 xl:top-20">
          <div className="p-2">
            <ResponsiveNavLink href={route('home')} active={route().current('home')}>Inicio</ResponsiveNavLink>
            <ResponsiveNavLink href={route('casos.index')} active={route().current('casos.index')}>Publicaciones</ResponsiveNavLink>
            <ResponsiveNavLink href="/historias">Historias</ResponsiveNavLink>

            {auth?.user ? (
              <>
                <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>Panel</ResponsiveNavLink>
                <form method="POST" action={route('logout')} className="mt-2" id="logout-form-mobile">
                  <input
                    type="hidden"
                    name="_token"
                    defaultValue={typeof document !== 'undefined' && document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').getAttribute('content') : ''}
                  />
                  <button type="submit" className="w-full text-left py-2 ps-3">Cerrar sesión</button>
                </form>
              </>
            ) : (
              <>
                {canLogin && <ResponsiveNavLink href={route('login')}>Iniciar sesión</ResponsiveNavLink>}
                {canRegister && <ResponsiveNavLink href={route('register')}>Crear cuenta</ResponsiveNavLink>}
              </>
            )}

            <div className="mt-2 border-t pt-2">
              <ResponsiveNavLink href="/politica-privacidad">Política de privacidad</ResponsiveNavLink>
              <ResponsiveNavLink href="/terminos">Términos</ResponsiveNavLink>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}