import cron from 'node-cron';
import { apiFootballService } from './apiFootballService';
import { db } from '../db';
import { toSafeDate, toSafeDateRequired, convertTimestampFields } from '../utils/dateUtils';
import {
  football_fixtures as footballFixtures,
  football_standings as footballStandings,
  team_season_statistics as teamSeasonStatistics,
  player_season_statistics as playerSeasonStatistics,
  football_players as footballPlayers,
  football_teams as footballTeams,
  data_sync_logs
} from '@shared/schema';
import { eq, and, desc, gte, lte, inArray } from 'drizzle-orm';

interface UpdateResult {
  success: boolean;
  recordsUpdated: number;
  error?: string;
  timestamp: Date;
}

interface UpdateStatus {
  isUpdating: boolean;
  lastUpdate?: Date;
  nextScheduledUpdate?: Date;
  updateHistory: UpdateResult[];
  currentOperation?: string;
}

class ScheduledUpdateService {
  private isUpdating = false;
  private cronJobs: cron.ScheduledTask[] = [];
  private updateHistory: UpdateResult[] = [];
  private currentOperation?: string;
  private lastUpdateTime?: Date;
  
  // Configuration
  private readonly PREMIER_LEAGUE_ID = 39;
  private readonly CHAMPIONS_LEAGUE_ID = 2;
  private readonly CURRENT_SEASON = 2025;
  private readonly MAX_HISTORY_SIZE = 100;
  private readonly UPDATE_SCHEDULE = '0 3 * * 3,6'; // Wednesdays and Saturdays at 3 AM
  
  /**
   * Initialize the scheduled update service
   */
  initialize() {
    // Schedule twice-weekly updates
    const job = cron.schedule(this.UPDATE_SCHEDULE, async () => {
      console.log('📅 Starting scheduled football data update...');
      await this.runScheduledUpdate();
    });
    
    this.cronJobs.push(job);
    console.log('✅ Scheduled update service initialized');
    console.log(`📅 Updates scheduled for: ${this.UPDATE_SCHEDULE} (Wednesdays and Saturdays at 3 AM)`);
    
    // Calculate next scheduled update
    const nextUpdate = this.getNextScheduledUpdate();
    console.log(`⏰ Next scheduled update: ${nextUpdate.toLocaleString()}`);
  }
  
  /**
   * Calculate the next scheduled update time
   */
  private getNextScheduledUpdate(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    // Wednesday is 3, Saturday is 6
    let daysUntilNext = 0;
    
    if (dayOfWeek < 3 || (dayOfWeek === 3 && hour < 3)) {
      // Next is Wednesday
      daysUntilNext = 3 - dayOfWeek;
    } else if (dayOfWeek < 6 || (dayOfWeek === 6 && hour < 3)) {
      // Next is Saturday
      daysUntilNext = 6 - dayOfWeek;
    } else {
      // Next is Wednesday of next week
      daysUntilNext = (7 - dayOfWeek) + 3;
    }
    
    const nextUpdate = new Date(now);
    nextUpdate.setDate(now.getDate() + daysUntilNext);
    nextUpdate.setHours(3, 0, 0, 0);
    
    return nextUpdate;
  }
  
  /**
   * Run the complete scheduled update
   */
  async runScheduledUpdate(): Promise<UpdateResult> {
    if (this.isUpdating) {
      console.log('⚠️ Update already in progress, skipping...');
      return {
        success: false,
        recordsUpdated: 0,
        error: 'Update already in progress',
        timestamp: new Date()
      };
    }
    
    this.isUpdating = true;
    const startTime = new Date();
    let totalRecordsUpdated = 0;
    const errors: string[] = [];
    
    try {
      // Update fixtures first
      console.log('📊 Updating fixtures...');
      this.currentOperation = 'fixtures';
      const fixturesResult = await this.updateCurrentFixtures();
      totalRecordsUpdated += fixturesResult.recordsUpdated;
      if (!fixturesResult.success && fixturesResult.error) {
        errors.push(`Fixtures: ${fixturesResult.error}`);
      }
      
      // Update standings
      console.log('📊 Updating standings...');
      this.currentOperation = 'standings';
      const standingsResult = await this.updateCurrentStandings();
      totalRecordsUpdated += standingsResult.recordsUpdated;
      if (!standingsResult.success && standingsResult.error) {
        errors.push(`Standings: ${standingsResult.error}`);
      }
      
      // Update team statistics
      console.log('📊 Updating team statistics...');
      this.currentOperation = 'team-statistics';
      const teamStatsResult = await this.updateCurrentTeamStatistics();
      totalRecordsUpdated += teamStatsResult.recordsUpdated;
      if (!teamStatsResult.success && teamStatsResult.error) {
        errors.push(`Team Stats: ${teamStatsResult.error}`);
      }
      
      // Update player statistics
      console.log('📊 Updating player statistics...');
      this.currentOperation = 'player-statistics';
      const playerStatsResult = await this.updateCurrentPlayerStatistics();
      totalRecordsUpdated += playerStatsResult.recordsUpdated;
      if (!playerStatsResult.success && playerStatsResult.error) {
        errors.push(`Player Stats: ${playerStatsResult.error}`);
      }
      
      // Check for live matches
      console.log('📊 Checking for live matches...');
      this.currentOperation = 'live-matches';
      const liveMatchesResult = await this.updateLiveMatches();
      totalRecordsUpdated += liveMatchesResult.recordsUpdated;
      if (!liveMatchesResult.success && liveMatchesResult.error) {
        errors.push(`Live Matches: ${liveMatchesResult.error}`);
      }
      
      const result: UpdateResult = {
        success: errors.length === 0,
        recordsUpdated: totalRecordsUpdated,
        error: errors.length > 0 ? errors.join('; ') : undefined,
        timestamp: startTime
      };
      
      // Log to database
      await this.logUpdateResult('scheduled', result);
      
      // Add to history
      this.updateHistory.unshift(result);
      if (this.updateHistory.length > this.MAX_HISTORY_SIZE) {
        this.updateHistory.pop();
      }
      
      this.lastUpdateTime = startTime;
      
      console.log(`✅ Scheduled update completed: ${totalRecordsUpdated} records updated`);
      if (errors.length > 0) {
        console.error(`⚠️ Errors during update: ${errors.join('; ')}`);
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Error during scheduled update:', error);
      const result: UpdateResult = {
        success: false,
        recordsUpdated: totalRecordsUpdated,
        error: error.message || 'Unknown error during scheduled update',
        timestamp: startTime
      };
      
      await this.logUpdateResult('scheduled', result);
      this.updateHistory.unshift(result);
      
      return result;
    } finally {
      this.isUpdating = false;
      this.currentOperation = undefined;
    }
  }
  
  /**
   * Update current season fixtures
   */
  async updateCurrentFixtures(): Promise<UpdateResult> {
    const startTime = new Date();
    let recordsUpdated = 0;
    
    try {
      // Get fixtures for Premier League
      const plFixtures = await apiFootballService.getFixtures({
        league: this.PREMIER_LEAGUE_ID,
        season: this.CURRENT_SEASON,
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]   // Next 30 days
      });
      
      // Get fixtures for Champions League
      const clFixtures = await apiFootballService.getFixtures({
        league: this.CHAMPIONS_LEAGUE_ID,
        season: this.CURRENT_SEASON,
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      const allFixtures = [...plFixtures, ...clFixtures];
      
      // Update database
      for (const fixture of allFixtures) {
        await db.insert(footballFixtures)
          .values({
            id: fixture.fixture.id,
            referee: fixture.fixture.referee,
            timezone: fixture.fixture.timezone,
            timestamp: toSafeDate(fixture.fixture.date || fixture.fixture.timestamp),
            venue_id: fixture.fixture.venue?.id || null,
            venue_name: fixture.fixture.venue?.name || null,
            venue_city: fixture.fixture.venue?.city || null,
            status_long: fixture.fixture.status.long,
            status_short: fixture.fixture.status.short,
            status_elapsed: fixture.fixture.status.elapsed,
            league_id: fixture.league.id,
            season: fixture.league.season.toString(),
            round: fixture.league.round,
            home_team_id: fixture.teams.home.id,
            home_team_name: fixture.teams.home.name,
            home_team_logo: fixture.teams.home.logo,
            home_team_winner: fixture.teams.home.winner,
            away_team_id: fixture.teams.away.id,
            away_team_name: fixture.teams.away.name,
            away_team_logo: fixture.teams.away.logo,
            away_team_winner: fixture.teams.away.winner,
            goals_home: fixture.goals.home,
            goals_away: fixture.goals.away,
            score_halftime_home: fixture.score.halftime?.home || null,
            score_halftime_away: fixture.score.halftime?.away || null,
            score_fulltime_home: fixture.score.fulltime?.home || null,
            score_fulltime_away: fixture.score.fulltime?.away || null,
            score_extratime_home: fixture.score.extratime?.home || null,
            score_extratime_away: fixture.score.extratime?.away || null,
            score_penalty_home: fixture.score.penalty?.home || null,
            score_penalty_away: fixture.score.penalty?.away || null,
            updated_at: toSafeDateRequired(Date.now())
          })
          .onConflictDoUpdate({
            target: footballFixtures.id,
            set: {
              status_long: fixture.fixture.status.long,
              status_short: fixture.fixture.status.short,
              status_elapsed: fixture.fixture.status.elapsed,
              goals_home: fixture.goals.home,
              goals_away: fixture.goals.away,
              score_halftime_home: fixture.score.halftime?.home || null,
              score_halftime_away: fixture.score.halftime?.away || null,
              score_fulltime_home: fixture.score.fulltime?.home || null,
              score_fulltime_away: fixture.score.fulltime?.away || null,
              updated_at: toSafeDateRequired(Date.now())
            }
          });
        
        recordsUpdated++;
      }
      
      console.log(`✅ Updated ${recordsUpdated} fixtures`);
      
      return {
        success: true,
        recordsUpdated,
        timestamp: startTime
      };
    } catch (error: any) {
      console.error('❌ Error updating fixtures:', error);
      return {
        success: false,
        recordsUpdated,
        error: error.message || 'Failed to update fixtures',
        timestamp: startTime
      };
    }
  }
  
  /**
   * Update current standings
   */
  async updateCurrentStandings(): Promise<UpdateResult> {
    const startTime = new Date();
    let recordsUpdated = 0;
    
    try {
      // Get Premier League standings
      const plStandings = await apiFootballService.getStandings({
        league: this.PREMIER_LEAGUE_ID,
        season: this.CURRENT_SEASON
      });
      
      // Get Champions League standings
      const clStandings = await apiFootballService.getStandings({
        league: this.CHAMPIONS_LEAGUE_ID,
        season: this.CURRENT_SEASON
      });
      
      const allStandings = [...plStandings, ...clStandings];
      
      // Update database
      for (const leagueData of allStandings) {
        const standings = leagueData.league.standings[0] || [];
        
        for (const standing of standings) {
          await db.insert(footballStandings)
            .values({
              league_id: leagueData.league.id,
              season: leagueData.league.season.toString(),
              rank: standing.rank,
              team_id: standing.team.id,
              team_name: standing.team.name,
              points: standing.points,
              goals_diff: standing.goalsDiff,
              group: standing.group,
              form: standing.form,
              status: standing.status,
              description: standing.description,
              all_played: standing.all.played,
              all_win: standing.all.win,
              all_draw: standing.all.draw,
              all_lose: standing.all.lose,
              all_goals_for: standing.all.goals.for,
              all_goals_against: standing.all.goals.against,
              home_played: standing.home.played,
              home_win: standing.home.win,
              home_draw: standing.home.draw,
              home_lose: standing.home.lose,
              home_goals_for: standing.home.goals.for,
              home_goals_against: standing.home.goals.against,
              away_played: standing.away.played,
              away_win: standing.away.win,
              away_draw: standing.away.draw,
              away_lose: standing.away.lose,
              away_goals_for: standing.away.goals.for,
              away_goals_against: standing.away.goals.against,
              updated_at: toSafeDateRequired(Date.now())
            })
            .onConflictDoUpdate({
              target: [footballStandings.league_id, footballStandings.team_id, footballStandings.season],
              set: {
                rank: standing.rank,
                points: standing.points,
                goals_diff: standing.goalsDiff,
                form: standing.form,
                all_played: standing.all.played,
                all_win: standing.all.win,
                all_draw: standing.all.draw,
                all_lose: standing.all.lose,
                all_goals_for: standing.all.goals.for,
                all_goals_against: standing.all.goals.against,
                updated_at: toSafeDateRequired(Date.now())
              }
            });
          
          recordsUpdated++;
        }
      }
      
      console.log(`✅ Updated ${recordsUpdated} standings records`);
      
      return {
        success: true,
        recordsUpdated,
        timestamp: startTime
      };
    } catch (error: any) {
      console.error('❌ Error updating standings:', error);
      return {
        success: false,
        recordsUpdated,
        error: error.message || 'Failed to update standings',
        timestamp: startTime
      };
    }
  }
  
  /**
   * Update team statistics
   */
  async updateCurrentTeamStatistics(): Promise<UpdateResult> {
    const startTime = new Date();
    let recordsUpdated = 0;
    
    try {
      // Get all teams from Premier League and Champions League
      const teams = await db.select()
        .from(footballTeams)
        .limit(50); // Limit to avoid API rate limits
      
      for (const team of teams) {
        try {
          // Get team statistics for Premier League
          const plStats = await apiFootballService.getTeamStatistics({
            team: team.id,
            season: this.CURRENT_SEASON,
            league: this.PREMIER_LEAGUE_ID
          });
          
          if (plStats) {
            await db.insert(teamSeasonStatistics)
              .values({
                team_id: team.id,
                competition_id: this.PREMIER_LEAGUE_ID,
                season: this.CURRENT_SEASON.toString(),
                matches_played: plStats.fixtures.played.total,
                wins: plStats.fixtures.wins.total,
                draws: plStats.fixtures.draws.total,
                losses: plStats.fixtures.loses.total,
                goals_for: plStats.goals.for.total.total,
                goals_against: plStats.goals.against.total.total,
                clean_sheets: plStats.clean_sheet.total,
                form: plStats.form,
                avg_goals_scored: parseFloat(plStats.goals.for.average.total),
                avg_goals_conceded: parseFloat(plStats.goals.against.average.total),
                biggest_win_home: plStats.biggest.wins.home,
                biggest_win_away: plStats.biggest.wins.away,
                biggest_loss_home: plStats.biggest.loses.home,
                biggest_loss_away: plStats.biggest.loses.away,
                updated_at: toSafeDateRequired(Date.now())
              })
              .onConflictDoUpdate({
                target: [teamSeasonStatistics.team_id, teamSeasonStatistics.competition_id, teamSeasonStatistics.season],
                set: {
                  matches_played: plStats.fixtures.played.total,
                  wins: plStats.fixtures.wins.total,
                  draws: plStats.fixtures.draws.total,
                  losses: plStats.fixtures.loses.total,
                  goals_for: plStats.goals.for.total.total,
                  goals_against: plStats.goals.against.total.total,
                  clean_sheets: plStats.clean_sheet.total,
                  form: plStats.form,
                  updated_at: toSafeDateRequired(Date.now())
                }
              });
            
            recordsUpdated++;
          }
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (teamError) {
          console.error(`Error updating team ${team.name}:`, teamError);
        }
      }
      
      console.log(`✅ Updated ${recordsUpdated} team statistics`);
      
      return {
        success: true,
        recordsUpdated,
        timestamp: startTime
      };
    } catch (error: any) {
      console.error('❌ Error updating team statistics:', error);
      return {
        success: false,
        recordsUpdated,
        error: error.message || 'Failed to update team statistics',
        timestamp: startTime
      };
    }
  }
  
  /**
   * Update player statistics
   */
  async updateCurrentPlayerStatistics(): Promise<UpdateResult> {
    const startTime = new Date();
    let recordsUpdated = 0;
    
    try {
      // Get active players (limit to avoid API rate limits)
      const players = await db.select()
        .from(footballPlayers)
        .where(eq(footballPlayers.team_id, 40)) // Liverpool FC
        .limit(30);
      
      for (const player of players) {
        try {
          const playerStats = await apiFootballService.getPlayerStatistics({
            id: player.id,
            season: this.CURRENT_SEASON
          });
          
          if (playerStats && playerStats.length > 0) {
            const stats = playerStats[0].statistics[0];
            
            if (stats) {
              await db.insert(playerSeasonStatistics)
                .values({
                  player_id: player.id,
                  team_id: stats.team.id,
                  competition_id: stats.league.id,
                  season: this.CURRENT_SEASON.toString(),
                  appearances: stats.games.appearances || 0,
                  lineups: stats.games.lineups || 0,
                  minutes: stats.games.minutes || 0,
                  goals: stats.goals.total || 0,
                  assists: stats.goals.assists || 0,
                  yellow_cards: stats.cards.yellow || 0,
                  red_cards: stats.cards.red || 0,
                  rating: stats.games.rating ? parseFloat(stats.games.rating) : null,
                  shots_total: stats.shots.total || 0,
                  shots_on: stats.shots.on || 0,
                  passes_total: stats.passes.total || 0,
                  passes_key: stats.passes.key || 0,
                  passes_accuracy: stats.passes.accuracy || 0,
                  tackles_total: stats.tackles.total || 0,
                  duels_total: stats.duels.total || 0,
                  duels_won: stats.duels.won || 0,
                  dribbles_attempts: stats.dribbles.attempts || 0,
                  dribbles_success: stats.dribbles.success || 0,
                  fouls_drawn: stats.fouls.drawn || 0,
                  fouls_committed: stats.fouls.committed || 0,
                  updated_at: toSafeDateRequired(Date.now())
                })
                .onConflictDoUpdate({
                  target: [playerSeasonStatistics.player_id, playerSeasonStatistics.team_id, playerSeasonStatistics.season],
                  set: {
                    appearances: stats.games.appearances || 0,
                    minutes: stats.games.minutes || 0,
                    goals: stats.goals.total || 0,
                    assists: stats.goals.assists || 0,
                    yellow_cards: stats.cards.yellow || 0,
                    red_cards: stats.cards.red || 0,
                    rating: stats.games.rating ? parseFloat(stats.games.rating) : null,
                    updated_at: toSafeDateRequired(Date.now())
                  }
                });
              
              recordsUpdated++;
            }
          }
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (playerError) {
          console.error(`Error updating player ${player.name}:`, playerError);
        }
      }
      
      console.log(`✅ Updated ${recordsUpdated} player statistics`);
      
      return {
        success: true,
        recordsUpdated,
        timestamp: startTime
      };
    } catch (error: any) {
      console.error('❌ Error updating player statistics:', error);
      return {
        success: false,
        recordsUpdated,
        error: error.message || 'Failed to update player statistics',
        timestamp: startTime
      };
    }
  }
  
  /**
   * Update live matches
   */
  async updateLiveMatches(): Promise<UpdateResult> {
    const startTime = new Date();
    let recordsUpdated = 0;
    
    try {
      // Get live matches
      const liveMatches = await apiFootballService.getFixtures({
        live: 'all'
      });
      
      for (const match of liveMatches) {
        await db.update(footballFixtures)
          .set({
            status_long: match.fixture.status.long,
            status_short: match.fixture.status.short,
            status_elapsed: match.fixture.status.elapsed,
            goals_home: match.goals.home,
            goals_away: match.goals.away,
            updated_at: toSafeDateRequired(Date.now())
          })
          .where(eq(footballFixtures.id, match.fixture.id));
        
        recordsUpdated++;
      }
      
      console.log(`✅ Updated ${recordsUpdated} live matches`);
      
      return {
        success: true,
        recordsUpdated,
        timestamp: startTime
      };
    } catch (error: any) {
      console.error('❌ Error updating live matches:', error);
      return {
        success: false,
        recordsUpdated,
        error: error.message || 'Failed to update live matches',
        timestamp: startTime
      };
    }
  }
  
  /**
   * Manual update for specific resource
   */
  async manualUpdate(resource: string): Promise<UpdateResult> {
    if (this.isUpdating) {
      return {
        success: false,
        recordsUpdated: 0,
        error: 'Update already in progress',
        timestamp: new Date()
      };
    }
    
    this.isUpdating = true;
    const startTime = new Date();
    let result: UpdateResult;
    
    try {
      this.currentOperation = `manual-${resource}`;
      
      switch (resource) {
        case 'fixtures':
          result = await this.updateCurrentFixtures();
          break;
        case 'standings':
          result = await this.updateCurrentStandings();
          break;
        case 'teams':
          result = await this.updateCurrentTeamStatistics();
          break;
        case 'players':
          result = await this.updateCurrentPlayerStatistics();
          break;
        case 'live':
          result = await this.updateLiveMatches();
          break;
        case 'all':
          result = await this.runScheduledUpdate();
          break;
        default:
          result = {
            success: false,
            recordsUpdated: 0,
            error: `Unknown resource: ${resource}`,
            timestamp: startTime
          };
      }
      
      // Log manual update
      await this.logUpdateResult(`manual-${resource}`, result);
      
      return result;
    } catch (error: any) {
      console.error(`❌ Error during manual update of ${resource}:`, error);
      result = {
        success: false,
        recordsUpdated: 0,
        error: error.message || `Failed to update ${resource}`,
        timestamp: startTime
      };
      
      await this.logUpdateResult(`manual-${resource}`, result);
      
      return result;
    } finally {
      this.isUpdating = false;
      this.currentOperation = undefined;
    }
  }
  
  /**
   * Get current update status
   */
  getStatus(): UpdateStatus {
    return {
      isUpdating: this.isUpdating,
      lastUpdate: this.lastUpdateTime,
      nextScheduledUpdate: this.getNextScheduledUpdate(),
      updateHistory: this.updateHistory.slice(0, 10), // Last 10 updates
      currentOperation: this.currentOperation
    };
  }
  
  /**
   * Log update result to database
   */
  private async logUpdateResult(updateType: string, result: UpdateResult) {
    try {
      await db.insert(data_sync_logs).values({
        sync_type: updateType,
        resource_type: this.currentOperation || 'all',
        status: result.success ? 'success' : 'failed',
        records_affected: result.recordsUpdated,
        error_message: result.error,
        started_at: result.timestamp,
        completed_at: toSafeDateRequired(Date.now())
      });
    } catch (error) {
      console.error('Error logging update result:', error);
    }
  }
  
  /**
   * Stop all scheduled tasks
   */
  stop() {
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs = [];
    console.log('⏹️ Scheduled update service stopped');
  }
}

// Create singleton instance
export const scheduledUpdateService = new ScheduledUpdateService();