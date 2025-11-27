import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import Modal from '@/Components/Modal';

export default function SolicitudesShow({ auth, errors, solicitud }) {
  const [processing, setProcessing] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const submitStatus = (status) => {
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
          window.location.href = route('admin.solicitudes.index');
        },
        onError: () => setProcessing(false),
        onFinish: () => setProcessing(false),
      }
    );
  };

  const openConfirm = (action) => {
    setPendingAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (!pendingAction) return;
    setShowConfirm(false);
    submitStatus(pendingAction);
    setPendingAction(null);
  };

  return (
    <>
      <Head title={`Solicitud #${solicitud.id}`} />

      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Solicitud #{solicitud.id}</h1>

        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-3 gap-4 items-start">
              <div className="text-sm font-medium text-gray-700">Solicitante</div>
              <div className="col-span-2 text-sm text-gray-900">{solicitud.user?.name} <span className="text-gray-500">({solicitud.user?.email})</span></div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              <div className="text-sm font-medium text-gray-700">Organización</div>
              <div className="col-span-2 text-sm text-gray-900">{solicitud.organization_name ?? '—'}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              <div className="text-sm font-medium text-gray-700">Teléfono / Email</div>
              <div className="col-span-2 text-sm text-gray-900">{solicitud.organization_phone ?? '—'} <span className="text-gray-500">/ {solicitud.organization_email ?? '—'}</span></div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              <div className="text-sm font-medium text-gray-700">Mensaje</div>
              <div className="col-span-2 text-sm text-gray-900 whitespace-pre-line">{solicitud.message ?? '—'}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              <div className="text-sm font-medium text-gray-700">Documentación</div>
              <div className="col-span-2 text-sm">
                {solicitud.documents?.length > 0 ? (
                  <ul className="space-y-2">
                    {solicitud.documents.map((d, i) => (
                      <li key={i}>
                        <a
                          href={`/storage/${d}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 underline"
                        >
                          Documento {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">Sin documentación</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              <label className="text-sm font-medium text-gray-700">Mensaje de respuesta (opcional)</label>
              <div className="col-span-2">
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 resize-vertical min-h-[120px] text-sm text-gray-900"
                  placeholder="Escriba una respuesta para el solicitante (opcional)"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => openConfirm('approved')}
              disabled={processing}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-60"
            >
              Aprobar
            </button>

            <button
              onClick={() => openConfirm('rejected')}
              disabled={processing}
              className="inline-flex items-center px-4 py-2 border border-red-600 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 disabled:opacity-60"
            >
              Rechazar
            </button>

            <Link
              href={route('admin.solicitudes.index')}
              className="ml-auto inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:underline"
            >
              Volver
            </Link>
          </div>
        </div>
          <Modal show={showConfirm} onClose={() => setShowConfirm(false)} maxWidth="md">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Confirmar acción</h3>
              <p className="mt-2 text-sm text-gray-700">¿Estás seguro que querés {pendingAction === 'approved' ? 'aprobar' : 'rechazar'} la solicitud #{solicitud.id}?</p>

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-md border text-sm text-gray-700">Cancelar</button>
                <button onClick={handleConfirm} className={`px-4 py-2 rounded-md text-sm font-medium ${pendingAction === 'approved' ? 'bg-green-600 text-white hover:bg-green-700' : 'border border-red-600 text-red-600 hover:bg-red-50'}`}>Confirmar</button>
              </div>
            </div>
          </Modal>
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