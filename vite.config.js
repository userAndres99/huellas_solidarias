import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';


export default defineConfig({
    server:{
        port: 5173,
        proxy: {
            '/api':{
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            '/sanctum/csrf-cookie': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
        }
    },
    //  FullCalendar usa (evita errores que me salian en consola)
    optimizeDeps: {
        include: [
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction',
            '@fullcalendar/core/locales/es'
        ]
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
    // Usar el runtime JSX automático mejora rendimiento y evita warnings
    react({ jsxRuntime: 'automatic' }),

    ],
});
