import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import FormHistoria from './HistoriaExito/FormHistoria';

export default function PublicarHistoria() {
  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicar Historia</h2>}
    >
      <Head title="Publicar Historia" />

      <div className="py-10 bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="bg-white shadow-md sm:rounded-lg p-8">
            <FormHistoria />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}