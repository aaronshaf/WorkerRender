/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from './jsx-runtime';

export type RenderMode = 'ssr' | 'sw' | 'static';

export interface RenderContext {
  mode: RenderMode;
  url: URL;
  headers: Headers;
  params: Record<string, string>;

  // Platform-specific capabilities
  capabilities: {
    canCache: boolean;      // false in SSR, true in SW
    canStream: boolean;      // true in SSR, false in SW
    canRevalidate: boolean;  // false in SSR, true in SW
  };
}

// Global context storage (simple approach without React context)
let currentContext: RenderContext | undefined;

export function setRenderContext(context: RenderContext) {
  currentContext = context;
}

export function useRenderContext(): RenderContext {
  if (!currentContext) {
    // Default context for when called outside render
    return {
      mode: 'ssr',
      url: new URL('http://localhost'),
      headers: new Headers(),
      params: {},
      capabilities: {
        canCache: false,
        canStream: true,
        canRevalidate: false
      }
    };
  }
  return currentContext;
}

// Helper components for conditional rendering
export function ServerOnly({
  children,
  fallback = null
}: {
  children: any;
  fallback?: any;
}) {
  const ctx = useRenderContext();
  return ctx.mode === 'ssr' ? children : fallback;
}

export function ClientOnly({
  children,
  fallback = null
}: {
  children: any;
  fallback?: any;
}) {
  const ctx = useRenderContext();
  return ctx.mode === 'sw' ? children : fallback;
}

// Export helper to create context for different modes
export function createRenderContext(
  mode: RenderMode,
  url: URL,
  headers: Headers,
  params: Record<string, string> = {}
): RenderContext {
  return {
    mode,
    url,
    headers,
    params,
    capabilities: {
      canCache: mode === 'sw',
      canStream: mode === 'ssr',
      canRevalidate: mode === 'sw'
    }
  };
}