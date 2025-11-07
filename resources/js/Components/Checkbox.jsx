export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'h-4 w-4 rounded-md border-gray-300 text-[var(--color-primary)] shadow-sm focus:ring-[var(--color-primary)] ' +
                className
            }
        />
    );
}
