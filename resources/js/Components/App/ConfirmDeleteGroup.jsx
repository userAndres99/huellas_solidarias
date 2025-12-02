import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useEventBus } from '@/EvenBus';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ConfirmDeleteGroup() {
    const { on, emit } = useEventBus();
    const [show, setShow] = useState(false);
    const [group, setGroup] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const off = on('GroupDelete.show', (grp) => {
            setGroup(grp);
            setShow(true);
        });

        return () => { try { off(); } catch (e) {} };
    }, [on]);

    const close = () => {
        setShow(false);
        setGroup(null);
        setProcessing(false);
    };

    const confirmDelete = async () => {
        if (!group) return;
        setProcessing(true);
        try {
            const { data } = await axios.delete(route('group.destroy', group.id));
            try { if (emit) emit('toast.show', data.message); } catch (e) {}
            close();
        } catch (err) {
            console.error('Error deleting group', err);
            try { emit('toast.show', 'Error al programar la eliminación del grupo'); } catch (e) {}
            setProcessing(false);
        }
    };

    return (
        <Modal show={show} onClose={close} maxWidth="sm">
            <div className="p-6">
                <h3 className="text-lg font-semibold">¿Estás seguro de que quieres eliminar este grupo?</h3>
                <p className="text-sm text-gray-700 mt-3">El grupo <strong>{group?.name}</strong> será programado para eliminación. Esta acción puede tardar unos segundos.</p>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={close} disabled={processing}>Cancelar</SecondaryButton>
                    <PrimaryButton onClick={confirmDelete} disabled={processing}>{processing ? 'Eliminando...' : 'Eliminar'}</PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}
