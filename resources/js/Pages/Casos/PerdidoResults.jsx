import React from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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

  // flash 
  const { flash } = usePage().props;

  return (
    <AuthenticatedLayout
      {...props}
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Resultados similares</h2>}
    >
      <Head title="Resultados similares" />

      <div className="container mx-auto p-4 max-w-5xl">
        {/* Mensajes flash (success / error) */}
        {flash?.success && (
            <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-800 flex items-center justify-between">
            <div>{flash.success}</div>
            <Link href="/casos?view=mine" className="text-sm underline ml-4">Ir a Mis publicaciones</Link>
          </div>
        )}

        {flash?.error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800">
            {flash.error}
          </div>
        )}

        {/* Si no hay matches y no hay error */}
        {safeMatches.length === 0 && !error ? (
          <div className="p-4 mt-4 bg-yellow-100 rounded">
            <h2 className="text-lg font-semibold">No se encontraron coincidencias similares</h2>
            {caso && (
              <div className="mt-3">
                <Link href={`/casos/${caso.id}`} className="text-blue-600 underline text-sm">
                  Ver detalle del caso enviado
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 mt-4 bg-gray-100 rounded">
            <h2 className="text-xl font-bold mb-4">Resultados similares a tu mascota</h2>

            {/* Error de busqueda externa */}
            {error && <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">{error}</div>}

            {/* Resumen del caso buscado */}
            {caso && (
              <div className="mb-4 flex items-center gap-4 bg-white p-3 rounded shadow">
                <div className="w-20 h-20 bg-gray-100 overflow-hidden rounded">
                  {caso.fotoAnimal ? (
                    <img
                      src={makeImageUrl(caso.fotoAnimal)}
                      alt="Caso buscado"
                      className="object-cover w-full h-full"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">Sin imagen</div>
                  )}
                </div>
                <div>
                  <div className="font-semibold">{caso.tipoAnimal || 'Animal'}</div>
                  <div className="text-sm text-gray-700 line-clamp-2">{caso.descripcion}</div>
                  <div className="text-xs text-gray-500 mt-1">{caso.ciudad} · {caso.situacion}</div>
                  <div className="mt-2">
                    <Link href={`/casos/${caso.id}`} className="text-blue-600 text-sm underline">Ver detalle del caso</Link>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {safeMatches.map((m, index) => {
                // prioridad: 1) foto del caso local (si existe y ya viene como URL) o sino 2) imagen traida por Nyckel 
                const imgSrcLocal = m.localCaso ? makeImageUrl(m.localCaso.fotoAnimal) : null;
                const imgSrcNyckel = m.data ? makeImageUrl(m.data) : null;
                const imgSrc = imgSrcLocal || imgSrcNyckel || null;

                // calcular porcentaje de similitud
                let similarityPct = null;
                if (typeof m.similarity === 'number') similarityPct = m.similarity;
                else if (typeof m.rawSimilarity === 'number') similarityPct = m.rawSimilarity;
                else if (typeof m.score === 'number') similarityPct = m.score * 100;

                return (
                  <div key={index} className="bg-white border rounded shadow overflow-hidden flex flex-col">
                    <div className="h-40 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={`match-${index}`}
                          className="object-cover w-full h-full"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="text-gray-500">Sin imagen</div>
                      )}
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        {m.localCaso ? (
                          <>
                            <div className="font-medium mb-1 line-clamp-2">{m.localCaso.descripcion || 'Sin descripción'}</div>
                            <div className="text-sm text-gray-600 mb-2">{m.localCaso.ciudad || 'Ciudad desconocida'}</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-600 mb-2">Coincidencia externa</div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {m.localCaso ? (
                          <Link href={`/casos/${m.localCaso.id}`} className="text-blue-600 text-sm">Ver detalle</Link>
                        ) : (
                          <span className="text-xs text-gray-500">Fuente externa</span>
                        )}

                        {similarityPct !== null ? (
                          <div className="text-xs text-gray-700">Similitud: {Number(similarityPct).toFixed(2)}%</div>
                        ) : (
                          <div className="text-xs text-gray-400">Sin score</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}