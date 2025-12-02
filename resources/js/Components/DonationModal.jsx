import React, { useState } from 'react';
import axios from 'axios';

export default function DonationModal({ open, onClose, organizacion, userEmail = null, requireEmail = true }) {
  const [monto, setMonto] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    // Abrir una pestaña en blanco inmediatamente para evitar bloqueadores de popups
    let popup = null;
    try {
      popup = window.open('', '_blank');
    } catch (e) {
      popup = null;
    }

    try {
      const getCsrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta && meta.getAttribute('content')) return meta.getAttribute('content');
        // fallback de la cookie
        const match = document.cookie.match(new RegExp('(^|; )' + 'XSRF-TOKEN' + '=([^;]*)'));
        if (match) {
          try {
            return decodeURIComponent(match[2]);
          } catch (e) {
            return match[2];
          }
        }
        return '';
      };

      axios.defaults.withCredentials = true;
      const payload = { organizacion_id: organizacion.id, monto: Number(monto) };
      if (requireEmail) {
        payload.payer_email = userEmail || email;
      }
      const token = getCsrfToken();

      let data;
      try {
        const hasSessionCookie = document.cookie.includes('huellas-solidarias-session') || document.cookie.includes('laravel_session');
        const hasXsrfCookie = document.cookie.includes('XSRF-TOKEN');
        if (!hasSessionCookie || !hasXsrfCookie) {
          try {
            await axios.get('/', { withCredentials: true });
          } catch (e) {
            //ignoramos errores 
          }
        }

        // Refrescar token CSRF antes de la solicitud POST
        let refreshedToken = getCsrfToken();
        try {
          const tResp = await axios.get('/csrf-token', { withCredentials: true });
          if (tResp?.data?.csrf_token) refreshedToken = tResp.data.csrf_token;
        } catch (e) {
          // ignorar y usar el valor de meta/cookie
        }

        const resp = await axios.post('/donar', payload, {
          headers: {
            'X-CSRF-TOKEN': refreshedToken,
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
          },
          withCredentials: true,
        });
        data = resp.data;
      } catch (axErr) {
        const msg = axErr?.response?.data?.message || axErr.message || 'Error al procesar la donación';
        throw new Error(msg);
      }
      // Si MP devolvió un init_point, redirigir al donante para completar el pago
      const redirectUrl = data.init_point || data.sandbox_init_point || null;
      if (redirectUrl) {
        // Cerrar el modal antes de redirigir (mejora UX y evita que quede abierto)
        try { onClose && onClose(true); } catch (e) {}

        // Si abrimos la pestaña en blanco antes, redirigimos esa pestaña al init_point
        try {
          if (popup && !popup.closed) {
            popup.location.href = redirectUrl;
          } else {
            // fallback: abrir nueva ventana
            window.open(redirectUrl, '_blank', 'noopener,noreferrer');
          }
        } catch (e) {
          try { window.open(redirectUrl, '_blank', 'noopener,noreferrer'); } catch (ee) { window.location.href = redirectUrl; }
        }
        return;
      }

      //cerramos el modal inmediatamente
      setMessage({ type: 'success', text: 'Donación iniciada correctamente. Revisá tu e-mail.' });
      setMonto('');
      if (!userEmail) setEmail('');
      try { onClose && onClose(true); } catch (e) {}
      setLoading(false);
    } catch (err) {
      // si hubo popup creado y hubo error, cerrarlo
      try { if (popup && !popup.closed) popup.close(); } catch (e) {}
      setMessage({ type: 'error', text: err.message || 'Error' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose && onClose(false)} />
      <div className="bg-white rounded-lg p-6 z-10 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Donar a {organizacion?.nombre}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm">Monto (ARS)</label>
            <div className="mt-1 flex items-center gap-3">
              <img src="/images/mercadopagologo.png" alt="Mercado Pago" className="h-6 w-auto" />
              <input type="number" min="1" required value={monto} onChange={e => setMonto(e.target.value)} className="flex-1 border p-2 rounded" />
            </div>
            <p className="text-xs text-gray-600 mt-2">El pago se realiza mediante Mercado Pago. La web retiene una comisión del 5% sobre lo donado.</p>
          </div>
          {requireEmail && !userEmail && (
            <div>
              <label className="text-sm">Tu e-mail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" />
            </div>
          )}
          {message && (
            <div className={`p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>
          )}
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={() => onClose && onClose(false)} className="px-3 py-1.5 bg-gray-200 rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded">{loading ? 'Procesando…' : 'Donar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
