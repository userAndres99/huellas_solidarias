import React from 'react';

export default function MensajeFlash({ tipo = 'success', children }) {
  const base = 'mb-4 rounded p-4';
  const variants = {
    success: 'bg-green-50 border border-green-200 text-green-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
  };

  return (
    <div className={`${base} ${variants[tipo] || variants.info} card-surface shadow-sm`} role="status">
      {children}
    </div>
  );
}
