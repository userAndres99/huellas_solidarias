import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register({ auth, canLogin, canRegister, roles = [] }) {
  const defaultRolId = roles.length ? roles[0].id : '';
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    rol_id: defaultRolId,
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <GuestLayout auth={auth} canLogin={canLogin} canRegister={canRegister}>
      <Head>
        <title>Crear cuenta</title>
      </Head>

      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block rounded-2xl overflow-hidden h-[520px] shadow-lg relative">
            <img src="/images/Hero.jpg" alt="Huellas Solidarias" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60 mix-blend-multiply z-10" />
            <div className="relative p-8 h-full flex flex-col justify-end z-20">
              <h3 className="text-2xl font-bold text-slate-900">Únete y ayuda</h3>
              <p className="mt-3 text-slate-700">Crea tu cuenta para reportar y colaborar con rescates y adopciones.</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl p-8 shadow-lg fade-in">
              <div className="flex items-center gap-3 mb-6">
                <ApplicationLogo className="h-9 w-9" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Crear cuenta</h2>
                  <p className="text-sm text-slate-600">Completa tus datos para registrarte</p>
                </div>
              </div>

              <form onSubmit={submit}>
                <div className="floating">
                  <TextInput
                    id="name"
                    name="name"
                    value={data.name}
                    placeholder=" "
                    className="mt-1 block w-full px-4 py-3"
                    autoComplete="name"
                    isFocused={true}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                  />
                  <label htmlFor="name">Nombre</label>
                  <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4 floating">
                  <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    placeholder=" "
                    className="mt-1 block w-full px-4 py-3"
                    autoComplete="username"
                    onChange={(e) => setData('email', e.target.value)}
                    required
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
                    autoComplete="new-password"
                    onChange={(e) => setData('password', e.target.value)}
                    required
                  />
                  <label htmlFor="password">Contraseña</label>
                  <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 floating">
                  <TextInput
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    value={data.password_confirmation}
                    placeholder=" "
                    className="mt-1 block w-full px-4 py-3"
                    autoComplete="new-password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    required
                  />
                  <label htmlFor="password_confirmation">Confirmar contraseña</label>
                  <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700">Rol</label>
                  <select
                    id="rol_id"
                    name="rol_id"
                    value={data.rol_id}
                    onChange={(e) => setData('rol_id', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm"
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                  <InputError message={errors.rol_id} className="mt-2" />
                </div>

                <div className="mt-6 flex items-center justify-end">
                  {canLogin && (
                    <Link href={route('login')} className="rounded-md text-sm text-slate-600 underline hover:text-slate-900">
                      ¿Ya tenés cuenta?
                    </Link>
                  )}

                  <PrimaryButton className="ms-4 btn-gradient btn-animate-gradient" disabled={processing}>
                    Crear cuenta
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}