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
      <div className="py-6">
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm sm:rounded-lg p-6">
            <FormCasos />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}