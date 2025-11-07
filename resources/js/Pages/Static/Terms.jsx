import PublicLayout from '@/Layouts/PublicLayout';
import { Head } from '@inertiajs/react';

export default function Terms() {
  return (
    <PublicLayout title="Términos y condiciones">
      <Head>
        <title>Términos y condiciones - Huellas Solidarias</title>
      </Head>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <article className="prose prose-slate mx-auto">
          <h1>Términos y condiciones</h1>

          <p>
            Bienvenido a Huellas Solidarias. Al utilizar nuestra plataforma aceptás los
            siguientes términos y condiciones. Si no estás de acuerdo, por favor no uses el
            servicio.
          </p>

          <h2>Uso del servicio</h2>
          <p>
            Podés publicar casos, comentar, gestionar eventos y participar en la comunidad. Está
            prohibido publicar contenido ilegal, ofensivo o que infrinja derechos de terceros.
          </p>

          <h2>Responsabilidades del usuario</h2>
          <ul>
            <li>Mantener la veracidad de la información que publiques.</li>
            <li>No suplantar a otras personas.</li>
            <li>Respetar la legislación aplicable y las normas de la comunidad.</li>
          </ul>

          <h2>Propiedad intelectual</h2>
          <p>
            Los contenidos que publiques siguen siendo de tu propiedad, pero nos otorgás una
            licencia para mostrarlos en la plataforma y en materiales relacionados con el
            servicio.
          </p>

          <h2>Limitación de responsabilidad</h2>
          <p>
            Huellas Solidarias no se hace responsable por daños directos o indirectos resultantes
            del uso de la plataforma, en la medida permitida por la ley.
          </p>

          <h2>Modificaciones</h2>
          <p>
            Podemos actualizar estos términos; notificaremos cambios importantes a los usuarios
            y la fecha de "Última actualización" se modificará en esta página.
          </p>

          <p className="text-sm text-slate-500">Última actualización: 6 de noviembre de 2025</p>
        </article>
      </div>
    </PublicLayout>
  );
}
