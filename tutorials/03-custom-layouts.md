# Custom Layouts

Customize your HTML layout with CSS, fonts, and additional scripts.

## Adding CSS

Update your `src/layout.ts` to include a stylesheet:

```ts
import { escapeHtml, safeJsonStringify } from '@worker-render/core';

export function layout({ title, body, data }: { title: string; body: string; data: unknown }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/styles.css">
  <script>window.__DATA=${safeJsonStringify(data)}</script>
  <script type="module" src="/client.entry.js"></script>
</head>
<body>${body}</body>
</html>`;
}
```

Create `src/styles.css`:

```css
body {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
}

a {
  color: #0066cc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}
```

## Adding a Navigation Bar

Wrap your body content with a nav element:

```ts
export function layout({ title, body, data }: { title: string; body: string; data: unknown }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/styles.css">
  <script>window.__DATA=${safeJsonStringify(data)}</script>
  <script type="module" src="/client.entry.js"></script>
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
  ${body}
</body>
</html>`;
}
```

Style your nav in `src/styles.css`:

```css
nav {
  display: flex;
  gap: 1rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #ddd;
  margin-bottom: 2rem;
}
```

## Using Tailwind CSS

Install Tailwind:

```bash
pnpm add -D tailwindcss @tailwindcss/postcss postcss autoprefixer
```

Create `tailwind.config.js`:

```js
export default {
  content: ['./src/**/*.{ts,tsx}']
};
```

Create `postcss.config.js`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};
```

Create `src/styles.css`:

```css
@import "tailwindcss";
```

Update your layout with Tailwind classes:

```ts
export function layout({ title, body, data }: { title: string; body: string; data: unknown }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/styles.css">
  <script>window.__DATA=${safeJsonStringify(data)}</script>
  <script type="module" src="/client.entry.js"></script>
</head>
<body class="max-w-4xl mx-auto p-8">
  <nav class="flex gap-4 pb-4 border-b mb-8">
    <a href="/" class="text-blue-600 hover:underline">Home</a>
    <a href="/about" class="text-blue-600 hover:underline">About</a>
  </nav>
  ${body}
</body>
</html>`;
}
```

## Adding Web Fonts

Include Google Fonts or any other web font:

```ts
export function layout({ title, body, data }: { title: string; body: string; data: unknown }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <script>window.__DATA=${safeJsonStringify(data)}</script>
  <script type="module" src="/client.entry.js"></script>
</head>
<body>
  ${body}
</body>
</html>`;
}
```

Update your CSS:

```css
body {
  font-family: 'Inter', system-ui, sans-serif;
}
```

## Adding Analytics

Include analytics scripts in your layout:

```ts
export function layout({ title, body, data }: { title: string; body: string; data: unknown }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/styles.css">
  <script>window.__DATA=${safeJsonStringify(data)}</script>
  <script type="module" src="/client.entry.js"></script>

  <!-- Analytics -->
  <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
</head>
<body>
  ${body}
</body>
</html>`;
}
```

## Meta Tags for SEO

Add meta tags for better SEO:

```ts
export function layout({ title, body, data }: { title: string; body: string; data: unknown }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Your app description here">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="Your app description">
  <meta property="og:type" content="website">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/styles.css">
  <script>window.__DATA=${safeJsonStringify(data)}</script>
  <script type="module" src="/client.entry.js"></script>
</head>
<body>
  ${body}
</body>
</html>`;
}
```

## Next Steps

- [How It Works](../HOW_IT_WORKS.md) - Understand the architecture
- [Offline-First](./offline-first.md) - Learn about caching strategies
