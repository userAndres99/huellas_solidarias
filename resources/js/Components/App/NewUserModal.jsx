import TextAreaInput from '../../Components/TextAreaInput';
import InputError from '@/Components/InputError';
import InputLabel from '../InputLabel';
import Modal from '../Modal';
import TextInput from '../TextInput';
import SecondaryButton from '../SecondaryButton';
import PrimaryButton from '../PrimaryButton';
import UserPicker from '@/Components/App/UserPicker';
import { useForm, usePage } from '@inertiajs/react';
import { useEventBus } from '@/EvenBus';
import { useEffect, useState } from 'react';
import Checkbox from '../Checkbox';


export default function NewUserModal({ show = false, onClose = () => { } }) {
    const { emit } = useEventBus();

    const { data, setData, processing, reset, post, errors } = useForm({
        name: "",
        email: "",
        is_admin: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("user.name"), {
            onSuccess: () => {
                emit("toast.show", `User "${data.name}" was created`);
                closeModal();
            },
        });
    };

    const closeModal = () => {
        reset();
        onClose();
    };

    return (
        <Modal show={show} onClose={closeModal} maxWidth="lg">
            <form
                onSubmit={submit}
                className="p-6 space-y-8 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900"
            >

                {/* HEADER */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.7}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17 20h5v-2a4 4 0 00-4-4h-1M7 20H2v-2a4 4 0 014-4h1m3-3a4 4 0 100-8 4 4 0 000 8zm7 0a4 4 0 10-8 0"
                            />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Crear Nuevo Usuario
                    </h2>
                </div>

                {/* NAME */}
                <div className="space-y-1">
                    <InputLabel htmlFor="name" value="Nombre del Usuario" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
                                   focus:border-indigo-500 focus:ring-indigo-500
                                   dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                {/* EMAIL */}
                <div className="space-y-1">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
                                   focus:border-indigo-500 focus:ring-indigo-500
                                   dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        required
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {/* ADMIN CHECKBOX */}
                <div className="space-y-1">
                    <InputLabel value="Opciones de Usuario" />

                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <label className="flex items-center">
                            <Checkbox
                                name="is_admin"
                                checked={data.is_admin}
                                onChange={(e) => setData('is_admin', e.target.checked)}
                            />
                            <span className="ms-3 text-sm text-slate-700 dark:text-slate-300">
                                Usuario Administrador
                            </span>
                        </label>
                    </div>

                    <InputError className="mt-2" message={errors.is_admin} />
                </div>

                {/* ACTIONS */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <SecondaryButton
                        onClick={closeModal}
                        className="px-4 py-2 text-sm rounded-lg"
                    >
                        Cancelar
                    </SecondaryButton>

                    <PrimaryButton
                        disabled={processing}
                        className="px-4 py-2 text-sm rounded-lg"
                    >
                        Crear
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
