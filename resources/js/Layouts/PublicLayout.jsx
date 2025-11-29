import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { Head, Link } from '@inertiajs/react';

export default function PublicLayout({ children, title = 'Huellas Solidarias', auth, canLogin, canRegister, header = null }) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="min-h-screen bg-[var(--color-bg)] text-gray-900 flex flex-col">
        <Header auth={auth} canLogin={canLogin} canRegister={canRegister} />

        {header && (
          <header className="bg-[var(--color-surface)] shadow">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {header}
            </div>
          </header>
        )}

        <main className="flex-1 mx-auto max-w-6xl px-6 py-16">{children}</main>
        <Footer />
      </div>
    </>
  );
}