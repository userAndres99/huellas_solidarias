import React, { useState, useEffect } from 'react';
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

    // <-- incluimos processing y recentlySuccessful aquí
    const { data, setData, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
        photo: null,
    });

    const [preview, setPreview] = useState(
        user.profile_photo_url ?? '/images/DefaultPerfil.jpg'
    );

    // limpiar objectURL al desmontar
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // si el profile_photo_url cambia desde el servidor actualizamos preview
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

        // Solo enviamos name/email si cambiaron respecto al user actual
        if (data.name !== undefined && data.name !== null && data.name !== user.name && String(data.name).trim() !== '') {
            formData.append('name', data.name);
        }

        if (data.email !== undefined && data.email !== null && data.email !== user.email && String(data.email).trim() !== '') {
            formData.append('email', data.email);
        }

        if (data.photo) {
            formData.append('photo', data.photo);
        }

        Inertia.post(route('profile.update'), formData, {
            onSuccess: () => {
                // recargar el usuario compartido en Inertia (para que profile_photo_url se actualice)
                Inertia.reload({ only: ['auth'] });
                // notificar a otros componentes que escuchen para refetch (comentarios, publicaciones)
                window.dispatchEvent(new Event('profile-updated'));
            },
            onError: (errors) => {
                console.error('Errores del servidor:', errors);
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
                        <InputError className="mt-2" message={null} />
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
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={null} />
                </div>

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
                    <PrimaryButton type="submit" disabled={processing}>Guardar</PrimaryButton>

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