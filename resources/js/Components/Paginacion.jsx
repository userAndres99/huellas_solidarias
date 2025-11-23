import React from 'react';

export default function Paginacion({ meta, links, onPage }) {
  if (!meta) return null;

  const current = meta.current_page;
  const last = meta.last_page;

  const delta = 2;
  let start = Math.max(1, current - delta);
  let end = Math.min(last, current + delta);

  if (current <= 2) end = Math.min(last, 5);
  if (current >= last - 1) start = Math.max(1, last - 4);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 mb-4 gap-3">
      <div className="text-sm text-gray-800 font-semibold text-center sm:text-left">
        Mostrando página {meta.current_page} de {meta.last_page} · {meta.total} resultados
      </div>

      <div className="flex items-center gap-2 sm:hidden">
        <button
          onClick={() => onPage(1)}
          disabled={current === 1}
          className="px-2 py-1 border border-black rounded bg-[#C8E7F5] text-black disabled:opacity-50"
        >
          «
        </button>

        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="px-2 py-1 border border-black rounded bg-[#C8E7F5] text-black disabled:opacity-50"
        >
          ‹
        </button>

        <select
          value={current}
          onChange={e => onPage(Number(e.target.value))}
          className="border border-black px-2 py-1 rounded w-20 text-center bg-[#C8E7F5] text-black"
        >
          {Array.from({ length: last }, (_, i) => i + 1).map(p => (
            <option key={p} value={p}>{p}/{last}</option>
          ))}
        </select>

        <button
          onClick={() => onPage(current + 1)}
          disabled={current === last}
          className="px-2 py-1 border border-black rounded bg-[#C8E7F5] text-black disabled:opacity-50"
        >
          ›
        </button>

        <button
          onClick={() => onPage(last)}
          disabled={current === last}
          className="px-2 py-1 border border-black rounded bg-[#C8E7F5] text-black disabled:opacity-50"
        >
          »
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={() => onPage(1)}
          disabled={current === 1}
          className="px-2 py-1 border border-black rounded bg-[#C8E7F5] text-black disabled:opacity-50"
        >
          « Primero
        </button>

        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="px-2 py-1 border border-black rounded bg-[#C8E7F5] text-black disabled:opacity-50"
        >
          ‹ Anterior
        </button>

        {pages[0] > 1 && <span className="px-2">…</span>}

        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`px-3 py-1 border border-black rounded text-black bg-[#C8E7F5] ${p === current ? 'font-semibold scale-105' : ''}`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length -1] < last && <span className="px-2">…</span>}

        <button
          onClick={() => onPage(current + 1)}
          disabled={current === last}
          className="px-2 py-1 border border-black rounded bg-[#C8E7F5] text-black disabled:opacity-50"
        >
          Siguiente ›
        </button>

        <button
          onClick={() => onPage(last)}
          disabled={current === last}
          className="px-2 py-1 border border-black rounded bg-[#C8E7F5] text-black disabled:opacity-50"
        >
          Último »
        </button>
      </div>
    </div>
  );
}