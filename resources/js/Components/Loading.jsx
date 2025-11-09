import React from 'react';

export default function Loading({ variant = 'centered', message = 'Cargando...', cards = 6 }) {
  // Loader centrado
  if (variant === 'centered') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.15" />
                <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-lg font-semibold text-gray-800">{message}</div>
            <div className="mt-2 text-sm text-gray-500">Cargando contenido. Esto puede tardar unos segundos.</div>
            <div className="mt-4 w-full h-2 bg-gray-100 rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 animate-loading-bar" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Esqueleto de tarjetas
  if (variant === 'skeleton') {
    const items = Array.from({ length: cards });
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl p-4 shadow-sm">
            <div className="bg-gray-200 rounded-md h-40 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-24 mt-4" />
          </div>
        ))}
      </div>
    );
  }

  // Spinner por defecto centrado
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      {message && <p className="mt-3 text-gray-600">{message}</p>}
    </div>
  );
}