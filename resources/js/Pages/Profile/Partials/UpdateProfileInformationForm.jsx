import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, useForm, usePage } from '@inertiajs/react';
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

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            photo: null, 
        });

    const [preview, setPreview] = useState(
        user.profile_photo_url ?? '/images/DefaultPerfil.jpg'
    );

    // estados para la solicitud de verificación (solo para role 'Usuario')
    const [reqProcessing, setReqProcessing] = useState(false);
    const [reqSuccess, setReqSuccess] = useState(false);
    const [reqError, setReqError] = useState(null);

    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Si cambia el profile_photo_url (tras reload) actualizamo
    useEffect(() => {
        setPreview(user.profile_photo_url ?? '/images/DefaultPerfil.jpg');
    }, [user.profile_photo_url]);

    const onFileChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        setData('photo', file);
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        } else {
            setPreview(user.profile_photo_url ?? '/images/DefaultPerfil.jpg');
        }
    };

    const submit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('_method', 'PATCH');
        formData.append('name', data.name ?? '');
        formData.append('email', data.email ?? '');
        if (data.photo) {
            formData.append('photo', data.photo);
        }

        Inertia.post(route('profile.update'), formData, {
            onSuccess: () => {
                Inertia.reload({ only: ['auth'] });
            },
            onError: (errors) => {
                console.error('Errores del servidor:', errors);
            },
        });
    };

    // handler para solicitar verificación — solo visible a users (rol 'Usuario')
    const handleRequestVerification = (e) => {
        e && e.preventDefault();
        setReqProcessing(true);
        setReqError(null);
        setReqSuccess(false);

        // POST a la ruta que manejará la solicitud en el backend
        Inertia.post(route('profile.request_verification'), {}, {
            onSuccess: (page) => {
                setReqProcessing(false);
                setReqSuccess(true);
                // recargar auth para reflejar cambios si es necesario
                Inertia.reload({ only: ['auth'] });
            },
            onError: (errors) => {
                setReqProcessing(false);
                setReqError(errors?.message || 'Error al solicitar verificación');
                console.error('Errores al solicitar verificación:', errors);
            },
        });
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
                        <InputLabel htmlFor="photo" value="Foto de perfil" />
                        <input
                            id="photo"
                            name="photo"
                            type="file"
                            accept="image/*"
                            onChange={onFileChange}
                            className="mt-1 block w-full"
                        />
                        <InputError className="mt-2" message={errors.photo} />
                        <p className="mt-2 text-sm text-gray-600">
                            Si no subes nada, se usará la imagen por defecto.
                        </p>
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Nombre" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Correo electrónico" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {/*sugerencia / boton de Solicitar verificacion solo para usuarios (rol 'Usuario') */}
                {user?.role === 'Usuario' && (
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

                        {reqSuccess ? (
                            <div className="mt-3 text-sm font-medium text-green-600">
                                Solicitud enviada correctamente. Nuestro equipo la revisará y te
                                notificaremos por correo.
                            </div>
                        ) : (
                            <>
                                {reqError && (
                                    <div className="mt-3 text-sm font-medium text-red-600">
                                        {reqError}
                                    </div>
                                )}

                                <div className="mt-3 flex items-center gap-3">
                                    <PrimaryButton
                                        onClick={handleRequestVerification}
                                        disabled={reqProcessing}
                                    >
                                        {reqProcessing ? 'Enviando...' : 'Solicitar verificación'}
                                    </PrimaryButton>

                                    <button
                                        type="button"
                                        className="text-sm underline text-gray-600 hover:text-gray-800"
                                        onClick={() => {
                                            // por ahora redirigimosa una ruta informativa (todavia no la creo xd)
                                            Inertia.get(route('profile.verification_requirements'));
                                        }}
                                    >
                                        Requisitos y documentación
                                    </button>
                                </div>
                            </>
                        )}
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
                    <PrimaryButton disabled={processing}>Guardar</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
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