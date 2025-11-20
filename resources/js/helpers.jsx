export const formatMessageDateLong = (date) => {
    const now = new Date();
    const inputDate = new Date(date);

    if(isToday(inputDate)){
        return inputDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
    }else if(isYesterday(inputDate)){
        return (
            "Yesterday " + 
            inputDate.toLocaleDateString([], {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    }else if( inputDate.getFullYear() === now.getFullYear()){
        return inputDate.toLocaleDateString([], {
            day: "2-digit",
            month: "short",
        });
    }else{
        return inputDate.toLocaleDateString();
    }
}


export const formatMessageDateShort = (date) =>{
    const  now = new Date();
    const inputDate = new Date(date);

    if (isToday(inputDate)){
        return inputDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    }else if(isYesterday(inputDate)){
        return "Yesterday";
    }else if (inputDate.getFullYear() === now.getFullYear()){
        return inputDate.toLocaleDateString([],{
            day: "2-digit",
            month: "short",
        });
    }else{
        return inputDate.toLocaleDateString();
    }
};




export const isToday = (date) => {
    const today = new Date();
    return(
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    ); 
};


export const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    );
};


export const isImage = (attachment) => {
    let mime=  attachment.mime || attachment.type;
    mime = mime.split("/");
    return mime[0].toLowerCase() === "image";
};  

export const isVideo = (attachment) => {
    let mime = attachment.mime || attachment.type;
    mime = mime.split("/");
    return mime[0].toLowerCase() === "video";
};

export const isAudio = (attachment) => {
    let mime = attachment.mime || attachment.type;
    mime = mime.split("/");
    return mime[0].toLowerCase() === "audio";
};

export const isPDF = (attachment) => {
    let mime = attachment.mime || attachment.type;
    return mime === "application/pdf";
}

export const isPreviewable = (attachment) => {
    return (
        isImage(attachment) ||
        isVideo(attachment) ||
        isAudio(attachment) ||
        isPDF(attachment)
    );
};


export const formatBytes = (bytes, decimals = 2) => {
    if(bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    let i = 0;
    let size = bytes;
    while (size >= k){
        size /= k;
        i++;
    }

    return parseFloat(size.toFixed(dm)) + " " + sizes[i];
}

/**
 * Preload
 */
export const preloadImages = async (urls = []) => {
    if (!Array.isArray(urls) || urls.length === 0) return;

    const unique = Array.from(new Set(urls.filter(Boolean)));

    await Promise.all(unique.map(src => new Promise(async resolve => {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            const onError = () => resolve(false);
            const onLoad = async () => {
                try {
                    if (typeof img.decode === 'function') {
                        await img.decode();
                    }
                    resolve(true);
                } catch (e) {
                    
                    resolve(true);
                }
            };

            img.addEventListener('load', onLoad, { once: true });
            img.addEventListener('error', onError, { once: true });
            img.src = src;
        } catch (e) {
            resolve(false);
        }
    })));
};