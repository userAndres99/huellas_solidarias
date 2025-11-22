import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Inertia } from '@inertiajs/inertia';
import { EventBusProvider } from './EvenBus';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const queryClient = new QueryClient();
// Cada vez que Inertia navegue a una nueva página
// 🔹 Actualizar CSRF token dinámicamente al navegar con Inertia
Inertia.on('navigate', () => {
  const newToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (newToken) {
    document.querySelectorAll('meta[name="csrf-token"]').forEach(meta => {
      meta.setAttribute('content', newToken);
    });
  }
});
createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
      // Fallback manual usando import.meta.glob para evitar incompatibilidades
      const pages = import.meta.glob('./Pages/**/*.jsx');
      const path = `./Pages/${name}.jsx`;
      const resolver = pages[path];
      if (!resolver) {
        // si no existe, lanzar para que Inertia lo gestione
        return Promise.reject(new Error(`Page not found: ${path}`));
      }
      return resolver().then((mod) => mod.default || mod);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
        <EventBusProvider>
        <QueryClientProvider client={queryClient}>
        <App {...props} />
        </QueryClientProvider>
        </EventBusProvider>
    
    );
    },
    progress: {
        color: '#4B5563',
    },
});
