# Deploying to Deno

WorkerRender works natively with Deno using Hono's Deno adapter.

## Server Configuration

Create your server:

```ts
// server.ts
import { Hono } from 'hono';
import { serveStatic } from 'hono/deno';
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

Deno.serve(app.fetch);
```

## Running

```bash
deno run --allow-net --allow-read server.ts
```

## Deno Deploy

Deploy to Deno Deploy for global edge hosting:

1. Install Deno Deploy CLI: `deno install -Arf jsr:@deno/deployctl`
2. Deploy: `deployctl deploy server.ts`

Or connect your Git repository at https://deno.com/deploy
