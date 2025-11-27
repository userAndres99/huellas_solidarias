import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import FormCasos from '@/Components/FormCasos';

export default function PublicarCaso() {
  return (
    <>
      <Head title="Publicar Caso" />

      <div className="py-10 bg-[#C9E8F6] min-h-screen">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <FormCasos />
        </div>
      </div>
    </>
  );
}

PublicarCaso.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
    header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Publicar Caso</h2>}
  >
    {page}
  </AuthenticatedLayout>
);