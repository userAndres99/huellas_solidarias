import React, { useState, Fragment, useRef } from "react";
import {
    PaperClipIcon,
    PhotoIcon,
    FaceSmileIcon,
    HandThumbUpIcon,
    PaperAirplaneIcon,
    XCircleIcon,
    MicrophoneIcon,
} from "@heroicons/react/24/solid";
import axios from "axios";
import NewMessageInput from "./NewMessageInput";
import { useEventBus } from '@/EvenBus';
import EmojiPicker from "emoji-picker-react";
import { Popover, Transition } from "@headlessui/react";
import { isAudio, isImage } from "@/helpers";
import CustomAudioPlayer from "./CustomAudioPlayer";
import AttachmentPreview from "./AttachmentPreview";
import AudioRecorder from "./AudioRecorder";

const MessageInput = ({ conversation = null, onFocus = null, onBlur = null, isMobile = false, compact = false }) => {
    const [newMessage, setNewMessage] = useState("");
    const [inputErrorMessage, setInputErrorMessage] = useState("");
    const [messageSending, setMessageSending] = useState(false);
    const [chosenFiles, setChosenFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const attachInputRef = useRef();
    const photoInputRef = useRef();
    const [showEmoji, setShowEmoji] = useState(false);
    const [showAudioInMenu, setShowAudioInMenu] = useState(false);

    const onFileChange = (ev) => {
        const files = ev.target.files || [];
        const updatedFiles = Array.from(files).map((file) => ({ file, url: URL.createObjectURL(file) }));
        setChosenFiles((prev) => [...prev, ...updatedFiles]);
    };
    const recordedAudioReady = (file, url) => {
        setChosenFiles((prevFiles) => [...prevFiles, { file, url }]);
    };

    const { emit } = useEventBus();

    const onSendClick = async () => {
        if (messageSending) return;
        if (newMessage.trim() === "" && chosenFiles.length === 0) {
            setInputErrorMessage("Por favor escribe un mensaje o adjunta un archivo");
            setTimeout(() => setInputErrorMessage(""), 3000);
            return;
        }
        const formData = new FormData();
        chosenFiles.forEach((f) => {
            if (f && f.file) formData.append("attachments[]", f.file);
        });
        formData.append("message", newMessage);
        // determina receiver_id o group_id segun el tipo de conversacion
        const receiverId = conversation?.id || conversation?.with_user_id || conversation?.user_id || null;
        const groupId = conversation?.id || conversation?.conversation_id || null;

        if (conversation && conversation.is_user && receiverId) formData.append("receiver_id", receiverId);
        else if (conversation && conversation.is_group && groupId) formData.append("group_id", groupId);
        //debug info
        try {
            
            if (process && process.env && process.env.NODE_ENV !== 'production') {
                console.debug('Sending message payload', { message: newMessage, receiverId, groupId, filesCount: chosenFiles.length });
            }
        } catch (e) {}

        try {
            setMessageSending(true);
            const { data: created } = await axios.post(route("message.store"), formData, {
                onUploadProgress: (progressEvent) => {
                    if (!progressEvent.total) return;
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setUploadProgress(progress);
                },
            });
            // emitir eventos para desocultar conversacion si estaba oculta y actualizar sidebar
            try {
                // Si la conversación es con usuario y estaba oculta, desocultarla
                if (conversation && conversation.is_user && (receiverId || data?.receiver_id || created?.receiver_id)) {
                    const id = receiverId || data?.receiver_id || created?.receiver_id;
                    if (emit) emit('conversation.unhide', { id });
                    try {
                        // Persistir desocultación en el servidor para que permanezca después de recargar
                        await axios.post(route('conversations.unhide', id));
                    } catch (e) {
                        
                    }
                } else if (conversation && conversation.is_group && (groupId || data?.group_id || created?.group_id)) {
                    const id = groupId || data?.group_id || created?.group_id;
                    if (emit) emit('conversation.unhide', { id });
                    try {
                        await axios.post(route('conversations.unhide', id));
                    } catch (e) {}
                }
                // También emitir el mensaje creado localmente para que los widgets que escuchan puedan agregarlo inmediatamente
                if (created) {
                    if (emit) emit('message.created', created);
                    try {
                       
                        const rid = receiverId || created?.receiver_id || null;
                        const gid = groupId || created?.group_id || null;
                        if (rid) {
                            const receiver = created?.receiver || null;
                            const name = (receiver && (receiver.name || receiver.display_name)) || (conversation && (conversation.name || conversation.title)) || `Usuario ${rid}`;
                            const avatar = (receiver && (receiver.avatar_url || receiver.avatar || receiver.profile_photo_url)) || (conversation && (conversation.avatar || conversation.profile_photo_url)) || null;
                            const convObj = {
                                is_user: true,
                                is_group: false,
                                id: rid,
                                name,
                                avatar,
                                avatar_url: avatar || (conversation && (conversation.avatar_url || conversation.profile_photo_url)) || null,
                                last_message: created?.message ? `Yo: ${created.message}` : (newMessage ? `Yo: ${newMessage}` : 'Yo'),
                                last_message_date: created?.created_at || null,
                                conversation_id: created?.conversation_id || conversation?.conversation_id || null,
                                with_user_id: rid,
                            };
                            if (emit) emit('conversation.last_message', convObj);
                        }
                    } catch (e) {}
                }
            } catch (e) {}
            setNewMessage("");
            setChosenFiles([]);
            setUploadProgress(0);
        } catch (err) {
            const resp = err?.response?.data || {};
            const msg = resp?.message || null;
            // validador de errores
            if (resp?.errors) {
                const first = Object.values(resp.errors).flat()[0];
                setInputErrorMessage(first || msg || "Error de validación");
            } else {
                setInputErrorMessage(msg || "Un error ocurrió al enviar el mensaje");
            }
            // registrar error 
            try { console.error('Message send error', err); } catch (e) {}
        } finally {
            setMessageSending(false);
        }
    };

    const onLikeClick = () => {
        if (messageSending) return;
        const data = { message: "👍" };
        const receiverId = conversation?.id || conversation?.with_user_id || conversation?.user_id || null;
        const groupId = conversation?.id || conversation?.conversation_id || null;
        if (conversation && conversation.is_user && receiverId) data.receiver_id = receiverId;
        else if (conversation && conversation.is_group && groupId) data.group_id = groupId;
        axios.post(route("message.store"), data).catch(() => {});
    };


    return (
        <div className="flex items-start border-t border-slate-700 py-3">
            <div className="order-2 p-1 flex-shrink-0 flex items-center gap-1">
                {!(isMobile || compact) && (
                    <>
                        <button
                            className="p-1 text-gray-400 hover:text-gray-300 relative"
                            aria-label="Documentos"
                            onClick={() => attachInputRef.current && attachInputRef.current.click()}
                        >
                            <PaperClipIcon className="w-5 h-5" />
                        </button>
                        <button
                            className="p-1 text-gray-400 hover:text-gray-300 relative"
                            title="Seleccionar Imagen"
                            onClick={() => photoInputRef.current && photoInputRef.current.click()}
                        >
                            <PhotoIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <AudioRecorder fileReady={recordedAudioReady} title="boton audio voz" />
                        </div>
                    </>
                )}

                <input ref={attachInputRef} type="file" multiple onChange={onFileChange} className="hidden" />
                <input ref={photoInputRef} type="file" multiple accept="image/*" onChange={onFileChange} className="hidden" />
            </div>
            <div className="order-1 px-2 xs:p-0 min-w-0 flex-1 relative">
                <div className="flex items-center gap-2 w-full">
                    <NewMessageInput
                        value={newMessage}
                        onSend={onSendClick}
                        onChange={(ev) => setNewMessage(ev.target.value)}
                        onFocus={onFocus}
                        onBlur={onBlur}
                    />
                    <button type="button" onClick={onSendClick} disabled={messageSending} className="btn btn-info rounded-l-none px-3 py-2" aria-label="Enviar mensaje">
                        <PaperAirplaneIcon className="w-6"/>
                        <span className="hidden sm:inline">Enviar</span>
                    </button>
                </div>{" "}
                {!!uploadProgress && (
                    <progress
                        className="progress progress-info w-full"
                        value={uploadProgress}
                        max="100"
                    >

                    </progress>
                )}

                {inputErrorMessage && (
                    <p className="text-xs text-red-400">{inputErrorMessage}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                    {chosenFiles.map((file)=> (
                        <div
                            key={file.file.name}
                            className={
                                `relative flex justify-between cursor-pointer` +
                                (!isImage(file.file) ? " w-[240px]" : "")
                            }
                        >
                            {isImage(file.file) && (
                                <img
                                    src={file.url}
                                    alt=""
                                    className="w-16 h-16 object-cover"
                                />
                            )}
                            {isAudio(file.file) && (
                                <CustomAudioPlayer
                                    file = {file}
                                    showVolume={false}
                                />
                            )}
                            {!isAudio(file.file) && !isImage(file.file) && (
                                <AttachmentPreview file={file}/>
                            )}

                            <button
                                onClick={() => 
                                    setChosenFiles(
                                        chosenFiles.filter(
                                            (f) =>
                                                f.file.name !== file.file.name
                                        )
                                    )
                                }
                                className="absolute w-6 h-6 rounded-full bg-gray-800 -right-2 -top-2 text-gray-300 hover:text-gray-100 z-10"
                            >
                                <XCircleIcon className="w-6"/>

                            </button>

                        </div>
                    ))}

                </div>
            </div>
            <div className="order-3 xs:order-3 p-1 flex items-center gap-2">
                {!(isMobile || compact) ? (
                    <div className="flex items-center gap-2 relative">
                        <button
                            className="p-1 text-gray-400 hover:text-gray-300"
                            title="emoji"
                            onClick={() => { setShowEmoji(true); }}
                        >
                            <FaceSmileIcon className="w-5 h-5" />
                        </button>

                        {!showEmoji && (
                            <button onClick={onLikeClick} className="p-1 text-gray-400 hover:text-gray-300" title="Like">
                                <HandThumbUpIcon className="w-5 h-5" />
                            </button>
                        )}

                        {showEmoji && (
                            <div className="absolute z-10 right-0 bottom-full w-[320px] max-w-[92vw] rounded-md bg-gray-800 shadow-lg p-2">
                                <div className="flex items-center justify-between mb-2">
                                    <button onClick={() => setShowEmoji(false)} className="text-sm text-gray-200 px-2 py-1 hover:bg-white/5 rounded">Volver</button>
                                    <button onClick={() => setShowEmoji(false)} className="text-gray-400 p-1 hover:text-gray-200">
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className={`${(isMobile || compact) ? 'max-h-[220px] overflow-auto p-1' : ''}`}>
                                    <EmojiPicker theme="dark" onEmojiClick={(ev) => { setNewMessage(newMessage + ev.emoji); setShowEmoji(false); }} />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <Popover className="relative inline-block text-left">
                            <Popover.Button className="p-1 text-gray-400 hover:text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 12a2 2 0 11-4 0 2 2 0 014 0zm9 0a2 2 0 11-4 0 2 2 0 014 0zM22 12a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            </Popover.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Popover.Panel className="absolute right-0 bottom-full mb-2 w-[320px] max-w-[92vw] rounded-md bg-gray-800 shadow-lg z-50 p-2">
                                    <div className="flex flex-col gap-1">
                                        {!showEmoji ? (
                                            <>
                                                <button onClick={() => attachInputRef.current && attachInputRef.current.click()} className="flex items-center gap-2 px-2 py-1 text-sm text-gray-100 hover:bg-black/30">
                                                    <PaperClipIcon className="w-5 h-5" />
                                                    <span>Archivo</span>
                                                </button>
                                                <button onClick={() => photoInputRef.current && photoInputRef.current.click()} className="flex items-center gap-2 px-2 py-1 text-sm text-gray-100 hover:bg-black/30">
                                                    <PhotoIcon className="w-5 h-5" />
                                                    <span>Imagen</span>
                                                </button>
                                                <button onClick={() => setShowAudioInMenu((s) => !s)} className="flex items-center gap-2 px-2 py-1 text-sm text-gray-100 hover:bg-black/30">
                                                    <MicrophoneIcon className="w-5 h-5" />
                                                    <span>Audio</span>
                                                </button>
                                                <button onClick={() => { setShowEmoji(true); setShowAudioInMenu(false); }} className="flex items-center gap-2 px-2 py-1 text-sm text-gray-100 hover:bg-black/30">
                                                    <FaceSmileIcon className="w-5 h-5" />
                                                    <span>Emoji</span>
                                                </button>
                                                <button onClick={() => { onLikeClick(); }} className="flex items-center gap-2 px-2 py-1 text-sm text-gray-100 hover:bg-black/30">
                                                    <HandThumbUpIcon className="w-5 h-5" />
                                                    <span>Like</span>
                                                </button>

                                                {showAudioInMenu && (
                                                    <div className="w-full px-2 py-1 mt-1">
                                                        <AudioRecorder fileReady={recordedAudioReady} title="Audio" />
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full">
                                                <div className="flex items-center justify-between px-2 py-1">
                                                    <button onClick={() => setShowEmoji(false)} className="text-sm text-gray-200 px-2 py-1 hover:bg-white/5 rounded">Volver</button>
                                                    <button onClick={() => setShowEmoji(false)} className="text-gray-400 p-1 hover:text-gray-200">
                                                        <XCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="w-full px-2 py-1 mt-1">
                                                    <div className="max-h-[320px] overflow-auto">
                                                        <EmojiPicker theme="dark" onEmojiClick={(ev) => { setNewMessage(newMessage + ev.emoji); setShowEmoji(false); }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Popover.Panel>
                            </Transition>
                        </Popover>
                    </div>
                )}
            </div>

        </div>
    );

}

export default MessageInput;