/**
 * Version management for cache invalidation
 *
 * IMPORTANT: Bump APP_VERSION when you deploy changes to:
 * - Route templates
 * - Data schemas
 * - Service Worker logic
 *
 * This ensures old cached data is invalidated.
 */

/**
 * Default application version fallback
 * Applications should override this via __APP_VERSION__ build variable
 * Format: YYYY-MM-DD-N (e.g., "2025-10-21-1")
 */
export const APP_VERSION = '1.0.0';

/**
 * Get version from build-time environment variable (recommended)
 * Falls back to APP_VERSION constant if not set
 *
 * To set version in your app:
 * 1. Define APP_VERSION in your vite.config.ts
 * 2. Use vite's define plugin to inject __APP_VERSION__
 */
export function getAppVersion(): string {
  // @ts-ignore - Vite will inject this at build time
  if (typeof __APP_VERSION__ !== 'undefined') {
    // @ts-ignore
    return __APP_VERSION__;
  }
  return APP_VERSION;
}

/**
 * Check if cached data is compatible with current version
 */
export function isVersionCompatible(cachedVersion: string): boolean {
  return cachedVersion === getAppVersion();
}

/**
 * Version header for HTTP requests/responses
 */
export const VERSION_HEADER = 'X-App-Version';
