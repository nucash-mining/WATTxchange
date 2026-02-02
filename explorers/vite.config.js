import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

const chain = process.env.VITE_CHAIN || 'wtx';

// Copy chain-specific logo to logo.png during build
const copyLogo = () => ({
  name: 'copy-logo',
  writeBundle(options) {
    const outDir = options.dir || process.env.VITE_OUT_DIR || 'dist';
    const logoSrc = resolve(__dirname, `public/${chain}-logo.png`);
    const logoDest = resolve(__dirname, `${outDir}/logo.png`);

    if (!existsSync(resolve(__dirname, outDir))) {
      mkdirSync(resolve(__dirname, outDir), { recursive: true });
    }

    if (existsSync(logoSrc)) {
      copyFileSync(logoSrc, logoDest);
      console.log(`Copied ${chain} logo to ${outDir}/logo.png`);
    }
  }
});

export default defineConfig({
  plugins: [react(), copyLogo()],
  define: {
    'import.meta.env.VITE_CHAIN': JSON.stringify(chain)
  },
  build: {
    outDir: process.env.VITE_OUT_DIR || 'dist'
  }
});
