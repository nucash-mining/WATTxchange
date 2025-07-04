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
        secure: true,
        timeout: 10000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Axelar REST proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Axelar REST:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Axelar REST:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/api/axelar-gmp': {
        target: 'https://api.gmp.axelarscan.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/axelar-gmp/, ''),
        secure: true,
        timeout: 10000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Axelar GMP proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Axelar GMP:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Axelar GMP:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
});