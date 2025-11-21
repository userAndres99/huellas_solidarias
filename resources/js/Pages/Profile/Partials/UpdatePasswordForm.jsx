import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useRef, useState } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const [form, setForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [errorsObj, setErrorsObj] = useState({});
    const [processingLocal, setProcessingLocal] = useState(false);
    const [passwordSaved, setPasswordSaved] = useState(false);

    const updatePassword = async (e) => {
        e.preventDefault();
        setProcessingLocal(true);

        const localErrors = {};
        if (!form.current_password || String(form.current_password).trim() === '') {
            localErrors.current_password = ['La contraseña actual es requerida.'];
        }
        if (!form.password || String(form.password).trim() === '') {
            localErrors.password = ['La nueva contraseña es requerida.'];
        }
        if (form.password !== form.password_confirmation) {
            localErrors.password_confirmation = ['Las contraseñas no coinciden.'];
        }
        if (Object.keys(localErrors).length > 0) {
            setErrorsObj(localErrors);
          
            if (localErrors.current_password) currentPasswordInput.current && currentPasswordInput.current.focus();
            else if (localErrors.password) passwordInput.current && passwordInput.current.focus();
            setProcessingLocal(false);
            return;
        }

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('current_password', form.current_password);
        formData.append('password', form.password);
        formData.append('password_confirmation', form.password_confirmation);

        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        try {
            const headers = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            };

            const res = await fetch(route('password.update'), {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: formData,
            });

            if (!res.ok) {
                // si 419 intentar refrescar token y reintentar
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

                    const retry = await fetch(route('password.update'), {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: retryHeaders,
                        body: formData,
                    });

                    if (!retry.ok) {
                        if (retry.status === 422) {
                            try {
                                const json = await retry.json();
                                setErrorsObj(json.errors || {});
                                if (json.errors?.password) {
                                    setForm((f) => ({ ...f, password: '', password_confirmation: '' }));
                                    passwordInput.current.focus();
                                }
                                if (json.errors?.current_password) {
                                    setForm((f) => ({ ...f, current_password: '' }));
                                    currentPasswordInput.current.focus();
                                }
                            } catch (err) {
                                console.error('Error parseando errores de contraseña (retry):', err);
                            }
                        } else {
                            console.error('Error al actualizar contraseña (retry), status:', retry.status);
                        }
                        setProcessingLocal(false);
                        return;
                    }

                } else {
                    if (res.status === 422) {
                        try {
                            const json = await res.json();
                            setErrorsObj(json.errors || {});
                            if (json.errors?.password) {
                                setForm((f) => ({ ...f, password: '', password_confirmation: '' }));
                                passwordInput.current.focus();
                            }
                            if (json.errors?.current_password) {
                                setForm((f) => ({ ...f, current_password: '' }));
                                currentPasswordInput.current.focus();
                            }
                        } catch (err) {
                            console.error('Error parseando errores de contraseña:', err);
                        }
                    } else {
                        console.error('Error al actualizar contraseña, status:', res.status);
                    }
                    setProcessingLocal(false);
                    return;
                }
            }

            setForm({ current_password: '', password: '', password_confirmation: '' });
            setErrorsObj({});
            setPasswordSaved(true);
            setTimeout(() => setPasswordSaved(false), 3000);
        } catch (err) {
            console.error('Error de red al actualizar contraseña:', err);
        } finally {
            setProcessingLocal(false);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Actualizar contraseña
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Asegúrate de que tu cuenta use una contraseña larga y aleatoria para mantenerse segura.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Contraseña actual"
                    />

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={form.current_password}
                        onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errorsObj.current_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Nueva contraseña" />

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />

                    <InputError message={errorsObj.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirmar contraseña"
                    />

                    <TextInput
                        id="password_confirmation"
                        value={form.password_confirmation}
                        onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errorsObj.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processingLocal}>Guardar</PrimaryButton>

                    <Transition
                        show={passwordSaved}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Guardado.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}