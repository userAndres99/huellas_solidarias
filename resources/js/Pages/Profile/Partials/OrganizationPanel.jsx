import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage, useForm } from '@inertiajs/react';

import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function OrganizationPanel() {
    const user = usePage().props.auth?.user;

    // Mostrar solo si el usuario es de tipo organizacion
    const isOrg = user && (user.role_name === 'Organizacion' || user.rol_id === 2);

    if (!isOrg) return null;

    const initialOrg = user?.organizacion ?? null;

    const {
        data: orgData,
        setData: setOrgData,
        processing: orgProcessing,
    } = useForm({
        nombre: initialOrg?.nombre ?? '',
        email: initialOrg?.email ?? '',
        telefono: initialOrg?.telefono ?? '',
        descripcion: initialOrg?.descripcion ?? '',
    });

    const [orgSaved, setOrgSaved] = useState(false);

    // sincronizar si cambia la organizacion 
    useEffect(() => {
        setOrgData('nombre', user?.organizacion?.nombre ?? '');
        setOrgData('email', user?.organizacion?.email ?? '');
        setOrgData('telefono', user?.organizacion?.telefono ?? '');
        setOrgData('descripcion', user?.organizacion?.descripcion ?? '');
    }, [user.organizacion]);

    const submitOrganization = (e) => {
        e.preventDefault();

        if (!user?.organizacion_id) return;

        const formData = new FormData();
        formData.append('_method', 'PATCH');
        formData.append('nombre', orgData.nombre ?? '');
        formData.append('email', orgData.email ?? '');
        formData.append('telefono', orgData.telefono ?? '');
        formData.append('descripcion', orgData.descripcion ?? '');

        Inertia.post(route('organizacion.update'), formData, {
            onSuccess: () => {
                Inertia.reload({ only: ['auth'] });
                window.dispatchEvent(new Event('profile-updated'));
                setOrgSaved(true);
                setTimeout(() => setOrgSaved(false), 3000);
            },
            onError: (errors) => {
                console.error('Errores al actualizar organización:', errors);
            },
        });
    };

    return (
        <section>
            <div className="rounded-md border border-gray-200 bg-green-50 p-4">
                <h3 className="text-lg font-semibold text-gray-800">Información de la organización</h3>
                <p className="mt-1 text-sm text-gray-700">Podés editar el nombre, correo, teléfono y descripción de tu organización.</p>

                <form onSubmit={submitOrganization} className="mt-4 space-y-4">
                    <div>
                        <InputLabel htmlFor="org_nombre" value="Nombre de la organización" />
                        <TextInput
                            id="org_nombre"
                            className="mt-1 block w-full"
                            value={orgData.nombre}
                            onChange={(e) => setOrgData('nombre', e.target.value)}
                        />
                        <InputError className="mt-2" message={null} />
                    </div>

                    <div>
                        <InputLabel htmlFor="org_email" value="Correo de la organización" />
                        <TextInput
                            id="org_email"
                            type="email"
                            className="mt-1 block w-full"
                            value={orgData.email}
                            onChange={(e) => setOrgData('email', e.target.value)}
                        />
                        <InputError className="mt-2" message={null} />
                    </div>

                    <div>
                        <InputLabel htmlFor="org_telefono" value="Teléfono" />
                        <TextInput
                            id="org_telefono"
                            className="mt-1 block w-full"
                            value={orgData.telefono}
                            onChange={(e) => setOrgData('telefono', e.target.value)}
                        />
                        <InputError className="mt-2" message={null} />
                    </div>

                    <div>
                        <InputLabel htmlFor="org_descripcion" value="Descripción" />
                        <textarea
                            id="org_descripcion"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={orgData.descripcion}
                            onChange={(e) => setOrgData('descripcion', e.target.value)}
                        />
                        <InputError className="mt-2" message={null} />
                    </div>

                    <div className="flex items-center gap-4">
                        <PrimaryButton type="submit" disabled={orgProcessing}>Guardar organización</PrimaryButton>
                        {orgSaved && (
                            <p className="text-sm text-gray-600">Guardado.</p>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}
