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
        if (conversation && conversation.is_user) formData.append("receiver_id", conversation.id);
        else if (conversation && conversation.is_group) formData.append("group_id", conversation.id);

        try {
            setMessageSending(true);
            await axios.post(route("message.store"), formData, {
                onUploadProgress: (progressEvent) => {
                    if (!progressEvent.total) return;
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setUploadProgress(progress);
                },
            });
            setNewMessage("");
            setChosenFiles([]);
            setUploadProgress(0);
        } catch (err) {
            const msg = err?.response?.data?.message;
            setInputErrorMessage(msg || "Un error ocurrió al enviar el mensaje");
        } finally {
            setMessageSending(false);
        }
    };

    const onLikeClick = () => {
        if (messageSending) return;
        const data = { message: "👍" };
        if (conversation && conversation.is_user) data.receiver_id = conversation.id;
        else if (conversation && conversation.is_group) data.group_id = conversation.id;
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