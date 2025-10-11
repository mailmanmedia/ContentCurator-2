import cron from 'node-cron';
import { db } from '../db';
import { teamSeasonStatistics, footballFixtures, footballPlayers, playerSeasonStatistics, footballTeams } from '@shared/schema';
import { eq, and, gte, lte, or, desc, sql, inArray } from 'drizzle-orm';
import { footballService } from './footballService';
import { sportmonksService } from './sportmonksService';
import { populateLiverpoolSquadFull } from './populateLiverpoolSquadFull';

export async function updateTeamStatistics(teamId: number, leagueId: number, season: number) {
  try {
    console.log(`Fetching statistics for team ${teamId} in league ${leagueId}, season ${season}`);
    
    // Try Sportmonks first if configured
    if (sportmonksService.isConfigured() && teamId === 40) {
      try {
        console.log('🏆 Using Sportmonks API for Liverpool statistics...');
        const seasonId = await sportmonksService.getCurrentSeasonId();
        if (seasonId) {
          const teamStats = await sportmonksService.getTeamStatistics(14, seasonId); // Liverpool team ID in Sportmonks
          // Process Sportmonks data and update database
          console.log('✓ Successfully fetched from Sportmonks');
          // TODO: Parse and save Sportmonks team statistics
          return;
        }
      } catch (sportmonksError) {
        console.warn('⚠️ Sportmonks API failed, falling back to Football API:', sportmonksError);
      }
    }
    
    // Fallback to original Football API
    const apiStats = await footballService.getTeamStatistics(teamId, leagueId, season);
    
    if (!apiStats || !apiStats.statistics) {
      console.log(`No API statistics available for team ${teamId}`);
      return;
    }

    const stats = apiStats.statistics;
    const findStat = (type: string) => {
      const stat = stats.find((s: any) => s.type.toLowerCase() === type.toLowerCase());
      return stat?.value;
    };

    const fixturesData = findStat('fixtures');
    const goalsData = findStat('goals');
    const cleanSheetData = findStat('clean sheet');
    const formValue = findStat('form');

    const matchesPlayed = fixturesData?.played?.total || 0;
    const wins = fixturesData?.wins?.total || 0;
    const draws = fixturesData?.draws?.total || 0;
    const losses = fixturesData?.loses?.total || 0;
    const goalsFor = goalsData?.for?.total?.total || 0;
    const goalsAgainst = goalsData?.against?.total?.total || 0;
    const cleanSheets = cleanSheetData?.total || 0;
    const form = formValue || null;

    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

    await db.insert(teamSeasonStatistics).values({
      teamId,
      leagueId,
      season,
      form,
      matchesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      cleanSheets,
      lastUpdated: new Date()
    }).onConflictDoUpdate({
      target: [teamSeasonStatistics.teamId, teamSeasonStatistics.leagueId, teamSeasonStatistics.season],
      set: {
        form,
        matchesPlayed,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        cleanSheets,
        lastUpdated: new Date()
      }
    });

    console.log(`✓ Updated statistics for team ${teamId}: ${matchesPlayed}P ${wins}W ${draws}D ${losses}L, ${goalsFor}-${goalsAgainst} goals, ${cleanSheets} clean sheets, Win rate: ${winRate}%`);
  } catch (error) {
    console.error(`Error updating statistics for team ${teamId}:`, error);
  }
}

export async function updateAllPremierLeagueStats(): Promise<{ success: boolean; teamsUpdated: number; errors: number }> {
  console.log('\n⚽ Starting batch update for all Premier League teams...');
  
  // Premier League team IDs
  const premierLeagueTeamIds = [33, 34, 35, 36, 38, 39, 40, 41, 42, 45, 46, 47, 48, 49, 50, 51, 52, 55, 66, 71];
  const leagueId = 39; // Premier League
  const leagueName = "Premier League";
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Use most recent completed season
  const currentSeason = (currentMonth >= 8 && currentMonth <= 10) ? currentYear - 1 : currentYear;
  
  console.log(`Fetching Premier League stats for season ${currentSeason}`);
  
  // Fetch team names from database
  const teams = await db
    .select({
      id: footballTeams.id,
      name: footballTeams.name
    })
    .from(footballTeams)
    .where(inArray(footballTeams.id, premierLeagueTeamIds));
  
  const teamMap = new Map(teams.map(t => [t.id, t.name]));
  
  let teamsUpdated = 0;
  let errors = 0;
  
  for (const teamId of premierLeagueTeamIds) {
    try {
      const teamName = teamMap.get(teamId) || `Team ${teamId}`;
      console.log(`\n📊 Updating ${teamName} (${teamId})...`);
      
      // Try API first
      await updateTeamStatistics(teamId, leagueId, currentSeason);
      
      // Verify stats were actually saved - re-query database
      const verifyStats = await db
        .select()
        .from(teamSeasonStatistics)
        .where(
          and(
            eq(teamSeasonStatistics.teamId, teamId),
            eq(teamSeasonStatistics.leagueId, leagueId),
            eq(teamSeasonStatistics.season, currentSeason)
          )
        )
        .limit(1);
      
      if (verifyStats.length === 0) {
        console.log(`⚠️ No stats available for ${teamName} from any source`);
        errors++;
      } else {
        console.log(`✓ ${teamName} stats verified in database`);
        teamsUpdated++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to update team ${teamId}: ${errorMessage}`);
      errors++;
    }
  }
  
  console.log(`\n✅ Batch update complete: ${teamsUpdated} teams updated, ${errors} errors`);
  
  return {
    success: teamsUpdated > 0,
    teamsUpdated,
    errors
  };
}

async function updateLiverpoolPlayerStats() {
  console.log('\n👥 Updating Liverpool player statistics...');
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Use most recent completed season for player stats
  const currentSeason = (currentMonth >= 8 && currentMonth <= 10) ? currentYear - 1 : currentYear;
  
  try {
    // Try Sportmonks first if configured
    if (sportmonksService.isConfigured()) {
      try {
        console.log('🏆 Using Sportmonks API for player statistics...');
        const seasonId = await sportmonksService.getCurrentSeasonId();
        if (seasonId) {
          const players = await sportmonksService.getLiverpoolSquad(seasonId);
          
          // Update each player's statistics
          for (const player of players) {
            const mappedPlayer = sportmonksService.mapPlayerToDatabase(player, currentSeason);
            
            await db.insert(playerSeasonStatistics).values({
              playerId: mappedPlayer.playerId,
              teamId: 40, // Liverpool team ID
              leagueId: 39, // Premier League
              season: mappedPlayer.season,
              appearances: mappedPlayer.appearances,
              goals: mappedPlayer.goals,
              assists: mappedPlayer.assists,
              yellowCards: mappedPlayer.yellowCards,
              redCards: mappedPlayer.redCards,
              minutes: mappedPlayer.minutes,
              rating: mappedPlayer.rating,
              lastUpdated: mappedPlayer.lastUpdated
            }).onConflictDoUpdate({
              target: [playerSeasonStatistics.playerId, playerSeasonStatistics.teamId, playerSeasonStatistics.leagueId, playerSeasonStatistics.season],
              set: {
                appearances: mappedPlayer.appearances,
                goals: mappedPlayer.goals,
                assists: mappedPlayer.assists,
                yellowCards: mappedPlayer.yellowCards,
                redCards: mappedPlayer.redCards,
                minutes: mappedPlayer.minutes,
                rating: mappedPlayer.rating,
                lastUpdated: new Date()
              }
            });
          }
          
          console.log(`✓ Updated ${players.length} Liverpool players from Sportmonks`);
          return;
        }
      } catch (sportmonksError) {
        console.warn('⚠️ Sportmonks API failed, falling back to Football API:', sportmonksError);
      }
    }
    
    // Fallback to full squad population method
    const result = await populateLiverpoolSquadFull(currentSeason);
    if (result.success) {
      console.log(`✓ Liverpool player statistics updated successfully (${result.playersPopulated} players)`);
    } else {
      console.log('⚠️  Failed to update Liverpool player statistics');
    }
  } catch (error) {
    console.error('❌ Error updating Liverpool player statistics:', error);
  }
}

async function updateLiverpoolStats() {
  console.log('\n⚽ Updating Liverpool statistics...');
  
  const liverpoolTeamId = 40;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // For statistics, use the most recent completed season
  // If we're early in the season (Aug-Oct), use previous year's data
  // as current season data may be incomplete
  const statsSeason = (currentMonth >= 8 && currentMonth <= 10) ? currentYear - 1 : currentYear;
  
  const targetLeagues = [39, 2, 3, 45, 48];
  
  console.log(`Fetching statistics for season ${statsSeason} (current date: ${now.toISOString().split('T')[0]})`);
  
  for (const leagueId of targetLeagues) {
    await updateTeamStatistics(liverpoolTeamId, leagueId, statsSeason);
  }
  
  await updateLiverpoolPlayerStats();
}

const scheduledFixtures = new Set<number>();

async function schedulePostMatchUpdates() {
  const liverpoolTeamId = 40;
  const currentSeason = new Date().getFullYear();
  
  const now = new Date();
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  try {
    const upcomingFixtures = await db
      .select()
      .from(footballFixtures)
      .where(
        and(
          or(
            eq(footballFixtures.home_team_id, liverpoolTeamId),
            eq(footballFixtures.away_team_id, liverpoolTeamId)
          ),
          eq(footballFixtures.season, currentSeason),
          gte(footballFixtures.date, now),
          lte(footballFixtures.date, next48Hours)
        )
      );

    for (const fixture of upcomingFixtures) {
      if (scheduledFixtures.has(fixture.id)) {
        continue;
      }
      
      const fixtureDate = new Date(fixture.date);
      const matchDurationMinutes = 105;
      const updateTime = new Date(fixtureDate.getTime() + (matchDurationMinutes + 120) * 60 * 1000);
      
      if (updateTime > now) {
        const delayMs = updateTime.getTime() - now.getTime();
        
        if (delayMs < 2147483647) {
          setTimeout(async () => {
            console.log(`\n⚽ Running post-match statistics update (2 hours after fixture ${fixture.id})...`);
            await updateLiverpoolStats();
            scheduledFixtures.delete(fixture.id);
          }, delayMs);
          
          scheduledFixtures.add(fixture.id);
          console.log(`✓ Scheduled post-match update for fixture ${fixture.id} at ${updateTime.toUTCString()}`);
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling post-match updates:', error);
  }
}

export function initializeStatsScheduler() {
  console.log('📅 Initializing football statistics scheduler...');
  
  cron.schedule('0 2 * * *', async () => {
    console.log('\n🌅 Running daily statistics update at 2 AM...');
    await updateLiverpoolStats();
    await schedulePostMatchUpdates();
  });

  setTimeout(async () => {
    console.log('\n🚀 Running initial statistics check on startup...');
    await updateLiverpoolStats();
    await schedulePostMatchUpdates();
  }, 5000);

  console.log('✓ Football statistics scheduler initialized');
  console.log('  - Daily update at 2 AM');
  console.log('  - Post-match updates 2 hours after Liverpool fixtures');
  console.log('  - Initial check on startup (5 seconds delay)');
}
