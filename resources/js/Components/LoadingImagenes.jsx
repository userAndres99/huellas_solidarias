import React, { useState, useEffect } from 'react';

/**
 * LoadingImagenes
 */
export default function LoadingImagenes({ src, alt = '', imgClass = '', wrapperClass = '', placeholderText = 'Cargando imagen...', onLoad = null, avatar = false, fallback = null, forceLoading = false, overlay = true, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if ((!src || failed) && !forceLoading) {
    return (
      <div className={`${wrapperClass} bg-[rgba(2,132,199,0.06)] flex items-center justify-center text-slate-500`}>
        Sin imagen
      </div>
    );
  }

  // Cuando se fuerza el loading, centramos el cargando
  if (forceLoading) {
    return (
      <div className={`${wrapperClass} flex items-center justify-center bg-gray-100`}>
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.15" />
            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass + ' relative overflow-hidden'}>
      
      {(() => {
        try {
          // try para ver si es URL absoluta
        } catch (e) {}
        return null;
      })()}
      
      {!avatar && src && (() => {
        let finalSrc = src;
        try {
          if (typeof finalSrc === 'string') {
            const s = finalSrc.trim();
            if (/^https?:\/\//i.test(s) || /^\/\//.test(s)) {
              finalSrc = s;
            } else if (s.startsWith('/')) {
              finalSrc = s;
            } else if (s.startsWith('storage/')) {
              finalSrc = '/' + s;
            } else if (s.startsWith('foto_animales/') || s.startsWith('usuarios/foto_animales/') || s.startsWith('uploads/') || s.startsWith('images/') || s.startsWith('historias/') || s.startsWith('historias\\')) {
              finalSrc = '/storage/' + s;
            } else if (s.indexOf('/') !== -1) {
              finalSrc = '/' + s;
            } else {
              finalSrc = '/storage/foto_animales/' + s;
            }
          }
        } catch (e) {
          finalSrc = src;
        }

        return (
          <div
            aria-hidden
            className="absolute inset-0 bg-center bg-cover blur-lg scale-105"
            style={{ backgroundImage: `url(${finalSrc})` }}
          />
        );
      })()}

      
      {!avatar && src && overlay && (
        <div aria-hidden className="absolute inset-0 bg-gray-800/30" />
      )}
      {!loaded && (
        (avatar || forceLoading) ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <svg className="w-4 h-4 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" />
              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.15" />
                <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              {placeholderText && <div className="text-xs text-slate-500">{placeholderText}</div>}
            </div>
          </div>
        )
      )}

      {!forceLoading && (() => {
        let finalSrc = src;
        try {
          if (typeof finalSrc === 'string') {
            const s = finalSrc.trim();
            if (/^https?:\/\//i.test(s) || /^\/\//.test(s)) {
              finalSrc = s;
            } else if (s.startsWith('/')) {
              finalSrc = s;
            } else if (s.startsWith('storage/')) {
              finalSrc = '/' + s;
            } else if (s.startsWith('foto_animales/') || s.startsWith('usuarios/foto_animales/') || s.startsWith('uploads/') || s.startsWith('images/') || s.startsWith('historias/') || s.startsWith('historias\\')) {
              finalSrc = '/storage/' + s;
            } else if (s.indexOf('/') !== -1) {
              finalSrc = '/' + s;
            } else {
              finalSrc = '/storage/foto_animales/' + s;
            }
          }
        } catch (e) {
          finalSrc = src;
        }

        return (
          <img
            src={finalSrc}
          alt={alt}
          className={`${imgClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} relative z-20`}
          onLoad={async (e) => {
            try {
              if (e?.target?.decode) await e.target.decode();
            } catch (err) {
              
            } finally {
              setLoaded(true);
              // imagen cargada
              if (typeof onLoad === 'function') onLoad(e);
            }
          }}
          onError={(e) => {
            try {
              if (fallback && e?.currentTarget) {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallback;
                return;
              }
            } catch (err) {
              
            }

            setFailed(true);
            setLoaded(true);
            if (typeof onLoad === 'function') onLoad(e);
          }}
          {...rest}
          />
        );
      })()}
    </div>
  );
}
