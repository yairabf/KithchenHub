import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Lightweight in-memory key-value cache with TTL expiration and max-size eviction.
 * Suitable for small datasets (<5k catalog items) where Redis is overkill.
 *
 * When the store exceeds maxSize, expired entries are purged first.
 * If still over capacity, the oldest entries (by insertion order) are evicted.
 *
 * @param maxSize - Upper bound on stored entries (default 10 000).
 */
@Injectable()
export class MemoryCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;

  constructor(maxSize = 10_000) {
    this.maxSize = maxSize;
  }

  get size(): number {
    return this.store.size;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evict();
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Evicts entries to bring the store under maxSize.
   * First pass: remove expired entries. Second pass: remove oldest (FIFO) if still full.
   */
  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }

    if (this.store.size < this.maxSize) {
      return;
    }

    const entriesToRemove = this.store.size - this.maxSize + 1;
    let removed = 0;
    for (const key of this.store.keys()) {
      if (removed >= entriesToRemove) break;
      this.store.delete(key);
      removed++;
    }
  }
}
