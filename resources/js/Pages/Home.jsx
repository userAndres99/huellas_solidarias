import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import Hero from '@/Components/Hero';
import FeatureCard from '@/Components/FeatureCard';
import Loading from '@/Components/Loading';
import { preloadImages } from '@/helpers';

export default function Home({ auth, canLogin, canRegister }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await preloadImages(['/images/Hero.jpg']);
      } catch (e) {
        console.warn('Error preloading home images', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <>
      <Head>
        <title>Home</title>
        <link rel="preload" as="image" href="/images/Hero.jpg" />
      </Head>

      {loading ? (
        <div className="w-full min-h-screen flex items-center justify-center">
          <Loading variant="centered" message="Cargando contenido..." />
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Hero
            title="Huellas Solidarias"
            subtitle="Plataforma para reportar y coordinar rescates, adopciones y reencuentros de mascotas."
            imageClass="w-full h-[520px] md:h-[620px] lg:h-[500px] object-cover"

          >
            <div className="mt-6 flex gap-3">
              <Link
                href={route('register')}
                aria-label="Quiero empezar a ayudar — crear cuenta"
                className="inline-flex items-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              >
                Quiero empezar a ayudar
              </Link>

              <Link
                href={route('login')}
                aria-label="Ya tengo cuenta — iniciar sesión"
                className="inline-flex items-center rounded-md border border-gray-200 px-4 py-2 text-sm text-black hover:bg-gray-100 focus:outline-none"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </Hero>

          <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard title="Reportes con ubicación" className="fade-delay-1">
              Publica casos con foto y localización exacta en el mapa.
            </FeatureCard>

            <FeatureCard title="Verificación de organizaciones" className="fade-delay-2">
              Refugios y asociaciones pueden verificarse y gestionar donaciones y eventos.
            </FeatureCard>

            <FeatureCard title="Recursos y consejos" className="fade-delay-3">
              Consejos sobre el cuidado de animales recopilados de fuentes públicas y una sección de chat en tiempo real para resolver dudas y coordinar ayuda.
            </FeatureCard>
          </section>
        </div>
      )}
    </>
  );
}

Home.layout = (page) => <PublicLayout {...page.props}>{page}</PublicLayout>;