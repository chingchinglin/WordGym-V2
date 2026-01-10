/**
 * IndexedDBCache - Simple IndexedDB wrapper for caching large data
 * Issue #72: Use IndexedDB for vocabulary data caching
 */

export class IndexedDBCache {
  private dbName: string;
  private storeName: string;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName: string, storeName: string) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  /**
   * Open the database connection
   */
  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => {
          reject(new Error(`Failed to get from IndexedDB: ${request.error}`));
        };

        request.onsuccess = () => {
          resolve(request.result || null);
        };
      });
    } catch (error) {
      console.error("IndexedDB get error:", error);
      return null;
    }
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onerror = () => {
          reject(new Error(`Failed to set in IndexedDB: ${request.error}`));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error("IndexedDB set error:", error);
    }
  }

  /**
   * Delete a value from the cache
   */
  async delete(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => {
          reject(
            new Error(`Failed to delete from IndexedDB: ${request.error}`),
          );
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error("IndexedDB delete error:", error);
    }
  }

  /**
   * Clear all data in the store
   */
  async clear(): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => {
          reject(new Error(`Failed to clear IndexedDB: ${request.error}`));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error("IndexedDB clear error:", error);
    }
  }
}
