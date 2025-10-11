
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { footballTeams, footballFixtures, footballPlayers, playerSeasonStatistics } from '@shared/schema';
import { eq, and, or, desc, inArray } from 'drizzle-orm';
import { apiFootballService } from '../football/apiFootballService';

interface H2HMatch {
  fixtureId: number;
  date: string;
  season: number;
  competition: string;
  competitionId: number;
  venue: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  round?: string;
}

interface OpponentH2H {
  opponentId: number;
  opponentName: string;
  opponentLogo: string;
  matches: H2HMatch[];
  record: {
    wins: number;
    draws: number;
    losses: number;
  };
}

interface PlayerData {
  id: number;
  name: string;
  photo: string;
  position?: string;
  number?: number;
  statistics?: {
    season: number;
    goals: number;
    assists: number;
    appearances: number;
    minutes: number;
    rating: string | null;
  };
}

interface H2HExport {
  version: string;
  lastUpdated: string;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  headToHead: OpponentH2H[];
  currentSquad: PlayerData[];
}

/**
 * Get current season dynamically
 */
function getCurrentSeason(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (currentMonth < 7) {
    return currentYear - 1;
  } else {
    return currentYear;
  }
}

/**
 * Fetch H2H data for Liverpool vs a specific opponent
 */
async function fetchH2HData(liverpoolId: number, opponentId: number): Promise<OpponentH2H | null> {
  try {
    // Get opponent details
    const opponents = await db.select()
      .from(footballTeams)
      .where(eq(footballTeams.id, opponentId))
      .limit(1);

    if (opponents.length === 0) {
      console.warn(`Opponent ${opponentId} not found`);
      return null;
    }
    
    const opponent = opponents[0];

    // Fetch matches from database (all seasons, all competitions)
    const dbMatches = await db.select()
      .from(footballFixtures)
      .where(
        or(
          and(
            eq(footballFixtures.home_team_id, liverpoolId),
            eq(footballFixtures.away_team_id, opponentId)
          ),
          and(
            eq(footballFixtures.home_team_id, opponentId),
            eq(footballFixtures.away_team_id, liverpoolId)
          )
        )
      )
      .orderBy(desc(footballFixtures.timestamp))
      .limit(30);

    // If insufficient database data, try API
    let allMatches = dbMatches;
    if (dbMatches.length < 10) {
      console.log(`Fetching additional H2H data from API for Liverpool vs ${opponent[0].name}`);
      try {
        const currentSeason = getCurrentSeason();
        const seasons = [currentSeason, currentSeason - 1, currentSeason - 2, currentSeason - 3];
        
        for (const season of seasons) {
          const apiFixtures = await apiFootballService.fetchFixturesByTeam({
            season,
            team: liverpoolId,
            status: 'FT'
          });

          const h2hApiMatches = apiFixtures.filter((f: any) =>
            (f.teams.home.id === liverpoolId && f.teams.away.id === opponentId) ||
            (f.teams.home.id === opponentId && f.teams.away.id === liverpoolId)
          );

          // Add to database for future use
          for (const match of h2hApiMatches) {
            await db.insert(footballFixtures).values({
              id: match.fixture.id,
              referee: match.fixture.referee,
              timezone: match.fixture.timezone,
              timestamp: new Date(match.fixture.date),
              venue_id: match.fixture.venue?.id || null,
              venue_name: match.fixture.venue?.name || null,
              venue_city: match.fixture.venue?.city || null,
              status_long: match.fixture.status.long,
              status_short: match.fixture.status.short,
              status_elapsed: match.fixture.status.elapsed,
              league_id: match.league.id,
              season: match.league.season.toString(),
              round: match.league.round,
              home_team_id: match.teams.home.id,
              home_team_name: match.teams.home.name,
              home_team_logo: match.teams.home.logo,
              home_team_winner: match.teams.home.winner,
              away_team_id: match.teams.away.id,
              away_team_name: match.teams.away.name,
              away_team_logo: match.teams.away.logo,
              away_team_winner: match.teams.away.winner,
              goals_home: match.goals.home,
              goals_away: match.goals.away,
              score_halftime_home: match.score.halftime?.home || null,
              score_halftime_away: match.score.halftime?.away || null,
              score_fulltime_home: match.score.fulltime?.home || null,
              score_fulltime_away: match.score.fulltime?.away || null,
              updated_at: new Date()
            }).onConflictDoNothing();
          }
        }

        // Re-query database
        allMatches = await db.select()
          .from(footballFixtures)
          .where(
            or(
              and(
                eq(footballFixtures.homeTeamId, liverpoolId),
                eq(footballFixtures.awayTeamId, opponentId)
              ),
              and(
                eq(footballFixtures.homeTeamId, opponentId),
                eq(footballFixtures.awayTeamId, liverpoolId)
              )
            )
          )
          .orderBy(desc(footballFixtures.timestamp))
          .limit(30);
      } catch (apiError) {
        console.error(`API fetch failed for ${opponent[0].name}:`, apiError);
      }
    }

    // Transform to H2H format
    const matches: H2HMatch[] = allMatches.map(match => ({
      fixtureId: match.id,
      date: match.timestamp?.toISOString() || new Date().toISOString(),
      season: parseInt(match.season) || getCurrentSeason(),
      competition: match.league_id === 39 ? 'Premier League' : 
                   match.league_id === 2 ? 'Champions League' :
                   match.league_id === 3 ? 'Europa League' :
                   match.league_id === 45 ? 'FA Cup' :
                   match.league_id === 48 ? 'League Cup' : 'Unknown',
      competitionId: match.league_id,
      venue: typeof match.venue === 'object' ? match.venue?.name || '' : match.venue || '',
      homeTeamId: match.home_team_id,
      homeTeamName: match.home_team_name || '',
      awayTeamId: match.away_team_id,
      awayTeamName: match.away_team_name || '',
      homeScore: match.goals_home ?? null,
      awayScore: match.goals_away ?? null,
      status: match.status?.short || 'NS',
      round: match.round || undefined
    }));

    // Calculate record (Liverpool's perspective)
    let wins = 0;
    let draws = 0;
    let losses = 0;

    matches.forEach(match => {
      if (match.homeScore === null || match.awayScore === null) return;
      
      const isLiverpoolHome = match.homeTeamId === liverpoolId;
      const liverpoolScore = isLiverpoolHome ? match.homeScore : match.awayScore;
      const opponentScore = isLiverpoolHome ? match.awayScore : match.homeScore;

      if (liverpoolScore > opponentScore) wins++;
      else if (liverpoolScore < opponentScore) losses++;
      else draws++;
    });

    return {
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentLogo: opponent.logo,
      matches,
      record: { wins, draws, losses }
    };
  } catch (error) {
    console.error(`Error fetching H2H for opponent ${opponentId}:`, error);
    return null;
  }
}

/**
 * Fetch Liverpool's current squad with statistics
 */
async function fetchLiverpoolSquad(liverpoolId: number): Promise<PlayerData[]> {
  const currentSeason = getCurrentSeason();
  
  try {
    // Get all players (football_players table doesn't have teamId, so get all and filter via stats)
    const allPlayers = await db.select()
      .from(footballPlayers);

    // Get stats for Liverpool players (player_season_statistics has team_id)
    const liverpoolStats = await db.select()
      .from(playerSeasonStatistics)
      .where(
        and(
          eq(playerSeasonStatistics.team_id, liverpoolId),
          eq(playerSeasonStatistics.season, currentSeason)
        )
      );
    
    // Create map of player_id to stats
    const statsMap = new Map();
    liverpoolStats.forEach(stat => {
      statsMap.set(stat.player_id, stat);
    });

    // Filter players who have Liverpool stats this season
    const liverpoolPlayerIds = new Set(liverpoolStats.map(s => s.player_id));
    const liverpoolPlayers = allPlayers.filter(p => p.player_id && liverpoolPlayerIds.has(p.player_id));

    return liverpoolPlayers.map(player => {
      const stat = player.player_id ? statsMap.get(player.player_id) : null;
      return {
        id: player.player_id || player.id,
        name: player.name,
        photo: player.photo || '',
        position: player.position || undefined,
        number: player.jersey_number || undefined,
        statistics: stat ? {
          season: currentSeason,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          appearances: stat.appearances || 0,
          minutes: stat.minutes || 0,
          rating: stat.rating?.toString() || null
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching Liverpool squad:', error);
    return [];
  }
}

/**
 * Main export function
 */
async function exportH2HJson() {
  console.log('🚀 Starting H2H JSON export...');
  
  const LIVERPOOL_ID = 40;
  const PREMIER_LEAGUE_OPPONENTS = [
    33, 50, 42, 49, 47, 34, 66, 48, 35, 36, 
    51, 52, 39, 41, 46, 55, 65, 57, 45
  ];

  const exportData: H2HExport = {
    version: '2.0',
    lastUpdated: new Date().toISOString(),
    team: {
      id: LIVERPOOL_ID,
      name: 'Liverpool',
      logo: 'https://media.api-sports.io/football/teams/40.png'
    },
    headToHead: [],
    currentSquad: []
  };

  // Fetch H2H data for all opponents
  console.log('📊 Fetching H2H data for all opponents...');
  for (const opponentId of PREMIER_LEAGUE_OPPONENTS) {
    const h2hData = await fetchH2HData(LIVERPOOL_ID, opponentId);
    if (h2hData) {
      exportData.headToHead.push(h2hData);
      console.log(`✓ Fetched ${h2hData.matches.length} matches vs ${h2hData.opponentName}`);
    }
    
    // Rate limit delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Fetch Liverpool squad
  console.log('👥 Fetching Liverpool squad...');
  exportData.currentSquad = await fetchLiverpoolSquad(LIVERPOOL_ID);
  console.log(`✓ Fetched ${exportData.currentSquad.length} players`);

  // Write to file
  const outputPath = path.join(process.cwd(), 'server', 'data', 'historical_h2h.json');
  await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));

  console.log(`\n✅ Export complete!`);
  console.log(`📁 File: ${outputPath}`);
  console.log(`📊 Opponents: ${exportData.headToHead.length}`);
  console.log(`👥 Squad: ${exportData.currentSquad.length} players`);
  console.log(`🕐 Last updated: ${exportData.lastUpdated}`);
  console.log(`📅 Current season: ${getCurrentSeason()}`);
}

// Run export
exportH2HJson()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Export failed:', error);
    process.exit(1);
  });
