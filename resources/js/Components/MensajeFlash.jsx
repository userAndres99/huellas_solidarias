import React from 'react';
import '@/../css/components/form3D.css';

export default function MensajeFlash({ tipo = 'success', children }) {
  const variantClass = tipo === 'error' ? 'flash-error' : tipo === 'info' ? 'flash-info' : 'flash-success';

  const icon = (() => {
    if (tipo === 'error') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2.47-9.53a.75.75 0 011.06 0L10 9.94l1.41-1.47a.75.75 0 111.06 1.06L11.06 11l1.47 1.41a.75.75 0 11-1.06 1.06L10 12.06l-1.41 1.47a.75.75 0 11-1.06-1.06L8.94 11 7.47 9.59a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      );
    }

    if (tipo === 'info') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M9 9h1v5H9V9z" />
          <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM9 7h2v1H9V7z" />
        </svg>
      );
    }

    // success
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  })();

  return (
    <div className="w-full flex justify-center mb-4" role="status" aria-live="polite">
      <div className={`flash-3d ${variantClass}`}>
        <div className="flash-inner p-3">
          <div className="flash-icon" aria-hidden>
            {icon}
          </div>
          <div className="flash-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
