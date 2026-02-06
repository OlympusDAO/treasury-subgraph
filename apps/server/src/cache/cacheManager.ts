import { LRUCache } from "lru-cache";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  max?: number;
  defaultTtl?: number; // in milliseconds
}

/**
 * Options for cache get operations
 */
export interface CacheGetOptions {
  /** If true, bypass cache read and return null (forces fresh fetch) */
  bypassCache?: boolean;
}

export class CacheManager<T = unknown> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private defaultTtl: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.defaultTtl || 3600000; // 1 hour default
    this.cache = new LRUCache<string, CacheEntry<T>>({
      max: options.max || 500,
      // We handle TTL manually for more control
    });
  }

  /**
   * Generate a cache key from operation name and parameters
   */
  static generateKey(operation: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return operation;
    }
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params[key as keyof typeof params])}`)
      .join("|");
    return `${operation}?${sortedParams}`;
  }

  /**
   * Get a value from cache
   * @param key The cache key
   * @param options Optional configuration for cache read
   * @returns The cached value or null if not found/expired/bypassed
   */
  async get(key: string, options?: CacheGetOptions): Promise<T | null> {
    // If bypassCache is true, skip cache read entirely
    if (options?.bypassCache) {
      return null;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in cache
   */
  async set(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    };
    this.cache.set(key, entry);
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      calculatedSize: this.cache.calculatedSize,
      maxSize: this.cache.max,
    };
  }

  /**
   * Get or set pattern - useful for memoization
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const entry = this.cache.get(key);

    // Check if entry exists (even if data is null)
    if (entry) {
      const now = Date.now();
      if (now - entry.timestamp <= entry.ttl) {
        return entry.data;
      }
      // Entry expired, delete it
      this.cache.delete(key);
    }

    const data = await factory();
    await this.set(key, data, ttl);
    return data;
  }
}

// Global cache instance
let globalCache: CacheManager | null = null;

export function getGlobalCache(): CacheManager {
  if (!globalCache) {
    globalCache = new CacheManager({
      max: 500,
      defaultTtl: 3600000, // 1 hour
    });
  }
  return globalCache;
}

export async function clearGlobalCache(): Promise<void> {
  if (globalCache) {
    await globalCache.clear();
  }
}
