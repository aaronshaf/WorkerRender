/**
 * Service Worker helpers
 * Simplifies Service Worker setup for WorkerRender apps
 */

/// <reference lib="webworker" />

import type { Route } from './routes.js';
import { matchRoute } from './routes.js';
import { renderWithCache } from './sw-strategy.js';
import { getAppVersion } from './version.js';
import { clearOldCache } from './cache.js';
import { escapeHtml, safeJsonStringify } from './utils/html.js';

export interface ServiceWorkerOptions {
  /**
   * Application routes
   */
  routes: Route[];

  /**
   * HTML layout function
   */
  layout: (opts: { title: string; body: string; data: unknown }) => string;

  /**
   * Cache TTL in milliseconds (default: 7 days)
   */
  cacheTTL?: number;

  /**
   * Enable console logging
   */
  verbose?: boolean;
}

// Re-export HTML utilities for backward compatibility
export { escapeHtml, safeJsonStringify };

/**
 * Create a Service Worker with offline-first support
 *
 * This sets up all the necessary Service Worker event listeners
 * and handles navigation with stale-while-revalidate caching.
 *
 * @example
 * ```ts
 * import { createServiceWorker } from '@worker-render/core';
 * import { routes } from './app.routes';
 *
 * createServiceWorker({
 *   routes,
 *   layout: ({ title, body, data }) => `
 *     <!DOCTYPE html>
 *     <html>
 *       <head>
 *         <title>${title}</title>
 *         <script>window.__DATA=${JSON.stringify(data)}</script>
 *       </head>
 *       <body>${body}</body>
 *     </html>
 *   `
 * });
 * ```
 */
export function createServiceWorker(options: ServiceWorkerOptions): void {
  const { routes, layout, cacheTTL = 7 * 24 * 60 * 60 * 1000, verbose = false } = options;

  // @ts-ignore - Service Worker global scope
  const self = globalThis as unknown as ServiceWorkerGlobalScope;

  const APP_VERSION = getAppVersion();

  const log = (...args: unknown[]) => {
    if (verbose) {
      console.log('[SW]', ...args);
    }
  };

  // Install event - activate immediately
  self.addEventListener('install', (event) => {
    log('Installing version:', APP_VERSION);
    event.waitUntil(self.skipWaiting());
  });

  // Activate event - claim clients and clean old cache
  self.addEventListener('activate', (event) => {
    log('Activating version:', APP_VERSION);

    event.waitUntil(
      (async () => {
        // Claim all clients immediately
        await self.clients.claim();

        // Clear old cache entries
        await clearOldCache(cacheTTL);

        log('Activated and cleaned old cache');
      })()
    );
  });

  // Fetch event - offline-first strategy
  self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Only intercept navigation requests (HTML pages)
    if (req.mode === 'navigate') {
      event.respondWith(handleNavigate(req, event));
      return;
    }

    // Cache static assets with stale-while-revalidate
    if (
      req.destination === 'style' ||
      req.destination === 'script' ||
      req.destination === 'image' ||
      req.destination === 'font'
    ) {
      event.respondWith(handleAsset(req));
      return;
    }

    // Let browser handle all other requests (API calls, etc.)
  });

  /**
   * Handle static asset requests with stale-while-revalidate
   */
  async function handleAsset(req: Request): Promise<Response> {
    const cache = await self.caches.open(`assets-${APP_VERSION}`);

    // Try to get from cache
    const cached = await cache.match(req);

    // Start network fetch in background
    const networkPromise = fetch(req)
      .then(async (response) => {
        if (response && response.ok) {
          // Cache the fresh response
          await cache.put(req, response.clone());
        }
        return response;
      })
      .catch(() => null);

    // Return cached version immediately, or wait for network
    return cached || (await networkPromise) || Response.error();
  }

  /**
   * Handle navigation requests with offline-first strategy
   */
  async function handleNavigate(req: Request, event: FetchEvent): Promise<Response> {
    const url = new URL(req.url);

    // Try to match a route
    const matched = matchRoute(url, routes);

    if (!matched) {
      // No route matched - fetch from network
      return fetch(req);
    }

    const { route, params } = matched;

    try {
      // Use offline-first rendering with stale-while-revalidate
      // This will serve cached data if available, or fetch if online
      return await renderWithCache(
        route,
        { url, headers: req.headers, params },
        (data) => {
          // Render page body
          const bodyJSX = route.Page({ data, url, params });
          const body = typeof bodyJSX === 'string' ? bodyJSX : String(bodyJSX);
          const title = route.title ? route.title(data) : 'App';

          // Wrap in layout
          return layout({ title, body, data });
        }
      );
    } catch (err) {
      log('Navigation error:', err);
      // Let the browser handle the error
      throw err;
    }
  }
}
