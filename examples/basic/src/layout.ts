/**
 * Shared HTML layout used by both server and Service Worker
 */

import { escapeHtml, safeJsonStringify } from '@worker-render/core';

export function layout({ title, body, data }: { title: string; body: string; data: unknown }): string {
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
<body class="bg-gray-50">
  ${body}
</body>
</html>`;
}
