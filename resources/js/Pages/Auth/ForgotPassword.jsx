import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function ForgotPassword({ auth, canLogin, canRegister }) {
    const { flash = {} } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout auth={auth} canLogin={canLogin} canRegister={canRegister}>
            <Head title="Olvidé mi contraseña" />

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
                            <h3 className="text-2xl font-bold text-slate-900">Recuperá el acceso</h3>
                            <p className="mt-3 text-slate-700">Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl p-8 shadow-lg fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <ApplicationLogo className="h-9 w-9" />
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Olvidé mi contraseña</h2>
                                    <p className="text-sm text-slate-600">Te enviaremos un correo con un enlace para restablecerla.</p>
                                </div>
                            </div>

                            {flash.status && <div className="mb-4 text-sm font-medium text-green-600">{flash.status}</div>}

                            <form onSubmit={submit}>
                                <div className="floating">
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        placeholder=" "
                                        className="mt-1 block w-full px-4 py-3"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <label htmlFor="email">Correo electrónico</label>

                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div className="mt-6">
                                    <PrimaryButton className="w-full btn-gradient btn-animate-gradient" disabled={processing}>
                                        Enviar enlace de restablecimiento
                                    </PrimaryButton>
                                </div>
                            </form>

                            <div className="mt-6 text-center text-sm text-slate-600">
                                ¿Recordaste tu contraseña?{' '}
                                <Link href={route('login')} className="text-primary underline">
                                    Iniciar sesión
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}