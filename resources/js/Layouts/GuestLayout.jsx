import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function GuestLayout({ children, auth, canLogin, canRegister }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-gray-900 flex flex-col">
      <Header auth={auth} canLogin={canLogin} canRegister={canRegister} />

      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full">{children}</div>
      </main>

      <Footer />
    </div>
  );
}