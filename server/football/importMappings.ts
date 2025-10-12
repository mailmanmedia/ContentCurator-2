
import { db } from '../db';
import { football_teams, football_leagues } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

// Column mapping from Excel headers to database fields
export const COLUMN_MAPPINGS = {
  // Team/Player Stats columns
  'Player': 'player_name',
  'Nation': 'nationality',
  'Pos': 'position',
  'Age': 'age',
  'MP': 'matches_played',
  'Starts': 'starts',
  'Min': 'minutes',
  'Gls': 'goals',
  'Ast': 'assists',
  'G+A': 'goals_assists',
  'G-PK': 'goals_non_penalty',
  'PK': 'penalty_goals',
  'PKatt': 'penalty_attempts',
  'CrdY': 'yellow_cards',
  'CrdR': 'red_cards',
  
  // Fixtures columns
  'Date': 'fixture_date',
  'Time': 'fixture_time',
  'Comp': 'competition',
  'Round': 'round',
  'Day': 'day_of_week',
  'Venue': 'venue_type',
  'Result': 'result',
  'GF': 'goals_for',
  'GA': 'goals_against',
  'Opponent': 'opponent_name',
  'xG': 'expected_goals',
  'xGA': 'expected_goals_against',
  'Poss': 'possession',
  'Attendance': 'attendance',
  'Captain': 'captain',
  'Formation': 'formation',
  'Referee': 'referee',
  
  // Standings columns
  'Squad': 'team_name',
  'MP': 'matches_played',
  'W': 'wins',
  'D': 'draws',
  'L': 'losses',
  'GF': 'goals_for',
  'GA': 'goals_against',
  'GD': 'goal_difference',
  'Pts': 'points',
  'Pts/MP': 'points_per_match',
  
  // Alternative column names
  'Team': 'team_name',
  'Team Name': 'team_name',
  'Goals': 'goals',
  'Assists': 'assists',
  'Played': 'matches_played',
  'Points': 'points',
  'Position': 'position'
};

// Known team name variations and their canonical names
export const TEAM_NAME_VARIATIONS: Record<string, string> = {
  'Liverpool': 'Liverpool',
  'Man United': 'Manchester United',
  'Man City': 'Manchester City',
  'Spurs': 'Tottenham',
  'Tottenham Hotspur': 'Tottenham',
  'Newcastle': 'Newcastle United',
  'West Ham': 'West Ham United',
  'Brighton': 'Brighton & Hove Albion',
  'Brighton & Hove Albion': 'Brighton & Hove Albion',
  'Wolves': 'Wolverhampton Wanderers',
  'Wolverhampton Wanderers': 'Wolverhampton Wanderers',
  'Nott\'m Forest': 'Nottingham Forest',
  'Nottingham Forest': 'Nottingham Forest',
  'Leicester': 'Leicester City',
  'Leicester City': 'Leicester City'
};

// Competition name mappings
export const COMPETITION_MAPPINGS: Record<string, string> = {
  'Premier League': 'Premier League',
  'PL': 'Premier League',
  'EPL': 'Premier League',
  'Champions League': 'UEFA Champions League',
  'CL': 'UEFA Champions League',
  'Europa League': 'UEFA Europa League',
  'EL': 'UEFA Europa League',
  'FA Cup': 'FA Cup',
  'League Cup': 'League Cup',
  'EFL Cup': 'League Cup',
  'Carabao Cup': 'League Cup'
};

// Cache for team lookups to avoid repeated queries
const teamCache = new Map<string, any>();
const leagueCache = new Map<string, any>();

/**
 * Normalize text for comparison (lowercase, trim, remove special chars)
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
}

/**
 * Map Excel column name to database field name
 */
export function mapColumnName(excelColumn: string): string {
  const normalized = excelColumn.trim();
  return COLUMN_MAPPINGS[normalized] || normalized.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Get canonical team name from variation
 */
export function getCanonicalTeamName(teamName: string): string {
  const normalized = teamName.trim();
  return TEAM_NAME_VARIATIONS[normalized] || normalized;
}

/**
 * Lookup team by name and return team_id
 */
export async function lookupTeam(teamName: string): Promise<any | null> {
  if (!teamName) return null;
  
  const canonicalName = getCanonicalTeamName(teamName);
  
  // Check cache first
  if (teamCache.has(canonicalName)) {
    return teamCache.get(canonicalName);
  }
  
  try {
    // Try exact match first
    let team = await db.select()
      .from(football_teams)
      .where(eq(football_teams.name, canonicalName))
      .limit(1);
    
    if (team.length === 0) {
      // Try case-insensitive match
      team = await db.select()
        .from(football_teams)
        .where(sql`LOWER(${football_teams.name}) = LOWER(${canonicalName})`)
        .limit(1);
    }
    
    if (team.length === 0) {
      // Try partial match
      team = await db.select()
        .from(football_teams)
        .where(sql`LOWER(${football_teams.name}) LIKE LOWER(${'%' + canonicalName + '%'})`)
        .limit(1);
    }
    
    const result = team.length > 0 ? team[0] : null;
    
    if (result) {
      teamCache.set(canonicalName, result);
    }
    
    return result;
  } catch (error) {
    console.error(`Failed to lookup team: ${teamName}`, error);
    return null;
  }
}

/**
 * Lookup league/competition by name and return league_id
 */
export async function lookupLeague(competitionName: string): Promise<any | null> {
  if (!competitionName) return null;
  
  const canonicalName = COMPETITION_MAPPINGS[competitionName] || competitionName;
  
  // Check cache first
  if (leagueCache.has(canonicalName)) {
    return leagueCache.get(canonicalName);
  }
  
  try {
    const league = await db.select()
      .from(football_leagues)
      .where(eq(football_leagues.name, canonicalName))
      .limit(1);
    
    const result = league.length > 0 ? league[0] : null;
    
    if (result) {
      leagueCache.set(canonicalName, result);
    }
    
    return result;
  } catch (error) {
    console.error(`Failed to lookup league: ${competitionName}`, error);
    return null;
  }
}

/**
 * Transform Excel row data to database schema
 */
export async function transformRowData(
  excelRow: Record<string, any>,
  options: {
    teamLookup?: boolean;
    leagueLookup?: boolean;
    logMissing?: boolean;
  } = {}
): Promise<Record<string, any>> {
  const transformed: Record<string, any> = {};
  const unmappedColumns: string[] = [];
  
  for (const [excelColumn, value] of Object.entries(excelRow)) {
    const dbColumn = mapColumnName(excelColumn);
    
    // Handle team lookups
    if (options.teamLookup && (dbColumn === 'team_name' || dbColumn === 'opponent_name')) {
      const team = await lookupTeam(value);
      if (team) {
        transformed[dbColumn.replace('_name', '_id')] = team.id;
        transformed[dbColumn] = team.name;
      } else {
        if (options.logMissing) {
          console.warn(`⚠️ Team not found: ${value} (column: ${excelColumn})`);
        }
        transformed[dbColumn] = value;
      }
      continue;
    }
    
    // Handle league lookups
    if (options.leagueLookup && dbColumn === 'competition') {
      const league = await lookupLeague(value);
      if (league) {
        transformed['league_id'] = league.id;
        transformed['competition'] = league.name;
      } else {
        if (options.logMissing) {
          console.warn(`⚠️ League not found: ${value} (column: ${excelColumn})`);
        }
        transformed[dbColumn] = value;
      }
      continue;
    }
    
    // Check if column was mapped
    if (!COLUMN_MAPPINGS[excelColumn] && options.logMissing) {
      unmappedColumns.push(excelColumn);
    }
    
    transformed[dbColumn] = value;
  }
  
  if (unmappedColumns.length > 0 && options.logMissing) {
    console.warn(`⚠️ Unmapped columns: ${unmappedColumns.join(', ')}`);
  }
  
  return transformed;
}

/**
 * Parse date from various Excel formats
 */
export function parseExcelDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  try {
    // Handle Excel serial date (number of days since 1900-01-01)
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1900, 0, 1);
      const days = dateValue - 2; // Excel has a leap year bug for 1900
      return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    }
    
    // Handle string dates
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse date:', dateValue, error);
    return null;
  }
}

/**
 * Clear lookup caches (useful for testing or refreshing data)
 */
export function clearLookupCaches(): void {
  teamCache.clear();
  leagueCache.clear();
}
