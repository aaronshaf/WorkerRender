# Your First WorkerRender App

Build a simple app that renders HTML on the server. Start with the basics, then add features step by step.

## Prerequisites

- Node.js 18+ installed
- A text editor

## Setup

Create a new project:

```bash
mkdir my-app
cd my-app
pnpm init
```

Install dependencies:

```bash
pnpm add @worker-render/core @worker-render/hono hono
pnpm add -D @worker-render/vite vite typescript
```

## Step 1: The Simplest Possible Page

Let's start with just one static page. No JSX, no types, no loaders.

Create `src/app.routes.tsx`:

```tsx
import { h } from '@worker-render/core/jsx-runtime';
import { defineRoute } from '@worker-render/core';

export const routes = [
  defineRoute({
    path: '/',
    Page() {
      return (
        <div>
          <h1>Hello World</h1>
          <p>Welcome to WorkerRender!</p>
        </div>
      );
    }
  })
];
```

That's it. A route is just:
- A path (`/`)
- A Page function that returns HTML

Create `src/layout.ts`:

```ts
export function layout({ body }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My App</title>
</head>
<body>${body}</body>
</html>`;
}
```

The layout wraps your page content in an HTML document.

Create `server.ts`:

```ts
import { Hono } from 'hono';
import { createRenderer } from '@worker-render/hono';
import { routes } from './src/app.routes';
import { layout } from './src/layout';

const app = new Hono();
app.use('*', createRenderer({ routes, layout }));

export default app;
```

This creates a web server that renders your routes.

Configure the build in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import workerRender from '@worker-render/vite';

export default defineConfig({
  plugins: [
    workerRender({
      routes: './src/app.routes.tsx',
      layout: './src/layout.ts'
    })
  ]
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedDeclarations": true
  }
}
```

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

Run it:

```bash
pnpm dev
```

Open http://localhost:5173 and you'll see "Hello World".

## Step 2: Add Another Page

Add a second route to `src/app.routes.tsx`:

```tsx
import { h } from '@worker-render/core/jsx-runtime';
import { defineRoute } from '@worker-render/core';

export const routes = [
  defineRoute({
    path: '/',
    Page() {
      return (
        <div>
          <h1>Hello World</h1>
          <p>Welcome to WorkerRender!</p>
          <a href="/about">About</a>
        </div>
      );
    }
  }),

  defineRoute({
    path: '/about',
    Page() {
      return (
        <div>
          <h1>About</h1>
          <p>This is a simple app built with WorkerRender.</p>
          <a href="/">Home</a>
        </div>
      );
    }
  })
];
```

Now you have two pages with links between them. Click the links - they work like normal web pages.

## Step 3: Add Dynamic Data with Loaders

Let's make the pages load data. Add loaders to your routes:

```tsx
import { h } from '@worker-render/core/jsx-runtime';
import { defineRoute } from '@worker-render/core';

export const routes = [
  defineRoute({
    path: '/',
    async loader() {
      return { message: 'Hello World' };
    },
    Page({ data }) {
      return (
        <div>
          <h1>{data.message}</h1>
          <p>Welcome to WorkerRender!</p>
          <a href="/about">About</a>
        </div>
      );
    }
  }),

  defineRoute({
    path: '/about',
    async loader() {
      return { info: 'Built with WorkerRender', version: '1.0' };
    },
    Page({ data }) {
      return (
        <div>
          <h1>About</h1>
          <p>{data.info}</p>
          <p>Version: {data.version}</p>
          <a href="/">Home</a>
        </div>
      );
    }
  })
];
```

A loader runs before the page renders. It returns data that gets passed to your Page function.

## Step 4: Add Page Titles

Update your routes to include titles:

```tsx
import { h } from '@worker-render/core/jsx-runtime';
import { defineRoute } from '@worker-render/core';

export const routes = [
  defineRoute({
    path: '/',
    async loader() {
      return { message: 'Hello World' };
    },
    Page({ data }) {
      return (
        <div>
          <h1>{data.message}</h1>
          <p>Welcome to WorkerRender!</p>
          <a href="/about">About</a>
        </div>
      );
    },
    title: () => 'Home'
  }),

  defineRoute({
    path: '/about',
    async loader() {
      return { info: 'Built with WorkerRender', version: '1.0' };
    },
    Page({ data }) {
      return (
        <div>
          <h1>About</h1>
          <p>{data.info}</p>
          <p>Version: {data.version}</p>
          <a href="/">Home</a>
        </div>
      );
    },
    title: () => 'About'
  })
];
```

Update your layout to use the title:

```ts
export function layout({ title, body }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body>${body}</body>
</html>`;
}
```

Now your browser tabs will show the correct page titles.

## What Just Happened?

You built a server-rendered app in 4 steps:

1. **Static page** - Just HTML, no data
2. **Multiple pages** - Add routes and navigation
3. **Dynamic data** - Load data with loaders
4. **Page titles** - Customize the document title

WorkerRender also automatically generates:
- Client-side navigation (no page reloads)
- Service Worker for offline support
- DOM morphing for smooth updates

Try clicking between pages - notice there's no full page reload. The framework handles that for you.

## Next Steps

- [Add Interactivity](./02-adding-interactivity.md) - Make your pages interactive with forms and events
- [Customize Layouts](./03-custom-layouts.md) - Add styles and scripts
