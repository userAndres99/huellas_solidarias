// una funcion que muestra un cuadro de confirmación personalizado
export default function confirmToast(message, { confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' } = {}) {
  return new Promise((resolve) => {
    try {
      const EXISTING_ID = 'hs-confirm-toast-root';
      // si ya hay un cuadro de confirmación abierto, no abrir otro
      if (document.getElementById(EXISTING_ID)) return resolve(false);

      const root = document.createElement('div');
      root.id = EXISTING_ID;
      // hacer que root ocupe toda la pantalla para poder renderizar un modal centrado con fondo
      root.style.position = 'fixed';
      root.style.inset = '0';
      root.style.zIndex = 99999;
      root.style.display = 'flex';
      root.style.alignItems = 'center';
      root.style.justifyContent = 'center';

      // contenedor del modal: centrado, con un ancho máximo para que no ocupe toda la pantalla en escritorio
      root.innerHTML = `
        <div data-action="backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(1px);"></div>
        <div role="dialog" aria-modal="true" class="z-10" style="width: min(560px, 92%); max-width: 560px; border-radius: 0.5rem; overflow: hidden; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.06);">
          <div style="padding:16px; font-size:14px; color: #1f2937;">${String(message)}</div>
          <div style="display:flex; justify-content:flex-end; gap:8px; padding:8px; border-top:1px solid rgba(0,0,0,0.04); background:#f9fafb;">
            <button data-action="cancel" style="padding:6px 12px; border-radius:6px; font-size:13px; color:#374151; background:transparent; border: none; cursor:pointer;">${cancelLabel}</button>
            <button data-action="confirm" style="padding:6px 12px; border-radius:6px; font-size:13px; color:#fff; background:#dc2626; border:none; cursor:pointer;">${confirmLabel}</button>
          </div>
        </div>
      `;

      function cleanup(result) {
        try { document.body.removeChild(root); } catch (e) {}
        resolve(Boolean(result));
      }

      root.addEventListener('click', (ev) => {
        const action = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-action');
        if (!action) return;
        if (action === 'confirm') cleanup(true);
        else cleanup(false);
      });

      // manejar Esc para cancelar
      function onKey(e) {
        if (e.key === 'Escape') { cleanup(false); }
      }

      document.addEventListener('keydown', onKey);

      // Asegurar que cleanup también remueva el listener de teclas
      const originalCleanup = cleanup;
      cleanup = function (result) {
        document.removeEventListener('keydown', onKey);
        try { document.body.removeChild(root); } catch (e) {}
        resolve(Boolean(result));
      };

      document.body.appendChild(root);
      // enfocar el primer botón (confirmar) para accesibilidad
      const btn = root.querySelector('button[data-action="confirm"]');
      if (btn && btn.focus) btn.focus();
    } catch (e) {
      // fallback al confirm nativo si algo falla
      try { resolve(window.confirm(message)); } catch (err) { resolve(false); }
    }
  });
}
