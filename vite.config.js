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
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),

    ],
    define: {
        global: 'window', 
    },
    optimizeDeps: {
        include: ['emoji-picker-react'],
    },
});
