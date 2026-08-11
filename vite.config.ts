import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.BACKEND_TARGET || 'http://localhost:4000';

  return {
    root: '.',
    publicDir: 'public',
    define: {
      'import.meta.env.VITE_CONTACT_API_URL': JSON.stringify(
        env.VITE_CONTACT_API_URL || ''
      ),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          about: resolve(__dirname, 'about.html'),
          services: resolve(__dirname, 'services.html'),
          process: resolve(__dirname, 'process.html'),
          blog: resolve(__dirname, 'blog.html'),
          contact: resolve(__dirname, 'contact.html'),
          privacy: resolve(__dirname, 'privacy.html'),
          terms: resolve(__dirname, 'terms.html'),
          architecture: resolve(__dirname, 'architecture.html'),
          construction: resolve(__dirname, 'construction.html'),
          design: resolve(__dirname, 'design.html'),
          furniture: resolve(__dirname, 'furniture.html'),
          landscape: resolve(__dirname, 'landscape.html'),
          'architecture-residential': resolve(__dirname, 'architecture/residential.html'),
          'architecture-commercial': resolve(__dirname, 'architecture/commercial.html'),
          'architecture-institutional': resolve(__dirname, 'architecture/institutional.html'),
        },
      },
    },
    server: {
      open: '/index.html',
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
