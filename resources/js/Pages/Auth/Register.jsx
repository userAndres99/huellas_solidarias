import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
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

      <form onSubmit={submit}>
        <div>
          <InputLabel htmlFor="name" value="Nombre" />

          <TextInput
            id="name"
            name="name"
            value={data.name}
            className="mt-1 block w-full"
            autoComplete="name"
            isFocused={true}
            onChange={(e) => setData('name', e.target.value)}
            required
          />

          <InputError message={errors.name} className="mt-2" />
        </div>

        <div className="mt-4">
          <InputLabel htmlFor="email" value="Correo electrónico" />

          <TextInput
            id="email"
            type="email"
            name="email"
            value={data.email}
            className="mt-1 block w-full"
            autoComplete="username"
            onChange={(e) => setData('email', e.target.value)}
            required
          />

          <InputError message={errors.email} className="mt-2" />
        </div>

        <div className="mt-4">
          <InputLabel htmlFor="password" value="Contraseña" />

          <TextInput
            id="password"
            type="password"
            name="password"
            value={data.password}
            className="mt-1 block w-full"
            autoComplete="new-password"
            onChange={(e) => setData('password', e.target.value)}
            required
          />

          <InputError message={errors.password} className="mt-2" />
        </div>

        <div className="mt-4">
          <InputLabel htmlFor="password_confirmation" value="Confirmar contraseña" />

          <TextInput
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            value={data.password_confirmation}
            className="mt-1 block w-full"
            autoComplete="new-password"
            onChange={(e) => setData('password_confirmation', e.target.value)}
            required
          />

          <InputError message={errors.password_confirmation} className="mt-2" />
        </div>

        <div className="mt-4">
          <InputLabel htmlFor="rol_id" value="Rol" />

          <select
            id="rol_id"
            name="rol_id"
            value={data.rol_id}
            onChange={(e) => setData('rol_id', e.target.value)}
            className="mt-1 block w-full rounded border-gray-300"
            required
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>

          <InputError message={errors.rol_id} className="mt-2" />
        </div>

        <div className="mt-4 flex items-center justify-end">
          {canLogin && (
            <Link
              href={route('login')}
              className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              ¿Ya tenés cuenta?
            </Link>
          )}

          <PrimaryButton className="ms-4" disabled={processing}>
            Crear cuenta
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  );
}