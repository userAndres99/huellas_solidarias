import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verificación de correo" />

            <div className="mx-auto w-full max-w-6xl px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                    <div className="hidden md:block rounded-2xl overflow-hidden h-[520px] shadow-lg relative">
                        <img
                            src="/images/Hero.jpg"
                            alt="Huellas Solidarias"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60 mix-blend-multiply z-10" />
                        <div className="relative p-8 h-full flex flex-col justify-end z-20">
                            <h3 className="text-2xl font-bold text-slate-900">Verificá tu correo</h3>
                            <p className="mt-3 text-slate-700">Gracias por registrarte. Verificá tu correo para completar el acceso a tu cuenta.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl p-8 shadow-lg fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <ApplicationLogo className="h-9 w-9" />
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Verificación de correo</h2>
                                    <p className="text-sm text-slate-600">Antes de continuar, confirmá tu dirección de correo electrónico.</p>
                                </div>
                            </div>

                            <div className="mb-4 text-sm text-gray-600">
                                ¡Gracias por registrarte! Antes de continuar, ¿podrías verificar
                                tu correo electrónico haciendo clic en el enlace que te enviamos?
                                Si no recibiste el correo, con gusto te enviaremos otro.
                            </div>

                            {status === 'verification-link-sent' && (
                                <div className="mb-4 text-sm font-medium text-green-600">
                                    Se ha enviado un nuevo enlace de verificación al correo
                                    electrónico que proporcionaste durante el registro.
                                </div>
                            )}

                            <form onSubmit={submit}>
                                <div className="mt-4 flex items-center justify-between">
                                    <PrimaryButton disabled={processing}>
                                        Reenviar correo de verificación
                                    </PrimaryButton>

                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Cerrar sesión
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}