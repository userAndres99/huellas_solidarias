import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import FormCasos from '@/Components/FormCasos';

export default function PublicarCaso() {
  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicar Caso</h2>}
    >
      <Head title="Publicar Caso" />

      <div className="py-10 bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="bg-white shadow-md sm:rounded-lg p-8">
            <FormCasos />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}