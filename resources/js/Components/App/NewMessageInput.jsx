import React, { useEffect, useRef } from 'react';

const NewMessageInput = ({ value, onChange, onSend, onFocus, onBlur }) => {
    const input = useRef();

    const onInputKeyDown = (ev) => {
        if (ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault();
            onSend();
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
            if (!input.current) return;
            input.current.style.height = 'auto';
            input.current.style.height = input.current.scrollHeight + 1 + 'px';
        }, 100);
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    const handleFocus = (ev) => {
        if (typeof onFocus === 'function') onFocus(ev);
        adjustHeight();
    };

    const handleBlur = (ev) => {
        if (typeof onBlur === 'function') onBlur(ev);
    };

    return (
        <textarea
            aria-label="Cuadro de mensaje"
            ref={input}
            value={value}
            rows="1"
            placeholder="Escribe un mensaje"
            onKeyDown={onInputKeyDown}
            onChange={(ev) => onChangeEvent(ev)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleFocus}
            onTouchStart={handleFocus}
            className="input input-bordered w-full min-h-11 resize-none overflow-y-auto bg-[#9ED9F0] text-slate-900 max-h-40 rounded-none rounded-l-lg"
        />
    );
};

export default NewMessageInput;