/**
 * Navigation controller for request deduplication and coordination
 */

export interface NavigationOptions {
  skipHistory?: boolean;
  replace?: boolean;
  signal?: AbortSignal;
}

export interface NavigationResult {
  ok: boolean;
  html?: string;
  error?: Error;
  fromCache?: boolean;
}

/**
 * Controls navigation requests and prevents duplicate fetches
 * Manages a queue of pending navigations to the same URL
 */
export class NavigationController {
  private pending = new Map<string, Promise<NavigationResult>>();
  private activeRequests = new Map<string, AbortController>();
  private navigationHistory: string[] = [];
  private maxHistorySize = 50;

  constructor(private options: {
    maxConcurrent?: number;
    timeout?: number;
    onNavigationStart?: (url: string) => void;
    onNavigationEnd?: (url: string, result: NavigationResult) => void;
    verbose?: boolean;
  } = {}) {
    this.options = {
      maxConcurrent: 2,
      timeout: 30000,
      verbose: false,
      ...options
    };
  }

  private log(...args: unknown[]): void {
    if (this.options.verbose) {
      console.log('[NavigationController]', ...args);
    }
  }

  /**
   * Navigate to a URL with deduplication
   * If a navigation to the same URL is already in progress, returns that promise
   */
  async navigate(url: string, options: NavigationOptions = {}): Promise<NavigationResult> {
    const normalizedUrl = this.normalizeUrl(url);

    // Check if we already have a pending request for this URL
    if (this.pending.has(normalizedUrl)) {
      this.log(`Reusing pending navigation to: ${normalizedUrl}`);
      return this.pending.get(normalizedUrl)!;
    }

    // Cancel previous navigation if replace is true
    if (options.replace) {
      this.cancelAll();
    }

    // Create abort controller for this navigation
    const abortController = new AbortController();
    if (options.signal) {
      options.signal.addEventListener('abort', () => abortController.abort());
    }

    // Create navigation promise
    const navigationPromise = this.performNavigation(normalizedUrl, abortController.signal)
      .finally(() => {
        this.pending.delete(normalizedUrl);
        this.activeRequests.delete(normalizedUrl);
      });

    // Track pending navigation
    this.pending.set(normalizedUrl, navigationPromise);
    this.activeRequests.set(normalizedUrl, abortController);

    // Add to history
    this.addToHistory(normalizedUrl);

    return navigationPromise;
  }

  /**
   * Perform the actual navigation fetch
   */
  private async performNavigation(url: string, signal: AbortSignal): Promise<NavigationResult> {
    try {
      this.log(`Starting navigation to: ${url}`);
      this.options.onNavigationStart?.(url);

      // Create timeout signal
      const timeoutId = setTimeout(() => {
        if (!signal.aborted) {
          this.activeRequests.get(url)?.abort();
        }
      }, this.options.timeout || 30000);

      // Fetch the page
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'X-Navigation': 'morphing'
        },
        signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Navigation failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      const result: NavigationResult = {
        ok: true,
        html,
        fromCache: response.headers.get('X-From-Cache') === 'true'
      };

      this.log(`Navigation completed: ${url}`);
      this.options.onNavigationEnd?.(url, result);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          this.log(`Navigation aborted: ${url}`);
        } else {
          this.log(`Navigation error: ${url}`, error);
        }

        const result: NavigationResult = {
          ok: false,
          error
        };

        this.options.onNavigationEnd?.(url, result);
        return result;
      }

      throw error;
    }
  }

  /**
   * Prefetch a URL without navigating
   * Results are cached in the pending map temporarily
   */
  async prefetch(url: string): Promise<void> {
    const normalizedUrl = this.normalizeUrl(url);

    if (this.pending.has(normalizedUrl)) {
      return;
    }

    const abortController = new AbortController();

    const prefetchPromise = fetch(normalizedUrl, {
      headers: {
        'Accept': 'text/html',
        'X-Prefetch': 'true'
      },
      signal: abortController.signal
    }).then(async response => {
      if (response.ok) {
        const html = await response.text();
        return { ok: true, html, fromCache: false } as NavigationResult;
      }
      throw new Error(`Prefetch failed: ${response.status}`);
    }).catch(error => {
      this.log(`Prefetch failed for ${normalizedUrl}:`, error);
      return { ok: false, error } as NavigationResult;
    }).finally(() => {
      // Keep in pending map for 5 seconds for potential navigation
      setTimeout(() => {
        if (this.pending.get(normalizedUrl) === prefetchPromise) {
          this.pending.delete(normalizedUrl);
        }
      }, 5000);
    });

    this.pending.set(normalizedUrl, prefetchPromise);
  }

  /**
   * Cancel a specific navigation
   */
  cancel(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    const controller = this.activeRequests.get(normalizedUrl);

    if (controller) {
      controller.abort();
      this.activeRequests.delete(normalizedUrl);
      this.pending.delete(normalizedUrl);
      this.log(`Cancelled navigation to: ${normalizedUrl}`);
    }
  }

  /**
   * Cancel all pending navigations
   */
  cancelAll(): void {
    this.activeRequests.forEach((controller, url) => {
      controller.abort();
      this.log(`Cancelled navigation to: ${url}`);
    });

    this.activeRequests.clear();
    this.pending.clear();
  }

  /**
   * Check if a navigation is pending
   */
  isPending(url: string): boolean {
    return this.pending.has(this.normalizeUrl(url));
  }

  /**
   * Get the number of pending navigations
   */
  getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * Get navigation history
   */
  getHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    this.navigationHistory = [];
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url, window.location.origin);
      // Remove hash for comparison (client-side only)
      parsed.hash = '';
      return parsed.href;
    } catch {
      return url;
    }
  }

  /**
   * Add URL to navigation history
   */
  private addToHistory(url: string): void {
    this.navigationHistory.push(url);

    // Trim history if it gets too long
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory = this.navigationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get statistics about navigation
   */
  getStats(): {
    totalNavigations: number;
    pendingNavigations: number;
    averageNavigationTime?: number;
  } {
    return {
      totalNavigations: this.navigationHistory.length,
      pendingNavigations: this.pending.size
    };
  }
}

// Export singleton instance for convenience
export const navigationController = new NavigationController();