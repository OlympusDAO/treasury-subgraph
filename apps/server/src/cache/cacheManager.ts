import { LRUCache } from 'lru-cache';
import { Logger } from '../core/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  max?: number;
  defaultTtl?: number; // in milliseconds
}

export class CacheManager<T = any> {
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
      .join('|');
    return `${operation}?${sortedParams}`;
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<T | null> {
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
  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
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

export function clearGlobalCache(): void {
  if (globalCache) {
    globalCache.clear();
  }
}
