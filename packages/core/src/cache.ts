/**
 * Cache utilities for offline-first architecture
 * Stores route data in IndexedDB for offline access
 */

export interface CachedRoute {
  url: string;
  data: unknown;
  version: string;
  timestamp: number;
  etag?: string;
}

const DB_NAME = 'workerrender-cache';
const DB_VERSION = 1;
const STORE_NAME = 'routes';

/**
 * Initialize IndexedDB
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('version', 'version', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Helper to execute a DB transaction and ensure connection is always closed
 * Prevents connection leaks even when errors occur
 */
async function withDB<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore, tx: IDBTransaction) => Promise<T>
): Promise<T> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    return await callback(store, tx);
  } finally {
    // Always close the connection, even if callback throws
    if (db) {
      db.close();
    }
  }
}

/**
 * Store route data in IndexedDB
 */
export async function cacheRouteData(
  url: string,
  data: unknown,
  version: string,
  etag?: string
): Promise<void> {
  return withDB('readwrite', async (store, tx) => {
    const cached: CachedRoute = {
      url,
      data,
      version,
      timestamp: Date.now(),
      etag
    };

    return new Promise<void>((resolve, reject) => {
      const request = store.put(cached);
      request.onsuccess = () => {}; // Don't resolve yet - wait for transaction
      request.onerror = () => reject(request.error);

      // Wait for transaction to complete before resolving
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

/**
 * Get cached route data from IndexedDB
 */
export async function getCachedRouteData(url: string): Promise<CachedRoute | null> {
  return withDB('readonly', async (store, tx) => {
    return new Promise<CachedRoute | null>((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  });
}

/**
 * Clear cache entries for a specific version
 * Use when deploying new version to invalidate old cache
 */
export async function clearCacheByVersion(version: string): Promise<void> {
  return withDB('readwrite', async (store, tx) => {
    const index = store.index('version');
    const request = index.openCursor(IDBKeyRange.only(version));

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      request.onerror = () => reject(request.error);

      // Wait for transaction to complete
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  return withDB('readwrite', async (store, tx) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {}; // Don't resolve yet - wait for transaction
      request.onerror = () => reject(request.error);

      // Wait for transaction to complete
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

/**
 * Clear cache entries older than maxAge (in milliseconds)
 */
export async function clearOldCache(maxAge: number): Promise<void> {
  return withDB('readwrite', async (store, tx) => {
    const index = store.index('timestamp');
    const cutoff = Date.now() - maxAge;
    const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      request.onerror = () => reject(request.error);

      // Wait for transaction to complete
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}
