/**
 * Simple prefetching utilities for faster navigation
 * Keeps things simple - just warm the cache on hover
 */

// Track what we've already prefetched to avoid duplicates
const prefetched = new Set<string>();

/**
 * Prefetch a URL to warm the Service Worker cache
 * @param url - The URL to prefetch
 * @param priority - Request priority ('high' for immediate, 'low' for background)
 */
export function prefetchUrl(url: string, priority: 'high' | 'low' = 'low') {
  // Skip if already prefetched
  if (prefetched.has(url)) return;

  // Mark as prefetched
  prefetched.add(url);

  // Simple fetch to warm the cache
  // The Service Worker will intercept and cache this
  fetch(url, {
    // @ts-ignore - priority is not in TypeScript yet but works in modern browsers
    priority
  }).catch(() => {
    // Silently ignore prefetch errors
    // It's just an optimization, not critical
    prefetched.delete(url); // Allow retry
  });

  // Clean up after 30 seconds to allow re-prefetch if needed
  setTimeout(() => prefetched.delete(url), 30000);
}

/**
 * Setup automatic prefetching on link hover
 * Call this once on the client
 */
export function setupPrefetching() {
  if (typeof document === 'undefined') return;

  // Prefetch on hover (desktop)
  document.addEventListener('mouseover', handleHover, { passive: true });

  // Prefetch on touchstart (mobile) - but more conservatively
  document.addEventListener('touchstart', handleTouch, { passive: true });
}

function handleHover(e: MouseEvent) {
  const link = (e.target as Element)?.closest('a');
  if (link && shouldPrefetch(link)) {
    prefetchUrl(link.href, 'low');
  }
}

function handleTouch(e: TouchEvent) {
  const link = (e.target as Element)?.closest('a');
  if (link && shouldPrefetch(link)) {
    // Higher priority for touch since user is likely to tap
    prefetchUrl(link.href, 'high');
  }
}

function shouldPrefetch(link: HTMLAnchorElement): boolean {
  // Only prefetch same-origin links
  if (link.origin !== location.origin) return false;

  // Skip if has download attribute
  if (link.hasAttribute('download')) return false;

  // Skip if has target attribute (opens in new tab)
  if (link.target && link.target !== '_self') return false;

  // Skip if has data-no-prefetch attribute
  if (link.dataset.noPrefetch !== undefined) return false;

  // Skip hash links on same page
  if (link.pathname === location.pathname && link.hash) return false;

  return true;
}

/**
 * Manually prefetch routes by path pattern
 * Useful for prefetching likely next pages
 */
export function prefetchRoutes(patterns: string[]) {
  patterns.forEach(pattern => {
    prefetchUrl(pattern, 'low');
  });
}

/**
 * Clear prefetch cache
 * Useful when navigating away or on route change
 */
export function clearPrefetchCache() {
  prefetched.clear();
}