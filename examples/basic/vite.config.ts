import { defineConfig } from 'vite';
import { APP_VERSION } from './app.version';

// Client bundle
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION)
  },
  build: {
    outDir: 'dist/client',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: './src/client.ts',
        styles: './src/styles.css'
      },
      output: {
        entryFileNames: 'client.entry.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'styles.css',
        format: 'es'
      }
    }
  }
});
