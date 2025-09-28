import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import Hero from '@/Components/Hero';
import FeatureCard from '@/Components/FeatureCard';

export default function Home({ auth, canLogin, canRegister }) {
  return (
    <PublicLayout auth={auth} canLogin={canLogin} canRegister={canRegister}>
      <Head>
        <title>Home</title>
        <link rel="preload" as="image" href="/images/Hero.jpg" />
      </Head>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <Hero
          title="Huellas Solidarias"
          subtitle="Plataforma para reportar y coordinar rescates, adopciones y reencuentros de mascotas."
          imageClass="w-full h-[720px] md:h-[920px] lg:h-[500px] object-cover"

        >
          <div className="mt-6 flex gap-3">
            <Link
              href={route('register')}
              aria-label="Quiero empezar a ayudar — crear cuenta"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Quiero empezar a ayudar
            </Link>

            <Link
              href={route('login')}
              aria-label="Ya tengo cuenta — iniciar sesión"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Ya tengo cuenta
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