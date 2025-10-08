/**
 * Football Data Validation Schemas
 * 
 * Zod schemas for runtime validation of football API responses
 */

import { z } from 'zod';

/**
 * TeamStanding/TableEntry Schema
 * 
 * Validates league table entries with team standings
 */
export const TeamStandingSchema = z.object({
  position: z.number().int().positive(),
  team: z.string().min(1),
  played: z.number().int().nonnegative(),
  won: z.number().int().nonnegative(),
  drawn: z.number().int().nonnegative(),
  lost: z.number().int().nonnegative(),
  goalsFor: z.number().int().nonnegative(),
  goalsAgainst: z.number().int().nonnegative(),
  goalDifference: z.number().int(),
  points: z.number().int().nonnegative(),
  form: z.array(z.string()).optional(),
}).strict();

export type TeamStanding = z.infer<typeof TeamStandingSchema>;

/**
 * PlayerStats Schema
 * 
 * Validates player statistics with optional fields for missing data
 */
export const PlayerStatsSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  age: z.number().int().positive().optional(),
  matches: z.number().int().nonnegative().optional(),
  starts: z.number().int().nonnegative().optional(),
  goals: z.number().int().nonnegative().optional(),
  assists: z.number().int().nonnegative().optional(),
  yellowCards: z.number().int().nonnegative().optional(),
  redCards: z.number().int().nonnegative().optional(),
  minutes: z.number().int().nonnegative().optional(),
}).passthrough(); // Allow additional fields with [key: string]: any

export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

/**
 * TeamData Schema
 * 
 * Validates enriched team data with optional standing and form information
 */
export const TeamDataSchema = z.object({
  name: z.string().min(1),
  fbref: TeamStandingSchema.optional(),
  position: z.number().int().positive().optional(),
  form: z.array(z.string()).optional(),
  stats: TeamStandingSchema.optional(),
}).passthrough(); // Allow additional fields

export type TeamData = z.infer<typeof TeamDataSchema>;

/**
 * Fixture Schema (Standard format with homeTeam/awayTeam)
 * 
 * Validates fixture data in the standard API format
 */
export const FixtureSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  date: z.string().min(1),
  competition: z.string().optional(),
}).passthrough(); // Allow additional fields for extended fixture data

export type Fixture = z.infer<typeof FixtureSchema>;

/**
 * Simplified Fixture Schema (Liverpool-specific format)
 * 
 * Alternative fixture format with opponent and venue fields
 */
export const SimplifiedFixtureSchema = z.object({
  id: z.string(),
  competition: z.string(),
  opponent: z.string().min(1),
  date: z.string().min(1),
  venue: z.enum(['home', 'away']),
  isLiverpoolHome: z.boolean(),
}).passthrough();

export type SimplifiedFixture = z.infer<typeof SimplifiedFixtureSchema>;

/**
 * H2HMatch Schema
 * 
 * Validates head-to-head match records
 */
export const H2HMatchSchema = z.object({
  id: z.number().int().optional(), // May not always have an ID
  date: z.string().min(1),
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  homeScore: z.number().int().nonnegative(),
  awayScore: z.number().int().nonnegative(),
  competition: z.string().optional(),
  venue: z.string().optional(),
}).passthrough(); // Allow additional fields

export type H2HMatch = z.infer<typeof H2HMatchSchema>;

/**
 * H2HData Schema
 * 
 * Validates head-to-head data containing match history
 */
export const H2HDataSchema = z.object({
  matches: z.array(H2HMatchSchema),
}).passthrough(); // Allow additional fields like statistics

export type H2HData = z.infer<typeof H2HDataSchema>;

/**
 * API Response Wrapper Schemas
 * 
 * Validates wrapped API responses from different endpoints
 */
export const LeagueTableResponseSchema = z.union([
  z.array(TeamStandingSchema), // Direct array response
  z.object({ table: z.array(TeamStandingSchema) }), // Wrapped response
]).transform(data => {
  // Normalize to array format
  if (Array.isArray(data)) {
    return data;
  }
  return data.table;
});

export const PlayerStatsResponseSchema = z.union([
  z.array(PlayerStatsSchema), // Direct array response
  z.object({ 
    players: z.array(PlayerStatsSchema),
    source: z.string().optional(),
  }), // Wrapped response
]).transform(data => {
  // Normalize to array format
  if (Array.isArray(data)) {
    return data;
  }
  return data.players;
});

export const FixturesResponseSchema = z.object({
  fixtures: z.array(FixtureSchema),
});

export type FixturesResponse = z.infer<typeof FixturesResponseSchema>;

/**
 * Validation helper type for better error messages
 */
export interface ValidationError {
  message: string;
  path?: (string | number)[];
  expected?: string;
  received?: string;
}

/**
 * Extract validation errors from ZodError
 */
export function extractValidationErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map(err => ({
    message: err.message,
    path: err.path,
    expected: 'expected' in err ? String(err.expected) : undefined,
    received: 'received' in err ? String(err.received) : undefined,
  }));
}
