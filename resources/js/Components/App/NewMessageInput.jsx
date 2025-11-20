import React, { useEffect, useRef } from "react";
const NewMessageInput = ({ value, onChange, onSend}) => {

    const input = useRef();

    const onInputKeyDown = (ev) => {
        if(ev.key === "Enter" && !ev.shiftKey){
            ev.preventDefault();
            onSend()
        }
    };


     const onChangeEvent = (ev) => {
        setTimeout(() => {
            adjustHeight();
        }, 10);
        onChange(ev);
    };

    const adjustHeight = () => {
        setTimeout(() => {
            input.current.style.height = "auto";
            input.current.style.height = input.current.scrollHeight + 1 + "px";
        }, 100);
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);


    return(
        <textarea 
        aria-label="Cuadro de mensaje"
        ref={input}
        value={value}
        rows="1"
        placeholder="Escribe un mensaje"
        onKeyDown={onInputKeyDown}
        onChange={(ev) => onChangeEvent(ev)}
        className="input input-bordered w-full min-h-11 resize-none overflow-y-auto bg-base-100 max-h-40 rounded-none rounded-l-lg"
        >

        </textarea>
    )

}

export default NewMessageInput;