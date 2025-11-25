import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status,errorMessage, canResetPassword, auth, canLogin, canRegister }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <GuestLayout auth={auth} canLogin={canLogin} canRegister={canRegister}>
      <Head title="Iniciar sesión" />

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
              <h3 className="text-2xl font-bold text-slate-900">Conecta con la comunidad</h3>
              <p className="mt-3 text-slate-700">Reporta, colabora y ayuda a animales cerca tuyo.</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl p-8 shadow-lg fade-in">
              <div className="flex items-center gap-3 mb-6">
                <ApplicationLogo className="h-9 w-9" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Iniciar sesión</h2>
                  <p className="text-sm text-slate-600">Ingresa con tu cuenta para continuar</p>
                </div>
              </div>

              {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}
              {errorMessage && <div className="mb-4 text-sm font-medium text-red-600">{errorMessage}</div>}

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

                <div className="mt-4 floating">
                  <TextInput
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    placeholder=" "
                    className="mt-1 block w-full px-4 py-3"
                    autoComplete="current-password"
                    onChange={(e) => setData('password', e.target.value)}
                  />
                  <label htmlFor="password">Contraseña</label>

                  <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center">
                    <Checkbox
                      name="remember"
                      checked={data.remember}
                      onChange={(e) => setData('remember', e.target.checked)}
                    />
                    <span className="ms-2 text-sm text-slate-700">Recordarme</span>
                  </label>

                  {canResetPassword && (
                    <Link
                      href={route('password.request')}
                      className="text-sm text-slate-600 underline hover:text-slate-900"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  )}
                </div>

                <div className="mt-6">
                  <PrimaryButton className="w-full btn-gradient btn-animate-gradient" disabled={processing}>
                    Iniciar sesión
                  </PrimaryButton>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                ¿No tenés una cuenta?{' '}
                <Link href={route('register')} className="text-primary underline">
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}