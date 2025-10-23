/**
 * @worker-render/core/build
 * Build-time utilities and configurations
 * This module should only be imported during build time, not at runtime
 */

// Build configuration type (minimal subset of Vite's InlineConfig)
export interface BuildConfig {
  build?: {
    outDir?: string;
    rollupOptions?: {
      input?: string | string[] | Record<string, string>;
      output?: {
        entryFileNames?: string;
        format?: 'es' | 'cjs' | 'umd' | 'iife';
      };
    };
    target?: string;
    minify?: boolean;
  };
  base?: string;
  ssr?: boolean;
}

/**
 * Creates the three Vite build configurations for WorkerRender
 * - Client bundle for browser navigation
 * - Service Worker bundle for offline rendering
 * - Server/Worker bundle for SSR
 */
export function createBuildConfigs(options?: {
  clientOutDir?: string;
  swOutDir?: string;
  workerOutDir?: string;
  base?: string;
}): BuildConfig[] {
  const {
    clientOutDir = 'dist/client',
    swOutDir = 'dist/sw',
    workerOutDir = 'dist/worker',
    base = '/'
  } = options || {};

  return [
    // Client bundle configuration
    {
      build: {
        outDir: clientOutDir,
        rollupOptions: {
          input: 'virtual:worker-render/client',
          output: {
            entryFileNames: 'client.entry.js',
            format: 'es'
          }
        },
        target: 'es2020',
        minify: true
      },
      base
    },

    // Service Worker bundle configuration
    {
      build: {
        outDir: swOutDir,
        rollupOptions: {
          input: 'virtual:worker-render/sw',
          output: {
            entryFileNames: 'sw.js',
            format: 'es'
          }
        },
        target: 'es2020',
        minify: true
      },
      base
    },

    // Server/Worker bundle configuration
    {
      build: {
        outDir: workerOutDir,
        rollupOptions: {
          input: './worker.ts',
          output: {
            format: 'es'
          }
        },
        target: 'es2022',
        minify: true
      },
      ssr: true,
      base
    }
  ];
}

/**
 * Helper to determine if code is running in build context
 */
export function isBuildTime(): boolean {
  // Check for global process object (Node.js environment)
  return typeof globalThis !== 'undefined' &&
         'process' in globalThis &&
         (globalThis as any).process?.env?.NODE_ENV !== 'production';
}

/**
 * Build-time route analyzer for optimization hints
 */
export function analyzeRoutes(routes: Array<{ path: string; loader?: unknown }>): {
  staticRoutes: string[];
  dynamicRoutes: string[];
  wildcardRoutes: string[];
} {
  const staticRoutes: string[] = [];
  const dynamicRoutes: string[] = [];
  const wildcardRoutes: string[] = [];

  for (const route of routes) {
    if (route.path.includes('*')) {
      wildcardRoutes.push(route.path);
    } else if (route.path.includes(':')) {
      dynamicRoutes.push(route.path);
    } else {
      staticRoutes.push(route.path);
    }
  }

  return { staticRoutes, dynamicRoutes, wildcardRoutes };
}