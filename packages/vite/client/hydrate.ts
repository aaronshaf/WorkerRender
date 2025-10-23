/**
 * Client-side hydration entry
 * This is a pre-built client entry that can be used directly
 */

import { hydrateIslands } from '@worker-render/core';

async function main(): Promise<void> {
  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { type: 'module' });
      console.log('[WorkerRender] Service Worker registered');
    } catch (err) {
      console.warn('[WorkerRender] Service Worker registration failed:', err);
    }
  }

  // Hydrate all islands on the page
  await hydrateIslands();
  console.log('[WorkerRender] Islands hydrated');
}

void main();
