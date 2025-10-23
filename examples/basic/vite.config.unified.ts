import { defineConfig } from 'vite';
import path from 'node:path';

/**
 * Unified Vite configuration with build modes
 * Use: vite build --mode client|sw|worker
 *
 * Why a single config: Simplifies maintenance and ensures consistency
 * across all three bundles while keeping configuration DRY.
 */
export default defineConfig(({ mode }) => {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  // Base configuration shared across all modes
  const baseConfig = {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@worker-render/core': path.resolve(__dirname, '../../packages/core/src'),
        '@worker-render/hono': path.resolve(__dirname, '../../packages/hono/src'),
        'idiomorph': path.resolve(__dirname, '../../node_modules/idiomorph/dist/idiomorph.esm.js')
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }
  };

  // Mode-specific configurations
  switch (mode) {
    case 'client':
      return {
        ...baseConfig,
        build: {
          outDir: 'dist/client',
          emptyOutDir: true,
          target: 'es2020',
          rollupOptions: {
            input: './src/client.ts',
            output: {
              entryFileNames: 'client.entry.js',
              chunkFileNames: 'chunks/[name]-[hash].js',
              assetFileNames: 'assets/[name]-[hash][extname]'
            }
          }
        },
        css: {
          postcss: './postcss.config.js'
        }
      };

    case 'sw':
      return {
        ...baseConfig,
        build: {
          outDir: 'dist/sw',
          emptyOutDir: true,
          target: 'es2020',
          lib: {
            entry: './src/sw.ts',
            formats: ['es'],
            fileName: () => 'sw.js'
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true // Single file for Service Worker
            }
          }
        }
      };

    case 'worker':
      return {
        ...baseConfig,
        ssr: {
          target: 'webworker',
          noExternal: true // Bundle all dependencies for Cloudflare
        },
        build: {
          outDir: 'dist/worker',
          emptyOutDir: true,
          target: 'es2020',
          ssr: true,
          rollupOptions: {
            input: './worker.ts',
            output: {
              entryFileNames: 'worker.js',
              format: 'es',
              inlineDynamicImports: true
            }
          }
        }
      };

    default:
      // Development mode (vite dev)
      return {
        ...baseConfig,
        server: {
          port: 3000,
          hmr: true
        },
        css: {
          postcss: './postcss.config.js'
        }
      };
  }
});