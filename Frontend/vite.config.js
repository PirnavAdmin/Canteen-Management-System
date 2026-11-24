import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const rawApiBase = env.VITE_API_BASE_URL || "https://whiff-lyrics-debug.ngrok-free.dev";
  const backendBase = rawApiBase.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/+$/, '') || 'https://whiff-lyrics-debug.ngrok-free.dev';
  const apiTarget = rawApiBase;

  return {
    plugins: [react()],
    server: {
      cors: true,
      proxy: {
        '/api': {
          target: backendBase,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          },
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              if (res && res.writeHead && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  message: 'Backend API endpoint or ngrok tunnel is currently offline or unreachable.',
                  error: err.message
                }));
              }
            });
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
