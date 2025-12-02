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


export default function GroupModal ({ show = false, onClose = () => {}}) {
    
    const page = usePage();
    const conversations = page.props.conversations;
    const { on, emit } = useEventBus();
    const [group, setGroup] = useState({})

    const { data, setData, processing, reset, post, put, errors } = useForm({
        id:"",
        name: "",
        description:"",
        user_ids: [],
    });


    const users = conversations.filter((c) => !c.is_group);
    
    const createOrUpdateGroup =(e) => {
        e.preventDefault();

        if(group.id){
            put(route("group.update", group.id),{
                onSuccess: () => {
                    closeModal();
                    emit("toast.show", `Se actualizó el grupo: ${data.name}`);
                }
            });
            return;
        }
        post(route("group.store"), {
            onSuccess: () => {
                emit("toast.show", `Se ha creado el grupo: ${data.name}`);
                closeModal();
            },
        });
    };

    const closeModal = () => {
        reset();
        onClose();
    };
    useEffect(() => {
        return on("GroupModal.show", (group) => {
            setData({
                name:group.name,
                description:group.description,
                user_ids: group.users
                    .filter((u) => group.owner_id !== u.id)
                    .map((u) => u.id),
            });
            setGroup(group);
        });
    }, [on]);
    
    return (
        <Modal show={show} onClose={closeModal} maxWidth="lg">
            <form onSubmit={createOrUpdateGroup} className="p-6 space-y-6 overflow-y-auto">
                {/* HEADER */}
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                    <div className="p-2 bg-[#C8E7F5] rounded-xl">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-slate-900"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M17 20h5v-2a4 4 0 00-4-4h-1M7 20H2v-2a4 4 0 014-4h1m3-3a4 4 0 100-8 4 4 0 000 8zm7 0a4 4 0 10-8 0"
                            />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-extrabold text-slate-900">
                        {group.id ? `Editar grupo` : 'Crear nuevo grupo'}
                    </h2>
                </div>

                {/* NAME */}
                <div className="space-y-1">
                    <InputLabel htmlFor="name" value="Nombre del grupo" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full bg-white text-slate-900"
                        value={data.name}
                        disabled={!!group.id}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        placeholder="Escribe el nombre del grupo..."
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-1">
                    <InputLabel htmlFor="description" value="Descripción" />

                    <TextAreaInput
                        id="description"
                        rows="3"
                        className="mt-1 block w-full bg-white text-slate-900"
                        value={data.description || ''}
                        placeholder="Escribe una breve descripción para el grupo..."
                        onChange={(e) => setData('description', e.target.value)}
                    />

                    <InputError className="mt-2" message={errors.description} />
                </div>

                {/* USERS */}
                <div className="space-y-1">
                    <InputLabel value="Usuarios en el grupo" />

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <UserPicker
                            value={
                                users
                                    .filter((u) => group.owner_id !== u.id && data.user_ids.includes(u.id)) || []
                            }
                            options={users}
                            onSelect={(users) => setData('user_ids', users.map((u) => u.id))}
                        />
                    </div>

                    <InputError className="mt-2" message={errors.user_ids} />
                </div>

                {/* ACTIONS */}
                <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-gray-200">
                    <SecondaryButton onClick={closeModal}>Cancelar</SecondaryButton>

                        <PrimaryButton disabled={processing}>{group.id ? 'Actualizar' : 'Crear'}</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}