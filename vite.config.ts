import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: '/cityfunrank/',
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true
    })
  ]
});
