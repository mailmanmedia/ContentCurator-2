/**
 * Football Data Service
 * 
 * Centralized service for fetching football data with multi-source fallback.
 * Priority: The Fishy API → FBRef API → localStorage cache
 */

import { z } from 'zod';
import {
  TeamStandingSchema,
  PlayerStatsSchema,
  TeamDataSchema,
  H2HDataSchema,
  FixturesResponseSchema,
  LeagueTableResponseSchema,
  PlayerStatsResponseSchema,
  extractValidationErrors,
} from '@/schemas/footballData.schemas';

// TypeScript types for football data
export interface TableEntry {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[];
}

export interface PlayerStats {
  name: string;
  position: string;
  age?: number;
  matches?: number;
  starts?: number;
  goals?: number;
  assists?: number;
  [key: string]: any;
}

export interface TeamData {
  name: string;
  form?: string[];
  position?: number;
  [key: string]: any;
}

export interface Fixture {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  competition?: string;
  [key: string]: any;
}

export interface H2HData {
  matches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    competition?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface DataResponse<T> {
  data: T | null;
  source: 'thefishy' | 'fbref' | 'cache' | 'none';
  timestamp: string;
  error?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  source: 'thefishy' | 'fbref';
}

/**
 * Cache expiry times in milliseconds
 */
const CACHE_EXPIRY = {
  LEAGUE_TABLE: 60 * 60 * 1000,     // 1 hour
  PLAYER_STATS: 30 * 60 * 1000,      // 30 minutes
  FIXTURES: 5 * 60 * 1000,           // 5 minutes
  TEAM_DATA: 30 * 60 * 1000,         // 30 minutes
  H2H: 60 * 60 * 1000,               // 1 hour
} as const;

/**
 * FootballDataService class
 * 
 * Provides centralized access to football data with automatic fallback
 * between multiple data sources and localStorage caching.
 */
export class FootballDataService {
  private readonly API_BASE = '/api/football';

  /**
   * Fetch data with automatic fallback between primary and secondary sources
   * 
   * @private
   * @param primaryUrl - Primary data source URL (The Fishy API)
   * @param fallbackUrl - Fallback data source URL (FBRef API)
   * @param cacheKey - Key for localStorage caching
   * @param cacheExpiry - Cache expiration time in milliseconds
   * @returns Promise with data and source attribution
   */
  private async fetchWithFallback<T>(
    primaryUrl: string,
    fallbackUrl: string | null,
    cacheKey: string,
    cacheExpiry: number
  ): Promise<DataResponse<T>> {
    // Try primary source (The Fishy)
    try {
      console.log(`[FootballDataService] Fetching from primary source: ${primaryUrl}`);
      const response = await fetch(primaryUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[FootballDataService] ✓ Primary source successful (The Fishy)`);
        
        // Cache the successful response
        this.setCached(cacheKey, data, 'thefishy');
        
        return {
          data: data as T,
          source: 'thefishy',
          timestamp: new Date().toISOString(),
        };
      }
      
      console.warn(`[FootballDataService] Primary source failed with status: ${response.status}`);
    } catch (error) {
      console.warn(`[FootballDataService] Primary source error:`, error);
    }

    // Try fallback source (FBRef)
    if (fallbackUrl) {
      try {
        console.log(`[FootballDataService] Fetching from fallback source: ${fallbackUrl}`);
        const response = await fetch(fallbackUrl);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[FootballDataService] ✓ Fallback source successful (FBRef)`);
          
          // Cache the successful response
          this.setCached(cacheKey, data, 'fbref');
          
          return {
            data: data as T,
            source: 'fbref',
            timestamp: new Date().toISOString(),
          };
        }
        
        console.warn(`[FootballDataService] Fallback source failed with status: ${response.status}`);
      } catch (error) {
        console.warn(`[FootballDataService] Fallback source error:`, error);
      }
    }

    // Try localStorage cache
    const cachedData = this.getCached<T>(cacheKey, cacheExpiry);
    if (cachedData) {
      console.log(`[FootballDataService] ✓ Using cached data (${cachedData.source})`);
      return {
        data: cachedData.data,
        source: 'cache',
        timestamp: new Date(cachedData.timestamp).toISOString(),
      };
    }

    // All sources failed
    console.error(`[FootballDataService] ✗ All sources failed for: ${cacheKey}`);
    return {
      data: null,
      source: 'none',
      timestamp: new Date().toISOString(),
      error: 'All data sources failed and no cache available',
    };
  }

  /**
   * Get cached data from localStorage
   * 
   * @private
   * @param cacheKey - Key for localStorage
   * @param maxAge - Maximum age of cache in milliseconds
   * @returns Cached data or null if expired/not found
   */
  private getCached<T>(cacheKey: string, maxAge: number): CacheEntry<T> | null {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      if (age > maxAge) {
        console.log(`[FootballDataService] Cache expired for: ${cacheKey} (age: ${Math.round(age / 1000)}s)`);
        localStorage.removeItem(cacheKey);
        return null;
      }

      return entry;
    } catch (error) {
      console.warn(`[FootballDataService] Error reading cache for ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set cached data in localStorage
   * 
   * @private
   * @param cacheKey - Key for localStorage
   * @param data - Data to cache
   * @param source - Source of the data
   */
  private setCached<T>(cacheKey: string, data: T, source: 'thefishy' | 'fbref'): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        source,
      };
      localStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`[FootballDataService] Cached data for: ${cacheKey} (source: ${source})`);
    } catch (error) {
      console.warn(`[FootballDataService] Error caching data for ${cacheKey}:`, error);
    }
  }

  /**
   * Validate API response data using Zod schema
   * 
   * @private
   * @param schema - Zod schema to validate against
   * @param data - Data to validate
   * @param source - Source of the data (for logging)
   * @returns Validated and typed data
   * @throws {z.ZodError} If validation fails
   */
  private validateResponse<T>(schema: z.ZodSchema<T>, data: unknown, source: string): T {
    try {
      const validated = schema.parse(data);
      console.log(`[FootballDataService] ✓ Validation successful for ${source} data`);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = extractValidationErrors(error);
        console.error(`[FootballDataService] ✗ Validation failed for ${source} data:`, validationErrors);
        throw new Error(`Data validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get Premier League table standings
   * 
   * Tries The Fishy API first, then FBRef API, then localStorage cache.
   * Cache expiry: 1 hour
   * 
   * @returns Promise with league table data and source attribution
   * 
   * @example
   * const service = new FootballDataService();
   * const result = await service.getLeagueTable();
   * if (result.data) {
   *   console.log(`Table from ${result.source}:`, result.data);
   * }
   */
  async getLeagueTable(): Promise<DataResponse<TableEntry[]>> {
    const result = await this.fetchWithFallback<TableEntry[]>(
      `${this.API_BASE}/premier-league/table`,
      `${this.API_BASE}/fbref/table`,
      'football_league_table',
      CACHE_EXPIRY.LEAGUE_TABLE
    );

    if (result.data) {
      try {
        result.data = this.validateResponse(
          LeagueTableResponseSchema,
          result.data,
          result.source
        ) as TableEntry[];
      } catch (error) {
        console.error('[FootballDataService] League table validation failed:', error);
        result.error = error instanceof Error ? error.message : 'Invalid data format';
        result.data = null;
      }
    }

    return result;
  }

  /**
   * Get Liverpool player statistics
   * 
   * Fetches from FBRef API (primary source for player stats).
   * Cache expiry: 30 minutes
   * 
   * @param teamId - Team identifier (optional, defaults to Liverpool)
   * @returns Promise with player statistics and source attribution
   * 
   * @example
   * const service = new FootballDataService();
   * const result = await service.getPlayerStats();
   * if (result.data) {
   *   console.log(`Player stats from ${result.source}:`, result.data);
   * }
   */
  async getPlayerStats(teamId?: string): Promise<DataResponse<PlayerStats[]>> {
    // For Liverpool, use the dedicated endpoint
    const endpoint = teamId 
      ? `${this.API_BASE}/teams/${teamId}/squad`
      : `${this.API_BASE}/fbref/liverpool/players`;

    const result = await this.fetchWithFallback<PlayerStats[]>(
      endpoint,
      null, // No fallback for player stats currently
      `football_player_stats_${teamId || 'liverpool'}`,
      CACHE_EXPIRY.PLAYER_STATS
    );

    if (result.data) {
      try {
        result.data = this.validateResponse(
          PlayerStatsResponseSchema,
          result.data,
          result.source
        ) as PlayerStats[];
      } catch (error) {
        console.error('[FootballDataService] Player stats validation failed:', error);
        result.error = error instanceof Error ? error.message : 'Invalid data format';
        result.data = null;
      }
    }

    return result;
  }

  /**
   * Get team data with enriched information
   * 
   * Fetches team data including form, position, and other enriched data.
   * Tries The Fishy API for form data first.
   * Cache expiry: 30 minutes
   * 
   * @param teamName - Name of the team (e.g., "Liverpool", "Manchester City")
   * @returns Promise with team data and source attribution
   * 
   * @example
   * const service = new FootballDataService();
   * const result = await service.getTeamData("Liverpool");
   * if (result.data) {
   *   console.log(`Team data from ${result.source}:`, result.data);
   * }
   */
  async getTeamData(teamName: string): Promise<DataResponse<TeamData>> {
    const result = await this.fetchWithFallback<TeamData>(
      `${this.API_BASE}/team/${encodeURIComponent(teamName)}/enriched`,
      `${this.API_BASE}/team/${encodeURIComponent(teamName)}/form`,
      `football_team_data_${teamName.toLowerCase().replace(/\s/g, '_')}`,
      CACHE_EXPIRY.TEAM_DATA
    );

    if (result.data) {
      try {
        result.data = this.validateResponse(
          TeamDataSchema,
          result.data,
          result.source
        );
      } catch (error) {
        console.error('[FootballDataService] Team data validation failed:', error);
        result.error = error instanceof Error ? error.message : 'Invalid data format';
        result.data = null;
      }
    }

    return result;
  }

  /**
   * Get upcoming Liverpool fixtures
   * 
   * Fetches upcoming matches for Liverpool FC.
   * Cache expiry: 5 minutes (frequent updates needed)
   * 
   * @returns Promise with fixtures data and source attribution
   * 
   * @example
   * const service = new FootballDataService();
   * const result = await service.getFixtures();
   * if (result.data) {
   *   console.log(`Fixtures from ${result.source}:`, result.data);
   * }
   */
  async getFixtures(): Promise<DataResponse<{ fixtures: Fixture[] }>> {
    const result = await this.fetchWithFallback<{ fixtures: Fixture[] }>(
      `${this.API_BASE}/liverpool/upcoming`,
      null, // No fallback for fixtures currently
      'football_liverpool_fixtures',
      CACHE_EXPIRY.FIXTURES
    );

    if (result.data) {
      try {
        result.data = this.validateResponse(
          FixturesResponseSchema,
          result.data,
          result.source
        );
      } catch (error) {
        console.error('[FootballDataService] Fixtures validation failed:', error);
        result.error = error instanceof Error ? error.message : 'Invalid data format';
        result.data = null;
      }
    }

    return result;
  }

  /**
   * Get head-to-head match history between two teams
   * 
   * Fetches historical match data between two teams.
   * Cache expiry: 1 hour
   * 
   * @param homeTeamId - Home team identifier
   * @param awayTeamId - Away team identifier
   * @returns Promise with head-to-head data and source attribution
   * 
   * @example
   * const service = new FootballDataService();
   * const result = await service.getH2HData("64", "65");
   * if (result.data) {
   *   console.log(`H2H data from ${result.source}:`, result.data);
   * }
   */
  async getH2HData(homeTeamId: string, awayTeamId: string): Promise<DataResponse<H2HData>> {
    const result = await this.fetchWithFallback<H2HData>(
      `${this.API_BASE}/head-to-head/${homeTeamId}/${awayTeamId}`,
      null, // No fallback for H2H data currently
      `football_h2h_${homeTeamId}_${awayTeamId}`,
      CACHE_EXPIRY.H2H
    );

    if (result.data) {
      try {
        result.data = this.validateResponse(
          H2HDataSchema,
          result.data,
          result.source
        );
      } catch (error) {
        console.error('[FootballDataService] H2H data validation failed:', error);
        result.error = error instanceof Error ? error.message : 'Invalid data format';
        result.data = null;
      }
    }

    return result;
  }

  /**
   * Get Liverpool top scorers
   * 
   * Fetches top scoring players for Liverpool FC.
   * Cache expiry: 30 minutes
   * 
   * @returns Promise with top scorers data and source attribution
   * 
   * @example
   * const service = new FootballDataService();
   * const result = await service.getTopScorers();
   * if (result.data) {
   *   console.log(`Top scorers from ${result.source}:`, result.data);
   * }
   */
  async getTopScorers(): Promise<DataResponse<PlayerStats[]>> {
    const result = await this.fetchWithFallback<PlayerStats[]>(
      `${this.API_BASE}/players/liverpool/top-scorers`,
      null,
      'football_liverpool_top_scorers',
      CACHE_EXPIRY.PLAYER_STATS
    );

    if (result.data) {
      try {
        result.data = this.validateResponse(
          PlayerStatsResponseSchema,
          result.data,
          result.source
        ) as PlayerStats[];
      } catch (error) {
        console.error('[FootballDataService] Top scorers validation failed:', error);
        result.error = error instanceof Error ? error.message : 'Invalid data format';
        result.data = null;
      }
    }

    return result;
  }

  /**
   * Clear all cached football data
   * 
   * Removes all football-related data from localStorage.
   * Useful for forcing fresh data fetch.
   * 
   * @example
   * const service = new FootballDataService();
   * service.clearCache();
   */
  clearCache(): void {
    const keys = Object.keys(localStorage);
    const footballKeys = keys.filter(key => key.startsWith('football_'));
    
    footballKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`[FootballDataService] Cleared ${footballKeys.length} cached items`);
  }

  /**
   * Get cache status for a specific key
   * 
   * Returns information about cached data including age and source.
   * 
   * @param cacheKey - Key to check
   * @returns Cache info or null if not cached
   * 
   * @example
   * const service = new FootballDataService();
   * const status = service.getCacheStatus('football_league_table');
   * if (status) {
   *   console.log(`Cache age: ${status.ageMinutes} minutes`);
   * }
   */
  getCacheStatus(cacheKey: string): { 
    exists: boolean; 
    ageMinutes?: number; 
    source?: string; 
    timestamp?: string;
  } {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return { exists: false };

      const entry: CacheEntry<any> = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      return {
        exists: true,
        ageMinutes: Math.round(age / 60000),
        source: entry.source,
        timestamp: new Date(entry.timestamp).toISOString(),
      };
    } catch (error) {
      return { exists: false };
    }
  }
}

// Export singleton instance
export const footballDataService = new FootballDataService();

// Export default
export default footballDataService;
