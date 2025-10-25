import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CommentSection } from 'react-comments-section';
import 'react-comments-section/dist/index.css';
import { formatDistanceToNow } from 'date-fns';

import { useQuery } from '@tanstack/react-query';
import { FaCommentDots } from 'react-icons/fa';

export default function Comentarios({ comentableType, comentableId }) {
    const { auth } = usePage().props;

    // convierte url relativa a absoluta
    function makeAbsolute(url) {
      if (!url) return null;
      if (/^https?:\/\//.test(url)) return url;
      return `${window.location.origin}${url}`;
    }

    // Formatear comentarios al formato de react-comments-section
    const formatComentario = (c) => {
        if (!c) return null;
        const photo = c.usuario_avatar || c.user?.profile_photo_url || '/images/DefaultPerfil.jpg';
        const absPhoto = makeAbsolute(photo);

        return {
            comId: c.id,
            userId: c.user_id || `guest-${c.id}`,
            fullName: c.user?.name || c.usuario_nombre || 'Invitado',
            avatarUrl: absPhoto,
            userProfile: absPhoto,
            text: c.texto,
            replies: c.respuesta?.map(formatComentario) || [],
            createdAt: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }),
        };
    };

    // Traer comentarios al montar
    const { data: comentarios = [], refetch, isLoading, isError } = useQuery({
        queryKey: ['comentarios', comentableId, comentableType],
        queryFn: async() => {
            const res = await fetch(`/comentarios/json?comentable_id=${comentableId}&comentable_type=${comentableType}`);
            if(!res.ok) throw new Error('Error al cargar comentarios');
            const data = await res.json();
            return data.map(formatComentario);
        }
    });

    // Escuchar evento global para refetch cuando el perfil se actualice
    useEffect(() => {
        const handler = () => {
            if (typeof refetch === 'function') refetch();
        };
        window.addEventListener('profile-updated', handler);
        return () => window.removeEventListener('profile-updated', handler);
    }, [refetch]);

    // Cuando el usuario envía un comentario
    const handleSubmitComment = async (data) => {
        console.log('Comentario enviado:', data);
        if (!auth.user) return alert('Debes iniciar sesión para comentar.');

        try {
            const res = await fetch('/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    comentable_id: comentableId,
                    comentable_type: comentableType,
                    texto: data.text,
                    parent_id: data.parentOfRepliedCommentId || data.repliedToCommentId || null
                })
            });

            if (!res.ok) throw new Error('Error al enviar comentario');

            refetch();
            console.log("✅ Comentario o respuesta enviado correctamente");
        } catch (error) {
            console.error(error);
            alert('No se pudo enviar el comentario');
        }
    };

    const handleSubmitReply = async (data) => {
        console.log("💬 Respuesta enviada:", data);

        if (!auth.user) return alert('Debes iniciar sesión para responder.');

        try {
            const res = await fetch('/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    comentable_id: comentableId,
                    comentable_type: comentableType,
                    texto: data.text,
                    parent_id: data.repliedToCommentId || null,
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("⚠️ Error del servidor:", errorData);
                throw new Error('Error al enviar respuesta');
            }

            console.log("✅ Respuesta guardada correctamente");
            refetch();
        } catch (error) {
            console.error("❌ Error al enviar respuesta:", error);
        }
    };

    if (isLoading) return <p>Cargando Comentarios...</p>;
    if (isError) return <p>Error al cargar comentarios.</p>;

    return (
        <div className="comentarios-container">
            <h3 className='text-lg font-semibold flex items-center gap-2'>
                <FaCommentDots className="text-blue-500"/>
                Comentarios
            </h3>
            {auth.user ? (
                <CommentSection
                    currentUser={{
                        currentUserId: auth.user.id,
                        currentUserFullName: auth.user.name,
                        currentUserImg: auth.user.profile_photo_url
                          ? (auth.user.profile_photo_url.startsWith('http') ? auth.user.profile_photo_url : window.location.origin + auth.user.profile_photo_url)
                          : `${window.location.origin}/images/DefaultPerfil.jpg`
                    }}
                    commentData={comentarios}
                    onSubmitAction={handleSubmitComment}
                    onReplyAction={handleSubmitReply}
                    logIn={{
                        loginLink: '/login',
                        signupLink: '/register'
                    }}
                    customInputPlaceHolder="Escribe tu comentario..."
                    commentDateFormat="relative"
                />
            ) : (
                <p>
                    Debes <a href="/login">Iniciar sesión</a> para comentar
                </p>
            )}
        </div>
    );
}