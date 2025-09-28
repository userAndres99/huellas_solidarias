// resources/js/Pages/Home.jsx
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import Hero from '@/Components/Hero';
import FeatureCard from '@/Components/FeatureCard';

export default function Home({ auth, canLogin, canRegister }) {
  return (
    <PublicLayout auth={auth} canLogin={canLogin} canRegister={canRegister}>
      <Head>
        <title>Huellas Solidarias</title>
        <link rel="preload" as="image" href="/images/Hero.png" />
      </Head>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <Hero
          title="Huellas Solidarias"
          subtitle="Plataforma para reportar y coordinar rescates, adopciones y reencuentros de mascotas."
        >
          <div className="mt-6 flex gap-3">
            <Link href={route('register')} className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm hover:bg-indigo-700">
              Crear cuenta
            </Link>
            <Link href={route('login')} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100">
              Iniciar sesión
            </Link>
          </div>
        </Hero>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard title="Reportes con ubicación">
            Publica casos con foto y localización exacta en el mapa.
          </FeatureCard>

          <FeatureCard title="Verificación de organizaciones">
            Refugios y asociaciones pueden verificarse y gestionar donaciones y eventos.
          </FeatureCard>

          <FeatureCard title="Recursos comunitarios">
            Guías, formularios y un foro para resolver dudas y compartir experiencias.
          </FeatureCard>
        </section>
      </div>
    </PublicLayout>
  );
}