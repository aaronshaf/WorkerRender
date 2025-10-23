/**
 * Hono middleware for WorkerRender
 */

import type { MiddlewareHandler, Context } from 'hono';
import { Hono } from 'hono';
import { matchRoute } from '@worker-render/core';
import type { Route } from '@worker-render/core';
import { renderHTML, type RenderOptions } from './renderer.js';

export interface CreateRendererOptions extends RenderOptions {
  /**
   * Array of route definitions
   */
  routes: Route[];

  /**
   * Custom 404 handler
   */
  notFound?: (c: Context) => Response | Promise<Response>;
}

/**
 * Create a Hono middleware that handles SSR rendering
 *
 * @example
 * ```ts
 * import { Hono } from 'hono';
 * import { createRenderer } from '@worker-render/hono';
 * import { routes } from './app.routes';
 *
 * const app = new Hono();
 * app.use('*', createRenderer({ routes }));
 * ```
 */
export function createRenderer(options: CreateRendererOptions): MiddlewareHandler {
  const { routes, notFound, ...renderOptions } = options;

  return async (c, next) => {
    const url = new URL(c.req.url);

    // Try to match a route
    const matched = matchRoute(url, routes);

    if (!matched) {
      // No route matched - either call custom notFound or continue
      if (notFound) {
        return notFound(c);
      }
      return next();
    }

    const { route, params } = matched;

    try {
      // Render the route
      const html = await renderHTML(route, url, c.req.raw.headers, params, renderOptions);
      return c.html(html);
    } catch (error) {
      // If rendering fails, let Hono's error handling take over
      console.error('[WorkerRender] Render error:', error);
      throw error;
    }
  };
}

/**
 * Factory to create a complete Hono app with WorkerRender
 *
 * @example
 * ```ts
 * import { Hono } from 'hono';
 * import { createApp } from '@worker-render/hono';
 * import { routes } from './app.routes';
 *
 * const app = createApp({ routes });
 * export default app;
 * ```
 */
export function createApp(options: CreateRendererOptions) {
  // Hono is imported at the top of the file
  const app = new Hono();

  // Why: Service Workers require exact URLs and can't follow redirects for
  // navigation requests. We serve assets directly at their final URLs to ensure
  // the Service Worker can be registered correctly. Cloudflare Workers serve
  // assets from subdirectories, so we redirect root requests to the actual paths.
  app.get('/client.entry.js', (c) => c.redirect('/client/client.entry.js', 302));
  app.get('/sw.js', (c) => c.redirect('/sw/sw.js', 302));
  app.get('/client/*', async (c) => {
    // This will be handled by Cloudflare Workers Assets or serve middleware
    return c.notFound();
  });

  // Add renderer middleware
  app.use('*', createRenderer(options));

  return app;
}
