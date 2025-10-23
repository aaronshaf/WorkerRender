/**
 * JSX Runtime - Re-exports from hono/jsx
 * Using Hono's battle-tested JSX runtime instead of custom implementation
 */

// Re-export everything from hono/jsx
export { jsx, Fragment } from 'hono/jsx';
export type { JSX } from 'hono/jsx';

// Keep h as an alias for jsx for backward compatibility
export { jsx as h } from 'hono/jsx';

// JSX automatic runtime exports (jsxs is same as jsx in hono)
export { jsx as jsxs, jsx as jsxDEV } from 'hono/jsx';
