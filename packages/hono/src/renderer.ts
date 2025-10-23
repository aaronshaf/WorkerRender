/**
 * HTML renderer for WorkerRender
 * Handles SSR rendering with layouts and data injection
 */

import type { Route } from '@worker-render/core';

export interface RenderOptions {
  /**
   * Layout component that wraps all pages
   */
  layout?: (opts: { title: string; body: string; data: unknown }) => string;

  /**
   * Default page title
   */
  defaultTitle?: string;
}

/**
 * Escape HTML text content
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely serialize data for embedding in HTML
 */
function safeJsonStringify(data: unknown): string {
  const str = JSON.stringify(data);
  return str
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
    .replace(/-->/g, '--\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Default HTML layout
 */
export function defaultLayout(opts: { title: string; body: string; data: unknown }): string {
  const payload = safeJsonStringify(opts.data);
  const safeTitle = escapeHtml(opts.title);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<script>window.__DATA=${payload}</script>
<script type="module" src="/client.entry.js"></script>
</head>
<body>${opts.body}</body>
</html>`;
}

/**
 * Render a route to HTML with error handling
 */
export async function renderHTML(
  route: Route,
  url: URL,
  headers: Headers,
  params: Record<string, string> = {},
  options: RenderOptions = {}
): Promise<string> {
  const { layout = defaultLayout, defaultTitle = 'App' } = options;

  try {
    // Load data
    const data = await route.loader({ url, headers, params });

    // Render page body (convert JSX element to string)
    const bodyJSX = route.Page({ data, url, params });
    const body = typeof bodyJSX === 'string'
      ? bodyJSX
      : (bodyJSX as any)?.toString?.() ?? String(bodyJSX);

    // Get title
    const title = route.title ? route.title(data) : defaultTitle;

    // Wrap in layout
    return layout({ title, body, data });
  } catch (error) {
    // Re-throw the error so the caller can handle it
    // This allows middleware to implement custom error pages
    throw error;
  }
}
