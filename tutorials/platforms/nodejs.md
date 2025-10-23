# Deploying to Node.js

WorkerRender works with Node.js using Hono's Node.js adapter.

## Setup

Install the Node.js adapter:

```bash
pnpm add @hono/node-server
```

## Server Configuration

Create your server:

```ts
// server.ts
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
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

const port = process.env.PORT || 3000;

console.log(`Server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
```

## Build Configuration

Update your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --config vite.config.sw.ts && vite build --config vite.config.worker.ts",
    "start": "node dist/worker/worker.js"
  }
}
```

## Development

```bash
pnpm build
pnpm start
```

## Production Deployment

Deploy to any Node.js hosting platform:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **Railway**: `railway up`
- **Render**: Connect your Git repository
- **DigitalOcean App Platform**: Connect your Git repository
- **AWS/GCP/Azure**: Use standard Node.js deployment

## Environment Variables

Set the `PORT` environment variable for production:

```bash
PORT=8080 node dist/worker/worker.js
```
