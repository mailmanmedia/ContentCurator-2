import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface RateLimitState {
  requestsThisMinute: number;
  minuteResetTime: number;
  dailyRequests: number;
  dailyLimit: number;
  lastRequestTime: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface APIResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging?: {
    current: number;
    total: number;
  };
  response: T;
}

interface RequestQueueItem {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  request: () => Promise<any>;
}

interface APIStatus {
  account: {
    firstname: string;
    lastname: string;
    email: string;
  };
  subscription: {
    plan: string;
    end: string;
    active: boolean;
  };
  requests: {
    current: number;
    limit_day: number;
  };
}

// Type definitions for API responses
export interface League {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: {
    year: number;
    start: string;
    end: string;
    current: boolean;
  }[];
}

export interface Team {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

export interface Player {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
      date: string;
      place: string;
      country: string;
    };
    nationality: string;
    height: string;
    weight: string;
    injured: boolean;
    photo: string;
  };
  statistics: any[];
}

export interface Fixture {
  fixture: {
    id: number;
    referee: string;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number;
      second: number;
    };
    venue: {
      id: number;
      name: string;
      city: string;
    };
    status: {
      long: string;
      short: string;
      elapsed: number;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: { home: number; away: number };
    fulltime: { home: number; away: number };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface Standing {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

export interface TeamStatistics {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: Record<string, { total: number | null; percentage: string | null }>;
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: Record<string, { total: number | null; percentage: string | null }>;
    };
  };
  biggest: {
    streak: {
      wins: number;
      draws: number;
      loses: number;
    };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
    goals: {
      for: { home: number; away: number };
      against: { home: number; away: number };
    };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
  penalty: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
    total: number;
  };
  lineups: Array<{ formation: string; played: number }>;
  cards: {
    yellow: Record<string, { total: number | null; percentage: string | null }>;
    red: Record<string, { total: number | null; percentage: string | null }>;
  };
}

class APIFootballService {
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly apiKey: string;
  private axiosInstance: AxiosInstance;
  private rateLimitState: RateLimitState;
  private requestQueue: RequestQueueItem[] = [];
  private isProcessingQueue = false;
  private cache = new Map<string, CacheEntry<any>>();
  private requestLog: Array<{
    timestamp: Date;
    endpoint: string;
    params: Record<string, any>;
    responseTime: number;
    status: number;
    error?: string;
  }> = [];

  // Cache TTL configurations (in milliseconds)
  private readonly cacheTTL = {
    leagues: 24 * 60 * 60 * 1000,     // 24 hours
    teams: 24 * 60 * 60 * 1000,       // 24 hours
    players: 6 * 60 * 60 * 1000,      // 6 hours
    fixtures: 5 * 60 * 1000,          // 5 minutes
    standings: 60 * 60 * 1000,        // 1 hour
    statistics: 60 * 60 * 1000,       // 1 hour
    events: 60 * 1000,                // 1 minute for live events
    lineups: 24 * 60 * 60 * 1000,     // 24 hours after match
    status: 60 * 1000                 // 1 minute for API status
  };

  constructor() {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      throw new Error('API_FOOTBALL_KEY environment variable is not set');
    }
    this.apiKey = apiKey;

    // Initialize rate limiting state
    this.rateLimitState = {
      requestsThisMinute: 0,
      minuteResetTime: Date.now() + 60000,
      dailyRequests: 0,
      dailyLimit: 100, // Default, will be updated from API
      lastRequestTime: 0
    };

    // Initialize axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'x-apisports-key': this.apiKey
      }
    });

    // Start the queue processor
    this.startQueueProcessor();

    // Reset minute counter every minute
    setInterval(() => {
      if (Date.now() >= this.rateLimitState.minuteResetTime) {
        this.rateLimitState.requestsThisMinute = 0;
        this.rateLimitState.minuteResetTime = Date.now() + 60000;
      }
    }, 1000);

    // Reset daily counter at midnight
    const resetDaily = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        this.rateLimitState.dailyRequests = 0;
        resetDaily();
      }, msUntilMidnight);
    };
    resetDaily();

    // Clean up old cache entries every hour
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000);

    // Initialize by checking API status
    this.checkApiStatus().catch(error => {
      console.error('Failed to initialize API status:', error);
    });
  }

  private startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.requestQueue.length > 0) {
        await this.processQueue();
      }
    }, 100);
  }

  private async processQueue() {
    if (this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      // Check rate limits
      if (this.rateLimitState.requestsThisMinute >= 10) {
        // Wait until minute resets
        const waitTime = this.rateLimitState.minuteResetTime - Date.now();
        if (waitTime > 0) {
          console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      const item = this.requestQueue.shift();
      if (!item) continue;

      try {
        const result = await item.request();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Add delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 6000)); // 6 seconds between requests (10 per minute max)
    }

    this.isProcessingQueue = false;
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: { 
      useCache?: boolean;
      cacheTTL?: number;
      retries?: number;
      backoffMs?: number;
    } = {}
  ): Promise<T> {
    const { 
      useCache = true, 
      cacheTTL = this.cacheTTL.fixtures,
      retries = 3,
      backoffMs = 1000
    } = options;

    // Generate cache key
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached !== null) {
        console.log(`Cache hit for ${endpoint}`);
        return cached;
      }
    }

    // Create the actual request function
    const doRequest = async (): Promise<T> => {
      // Wait for rate limit if needed
      if (this.rateLimitState.requestsThisMinute >= 10) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({
            resolve,
            reject,
            request: () => doRequest()
          });
        });
      }

      // Track request timing
      const startTime = Date.now();
      let attempt = 0;
      let lastError: any;

      while (attempt < retries) {
        try {
          // Update rate limit state
          this.rateLimitState.requestsThisMinute++;
          this.rateLimitState.dailyRequests++;
          this.rateLimitState.lastRequestTime = Date.now();

          // Make the request
          const response: AxiosResponse<APIResponse<T>> = await this.axiosInstance.get(endpoint, {
            params
          });

          // Log the request
          const responseTime = Date.now() - startTime;
          this.requestLog.push({
            timestamp: new Date(),
            endpoint,
            params,
            responseTime,
            status: response.status
          });

          // Keep only last 1000 log entries
          if (this.requestLog.length > 1000) {
            this.requestLog = this.requestLog.slice(-1000);
          }

          // Check for API errors
          if (response.data.errors && response.data.errors.length > 0) {
            const errorMessages = Object.values(response.data.errors).join(', ');
            throw new Error(`API returned errors: ${errorMessages}`);
          }

          // Validate response structure
          if (!response.data || response.data.response === undefined) {
            throw new Error(`Invalid API response structure for ${endpoint}`);
          }

          // Cache the successful response
          if (useCache) {
            this.setCache(cacheKey, response.data.response, cacheTTL);
          }

          return response.data.response;
        } catch (error: any) {
          lastError = error;
          attempt++;

          // Handle rate limit errors
          if (error.response?.status === 429) {
            console.warn(`Rate limit hit for ${endpoint}. Attempt ${attempt}/${retries}`);
            
            // Exponential backoff
            const waitTime = backoffMs * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          // Handle quota exceeded
          if (error.response?.status === 403) {
            console.error(`Quota exceeded for ${endpoint}`);
            throw new Error('API quota exceeded. Please check your subscription.');
          }

          // Log error
          this.requestLog.push({
            timestamp: new Date(),
            endpoint,
            params,
            responseTime: Date.now() - startTime,
            status: error.response?.status || 0,
            error: error.message
          });

          // Retry with exponential backoff for other errors
          if (attempt < retries) {
            const waitTime = backoffMs * Math.pow(2, attempt - 1);
            console.log(`Retrying ${endpoint} in ${waitTime}ms. Attempt ${attempt}/${retries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      throw lastError || new Error(`Failed to fetch ${endpoint} after ${retries} attempts`);
    };

    return doRequest();
  }

  private async fetchAllPages<T>(
    endpoint: string,
    baseParams: Record<string, any>,
    maxPages: number = 10
  ): Promise<T[]> {
    const allResults: T[] = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages && currentPage <= maxPages) {
      const response = await this.makeRequest<any>(endpoint, {
        ...baseParams,
        page: currentPage
      });

      // Check if response is an array (paginated) or object with paging info
      if (Array.isArray(response)) {
        allResults.push(...response);
        
        // Check for paging info in the raw response
        const rawResponse = await this.axiosInstance.get(endpoint, {
          params: { ...baseParams, page: currentPage }
        });
        
        if (rawResponse.data.paging) {
          totalPages = rawResponse.data.paging.total;
        } else {
          break; // No paging info, assume single page
        }
      } else {
        allResults.push(response);
        break;
      }

      currentPage++;
      
      // Add delay between page requests
      if (currentPage <= totalPages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return allResults;
  }

  // Cache management methods
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  // Public API methods

  async fetchLeagues(countryCode?: string, season?: number): Promise<League[]> {
    const params: Record<string, any> = {};
    if (countryCode) params.code = countryCode;
    if (season) params.season = season;

    return this.makeRequest<League[]>('/leagues', params, {
      cacheTTL: this.cacheTTL.leagues
    });
  }

  async fetchTeams(league: number, season: number): Promise<Team[]> {
    return this.makeRequest<Team[]>('/teams', {
      league,
      season
    }, {
      cacheTTL: this.cacheTTL.teams
    });
  }

  async fetchPlayers(team: number, season: number, page: number = 1): Promise<Player[]> {
    return this.makeRequest<Player[]>('/players', {
      team,
      season,
      page
    }, {
      cacheTTL: this.cacheTTL.players
    });
  }

  async fetchAllPlayersForTeam(team: number, season: number): Promise<Player[]> {
    return this.fetchAllPages<Player>('/players', { team, season });
  }

  async fetchFixtures(
    league: number,
    season: number,
    from?: string,
    to?: string
  ): Promise<Fixture[]> {
    const params: Record<string, any> = { league, season };
    if (from) params.from = from;
    if (to) params.to = to;

    return this.makeRequest<Fixture[]>('/fixtures', params, {
      cacheTTL: this.cacheTTL.fixtures
    });
  }

  async fetchStandings(league: number, season: number): Promise<{
    league: any;
    standings: Standing[][];
  }[]> {
    return this.makeRequest<any>('/standings', {
      league,
      season
    }, {
      cacheTTL: this.cacheTTL.standings
    });
  }

  async fetchTeamStatistics(
    team: number,
    league: number,
    season: number
  ): Promise<TeamStatistics> {
    return this.makeRequest<TeamStatistics>('/teams/statistics', {
      team,
      league,
      season
    }, {
      cacheTTL: this.cacheTTL.statistics
    });
  }

  async fetchPlayerStatistics(
    league: number,
    season: number,
    team: number,
    page: number = 1
  ): Promise<Player[]> {
    return this.makeRequest<Player[]>('/players', {
      league,
      season,
      team,
      page
    }, {
      cacheTTL: this.cacheTTL.players
    });
  }

  async fetchAllPlayerStatistics(
    league: number,
    season: number,
    team: number
  ): Promise<Player[]> {
    return this.fetchAllPages<Player>('/players', {
      league,
      season,
      team
    });
  }

  async fetchFixtureStatistics(fixture: number): Promise<{
    team: any;
    statistics: Array<{ type: string; value: any }>;
  }[]> {
    return this.makeRequest<any>('/fixtures/statistics', {
      fixture
    }, {
      cacheTTL: this.cacheTTL.statistics
    });
  }

  async fetchFixtureLineups(fixture: number): Promise<{
    team: any;
    formation: string;
    startXI: Array<{ player: any }>;
    substitutes: Array<{ player: any }>;
    coach: any;
  }[]> {
    return this.makeRequest<any>('/fixtures/lineups', {
      fixture
    }, {
      cacheTTL: this.cacheTTL.lineups
    });
  }

  async fetchFixtureEvents(fixture: number): Promise<{
    time: { elapsed: number; extra: number | null };
    team: any;
    player: any;
    assist: any;
    type: string;
    detail: string;
    comments: string | null;
  }[]> {
    return this.makeRequest<any>('/fixtures/events', {
      fixture
    }, {
      cacheTTL: this.cacheTTL.events
    });
  }

  // Status and monitoring methods

  async checkApiStatus(): Promise<APIStatus> {
    try {
      const response = await this.makeRequest<APIStatus>('/status', {}, {
        useCache: false
      });

      // Update daily limit from API response
      if (response && response.requests) {
        this.rateLimitState.dailyLimit = response.requests.limit_day;
        this.rateLimitState.dailyRequests = response.requests.current;
      }

      return response;
    } catch (error) {
      console.error('Failed to check API status:', error);
      throw error;
    }
  }

  getRateLimitStatus(): RateLimitState {
    return { ...this.rateLimitState };
  }

  getRequestLog(limit: number = 100): typeof this.requestLog {
    return this.requestLog.slice(-limit);
  }

  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  clearCache(pattern?: string): number {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      return size;
    }

    let cleared = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  // Utility method to get remaining requests
  getRemainingRequests(): {
    perMinute: number;
    daily: number;
  } {
    return {
      perMinute: Math.max(0, 10 - this.rateLimitState.requestsThisMinute),
      daily: Math.max(0, this.rateLimitState.dailyLimit - this.rateLimitState.dailyRequests)
    };
  }

  // Method to wait for rate limit reset if needed
  async waitForRateLimit(): Promise<void> {
    if (this.rateLimitState.requestsThisMinute >= 10) {
      const waitTime = this.rateLimitState.minuteResetTime - Date.now();
      if (waitTime > 0) {
        console.log(`Waiting ${waitTime}ms for rate limit reset...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

// Export singleton instance
export const apiFootballService = new APIFootballService();

// Also export the class for testing purposes
export { APIFootballService };