import React from 'react';
import { useState } from 'react';
import CalendarPage from './Calendar';
import Agenda from './Agenda';
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold">Panel de organización</h1>
                    <p className="text-sm text-gray-500">Tus próximos eventos y agenda</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={route('organizacion.eventos.create')} className="px-3 py-1.5 bg-blue-600 text-white rounded-md">Nuevo evento</Link>
                  </div>
                </div>

                <div className="mt-4">
                  <OrgContent events={events} />
                </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
function OrgContent({ events }) {
  const [view, setView] = useState('calendar');

  return (
    <div>
      <div className="mb-4">
        <div className="flex gap-2 items-center">
          <button onClick={() => setView('calendar')} className={`px-3 py-1 rounded ${view==='calendar' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Calendario</button>
          <button onClick={() => setView('agenda')} className={`px-3 py-1 rounded ${view==='agenda' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Agenda</button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarPage events={events} />
      ) : (
        <Agenda events={events} />
      )}
    </div>
  );
}