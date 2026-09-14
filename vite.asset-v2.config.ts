import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: '.asset-build/public-v2',
  build: {
    target: 'es2022',
  },
});
