import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const rawApiBase = env.VITE_API_BASE_URL || "https://heroics-ambush-baton.ngrok-free.dev";
  const backendBase = rawApiBase.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/+$/, '') || 'http://localhost:5000';
  const apiTarget = rawApiBase;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backendBase,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        },
        '/uploads': {
          target: backendBase,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        },
        '/proxy-api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/proxy-api/, ''),
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')
            ) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/axios')) {
              return 'vendor-ui';
            }
          }
        }
      }
    }
  };
});
