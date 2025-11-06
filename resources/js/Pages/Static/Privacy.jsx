import PublicLayout from '@/Layouts/PublicLayout';
import { Head } from '@inertiajs/react';

export default function Privacy() {
  return (
    <PublicLayout title="Política de privacidad">
      <Head>
        <title>Política de privacidad - Huellas Solidarias</title>
      </Head>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <article className="prose prose-slate mx-auto">
          <h1>Política de privacidad</h1>
          <p>
            En Huellas Solidarias nos tomamos muy en serio la privacidad de las personas que
            usan nuestra plataforma. Esta política explica qué datos recogemos, por qué lo
            hacemos y cómo los protegemos.
          </p>

          <h2>Información que recopilamos</h2>
          <ul>
            <li>Datos de contacto (nombre, correo electrónico) cuando te registrás.</li>
            <li>Información pública sobre publicaciones y casos que compartís.</li>
            <li>Datos técnicos (IP, navegador) para seguridad y mejoras de servicio.</li>
          </ul>

          <h2>Uso de la información</h2>
          <p>
            Utilizamos los datos para permitirte registrarte, administrar tus publicaciones,
            enviarte notificaciones relevantes y mejorar la experiencia del servicio.
          </p>

          <h2>Compartir y divulgar</h2>
          <p>
            No vendemos tus datos. Podemos compartir información con proveedores que nos
            ayudan a operar el servicio (proveedores de hosting, correo electrónico) y cuando
            la ley nos lo requiera.
          </p>

          <h2>Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos. Sin
            embargo, recuerda que ningún sistema es completamente infalible.
          </p>

          <h2>Contacto</h2>
          <p>
            Si tenés preguntas sobre esta política, escribinos a <a href="mailto:privacy@huellassolidarias.test">privacy@huellassolidarias.test</a>.
          </p>

          <p className="text-sm text-slate-500">Última actualización: 6 de noviembre de 2025</p>
        </article>
      </div>
    </PublicLayout>
  );
}
