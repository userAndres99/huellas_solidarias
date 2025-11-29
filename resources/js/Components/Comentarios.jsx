import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCommentDots } from 'react-icons/fa';
import axios from 'axios';

export default function Comentarios({ comentableType, comentableId }) {
    const { auth } = usePage().props;
    const queryClient = useQueryClient();

    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [moderationNotice, setModerationNotice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replySubmittingId, setReplySubmittingId] = useState(null);

    const makeAbsolute = (url) => {
        if (!url) return null;
        if (/^https?:\/\//.test(url)) return url;
        return `${window.location.origin}${url}`;
    };

    const formatComentario = (c) => ({
        id: c.id,
        userId: c.user_id,
        fullName: c.user?.name || c.usuario_nombre || 'Invitado',
        avatarUrl: makeAbsolute(c.usuario_avatar || c.user?.profile_photo_url || '/images/DefaultPerfil.jpg'),
        texto: c.texto,
        replies: c.respuesta?.map(formatComentario) || [],
        createdAt: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }),
        likes: c.likes_count || 0,
        likedByCurrentUser: c.liked_by_current_user || false,
        parentId: c.parent_id || null,
    });

    // Traer comentarios
    const { data: comentarios = [], refetch, isLoading, isError } = useQuery({
        queryKey: ['comentarios', comentableId, comentableType],
        queryFn: async () => {
            const res = await fetch(`/comentarios/json?comentable_id=${comentableId}&comentable_type=${comentableType}`, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Error al cargar comentarios');
            const data = await res.json();
            return data.map(formatComentario);
        }
    });

    // Like / Unlike
    const likeMutation = useMutation({
        mutationFn: async (comentarioId) => {
            const res = await axios.post(`/comentarios/${comentarioId}/like`);
            return res.data;
        },
        onMutate: async (comentarioId) => {
            await queryClient.cancelQueries(['comentarios', comentableId, comentableType]);
            const prevData = queryClient.getQueryData(['comentarios', comentableId, comentableType]);
            queryClient.setQueryData(['comentarios', comentableId, comentableType], (old = []) =>
                old.map(c => {
                    if (c.id === comentarioId) {
                        const liked = !c.likedByCurrentUser;
                        return { ...c, likedByCurrentUser: liked, likes: c.likes + (liked ? 1 : -1) };
                    }
                    return { ...c, replies: c.replies?.map(r => r.id === comentarioId
                        ? { ...r, likedByCurrentUser: !r.likedByCurrentUser, likes: r.likes + (r.likedByCurrentUser ? -1 : 1) }
                        : r
                    ) };
                })
            );
            return { prevData };
        },
        onError: (err, _, context) => context?.prevData && queryClient.setQueryData(['comentarios', comentableId, comentableType], context.prevData),
        onSettled: () => queryClient.invalidateQueries(['comentarios', comentableId, comentableType]),
    });

    // Editar comentario
    const updateMutation = useMutation({
        mutationFn: async ({ id, texto }) => {
            const res = await axios.put(`/comentarios/${id}`, { texto });
            return res.data;
        },
        onSuccess: () => {
            refetch();
            setEditingId(null);
            setEditingText('');
        }
    });

    // Eliminar comentario
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await axios.delete(`/comentarios/${id}`);
            return res.data;
        },
        onSuccess: () => refetch(),
    });

    // Enviar nuevo comentario
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        const texto = e.target.texto.value.trim();
        if (!texto || !auth.user) return alert('Debes iniciar sesión para comentar.');

        try {
            setSubmitting(true);
            const res = await axios.post('/comentarios', { comentable_id: comentableId, comentable_type: comentableType, texto });
            // La API devuelve { comentarios, moderation }
            const moderation = res.data?.moderation;
            if (moderation && moderation.deleted) {
                // Mostrar aviso temporal
                setModerationNotice('Tu comentario fue eliminado porque contiene contenido inapropiado.');
                e.target.reset();

                refetch();
                // Borrar el aviso luego de unos segundos
                setTimeout(() => setModerationNotice(''), 8000);
                return;
            }

            // Si no fue eliminado, refrescamos y limpiamos
            e.target.reset();
            refetch();
        } catch (err) {
            console.error('Error al enviar comentario:', err);
            alert('Error al enviar el comentario. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    // Enviar respuesta
    const handleReplySubmit = async (parentId) => {
        if (!replyText.trim() || !auth.user) return alert('Debes iniciar sesión para comentar.');

        try {
            setReplySubmittingId(parentId);
            const res = await axios.post('/comentarios', { comentable_id: comentableId, comentable_type: comentableType, texto: replyText, parent_id: parentId });
            const moderation = res.data?.moderation;
            if (moderation && moderation.deleted) {
                setModerationNotice('Tu respuesta fue eliminada porque contiene contenido inapropiado.');
                setReplyingTo(null);
                setReplyText('');
                refetch();
                setTimeout(() => setModerationNotice(''), 8000);
                return;
            }

            setReplyingTo(null);
            setReplyText('');
            refetch();
        } catch (err) {
            console.error('Error al enviar respuesta:', err);
            alert('Error al enviar la respuesta. Intenta de nuevo.');
        } finally {
            setReplySubmittingId(null);
        }
    };

    // Render recursivo de comentarios
    const renderComentarios = (lista) => (
        <div className="space-y-4">
            {lista.map(c => (
                <div key={c.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start gap-3">
                        <img src={c.avatarUrl} alt={c.fullName} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">{c.fullName}</span>
                                <span className="text-xs text-gray-500">{c.createdAt}</span>
                            </div>
                            {editingId === c.id ? (
                                <div className="mt-2">
                                    <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                                    <div className="flex justify-end gap-2 mt-1">
                                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                                        <button onClick={() => updateMutation.mutate({ id: c.id, texto: editingText })} className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Guardar</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-800 mt-1">{c.texto}</p>
                            )}

                            <div className="flex gap-2 mt-2">
                                <button onClick={() => likeMutation.mutate(c.id)} className={`text-sm px-3 py-1 rounded-full border transition ${c.likedByCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>👍 {c.likes}</button>
                                {auth.user && c.parentId === null && <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-sm text-gray-600 hover:text-blue-500">💬 Responder</button>}
                                {auth.user?.id === c.userId && <>
                                    <button onClick={() => { setEditingId(c.id); setEditingText(c.texto); }} className="text-sm text-gray-600 hover:text-green-500">✏️ Editar</button>
                                    <button onClick={() => deleteMutation.mutate(c.id)} className="text-sm text-gray-600 hover:text-red-500">🗑️ Eliminar</button>
                                </>}
                            </div>

                            {replyingTo === c.id && (
                                <div className="mt-2">
                                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escribe tu respuesta..." className="w-full border rounded-lg p-2 text-sm" disabled={replySubmittingId === c.id} />
                                    <div className="flex justify-end mt-1 gap-2">
                                        <button onClick={() => setReplyingTo(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                                        <button onClick={() => handleReplySubmit(c.id)} disabled={replySubmittingId === c.id} className="text-xs bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded hover:bg-blue-600">{replySubmittingId === c.id ? 'Enviando...' : 'Enviar'}</button>
                                    </div>
                                </div>
                            )}

                            {c.replies?.length > 0 && <div className="ml-6 mt-3 border-l-2 border-gray-200 pl-3">{renderComentarios(c.replies)}</div>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (isLoading) return <p>Cargando comentarios...</p>;
    if (isError) return <p>Error al cargar comentarios.</p>;

    return (
        <div className="comentarios-container mt-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <FaCommentDots className="text-blue-500" /> Comentarios
            </h3>

            {auth.user ? (
                <>
                    {moderationNotice && (
                        <div className="mb-4 p-3 rounded bg-yellow-100 border border-yellow-300 text-yellow-800">
                            {moderationNotice}
                        </div>
                    )}
                    <form onSubmit={handleSubmitComment} className="mb-4">
                        <textarea name="texto" placeholder="Escribe tu comentario..." className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400" disabled={submitting} />
                        <button type="submit" disabled={submitting} className="mt-2 bg-blue-500 disabled:opacity-50 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            {submitting ? 'Enviando comentario...' : 'Comentar'}
                        </button>
                    </form>
                    {comentarios.length > 0 ? renderComentarios(comentarios) : <p className="text-gray-600">Aún no hay comentarios. Sé el primero en comentar.</p>}
                </>
            ) : (
                <p>Debes <a href="/login" className="text-blue-500 underline">iniciar sesión</a> para comentar.</p>
            )}
        </div>
    );
}
