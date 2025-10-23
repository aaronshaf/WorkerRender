/**
 * Service Worker caching strategies for offline-first architecture
 *
 * Cache Strategy Flow Diagram:
 * ===============================
 * Navigate to URL → Check cache → Cache found?
 *   ├─ ✅ Yes (cache hit):
 *   │  ├─ Serve stale content immediately (instant UX)
 *   │  └─ Revalidate in background:
 *   │     ├─ Fetch fresh data from server
 *   │     ├─ Generate ETag from response
 *   │     ├─ Compare ETags (changed?)
 *   │     │  ├─ Yes: Update cache + notify client
 *   │     │  └─ No: Skip update (avoid rerenders)
 *   │     └─ Handle errors gracefully (keep serving stale)
 *   │
 *   └─ ❌ No (cache miss):
 *      ├─ 🌐 Online: Fetch → Cache → Serve
 *      └─ 📴 Offline: Serve fallback page
 *
 * Key Features:
 * - Request deduplication (prevents duplicate revalidations)
 * - ETag-based change detection (avoids unnecessary updates)
 * - Version-based cache invalidation (automatic on deploy)
 * - Timeout protection (30s default for loaders)
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import type { Route } from './routes.js';
import { getAppVersion, VERSION_HEADER, isVersionCompatible } from './version.js';
import { getCachedRouteData, cacheRouteData } from './cache.js';
import { runMiddleware } from './middleware.js';

// Request deduplication to prevent multiple simultaneous revalidations
const pendingRevalidations = new Map<string, Promise<void>>();

// Loader timeout configuration (30 seconds default)
const LOADER_TIMEOUT_MS = 30000;

/**
 * Create a promise that rejects after a timeout
 */
function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

/**
 * Run a loader with timeout protection
 */
async function runLoaderWithTimeout<T>(
  loader: () => Promise<T>,
  timeoutMs: number = LOADER_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    loader(),
    timeoutPromise(timeoutMs)
  ]);
}

export interface RenderContext {
  url: URL;
  headers: Headers;
  params: Record<string, string>;
}

/**
 * Offline-first rendering strategy with stale-while-revalidate
 *
 * Flow:
 * 1. Check IndexedDB for cached data
 * 2. If found and version matches:
 *    - Render immediately from cache (fast!)
 *    - Revalidate in background if online
 * 3. If not found or version mismatch:
 *    - Fetch from server (run loader in SW)
 *    - Cache the response data to IndexedDB
 * 4. If offline and no cache:
 *    - Throw error (caught by service-worker to serve app shell)
 */
export async function renderWithCache(
  route: Route,
  ctx: RenderContext,
  renderFn: (data: unknown) => string
): Promise<Response> {
  const cacheKey = ctx.url.pathname + ctx.url.search;
  const version = getAppVersion();

  try {
    // Try to get cached data
    const cached = await getCachedRouteData(cacheKey);

    if (cached && isVersionCompatible(cached.version)) {
      // We have valid cached data - render immediately (stale)
      console.log('[SW] Serving from cache:', cacheKey);
      const html = renderFn(cached.data);

      // Revalidate in background (while serving stale)
      revalidateInBackground(route, ctx, cacheKey, version, cached.etag);

      const headers: HeadersInit = {
        'content-type': 'text/html; charset=utf-8',
        'x-cache': 'HIT',
        'x-cache-version': cached.version
      };

      if (cached.etag) {
        headers['etag'] = cached.etag;
      }

      return new Response(html, {
        status: 200,
        headers
      });
    }

    // No cache or version mismatch - fetch from server
    console.log('[SW] Fetching from server:', cacheKey);
    return await fetchAndCache(route, ctx, cacheKey, version, renderFn);

  } catch (error) {
    console.error('[SW] Render error:', error);
    // Let the browser handle the error
    throw error;
  }
}

/**
 * Fetch from server and cache the data
 */
async function fetchAndCache(
  route: Route,
  ctx: RenderContext,
  cacheKey: string,
  version: string,
  renderFn: (data: unknown) => string
): Promise<Response> {
  try {
    // Load data from server with timeout protection, running through middleware
    const data = await runLoaderWithTimeout(async () => {
      if (route.middleware && route.middleware.length > 0) {
        return runMiddleware(ctx, route.middleware, route.loader);
      }
      return route.loader(ctx);
    });

    // Generate ETag from data
    const dataStr = JSON.stringify(data);
    const etag = await generateETag(dataStr);

    // Cache the data for offline use
    await cacheRouteData(cacheKey, data, version, etag);

    // Render HTML
    const html = renderFn(data);

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-cache': 'MISS',
        [VERSION_HEADER]: version,
        'etag': etag
      }
    });
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    throw error;
  }
}

/**
 * Revalidate cache in background (don't block response)
 * Uses ETag comparison to avoid unnecessary cache writes
 * Implements request deduplication to prevent rate limiting
 * Notifies client when fresh data is available for live updates
 */
function revalidateInBackground(
  route: Route,
  ctx: RenderContext,
  cacheKey: string,
  version: string,
  cachedEtag?: string
): void {
  // Check if revalidation is already in progress
  if (pendingRevalidations.has(cacheKey)) {
    console.log('[SW] Revalidation already in progress, skipping:', cacheKey);
    return;
  }

  // Don't await - this runs in background
  const promise = (async () => {
    try {
      // Double-check we're still online before fetching
      if (!navigator.onLine) {
        console.log('[SW] Skipping revalidation - offline:', cacheKey);
        return;
      }

      console.log('[SW] Revalidating in background:', cacheKey);

      // Fetch fresh data from loader with timeout protection, running through middleware
      const freshData = await runLoaderWithTimeout(async () => {
        if (route.middleware && route.middleware.length > 0) {
          return runMiddleware(ctx, route.middleware, route.loader);
        }
        return route.loader(ctx);
      });

      // Generate ETag from fresh data
      const freshDataStr = JSON.stringify(freshData);
      const freshEtag = await generateETag(freshDataStr);

      // Only update cache if ETag changed (data actually changed)
      if (freshEtag !== cachedEtag) {
        // Data changed - update cache
        await cacheRouteData(cacheKey, freshData, version, freshEtag);
        console.log('[SW] Cache updated with fresh data:', cacheKey);

        // Notify all clients that fresh data is available
        await notifyClientsOfUpdate(cacheKey, freshData);
      } else {
        console.log('[SW] Cache data unchanged (ETag match), skipping write:', cacheKey);
      }
    } catch (error) {
      console.error('[SW] Revalidation failed:', error);
      // Silently fail - we already served cached version
    }
  })();

  // Track pending revalidation and clean up when done
  pendingRevalidations.set(cacheKey, promise);
  promise.finally(() => {
    pendingRevalidations.delete(cacheKey);
  });
}

/**
 * Notify all clients that fresh data is available for a route
 */
async function notifyClientsOfUpdate(url: string, data: unknown): Promise<void> {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });

    for (const client of clients) {
      // Only notify clients currently viewing this URL
      const clientUrl = new URL(client.url);
      const targetUrl = new URL(url, clientUrl.origin);

      if (clientUrl.pathname === targetUrl.pathname) {
        client.postMessage({
          type: 'FRESH_DATA_AVAILABLE',
          url: url,
          data: data
        });
        console.log('[SW] Notified client of fresh data:', url);
      }
    }
  } catch (error) {
    console.error('[SW] Failed to notify clients:', error);
  }
}

/**
 * Generate ETag from data string using SubtleCrypto
 * Falls back to simple hash if crypto not available
 */
async function generateETag(data: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `"${hashHex.substring(0, 16)}"`;
    }
  } catch (err) {
    // Crypto not available or failed
  }

  // Fallback: simple hash based on string length and checksum
  let hash = 0;
  for (let i = 0; i < Math.min(data.length, 1000); i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}-${data.length}"`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

