export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `btn-gradient btn-animate-gradient inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition transform disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ` +
                (disabled ? ' opacity-50 cursor-not-allowed ' : '') +
                className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
