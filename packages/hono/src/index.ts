/**
 * @worker-render/hono
 * Hono middleware and utilities for WorkerRender
 */

export { createRenderer, createApp } from './middleware.js';
export type { CreateRendererOptions } from './middleware.js';
export { renderHTML, defaultLayout } from './renderer.js';
export type { RenderOptions } from './renderer.js';

// Streaming support (SSR only)
export {
  StreamingRenderer,
  streamingResponse,
  createStreamingRenderer
} from './streaming.js';
export type { StreamingOptions } from './streaming.js';
