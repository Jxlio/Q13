import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  server: {
    port: 3000,
    fs: {
      strict: false,
      allow: ['..']
    },
    proxy: {
      '/api': 'http://localhost:3000',
      '/paste': 'http://localhost:3000'
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        kyber: resolve(__dirname, 'src/js/kyber.js')
      },
      output: {
        entryFileNames: 'js/[name].js',
        format: 'iife',
        name: 'kyber'
      }
    }
  },
  optimizeDeps: {
    include: ['crystals-kyber']
  }
}); 