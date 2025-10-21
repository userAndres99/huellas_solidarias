// resources/js/Pages/Admin/Solicitudes.jsx
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // ajusta la ruta si la tenés distinta
import { Head } from "@inertiajs/react";

export default function Solicitudes(props) {
  return (
    <AuthenticatedLayout auth={props.auth} errors={props.errors}>
      <Head title="Solicitudes" />
      <div className="p-6">
        <h1 className="text-2xl font-semibold">HOLA ADMIN</h1>
      </div>
    </AuthenticatedLayout>
  );
}
