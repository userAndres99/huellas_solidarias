import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function SolicitudesShow({ auth, errors, solicitud }) {
  const [processing, setProcessing] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const submitStatus = (status) => {
    if (!confirm(`¿Confirmar ${status === 'approved' ? 'aprobación' : 'rechazo'} de la solicitud #${solicitud.id}?`)) return;

    setProcessing(true);

    router.post(
      route('admin.solicitudes.update_status', solicitud.id),
      { 
        status, 
        response_message: responseMessage 
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          alert(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} correctamente.`);
          window.location.href = route('admin.solicitudes.index');
        },
        onError: () => setProcessing(false),
        onFinish: () => setProcessing(false),
      }
    );
  };

  return (
    <>
      <Head title={`Solicitud #${solicitud.id}`} />

      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Solicitud #{solicitud.id}</h1>

        <div className="mb-4">
          <strong>Solicitante:</strong> {solicitud.user?.name} ({solicitud.user?.email})
        </div>

        <div className="mb-2">
          <strong>Organización:</strong> {solicitud.organization_name ?? '—'}
        </div>

        <div className="mb-2">
          <strong>Teléfono / Email:</strong> {solicitud.organization_phone ?? '—'} / {solicitud.organization_email ?? '—'}
        </div>

        <div className="mb-4">
          <strong>Mensaje:</strong>
          <p className="mt-1 text-gray-700">{solicitud.message ?? '—'}</p>
        </div>

        {solicitud.documents?.length > 0 && (
          <div className="mb-4">
            <strong>Documentos:</strong>
            <ul className="mt-2 space-y-1">
              {solicitud.documents.map((d, i) => (
                <li key={i}>
                  <a
                    href={`/storage/${d}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline"
                  >
                    Ver documento {i + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Mensaje de respuesta (opcional)</label>
          <textarea
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            className="mt-1 w-full rounded border-gray-300"
          />
        </div>

        <div className="flex gap-3">
          <PrimaryButton 
            onClick={() => submitStatus('approved')} 
            disabled={processing}
          >
            Aprobar
          </PrimaryButton>

          <button
            onClick={() => submitStatus('rejected')}
            className="inline-flex items-center rounded border px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700"
            disabled={processing}
          >
            Rechazar
          </button>

          <Link 
            href={route('admin.solicitudes.index')} 
            className="ml-auto text-sm underline text-gray-600"
          >
            Volver
          </Link>
        </div>
      </div>
    </>
  );
}

SolicitudesShow.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
  >
    {page}
  </AuthenticatedLayout>
);