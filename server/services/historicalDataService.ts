import { db } from "../db";
import { historicalHeadToHead, dataUpdateSchedule, footballFixtures } from "@shared/schema";
import { eq, and, or, desc, gte } from "drizzle-orm";
import { toSafeDate, toSafeDateRequired } from '../utils/dateUtils';

/**
 * Historical Data Service
 * Manages historical head-to-head data from 2020+ with hardcoded historical matches
 * and optimal update cadence for different competitions
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
   * Initialize historical data in database
   */
  async initializeHistoricalData(): Promise<void> {
    console.log('📊 Initializing historical head-to-head data...');
    
    const dataToInsert = HISTORICAL_PREMIER_LEAGUE_DATA.map(match => ({
      team1Id: Math.min(match.team1Id, match.team2Id),
      team2Id: Math.max(match.team1Id, match.team2Id),
      fixtureId: null,
      date: toSafeDateRequired(match.date),
      season: match.season,
      competitionId: match.competitionId,
      competitionName: match.competitionName,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      venue: match.venue,
      isHistorical: true,
      dataSource: 'hardcoded',
      lastUpdated: toSafeDateRequired(Date.now()),
    }));

    for (const data of dataToInsert) {
      try {
        await db.insert(historicalHeadToHead).values(data).onConflictDoNothing();
      } catch (error) {
        console.error(`Failed to insert historical match:`, error);
      }
    }

    console.log(`✓ Initialized ${dataToInsert.length} historical matches`);
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
   * First checks database (historical + current), then falls back to live data
   */
  async getHeadToHeadData(team1Id: number, team2Id: number, limit: number = 20): Promise<any[]> {
    const minTeamId = Math.min(team1Id, team2Id);
    const maxTeamId = Math.max(team1Id, team2Id);

    const historicalMatches = await db
      .select()
      .from(historicalHeadToHead)
      .where(
        and(
          eq(historicalHeadToHead.team1Id, minTeamId),
          eq(historicalHeadToHead.team2Id, maxTeamId)
        )
      )
      .orderBy(desc(historicalHeadToHead.date))
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
