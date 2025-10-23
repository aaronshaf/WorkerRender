/**
 * Service Worker - Offline-first with stale-while-revalidate
 */

/// <reference lib="webworker" />
import { createServiceWorker } from '@worker-render/core';
import { routes } from './app.routes';
import { layout } from './layout';

createServiceWorker({
  routes,
  layout,
  verbose: true // Enable console logging
});
