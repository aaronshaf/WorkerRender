/**
 * Route definition and matching system
 */

import type { LoaderMiddleware } from './middleware.js';

export type LoaderCtx = {
  url: URL;
  headers: Headers;
  params: Record<string, string>;
};

export type Loader<D> = (ctx: LoaderCtx) => Promise<D>;

export type Route<D = unknown> = {
  path: string;
  loader: Loader<D>;
  middleware?: LoaderMiddleware<D>[];
  Page: (p: { data: D; url: URL; params: Record<string, string> }) => string | { toString(): string };
  title?: (d: D) => string;
};

export function defineRoute<D>(r: Route<D>): Route<D> {
  return r;
}

// Cache compiled route patterns to avoid recompilation
const pathRegexCache = new Map<string, { regex: RegExp; keys: string[] }>();

/**
 * Simple path-to-regexp style matcher
 * Supports :param style parameters
 * Wildcards don't match directory separators to prevent path traversal
 */
function pathToRegex(path: string): { regex: RegExp; keys: string[] } {
  // Check cache first
  const cached = pathRegexCache.get(path);
  if (cached) {
    return cached;
  }

  const keys: string[] = [];
  const pattern = path
    .replace(/\/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return '/([^/]+)';
    })
    .replace(/\*/g, '[^/]+'); // Only match within a path segment (no / or ..)

  const result = {
    regex: new RegExp(`^${pattern}$`),
    keys
  };

  // Cache the compiled pattern
  pathRegexCache.set(path, result);

  return result;
}

export type MatchedRoute = {
  route: Route;
  params: Record<string, string>;
};

export function matchRoute(url: URL, routes: Route[]): MatchedRoute | null {
  const pathname = url.pathname;

  for (const route of routes) {
    // Exact match first
    if (route.path === pathname) {
      return { route, params: {} };
    }

    // Pattern match with params
    const { regex, keys } = pathToRegex(route.path);
    const match = pathname.match(regex);

    if (match) {
      const params: Record<string, string> = {};
      keys.forEach((key, i) => {
        params[key] = match[i + 1];
      });
      return { route, params };
    }
  }

  return null;
}
