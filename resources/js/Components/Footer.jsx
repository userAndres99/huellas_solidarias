import { Link } from '@inertiajs/react';

export default function Footer() {
  return (
    <footer className="footer-surface border-t">
      <div className="mx-auto max-w-6xl px-6 py-6 flex justify-between text-sm text-slate-800">
        <span>© {new Date().getFullYear()} Huellas Solidarias</span>
        <div className="flex gap-4">
          <Link href="/politica-privacidad" className="hover:underline">Política de privacidad</Link>
          <Link href="/terminos" className="hover:underline">Términos</Link>
        </div>
      </div>
    </footer>
  );
}