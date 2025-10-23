/**
 * Cloudflare Worker entry - handles SSR on the edge
 */

import { Hono } from 'hono';
import { createRenderer } from '@worker-render/hono';
import { routes } from './src/app.routes';
import { layout } from './src/layout';

const app = new Hono<{ Bindings: { ASSETS: Fetcher } }>();

// Serve static assets directly (no redirects - Service Workers require direct URLs)
app.get('/client.entry.js', async (c) => {
  return c.env.ASSETS.fetch(new URL('/client/client.entry.js', c.req.url));
});

app.get('/styles.css', async (c) => {
  return c.env.ASSETS.fetch(new URL('/client/styles.css', c.req.url));
});

app.get('/sw.js', async (c) => {
  return c.env.ASSETS.fetch(new URL('/sw/sw.js', c.req.url));
});

// Add SSR renderer with shared layout
app.use('*', createRenderer({ routes, layout }));

export default app;
