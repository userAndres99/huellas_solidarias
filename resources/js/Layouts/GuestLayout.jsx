import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function GuestLayout({ children, auth, canLogin, canRegister }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Header auth={auth} canLogin={canLogin} canRegister={canRegister} />

      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md bg-white px-6 py-4 shadow-md sm:rounded-lg overflow-hidden">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}