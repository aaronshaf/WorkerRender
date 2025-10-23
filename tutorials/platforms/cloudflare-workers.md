# Deploying to Cloudflare Workers

Cloudflare Workers provides a serverless platform with global edge deployment. WorkerRender works seamlessly with Cloudflare Workers Assets.

## Setup

Install Wrangler:

```bash
pnpm add -D wrangler
```

## Server Configuration

Create your server with Assets binding support:

```ts
// worker.ts
import { Hono } from 'hono';
import { createRenderer } from '@worker-render/hono';
import { routes } from './src/app.routes';
import { layout } from './src/layout';

const app = new Hono<{ Bindings: { ASSETS: Fetcher } }>();

// Serve static assets through the Assets binding
app.get('/client.entry.js', async (c) => {
  return c.env.ASSETS.fetch(new URL('/client/client.entry.js', c.req.url));
});

app.get('/sw.js', async (c) => {
  return c.env.ASSETS.fetch(new URL('/sw/sw.js', c.req.url));
});

// Add SSR renderer
app.use('*', createRenderer({ routes, layout }));

export default app;
```

## Wrangler Configuration

Create `wrangler.toml` in your project root:

```toml
name = "my-app"
main = "dist/worker/worker.js"
compatibility_date = "2025-01-01"

[assets]
directory = "dist"
binding = "ASSETS"
```

**Note**: You'll need to create this `wrangler.toml` file yourself to configure your Cloudflare Workers deployment settings.

## Build Configuration

Update your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --config vite.config.sw.ts && vite build --config vite.config.worker.ts",
    "preview": "wrangler dev",
    "deploy": "wrangler deploy"
  }
}
```

## Development

```bash
pnpm build
pnpm preview
```

## Deployment

```bash
pnpm build
pnpm deploy
```

## Why Cloudflare Workers?

- Global edge network with low latency
- Built-in static asset serving
- Automatic HTTPS
- DDoS protection
- Pay-as-you-go pricing with generous free tier
