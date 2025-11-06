import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    const base = 'nav-link';
    const classes = `${base} ${active ? 'active' : ''} ${className}`;
    return (
        <Link {...props} className={classes}>
            {children}
        </Link>
    );
}