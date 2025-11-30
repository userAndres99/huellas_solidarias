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
            const max = 120; 
            const sh = input.current.scrollHeight + 1;
            
            input.current.style.overflowX = 'hidden';
            if (sh > max) {
                input.current.style.height = `${max}px`;
                input.current.style.overflowY = 'auto';
            } else {
                input.current.style.height = `${sh}px`;
                input.current.style.overflowY = 'hidden';
            }
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
            placeholder="escribe...."
            onKeyDown={onInputKeyDown}
            onChange={(ev) => onChangeEvent(ev)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleFocus}
            onTouchStart={handleFocus}
            className="input input-bordered w-full min-h-[36px] resize-none bg-[#9ED9F0] text-slate-900 max-h-[120px] rounded-none rounded-l-lg px-3 py-1 overflow-x-hidden whitespace-pre-wrap break-words"
        />
    );
};

export default NewMessageInput;