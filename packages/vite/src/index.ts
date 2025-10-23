/**
 * Vite plugin for WorkerRender
 * Handles the 3-bundle build: client, service worker, and Cloudflare Worker
 */

import type { Plugin, UserConfig } from 'vite';
import { resolve } from 'node:path';

export interface WorkerRenderOptions {
  /**
   * Entry point for your routes file
   * @default './src/app.routes.tsx'
   */
  routes?: string;

  /**
   * Layout file path
   * @default './src/layout.ts'
   */
  layout?: string;

  /**
   * Directory containing island components
   * @default './src/islands'
   */
  islands?: string;

  /**
   * Client entry point
   * @default generated client entry
   */
  clientEntry?: string;

  /**
   * Service Worker entry point
   * @default generated SW entry
   */
  swEntry?: string;

  /**
   * Cloudflare Worker entry point
   * @default './worker.ts'
   */
  workerEntry?: string;

  /**
   * Output directory
   * @default './dist'
   */
  outDir?: string;

  /**
   * Client options to pass to initClient()
   */
  clientOptions?: {
    prefetch?: boolean;
    morphing?: boolean;
    verbose?: boolean;
    swPath?: string;
  };
}

export default function workerRender(options: WorkerRenderOptions = {}): Plugin[] {
  const {
    routes = './src/app.routes.tsx',
    layout = './src/layout.ts',
    islands = './src/islands',
    clientEntry,
    swEntry,
    workerEntry = './worker.ts',
    outDir = './dist',
    clientOptions = {}
  } = options;

  // We'll generate builds based on environment or command
  const isDev = process.env.NODE_ENV !== 'production';

  return [
    {
      name: 'worker-render:config',
      config(config, { command }): UserConfig {
        const isServe = command === 'serve';

        if (isServe) {
          // Dev mode - single build with HMR
          return {
            build: {
              outDir: resolve(outDir, 'dev'),
              target: 'es2020'
            },
            define: {
              'process.env.NODE_ENV': JSON.stringify('development')
            }
          };
        }

        // Production builds will be handled by separate vite build calls
        return {};
      }
    },

    {
      name: 'worker-render:virtual-modules',
      resolveId(id) {
        if (id === 'virtual:worker-render/client') {
          return '\0virtual:worker-render/client';
        }
        if (id === 'virtual:worker-render/sw') {
          return '\0virtual:worker-render/sw';
        }
        return null;
      },

      load(id) {
        // Virtual client entry - fully automatic!
        if (id === '\0virtual:worker-render/client') {
          const clientOptsStr = JSON.stringify(clientOptions);

          return `
// Auto-generated WorkerRender client entry
import { initClient } from '@worker-render/core';

// Initialize the WorkerRender client with your configuration
await initClient(${clientOptsStr});

// Client is now ready!
// - Service Worker registered for offline-first navigation
// - DOM morphing enabled for instant page transitions
// - Prefetching enabled for faster navigation
// - Fresh data updates from Service Worker background revalidation
          `.trim();
        }

        // Virtual service worker entry - fully automatic!
        if (id === '\0virtual:worker-render/sw') {
          return `
/// <reference lib="webworker" />
// Auto-generated WorkerRender Service Worker

import { createServiceWorker } from '@worker-render/core';
import { routes } from '${routes}';
import { layout } from '${layout}';

// Initialize the Service Worker with your routes and layout
createServiceWorker({
  routes,
  layout,
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  verbose: ${isDev ? 'true' : 'false'}
});

// Service Worker is now ready!
// - Offline-first with stale-while-revalidate caching
// - Instant navigation without network requests
// - Background revalidation keeps data fresh
// - Automatic cache invalidation on version changes
          `.trim();
        }

        return null;
      }
    }
  ];
}

/**
 * Helper to create build configs for the 3 bundles
 */
export function createBuildConfigs(options: WorkerRenderOptions = {}): UserConfig[] {
  const {
    clientEntry = 'virtual:worker-render/client',
    swEntry = 'virtual:worker-render/sw',
    workerEntry = './worker.ts',
    outDir = './dist'
  } = options;

  return [
    // Client bundle
    {
      build: {
        outDir: resolve(outDir, 'client'),
        target: 'es2020',
        rollupOptions: {
          input: { client: clientEntry },
          output: {
            entryFileNames: 'client.entry.js',
            chunkFileNames: 'chunks/[name]-[hash].js'
          }
        }
      }
    },

    // Service Worker bundle
    {
      build: {
        outDir: resolve(outDir, 'sw'),
        target: 'es2020',
        rollupOptions: {
          input: { sw: swEntry },
          output: {
            entryFileNames: 'sw.js',
            format: 'es'
          }
        }
      }
    },

    // Cloudflare Worker bundle
    {
      ssr: {
        target: 'webworker',
        noExternal: true
      },
      build: {
        outDir: resolve(outDir, 'worker'),
        target: 'es2020',
        ssr: true,
        rollupOptions: {
          input: workerEntry,
          output: {
            entryFileNames: 'worker.js',
            format: 'es'
          }
        }
      }
    }
  ];
}
