import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { Head } from '@inertiajs/react';

export default function PublicLayout({ children, title = 'Huellas Solidarias', auth, canLogin, canRegister }) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="min-h-screen bg-[var(--color-bg)] text-gray-900">
        <Header auth={auth} canLogin={canLogin} canRegister={canRegister} />
        <main className="mx-auto max-w-6xl px-6 py-16">{children}</main>
        <Footer />
      </div>
    </>
  );
}