import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: '/cityfunrank/',
  server: {
    proxy: {
      '/api/ops': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      },
      '/api/healthz': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      }
    }
  },
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true
    })
  ]
});
