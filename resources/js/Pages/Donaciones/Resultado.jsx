import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Resultado() {
  const { props } = usePage();
  const query = props.query || {};
  const donacion = props.donacion || null;
  const organizacion = props.organizacion || null;
  const status = query.status || 'unknown';

  const isSuccess = status === 'success' || query.collection_status === 'approved' || query.status === 'approved';
  const [showRaw, setShowRaw] = useState(false);

  const mapStatus = (s) => {
    const st = (s || '').toString().toLowerCase();
    if (!st || st === 'unknown' || st === 'null') return 'Desconocido';
    if (st === 'approved' || st === 'success') return 'Aprobada';
    if (st === 'pending') return 'Pendiente';
    if (st === 'in_process') return 'En proceso';
    if (st === 'rejected' || st === 'failure') return 'Rechazada';
    if (st === 'cancelled' || st === 'canceled') return 'Cancelada';
    return s;
  };

  const mapPaymentType = (t) => {
    const tt = (t || '').toString().toLowerCase();
    if (!tt) return t;
    if (tt === 'credit_card') return 'Tarjeta de crédito';
    if (tt === 'debit_card') return 'Tarjeta de débito';
    if (tt === 'account_money') return 'Saldo de Mercado Pago';
    if (tt === 'pix') return 'PIX';
    if (tt === 'bank_transfer') return 'Transferencia bancaria';
    if (tt === 'atm' || tt === 'ticket' || tt === 'ticket_voucher') return 'Pago en efectivo / cupón';
    return t;
  };

  const displayStatus = mapStatus(query.collection_status || query.status || status);

  return (
    <>
      <Head title="Resultado de donación" />

      <div className="max-w-3xl mx-auto p-6 card-surface min-h-full flex flex-col justify-center pt-8">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold mb-4">{isSuccess ? '¡Gracias por tu donación!' : 'Estado de la donación'}</h1>
          <p className="mb-4">Estado: <strong>{displayStatus}</strong></p>

          {isSuccess ? (
            <div className="mb-4 text-green-700">
              {donacion && organizacion ? (
                <>
                  <p className="mb-2">Gracias por aportar <strong>${Number(donacion.monto).toFixed(2)}</strong> a <strong>{organizacion.nombre}</strong>.</p>
                  <p className="text-sm">Siempre es necesario el apoyo de todos para seguir ayudando a los animales.</p>
                </>
              ) : (
                <p>La donación fue aprobada correctamente. Gracias por apoyar a la organización.</p>
              )}
            </div>
          ) : (
            <div className="mb-4 text-yellow-700">La donación no fue confirmada. Podés intentar nuevamente o contactarnos si creés que hay un error.</div>
          )}

          <div className="w-full text-left bg-gray-50 border rounded p-3 mb-4">
            <h3 className="font-medium mb-2">Resumen de la transacción</h3>
            <ul className="text-sm space-y-1 mb-2">
              <li><strong>Estado:</strong> {displayStatus}</li>
              {query.collection_id && <li><strong>ID de colección:</strong> {query.collection_id}</li>}
              {(query.payment_id || query.collection_id) && <li><strong>ID de pago:</strong> {query.payment_id || query.collection_id}</li>}
              {query.payment_type && <li><strong>Tipo de pago:</strong> {mapPaymentType(query.payment_type)}</li>}
              {query.preference_id && <li><strong>ID de preferencia:</strong> {query.preference_id}</li>}
              {query.site_id && <li><strong>Sitio:</strong> {query.site_id}</li>}
              {donacion && (
                <>
                  <li><strong>Monto:</strong> {new Intl.NumberFormat('es-AR', { style: 'currency', currency: (donacion.moneda || 'ARS') }).format(Number(donacion.monto || 0))}</li>
                  {donacion.email_donante && <li><strong>Email del donante:</strong> {donacion.email_donante}</li>}
                </>
              )}
            </ul>

            <button type="button" onClick={() => setShowRaw((s) => !s)} className="text-xs text-blue-600 hover:underline">
              {showRaw ? 'Ocultar detalles técnicos' : 'Mostrar detalles técnicos'}
            </button>

            {showRaw && (
              <pre className="text-xs max-h-64 overflow-auto mt-3 p-2 bg-white border rounded">{JSON.stringify(query, null, 2)}</pre>
            )}
          </div>

          <div className="flex justify-center gap-3 mt-2">
            <Link href="/" className="px-4 py-2 rounded bg-blue-600 text-white">Volver al inicio</Link>
            {donacion && donacion.payload_crudo && (function(){

              try {
                const payload = typeof donacion.payload_crudo === 'string' ? JSON.parse(donacion.payload_crudo) : donacion.payload_crudo;
                const receiptUrl = payload?.transaction_details?.external_resource_url || payload?.receipt?.receipt_url || payload?.point_of_interaction?.transaction_data?.ticket_url || null;
                if (receiptUrl) {
                  return (<a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded border">Ver comprobante</a>);
                }
              } catch (e) {
             
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </>
  );
}

Resultado.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
    header={<h2 className="text-xl font-semibold">Resultado de la donación</h2>}
  >
    {page}
  </AuthenticatedLayout>
);
