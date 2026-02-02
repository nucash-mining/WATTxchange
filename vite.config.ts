import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Bitcoin RPC proxy
      '/api/bitcoin-rpc': {
        target: 'http://localhost:8332',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bitcoin-rpc/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Handle authentication headers
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // Litecoin RPC proxy
      '/api/litecoin-rpc': {
        target: 'http://localhost:9332',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/litecoin-rpc/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // Monero RPC proxy
      '/api/monero-rpc': {
        target: 'http://127.0.0.1:18081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/monero-rpc/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // Ghost RPC proxy
      '/api/ghost-rpc': {
        target: 'http://localhost:51725',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ghost-rpc/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // Trollcoin RPC proxy
      '/api/trollcoin-rpc': {
        target: 'http://localhost:51726',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trollcoin-rpc/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // HTH RPC proxy
      '/api/hth-rpc': {
        target: 'http://localhost:51727',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hth-rpc/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // Raptoreum RPC proxy
      '/api/raptoreum-rpc': {
        target: 'http://localhost:51728',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/raptoreum-rpc/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // Altcoinchain RPC proxy
      '/api/altcoinchain-rpc': {
        target: 'http://localhost:8545',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/altcoinchain-rpc/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      // WTX Explorer API proxy
      '/api/wtx-explorer': {
        target: 'https://wtx-explorer.wattxchange.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/wtx-explorer/, '/api'),
      },
      // HTH Explorer API proxy
      '/api/hth-explorer': {
        target: 'https://hth-explorer.wattxchange.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/hth-explorer/, '/api'),
      },
      // FLOP Explorer API proxy
      '/api/flop-explorer': {
        target: 'https://flop-explorer.wattxchange.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/flop-explorer/, '/api'),
      },
      // ALT Explorer API proxy
      '/api/alt-explorer': {
        target: 'https://alt-explorer.wattxchange.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/alt-explorer/, '/api'),
      },
      // Xa DEX API proxy
      '/api/dex': {
        target: 'https://dex-api.wattxchange.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/dex/, ''),
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
