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

  // If the current month is before July (month 7), the season is the previous year's
  // For example, if it's June 2025, the season is 2024-25.
  // If it's July 2025, the season is 2025-26.
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
      console.log(`Fetching additional H2H data from API for Liverpool vs ${opponent.name}`);
      try {
        const currentSeason = getCurrentSeason();
        // Fetch data for the current season and the 3 preceding seasons
        const seasonsToFetch = [currentSeason, currentSeason - 1, currentSeason - 2, currentSeason - 3];

        for (const season of seasonsToFetch) {
          const apiFixtures = await apiFootballService.fetchFixturesByTeam({
            season,
            team: liverpoolId,
            status: 'FT' // Fetch only finished fixtures
          });

          const h2hApiMatches = apiFixtures.filter((f: any) =>
            (f.teams.home.id === liverpoolId && f.teams.away.id === opponentId) ||
            (f.teams.home.id === opponentId && f.teams.away.id === liverpoolId)
          );

          // Add to database for future use
          for (const match of h2hApiMatches) {
            const fixtureDate = new Date(match.fixture.date);
            const timestampValue = match.fixture.timestamp || Math.floor(fixtureDate.getTime() / 1000);
            
            await db.insert(footballFixtures).values({
              id: match.fixture.id,
              referee: match.fixture.referee || null,
              timezone: match.fixture.timezone || 'UTC',
              date: fixtureDate,
              timestamp: timestampValue,
              periods: JSON.stringify(match.fixture.periods || {}),
              venue: JSON.stringify(match.fixture.venue || {}),
              status: JSON.stringify(match.fixture.status || {}),
              league_id: match.league.id,
              season: match.league.season,
              round: match.league.round || null,
              home_team_id: match.teams.home.id,
              away_team_id: match.teams.away.id,
              goals: JSON.stringify(match.goals || {}),
              score: JSON.stringify(match.score || {}),
              status_short: match.fixture.status?.short || null,
              last_updated: new Date()
            }).onConflictDoNothing();
          }
        }

        // Re-query database after potential inserts
        allMatches = await db.select()
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
      } catch (apiError) {
        console.error(`API fetch failed for ${opponent.name}:`, apiError);
      }
    }

    // Transform to H2H format
    const matches: H2HMatch[] = allMatches.map(match => {
      // Parse JSON fields safely - they might already be objects
      let venueData = null;
      let goalsData = null;
      
      try {
        venueData = typeof match.venue === 'string' ? JSON.parse(match.venue) : match.venue;
      } catch (e) {
        venueData = null;
      }
      
      try {
        goalsData = typeof match.goals === 'string' ? JSON.parse(match.goals) : match.goals;
      } catch (e) {
        goalsData = null;
      }
      
      return {
        fixtureId: match.id,
        date: match.date?.toISOString() || new Date().toISOString(),
        season: match.season || getCurrentSeason(),
        competition: match.league_id === 39 ? 'Premier League' :
                     match.league_id === 2 ? 'Champions League' :
                     match.league_id === 3 ? 'Europa League' :
                     match.league_id === 45 ? 'FA Cup' :
                     match.league_id === 48 ? 'League Cup' : 'Unknown',
        competitionId: match.league_id,
        venue: venueData?.name || '',
        homeTeamId: match.home_team_id,
        homeTeamName: 'Home Team',
        awayTeamId: match.away_team_id,
        awayTeamName: 'Away Team',
        homeScore: goalsData?.home ?? null,
        awayScore: goalsData?.away ?? null,
        status: match.status_short || 'NS',
        round: match.round || undefined
      };
    });

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
    // Get all players
    const allPlayers = await db.select()
      .from(footballPlayers);

    // Get stats for Liverpool players for the current season
    const liverpoolStats = await db.select()
      .from(playerSeasonStatistics)
      .where(
        and(
          eq(playerSeasonStatistics.team_id, liverpoolId),
          eq(playerSeasonStatistics.season, currentSeason)
        )
      );

    // Create map of player_id to stats for quick lookup
    const statsMap = new Map<number, typeof playerSeasonStatistics.$inferSelect>();
    liverpoolStats.forEach(stat => {
      if (stat.player_id) {
        statsMap.set(stat.player_id, stat);
      }
    });

    // Filter players who have Liverpool stats this season
    const liverpoolPlayerIds = new Set(liverpoolStats.map(s => s.player_id).filter((id): id is number => id !== null));
    const liverpoolPlayers = allPlayers.filter(p => p.player_id && liverpoolPlayerIds.has(p.player_id));

    return liverpoolPlayers.map(player => {
      const stat = player.player_id ? statsMap.get(player.player_id) : null;
      return {
        id: player.player_id || player.id, // Use player_id if available, otherwise fallback to id
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
  // List of opponent team IDs for Premier League
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

    // Rate limit delay to avoid hitting API limits
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