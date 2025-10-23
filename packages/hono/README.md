# @worker-render/core-hono

Hono middleware and utilities for WorkerRender.

## Installation

```bash
pnpm add @worker-render/core-hono @worker-render/core hono
```

## Usage

### Basic Setup

```ts
import { Hono } from 'hono';
import { createRenderer } from '@worker-render/core-hono';
import { routes } from './app.routes';

const app = new Hono();

app.use('*', createRenderer({ routes }));

export default app;
```

### Custom Layout

```ts
app.use('*', createRenderer({
  routes,
  layout({ title, body, data }) {
    return `<!doctype html>
<html>
<head><title>${title}</title></head>
<body>${body}</body>
</html>`;
  }
}));
```

### With Existing Routes

```ts
const app = new Hono();

// Your API routes
app.get('/api/*', (c) => {
  // ...
});

// Add SSR for pages
app.use('*', createRenderer({ routes }));
```

## API

See the [main README](../../README.md) for full documentation.
