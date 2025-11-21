import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import {
    createContext,
    useContext,
    useState,
    useRef,
    useEffect,
} from 'react';

const DropDownContext = createContext();

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);

    const triggerRef = useRef(null);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    return (
        <DropDownContext.Provider
            value={{ open, setOpen, toggleOpen, triggerRef }}
        >
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { open, setOpen, toggleOpen, triggerRef } = useContext(
        DropDownContext
    );

    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'Enter':
            case ' ': // space
            case 'ArrowDown':
                e.preventDefault();
                
                if (!open) {
                    setOpen(true);

                    setTimeout(() => {
                        const menu = document.querySelector(
                            '[data-dropdown-menu]'
                        );
                        const firstItem = menu?.querySelector(
                            '[role="menuitem"]'
                        );
                        firstItem?.focus();
                    }, 0);
                }
                break;
            case 'Escape':
                setOpen(false);
                break;
        }
    };

    return (
        <>
            <button
                ref={triggerRef}
                onClick={toggleOpen}
                onKeyDown={handleKeyDown}
                aria-haspopup="menu"
                aria-expanded={open}
                className="focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                type="button"
            >
                {children}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                ></div>
            )}
        </>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white',
    children,
}) => {
    const { open, setOpen, triggerRef } = useContext(DropDownContext);

    let alignmentClasses = 'origin-top';

    if (align === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (align === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
    }

    const containerRef = useRef(null);

    useEffect(() => {
        if (open && containerRef.current) {

            const firstItem = containerRef.current.querySelector(
                '[role="menuitem"]'
            );
            firstItem?.focus();
        }

        if (!open) {
            // when closing, return focus to trigger
            triggerRef?.current?.focus?.();
        }
    }, [open, triggerRef]);

    const handleKeyDown = (e) => {
        if (!containerRef.current) return;

        const items = Array.from(
            containerRef.current.querySelectorAll('[role="menuitem"]')
        );

        if (!items.length) return;

        const currentIndex = items.indexOf(document.activeElement);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const next = items[(currentIndex + 1) % items.length];
                next?.focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prev =
                    items[(currentIndex - 1 + items.length) % items.length];
                prev?.focus();
                break;
            case 'Escape':
                setOpen(false);
                break;
        }
    };

    return (
        <>
            <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div
                    ref={containerRef}
                    role="menu"
                    data-dropdown-menu
                    tabIndex={-1}
                    onKeyDown={handleKeyDown}
                    className={`absolute z-50 mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`}
                >
                    <div
                        className={`rounded-md ring-1 ring-black ring-opacity-5 ${contentClasses}`}
                    >
                        {children}
                    </div>
                </div>
            </Transition>
        </>
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            role="menuitem"
            tabIndex={0}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
