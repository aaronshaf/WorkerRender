/**
 * Examples of creating Hono-compatible middleware for WorkerRender
 *
 * These examples show how to create middleware that follows Hono's patterns
 * and can be used with WorkerRender routes via useHonoMiddleware()
 *
 * @see https://hono.dev/docs/guides/middleware
 */

import type { Context } from 'hono';

/**
 * Timing middleware - measures request duration
 * This follows Hono's middleware pattern exactly
 */
export const timing = async (c: Context, next: () => Promise<void>) => {
  const start = performance.now();

  // Run the next middleware/handler
  await next();

  // After response
  const duration = performance.now() - start;
  c.header('X-Response-Time', `${duration.toFixed(2)}ms`);
  console.log(`${c.req.method} ${c.req.url} - ${duration.toFixed(2)}ms`);
};

/**
 * Request ID middleware
 */
export const requestId = async (c: Context, next: () => Promise<void>) => {
  const id = crypto.randomUUID();

  // Store in context for other middleware to use
  c.set('requestId', id);

  // Add header
  c.header('X-Request-ID', id);

  await next();
};

/**
 * Custom CORS middleware
 * (In production, use hono/cors instead)
 */
export const cors = (options?: {
  origin?: string | string[];
  credentials?: boolean;
}) => {
  return async (c: Context, next: () => Promise<void>) => {
    const origin = c.req.header('Origin') || '*';
    const allowedOrigin = options?.origin || '*';

    // Set CORS headers
    if (Array.isArray(allowedOrigin)) {
      if (allowedOrigin.includes(origin)) {
        c.header('Access-Control-Allow-Origin', origin);
      }
    } else {
      c.header('Access-Control-Allow-Origin', allowedOrigin);
    }

    if (options?.credentials) {
      c.header('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight
    if (c.req.method === 'OPTIONS') {
      c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return; // Don't call next() for preflight
    }

    await next();
  };
};

/**
 * Simple auth middleware
 */
export const auth = (options: { token: string }) => {
  return async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In Hono, you'd normally use c.status(401) and return
      // For WorkerRender compatibility, we throw a Response
      throw new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer' }
      });
    }

    const token = authHeader.substring(7);

    if (token !== options.token) {
      throw new Response('Invalid token', { status: 403 });
    }

    // Store user info in context
    c.set('user', { authenticated: true, token });

    await next();
  };
};

/**
 * Rate limiting middleware (simple in-memory version)
 */
const rateLimitStore = new Map<string, { count: number; reset: number }>();

export const rateLimit = (options?: {
  limit?: number;
  windowMs?: number;
}) => {
  const limit = options?.limit || 100;
  const windowMs = options?.windowMs || 60000; // 1 minute

  return async (c: Context, next: () => Promise<void>) => {
    const key = c.req.header('x-forwarded-for') || 'anonymous';
    const now = Date.now();

    // Clean expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.reset < now) {
        rateLimitStore.delete(k);
      }
    }

    // Get or create entry
    let entry = rateLimitStore.get(key);
    if (!entry || entry.reset < now) {
      entry = { count: 0, reset: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > limit) {
      throw new Response('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.reset).toISOString(),
          'Retry-After': Math.ceil((entry.reset - now) / 1000).toString()
        }
      });
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', (limit - entry.count).toString());
    c.header('X-RateLimit-Reset', new Date(entry.reset).toISOString());

    await next();
  };
};

/**
 * Logger middleware
 */
export const logger = () => {
  return async (c: Context, next: () => Promise<void>) => {
    const start = Date.now();
    const method = c.req.method;
    const url = c.req.url;

    console.log(`→ ${method} ${url}`);

    await next();

    const duration = Date.now() - start;
    const status = (c.res as any).status || 200;

    console.log(`← ${method} ${url} ${status} ${duration}ms`);
  };
};

/**
 * Example of using these with WorkerRender:
 *
 * ```typescript
 * import { defineRoute, useHonoMiddleware } from '@worker-render/core';
 * import { timing, requestId, auth } from './middleware/hono-examples';
 *
 * export default defineRoute({
 *   path: '/api/data',
 *   middleware: [
 *     useHonoMiddleware(timing),
 *     useHonoMiddleware(requestId),
 *     useHonoMiddleware(auth({ token: 'secret-token' }))
 *   ],
 *   loader: async (ctx) => {
 *     // Your loader logic here
 *   },
 *   Page: ({ data }) => {
 *     // Your page component
 *   }
 * });
 * ```
 */