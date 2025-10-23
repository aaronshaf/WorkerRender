/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from './jsx-runtime';

/**
 * Island Architecture for WorkerRender
 *
 * Islands are interactive components that can be updated independently
 * of the full page. This enables partial hydration and updates.
 */

export interface IslandProps {
  /** Unique name for this island */
  name: string;
  /** Props to pass to the island component */
  props?: Record<string, any>;
  /** The component to render */
  children: any;
  /** Whether this island should be interactive on the client */
  client?: boolean;
  /** Loading strategy: 'eager' | 'lazy' | 'idle' | 'visible' */
  loading?: 'eager' | 'lazy' | 'idle' | 'visible';
}

/**
 * Island component wrapper
 * Marks a section of the page as an independently updatable island
 */
export function Island({
  name,
  props = {},
  children,
  client = true,
  loading = 'eager'
}: IslandProps) {
  // Generate unique ID for this island instance
  const islandId = `island-${name}-${hashProps(props)}`;

  return h('div', {
    'data-island': name,
    'data-island-id': islandId,
    'data-island-props': client ? JSON.stringify(props) : undefined,
    'data-island-loading': loading
  }, children);
}

/**
 * Simple hash function for props to generate unique IDs
 */
function hashProps(props: Record<string, any>): string {
  const str = JSON.stringify(props);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Client-side island hydration
 * Call this on the client to make islands interactive
 */
export function hydrateIslands() {
  if (typeof document === 'undefined') return;

  const islands = document.querySelectorAll('[data-island]');

  Array.from(islands).forEach(island => {
    const name = island.getAttribute('data-island');
    const id = island.getAttribute('data-island-id');
    const propsStr = island.getAttribute('data-island-props');
    const loading = island.getAttribute('data-island-loading') as any;

    if (!name || !id) return;

    const props = propsStr ? JSON.parse(propsStr) : {};

    // Handle different loading strategies
    switch (loading) {
      case 'lazy':
        // Load when near viewport
        observeIsland(island as HTMLElement, () => loadIsland(name, id, props));
        break;

      case 'idle':
        // Load when browser is idle
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => loadIsland(name, id, props));
        } else {
          setTimeout(() => loadIsland(name, id, props), 1);
        }
        break;

      case 'visible':
        // Load only when visible
        observeIsland(island as HTMLElement, () => loadIsland(name, id, props), 0.1);
        break;

      case 'eager':
      default:
        // Load immediately
        loadIsland(name, id, props);
        break;
    }
  });
}

/**
 * Observe an island for lazy loading
 */
function observeIsland(
  element: HTMLElement,
  callback: () => void,
  threshold = 0.5
) {
  if (!('IntersectionObserver' in window)) {
    // Fallback to immediate loading
    callback();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, { threshold });

  observer.observe(element);
}

/**
 * Load and hydrate a specific island
 */
async function loadIsland(name: string, id: string, props: any) {
  // This is where you'd load the island's JavaScript
  // For now, we'll just mark it as hydrated
  const element = document.querySelector(`[data-island-id="${id}"]`);
  if (element) {
    element.setAttribute('data-island-hydrated', 'true');

    // Dispatch custom event for island hydration
    element.dispatchEvent(new CustomEvent('island:hydrated', {
      detail: { name, props }
    }));
  }
}

/**
 * Update a specific island with new content
 * Can be called from Service Worker messages or client-side updates
 */
export async function updateIsland(name: string, props: any) {
  const islands = document.querySelectorAll(`[data-island="${name}"]`);

  Array.from(islands).forEach(async (island) => {
    const currentProps = island.getAttribute('data-island-props');
    const parsedProps = currentProps ? JSON.parse(currentProps) : {};

    // Check if props match
    if (JSON.stringify(parsedProps) === JSON.stringify(props)) {
      // Fetch new HTML for this island
      const response = await fetch(`/api/islands/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(props)
      });

      if (response.ok) {
        const html = await response.text();

        // Check if Idiomorph is available (from global)
        if (typeof (window as any).Idiomorph !== 'undefined' && (window as any).Idiomorph.morph) {
          (window as any).Idiomorph.morph(island, html, {
            callbacks: {
              beforeNodeRemoved: (node: any) => {
                // Preserve form inputs
                if (node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA') {
                  return false;
                }
                return true;
              }
            }
          });
        } else {
          // Fallback to innerHTML
          island.innerHTML = html;
        }

        // Re-hydrate if needed
        if (island.getAttribute('data-island-hydrated') === 'true') {
          loadIsland(name, island.getAttribute('data-island-id')!, props);
        }
      }
    }
  });
}

/**
 * Register island components (for future use with dynamic imports)
 */
const islandRegistry = new Map<string, any>();

export function registerIsland(name: string, component: any) {
  islandRegistry.set(name, component);
}

export function getIsland(name: string) {
  return islandRegistry.get(name);
}

/**
 * Helper to create an island endpoint for SSR
 * This would be used on the server to render individual islands
 */
export interface IslandRoute {
  name: string;
  component: (props: any) => any;
}

export function createIslandEndpoint(islands: IslandRoute[]) {
  return async (ctx: any) => {
    const url = new URL(ctx.req.url);
    const pathParts = url.pathname.split('/');

    // Expected format: /api/islands/{name}
    if (pathParts[2] !== 'islands') return null;

    const islandName = pathParts[3];
    const island = islands.find(i => i.name === islandName);

    if (!island) return null;

    // Get props from request body
    const props = await ctx.req.json();

    // Render the island component
    const html = island.component(props);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  };
}