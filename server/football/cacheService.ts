import { footballService } from "./footballService";

export interface CacheEntry<T> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
  key: string;
  refreshPromise?: Promise<T>;
  isStale: boolean;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  refreshInterval?: number; // Optional background refresh interval
  staleWhileRevalidate?: boolean; // Enable stale-while-revalidate pattern
  maxRetries?: number;
  retryBackoffMs?: number;
}

export class SmartFootballCache {
  private cache = new Map<string, CacheEntry<any>>();
  private refreshTimers = new Map<string, NodeJS.Timeout>();
  private retryBackoffs = new Map<string, number>();

  // Cache configurations for different data types
  private configs: Record<string, CacheConfig> = {
    // Static data - long TTL
    competitions: {
      ttl: 72 * 60 * 60 * 1000, // 72 hours (corrected per spec)
      refreshInterval: 24 * 60 * 60 * 1000, // Daily refresh
      staleWhileRevalidate: true,
      maxRetries: 3,
      retryBackoffMs: 60000
    },
    teams: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours (corrected per spec)
      refreshInterval: 24 * 60 * 60 * 1000, // Daily refresh
      staleWhileRevalidate: true,
      maxRetries: 3,
      retryBackoffMs: 60000
    },
    venues: {
      ttl: 72 * 60 * 60 * 1000, // 72 hours
      staleWhileRevalidate: true,
      maxRetries: 3,
      retryBackoffMs: 60000
    },
    
    // Dynamic data - variable TTL based on context
    fixtures_all: {
      ttl: 6 * 60 * 60 * 1000, // 6 hours for general fixtures (corrected per spec)
      refreshInterval: 6 * 60 * 60 * 1000, // 6 hour refresh
      staleWhileRevalidate: true,
      maxRetries: 5,
      retryBackoffMs: 30000
    },
    fixtures_upcoming: {
      ttl: 6 * 60 * 60 * 1000, // 6 hours for upcoming fixtures
      refreshInterval: 6 * 60 * 60 * 1000,
      staleWhileRevalidate: true,
      maxRetries: 5,
      retryBackoffMs: 30000
    },
    fixtures_liverpool: {
      ttl: 60 * 60 * 1000, // 1 hour for Liverpool fixtures
      refreshInterval: 60 * 60 * 1000, // Hourly refresh
      staleWhileRevalidate: true,
      maxRetries: 10,
      retryBackoffMs: 15000
    },
    fixtures_matchday: {
      ttl: 5 * 60 * 1000, // 5 minutes for match day fixtures
      refreshInterval: 5 * 60 * 1000,
      staleWhileRevalidate: true,
      maxRetries: 20,
      retryBackoffMs: 5000
    },
    fixtures_live: {
      ttl: 30 * 1000, // 30 seconds for live fixtures
      refreshInterval: 30 * 1000,
      staleWhileRevalidate: true,
      maxRetries: 30,
      retryBackoffMs: 2000
    },
    
    // Statistical data
    head_to_head: {
      ttl: 12 * 60 * 60 * 1000, // 12 hours
      staleWhileRevalidate: true,
      maxRetries: 3,
      retryBackoffMs: 60000
    },
    team_stats: {
      ttl: 12 * 60 * 60 * 1000, // 12 hours
      staleWhileRevalidate: true,
      maxRetries: 3,
      retryBackoffMs: 60000
    }
  };

  constructor() {
    // Schedule nightly cleanup
    this.scheduleCleanup();
    // Start background refresh for static data
    this.startBackgroundRefresh();
  }

  async get<T>(key: string, fetchFn: () => Promise<T>, configKey?: string): Promise<T> {
    const config = this.configs[configKey || 'fixtures_all'] || this.configs.fixtures_all;
    const entry = this.cache.get(key);
    const now = new Date();

    // If we have valid cached data, return it
    if (entry && now < entry.expiresAt && !entry.isStale) {
      return entry.data;
    }

    // Check if entry is expired but not marked stale yet (auto-mark stale for SWR)
    if (entry && now >= entry.expiresAt && !entry.isStale && config.staleWhileRevalidate) {
      // Mark as stale and start refresh in background
      entry.isStale = true;
      this.cache.set(key, entry);
      
      // Start background refresh if not already in progress
      if (!entry.refreshPromise) {
        entry.refreshPromise = this.refreshData(key, fetchFn, config);
      }
      
      return entry.data;
    }

    // If we have stale data and stale-while-revalidate is enabled
    if (entry && entry.isStale && config.staleWhileRevalidate && !entry.refreshPromise) {
      // Return stale data immediately and start refresh
      entry.refreshPromise = this.refreshData(key, fetchFn, config);
      return entry.data;
    }

    // If we're already refreshing, wait for it
    if (entry?.refreshPromise) {
      try {
        return await entry.refreshPromise;
      } catch (error) {
        // If refresh fails, return stale data if available
        if (entry.data) {
          console.warn(`Refresh failed for ${key}, returning stale data:`, error);
          return entry.data;
        }
        throw error;
      }
    }

    // No valid data, fetch fresh
    return await this.refreshData(key, fetchFn, config);
  }

  private async refreshData<T>(key: string, fetchFn: () => Promise<T>, config: CacheConfig): Promise<T> {
    const retryKey = `${key}_retries`;
    const currentRetries = this.retryBackoffs.get(retryKey) || 0;

    try {
      const data = await fetchFn();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + config.ttl);

      const entry: CacheEntry<T> = {
        data,
        cachedAt: now,
        expiresAt,
        key,
        isStale: false,
        refreshPromise: undefined // Clear refresh promise after successful fetch
      };

      this.cache.set(key, entry);
      this.retryBackoffs.delete(retryKey); // Reset retry count on success
      
      // Schedule background refresh if configured
      if (config.refreshInterval) {
        this.scheduleRefresh(key, fetchFn, config);
      }

      return data;
    } catch (error) {
      if (currentRetries < (config.maxRetries || 3)) {
        const backoffMs = (config.retryBackoffMs || 60000) * Math.pow(2, currentRetries);
        this.retryBackoffs.set(retryKey, currentRetries + 1);
        
        console.log(`Retrying ${key} in ${backoffMs}ms (attempt ${currentRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.refreshData(key, fetchFn, config);
      }
      
      this.retryBackoffs.delete(retryKey);
      throw error;
    }
  }

  private scheduleRefresh<T>(key: string, fetchFn: () => Promise<T>, config: CacheConfig) {
    // Clear existing timer
    const existingTimer = this.refreshTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    if (!config.refreshInterval) return;

    const timer = setTimeout(async () => {
      try {
        await this.refreshData(key, fetchFn, config);
      } catch (error) {
        console.error(`Background refresh failed for ${key}:`, error);
      }
    }, config.refreshInterval);

    this.refreshTimers.set(key, timer);
  }

  // Liverpool-specific caching with dynamic intervals
  async getLiverpoolFixtures(fetchFn: () => Promise<any[]>): Promise<any[]> {
    const key = 'liverpool_fixtures';
    const fixtures = await this.get(key, fetchFn, 'fixtures_liverpool');
    
    // Check if any Liverpool match is happening soon
    const now = new Date();
    const upcomingMatch = fixtures.find(fixture => {
      const matchTime = new Date(fixture.date);
      const timeDiff = matchTime.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff < 2 * 60 * 60 * 1000; // Within 2 hours
    });

    // If match is soon, upgrade to match day caching
    if (upcomingMatch) {
      return this.get(`${key}_matchday`, fetchFn, 'fixtures_matchday');
    }

    return fixtures;
  }

  // Live match data with highest refresh rate
  async getLiveMatchData(matchId: number, fetchFn: () => Promise<any>): Promise<any> {
    const key = `live_match_${matchId}`;
    return this.get(key, fetchFn, 'fixtures_live');
  }

  // Head-to-head with pre-computation for likely opponents
  async getHeadToHead(homeTeamId: number, awayTeamId: number, fetchFn: () => Promise<any[]>): Promise<any[]> {
    const key = `h2h_${homeTeamId}_${awayTeamId}`;
    return this.get(key, fetchFn, 'head_to_head');
  }

  // Precompute common Liverpool matchups
  async precomputeLiverpoolMatchups() {
    const liverpoolId = 40; // Liverpool's team ID
    const commonOpponents = [50, 42, 49, 33, 47]; // Man City, Arsenal, Chelsea, Man United, Tottenham
    
    console.log('Starting Liverpool matchup precomputation...');
    let successful = 0;
    
    for (const opponentId of commonOpponents) {
      const key = `h2h_${liverpoolId}_${opponentId}`;
      
      // Only precompute if not already cached
      if (!this.cache.has(key)) {
        try {
          await this.getHeadToHead(liverpoolId, opponentId, () => 
            footballService.fetchHeadToHeadRaw(liverpoolId, opponentId)
          );
          successful++;
          console.log(`Precomputed Liverpool vs team ${opponentId}`);
          
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.warn(`Skipped precompute for Liverpool vs ${opponentId}: ${error.message}`);
          // Continue with next opponent instead of failing entire precompute
        }
      } else {
        successful++;
      }
    }
    
    console.log(`Liverpool precomputation completed: ${successful}/${commonOpponents.length} successful`);
  }

  // Cache invalidation
  invalidate(pattern: string) {
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        
        // Clear associated timer
        const timer = this.refreshTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.refreshTimers.delete(key);
        }
      }
    }
  }

  // Mark entries as stale (for stale-while-revalidate)
  markStale(pattern: string) {
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (key.includes(pattern)) {
        entry.isStale = true;
        this.cache.set(key, entry);
      }
    }
  }

  // Cleanup expired entries
  private scheduleCleanup() {
    setInterval(() => {
      const now = new Date();
      const expiredKeys: string[] = [];

      for (const [key, entry] of Array.from(this.cache.entries())) {
        // Clean up expired entries regardless of stale status to prevent memory leaks
        if (now > entry.expiresAt) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        this.cache.delete(key);
        
        const timer = this.refreshTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.refreshTimers.delete(key);
        }
      }

      if (expiredKeys.length > 0) {
        console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  // Start background refresh for static data
  private startBackgroundRefresh() {
    // Nightly refresh for competitions and teams
    setInterval(async () => {
      try {
        console.log('Starting nightly data refresh...');
        
        // Refresh competitions
        await this.get('competitions', () => footballService.syncCompetitions(), 'competitions');
        
        // Refresh Liverpool matchups
        await this.precomputeLiverpoolMatchups();
        
        console.log('Nightly data refresh completed');
      } catch (error) {
        console.error('Nightly refresh failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Start immediate precomputation (graceful, non-blocking)
    setTimeout(() => {
      this.precomputeLiverpoolMatchups().catch(error => {
        console.warn('Initial precompute failed - will retry during nightly refresh:', error.message);
      });
    }, 30000); // Wait 30 seconds after startup to avoid rate limits
  }

  // Get cache statistics
  getStats() {
    const now = new Date();
    let validEntries = 0;
    let staleEntries = 0;
    let expiredEntries = 0;

    for (const entry of Array.from(this.cache.values())) {
      if (now < entry.expiresAt) {
        validEntries++;
      } else if (entry.isStale) {
        staleEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      staleEntries,
      expiredEntries,
      activeRefreshTimers: this.refreshTimers.size
    };
  }
}

export const smartFootballCache = new SmartFootballCache();