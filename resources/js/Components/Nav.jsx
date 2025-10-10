import { Link } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import React from 'react';

export default function Nav({ auth, canLogin, canRegister }) {
  return (
    <nav aria-label="Navegación principal" className="flex items-center gap-4">
      <NavLink href={route('home')} active={route().current('home')}>Inicio</NavLink>

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
          <button className="text-sm px-2 py-1 border rounded">Más</button>
        </Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Link href="/politica-privacidad">Política de privacidad</Dropdown.Link>
          <Dropdown.Link href="/terminos">Términos</Dropdown.Link>
        </Dropdown.Content>
      </Dropdown>
    </nav>
  );
}