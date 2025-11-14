import React, { useState } from 'react';
import axios from 'axios';

export default function DonationModal({ open, onClose, organizacion, userEmail = null }) {
  const [monto, setMonto] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

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
      const payload = { organizacion_id: organizacion.id, monto: Number(monto), payer_email: userEmail || email };
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
        // Abrir en la misma pestaña para que continúe el flujo de pago
        window.location.href = redirectUrl;
        return;
      }

      setMessage({ type: 'success', text: 'Donación iniciada correctamente. Revisá tu e-mail.' });
      setMonto('');
      if (!userEmail) setEmail('');
      setTimeout(() => { setLoading(false); onClose && onClose(true); }, 1200);
    } catch (err) {
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
            <input type="number" min="1" required value={monto} onChange={e => setMonto(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          {!userEmail && (
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
            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded">{loading ? 'Procesando…' : 'Donar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
