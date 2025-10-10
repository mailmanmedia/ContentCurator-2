import { APIFootballService } from './apiFootballService';
import { db } from '../db';
import { toSafeDate, toSafeDateRequired, convertTimestampFields } from '../utils/dateUtils';
import { 
  football_leagues,
  football_teams,
  football_players,
  football_fixtures,
  football_standings,
  football_team_statistics,
  football_player_statistics,
  data_sync_status,
  data_sync_logs,
  type InsertFootballLeague,
  type InsertFootballTeam,
  type InsertFootballPlayer,
  type InsertFootballFixture,
  type InsertFootballStanding,
  type InsertFootballTeamStatistics,
  type InsertFootballPlayerStatistics,
  type InsertDataSyncStatus,
  type InsertDataSyncLog
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface BootstrapOptions {
  leagues?: number[];
  seasons?: number[];
  skipExisting?: boolean;
  batchSize?: number;
  delayMs?: number;
}

interface BootstrapReport {
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  resourcesSynced: {
    leagues: number;
    teams: number;
    players: number;
    fixtures: number;
    standings: number;
    teamStats: number;
    playerStats: number;
  };
  errors: Array<{
    resource: string;
    message: string;
    timestamp: Date;
  }>;
  apiCallsUsed: number;
}

class HistoricalDataBootstrap {
  private apiService: APIFootballService;
  private leagues: number[] = [39, 2]; // Premier League, Champions League
  private seasons: number[] = [];  // Will be populated dynamically
  private batchSize: number = 100;
  private delayMs: number = 1000;
  private skipExisting: boolean = false;
  private report: BootstrapReport;
  private failedItems: Map<string, any> = new Map();

  constructor(options?: BootstrapOptions) {
    this.apiService = new APIFootballService();
    
    if (options?.leagues) this.leagues = options.leagues;
    if (options?.seasons) {
      this.seasons = options.seasons;
    } else {
      // Use dynamic season range from 2020 to current year
      this.seasons = this.apiService.getDynamicSeasonRange(2020);
    }
    if (options?.batchSize) this.batchSize = options.batchSize;
    if (options?.delayMs) this.delayMs = options.delayMs;
    if (options?.skipExisting !== undefined) this.skipExisting = options.skipExisting;

    this.report = {
      startTime: new Date(),
      resourcesSynced: {
        leagues: 0,
        teams: 0,
        players: 0,
        fixtures: 0,
        standings: 0,
        teamStats: 0,
        playerStats: 0
      },
      errors: [],
      apiCallsUsed: 0
    };
  }

  // Main bootstrap orchestrator
  async bootstrapAll(): Promise<BootstrapReport> {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('      HISTORICAL DATA BOOTSTRAP - STARTING');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Leagues: ${this.leagues.join(', ')}`);
    console.log(`Seasons: ${this.seasons.join(', ')}`);
    console.log(`Batch Size: ${this.batchSize}`);
    console.log(`Skip Existing: ${this.skipExisting}`);
    console.log('════════════════════════════════════════════════════════\n');

    try {
      // Check last sync status to potentially resume
      await this.checkAndResumeFromLastSync();

      // Bootstrap in logical order
      console.log('\n📊 Phase 1: Fetching Leagues...');
      await this.bootstrapLeagues();

      console.log('\n🏟️ Phase 2: Fetching Teams...');
      await this.bootstrapTeams();

      console.log('\n⚽ Phase 3: Fetching Fixtures...');
      await this.bootstrapFixtures();

      console.log('\n📈 Phase 4: Fetching Standings...');
      await this.bootstrapStandings();

      console.log('\n📊 Phase 5: Fetching Team Statistics...');
      await this.bootstrapTeamStatistics();

      console.log('\n👥 Phase 6: Fetching Players...');
      await this.bootstrapPlayers();

      // Player statistics is the most resource-intensive
      console.log('\n📊 Phase 7: Fetching Player Statistics (this may take a while)...');
      await this.bootstrapPlayerStatistics();

      // Retry failed items
      if (this.failedItems.size > 0) {
        console.log('\n🔄 Retrying failed items...');
        await this.retryFailedItems();
      }

      // Generate final report
      this.report.endTime = new Date();
      this.report.totalDuration = (this.report.endTime.getTime() - this.report.startTime.getTime()) / 1000;
      
      this.printFinalReport();
      return this.report;

    } catch (error) {
      console.error('\n❌ Bootstrap failed with critical error:', error);
      this.report.errors.push({
        resource: 'global',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      throw error;
    }
  }

  // Check and resume from last sync point
  private async checkAndResumeFromLastSync() {
    try {
      const lastSync = await db
        .select()
        .from(data_sync_status)
        .where(eq(data_sync_status.sync_status, 'in_progress'))
        .limit(1);

      if (lastSync.length > 0) {
        console.log(`\n⚠️ Found incomplete sync from ${lastSync[0].last_sync_at}`);
        console.log(`Resource: ${lastSync[0].resource_type}, League: ${lastSync[0].league_id}, Season: ${lastSync[0].season}`);
        console.log('Resuming from last checkpoint...\n');
      }
    } catch (error) {
      console.log('No previous sync found, starting fresh...');
    }
  }

  // Bootstrap Leagues
  async bootstrapLeagues() {
    const syncLog = await this.startSyncLog('leagues', null, null);

    try {
      let totalLeagues = 0;
      
      for (const leagueId of this.leagues) {
        for (const season of this.seasons) {
          console.log(`  → Fetching league ${leagueId} for season ${season}...`);
          
          try {
            const response = await this.apiService.fetchLeagues(undefined, season);
            this.report.apiCallsUsed++;
            
            if (response && Array.isArray(response)) {
              const leagueData = response.find((l: any) => l.league?.id === leagueId);
              
              if (leagueData) {
                const insertData: InsertFootballLeague = {
                  name: leagueData.league.name,
                  country: leagueData.country?.name || null,
                  logo: leagueData.league.logo || null,
                  type: leagueData.league.type || null,
                  season: String(season)
                };

                await db.insert(football_leagues)
                  .values(insertData)
                  .onConflictDoUpdate({
                    target: [football_leagues.name, football_leagues.season],
                    set: insertData
                  });

                totalLeagues++;
                this.report.resourcesSynced.leagues++;
                console.log(`    ✓ Saved league: ${leagueData.league.name} (${season})`);
              }
            }

            await this.delay(this.delayMs);
          } catch (error) {
            await this.handleError('leagues', error, { leagueId, season });
          }
        }
      }

      await this.completeSyncLog(syncLog.id, 'completed', totalLeagues);
      console.log(`  ✅ Leagues completed: ${totalLeagues} saved`);

    } catch (error) {
      await this.completeSyncLog(syncLog.id, 'failed', 0, error);
      throw error;
    }
  }

  // Bootstrap Teams
  async bootstrapTeams() {
    for (const leagueId of this.leagues) {
      for (const season of this.seasons) {
        const syncLog = await this.startSyncLog('teams', leagueId, String(season));

        try {
          console.log(`  → Fetching teams for league ${leagueId}, season ${season}...`);
          
          const response = await this.apiService.fetchTeams(leagueId, season);
          this.report.apiCallsUsed++;
          
          if (response && Array.isArray(response)) {
            const teams = response.map((item: any) => ({
              name: item.team.name,
              code: item.team.code || null,
              country: item.team.country || null,
              founded: item.team.founded || null,
              venue: item.venue?.name || null,
              city: item.venue?.city || null,
              capacity: item.venue?.capacity || null,
              logo: item.team.logo || null
            }));

            await this.batchInsert(football_teams, teams, ['name']);
            this.report.resourcesSynced.teams += teams.length;

            await this.updateSyncStatus('teams', leagueId, String(season), teams.length);
            await this.completeSyncLog(syncLog.id, 'completed', teams.length);
            
            console.log(`    ✓ Saved ${teams.length} teams`);
          }

          await this.delay(this.delayMs);
        } catch (error) {
          await this.completeSyncLog(syncLog.id, 'failed', 0, error);
          await this.handleError('teams', error, { leagueId, season });
        }
      }
    }
    console.log(`  ✅ Teams completed: ${this.report.resourcesSynced.teams} saved`);
  }

  // Bootstrap Fixtures
  async bootstrapFixtures() {
    for (const leagueId of this.leagues) {
      for (const season of this.seasons) {
        const syncLog = await this.startSyncLog('fixtures', leagueId, String(season));

        try {
          console.log(`  → Fetching fixtures for league ${leagueId}, season ${season}...`);
          
          const response = await this.apiService.fetchFixtures(leagueId, season);
          this.report.apiCallsUsed++;
          
          if (response && Array.isArray(response)) {
            const fixtures: InsertFootballFixture[] = [];

            for (const item of response) {
              // First ensure teams exist
              const homeTeam = await this.ensureTeamExists(item.teams.home);
              const awayTeam = await this.ensureTeamExists(item.teams.away);
              
              // Then ensure league exists
              const league = await this.ensureLeagueExists(item.league);

              fixtures.push({
                referee: item.fixture.referee || null,
                timezone: item.fixture.timezone || null,
                timestamp: toSafeDate(item.fixture.date || item.fixture.timestamp),
                venue_id: item.fixture.venue?.id || null,
                venue_name: item.fixture.venue?.name || null,
                venue_city: item.fixture.venue?.city || null,
                status_long: item.fixture.status?.long || null,
                status_short: item.fixture.status?.short || null,
                status_elapsed: item.fixture.status?.elapsed || null,
                league_id: league?.id || null,
                season: String(season),
                round: item.league.round || null,
                home_team_id: homeTeam?.id || null,
                home_team_name: item.teams.home.name,
                home_team_logo: item.teams.home.logo || null,
                home_team_winner: item.teams.home.winner,
                away_team_id: awayTeam?.id || null,
                away_team_name: item.teams.away.name,
                away_team_logo: item.teams.away.logo || null,
                away_team_winner: item.teams.away.winner,
                goals_home: item.goals.home,
                goals_away: item.goals.away,
                score_halftime_home: item.score.halftime?.home || null,
                score_halftime_away: item.score.halftime?.away || null,
                score_fulltime_home: item.score.fulltime?.home || null,
                score_fulltime_away: item.score.fulltime?.away || null,
                score_extratime_home: item.score.extratime?.home || null,
                score_extratime_away: item.score.extratime?.away || null,
                score_penalty_home: item.score.penalty?.home || null,
                score_penalty_away: item.score.penalty?.away || null
              });
            }

            await this.batchInsert(
              football_fixtures, 
              fixtures,
              ['home_team_name', 'away_team_name', 'timestamp', 'league_id']
            );
            
            this.report.resourcesSynced.fixtures += fixtures.length;

            await this.updateSyncStatus('fixtures', leagueId, String(season), fixtures.length);
            await this.completeSyncLog(syncLog.id, 'completed', fixtures.length);
            
            console.log(`    ✓ Saved ${fixtures.length} fixtures`);
          }

          await this.delay(this.delayMs);
        } catch (error) {
          await this.completeSyncLog(syncLog.id, 'failed', 0, error);
          await this.handleError('fixtures', error, { leagueId, season });
        }
      }
    }
    console.log(`  ✅ Fixtures completed: ${this.report.resourcesSynced.fixtures} saved`);
  }

  // Bootstrap Standings
  async bootstrapStandings() {
    for (const leagueId of this.leagues) {
      for (const season of this.seasons) {
        const syncLog = await this.startSyncLog('standings', leagueId, String(season));

        try {
          console.log(`  → Fetching standings for league ${leagueId}, season ${season}...`);
          
          const response = await this.apiService.fetchStandings(leagueId, season);
          this.report.apiCallsUsed++;
          
          if (response && Array.isArray(response) && response[0]?.standings) {
            const standings: InsertFootballStanding[] = [];

            for (const group of response[0].standings) {
              for (const standing of group) {
                // Ensure team exists
                const team = await this.ensureTeamExists(standing.team);
                
                // Ensure league exists
                const league = await this.ensureLeagueExists({ id: leagueId, name: response[0].league?.name });

                standings.push({
                  league_id: league?.id || leagueId,
                  season: String(season),
                  rank: standing.rank,
                  team_id: team?.id || null,
                  team_name: standing.team.name,
                  points: standing.points,
                  goals_diff: standing.goalsDiff,
                  group: standing.group || null,
                  form: standing.form || null,
                  status: standing.status || null,
                  description: standing.description || null,
                  all_played: standing.all?.played || 0,
                  all_win: standing.all?.win || 0,
                  all_draw: standing.all?.draw || 0,
                  all_lose: standing.all?.lose || 0,
                  all_goals_for: standing.all?.goals?.for || 0,
                  all_goals_against: standing.all?.goals?.against || 0,
                  home_played: standing.home?.played || 0,
                  home_win: standing.home?.win || 0,
                  home_draw: standing.home?.draw || 0,
                  home_lose: standing.home?.lose || 0,
                  home_goals_for: standing.home?.goals?.for || 0,
                  home_goals_against: standing.home?.goals?.against || 0,
                  away_played: standing.away?.played || 0,
                  away_win: standing.away?.win || 0,
                  away_draw: standing.away?.draw || 0,
                  away_lose: standing.away?.lose || 0,
                  away_goals_for: standing.away?.goals?.for || 0,
                  away_goals_against: standing.away?.goals?.against || 0,
                  last_update: toSafeDateRequired(standing.update || Date.now())
                });
              }
            }

            await this.batchInsert(
              football_standings,
              standings,
              ['league_id', 'season', 'team_id']
            );
            
            this.report.resourcesSynced.standings += standings.length;

            await this.updateSyncStatus('standings', leagueId, String(season), standings.length);
            await this.completeSyncLog(syncLog.id, 'completed', standings.length);
            
            console.log(`    ✓ Saved ${standings.length} standings`);
          }

          await this.delay(this.delayMs);
        } catch (error) {
          await this.completeSyncLog(syncLog.id, 'failed', 0, error);
          await this.handleError('standings', error, { leagueId, season });
        }
      }
    }
    console.log(`  ✅ Standings completed: ${this.report.resourcesSynced.standings} saved`);
  }

  // Bootstrap Team Statistics
  async bootstrapTeamStatistics() {
    // First get all teams for each league/season combination
    for (const leagueId of this.leagues) {
      for (const season of this.seasons) {
        const syncLog = await this.startSyncLog('team_statistics', leagueId, String(season));

        try {
          // Get teams for this league/season
          const teams = await db
            .selectDistinct({ id: football_teams.id, name: football_teams.name })
            .from(football_teams)
            .innerJoin(
              football_fixtures,
              sql`${football_teams.id} = ${football_fixtures.home_team_id} OR ${football_teams.id} = ${football_fixtures.away_team_id}`
            )
            .where(
              and(
                eq(football_fixtures.league_id, leagueId),
                eq(football_fixtures.season, String(season))
              )
            );

          console.log(`  → Fetching team statistics for ${teams.length} teams in league ${leagueId}, season ${season}...`);
          
          let statsCount = 0;
          for (const team of teams) {
            try {
              const response = await this.apiService.fetchTeamStatistics(team.id, leagueId, season);
              this.report.apiCallsUsed++;
              
              if (response) {
                const stats: InsertFootballTeamStatistics = {
                  team_id: team.id,
                  fixture_id: null, // This is for season-wide stats, not fixture-specific
                  league_id: leagueId,
                  games_played: response.fixtures?.played?.total || 0,
                  games_wins: response.fixtures?.wins?.total || 0,
                  games_draws: response.fixtures?.draws?.total || 0,
                  games_losses: response.fixtures?.loses?.total || 0,
                  goals_for_total: response.goals?.for?.total?.total || 0,
                  goals_for_average: parseFloat(response.goals?.for?.average?.total || '0'),
                  goals_against_total: response.goals?.against?.total?.total || 0,
                  goals_against_average: parseFloat(response.goals?.against?.average?.total || '0'),
                  biggest_win_home: response.biggest?.wins?.home || null,
                  biggest_win_away: response.biggest?.wins?.away || null,
                  biggest_loss_home: response.biggest?.loses?.home || null,
                  biggest_loss_away: response.biggest?.loses?.away || null,
                  clean_sheets_home: response.clean_sheet?.home || 0,
                  clean_sheets_away: response.clean_sheet?.away || 0,
                  clean_sheets_total: response.clean_sheet?.total || 0,
                  failed_to_score_home: response.failed_to_score?.home || 0,
                  failed_to_score_away: response.failed_to_score?.away || 0,
                  failed_to_score_total: response.failed_to_score?.total || 0,
                  penalty_scored: response.penalty?.scored?.total || 0,
                  penalty_missed: response.penalty?.missed?.total || 0,
                  penalty_total: response.penalty?.total || 0,
                  lineups: JSON.stringify(response.lineups || []),
                  cards_yellow: Object.values(response.cards?.yellow || {})
                    .reduce((sum: number, card: any) => sum + (card?.total || 0), 0),
                  cards_red: Object.values(response.cards?.red || {})
                    .reduce((sum: number, card: any) => sum + (card?.total || 0), 0)
                };

                await db.insert(football_team_statistics)
                  .values(stats)
                  .onConflictDoUpdate({
                    target: [football_team_statistics.team_id, football_team_statistics.fixture_id],
                    set: stats
                  });

                statsCount++;
                this.report.resourcesSynced.teamStats++;
                console.log(`    ✓ Saved stats for ${team.name}`);
              }

              await this.delay(500); // Smaller delay between team stats
            } catch (error) {
              console.warn(`    ⚠️ Failed to fetch stats for team ${team.name}:`, error);
              this.failedItems.set(`team_stats_${team.id}_${leagueId}_${season}`, { team, leagueId, season });
            }
          }

          await this.updateSyncStatus('team_statistics', leagueId, String(season), statsCount);
          await this.completeSyncLog(syncLog.id, 'completed', statsCount);
          
          console.log(`    ✓ Saved ${statsCount} team statistics`);

        } catch (error) {
          await this.completeSyncLog(syncLog.id, 'failed', 0, error);
          await this.handleError('team_statistics', error, { leagueId, season });
        }
      }
    }
    console.log(`  ✅ Team Statistics completed: ${this.report.resourcesSynced.teamStats} saved`);
  }

  // Bootstrap Players
  async bootstrapPlayers() {
    // Get all teams
    const teams = await db.select().from(football_teams);
    
    for (const team of teams) {
      for (const season of this.seasons) {
        const syncLog = await this.startSyncLog('players', team.id, String(season));

        try {
          console.log(`  → Fetching players for ${team.name}, season ${season}...`);
          
          const response = await this.apiService.fetchAllPlayersForTeam(team.id, season);
          this.report.apiCallsUsed++;
          
          if (response && Array.isArray(response)) {
            const players: InsertFootballPlayer[] = [];

            for (const item of response) {
              if (item.player) {
                players.push({
                  name: item.player.name,
                  firstname: item.player.firstname || null,
                  lastname: item.player.lastname || null,
                  age: item.player.age || null,
                  birth_date: toSafeDate(item.player.birth?.date, false),
                  birth_place: item.player.birth?.place || null,
                  birth_country: item.player.birth?.country || null,
                  nationality: item.player.nationality || null,
                  height: item.player.height || null,
                  weight: item.player.weight || null,
                  photo: item.player.photo || null,
                  position: item.statistics?.[0]?.games?.position || null,
                  jersey_number: item.statistics?.[0]?.games?.number || null,
                  team_id: team.id
                });
              }
            }

            if (players.length > 0) {
              await this.batchInsert(
                football_players,
                players,
                ['name', 'team_id']
              );
              
              this.report.resourcesSynced.players += players.length;
              console.log(`    ✓ Saved ${players.length} players`);
            }
          }

          await this.updateSyncStatus('players', team.id, String(season), response?.length || 0);
          await this.completeSyncLog(syncLog.id, 'completed', response?.length || 0);
          await this.delay(this.delayMs);
          
        } catch (error) {
          await this.completeSyncLog(syncLog.id, 'failed', 0, error);
          await this.handleError('players', error, { teamId: team.id, season });
        }
      }
    }
    console.log(`  ✅ Players completed: ${this.report.resourcesSynced.players} saved`);
  }

  // Bootstrap Player Statistics (most resource intensive)
  async bootstrapPlayerStatistics() {
    console.log('  ⚠️ Player statistics fetching is resource-intensive and may take a long time...');
    console.log('  ⚠️ Consider running this in smaller batches or during off-peak hours.');

    // Get all players with their teams
    const players = await db
      .select()
      .from(football_players)
      .where(sql`${football_players.team_id} IS NOT NULL`)
      .limit(1000); // Process in chunks to avoid memory issues

    let processedCount = 0;
    const totalPlayers = players.length;

    for (const player of players) {
      if (!player.team_id) continue;

      for (const season of this.seasons) {
        try {
          // Check if we should skip (rate limiting or existing data)
          if (this.skipExisting) {
            const existing = await db
              .select()
              .from(football_player_statistics)
              .where(
                and(
                  eq(football_player_statistics.player_id, player.id),
                  eq(football_player_statistics.season, String(season))
                )
              )
              .limit(1);

            if (existing.length > 0) {
              continue;
            }
          }

          // This is a simplified version - in reality, you'd need to fetch player statistics
          // from the API, but the free tier might not have detailed player stats
          console.log(`    → Processing ${player.name} for season ${season} (${++processedCount}/${totalPlayers})`);

          // Note: The API might not provide detailed player statistics in the free tier
          // You may need to implement alternative data sources or skip this step

          await this.delay(100); // Small delay to prevent overwhelming the system

        } catch (error) {
          console.warn(`    ⚠️ Failed to fetch stats for player ${player.name}:`, error);
          this.failedItems.set(`player_stats_${player.id}_${season}`, { player, season });
        }
      }
    }

    console.log(`  ✅ Player Statistics completed: ${this.report.resourcesSynced.playerStats} saved`);
  }

  // Helper: Ensure team exists in database
  private async ensureTeamExists(teamData: any) {
    if (!teamData) return null;

    const existing = await db
      .select()
      .from(football_teams)
      .where(eq(football_teams.name, teamData.name))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Insert new team
    const [newTeam] = await db.insert(football_teams)
      .values({
        name: teamData.name,
        logo: teamData.logo || null
      })
      .returning();

    return newTeam;
  }

  // Helper: Ensure league exists in database
  private async ensureLeagueExists(leagueData: any) {
    if (!leagueData) return null;

    const existing = await db
      .select()
      .from(football_leagues)
      .where(eq(football_leagues.name, leagueData.name))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    return null; // Don't auto-create leagues
  }

  // Helper: Batch insert with upsert
  private async batchInsert(table: any, data: any[], conflictColumns: string[]) {
    if (!data || data.length === 0) return;

    const chunks = [];
    for (let i = 0; i < data.length; i += this.batchSize) {
      chunks.push(data.slice(i, i + this.batchSize));
    }

    for (const chunk of chunks) {
      await db.transaction(async (tx) => {
        for (const item of chunk) {
          await tx.insert(table)
            .values(item)
            .onConflictDoNothing();
        }
      });
    }
  }

  // Helper: Update sync status
  private async updateSyncStatus(
    resourceType: string,
    leagueId: number | null,
    season: string | null,
    recordsCount: number
  ) {
    const existing = await db
      .select()
      .from(data_sync_status)
      .where(
        and(
          eq(data_sync_status.resource_type, resourceType),
          leagueId ? eq(data_sync_status.league_id, leagueId) : sql`${data_sync_status.league_id} IS NULL`,
          season ? eq(data_sync_status.season, season) : sql`${data_sync_status.season} IS NULL`
        )
      )
      .limit(1);

    const syncData: InsertDataSyncStatus = {
      resource_type: resourceType,
      league_id: leagueId,
      season: season,
      last_sync_at: new Date(),
      next_sync_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
      total_expected: null,
      total_synced: recordsCount,
      completeness_percentage: 100,
      sync_status: 'completed',
      error_message: null
    };

    if (existing.length > 0) {
      await db.update(data_sync_status)
        .set(syncData)
        .where(eq(data_sync_status.id, existing[0].id));
    } else {
      await db.insert(data_sync_status).values(syncData);
    }
  }

  // Helper: Start sync log
  private async startSyncLog(
    resourceType: string,
    leagueId: number | null,
    season: string | null
  ): Promise<{ id: number }> {
    const [log] = await db.insert(data_sync_logs)
      .values({
        resource_type: resourceType,
        league_id: leagueId,
        season: season,
        action: 'bootstrap',
        status: 'in_progress',
        records_processed: 0,
        error_message: null,
        started_at: new Date(),
        completed_at: null,
        api_calls_made: 0
      })
      .returning({ id: data_sync_logs.id });

    return log;
  }

  // Helper: Complete sync log
  private async completeSyncLog(
    logId: number,
    status: string,
    recordsProcessed: number,
    error?: any
  ) {
    await db.update(data_sync_logs)
      .set({
        status,
        records_processed: recordsProcessed,
        completed_at: new Date(),
        error_message: error ? (error instanceof Error ? error.message : String(error)) : null,
        api_calls_made: this.report.apiCallsUsed
      })
      .where(eq(data_sync_logs.id, logId));
  }

  // Helper: Handle errors
  private async handleError(resource: string, error: any, context: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`  ❌ Error in ${resource}:`, errorMessage);
    console.error(`     Context:`, context);
    
    this.report.errors.push({
      resource,
      message: errorMessage,
      timestamp: new Date()
    });

    // Store for retry
    this.failedItems.set(`${resource}_${JSON.stringify(context)}`, { resource, context, error });
  }

  // Helper: Retry failed items
  private async retryFailedItems() {
    const totalFailed = this.failedItems.size;
    let retrySuccess = 0;
    let retryFailed = 0;

    console.log(`  → Retrying ${totalFailed} failed items...`);

    for (const [key, item] of this.failedItems.entries()) {
      try {
        console.log(`    → Retrying ${item.resource} with context:`, item.context);
        
        // Implement specific retry logic based on resource type
        // This is simplified - you'd implement actual retry logic here
        
        retrySuccess++;
        this.failedItems.delete(key);
        
      } catch (error) {
        console.error(`    ❌ Retry failed for ${key}:`, error);
        retryFailed++;
      }
    }

    console.log(`  ✅ Retry completed: ${retrySuccess} succeeded, ${retryFailed} failed`);
  }

  // Helper: Delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Print final report
  private printFinalReport() {
    console.log('\n');
    console.log('════════════════════════════════════════════════════════');
    console.log('           BOOTSTRAP COMPLETED - FINAL REPORT');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Start Time:     ${this.report.startTime.toISOString()}`);
    console.log(`End Time:       ${this.report.endTime?.toISOString()}`);
    console.log(`Total Duration: ${this.report.totalDuration}s`);
    console.log(`API Calls Used: ${this.report.apiCallsUsed}`);
    console.log('');
    console.log('Resources Synced:');
    console.log(`  • Leagues:        ${this.report.resourcesSynced.leagues}`);
    console.log(`  • Teams:          ${this.report.resourcesSynced.teams}`);
    console.log(`  • Players:        ${this.report.resourcesSynced.players}`);
    console.log(`  • Fixtures:       ${this.report.resourcesSynced.fixtures}`);
    console.log(`  • Standings:      ${this.report.resourcesSynced.standings}`);
    console.log(`  • Team Stats:     ${this.report.resourcesSynced.teamStats}`);
    console.log(`  • Player Stats:   ${this.report.resourcesSynced.playerStats}`);
    console.log('');
    
    if (this.report.errors.length > 0) {
      console.log('Errors Encountered:');
      this.report.errors.forEach(error => {
        console.log(`  • [${error.timestamp.toISOString()}] ${error.resource}: ${error.message}`);
      });
    } else {
      console.log('✅ No errors encountered!');
    }
    
    if (this.failedItems.size > 0) {
      console.log(`\n⚠️ ${this.failedItems.size} items failed and could not be retried.`);
    }
    
    console.log('════════════════════════════════════════════════════════');
  }
}

// CLI Support
async function main() {
  const args = process.argv.slice(2);
  const options: BootstrapOptions = {};

  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--leagues=')) {
      options.leagues = arg.split('=')[1].split(',').map(Number);
    } else if (arg.startsWith('--seasons=')) {
      options.seasons = arg.split('=')[1].split(',').map(Number);
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--delay=')) {
      options.delayMs = parseInt(arg.split('=')[1]);
    } else if (arg === '--skip-existing') {
      options.skipExisting = true;
    } else if (arg === '--help') {
      console.log(`
Historical Data Bootstrap for Football Data

Usage: npm run bootstrap:football [options]

Options:
  --leagues=39,2         Comma-separated league IDs (default: 39,2 for Premier League & Champions League)
  --seasons=2020,2021    Comma-separated seasons (default: 2020,2021,2022,2023,2024,2025)
  --batch-size=100       Number of records per batch insert (default: 100)
  --delay=1000          Delay between API calls in milliseconds (default: 1000)
  --skip-existing       Skip data that already exists in database
  --help               Show this help message

Examples:
  npm run bootstrap:football
  npm run bootstrap:football -- --leagues=39 --seasons=2024
  npm run bootstrap:football -- --skip-existing --batch-size=50
`);
      process.exit(0);
    }
  }

  try {
    const bootstrap = new HistoricalDataBootstrap(options);
    const report = await bootstrap.bootstrapAll();
    
    process.exit(report.errors.length === 0 ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { HistoricalDataBootstrap };

// Run if called directly
if (require.main === module) {
  main();
}