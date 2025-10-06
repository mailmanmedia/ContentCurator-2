/**
 * Analytics Cache System
 * Smart caching for calculated metrics with TTL, invalidation, and background refresh
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl: number;
  maxSize?: number;
  backgroundRefresh?: boolean;
}

type RefreshFunction<T> = () => Promise<T> | T;

export class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private refreshFunctions = new Map<string, RefreshFunction<any>>();
  private refreshTimers = new Map<string, NodeJS.Timeout>();
  private maxCacheSize: number;
  private readonly DEFAULT_MAX_SIZE = 500;
  private readonly BACKGROUND_REFRESH_THRESHOLD = 5;
  private readonly MEMORY_CHECK_INTERVAL = 60000;

  constructor(maxSize?: number) {
    this.maxCacheSize = maxSize || this.DEFAULT_MAX_SIZE;
    this.startMemoryMonitoring();
  }

  /**
   * Get cached data or compute if missing/expired
   */
  async get<T>(
    key: string,
    computeFn: RefreshFunction<T>,
    options: CacheOptions
  ): Promise<T> {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry && now - entry.timestamp < entry.ttl) {
      entry.accessCount++;
      entry.lastAccessed = now;

      if (
        options.backgroundRefresh &&
        entry.accessCount >= this.BACKGROUND_REFRESH_THRESHOLD &&
        now - entry.timestamp > entry.ttl * 0.75
      ) {
        this.scheduleBackgroundRefresh(key, computeFn, options);
      }

      return entry.data;
    }

    const data = await computeFn();
    this.set(key, data, options);

    if (options.backgroundRefresh) {
      this.refreshFunctions.set(key, computeFn);
    }

    return data;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, options: CacheOptions): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options.ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.clearRefreshTimer(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    for (const key of Array.from(this.cache.keys())) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.invalidate(key));
  }

  /**
   * Invalidate all team metrics (e.g., when new match data is added)
   */
  invalidateTeamMetrics(): void {
    this.invalidatePattern(/^team-/);
  }

  /**
   * Invalidate all player metrics
   */
  invalidatePlayerMetrics(): void {
    this.invalidatePattern(/^player-/);
  }

  /**
   * Invalidate all match predictions
   */
  invalidatePredictions(): void {
    this.invalidatePattern(/^prediction-/);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.refreshTimers.forEach(timer => clearTimeout(timer));
    this.refreshTimers.clear();
    this.refreshFunctions.clear();
  }

  /**
   * Schedule background refresh for frequently accessed entries
   */
  private scheduleBackgroundRefresh<T>(
    key: string,
    computeFn: RefreshFunction<T>,
    options: CacheOptions
  ): void {
    if (this.refreshTimers.has(key)) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await computeFn();
        this.set(key, data, options);
      } catch (error) {
        console.error(`Background refresh failed for ${key}:`, error);
      } finally {
        this.refreshTimers.delete(key);
      }
    }, options.ttl * 0.9);

    this.refreshTimers.set(key, timer);
  }

  /**
   * Clear refresh timer
   */
  private clearRefreshTimer(key: string): void {
    const timer = this.refreshTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.refreshTimers.delete(key);
    }
  }

  /**
   * Evict least recently used entry when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.invalidate(oldestKey);
    }
  }

  /**
   * Memory monitoring and automatic cleanup
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of Array.from(this.cache.entries())) {
        if (now - entry.timestamp > entry.ttl * 2) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.invalidate(key));

      if (this.cache.size > this.maxCacheSize * 0.9) {
        const entriesToRemove = Math.floor(this.maxCacheSize * 0.2);
        const sortedEntries = Array.from(this.cache.entries())
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        sortedEntries.slice(0, entriesToRemove).forEach(([key]) => {
          this.invalidate(key);
        });
      }
    }, this.MEMORY_CHECK_INTERVAL);
  }

  /**
   * Warm cache with frequently accessed metrics
   */
  async warmCache(keys: Array<{ key: string; computeFn: RefreshFunction<any>; options: CacheOptions }>): Promise<void> {
    const promises = keys.map(({ key, computeFn, options }) =>
      this.get(key, computeFn, options).catch(error => {
        console.error(`Cache warming failed for ${key}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; accessCount: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      accessCount: entry.accessCount,
    }));

    const totalAccesses = entries.reduce((sum, e) => sum + e.accessCount, 0);
    const hitRate = totalAccesses > 0 ? entries.length / totalAccesses : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount),
    };
  }
}

export const analyticsCache = new AnalyticsCache(1000);

export const CACHE_TTL = {
  TEAM_METRICS: 60 * 60 * 1000,
  PLAYER_METRICS: 30 * 60 * 1000,
  MATCH_PREDICTION: 15 * 60 * 1000,
  H2H_STATS: 60 * 60 * 1000,
  LEAGUE_TABLE: 60 * 60 * 1000,
  RSS_SENTIMENT: 10 * 60 * 1000,
} as const;
