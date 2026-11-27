import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const rawApiBase = env.VITE_API_BASE_URL || "https://heroics-ambush-baton.ngrok-free.dev";
  const backendBase = rawApiBase.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/+$/, '') || 'https://heroics-ambush-baton.ngrok-free.dev';
  const apiTarget = rawApiBase;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react/dist/cjs/lucide-react.js')
      }
    },
    optimizeDeps: {
      include: ['html2canvas', 'jspdf']
    },
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
            const normalized = id.replace(/\\/g, '/');
            if (
              normalized.includes('node_modules/react/') ||
              normalized.includes('node_modules/react-dom/') ||
              normalized.includes('node_modules/react-router')
            ) {
              return 'vendor-react';
            }
            if (normalized.includes('node_modules/lucide-react') || normalized.includes('node_modules/axios')) {
              return 'vendor-ui';
            }
            if (normalized.includes('node_modules/html2canvas') || normalized.includes('node_modules/jspdf')) {
              return 'vendor-pdf';
            }
          }
        }
      }
    }
  };
});
