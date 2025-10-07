import axios, { AxiosError } from 'axios';

interface SportmonksConfig {
  baseUrl: string;
  apiToken: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface SportmonksPlayer {
  id: number;
  common_name: string;
  display_name: string;
  firstname?: string;
  lastname?: string;
  position_id: number;
  nationality_id?: number;
  statistics?: Array<{
    id: number;
    player_id: number;
    team_id: number;
    season_id: number;
    has_values: boolean;
    details?: Array<{
      type_id: number;
      value: {
        total?: number;
        average?: string;
      };
      type?: {
        id: number;
        name: string;
        code: string;
        developer_name: string;
        model_type: string;
      };
    }>;
  }>;
}

interface SportmonksTeam {
  id: number;
  name: string;
  short_code?: string;
  image_path?: string;
  founded?: number;
  squad?: {
    data: Array<{
      player: {
        data: SportmonksPlayer;
      };
    }>;
  };
}

interface SportmonksFixture {
  id: number;
  sport_id: number;
  league_id: number;
  season_id: number;
  stage_id: number;
  state_id: number;
  starting_at: string;
  result_info: string | null;
  venue_id: number | null;
  name: string;
  participants?: {
    data: Array<{
      id: number;
      name: string;
      image_path?: string;
      meta: {
        location: 'home' | 'away';
      };
    }>;
  };
  scores?: {
    data: Array<{
      score: {
        goals: number;
      };
      description: string;
      participant_id: number;
    }>;
  };
}

interface SportmonksResponse<T> {
  data: T;
  pagination?: {
    count: number;
    per_page: number;
    current_page: number;
    has_more: boolean;
  };
  subscription?: Array<{
    meta: {
      trial_ends_at: string | null;
      ends_at: string | null;
    };
    plans: Array<{
      plan: string;
    }>;
  }>;
  rate_limit?: {
    resets_in_seconds: number;
    remaining: number;
    requested_entity: string;
  };
}

export class SportmonksService {
  private config: SportmonksConfig;
  private liverpoolTeamId = 14; // Primary Liverpool FC team ID

  constructor() {
    this.config = {
      baseUrl: 'https://api.sportmonks.com/v3/football',
      apiToken: process.env.SPORTMONKS_API_KEY || '',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  isConfigured(): boolean {
    return !!this.config.apiToken;
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<SportmonksResponse<T>> {
    if (!this.config.apiToken) {
      throw new Error('Sportmonks API key not configured. Please set SPORTMONKS_API_KEY environment variable.');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const queryParams = {
      api_token: this.config.apiToken,
      ...params
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await axios.get<SportmonksResponse<T>>(url, {
          params: queryParams,
          timeout: this.config.timeout,
          headers: {
            'Accept': 'application/json'
          }
        });

        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          
          // Don't retry on authentication errors
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            throw new Error(`Sportmonks API authentication failed: ${axiosError.response?.status} ${axiosError.response?.statusText}`);
          }

          // Don't retry on rate limit exceeded (wait for reset instead)
          if (axiosError.response?.status === 429) {
            throw new Error('Sportmonks API rate limit exceeded. Please try again later.');
          }

          // Retry on server errors or network issues
          if (axiosError.response?.status && axiosError.response.status >= 500) {
            console.warn(`Sportmonks API server error (attempt ${attempt + 1}/${this.config.retryAttempts}):`, axiosError.message);
            await this.delay(this.config.retryDelay * (attempt + 1));
            continue;
          }
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    throw lastError || new Error('Failed to fetch from Sportmonks API');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get Liverpool team squad with player statistics
  async getLiverpoolSquad(seasonId?: number): Promise<SportmonksPlayer[]> {
    const params: Record<string, string | number> = {
      include: 'squad.player.statistics.details.type'
    };

    if (seasonId) {
      params.filters = `playerStatisticSeasons:${seasonId}`;
    }

    const response = await this.makeRequest<SportmonksTeam>(
      `/teams/${this.liverpoolTeamId}`,
      params
    );

    if (!response.data.squad?.data) {
      return [];
    }

    return response.data.squad.data.map(item => item.player.data);
  }

  // Get specific player statistics
  async getPlayerStatistics(playerId: number, seasonId?: number): Promise<SportmonksPlayer> {
    const params: Record<string, string | number> = {
      include: 'statistics.details.type'
    };

    if (seasonId) {
      params.filters = `playerStatisticSeasons:${seasonId}`;
    }

    const response = await this.makeRequest<SportmonksPlayer>(
      `/players/${playerId}`,
      params
    );

    return response.data;
  }

  // Get Liverpool fixtures
  async getLiverpoolFixtures(params: {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    seasonId?: number;
  } = {}): Promise<SportmonksFixture[]> {
    const queryParams: Record<string, string | number> = {
      include: 'participants,scores'
    };

    if (params.from) {
      queryParams['filter[startingAtFrom]'] = params.from;
    }

    if (params.to) {
      queryParams['filter[startingAtTo]'] = params.to;
    }

    if (params.seasonId) {
      queryParams['filter[seasonId]'] = params.seasonId;
    }

    const response = await this.makeRequest<SportmonksFixture[]>(
      `/teams/${this.liverpoolTeamId}/fixtures`,
      queryParams
    );

    return Array.isArray(response.data) ? response.data : [];
  }

  // Get team statistics
  async getTeamStatistics(teamId: number, seasonId: number) {
    const params = {
      include: 'statistics',
      'filter[seasonId]': seasonId
    };

    const response = await this.makeRequest<any>(
      `/teams/${teamId}`,
      params
    );

    return response.data;
  }

  // Get head-to-head data
  async getHeadToHead(team1Id: number, team2Id: number) {
    const response = await this.makeRequest<SportmonksFixture[]>(
      `/fixtures/head-to-head/${team1Id}/${team2Id}`,
      {
        include: 'participants,scores'
      }
    );

    return Array.isArray(response.data) ? response.data : [];
  }

  // Search for teams by name
  async searchTeams(query: string): Promise<any[]> {
    const response = await this.makeRequest<any[]>(
      `/teams/search/${encodeURIComponent(query)}`,
      {}
    );

    return Array.isArray(response.data) ? response.data : [];
  }

  // Get current season ID for Premier League
  async getCurrentSeasonId(): Promise<number | null> {
    try {
      const response = await this.makeRequest<any>(
        '/seasons',
        {
          include: 'league',
          'filters': 'seasonLeagues:8'
        }
      );

      const seasons = Array.isArray(response.data) ? response.data : [];
      
      // Find the current/active season
      const currentSeason = seasons.find((s: any) => s.is_current === true);
      if (currentSeason) {
        return currentSeason.id;
      }

      // If no current season found, return the most recent one
      if (seasons.length > 0) {
        return seasons[0].id;
      }

      return null;
    } catch (error) {
      console.error('Failed to get current season ID:', error);
      return null;
    }
  }

  // Helper to extract specific stat from player statistics
  extractPlayerStat(player: SportmonksPlayer, statCode: string): number {
    if (!player.statistics || player.statistics.length === 0) {
      return 0;
    }

    for (const seasonStat of player.statistics) {
      if (!seasonStat.details) continue;

      for (const detail of seasonStat.details) {
        if (detail.type?.developer_name === statCode || detail.type?.code === statCode) {
          return detail.value?.total || 0;
        }
      }
    }

    return 0;
  }

  // Map Sportmonks player to our database format
  mapPlayerToDatabase(player: SportmonksPlayer, season: number) {
    return {
      playerId: player.id,
      season,
      appearances: this.extractPlayerStat(player, 'APPEARANCES'),
      goals: this.extractPlayerStat(player, 'GOALS'),
      assists: this.extractPlayerStat(player, 'ASSISTS'),
      yellowCards: this.extractPlayerStat(player, 'YELLOWCARDS'),
      redCards: this.extractPlayerStat(player, 'REDCARDS'),
      minutes: this.extractPlayerStat(player, 'MINUTES'),
      rating: null as string | null,
      lastUpdated: new Date()
    };
  }

  // Map Sportmonks position IDs to readable positions
  private mapPositionId(positionId: number): string {
    const positionMap: Record<number, string> = {
      24: 'Goalkeeper',
      25: 'Defender',
      26: 'Midfielder',
      27: 'Attacker',
      // More specific positions
      1: 'Goalkeeper',
      2: 'Right-Back',
      3: 'Left-Back',
      4: 'Centre-Back',
      5: 'Defensive Midfield',
      6: 'Central Midfield',
      7: 'Right Midfield',
      8: 'Left Midfield',
      9: 'Attacking Midfield',
      10: 'Right Winger',
      11: 'Left Winger',
      12: 'Centre-Forward'
    };

    return positionMap[positionId] || 'Unknown';
  }
}

export const sportmonksService = new SportmonksService();
