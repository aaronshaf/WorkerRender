/**
 * Hono-compatible middleware system for WorkerRender
 *
 * This middleware system follows Hono's patterns to allow easy migration
 * and reuse of existing Hono middleware.
 *
 * @see https://hono.dev/docs/guides/middleware
 */

import type { Context } from 'hono';
import type { LoaderCtx } from './routes.js';

/**
 * Hono-compatible middleware function signature
 * Middleware should return nothing and call next() to proceed
 */
export type Middleware = (
  c: Context,
  next: () => Promise<void>
) => Promise<void> | void;

/**
 * WorkerRender middleware that works with LoaderCtx
 * This is for internal use when we need to adapt between Hono Context and LoaderCtx
 */
export type LoaderMiddleware<T = unknown> = (
  ctx: LoaderCtx,
  next: () => Promise<T>
) => Promise<T>;

/**
 * Adapter to convert LoaderCtx to a minimal Hono-like Context
 * This allows Hono middleware to work with WorkerRender routes
 */
export function createContext(loaderCtx: LoaderCtx): Context {
  const variables = new Map<string, unknown>();
  const headers = new Headers();

  // Create a minimal Hono-compatible context
  // Note: This is a simplified implementation - full Hono Context has many more features
  const context = {
    req: {
      url: loaderCtx.url.toString(),
      method: loaderCtx.headers.get('x-http-method') || 'GET',
      header: (name: string) => loaderCtx.headers.get(name),
      headers: loaderCtx.headers,
      param: (key?: string) => key ? loaderCtx.params[key] : loaderCtx.params,
      query: (key?: string) => {
        const params = loaderCtx.url.searchParams;
        if (key) return params.get(key);
        const result: Record<string, string> = {};
        params.forEach((value, key) => { result[key] = value; });
        return result;
      },
      raw: new Request(loaderCtx.url, {
        headers: loaderCtx.headers
      })
    },

    // Variable storage (like Hono's c.set/c.get)
    set: (key: string, value: unknown) => {
      variables.set(key, value);
    },
    get: (key: string) => variables.get(key),
    var: variables,

    // Response helpers
    header: (name: string, value: string) => {
      headers.set(name, value);
    },

    // Response object (simplified)
    res: new Response(),

    // Environment (empty for now, can be extended)
    env: {},

    // Status helper
    status: (code: number) => {
      // Store status for later use
      variables.set('__status', code);
    },

    // Text/JSON/HTML helpers (these would normally create responses)
    text: (text: string) => new Response(text, { headers }),
    json: (object: any) => new Response(JSON.stringify(object), {
      headers: { ...headers, 'content-type': 'application/json' }
    }),
    html: (html: string) => new Response(html, {
      headers: { ...headers, 'content-type': 'text/html' }
    })
  } as unknown as Context;

  return context;
}

/**
 * Adapt a Hono middleware to work with WorkerRender's LoaderMiddleware
 */
export function adaptHonoMiddleware(middleware: Middleware): LoaderMiddleware {
  return async (ctx: LoaderCtx, next: () => Promise<any>) => {
    const honoContext = createContext(ctx);
    let nextCalled = false;

    // Wrap the next function to track if it was called
    const wrappedNext = async () => {
      nextCalled = true;
      // Don't await here - Hono middleware expects next() to return void
    };

    // Run the Hono middleware
    await middleware(honoContext, wrappedNext);

    // If next was called, continue the chain
    if (nextCalled) {
      return next();
    }

    // If middleware didn't call next, it might have set a response
    const status = honoContext.var.get('__status');
    if (status) {
      throw new Response(null, { status: status as number });
    }

    // Default: continue
    return next();
  };
}

/**
 * Compose multiple middleware functions into a single middleware
 * Compatible with both Hono and WorkerRender middleware
 */
export function compose<T = unknown>(...middlewares: LoaderMiddleware<T>[]): LoaderMiddleware<T> {
  return async (ctx: LoaderCtx, next: () => Promise<T>) => {
    let index = -1;

    async function dispatch(i: number): Promise<T> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }

      index = i;

      if (i >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[i];
      return middleware(ctx, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}

/**
 * Run middleware chain with a final handler
 */
export async function runMiddleware<T>(
  ctx: LoaderCtx,
  middlewares: LoaderMiddleware<T>[],
  handler: (ctx: LoaderCtx) => Promise<T>
): Promise<T> {
  let index = 0;

  async function next(): Promise<T> {
    if (index >= middlewares.length) {
      return handler(ctx);
    }

    const middleware = middlewares[index++];
    return middleware(ctx, next);
  }

  return next();
}

/**
 * Create middleware from a function (similar to Hono's createMiddleware)
 * This is a helper for better TypeScript inference
 */
export function createMiddleware<
  Env = {},
  Path extends string = string,
  Input = {}
>(
  middleware: Middleware
): Middleware {
  return middleware;
}

/**
 * Helper to use existing Hono middleware in WorkerRender routes
 *
 * Example:
 * ```typescript
 * import { cors } from 'hono/cors'
 * import { logger } from 'hono/logger'
 * import { useHonoMiddleware } from '@worker-render/core'
 *
 * export default defineRoute({
 *   path: '/api',
 *   middleware: [
 *     useHonoMiddleware(cors()),
 *     useHonoMiddleware(logger())
 *   ],
 *   loader: async (ctx) => { ... }
 * })
 * ```
 */
export function useHonoMiddleware(middleware: Middleware): LoaderMiddleware {
  return adaptHonoMiddleware(middleware);
}