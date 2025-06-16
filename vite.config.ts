import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/api/axelar-rest': {
        target: 'https://rest-axelar.imperator.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/axelar-rest/, ''),
        secure: true
      },
      '/api/axelar-gmp': {
        target: 'https://api.gmp.axelarscan.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/axelar-gmp/, ''),
        secure: true
      }
    }
  }
});