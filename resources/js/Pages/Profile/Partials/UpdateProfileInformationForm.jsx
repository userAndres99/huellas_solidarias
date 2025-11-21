import React, { useState, useEffect, useRef } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData } = useForm({
        name: user.name,
        email: user.email,
        photo: null,
    });

    const [emailError, setEmailError] = useState(null);
    const [profileSaved, setProfileSaved] = useState(false);
    const [errorsObj, setErrorsObj] = useState({});
    const [processingLocal, setProcessingLocal] = useState(false);

    const [preview, setPreview] = useState(
        user.profile_photo_url ?? '/images/DefaultPerfil.jpg'
    );
    const [removePhoto, setRemovePhoto] = useState(false);

    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    useEffect(() => {
        setPreview(user.profile_photo_url ?? '/images/DefaultPerfil.jpg');
    }, [user.profile_photo_url]);

    const fileInputRef = useRef(null);

    const onFileChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        setData('photo', file);
        // Si el usuario selecciona un archivo nuevo, anulamos la intención de eliminar
        setRemovePhoto(false);
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        } else {
            setPreview(user.profile_photo_url ?? '/images/DefaultPerfil.jpg');
        }
    };

    const submit = async (e) => {
        e.preventDefault();

        // Validación cliente: si el email fue modificado, validar formato
        if (data.email !== undefined && data.email !== null && data.email !== user.email && String(data.email).trim() !== '') {
            const emailVal = String(data.email).trim();
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(emailVal)) {
                setEmailError('Ingrese un correo electrónico válido.');
                return;
            }
            setEmailError(null);
        }

        // preparar FormData
        const formData = new FormData();
        formData.append('_method', 'PATCH');
        if (data.name !== undefined && data.name !== null && String(data.name).trim() !== '') {
            formData.append('name', data.name);
        }
        if (data.email !== undefined && data.email !== null && String(data.email).trim() !== '') {
            formData.append('email', data.email);
        }
        if (data.photo) {
            formData.append('photo', data.photo);
        }
        if (removePhoto) {
            formData.append('remove_photo', '1');
        }

        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        setProcessingLocal(true);
        try {
            const headers = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            };

            const res = await fetch(route('profile.update'), {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers,
                    body: formData,
                });
            if (!res.ok) {
                // intentar refrescar CSRF y reintentar una vez si es 419
                if (res.status === 419) {
                    try {
                        const tResp = await fetch('/csrf-token', { credentials: 'same-origin' });
                        if (tResp.ok) {
                            const tjson = await tResp.json();
                            if (tjson.csrf_token) {
                                document.querySelectorAll('meta[name="csrf-token"]').forEach(m => m.setAttribute('content', tjson.csrf_token));
                            }
                        }
                    } catch (e) {
                        
                    }

                    // reintentar
                    const retryHeaders = {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(token ? { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') } : {}),
                    };

                    const retryResp = await fetch(route('profile.update'), {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: retryHeaders,
                        body: formData,
                    });

                    if (retryResp.ok) {
                        setProfileSaved(true);
                        setTimeout(() => setProfileSaved(false), 3000);
                        setRemovePhoto(false);
                        window.dispatchEvent(new Event('profile-updated'));
                        setProcessingLocal(false);
                        return;
                    }
                   
                    try {
                        const txt = await retryResp.text();
                        console.error('Retry fallo al guardar perfil, status:', retryResp.status, 'body:', txt);
                    } catch (e) {
                        console.error('Retry fallo al guardar perfil, status:', retryResp.status);
                    }
                }
               
                if (res.status === 422) {
                    try {
                        const json = await res.json();
                        setErrorsObj(json.errors || {});
                        // si hay error de email, mostrarlo en el area
                        if (json.errors && json.errors.email) {
                            setEmailError(json.errors.email[0]);
                        }
                        
                    } catch (err) {
                        console.error('Error parseando JSON de validación:', err);
                    }
                } else {
                    try {
                        const txt = await res.text();
                        console.error('Error al guardar perfil, status:', res.status, 'body:', txt);
                    } catch (e) {
                        console.error('Error al guardar perfil, status:', res.status);
                    }
                }
                setProcessingLocal(false);
                return;
            }

            
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 3000);
            setRemovePhoto(false);
            window.dispatchEvent(new Event('profile-updated'));
        } catch (err) {
            console.error('Error de red al guardar perfil:', err);
        } finally {
            setProcessingLocal(false);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Información del perfil
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Actualiza la información de tu cuenta y tu dirección de correo electrónico.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border">
                        <img
                            src={preview}
                            alt="Foto de perfil"
                            className="object-cover w-full h-full"
                        />
                    </div>

                    <div className="flex-1">
                        <InputLabel htmlFor="photo" value="Subir foto de perfil" />

                        <div className="mt-2 flex items-center gap-4">
                            <div className="flex-1">
                                <input
                                    id="photo"
                                    name="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileChange}
                                    className="sr-only"
                                    ref={fileInputRef}
                                />

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                        className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h4l2-3h6l2 3h4v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100 6 3 3 0 000-6z" />
                                        </svg>
                                        <span className="font-medium">Subir foto de perfil</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('photo', null);
                                            setRemovePhoto(true);
                                            setPreview('/images/DefaultPerfil.jpg');
                                            if (fileInputRef.current) fileInputRef.current.value = null;
                                        }}
                                        aria-pressed={removePhoto}
                                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                                    >
                                        Eliminar
                                    </button>
                                </div>

                                <InputError className="mt-2" message={null} />
                                <p className="mt-2 text-sm text-gray-600">No es obligatorio — si no subes nada, se usará la imagen por defecto.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Nombre" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={null} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Correo electrónico" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => { setData('email', e.target.value); setEmailError(null); }}
                        autoComplete="username"
                    />

                        <InputError className="mt-2" message={emailError} />
                </div>

                {user?.role_name === 'Usuario' && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Solicitar verificación como representante de una organización
                        </h3>
                        <p className="mt-2 text-sm text-gray-700">
                            Si pertenecés a una organización y querés representarla en la plataforma,
                            podés solicitar la verificación de tu cuenta. Al hacerlo, nos enviás la
                            documentación correspondiente y nuestro equipo revisará tu solicitud.
                            Si todo está en orden, marcaremos tu cuenta como representante de esa
                            organización y recibirás las herramientas y permisos asociados.
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <Link
                                href={route('profile.solicitud_form')}
                                className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700"
                            >
                                Solicitar verificación
                            </Link>

                            <button
                                type="button"
                                className="text-sm underline text-gray-600 hover:text-gray-800"
                                onClick={() => Inertia.get(route('profile.verification_requirements'))}
                            >
                                Requisitos y documentación
                            </button>
                        </div>
                    </div>
                )}

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Tu dirección de correo electrónico no está verificada.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Haz clic aquí para reenviar el correo de verificación.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Se ha enviado un nuevo enlace de verificación a tu correo electrónico.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton type="submit" disabled={processingLocal}>Guardar</PrimaryButton>

                    <Transition
                        show={profileSaved}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Guardado.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}