import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}); 