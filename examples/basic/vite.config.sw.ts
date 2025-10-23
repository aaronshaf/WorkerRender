import { defineConfig } from 'vite';
import { APP_VERSION } from './app.version';

// Service Worker bundle
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION)
  },
  build: {
    outDir: 'dist/sw',
    target: 'es2020',
    rollupOptions: {
      input: './src/sw.ts',
      output: {
        entryFileNames: 'sw.js',
        format: 'es'
      }
    }
  }
});
