import { defineConfig } from 'vite';

// Cloudflare Worker bundle
export default defineConfig({
  ssr: {
    target: 'webworker',
    noExternal: true
  },
  build: {
    outDir: 'dist/worker',
    target: 'es2020',
    ssr: true,
    rollupOptions: {
      input: './worker.ts',
      output: {
        entryFileNames: 'worker.js',
        format: 'es'
      }
    }
  }
});
