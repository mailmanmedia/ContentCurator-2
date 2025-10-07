import cron from 'node-cron';
import { db } from '../db';
import { teamSeasonStatistics, footballFixtures, footballPlayers, playerSeasonStatistics } from '@shared/schema';
import { eq, and, gte, lte, or, desc, sql } from 'drizzle-orm';
import { footballService } from './footballService';
import { sportmonksService } from './sportmonksService';
import { updateLiverpoolStatsWithAI } from './aiStatsService';
import { populateLiverpoolPlayers } from './populateLiverpoolPlayers';

async function updateTeamStatistics(teamId: number, leagueId: number, season: number) {
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
      
      if (teamId === 40 && leagueId === 39) {
        console.log('🤖 Attempting to fetch Liverpool stats using AI...');
        const aiSuccess = await updateLiverpoolStatsWithAI();
        if (aiSuccess) {
          console.log('✓ AI successfully updated Liverpool statistics');
          return;
        }
      }
      
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

async function updateLiverpoolPlayerStats() {
  console.log('\n👥 Updating Liverpool player statistics...');
  
  const currentSeason = new Date().getFullYear();
  
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
            
            await db.insert(playerSeasonStatistics).values(mappedPlayer)
              .onConflictDoUpdate({
                target: [playerSeasonStatistics.playerId, playerSeasonStatistics.season],
                set: {
                  ...mappedPlayer,
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
    
    // Fallback to original method
    const success = await populateLiverpoolPlayers(currentSeason);
    if (success) {
      console.log('✓ Liverpool player statistics updated successfully');
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
  const currentSeason = new Date().getFullYear();
  
  const targetLeagues = [39, 2, 3, 45, 48];
  
  for (const leagueId of targetLeagues) {
    await updateTeamStatistics(liverpoolTeamId, leagueId, currentSeason);
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
            eq(footballFixtures.homeTeamId, liverpoolTeamId),
            eq(footballFixtures.awayTeamId, liverpoolTeamId)
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
