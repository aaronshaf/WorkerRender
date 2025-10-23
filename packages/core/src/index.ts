/**
 * @worker-render/core
 * Core JSX runtime and routing
 */

export { h, Fragment } from './jsx-runtime.js';
export type { JSX } from './jsx-runtime.js';
export { defineRoute, matchRoute } from './routes.js';
export type { Route, Loader, LoaderCtx, MatchedRoute } from './routes.js';

// Offline-first utilities
export {
  cacheRouteData,
  getCachedRouteData,
  clearCacheByVersion,
  clearAllCache,
  clearOldCache
} from './cache.js';
export type { CachedRoute } from './cache.js';

export {
  getAppVersion,
  isVersionCompatible,
  VERSION_HEADER,
  APP_VERSION
} from './version.js';

export { renderWithCache } from './sw-strategy.js';
export type { RenderContext } from './sw-strategy.js';

// Context and conditional rendering
export {
  setRenderContext,
  useRenderContext,
  ServerOnly,
  ClientOnly,
  createRenderContext
} from './context.js';
export type { RenderContext as RenderContextType, RenderMode } from './context.js';

// Error handling
export {
  ErrorBoundary,
  DefaultErrorPage,
  withErrorHandling,
  createErrorResponse
} from './error-boundary.js';
export type { ErrorBoundaryProps } from './error-boundary.js';

// Prefetching utilities
export {
  prefetchUrl,
  setupPrefetching,
  prefetchRoutes,
  clearPrefetchCache
} from './prefetch.js';

// Island architecture
export {
  Island,
  hydrateIslands,
  updateIsland,
  registerIsland,
  getIsland,
  createIslandEndpoint
} from './islands.js';
export type { IslandProps, IslandRoute } from './islands.js';

// Remix compatibility
export {
  json,
  redirect,
  defer,
  parseFormData,
  getSearchParams,
  createCookieSessionStorage,
  adaptRemixRoute,
  DeferredData
} from './remix-compat.js';
export type {
  ActionFunction,
  ActionFunctionArgs,
  ActionResult,
  MetaFunction,
  MetaFunctionArgs,
  MetaDescriptor,
  Location,
  RouteMatch,
  RemixRoute,
  LoaderFunctionArgs,
  RouteComponentProps,
  ShouldRevalidateFunction,
  Session,
  SessionStorage,
  LinkProps
} from './remix-compat.js';

// Service Worker helpers
export { createServiceWorker } from './service-worker.js';
export type { ServiceWorkerOptions } from './service-worker.js';

// Client-side helpers - exported separately to avoid bundling issues
// Import directly: import { initClient } from '@worker-render/core/client'
// export { initClient } from './client.js';
// export type { ClientOptions } from './client.js';

// Navigation controller for request deduplication
export { NavigationController, navigationController } from './navigation-controller.js';
export type { NavigationOptions, NavigationResult } from './navigation-controller.js';

// Middleware system (Hono-compatible)
export {
  compose,
  runMiddleware,
  createContext,
  adaptHonoMiddleware,
  useHonoMiddleware,
  createMiddleware
} from './middleware.js';
export type {
  Middleware,
  LoaderMiddleware
} from './middleware.js';

// HTML utilities (includes escapeHtml and safeJsonStringify)
export { htmlUtils, escapeHtml, safeJsonStringify } from './utils/html.js';
