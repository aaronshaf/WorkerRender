/**
 * Client-side navigation and Service Worker integration
 * Auto-generated client entry functionality
 */

import { NavigationController } from './navigation-controller.js';

// SetupOptions type is not exported, we'll define what we need

declare global {
  interface Window {
    __DATA?: unknown;
    Idiomorph?: {
      morph: (oldNode: Element, newNode: Element, options?: any) => void;
    };
  }
}

export interface ClientOptions {
  /**
   * Enable automatic prefetching on link hover/touch
   * @default true
   */
  prefetch?: boolean;

  /**
   * Enable DOM morphing for navigation
   * @default true
   */
  morphing?: boolean;

  /**
   * Console logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Custom Service Worker path
   * @default '/sw.js'
   */
  swPath?: string;

  /**
   * Skip Service Worker registration
   * @default false
   */
  skipSW?: boolean;
}

/**
 * Initialize WorkerRender client features
 * This is the main entry point for client-side functionality
 */
export async function initClient(options: ClientOptions = {}): Promise<void> {
  const {
    prefetch = true,
    morphing = true,
    verbose = false,
    swPath = '/sw.js',
    skipSW = false
  } = options;

  const log = (...args: unknown[]) => {
    if (verbose) {
      console.log('[WorkerRender]', ...args);
    }
  };

  // Register Service Worker for offline-first navigation
  if (!skipSW && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register(swPath, { type: 'module' });
      log('Service Worker registered');
    } catch (err) {
      console.warn('[WorkerRender] SW registration failed:', err);
    }
  }

  // Set up prefetching
  if (prefetch) {
    const { setupPrefetching } = await import('./prefetch.js');
    setupPrefetching();
    log('Prefetching enabled');
  }

  // Set up DOM morphing navigation
  if (morphing) {
    await setupMorphing({ verbose });
    log('DOM morphing enabled');
  }

  // Listen for Service Worker messages
  if (!skipSW) {
    setupServiceWorkerMessages({ verbose });
  }

  log('Client initialized');
}

/**
 * Set up DOM morphing for client-side navigation
 */
async function setupMorphing(options: { verbose?: boolean }): Promise<void> {
  const { verbose = false } = options;

  const log = (...args: unknown[]) => {
    if (verbose) {
      console.log('[WorkerRender]', ...args);
    }
  };

  // Create navigation controller with deduplication
  const navController = new NavigationController({
    verbose,
    onNavigationStart: (url) => log('Navigation started:', url),
    onNavigationEnd: (url, result) => log('Navigation ended:', url, result.ok ? 'success' : 'failed')
  });

  // Dynamically import idiomorph when needed
  const loadIdiomorph = async () => {
    if (!window.Idiomorph) {
      try {
        // @ts-ignore - Dynamic import, may not be available
        const { Idiomorph } = await import('idiomorph');
        window.Idiomorph = Idiomorph;
      } catch (err) {
        console.warn('[WorkerRender] Idiomorph not available, falling back to full reload');
        return null;
      }
    }
    return window.Idiomorph;
  };

  // Navigate to URL with morphing and deduplication
  const navigateToUrl = async (url: string, options: { skipHistory?: boolean; replace?: boolean } = {}) => {
    try {
      log('Navigating to:', url);

      // Use NavigationController for deduplication
      const result = await navController.navigate(url, {
        skipHistory: options.skipHistory,
        replace: options.replace
      });

      if (!result.ok || !result.html) {
        console.error('[WorkerRender] Navigation failed:', result.error);
        location.href = url;
        return;
      }

      const html = result.html;
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, 'text/html');

      // Update title
      if (newDoc.title) {
        document.title = newDoc.title;
      }

      // Save form state
      const inputValues = new Map<string, string>();
      document.querySelectorAll('input, textarea, select').forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (input.id) {
          inputValues.set(input.id, input.value);
        }
      });

      // Load idiomorph and morph
      const Idiomorph = await loadIdiomorph();
      if (!Idiomorph) {
        // Fallback to full page reload if morphing not available
        location.href = url;
        return;
      }

      // Morph head (update meta tags, styles)
      Idiomorph.morph(document.head, newDoc.head, {
        callbacks: {
          beforeNodeRemoved: (oldNode: Node) => {
            // Keep existing scripts to avoid re-execution
            if (oldNode.nodeName === 'SCRIPT') {
              return false;
            }
            return true;
          }
        }
      });

      // Morph body
      Idiomorph.morph(document.body, newDoc.body, {
        morphStyle: 'innerHTML'
      });

      // Restore form state
      inputValues.forEach((value, id) => {
        const input = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (input) {
          input.value = value;
        }
      });

      // Re-execute inline scripts
      document.querySelectorAll('script:not([src])').forEach((oldScript) => {
        if (oldScript.textContent) {
          const newScript = document.createElement('script');
          newScript.textContent = oldScript.textContent;
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        }
      });

      // Update history
      if (!options.skipHistory) {
        window.history.pushState({}, '', url);
      }

      // Scroll to top
      window.scrollTo(0, 0);

      log('Navigation complete');
    } catch (err) {
      console.error('[WorkerRender] Navigation error:', err);
      location.href = url;
    }
  };

  // Intercept link clicks
  document.addEventListener('click', async (e) => {
    const link = (e.target as Element).closest('a');

    if (!link || !link.href || link.target || link.download) return;

    const url = new URL(link.href);

    if (url.origin !== location.origin) return;

    if (link.hasAttribute('data-no-morph')) return;

    e.preventDefault();
    await navigateToUrl(url.href);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', async () => {
    await navigateToUrl(location.href, { skipHistory: true });
  });

  // Set up link prefetching on hover/focus
  let prefetchTimer: ReturnType<typeof setTimeout> | null = null;

  const handlePrefetch = (e: Event) => {
    const link = (e.target as Element).closest('a');
    if (!link || !link.href || link.target || link.download) return;

    const url = new URL(link.href);
    if (url.origin !== location.origin) return;
    if (link.hasAttribute('data-no-prefetch')) return;

    // Clear any existing timer
    if (prefetchTimer) {
      clearTimeout(prefetchTimer);
    }

    // Prefetch after 100ms delay
    prefetchTimer = setTimeout(() => {
      navController.prefetch(url.href);
      log('Prefetching:', url.href);
    }, 100);
  };

  const cancelPrefetch = () => {
    if (prefetchTimer) {
      clearTimeout(prefetchTimer);
      prefetchTimer = null;
    }
  };

  // Prefetch on hover and focus
  document.addEventListener('mouseover', handlePrefetch);
  document.addEventListener('focusin', handlePrefetch);
  document.addEventListener('mouseout', cancelPrefetch);
  document.addEventListener('focusout', cancelPrefetch);
}

/**
 * Listen for Service Worker messages
 */
function setupServiceWorkerMessages(options: { verbose?: boolean }): void {
  const { verbose = false } = options;

  const log = (...args: unknown[]) => {
    if (verbose) {
      console.log('[WorkerRender]', ...args);
    }
  };

  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data.type === 'FRESH_DATA_AVAILABLE') {
      log('Fresh data available:', event.data.url);

      // Only update if it's the current page
      if (event.data.url !== window.location.pathname) return;

      try {
        // Re-fetch current page
        const response = await fetch(window.location.href);
        const html = await response.text();

        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        // Save form state
        const inputValues = new Map<string, string>();
        document.querySelectorAll('input, textarea, select').forEach((el) => {
          const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (input.id) {
            inputValues.set(input.id, input.value);
          }
        });

        // Morph if available
        if (window.Idiomorph) {
          window.Idiomorph.morph(document.body, newDoc.body, {
            morphStyle: 'innerHTML'
          });

          // Restore form state
          inputValues.forEach((value, id) => {
            const input = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
            if (input) {
              input.value = value;
            }
          });

          // Re-execute inline scripts
          document.querySelectorAll('script:not([src])').forEach((oldScript) => {
            if (oldScript.textContent) {
              const newScript = document.createElement('script');
              newScript.textContent = oldScript.textContent;
              Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
              });
              oldScript.parentNode?.replaceChild(newScript, oldScript);
            }
          });
        }

        log('Page updated with fresh data');
      } catch (err) {
        console.error('[WorkerRender] Failed to update with fresh data:', err);
      }
    }
  });
}