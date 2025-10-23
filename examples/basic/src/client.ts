/**
 * Client entry - registers service worker and initializes client-side features
 */
import { Idiomorph } from 'idiomorph';
import { setupPrefetching, matchRoute } from '@worker-render/core';
import { routes } from './app.routes';

async function main() {
  // Register service worker for instant navigation
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        type: 'module',
        updateViaCache: 'none' // Don't cache the SW script itself
      });

      // Check for SW updates every 5 seconds in development
      // @ts-ignore - Vite injects import.meta.env
      if (import.meta.env.DEV) {
        setInterval(() => {
          registration.update().catch(() => {
            // Silently fail - this is just a dev convenience
          });
        }, 5000);
      }

      // When a new SW is installed, reload the page to use it
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              // @ts-ignore
              if (import.meta.env.DEV) {
                console.info('[WorkerRender] New SW activated, reloading...');
                window.location.reload();
              }
            }
          });
        }
      });

      console.info('[WorkerRender] Service Worker registered');
    } catch (err) {
      console.warn('[WorkerRender] SW registration failed:', err);
    }
  }


  // Initialize mobile menu (event delegation, runs once)
  initMobileMenu();

  // Listen for fresh data from Service Worker
  initServiceWorkerMessages();

  // Initialize client-side navigation with DOM morphing
  initClientNavigation();

  // Setup automatic prefetching on link hover
  setupPrefetching();

  console.info('[WorkerRender] Client initialized');
}

/**
 * Initialize mobile menu with event delegation
 * Uses event delegation so it survives DOM morphing
 */
function initMobileMenu() {
  document.addEventListener('click', (e) => {
    // Handle hamburger button click
    const btn = (e.target as Element).closest('#mobile-menu-btn');
    if (btn) {
      const menu = document.getElementById('mobile-menu');
      if (menu) {
        menu.classList.toggle('hidden');
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded ? 'true' : 'false');
      }
      return;
    }
  });
}

/**
 * Listen for messages from Service Worker about fresh data
 */
function initServiceWorkerMessages() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data.type === 'FRESH_DATA_AVAILABLE') {
      console.info('[WorkerRender] Fresh data available:', event.data.url);

      // Re-fetch the current page to get updated HTML with fresh data
      // Use cache: 'reload' to bypass the SW cache and get fresh content
      try {
        const response = await fetch(window.location.href, {
          cache: 'reload'
        });
        const html = await response.text();

        // Parse the new HTML
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        // Morph the body - Idiomorph preserves input/textarea values automatically by ID
        Idiomorph.morph(document.body, newDoc.body, {
          morphStyle: 'innerHTML'
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

        console.info('[WorkerRender] Page updated with fresh data');
      } catch (err) {
        console.error('[WorkerRender] Failed to update page with fresh data:', err);
      }
    }
  });
}

/**
 * Initialize client-side navigation to preserve state during page transitions
 */
function initClientNavigation() {
  // Intercept all link clicks
  document.addEventListener('click', async (e) => {
    const link = (e.target as Element).closest('a');

    // Only intercept same-origin links
    if (!link || !link.href || link.target || link.download) return;

    const url = new URL(link.href);

    // Only intercept same-origin navigation
    if (url.origin !== location.origin) return;

    // Ignore links with data-no-morph attribute
    if (link.hasAttribute('data-no-morph')) return;

    e.preventDefault();

    // Navigate using client-side routing
    await navigateToUrl(url.href);
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', async () => {
    await navigateToUrl(location.href, { skipHistory: true });
  });
}

/**
 * Navigate to a URL using fetch + DOM morphing
 */
async function navigateToUrl(url: string, options: { skipHistory?: boolean } = {}) {
  try {
    // Show loading indicator (optional - could add a progress bar)
    console.info('[WorkerRender] Navigating to:', url);

    // Fetch the new page HTML
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      console.error('[WorkerRender] Navigation failed:', response.status);
      // Fall back to full navigation on error
      location.href = url;
      return;
    }

    const html = await response.text();

    // Parse the HTML
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(html, 'text/html');

    // Update the page title
    if (newDoc.title) {
      document.title = newDoc.title;
    }

    // Morph the <head> to update meta tags, styles, etc.
    Idiomorph.morph(document.head, newDoc.head, {
      // Preserve existing script tags to avoid re-execution
      callbacks: {
        beforeNodeRemoved: (oldNode: Node) => {
          // Don't remove scripts that are already loaded
          if (oldNode.nodeName === 'SCRIPT') {
            return false; // Keep existing scripts
          }
          return true;
        }
      }
    });

    // Morph the <body> - Idiomorph preserves input/textarea values automatically by ID
    Idiomorph.morph(document.body, newDoc.body, {
      morphStyle: 'innerHTML'
    });

    // Re-execute inline scripts after morphing
    // Inline scripts don't automatically re-run when morphed, so we need to manually execute them
    document.querySelectorAll('script:not([src])').forEach((oldScript) => {
      if (oldScript.textContent) {
        const newScript = document.createElement('script');
        newScript.textContent = oldScript.textContent;
        // Copy attributes
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      }
    });

    // Update browser history
    if (!options.skipHistory) {
      window.history.pushState({}, '', url);
    }

    // Scroll to top (or could preserve scroll position)
    window.scrollTo(0, 0);

    console.info('[WorkerRender] Navigation complete');
  } catch (err) {
    console.error('[WorkerRender] Navigation error:', err);
    // Fall back to full navigation
    location.href = url;
  }
}

void main();
