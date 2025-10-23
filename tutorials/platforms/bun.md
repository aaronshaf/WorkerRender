# Deploying to Bun

WorkerRender works with Bun using Hono's native Bun support.

## Server Configuration

Create your server:

```ts
// server.ts
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { createRenderer } from '@worker-render/hono';
import { routes } from './src/app.routes';
import { layout } from './src/layout';

const app = new Hono();

// Serve static files
app.use('/client.entry.js', serveStatic({ path: './dist/client/client.entry.js' }));
app.use('/sw.js', serveStatic({ path: './dist/sw/sw.js' }));
app.use('/styles.css', serveStatic({ path: './dist/client/styles.css' }));

// Add SSR renderer
app.use('*', createRenderer({ routes, layout }));

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
```

## Running

```bash
bun server.ts
```

## Why Bun?

- Extremely fast startup and runtime
- Built-in TypeScript support
- Fast package management
- Native fetch and Web APIs
