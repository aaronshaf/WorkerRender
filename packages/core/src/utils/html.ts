/**
 * HTML utility functions
 * Centralized utilities for HTML escaping and safe JSON serialization
 */

/**
 * Escape HTML text content to prevent XSS
 *
 * @example
 * ```ts
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = escapeHtml(userInput);
 * // Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely serialize data for embedding in HTML script tags
 * Prevents script injection by escaping dangerous characters
 *
 * Why: When embedding JSON in HTML <script> tags, we must escape
 * certain characters to prevent breaking out of the script context
 * or causing XSS vulnerabilities.
 *
 * @example
 * ```ts
 * const data = { message: '</script><script>alert("XSS")</script>' };
 * const safe = safeJsonStringify(data);
 * // Can now safely embed in HTML:
 * // <script>window.__DATA = ${safe}</script>
 * ```
 */
export function safeJsonStringify(data: unknown): string {
  const str = JSON.stringify(data);

  // Why: These replacements prevent breaking out of <script> tags
  // and protect against various injection attacks
  return str
    .replace(/</g, '\\u003c')     // Escape < to prevent </script>
    .replace(/>/g, '\\u003e')     // Escape > for consistency
    .replace(/\//g, '\\u002f')    // Escape / to prevent </script>
    .replace(/-->/g, '--\\u003e') // Escape HTML comment end
    .replace(/\u2028/g, '\\u2028') // Escape line separator
    .replace(/\u2029/g, '\\u2029'); // Escape paragraph separator
}

/**
 * HTML utilities object for convenient importing
 */
export const htmlUtils = {
  escapeHtml,
  safeJsonStringify
};