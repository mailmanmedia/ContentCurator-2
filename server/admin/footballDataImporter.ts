import { db } from '../db';
import { 
  football_players, 
  football_teams, 
  football_player_statistics,
  football_leagues,
  type InsertFootballPlayer,
  type InsertFootballPlayerStatistics,
  type InsertFootballTeam
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface FBrefPlayerData {
  player: string;
  nationality?: string;
  position?: string;
  age?: string;
  games?: string;
  games_starts?: string;
  minutes?: string;
  goals?: string;
  assists?: string;
  [key: string]: string | undefined;
}

// Map FBref field names to database field names
// Multi-table parser extracts 160+ fields from 11 FBref tables
// Mapping to 42 schema columns where data is available
const FIELD_MAPPING: Record<string, string> = {
  // Basic stats
  games: 'games_appearances',
  games_starts: 'games_lineups',
  minutes: 'games_minutes',
  position: 'games_position',
  games_subs: 'substitutes_in',
  unused_subs: 'substitutes_bench',
  
  // Shooting
  shots: 'shots_total',
  shots_on_target: 'shots_on',
  
  // Goals and assists
  goals: 'goals_total',
  assists: 'goals_assists',
  
  // Passing
  passes: 'passes_total',
  passes_into_final_third: 'passes_key', // Approximation for key passes
  passes_pct: 'passes_accuracy',
  
  // Defensive
  tackles: 'tackles_total',
  blocks: 'tackles_blocks',
  interceptions: 'tackles_interceptions',
  
  // Duels and dribbles
  challenges: 'duels_total',
  take_ons: 'dribbles_attempts',
  take_ons_won: 'dribbles_success',
  
  // Fouls
  fouled: 'fouls_drawn',
  fouls: 'fouls_committed',
  
  // Cards
  cards_yellow: 'cards_yellow',
  cards_yellow_red: 'cards_yellowred',
  cards_red: 'cards_red',
  
  // Penalties
  pens_won: 'penalty_won',
  pens_conceded: 'penalty_committed',
  pens_made: 'penalty_scored'
  
  // NOTE: Some calculated fields:
  // - duels_won: calculated from (challenges - challenges_lost) in mapFBrefDataToStats
  // - penalty_missed: calculated from (pens_att - pens_made) in mapFBrefDataToStats
  // - dribbles_past: not directly available in FBref
  // - substitutes_out: not clearly distinguished in FBref
  // - goals_saves: goalkeeper-only stat
  // - games_rating, games_captain: not in FBref
};

function parseNumber(value: string | undefined): number | undefined {
  if (!value || value === '') return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num; // Preserve decimals for real-type fields
}

function parseInteger(value: string | undefined): number | undefined {
  if (!value || value === '') return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : Math.floor(num); // Floor for integer fields only
}

function cleanNationality(nationality: string | undefined): string | undefined {
  if (!nationality) return undefined;
  // FBref format: "ng NGA" -> "NGA" or "England" -> "England"
  const parts = nationality.trim().split(' ');
  return parts[parts.length - 1]; // Return last part (country code or name)
}

async function findOrCreateTeam(teamName: string): Promise<number> {
  // Try to find existing team
  const existing = await db
    .select()
    .from(football_teams)
    .where(eq(football_teams.name, teamName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new team
  const newTeam: InsertFootballTeam = {
    name: teamName,
    country: 'England',
    logo: null
  };

  const inserted = await db.insert(football_teams).values(newTeam).returning({ id: football_teams.id });
  if (!inserted[0]) {
    throw new Error('Failed to create team');
  }
  return inserted[0].id;
}

async function findOrCreatePlayer(data: FBrefPlayerData, teamId: number): Promise<number> {
  const playerName = data.player.trim();
  
  // Try to find existing player by name
  // NOTE: This is a simple name match - may need enhancement for cross-team scenarios
  // Future improvement: Check player_id, team history, or nationality for better matching
  const existing = await db
    .select()
    .from(football_players)
    .where(eq(football_players.name, playerName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new player
  const newPlayer: InsertFootballPlayer = {
    name: playerName,
    nationality: cleanNationality(data.nationality),
    position: data.position || null,
    age: parseInteger(data.age) || null,
    player_id: null,
    firstname: null,
    lastname: null,
    birth_date: null,
    birth_place: null,
    birth_country: null,
    height: null,
    weight: null,
    photo: null,
    jersey_number: null,
    injured: false
  };

  const inserted = await db.insert(football_players).values(newPlayer).returning({ id: football_players.id });
  if (!inserted[0]) {
    throw new Error('Failed to create player');
  }
  return inserted[0].id;
}

async function findOrCreateLeague(leagueName: string, season: string): Promise<number> {
  // Try to find existing league
  const existing = await db
    .select()
    .from(football_leagues)
    .where(and(
      eq(football_leagues.name, leagueName),
      eq(football_leagues.season, season)
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new league
  console.log('💾 Creating league:', { name: leagueName, country: 'England', season, logo: null });
  const inserted = await db.insert(football_leagues).values({
    name: leagueName,
    country: 'England',
    season: season,
    logo: null
  }).returning({ id: football_leagues.id });
  console.log('✅ League created with ID:', inserted[0]?.id);

  if (!inserted[0]) {
    throw new Error('Failed to create league');
  }
  return inserted[0].id;
}

// Define which fields are strings vs numbers
const STRING_FIELDS = new Set(['games_position']);

function mapFBrefDataToStats(data: FBrefPlayerData): Partial<InsertFootballPlayerStatistics> {
  const stats: any = {};

  // Map all FBref fields to database fields
  Object.keys(data).forEach(key => {
    const dbField = FIELD_MAPPING[key];
    if (dbField) {
      // Handle string fields (like position) separately from numeric fields
      if (STRING_FIELDS.has(dbField)) {
        const value = data[key];
        if (value && value.trim()) {
          stats[dbField] = value.trim();
        }
      } else {
        const value = parseNumber(data[key]);
        if (value !== undefined) {
          stats[dbField] = value;
        }
      }
    }
  });

  // Calculate derived fields
  
  // duels_won = challenges - challenges_lost
  if (data.challenges && data.challenges_lost) {
    const challenges = parseNumber(data.challenges);
    const challengesLost = parseNumber(data.challenges_lost);
    if (challenges !== undefined && challengesLost !== undefined) {
      stats.duels_won = challenges - challengesLost;
    }
  }
  
  // penalty_missed = pens_att - pens_made
  if (data.pens_att && data.pens_made) {
    const attempts = parseNumber(data.pens_att);
    const scored = parseNumber(data.pens_made);
    if (attempts !== undefined && scored !== undefined) {
      stats.penalty_missed = attempts - scored;
    }
  }

  return stats;
}

export async function importFBrefPlayers(
  players: FBrefPlayerData[],
  options: {
    teamName: string;
    season: string;
    leagueName?: string;
  }
): Promise<{ imported: number; updated: number; errors: string[] }> {
  const results = {
    imported: 0,
    updated: 0,
    errors: [] as string[]
  };

  try {
    // Find or create team
    const teamId = await findOrCreateTeam(options.teamName);
    
    // Find or create league (default to "All Competitions")
    const leagueName = options.leagueName || 'All Competitions';
    const leagueId = await findOrCreateLeague(leagueName, options.season);

    // Process each player
    for (const playerData of players) {
      try {
        // Find or create player
        const playerId = await findOrCreatePlayer(playerData, teamId);

        // Map stats
        const statsData = mapFBrefDataToStats(playerData);

        // Check if stats already exist for this player/season/league
        const existingStats = await db
          .select()
          .from(football_player_statistics)
          .where(and(
            eq(football_player_statistics.player_id, playerId),
            eq(football_player_statistics.season, options.season),
            eq(football_player_statistics.league_id, leagueId)
          ))
          .limit(1);

        if (existingStats.length > 0) {
          // Update existing stats
          await db
            .update(football_player_statistics)
            .set({
              ...statsData,
              team_id: teamId,
              updated_at: new Date()
            })
            .where(eq(football_player_statistics.id, existingStats[0].id));

          results.updated++;
        } else {
          // Insert new stats
          await db.insert(football_player_statistics).values({
            player_id: playerId,
            team_id: teamId,
            league_id: leagueId,
            season: options.season,
            ...statsData
          });

          results.imported++;
        }
      } catch (error) {
        const errorMsg = `Failed to import ${playerData.player}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return results;
  } catch (error) {
    results.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return results;
  }
}
