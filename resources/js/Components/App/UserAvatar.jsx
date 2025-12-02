import React from 'react';
import LoadingImagenes from '@/Components/LoadingImagenes';

const UserAvatar = ({ user, online = null, profile = false}) => {

    let onlineClass = 
        online === true ? "avatar-online" : online === false ? "avatar-offline" : "";
    
    const sizeClass = profile ? "w-40 h-40" : "w-8 h-8";

    // soportar múltiples nombres de campo donde pueda venir la URL del avatar
    const initialAvatar = user?.avatar_url || user?.avatar || user?.profile_photo_url || user?.profile_photo || null;
    const [avatarUrl, setAvatarUrl] = React.useState(initialAvatar);
    const [displayName, setDisplayName] = React.useState(user?.name || '');

    React.useEffect(() => {
        setAvatarUrl(user?.avatar_url || user?.avatar || user?.profile_photo_url || user?.profile_photo || null);
        setDisplayName(user?.name || '');
    }, [user?.avatar_url, user?.avatar, user?.profile_photo_url, user?.profile_photo, user?.name]);

    React.useEffect(() => {
        const handler = (ev) => {
            try {
                const d = ev?.detail || {};
                if (!d || !d.id) return;
                // si el evento es para este usuario, actualizar avatar y nombre locales
                if (parseInt(d.id) === parseInt(user?.id)) {
                    if (d.profile_photo_url) setAvatarUrl(d.profile_photo_url);
                    if (d.name) setDisplayName(d.name);
                }
            } catch (e) {}
        };

        window.addEventListener('profile-updated', handler);
        return () => window.removeEventListener('profile-updated', handler);
    }, [user?.id]);

    return (
        <>
            {avatarUrl ? (
                <div className={`avatar ${onlineClass}`}>
                    <div className={`rounded-full overflow-hidden ${sizeClass}`}>
                        <LoadingImagenes
                            src={avatarUrl}
                            alt={displayName || 'avatar'}
                            imgClass={`w-full h-full object-cover rounded-full`}
                            wrapperClass={"w-full h-full"}
                            avatar={true}
                            fallback={(typeof window !== 'undefined' && window.location ? `${window.location.origin}/images/DefaultPerfil.jpg` : '/images/DefaultPerfil.jpg')}
                        />
                    </div>
                </div>
            ) : (
                <div className={`chat-image avatar avatar-placeholder ${onlineClass}`}>
                    <div
                        className={`bg-gray-400 text-gray-800 rounded-full ${sizeClass}`}
                    >
                        <span className="text-xl">
                            {String(displayName || user?.name || '').substring(0, 1)}
                        </span>

                    </div>

                </div>
            )}
        </>
    );
}


export default UserAvatar;