/**
 * Build script to generate static HTML files for GitHub Pages
 */
import { writeFileSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';
import { routes } from './src/app.routes';

const outDir = './dist/static';
const basePath = '/WorkerRender'; // GitHub Pages base path

// Create output directory
mkdirSync(outDir, { recursive: true });

// Generate HTML for each route
for (const route of routes) {
  const url = new URL(`http://localhost${route.path}`);
  const data = await route.loader({ url, headers: new Headers(), params: {} });
  const body = route.Page({ data, url, params: {}, basePath });
  const title = route.title ? route.title(data) : 'WorkerRender';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./styles.css">
  <script>window.__DATA=${JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')}</script>
  <script type="module" src="./client.entry.js"></script>
</head>
<body class="bg-gray-50">
  ${body}
</body>
</html>`;

  const filename = route.path === '/' ? 'index.html' : `${route.path.slice(1)}.html`;
  writeFileSync(join(outDir, filename), html);
  console.log(`Generated ${filename}`);
}

// Copy client assets
cpSync('./dist/client', join(outDir), { recursive: true });

// Copy service worker
cpSync('./dist/sw/sw.js', join(outDir, 'sw.js'));

console.log('Static build complete!');

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
