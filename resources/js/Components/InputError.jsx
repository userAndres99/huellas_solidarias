export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            role="alert"
            aria-live="polite"
            className={'text-sm text-red-600 ' + className}
        >
            {message}
        </p>
    ) : null;
}
