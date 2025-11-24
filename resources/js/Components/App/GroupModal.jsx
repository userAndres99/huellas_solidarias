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
                    emit("toast.show", `Group "${data.name}" was updated`);
                }
            });
            return;
        }
        post(route("group.store"), {
            onSuccess: () => {
                emit("toast.show", `Group "${data.name}" was created`);
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
    <form
        onSubmit={createOrUpdateGroup}
        className="p-6 space-y-6 overflow-y-auto"
    >
        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-indigo-600 dark:text-indigo-300"
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

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {group.id ? `Edit Group` : "Create a New Group"}
            </h2>
        </div>

        {/* NAME */}
        <div className="space-y-1">
            <InputLabel htmlFor="name" value="Group Name" />

            <TextInput
                id="name"
                className="mt-1 block w-full"
                value={data.name}
                disabled={!!group.id}
                onChange={(e) => setData("name", e.target.value)}
                required
            />

            <InputError className="mt-2" message={errors.name} />
        </div>

        {/* DESCRIPTION */}
        <div className="space-y-1">
            <InputLabel htmlFor="description" value="Description" />

            <TextAreaInput
                id="description"
                rows="3"
                className="mt-1 block w-full"
                value={data.description || ""}
                placeholder="Write a short description for this group..."
                onChange={(e) => setData("description", e.target.value)}
            />

            <InputError className="mt-2" message={errors.description} />
        </div>

        {/* USERS */}
        <div className="space-y-1">
            <InputLabel value="Users in Group" />

            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <UserPicker
                    value={
                        users.filter(
                            (u) =>
                                group.owner_id !== u.id &&
                                data.user_ids.includes(u.id)
                        ) || []
                    }
                    options={users}
                    onSelect={(users) =>
                        setData(
                            "user_ids",
                            users.map((u) => u.id)
                        )
                    }
                />
            </div>

            <InputError className="mt-2" message={errors.user_ids} />
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <SecondaryButton onClick={closeModal}>
                Cancel
            </SecondaryButton>

            <PrimaryButton disabled={processing}>
                {group.id ? "Update" : "Create"}
            </PrimaryButton>
        </div>
    </form>
</Modal>

    );
}