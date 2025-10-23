/**
 * Simplified client entry using the new initClient helper
 * This shows how simple the client can be with auto-generation
 */
import { initClient } from '@worker-render/core';
import { Idiomorph } from 'idiomorph';

// Make idiomorph available globally for DOM morphing
(window as any).Idiomorph = Idiomorph;

// Initialize WorkerRender with all features
await initClient({
  prefetch: true,      // Enable link prefetching
  morphing: true,      // Enable DOM morphing
  verbose: true,       // Debug logs in development
  swPath: '/sw.js'     // Service Worker location
});

// That's it! The initClient helper handles everything:
// - Service Worker registration
// - DOM morphing navigation
// - Prefetching on hover
// - Fresh data updates
// - Form state preservation
// - Browser back/forward support