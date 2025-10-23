/**
 * Streaming HTML responses for better perceived performance
 * Only works in SSR mode, not in Service Workers
 */

import type { Route } from '@worker-render/core';

export interface StreamingOptions {
  /** Initial HTML to send immediately (head, navigation, etc.) */
  shell?: (data: { title: string }) => string;

  /** How to wrap streamed content */
  wrapper?: (content: string) => string;

  /** Footer HTML to send at the end */
  footer?: () => string;
}

/**
 * Create a streaming HTML renderer for SSR
 * Sends HTML in chunks as it becomes available
 */
export class StreamingRenderer {
  private encoder = new TextEncoder();

  constructor(private options: StreamingOptions = {}) {}

  /**
   * Render a route with streaming HTML
   */
  async renderStream(
    route: Route,
    context: any
  ): Promise<ReadableStream<Uint8Array>> {
    const self = this;

    return new ReadableStream({
      async start(controller) {
        try {
          // Send initial shell immediately
          const title = route.title ? String(route.title(null)) : 'Loading...';
          const shell = self.options.shell || defaultShell;
          controller.enqueue(self.encoder.encode(shell({ title })));

          // Load data
          const data = await route.loader?.(context);

          // Update title if needed
          if (route.title && data) {
            const newTitle = String(route.title(data));
            if (newTitle !== title) {
              // Send script to update title
              controller.enqueue(
                self.encoder.encode(
                  `<script>document.title=${JSON.stringify(newTitle)}</script>`
                )
              );
            }
          }

          // Render page content
          const content = route.Page({ data, url: context.url, params: context.params });

          // Wrap and send content
          const wrapper = self.options.wrapper || defaultWrapper;
          controller.enqueue(self.encoder.encode(wrapper(String(content))));

          // Send footer
          const footer = self.options.footer || defaultFooter;
          controller.enqueue(self.encoder.encode(footer()));

        } catch (error: any) {
          // Send error to client
          controller.enqueue(
            self.encoder.encode(
              `<div class="error">Error: ${error?.message || 'Unknown error'}</div>`
            )
          );
        } finally {
          controller.close();
        }
      }
    });
  }

  /**
   * Render with deferred data (like Remix's defer)
   * Some data loads immediately, other data streams in later
   */
  async renderStreamWithDeferred(
    route: Route & { deferredLoader?: (ctx: any) => Promise<any> },
    context: any
  ): Promise<ReadableStream<Uint8Array>> {
    const self = this;

    return new ReadableStream({
      async start(controller) {
        try {
          // Load immediate data
          const data = await route.loader?.(context);

          // Send initial HTML with immediate data
          const title = route.title ? String(route.title(data)) : 'App';
          const shell = self.options.shell || defaultShell;
          controller.enqueue(self.encoder.encode(shell({ title })));

          // Render initial page
          const content = route.Page({ data, url: context.url, params: context.params });
          const wrapper = self.options.wrapper || defaultWrapper;
          controller.enqueue(self.encoder.encode(wrapper(String(content))));

          // Start loading deferred data
          if (route.deferredLoader) {
            const deferredPromise = route.deferredLoader(context);

            // Send placeholder
            controller.enqueue(
              self.encoder.encode(
                '<div id="deferred-content" data-loading="true">Loading...</div>'
              )
            );

            // When deferred data arrives, send update script
            deferredPromise.then(deferredData => {
              const script = `
                <script>
                  (function() {
                    const container = document.getElementById('deferred-content');
                    if (container) {
                      container.innerHTML = ${JSON.stringify(
                        renderDeferredContent(deferredData)
                      )};
                      container.removeAttribute('data-loading');
                    }
                  })();
                </script>
              `;
              controller.enqueue(self.encoder.encode(script));
            }).catch(error => {
              // Send error update
              const script = `
                <script>
                  const container = document.getElementById('deferred-content');
                  if (container) {
                    container.innerHTML = '<div class="error">Failed to load</div>';
                    container.removeAttribute('data-loading');
                  }
                </script>
              `;
              controller.enqueue(self.encoder.encode(script));
            });
          }

          // Send footer
          const footer = self.options.footer || defaultFooter;
          controller.enqueue(self.encoder.encode(footer()));

        } catch (error: any) {
          controller.enqueue(
            self.encoder.encode(
              `<div class="error">Error: ${error?.message || 'Unknown error'}</div>`
            )
          );
        } finally {
          // Wait a bit for deferred content before closing
          await new Promise(resolve => setTimeout(resolve, 100));
          controller.close();
        }
      }
    });
  }
}

/**
 * Default shell HTML (sent immediately)
 */
function defaultShell({ title }: { title: string }): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    /* Minimal loading styles */
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
    .loading { opacity: 0.6; }
    .error { color: red; padding: 1rem; }
  </style>
</head>
<body>
`;
}

/**
 * Default content wrapper
 */
function defaultWrapper(content: string): string {
  return `<div id="app">${content}</div>`;
}

/**
 * Default footer HTML (sent at the end)
 */
function defaultFooter(): string {
  return `
  <script type="module" src="/client.entry.js"></script>
</body>
</html>`;
}

/**
 * Render deferred content (helper)
 */
function renderDeferredContent(data: any): string {
  // This would be customized based on your needs
  return `<div>${JSON.stringify(data)}</div>`;
}

/**
 * Escape HTML for safe rendering
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Create a streaming response for Hono
 */
export function streamingResponse(
  stream: ReadableStream<Uint8Array>
): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

/**
 * Hono middleware for streaming responses
 */
export function createStreamingRenderer(options?: StreamingOptions) {
  const renderer = new StreamingRenderer(options);

  return async (c: any, route: Route, context: any) => {
    // Check if client supports streaming
    const acceptsStreaming = c.req.header('Accept')?.includes('text/html');

    if (!acceptsStreaming) {
      // Fallback to regular rendering
      return null;
    }

    // Create stream
    const stream = await renderer.renderStream(route, context);

    // Return streaming response
    return c.body(stream, 200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Transfer-Encoding': 'chunked'
    });
  };
}