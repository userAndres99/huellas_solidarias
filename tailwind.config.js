import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Noto Sans', 'Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: '#0f766e', 
                    50: '#ecfdf7',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                },
                brand: {
                    DEFAULT: '#0369a1', 
                    400: '#0ea5e9',
                    600: '#0284c7',
                },
                surface: {
                    DEFAULT: '#f8fafb',
                },
                muted: {
                    DEFAULT: '#6b7280',
                },
            },
        },
    },

    plugins: [forms],
};
