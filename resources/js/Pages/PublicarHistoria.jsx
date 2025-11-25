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

      <FormHistoria />
    </AuthenticatedLayout>
  );
}