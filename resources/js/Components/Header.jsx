import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Nav from '@/Components/Nav';

export default function Header({ auth, canLogin, canRegister }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Ir al inicio" className="inline-flex items-center">
            <ApplicationLogo className="h-8 w-8 text-indigo-600" />
            <span className="ml-3 text-lg font-semibold">Huellas Solidarias</span>
          </Link>
        </div>

        <Nav auth={auth} canLogin={canLogin} canRegister={canRegister} />
      </div>
    </header>
  );
}