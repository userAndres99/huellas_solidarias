import React from 'react';
import CalendarPage from './Calendar';
import { Link, Head } from "@inertiajs/react";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';


export default function Index({ events }) {
  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Panel de organización</h2>}
    >
      <Head title="Panel de organización" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm sm:rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Panel de organización</h1>
              <Link href={route('organizacion.eventos.create')}>Nuevo evento</Link>
            </div>

            <CalendarPage events={events} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}