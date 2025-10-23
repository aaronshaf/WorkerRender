/**
 * Node.js dev server for local development
 */

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { createRenderer } from '@worker-render/hono';
import { routes } from './src/app.routes';
import { layout } from './src/layout';

const app = new Hono();

// Serve static assets from dist directory during development
app.get('/client.entry.js', serveStatic({ path: './dist/client/client.entry.js' }));
app.get('/styles.css', serveStatic({ path: './dist/client/styles.css' }));
app.get('/sw.js', serveStatic({ path: './dist/sw/sw.js' }));

// Add SSR renderer with shared layout
app.use('*', createRenderer({ routes, layout }));

const port = 3000;
console.log(`[WorkerRender] Server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
