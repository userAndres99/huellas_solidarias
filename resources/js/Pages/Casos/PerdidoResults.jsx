import React from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MensajeFlash from '@/Components/MensajeFlash';
import TarjetaPublicaciones from '@/Components/TarjetaPublicaciones';
import TarjetaMisPublicaciones from '@/Components/TarjetaMisPublicaciones';
import LoadingImagenes from '@/Components/LoadingImagenes';

function makeImageUrl(path) {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (path.startsWith('/storage/')) return window.location.origin + path;
  return window.location.origin + '/storage/' + path.replace(/^\/?storage\/?/, '');
}

export default function PerdidoResults(props) {
  const { caso, matches, error } = props;
  const safeMatches = Array.isArray(matches) ? matches : [];
  const titleText = caso && String(caso.id || '').startsWith('tmp') ? 'Tu imagen' : 'Tu publicación';

  // flash 
  const { flash } = usePage().props;

    return (
    <>
      <Head title="Resultados similares" />

      <div className="container mx-auto p-4 max-w-5xl">
        {/* Mensajes flash (success / error) */}
        {flash?.success && (
          <MensajeFlash tipo="success">
            <div className="flex items-center justify-between">
              <div>{flash.success}</div>
              <Link href="/casos?view=mine" className="text-sm underline ml-4">Ir a Mis publicaciones</Link>
            </div>
          </MensajeFlash>
        )}

        {flash?.error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800">
            {flash.error}
          </div>
        )}

        <div className="p-4 mt-4 bg-gray-100 rounded">
          <div className="mb-4">
            <div className="inline-flex items-center gap-3 bg-cyan-100 border border-cyan-300 px-4 py-2 rounded-lg shadow-sm">
              <span className="w-1.5 h-6 bg-cyan-700 rounded" />
              <h2 className="text-xl font-semibold text-slate-900 m-0">{titleText}</h2>
            </div>
          </div>

          {/* Error de busqueda externa */}
          {error && <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">{error}</div>}

          {/* Resumen del caso buscado */}
          {caso && (
            <div className="mb-4 max-w-xl mx-auto">
              {String(caso.id || '').startsWith('tmp') ? (
                <div className="card-surface-alt rounded-xl overflow-hidden">
                  <div className="relative h-56 md:h-64">
                    <LoadingImagenes
                      src={makeImageUrl(caso.fotoAnimal)}
                      alt="Imagen subida para búsqueda"
                      wrapperClass="h-full w-full"
                      imgClass="object-contain object-center w-full h-full"
                      placeholderText="Cargando imagen..."
                    />
                  </div>
                  <div className="p-3 text-sm text-slate-600">Imagen utilizada para la búsqueda</div>
                </div>
              ) : (
                <TarjetaMisPublicaciones publicacion={caso} showEdit={false} onRemove={() => {}} />
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6 mb-3">
            <div className="inline-flex items-center gap-3 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg shadow-sm">
              <span className="w-1.5 h-5 bg-amber-600 rounded" />
              <h3 className="text-lg font-semibold text-slate-900 m-0">Resultados Similares</h3>
            </div>
            <span className="text-sm text-slate-600">{`(${safeMatches.length})`}</span>
          </div>

          {safeMatches.length === 0 ? (
            <div className="p-4 bg-yellow-100 rounded">
              <h4 className="text-base font-medium">No se encontraron coincidencias similares</h4>
              {caso && !String(caso.id || '').startsWith('tmp') && (
                <div className="mt-2">
                  <Link href={`/casos/${caso.id}`} className="text-blue-600 underline text-sm">
                    Ver detalle del caso enviado
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {safeMatches.map((m, index) => {
                // construir un objeto 'caso' compatible con TarjetaPublicaciones
                const imgSrcLocal = m.localCaso ? makeImageUrl(m.localCaso.fotoAnimal) : null;
                const imgSrcNyckel = m.data ? makeImageUrl(m.data) : null;
                const fotoAnimal = imgSrcLocal || imgSrcNyckel || null;

                const casoObj = m.localCaso ? {
                  id: m.localCaso.id,
                  descripcion: m.localCaso.descripcion || 'Sin descripción',
                  ciudad: m.localCaso.ciudad || null,
                  situacion: m.localCaso.situacion || null,
                  tipoAnimal: m.localCaso.tipoAnimal || null,
                  fotoAnimal: fotoAnimal,
                  fechaPublicacion: m.localCaso.fechaPublicacion || null,
                  usuario: m.localCaso.usuario || null,
                } : {
                  id: `external-${index}`,
                  descripcion: 'Coincidencia externa',
                  ciudad: null,
                  situacion: null,
                  tipoAnimal: null,
                  fotoAnimal: fotoAnimal,
                  fechaPublicacion: null,
                  usuario: null,
                };

                return (
                  <TarjetaPublicaciones key={casoObj.id} caso={casoObj} />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

PerdidoResults.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
    header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Resultado de la búsqueda</h2>}
  >
    {page}
  </AuthenticatedLayout>
);