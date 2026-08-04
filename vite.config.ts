import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        services: resolve(__dirname, 'services.html'),
        portfolio: resolve(__dirname, 'portfolio.html'),
        process: resolve(__dirname, 'process.html'),
        blog: resolve(__dirname, 'blog.html'),
        contact: resolve(__dirname, 'contact.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
      },
    },
  },
  server: {
    open: '/index.html',
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
