import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const apiProxy = process.env.VITE_API_PROXY || 'http://127.0.0.1:4331';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(root, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: apiProxy,
          changeOrigin: false,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: apiProxy,
          changeOrigin: false,
        },
      },
    },
  };
});
