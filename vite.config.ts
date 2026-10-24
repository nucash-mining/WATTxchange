import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Sections served at their own path (wattxchange.app/nuchain): give each a copy
// of index.html so GitHub Pages answers 200 and the app picks the section from
// the path. Keep in sync with PATH_VIEWS in src/App.tsx.
const PATH_SECTIONS = ['nuchain']
const sectionPages = () => ({
  name: 'section-pages',
  apply: 'build' as const,
  writeBundle(opts: { dir?: string }) {
    const out = opts.dir || 'dist'
    for (const s of PATH_SECTIONS) {
      mkdirSync(join(out, s), { recursive: true })
      copyFileSync(join(out, 'index.html'), join(out, s, 'index.html'))
    }
    // deeper links (/nuchain/private) have no file: Pages serves 404.html, the app routes them
    copyFileSync(join(out, 'index.html'), join(out, '404.html'))
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages project site serves under /WATTxchange/. Set VITE_BASE=/ for
  // the custom-domain (wattxchange.app) build once the domain is renewed.
  base: process.env.VITE_BASE ?? '/WATTxchange/',
  plugins: [react(), sectionPages()],
  // Shim Node's `process.env` in the browser. Several services reference
  // `process.env.X || 'default'` at module top-level; without this, the first
  // one evaluated throws `ReferenceError: process is not defined` and takes
  // down the whole bundle (blank page). Empty object → fallbacks apply.
  define: {
    'process.env': {},
  },
  // kdflib.js pulls in kdflib_bg.wasm via `new URL(..., import.meta.url)` and a
  // set of ./snippets/*.js. Pre-bundling mangles that relative graph, so keep
  // the kdf engine out of esbuild's optimizer and let Vite serve it as-is.
  optimizeDeps: {
    exclude: ['@komodoplatform/kdflib'],
  },
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es',
  },
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
