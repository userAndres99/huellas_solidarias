import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage, useForm } from '@inertiajs/react';

import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import Modal from '@/Components/Modal';
import axios from 'axios';

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

    // detectar si la organización ya tiene cuenta MP vinculada 
    const hasMpAccount = user?.organizacion && (
        Boolean(user.organizacion.mp_user_id) || Boolean(user.organizacion.mp_cuenta?.mp_user_id)
    );

    // sincronizar si cambia la organizacion 
    useEffect(() => {
        setOrgData('nombre', user?.organizacion?.nombre ?? '');
        setOrgData('email', user?.organizacion?.email ?? '');
        setOrgData('telefono', user?.organizacion?.telefono ?? '');
        setOrgData('descripcion', user?.organizacion?.descripcion ?? '');
    }, [user.organizacion]);

    const submitOrganization = async (e) => {
        e.preventDefault();

        if (!user?.organizacion_id) return;

        try {
            const formData = new FormData();
            formData.append('_method', 'PATCH');
            formData.append('nombre', orgData.nombre ?? '');
            formData.append('email', orgData.email ?? '');
            formData.append('telefono', orgData.telefono ?? '');
            formData.append('descripcion', orgData.descripcion ?? '');

            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const headers = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            };

            const res = await fetch(route('organizacion.update'), {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: formData,
            });

            if (!res.ok) {
                // si 419, intentar refrescar token y reintentar
                if (res.status === 419) {
                    try {
                        const tResp = await fetch('/csrf-token', { credentials: 'same-origin' });
                        if (tResp.ok) {
                            const tjson = await tResp.json();
                            if (tjson.csrf_token) {
                                document.querySelectorAll('meta[name="csrf-token"]').forEach(m => m.setAttribute('content', tjson.csrf_token));
                            }
                        }
                    } catch (e) {}

                    const retryHeaders = {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(token ? { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') } : {}),
                    };

                    const retry = await fetch(route('organizacion.update'), {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: retryHeaders,
                        body: formData,
                    });
                    if (retry.ok) {
                        setOrgSaved(true);
                        window.dispatchEvent(new Event('profile-updated'));
                        setTimeout(() => setOrgSaved(false), 3000);
                        return;
                    }
                }

                // tratar errores JSON si vienen
                try {
                    const json = await res.json();
                    console.error('Errores al actualizar organización:', json);
                } catch (e) {
                    console.error('Error al actualizar organización, status:', res.status);
                }
                return;
            }

            
            setOrgSaved(true);
            window.dispatchEvent(new Event('profile-updated'));
            setTimeout(() => setOrgSaved(false), 3000);
        } catch (err) {
            console.error('Error de red al actualizar organización:', err);
        }
    };

    const [disconnectOpen, setDisconnectOpen] = useState(false);

    const doDisconnect = async () => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (token) {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
            }

            await axios.post(route('mercadopago.disconnect'));

            setDisconnectOpen(false);
            window.dispatchEvent(new Event('profile-updated'));
        } catch (err) {
            console.error('Error al desvincular cuenta MP:', err);
            setDisconnectOpen(false);
        }
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

                    <div className="mt-4">
                        {hasMpAccount ? (
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                                    <span>Cuenta de Mercado Pago conectada</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setDisconnectOpen(true)}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:shadow"
                                >
                                    Desvincular cuenta
                                </button>

                                <Modal show={disconnectOpen} onClose={() => setDisconnectOpen(false)} maxWidth="md">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold mb-2 text-gray-900">Desvincular cuenta de Mercado Pago</h3>
                                        <p className="text-sm text-gray-600 mb-4">Si desvinculas tu cuenta no podrás recibir más donaciones hasta que vuelvas a vincular una cuenta nuevamente. ¿Deseás continuar?</p>

                                        <div className="flex justify-end gap-3">
                                            <button type="button" onClick={() => setDisconnectOpen(false)} className="px-4 py-2 rounded bg-white border text-sm">No, volver</button>
                                            <button type="button" onClick={doDisconnect} className="px-4 py-2 rounded text-sm font-semibold bg-red-600 text-white">Sí, desvincular</button>
                                        </div>
                                    </div>
                                </Modal>
                            </div>
                        ) : (
                            <a href={route('mercadopago.connect')} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:shadow">
                                <img src="/images/mercadopagologo.png" alt="Mercado Pago" className="h-5" />
                                <span>Conectar Mercado Pago</span>
                            </a>
                        )}

                        <p className="mt-2 text-sm text-gray-700">Al vincular su cuenta de Mercado Pago podrá recibir donaciones de los usuarios que quieran cooperar para ayudar a su organización a seguir ayudando a los animales.</p>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                        <PrimaryButton
                            type="submit"
                            disabled={orgProcessing}
                            className="bg-blue-600 hover:bg-blue-700"
                            style={{ backgroundImage: 'none', backgroundColor: '#2563eb' }}
                        >
                            Guardar organización
                        </PrimaryButton>
                        {orgSaved && (
                            <p className="text-sm text-gray-600">Guardado.</p>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}
