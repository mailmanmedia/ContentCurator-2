
import { db } from "../db";
import { 
  football_fixtures,
  football_standings,
  football_player_statistics,
  football_team_statistics,
  data_sync_status
} from "@shared/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { APIFootballService } from "./apiFootballService";
import { toUnixTimestamp } from '../utils/dateUtils';

interface SyncResult {
  resource: string;
  newRecords: number;
  updatedRecords: number;
  apiCalls: number;
  success: boolean;
  error?: string;
}

/**
 * Incremental Sync Service
 * 
 * Efficiently fetches only NEW data from API Football, minimizing API calls
 * by tracking what's already in the database.
 */
export class IncrementalSyncService {
  private apiService: APIFootballService;
  private readonly LIVERPOOL_ID = 40;
  private readonly PREMIER_LEAGUE_ID = 39;

  constructor() {
    this.apiService = new APIFootballService();
  }

  /**
   * Get the current season dynamically
   */
  private getCurrentSeason(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (currentMonth < 7) {
      return currentYear - 1;
    }
    return currentYear;
  }

  /**
   * Get last sync timestamp for a resource
   */
  private async getLastSyncTimestamp(resourceType: string, leagueId?: number): Promise<Date | null> {
    const syncStatus = await db
      .select()
      .from(data_sync_status)
      .where(
        and(
          eq(data_sync_status.resource_type, resourceType),
          leagueId ? eq(data_sync_status.league_id, leagueId) : undefined
        )
      )
      .orderBy(desc(data_sync_status.last_sync_at))
      .limit(1);

    return syncStatus[0]?.last_sync_at || null;
  }

  /**
   * Update sync status after successful sync
   */
  private async updateSyncStatus(
    resourceType: string, 
    leagueId: number | null,
    season: string,
    recordsCount: number
  ): Promise<void> {
    await db.insert(data_sync_status)
      .values({
        resource_type: resourceType,
        league_id: leagueId,
        season: season,
        last_sync_at: new Date(),
        next_sync_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        total_synced: recordsCount,
        sync_status: 'completed',
        completeness_percentage: 100
      })
      .onConflictDoUpdate({
        target: [data_sync_status.resource_type, data_sync_status.league_id, data_sync_status.season],
        set: {
          last_sync_at: new Date(),
          total_synced: recordsCount,
          sync_status: 'completed'
        }
      });
  }

  /**
   * Sync only new/updated fixtures
   */
  async syncNewFixtures(leagueId: number = this.PREMIER_LEAGUE_ID): Promise<SyncResult> {
    const season = this.getCurrentSeason();
    let apiCalls = 0;
    let newRecords = 0;
    let updatedRecords = 0;

    try {
      // Get the most recent fixture in our database
      const latestFixture = await db
        .select()
        .from(football_fixtures)
        .where(
          and(
            eq(football_fixtures.league_id, leagueId),
            eq(football_fixtures.season, season)
          )
        )
        .orderBy(desc(football_fixtures.timestamp))
        .limit(1);

      const fromDate = latestFixture[0]?.timestamp 
        ? new Date(latestFixture[0].timestamp).toISOString().split('T')[0]
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 90 days if no data

      // Fetch only fixtures after our latest
      const fixtures = await this.apiService.fetchFixtures(
        leagueId,
        season,
        fromDate,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next 30 days
      );
      apiCalls++;

      for (const fixture of fixtures) {
        const existingFixture = await db
          .select()
          .from(football_fixtures)
          .where(eq(football_fixtures.id, fixture.fixture.id))
          .limit(1);

        if (existingFixture.length === 0) {
          const fixtureDate = new Date(fixture.fixture.date);
          await db.insert(football_fixtures).values({
            id: fixture.fixture.id,
            referee: fixture.fixture.referee,
            timezone: fixture.fixture.timezone,
            date: fixtureDate,
            timestamp: toUnixTimestamp(fixture.fixture.timestamp, fixtureDate),
            periods: JSON.stringify(fixture.fixture.periods || {}),
            venue: JSON.stringify(fixture.fixture.venue || {}),
            status: JSON.stringify(fixture.fixture.status || {}),
            league_id: fixture.league.id,
            season: fixture.league.season,
            round: fixture.league.round,
            home_team_id: fixture.teams.home.id,
            away_team_id: fixture.teams.away.id,
            goals: JSON.stringify(fixture.goals || {}),
            score: JSON.stringify(fixture.score || {}),
            status_short: fixture.fixture.status.short,
            last_updated: new Date()
          });
          newRecords++;
        } else {
          // Update if status changed
          await db.update(football_fixtures)
            .set({
              status: JSON.stringify(fixture.fixture.status || {}),
              status_short: fixture.fixture.status.short,
              goals: JSON.stringify(fixture.goals || {}),
              score: JSON.stringify(fixture.score || {}),
              last_updated: new Date()
            })
            .where(eq(football_fixtures.id, fixture.fixture.id));
          updatedRecords++;
        }
      }

      await this.updateSyncStatus('fixtures', leagueId, season.toString(), newRecords + updatedRecords);

      return {
        resource: 'fixtures',
        newRecords,
        updatedRecords,
        apiCalls,
        success: true
      };

    } catch (error) {
      return {
        resource: 'fixtures',
        newRecords,
        updatedRecords,
        apiCalls,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync current standings (only if changed)
   */
  async syncStandings(leagueId: number = this.PREMIER_LEAGUE_ID): Promise<SyncResult> {
    const season = this.getCurrentSeason();
    let apiCalls = 0;
    let newRecords = 0;
    let updatedRecords = 0;

    try {
      const standings = await this.apiService.fetchStandings(leagueId, season);
      apiCalls++;

      if (standings && standings[0]?.league?.standings?.[0]) {
        const standingsData = standings[0].league.standings[0];

        for (const standing of standingsData) {
          const existing = await db
            .select()
            .from(football_standings)
            .where(
              and(
                eq(football_standings.league_id, leagueId),
                eq(football_standings.team_id, standing.team.id),
                eq(football_standings.season, season.toString())
              )
            )
            .limit(1);

          const standingData = {
            league_id: leagueId,
            season: season.toString(),
            rank: standing.rank,
            team_id: standing.team.id,
            team_name: standing.team.name,
            points: standing.points,
            goals_diff: standing.goalsDiff,
            form: standing.form,
            all_played: standing.all.played,
            all_win: standing.all.win,
            all_draw: standing.all.draw,
            all_lose: standing.all.lose,
            all_goals_for: standing.all.goals.for,
            all_goals_against: standing.all.goals.against,
            updated_at: new Date()
          };

          if (existing.length === 0) {
            await db.insert(football_standings).values(standingData);
            newRecords++;
          } else {
            await db.update(football_standings)
              .set(standingData)
              .where(eq(football_standings.id, existing[0].id));
            updatedRecords++;
          }
        }
      }

      await this.updateSyncStatus('standings', leagueId, season.toString(), newRecords + updatedRecords);

      return {
        resource: 'standings',
        newRecords,
        updatedRecords,
        apiCalls,
        success: true
      };

    } catch (error) {
      return {
        resource: 'standings',
        newRecords,
        updatedRecords,
        apiCalls,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run a complete incremental sync
   */
  async runIncrementalSync(): Promise<SyncResult[]> {
    console.log('🔄 Starting incremental sync...');
    const results: SyncResult[] = [];

    // Sync Premier League fixtures
    results.push(await this.syncNewFixtures(this.PREMIER_LEAGUE_ID));
    
    // Sync Premier League standings
    results.push(await this.syncStandings(this.PREMIER_LEAGUE_ID));

    const totalApiCalls = results.reduce((sum, r) => sum + r.apiCalls, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newRecords, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.updatedRecords, 0);

    console.log(`✅ Incremental sync complete:`);
    console.log(`   API calls used: ${totalApiCalls}`);
    console.log(`   New records: ${totalNew}`);
    console.log(`   Updated records: ${totalUpdated}`);

    return results;
  }
}

export const incrementalSyncService = new IncrementalSyncService();
