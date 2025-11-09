import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import Modal from '@/Components/Modal';

/**
 * Componente que renderiza un enlace normal si el usuario está autenticado,
 * y muestra un prompt para iniciar sesión si no lo está.
 */
export default function EnlaceRequiereLogin({ href, children, className = '', ariaLabel, as = 'a', method, preserveScroll = false }) {
  const page = usePage();
  const user = page.props.auth?.user ?? null;

  const [show, setShow] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setShow(true);
  };

  const handleLogin = () => {
    try {
      if (typeof window !== 'undefined' && href) {
        sessionStorage.setItem('intended_after_login', href.toString());
      }
    } catch (err) {
      // No hacer nada si falla el almacenamiento
    }
    Inertia.get(route('login'));
  };

  if (user) {
    return (
      <Link href={href} as={as} method={method} className={className} aria-label={ariaLabel} preserveScroll={preserveScroll}>
        {children}
      </Link>
    );
  }
  return (
    <>
      <button type="button" onClick={handleClick} className={className} aria-label={ariaLabel}>
        {children}
      </button>

      <Modal show={show} onClose={() => setShow(false)} maxWidth="sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Iniciar sesión requerida</h3>
          <p className="mt-2 text-sm text-slate-600">Para interactuar con esta publicación necesitás iniciar sesión. Podés cancelar para quedarte en la página o iniciar sesión ahora.</p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="px-4 py-2 rounded border text-sm"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleLogin}
              className="px-4 py-2 rounded bg-[var(--color-primary)] text-white text-sm font-semibold"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
