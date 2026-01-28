import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    modulePreload: {
      polyfill: false
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
