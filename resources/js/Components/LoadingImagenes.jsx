import React, { useState, useEffect } from 'react';

/**
 * LoadingImagenes
 */
export default function LoadingImagenes({ src, alt = '', imgClass = '', wrapperClass = '', placeholderText = 'Cargando imagen...', onLoad = null, ...rest }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  if (!src) {
    return (
      <div className={`${wrapperClass} bg-[rgba(2,132,199,0.06)] flex items-center justify-center text-slate-500`}>
        Sin imagen
      </div>
    );
  }

  return (
    <div className={wrapperClass + ' relative overflow-hidden'}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center gap-2">
            <svg className="w-10 h-10 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.15" />
              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            {placeholderText && <div className="text-xs text-slate-500">{placeholderText}</div>}
          </div>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`${imgClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={async (e) => {
          try {
            if (e?.target?.decode) await e.target.decode();
          } catch (err) {
            // ignore
          } finally {
            setLoaded(true);
            if (typeof onLoad === 'function') onLoad(e);
          }
        }}
        onError={(e) => {
          setLoaded(true);
          if (typeof onLoad === 'function') onLoad(e);
        }}
        {...rest}
      />
    </div>
  );
}
