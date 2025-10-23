/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from './jsx-runtime';
import { useRenderContext } from './context';

export interface ErrorBoundaryProps {
  fallback?: (error: Error) => any;
  children: any;
  onError?: (error: Error, context: any) => void;
}

// Default error page component
export function DefaultErrorPage({ error }: { error: Error }): any {
  return h('div', { style: 'padding: 2rem; font-family: system-ui, sans-serif;' },
    h('h1', { style: 'color: #dc2626; margin-bottom: 1rem;' }, 'Something went wrong') as any,
    h('pre', { style: 'background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;' },
      error.stack || error.message
    ) as any,
    h('p', { style: 'margin-top: 1rem;' },
      h('a', { href: '/', style: 'color: #3b82f6; text-decoration: underline;' }, 'Go back home') as any
    ) as any
  );
}

// Simple ErrorBoundary for JSX templates
// Note: This is a simplified version - true error boundaries need framework support
export function ErrorBoundary({
  fallback,
  children,
  onError
}: ErrorBoundaryProps) {
  try {
    // In a real implementation, this would be handled by the framework
    // For now, we provide a pattern that can be used with try/catch in routes
    return children;
  } catch (error: any) {
    const ctx = useRenderContext();

    // Log differently based on context
    if (ctx?.mode === 'ssr') {
      console.error('[SSR Error]', error);
    } else if (ctx?.mode === 'sw') {
      console.error('[SW Error]', error);
    } else {
      console.error('[Error]', error);
    }

    // Call error handler if provided
    onError?.(error, ctx);

    // Render fallback
    if (fallback) {
      return fallback(error);
    }

    return DefaultErrorPage({ error });
  }
}

// Helper function to wrap route loaders with error handling
export function withErrorHandling<T>(
  loader: (ctx: any) => Promise<T>,
  fallbackData?: T
): (ctx: any) => Promise<T> {
  return async (ctx) => {
    try {
      return await loader(ctx);
    } catch (error) {
      console.error('Loader error:', error);

      // Return fallback data if provided
      if (fallbackData !== undefined) {
        return fallbackData;
      }

      // Re-throw to be handled by route error boundary
      throw error;
    }
  };
}

// Helper to create error responses
export function createErrorResponse(error: Error, status = 500): Response {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Error</title>
</head>
<body>
  <div style="padding: 2rem; font-family: system-ui, sans-serif;">
    <h1 style="color: #dc2626; margin-bottom: 1rem;">Something went wrong</h1>
    <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;">${error.stack || error.message}</pre>
    <p style="margin-top: 1rem;">
      <a href="/" style="color: #3b82f6; text-decoration: underline;">Go back home</a>
    </p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}