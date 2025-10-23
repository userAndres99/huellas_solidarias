import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CommentSection } from 'react-comments-section';
import 'react-comments-section/dist/index.css';
import { formatDistanceToNow } from 'date-fns';
import { Inertia } from '@inertiajs/inertia';

export default function Comentarios({ comentableType, comentableId }) {
    const { auth } = usePage().props;
    const [comentarios, setComentarios] = useState([]);

    // Traer comentarios al montar
    useEffect(() => {
        fetchComentarios();
    }, []);

    const fetchComentarios = async () => {
       const res = await fetch(`/comentarios/json?comentable_id=${comentableId}&comentable_type=${comentableType}`);
        const data = await res.json();
        setComentarios(data.map(formatComentario));
    };

    // Formatear comentarios al formato de react-comments-section
    const formatComentario = (c) => ({
        comId: c.id,
        userId: c.user_id || `guest-${c.id}`,
        fullName: c.user?.name || c.usuario_nombre || 'Invitado',
        userProfile: c.user?.avatar || c.usuario_avatar || '/default.png',
        text: c.texto,
        replies: c.respuesta?.map(formatComentario) || [],
        createdAt: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }),
    });

    
    // Cuando el usuario envía un comentario
const handleSubmitComment = async (data) => {
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
                parent_id: data.replyToId || null
            })
        });

        if (!res.ok) throw new Error('Error al enviar comentario');

        const updatedComentarios = await res.json();
        setComentarios(updatedComentarios.map(formatComentario));

    } catch (error) {
        console.error(error);
        alert('No se pudo enviar el comentario');
    }
};


    return (
        <div className="comentarios-container">
            {auth.user ? (
                <CommentSection
                    currentUser={{
                        currentUserId: auth.user.id,
                        currentUserFullName: auth.user.name,
                        currentUserImg: auth.user.avatar || '/default.png'
                    }}
                    commentData={comentarios}
                    onSubmitAction={handleSubmitComment}
                    logIn={{
                        loginLink: '/login',
                        signupLink: '/register'
                    }}
                    customInputPlaceHolder="Escribe tu comentario..."
                />
            ) : (
                <p>
                    Debes <a href="/login">Iniciar sesión</a> para comentar
                </p>
            )}
        </div>
    );
}
