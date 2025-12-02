import React, { useState, useEffect, useRef } from 'react';

export default function Carrusel3D({ items = [], renderItem, horizontal = false }) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const itemRefs = useRef([]);
  const [measuredWidth, setMeasuredWidth] = useState(null);

  useEffect(() => {
    const onResize = () => {
      try { setIsNarrow(window.innerWidth < 640); } catch (e) {}
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // useEffect para medir el ancho de una tarjeta
  useEffect(() => {
    const measure = () => {
      try {
        const el = itemRefs.current.find(Boolean);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width && rect.width !== measuredWidth) setMeasuredWidth(rect.width);
        }
      } catch (e) {
        // ignore
      }
    };

    measure();
    let ro = null;
    try {
      ro = new ResizeObserver(measure);
      if (containerRef.current) ro.observe(containerRef.current);
    } catch (e) {
      
      window.addEventListener('resize', measure);
    }

    return () => {
      try { if (ro) ro.disconnect(); } catch (e) {}
      try { window.removeEventListener('resize', measure); } catch (e) {}
    };
  }, [items, isNarrow, measuredWidth]);

  const cardWidth = horizontal ? (isNarrow ? 360 : 520) : (isNarrow ? 200 : 260);
  const cardHeight = horizontal ? (isNarrow ? 260 : 300) : (isNarrow ? 320 : 420);

  // si no hay items, mostramos nada
  const defaultHorizontalSpacing = isNarrow ? 260 : 300;
  const computedHorizontalSpacing = measuredWidth ? Math.max(defaultHorizontalSpacing, Math.round(measuredWidth * 0.95)) : defaultHorizontalSpacing;
  const xSpacing = horizontal ? computedHorizontalSpacing : (isNarrow ? 180 : 260);
  const zBase = horizontal ? (isNarrow ? 90 : 120) : (isNarrow ? 100 : 150);
  const zStep = horizontal ? (isNarrow ? 70 : 100) : (isNarrow ? 90 : 120);
  const rotateYStep = horizontal ? (isNarrow ? -15 : -20) : (isNarrow ? -25 : -35);

  const prev = () => setIndex((i) => (i === 0 ? items.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === items.length - 1 ? 0 : i + 1));

  
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    let startX = 0;

    const start = (e) => (startX = e.touches ? e.touches[0].clientX : e.clientX);
    const end = (e) => {
      const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const diff = endX - startX;
      if (diff > 40) prev();
      if (diff < -40) next();
    };

    c.addEventListener('mousedown', start);
    c.addEventListener('mouseup', end);
    c.addEventListener('touchstart', start);
    c.addEventListener('touchend', end);

    return () => {
      c.removeEventListener('mousedown', start);
      c.removeEventListener('mouseup', end);
      c.removeEventListener('touchstart', start);
      c.removeEventListener('touchend', end);
    };
  }, [items.length, isNarrow]);

  return (
    <div className="relative w-full py-8">
      <div
        ref={containerRef}
        className="relative flex items-center justify-center overflow-visible"
        style={{ perspective: '1200px', height: cardHeight + 60 }}
      >
        {items.map((item, i) => {
          const offset = i - index;
          const abs = Math.abs(offset);

          const transform = `
            translateX(${offset * xSpacing}px)
            translateZ(${zBase - abs * zStep}px)
            rotateY(${offset * rotateYStep}deg)
          `;

          return (
            <div
              key={i}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="absolute transition-all duration-700"
              style={{
                transform,
                opacity: abs > 2 ? 0 : 1,
                pointerEvents: abs === 0 ? 'auto' : 'none',
              }}
            >
              {renderItem(item)}
            </div>
          );
        })}
      </div>

      {/* BOTONES */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 px-3 py-2 rounded-full shadow"
      >
        ◀
      </button>

      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 px-3 py-2 rounded-full shadow"
      >
        ▶
      </button>
    </div>
  );
}
