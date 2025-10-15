import React from 'react';

export default function PerdidoResults({ caso, matches, error }) {
  if ((!matches || matches.length === 0) && !error) {
    return (
      <div className="p-4 mt-4 bg-yellow-100 rounded">
        <h2 className="text-lg font-semibold">No se encontraron coincidencias similares</h2>
      </div>
    );
  }

  return (
    <div className="p-4 mt-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-4">Resultados similares a tu mascota</h2>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {matches.map((m, index) => {
          const imgSrc = m.data || (m.localCaso && (m.localCaso.fotoAnimal ? m.localCaso.fotoAnimal.startsWith('http') ? m.localCaso.fotoAnimal : (window.location.origin + '/storage/' + m.localCaso.fotoAnimal.replace(/^\/?storage\/?/, '')) : null)) || null;

          return (
            <div key={index} className="border p-2 rounded shadow flex flex-col items-center">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={`match-${index}`}
                  className="w-32 h-32 object-cover rounded mb-2"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-300 flex items-center justify-center mb-2">
                  Sin imagen
                </div>
              )}

              <div className="text-center">
                {m.localCaso ? (
                  <>
                    <p className="font-semibold text-sm">Descripción:</p>
                    <p className="text-sm">{m.localCaso.descripcion}</p>
                    <p className="text-xs text-gray-500">Ciudad: {m.localCaso.ciudad}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Coincidencia externa</p>
                )}
                {m.score !== undefined && m.score !== null && (
                  <p className="text-xs text-gray-700 mt-1">Similitud: {Number(m.score).toFixed(2)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}