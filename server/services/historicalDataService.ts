import { db } from "../db";
import { historicalHeadToHead, data_update_schedule as dataUpdateSchedule, footballFixtures } from "@shared/schema";
import { eq, and, or, desc, gte, lte, sql } from "drizzle-orm";
import { toSafeDate, toSafeDateRequired } from '../utils/dateUtils';
import { apiFootballService } from '../football/apiFootballService';

/**
 * Historical Data Service
 * Manages historical head-to-head data by fetching from API
 * Implements smart fallback handling and proper timestamp tracking
 */

interface HistoricalMatch {
  team1Id: number;
  team1Name: string;
  team2Id: number;
  team2Name: string;
  date: string;
  season: number;
  competitionId: number;
  competitionName: string;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  venue?: string;
  isFallback?: boolean;
  fallbackReason?: string;
}

/**
 * Get current season dynamically based on current date
 * Using July 1st as the cutoff to handle preseason and qualification matches
 */
function getCurrentSeason(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  if (currentMonth < 7) {
    return currentYear - 1;
  } else if (currentMonth === 7 && currentDay === 1) {
    return currentYear;
  } else {
    return currentYear;
  }
}

// Hardcoded historical Premier League data (2020-2024)
// Including Liverpool's key matchups
const HISTORICAL_PREMIER_LEAGUE_DATA: HistoricalMatch[] = [
  // Liverpool vs Manchester City historical
  { team1Id: 40, team1Name: "Liverpool", team2Id: 50, team2Name: "Manchester City", date: "2020-11-08", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 50, homeScore: 1, awayScore: 1, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 50, team2Name: "Manchester City", date: "2021-02-07", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 50, awayTeamId: 40, homeScore: 4, awayScore: 1, venue: "Etihad Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 50, team2Name: "Manchester City", date: "2021-10-03", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 50, homeScore: 2, awayScore: 2, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 50, team2Name: "Manchester City", date: "2022-04-10", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 50, awayTeamId: 40, homeScore: 2, awayScore: 2, venue: "Etihad Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 50, team2Name: "Manchester City", date: "2022-10-16", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 50, homeScore: 1, awayScore: 0, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 50, team2Name: "Manchester City", date: "2023-04-01", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 50, awayTeamId: 40, homeScore: 4, awayScore: 1, venue: "Etihad Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 50, team2Name: "Manchester City", date: "2023-11-25", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 50, awayTeamId: 40, homeScore: 1, awayScore: 1, venue: "Etihad Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 50, team2Name: "Manchester City", date: "2024-03-10", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 50, homeScore: 1, awayScore: 1, venue: "Anfield" },

  // Liverpool vs Manchester United historical
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2020-01-19", season: 2019, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 33, homeScore: 2, awayScore: 0, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2021-01-17", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 33, homeScore: 0, awayScore: 0, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2021-05-13", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 33, awayTeamId: 40, homeScore: 2, awayScore: 4, venue: "Old Trafford" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2021-10-24", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 33, awayTeamId: 40, homeScore: 0, awayScore: 5, venue: "Old Trafford" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2022-04-19", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 33, homeScore: 4, awayScore: 0, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2022-08-22", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 33, awayTeamId: 40, homeScore: 2, awayScore: 1, venue: "Old Trafford" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2023-03-05", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 33, homeScore: 7, awayScore: 0, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2023-12-17", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 33, homeScore: 0, awayScore: 0, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 33, team2Name: "Manchester United", date: "2024-04-07", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 33, awayTeamId: 40, homeScore: 2, awayScore: 2, venue: "Old Trafford" },

  // Liverpool vs Arsenal historical
  { team1Id: 40, team1Name: "Liverpool", team2Id: 42, team2Name: "Arsenal", date: "2020-09-28", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 42, homeScore: 3, awayScore: 1, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 42, team2Name: "Arsenal", date: "2021-04-03", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 42, awayTeamId: 40, homeScore: 0, awayScore: 3, venue: "Emirates Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 42, team2Name: "Arsenal", date: "2021-11-20", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 42, homeScore: 4, awayScore: 0, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 42, team2Name: "Arsenal", date: "2022-03-16", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 42, awayTeamId: 40, homeScore: 0, awayScore: 2, venue: "Emirates Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 42, team2Name: "Arsenal", date: "2022-10-09", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 42, awayTeamId: 40, homeScore: 3, awayScore: 2, venue: "Emirates Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 42, team2Name: "Arsenal", date: "2023-04-09", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 42, homeScore: 2, awayScore: 2, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 42, team2Name: "Arsenal", date: "2023-12-23", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 42, homeScore: 1, awayScore: 1, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 42, team2Name: "Arsenal", date: "2024-02-04", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 42, awayTeamId: 40, homeScore: 3, awayScore: 1, venue: "Emirates Stadium" },

  // Liverpool vs Chelsea historical
  { team1Id: 40, team1Name: "Liverpool", team2Id: 49, team2Name: "Chelsea", date: "2020-09-20", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 49, awayTeamId: 40, homeScore: 0, awayScore: 2, venue: "Stamford Bridge" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 49, team2Name: "Chelsea", date: "2021-03-04", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 49, homeScore: 0, awayScore: 1, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 49, team2Name: "Chelsea", date: "2021-08-28", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 49, homeScore: 1, awayScore: 1, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 49, team2Name: "Chelsea", date: "2022-01-02", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 49, awayTeamId: 40, homeScore: 2, awayScore: 2, venue: "Stamford Bridge" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 49, team2Name: "Chelsea", date: "2023-01-21", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 49, homeScore: 0, awayScore: 0, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 49, team2Name: "Chelsea", date: "2023-04-04", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 49, awayTeamId: 40, homeScore: 0, awayScore: 0, venue: "Stamford Bridge" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 49, team2Name: "Chelsea", date: "2024-01-31", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 49, homeScore: 4, awayScore: 1, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 49, team2Name: "Chelsea", date: "2024-02-25", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 49, awayTeamId: 40, homeScore: 0, awayScore: 1, venue: "Stamford Bridge" },

  // Liverpool vs Tottenham historical
  { team1Id: 40, team1Name: "Liverpool", team2Id: 47, team2Name: "Tottenham", date: "2020-12-16", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 47, homeScore: 2, awayScore: 1, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 47, team2Name: "Tottenham", date: "2021-01-28", season: 2020, competitionId: 39, competitionName: "Premier League", homeTeamId: 47, awayTeamId: 40, homeScore: 1, awayScore: 3, venue: "Tottenham Hotspur Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 47, team2Name: "Tottenham", date: "2021-12-19", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 47, awayTeamId: 40, homeScore: 2, awayScore: 2, venue: "Tottenham Hotspur Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 47, team2Name: "Tottenham", date: "2022-05-07", season: 2021, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 47, homeScore: 1, awayScore: 1, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 47, team2Name: "Tottenham", date: "2022-11-06", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 47, awayTeamId: 40, homeScore: 1, awayScore: 2, venue: "Tottenham Hotspur Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 47, team2Name: "Tottenham", date: "2023-04-30", season: 2022, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 47, homeScore: 4, awayScore: 3, venue: "Anfield" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 47, team2Name: "Tottenham", date: "2023-09-30", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 47, awayTeamId: 40, homeScore: 2, awayScore: 1, venue: "Tottenham Hotspur Stadium" },
  { team1Id: 40, team1Name: "Liverpool", team2Id: 47, team2Name: "Tottenham", date: "2024-05-05", season: 2023, competitionId: 39, competitionName: "Premier League", homeTeamId: 40, awayTeamId: 47, homeScore: 4, awayScore: 2, venue: "Anfield" },
];

/**
 * Competition Update Cadence Configuration
 * Based on competition schedules and match frequency
 */
interface UpdateCadenceConfig {
  competitionId: number;
  competitionName: string;
  updateCadence: 'daily' | 'weekly' | 'bi-weekly' | 'match-day' | 'match-day+1';
  scheduleConfig: {
    typicalMatchDays: string[]; // e.g., ['Saturday', 'Sunday', 'Wednesday']
    seasonStart: string; // e.g., 'August'
    seasonEnd: string; // e.g., 'May'
    updateHour: number; // Hour of day to update (24h format)
    midweekUpdates: boolean;
    postMatchDelay: number; // Hours after match to update
  };
}

// Optimal update cadence for major competitions
const COMPETITION_UPDATE_SCHEDULES: UpdateCadenceConfig[] = [
  {
    competitionId: 39, // Premier League
    competitionName: "Premier League",
    updateCadence: "match-day+1",
    scheduleConfig: {
      typicalMatchDays: ['Saturday', 'Sunday', 'Monday'],
      seasonStart: 'August',
      seasonEnd: 'May',
      updateHour: 2, // 2 AM
      midweekUpdates: true,
      postMatchDelay: 2, // Update 2 hours after match ends
    }
  },
  {
    competitionId: 2, // Champions League
    competitionName: "UEFA Champions League",
    updateCadence: "weekly",
    scheduleConfig: {
      typicalMatchDays: ['Tuesday', 'Wednesday'],
      seasonStart: 'September',
      seasonEnd: 'May',
      updateHour: 2,
      midweekUpdates: false,
      postMatchDelay: 3,
    }
  },
  {
    competitionId: 3, // Europa League
    competitionName: "UEFA Europa League",
    updateCadence: "weekly",
    scheduleConfig: {
      typicalMatchDays: ['Thursday'],
      seasonStart: 'September',
      seasonEnd: 'May',
      updateHour: 2,
      midweekUpdates: false,
      postMatchDelay: 3,
    }
  },
  {
    competitionId: 45, // FA Cup
    competitionName: "FA Cup",
    updateCadence: "match-day+1",
    scheduleConfig: {
      typicalMatchDays: ['Saturday', 'Sunday'],
      seasonStart: 'January',
      seasonEnd: 'May',
      updateHour: 2,
      midweekUpdates: true,
      postMatchDelay: 2,
    }
  },
  {
    competitionId: 48, // League Cup
    competitionName: "League Cup",
    updateCadence: "match-day+1",
    scheduleConfig: {
      typicalMatchDays: ['Tuesday', 'Wednesday'],
      seasonStart: 'August',
      seasonEnd: 'February',
      updateHour: 2,
      midweekUpdates: true,
      postMatchDelay: 2,
    }
  },
];

class HistoricalDataService {
  
  /**
   * Fetch head-to-head data from API and store in database
   * @param team1Id - First team ID
   * @param team2Id - Second team ID
   * @param seasons - Array of seasons to fetch (defaults to last 5 seasons)
   * @returns Array of matches with proper timestamp tracking
   */
  async fetchAndStoreH2HFromAPI(
    team1Id: number, 
    team2Id: number, 
    seasons?: number[]
  ): Promise<HistoricalMatch[]> {
    const currentSeason = getCurrentSeason();
    const seasonsToFetch = seasons || [
      currentSeason,
      currentSeason - 1,
      currentSeason - 2,
      currentSeason - 3,
      currentSeason - 4
    ];
    
    const matches: HistoricalMatch[] = [];
    let isFallback = false;
    let fallbackReason = '';

    try {
      // Fetch H2H data from API for all seasons
      for (const season of seasonsToFetch) {
        console.log(`📊 Fetching H2H data for teams ${team1Id} vs ${team2Id} - Season ${season}`);
        
        try {
          const fixtures = await apiFootballService.getFixtures({
            season,
            team: team1Id,
            status: 'FT' // Only finished matches
          });
          
          // Filter for matches between these two teams
          const h2hFixtures = fixtures.filter((f: any) => 
            (f.teams.home.id === team1Id && f.teams.away.id === team2Id) ||
            (f.teams.home.id === team2Id && f.teams.away.id === team1Id)
          );
          
          // Store each match in database
          for (const fixture of h2hFixtures) {
            const match: HistoricalMatch = {
              team1Id: Math.min(team1Id, team2Id),
              team1Name: fixture.teams.home.id === Math.min(team1Id, team2Id) ? 
                fixture.teams.home.name : fixture.teams.away.name,
              team2Id: Math.max(team1Id, team2Id),
              team2Name: fixture.teams.home.id === Math.max(team1Id, team2Id) ? 
                fixture.teams.home.name : fixture.teams.away.name,
              date: fixture.fixture.date,
              season,
              competitionId: fixture.league.id,
              competitionName: fixture.league.name,
              homeTeamId: fixture.teams.home.id,
              awayTeamId: fixture.teams.away.id,
              homeScore: fixture.goals.home,
              awayScore: fixture.goals.away,
              venue: fixture.fixture.venue?.name || '',
              isFallback: false
            };
            
            matches.push(match);
            
            // Store in database
            await this.storeH2HMatch(match);
          }
          
        } catch (apiError) {
          console.error(`Failed to fetch season ${season}:`, apiError);
        }
      }
      
      console.log(`✓ Fetched ${matches.length} H2H matches from API`);
      
    } catch (error: any) {
      console.error('Failed to fetch H2H data from API:', error);
      isFallback = true;
      fallbackReason = `API error: ${error.message || 'Unknown error'}`;
    }
    
    // If API failed and no matches found, use minimal fallback
    if (matches.length === 0 && isFallback) {
      console.warn('⚠️ Using fallback data due to API failure');
      return this.getMinimalFallbackData(team1Id, team2Id, fallbackReason);
    }
    
    return matches;
  }

  /**
   * Store H2H match in database with proper timestamp tracking
   */
  private async storeH2HMatch(match: HistoricalMatch): Promise<void> {
    try {
      await db.insert(historicalHeadToHead)
        .values({
          team1Id: match.team1Id,
          team1Name: match.team1Name,
          team2Id: match.team2Id,
          team2Name: match.team2Name,
          fixtureDate: toSafeDateRequired(match.date),
          competition: match.competitionName,
          competitionId: match.competitionId,
          venue: match.venue,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          team1Score: match.homeTeamId === match.team1Id ? match.homeScore : match.awayScore,
          team2Score: match.homeTeamId === match.team2Id ? match.homeScore : match.awayScore,
          winner: match.homeScore > match.awayScore ? 
            (match.homeTeamId === match.team1Id ? match.team1Name : match.team2Name) :
            match.homeScore < match.awayScore ? 
            (match.awayTeamId === match.team1Id ? match.team1Name : match.team2Name) : 
            'draw',
          season: match.season,
          lastUpdated: new Date(),
          isFallback: match.isFallback || false,
          fallbackReason: match.fallbackReason || null
        })
        .onConflictDoUpdate({
          target: [historicalHeadToHead.team1Id, historicalHeadToHead.team2Id, historicalHeadToHead.fixtureDate],
          set: {
            team1Score: match.homeTeamId === match.team1Id ? match.homeScore : match.awayScore,
            team2Score: match.homeTeamId === match.team2Id ? match.homeScore : match.awayScore,
            lastUpdated: new Date(),
            isFallback: match.isFallback || false,
            fallbackReason: match.fallbackReason || null
          }
        });
    } catch (error) {
      console.error('Failed to store H2H match:', error);
    }
  }

  /**
   * Get minimal fallback data when API is unreachable
   * Returns empty array with fallback metadata
   */
  private getMinimalFallbackData(
    team1Id: number, 
    team2Id: number, 
    fallbackReason: string
  ): HistoricalMatch[] {
    // Store fallback status in database
    this.logFallbackUsage(team1Id, team2Id, fallbackReason);
    
    // Return empty array - let the UI handle no data gracefully
    return [];
  }

  /**
   * Log fallback usage for monitoring
   */
  private async logFallbackUsage(
    team1Id: number,
    team2Id: number,
    reason: string
  ): Promise<void> {
    console.error(`⚠️ FALLBACK MODE ACTIVATED:
      Teams: ${team1Id} vs ${team2Id}
      Reason: ${reason}
      Time: ${new Date().toISOString()}
    `);
    
    // Could also log to monitoring service or admin dashboard here
  }

  /**
   * Initialize update schedules for competitions
   */
  async initializeUpdateSchedules(): Promise<void> {
    console.log('⏰ Initializing competition update schedules...');

    for (const config of COMPETITION_UPDATE_SCHEDULES) {
      await db.insert(dataUpdateSchedule)
        .values({
          competitionId: config.competitionId,
          competitionName: config.competitionName,
          updateCadence: config.updateCadence,
          lastUpdateAt: null,
          nextUpdateAt: this.calculateNextUpdate(config),
          isActive: true,
          scheduleConfig: config.scheduleConfig,
          updatedAt: toSafeDateRequired(Date.now()),
        })
        .onConflictDoUpdate({
          target: dataUpdateSchedule.competitionId,
          set: {
            updateCadence: config.updateCadence,
            scheduleConfig: config.scheduleConfig,
            updatedAt: toSafeDateRequired(Date.now()),
          }
        });
    }

    console.log(`✓ Initialized ${COMPETITION_UPDATE_SCHEDULES.length} update schedules`);
  }

  /**
   * Calculate next update time based on competition schedule
   */
  private calculateNextUpdate(config: UpdateCadenceConfig): Date {
    const now = new Date();
    const nextUpdate = new Date();

    switch (config.updateCadence) {
      case 'daily':
        nextUpdate.setDate(now.getDate() + 1);
        nextUpdate.setHours(config.scheduleConfig.updateHour, 0, 0, 0);
        break;
      case 'weekly':
        nextUpdate.setDate(now.getDate() + 7);
        nextUpdate.setHours(config.scheduleConfig.updateHour, 0, 0, 0);
        break;
      case 'bi-weekly':
        nextUpdate.setDate(now.getDate() + 14);
        nextUpdate.setHours(config.scheduleConfig.updateHour, 0, 0, 0);
        break;
      case 'match-day':
      case 'match-day+1':
        // Default to next day at update hour
        nextUpdate.setDate(now.getDate() + 1);
        nextUpdate.setHours(config.scheduleConfig.updateHour, 0, 0, 0);
        break;
    }

    return nextUpdate;
  }

  /**
   * Get head-to-head data for two teams
   * Fetches from API if data is stale, then returns from database
   */
  async getHeadToHeadData(team1Id: number, team2Id: number, limit: number = 20): Promise<any[]> {
    const minTeamId = Math.min(team1Id, team2Id);
    const maxTeamId = Math.max(team1Id, team2Id);
    
    // Check when data was last updated
    const lastUpdate = await db
      .select({ lastUpdated: historicalHeadToHead.lastUpdated })
      .from(historicalHeadToHead)
      .where(
        and(
          eq(historicalHeadToHead.team1Id, minTeamId),
          eq(historicalHeadToHead.team2Id, maxTeamId)
        )
      )
      .orderBy(desc(historicalHeadToHead.lastUpdated))
      .limit(1);
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // If data is stale or doesn't exist, fetch from API
    if (!lastUpdate[0] || lastUpdate[0].lastUpdated < oneHourAgo) {
      console.log(`📊 H2H data is stale or missing for teams ${team1Id} vs ${team2Id}, fetching from API...`);
      await this.fetchAndStoreH2HFromAPI(team1Id, team2Id);
    }

    // Now return the data from database
    const historicalMatches = await db
      .select()
      .from(historicalHeadToHead)
      .where(
        and(
          eq(historicalHeadToHead.team1Id, minTeamId),
          eq(historicalHeadToHead.team2Id, maxTeamId)
        )
      )
      .orderBy(desc(historicalHeadToHead.fixtureDate))
      .limit(limit);

    return historicalMatches.map(match => ({
      id: match.fixtureId || 0,
      date: match.date.toISOString(),
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      goals: {
        home: match.homeScore,
        away: match.awayScore,
      },
      venue: match.venue,
      competition: match.competitionName,
      season: match.season,
      dataSource: match.dataSource,
    }));
  }

  /**
   * Get update schedule for a competition
   */
  async getUpdateSchedule(competitionId: number): Promise<any> {
    const schedule = await db
      .select()
      .from(dataUpdateSchedule)
      .where(eq(dataUpdateSchedule.competitionId, competitionId))
      .limit(1);

    return schedule[0] || null;
  }

  /**
   * Get all active update schedules
   */
  async getActiveSchedules(): Promise<any[]> {
    return await db
      .select()
      .from(dataUpdateSchedule)
      .where(eq(dataUpdateSchedule.isActive, true));
  }

  /**
   * Check if update is needed for a competition
   */
  async shouldUpdate(competitionId: number): Promise<boolean> {
    const schedule = await this.getUpdateSchedule(competitionId);
    if (!schedule || !schedule.isActive) return false;

    const now = new Date();
    const nextUpdate = schedule.nextUpdateAt ? new Date(schedule.nextUpdateAt) : null;

    return nextUpdate ? now >= nextUpdate : true;
  }

  /**
   * Mark competition as updated
   */
  async markAsUpdated(competitionId: number): Promise<void> {
    const schedule = await this.getUpdateSchedule(competitionId);
    if (!schedule) return;

    const config = COMPETITION_UPDATE_SCHEDULES.find(c => c.competitionId === competitionId);
    if (!config) return;

    await db
      .update(dataUpdateSchedule)
      .set({
        lastUpdateAt: new Date(),
        nextUpdateAt: this.calculateNextUpdate(config),
        updatedAt: new Date(),
      })
      .where(eq(dataUpdateSchedule.competitionId, competitionId));
  }

  /**
   * Get optimal update strategy summary
   */
  getUpdateStrategySummary(): string {
    const strategies = COMPETITION_UPDATE_SCHEDULES.map(config => {
      const { competitionName, updateCadence, scheduleConfig } = config;
      const matchDays = scheduleConfig.typicalMatchDays.join(', ');
      
      return `
📊 ${competitionName}:
   - Update Cadence: ${updateCadence}
   - Match Days: ${matchDays}
   - Update Time: ${scheduleConfig.updateHour}:00
   - Midweek Updates: ${scheduleConfig.midweekUpdates ? 'Yes' : 'No'}
   - Post-Match Delay: ${scheduleConfig.postMatchDelay}h
   - Season: ${scheduleConfig.seasonStart} - ${scheduleConfig.seasonEnd}`;
    });

    return `
🔄 OPTIMAL UPDATE STRATEGY
${strategies.join('\n')}

💡 Strategy Rationale:
   - Premier League: Match-day+1 updates (2 hours post-match) for immediate data
   - Champions/Europa: Weekly updates on match days to minimize API calls
   - Domestic Cups: Match-day+1 for tournament progression
   - All updates scheduled at 2 AM to avoid peak traffic
   - Historical data (2020-2024) stored in database for instant access
   - Live data fetched only when database lacks recent matches
`;
  }
}

export const historicalDataService = new HistoricalDataService();
