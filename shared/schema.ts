import { pgTable, serial, varchar, integer, timestamp, text, real, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================
// FOOTBALL TABLES
// ============================================

// Football Leagues Table
export const football_leagues = pgTable('football_leagues', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  country: varchar('country', { length: 100 }),
  logo: text('logo'),
  type: varchar('type', { length: 50 }),
  season: varchar('season', { length: 10 }).notNull()
}, (table) => ({
  nameSeasonIdx: index('idx_football_leagues_name_season').on(table.name, table.season),
  countryIdx: index('idx_football_leagues_country').on(table.country)
}));

export const insertFootballLeagueSchema = createInsertSchema(football_leagues).omit({ id: true });
export type InsertFootballLeague = z.infer<typeof insertFootballLeagueSchema>;
export type FootballLeague = typeof football_leagues.$inferSelect;

// Football Teams Table
export const football_teams = pgTable('football_teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 10 }),
  country: varchar('country', { length: 100 }),
  founded: integer('founded'),
  venue: varchar('venue', { length: 255 }),
  city: varchar('city', { length: 100 }),
  capacity: integer('capacity'),
  logo: text('logo'),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('idx_football_teams_name').on(table.name),
  codeIdx: index('idx_football_teams_code').on(table.code),
  countryIdx: index('idx_football_teams_country').on(table.country)
}));

export const insertFootballTeamSchema = createInsertSchema(football_teams).omit({ id: true, updated_at: true });
export type InsertFootballTeam = z.infer<typeof insertFootballTeamSchema>;
export type FootballTeam = typeof football_teams.$inferSelect;

// Football Players Table
export const football_players = pgTable('football_players', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id'),
  name: varchar('name', { length: 255 }).notNull(),
  firstname: varchar('firstname', { length: 100 }),
  lastname: varchar('lastname', { length: 100 }),
  age: integer('age'),
  birth_date: timestamp('birth_date'),
  birth_place: varchar('birth_place', { length: 255 }),
  birth_country: varchar('birth_country', { length: 100 }),
  nationality: varchar('nationality', { length: 100 }),
  height: varchar('height', { length: 20 }),
  weight: varchar('weight', { length: 20 }),
  photo: text('photo'),
  position: varchar('position', { length: 50 }),
  jersey_number: integer('jersey_number'),
  injured: boolean('injured').default(false),
  last_updated: timestamp('last_updated').defaultNow()
}, (table) => ({
  nameIdx: index('idx_football_players_name').on(table.name),
  positionIdx: index('idx_football_players_position').on(table.position),
  playerIdIdx: uniqueIndex('idx_football_players_player_id').on(table.player_id)
}));

export const insertFootballPlayerSchema = createInsertSchema(football_players).omit({ id: true, last_updated: true });
export type InsertFootballPlayer = z.infer<typeof insertFootballPlayerSchema>;
export type FootballPlayer = typeof football_players.$inferSelect;

// Football Fixtures Table
export const football_fixtures = pgTable('football_fixtures', {
  id: serial('id').primaryKey(),
  referee: text('referee'),
  timezone: text('timezone').notNull(),
  date: timestamp('date').notNull(),
  timestamp: integer('timestamp'),
  periods: text('periods').$type<any>(),
  venue: text('venue').$type<any>(),
  status: text('status').$type<any>().notNull(),
  league_id: integer('league_id').notNull(),
  season: integer('season').notNull(),
  round: text('round'),
  home_team_id: integer('home_team_id').notNull(),
  away_team_id: integer('away_team_id').notNull(),
  goals: text('goals').$type<any>(),
  score: text('score').$type<any>(),
  last_updated: timestamp('last_updated').notNull().defaultNow(),
  status_short: varchar('status_short', { length: 10 })
}, (table) => ({
  leagueIdIdx: index('idx_football_fixtures_league_id').on(table.league_id),
  homeTeamIdIdx: index('idx_football_fixtures_home_team_id').on(table.home_team_id),
  awayTeamIdIdx: index('idx_football_fixtures_away_team_id').on(table.away_team_id),
  timestampIdx: index('idx_football_fixtures_timestamp').on(table.timestamp),
  seasonIdx: index('idx_football_fixtures_season').on(table.season)
}));

export const insertFootballFixtureSchema = createInsertSchema(football_fixtures).omit({ id: true, last_updated: true });
export type InsertFootballFixture = z.infer<typeof insertFootballFixtureSchema>;
export type FootballFixture = typeof football_fixtures.$inferSelect;

// Football Standings Table
export const football_standings = pgTable('football_standings', {
  id: serial('id').primaryKey(),
  league_id: integer('league_id').references(() => football_leagues.id),
  season: varchar('season', { length: 10 }),
  rank: integer('rank'),
  team_id: integer('team_id').references(() => football_teams.id),
  team_name: varchar('team_name', { length: 255 }),
  points: integer('points'),
  goals_diff: integer('goals_diff'),
  group: varchar('group', { length: 50 }),
  form: varchar('form', { length: 20 }),
  status: varchar('status', { length: 50 }),
  description: text('description'),
  all_played: integer('all_played'),
  all_win: integer('all_win'),
  all_draw: integer('all_draw'),
  all_lose: integer('all_lose'),
  all_goals_for: integer('all_goals_for'),
  all_goals_against: integer('all_goals_against'),
  home_played: integer('home_played'),
  home_win: integer('home_win'),
  home_draw: integer('home_draw'),
  home_lose: integer('home_lose'),
  home_goals_for: integer('home_goals_for'),
  home_goals_against: integer('home_goals_against'),
  away_played: integer('away_played'),
  away_win: integer('away_win'),
  away_draw: integer('away_draw'),
  away_lose: integer('away_lose'),
  away_goals_for: integer('away_goals_for'),
  away_goals_against: integer('away_goals_against'),
  last_update: timestamp('last_update')
}, (table) => ({
  leagueSeasonTeamIdx: uniqueIndex('idx_football_standings_unique').on(table.league_id, table.season, table.team_id),
  rankIdx: index('idx_football_standings_rank').on(table.rank)
}));

export const insertFootballStandingSchema = createInsertSchema(football_standings).omit({ id: true });
export type InsertFootballStanding = z.infer<typeof insertFootballStandingSchema>;
export type FootballStanding = typeof football_standings.$inferSelect;

// Football Player Statistics Table
export const football_player_statistics = pgTable('football_player_statistics', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id').references(() => football_players.id),
  team_id: integer('team_id').references(() => football_teams.id),
  league_id: integer('league_id').references(() => football_leagues.id),
  season: varchar('season', { length: 10 }),
  games_appearances: integer('games_appearances'),
  games_lineups: integer('games_lineups'),
  games_minutes: integer('games_minutes'),
  games_number: integer('games_number'),
  games_position: varchar('games_position', { length: 50 }),
  games_rating: real('games_rating'),
  games_captain: boolean('games_captain'),
  substitutes_in: integer('substitutes_in'),
  substitutes_out: integer('substitutes_out'),
  substitutes_bench: integer('substitutes_bench'),
  shots_total: integer('shots_total'),
  shots_on: integer('shots_on'),
  goals_total: integer('goals_total'),
  goals_conceded: integer('goals_conceded'),
  goals_assists: integer('goals_assists'),
  goals_saves: integer('goals_saves'),
  passes_total: integer('passes_total'),
  passes_key: integer('passes_key'),
  passes_accuracy: integer('passes_accuracy'),
  tackles_total: integer('tackles_total'),
  tackles_blocks: integer('tackles_blocks'),
  tackles_interceptions: integer('tackles_interceptions'),
  duels_total: integer('duels_total'),
  duels_won: integer('duels_won'),
  dribbles_attempts: integer('dribbles_attempts'),
  dribbles_success: integer('dribbles_success'),
  dribbles_past: integer('dribbles_past'),
  fouls_drawn: integer('fouls_drawn'),
  fouls_committed: integer('fouls_committed'),
  cards_yellow: integer('cards_yellow'),
  cards_yellowred: integer('cards_yellowred'),
  cards_red: integer('cards_red'),
  penalty_won: integer('penalty_won'),
  penalty_committed: integer('penalty_committed'),
  penalty_scored: integer('penalty_scored'),
  penalty_missed: integer('penalty_missed'),
  penalty_saved: integer('penalty_saved'),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => ({
  playerSeasonIdx: uniqueIndex('idx_player_stats_unique').on(table.player_id, table.season, table.league_id),
  teamIdIdx: index('idx_player_stats_team_id').on(table.team_id),
  leagueIdIdx: index('idx_player_stats_league_id').on(table.league_id)
}));

export const insertFootballPlayerStatisticsSchema = createInsertSchema(football_player_statistics).omit({ id: true, updated_at: true });
export type InsertFootballPlayerStatistics = z.infer<typeof insertFootballPlayerStatisticsSchema>;
export type FootballPlayerStatistics = typeof football_player_statistics.$inferSelect;

// Football Team Statistics Table
export const football_team_statistics = pgTable('football_team_statistics', {
  id: serial('id').primaryKey(),
  team_id: integer('team_id').references(() => football_teams.id),
  fixture_id: integer('fixture_id').references(() => football_fixtures.id),
  league_id: integer('league_id').references(() => football_leagues.id),
  games_played: integer('games_played'),
  games_wins: integer('games_wins'),
  games_draws: integer('games_draws'),
  games_losses: integer('games_losses'),
  goals_for_total: integer('goals_for_total'),
  goals_for_average: real('goals_for_average'),
  goals_against_total: integer('goals_against_total'),
  goals_against_average: real('goals_against_average'),
  biggest_win_home: varchar('biggest_win_home', { length: 50 }),
  biggest_win_away: varchar('biggest_win_away', { length: 50 }),
  biggest_loss_home: varchar('biggest_loss_home', { length: 50 }),
  biggest_loss_away: varchar('biggest_loss_away', { length: 50 }),
  clean_sheets_home: integer('clean_sheets_home'),
  clean_sheets_away: integer('clean_sheets_away'),
  clean_sheets_total: integer('clean_sheets_total'),
  failed_to_score_home: integer('failed_to_score_home'),
  failed_to_score_away: integer('failed_to_score_away'),
  failed_to_score_total: integer('failed_to_score_total'),
  penalty_scored: integer('penalty_scored'),
  penalty_missed: integer('penalty_missed'),
  penalty_total: integer('penalty_total'),
  lineups: text('lineups'),
  cards_yellow: integer('cards_yellow'),
  cards_red: integer('cards_red'),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => ({
  teamFixtureIdx: uniqueIndex('idx_team_stats_unique').on(table.team_id, table.fixture_id),
  leagueIdIdx: index('idx_team_stats_league_id').on(table.league_id)
}));

export const insertFootballTeamStatisticsSchema = createInsertSchema(football_team_statistics).omit({ id: true, updated_at: true });
export type InsertFootballTeamStatistics = z.infer<typeof insertFootballTeamStatisticsSchema>;
export type FootballTeamStatistics = typeof football_team_statistics.$inferSelect;

// Data Sync Status Table
export const data_sync_status = pgTable('data_sync_status', {
  id: serial('id').primaryKey(),
  resource_type: varchar('resource_type', { length: 50 }).notNull(),
  league_id: integer('league_id'),
  season: varchar('season', { length: 10 }),
  last_sync_at: timestamp('last_sync_at'),
  next_sync_at: timestamp('next_sync_at'),
  total_expected: integer('total_expected'),
  total_synced: integer('total_synced'),
  completeness_percentage: real('completeness_percentage'),
  sync_status: varchar('sync_status', { length: 50 }),
  error_message: text('error_message'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => ({
  resourceTypeIdx: index('idx_sync_status_resource').on(table.resource_type),
  syncStatusIdx: index('idx_sync_status_status').on(table.sync_status),
  nextSyncIdx: index('idx_sync_status_next_sync').on(table.next_sync_at)
}));

export const insertDataSyncStatusSchema = createInsertSchema(data_sync_status).omit({ id: true, created_at: true, updated_at: true });
export type InsertDataSyncStatus = z.infer<typeof insertDataSyncStatusSchema>;
export type DataSyncStatus = typeof data_sync_status.$inferSelect;

// Data Sync Logs Table
export const data_sync_logs = pgTable('data_sync_logs', {
  id: serial('id').primaryKey(),
  resource_type: varchar('resource_type', { length: 50 }).notNull(),
  league_id: integer('league_id'),
  season: varchar('season', { length: 10 }),
  action: varchar('action', { length: 50 }),
  status: varchar('status', { length: 50 }),
  records_processed: integer('records_processed'),
  error_message: text('error_message'),
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  api_calls_made: integer('api_calls_made'),
  created_at: timestamp('created_at').defaultNow()
}, (table) => ({
  resourceTypeIdx: index('idx_sync_logs_resource').on(table.resource_type),
  statusIdx: index('idx_sync_logs_status').on(table.status),
  createdAtIdx: index('idx_sync_logs_created').on(table.created_at)
}));

export const insertDataSyncLogSchema = createInsertSchema(data_sync_logs).omit({ id: true, created_at: true });
export type InsertDataSyncLog = z.infer<typeof insertDataSyncLogSchema>;
export type DataSyncLog = typeof data_sync_logs.$inferSelect;

// ============================================
// MISSING FOOTBALL TABLES REQUIRED BY EXISTING CODE
// ============================================

// Football Lineups Table (for match formations and player positions)
export const footballLineups = pgTable('football_lineups', {
  id: serial('id').primaryKey(),
  fixture_id: integer('fixture_id').references(() => football_fixtures.id),
  team_id: integer('team_id').references(() => football_teams.id),
  formation: varchar('formation', { length: 20 }),
  lineup: text('lineup'),
  substitutes: text('substitutes'),
  coach: varchar('coach', { length: 100 }),
  created_at: timestamp('created_at').defaultNow()
}, (table) => ({
  fixtureTeamIdx: uniqueIndex('idx_lineups_fixture_team').on(table.fixture_id, table.team_id)
}));

export const insertFootballLineupSchema = createInsertSchema(footballLineups).omit({ id: true, created_at: true });
export type InsertFootballLineup = z.infer<typeof insertFootballLineupSchema>;
export type FootballLineup = typeof footballLineups.$inferSelect;

// Football Statistics Table (for match-specific stats)
export const footballStatistics = pgTable('football_statistics', {
  id: serial('id').primaryKey(),
  fixture_id: integer('fixture_id').references(() => football_fixtures.id),
  team_id: integer('team_id').references(() => football_teams.id),
  possession: integer('possession'),
  shots_total: integer('shots_total'),
  shots_on_target: integer('shots_on_target'),
  shots_off_target: integer('shots_off_target'),
  shots_blocked: integer('shots_blocked'),
  corners: integer('corners'),
  offsides: integer('offsides'),
  fouls: integer('fouls'),
  yellow_cards: integer('yellow_cards'),
  red_cards: integer('red_cards'),
  passes_total: integer('passes_total'),
  passes_accurate: integer('passes_accurate'),
  pass_percentage: integer('pass_percentage'),
  created_at: timestamp('created_at').defaultNow()
}, (table) => ({
  fixtureTeamIdx: uniqueIndex('idx_statistics_fixture_team').on(table.fixture_id, table.team_id)
}));

export const insertFootballStatisticsSchema = createInsertSchema(footballStatistics).omit({ id: true, created_at: true });
export type InsertFootballStatistics = z.infer<typeof insertFootballStatisticsSchema>;
export type FootballStatistics = typeof footballStatistics.$inferSelect;

// Team Matchup Analysis Table
export const teamMatchupAnalysis = pgTable('team_matchup_analysis', {
  id: serial('id').primaryKey(),
  team1_id: integer('team1_id').references(() => football_teams.id),
  team2_id: integer('team2_id').references(() => football_teams.id),
  analysis_date: timestamp('analysis_date'),
  h2h_wins_team1: integer('h2h_wins_team1'),
  h2h_wins_team2: integer('h2h_wins_team2'),
  h2h_draws: integer('h2h_draws'),
  avg_goals_team1: real('avg_goals_team1'),
  avg_goals_team2: real('avg_goals_team2'),
  form_team1: varchar('form_team1', { length: 20 }),
  form_team2: varchar('form_team2', { length: 20 }),
  prediction: text('prediction'),
  confidence_score: real('confidence_score'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertTeamMatchupAnalysisSchema = createInsertSchema(teamMatchupAnalysis).omit({ id: true, created_at: true });
export type InsertTeamMatchupAnalysis = z.infer<typeof insertTeamMatchupAnalysisSchema>;
export type TeamMatchupAnalysis = typeof teamMatchupAnalysis.$inferSelect;

// Video Projects Table (for video editor)
export const videoProjects = pgTable('video_projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  settings: text('settings'),
  duration: real('duration'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertVideoProjectSchema = createInsertSchema(videoProjects).omit({ id: true, created_at: true, updated_at: true });
export type InsertVideoProject = z.infer<typeof insertVideoProjectSchema>;
export type VideoProject = typeof videoProjects.$inferSelect;

// Video Clips Table
export const videoClips = pgTable('video_clips', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').references(() => videoProjects.id),
  name: varchar('name', { length: 255 }),
  source_url: text('source_url'),
  start_time: real('start_time'),
  end_time: real('end_time'),
  duration: real('duration'),
  position: integer('position'),
  track: integer('track'),
  effects: text('effects'),
  transitions: text('transitions'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertVideoClipSchema = createInsertSchema(videoClips).omit({ id: true, created_at: true });
export type InsertVideoClip = z.infer<typeof insertVideoClipSchema>;
export type VideoClip = typeof videoClips.$inferSelect;


// ============================================
// EXISTING NON-FOOTBALL TABLES
// ============================================

// Player Season Statistics (existing table)
export const player_season_statistics = pgTable('player_season_statistics', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  player_id: integer('player_id').notNull(),
  team_id: integer('team_id').notNull(),
  league_id: integer('league_id').notNull(),
  season: integer('season').notNull(),
  goals: integer('goals').notNull().default(0),
  assists: integer('assists').notNull().default(0),
  appearances: integer('appearances').notNull().default(0),
  minutes: integer('minutes').notNull().default(0),
  yellow_cards: integer('yellow_cards').notNull().default(0),
  red_cards: integer('red_cards').notNull().default(0),
  rating: text('rating'),
  last_updated: timestamp('last_updated').notNull().defaultNow()
}, (table) => ({
  playerSeasonLeagueUnique: uniqueIndex('player_season_league_unique').on(
    table.player_id,
    table.team_id,
    table.league_id,
    table.season
  )
}));

export const insertPlayerSeasonStatisticsSchema = createInsertSchema(player_season_statistics).omit({ id: true, last_updated: true });
export type InsertPlayerSeasonStatistics = z.infer<typeof insertPlayerSeasonStatisticsSchema>;
export type PlayerSeasonStatistics = typeof player_season_statistics.$inferSelect;

// Team Season Statistics (existing table)
export const team_season_statistics = pgTable('team_season_statistics', {
  id: serial('id').primaryKey(),
  team_id: integer('team_id'),
  season: varchar('season', { length: 10 }),
  competition: varchar('competition', { length: 255 }),
  matches_played: integer('matches_played'),
  wins: integer('wins'),
  draws: integer('draws'),
  losses: integer('losses'),
  goals_for: integer('goals_for'),
  goals_against: integer('goals_against'),
  goal_difference: integer('goal_difference'),
  points: integer('points'),
  position: integer('position'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertTeamSeasonStatisticsSchema = createInsertSchema(team_season_statistics).omit({ id: true, created_at: true, updated_at: true });
export type InsertTeamSeasonStatistics = z.infer<typeof insertTeamSeasonStatisticsSchema>;
export type TeamSeasonStatistics = typeof team_season_statistics.$inferSelect;

// Football Competitions (existing table)
export const football_competitions = pgTable('football_competitions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  type: varchar('type', { length: 50 }),
  logo: text('logo'),
  country: varchar('country', { length: 100 }),
  season: varchar('season', { length: 10 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertFootballCompetitionSchema = createInsertSchema(football_competitions).omit({ id: true, created_at: true, updated_at: true });
export type InsertFootballCompetition = z.infer<typeof insertFootballCompetitionSchema>;
export type FootballCompetition = typeof football_competitions.$inferSelect;


// Data Update Schedule (existing table)
export const data_update_schedule = pgTable('data_update_schedule', {
  id: serial('id').primaryKey(),
  resource_type: varchar('resource_type', { length: 50 }).notNull(),
  schedule_cron: varchar('schedule_cron', { length: 100 }),
  last_run: timestamp('last_run'),
  next_run: timestamp('next_run'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertDataUpdateScheduleSchema = createInsertSchema(data_update_schedule).omit({ id: true, created_at: true, updated_at: true });
export type InsertDataUpdateSchedule = z.infer<typeof insertDataUpdateScheduleSchema>;
export type DataUpdateSchedule = typeof data_update_schedule.$inferSelect;

// RSS Sources
export const rss_sources = pgTable('rss_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  feed_url: text('feed_url').notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  is_active: boolean('is_active').default(true),
  is_verified: boolean('is_verified').default(false),
  last_fetched_at: timestamp('last_fetched_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertRssSourceSchema = createInsertSchema(rss_sources).omit({ id: true, created_at: true });
export type InsertRssSource = z.infer<typeof insertRssSourceSchema>;
export type RssSource = typeof rss_sources.$inferSelect;

// RSS Articles
export const rss_articles = pgTable('rss_articles', {
  id: serial('id').primaryKey(),
  source_id: integer('source_id').references(() => rss_sources.id),
  title: text('title').notNull(),
  link: text('link'),
  description: text('description'),
  published_at: timestamp('published_at'),
  guid: text('guid'),
  author: varchar('author', { length: 255 }),
  categories: text('categories').array(),
  sentiment_score: real('sentiment_score'),
  keywords: text('keywords').array(),
  created_at: timestamp('created_at').defaultNow()
});

export const insertRssArticleSchema = createInsertSchema(rss_articles).omit({ id: true, created_at: true });
export type InsertRssArticle = z.infer<typeof insertRssArticleSchema>;
export type RssArticle = typeof rss_articles.$inferSelect;

// RSS Analysis
export const rss_analysis = pgTable('rss_analysis', {
  id: serial('id').primaryKey(),
  article_id: integer('article_id').references(() => rss_articles.id),
  analysis_type: varchar('analysis_type', { length: 50 }),
  content: text('content'),
  metadata: text('metadata'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertRssAnalysisSchema = createInsertSchema(rss_analysis).omit({ id: true, created_at: true });
export type InsertRssAnalysis = z.infer<typeof insertRssAnalysisSchema>;
export type RssAnalysis = typeof rss_analysis.$inferSelect;

// RSS Comparisons
export const rss_comparisons = pgTable('rss_comparisons', {
  id: serial('id').primaryKey(),
  article1_id: integer('article1_id').references(() => rss_articles.id),
  article2_id: integer('article2_id').references(() => rss_articles.id),
  similarity_score: real('similarity_score'),
  comparison_type: varchar('comparison_type', { length: 50 }),
  created_at: timestamp('created_at').defaultNow()
});

export const insertRssComparisonSchema = createInsertSchema(rss_comparisons).omit({ id: true, created_at: true });
export type InsertRssComparison = z.infer<typeof insertRssComparisonSchema>;
export type RssComparison = typeof rss_comparisons.$inferSelect;

// Library Items
export const library_items = pgTable('library_items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  path: text('path'),
  url: text('url'),
  thumbnail_url: text('thumbnail_url'),
  metadata: text('metadata'),
  tags: text('tags').array(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertLibraryItemSchema = createInsertSchema(library_items).omit({ id: true, created_at: true, updated_at: true });
export type InsertLibraryItem = z.infer<typeof insertLibraryItemSchema>;
export type LibraryItem = typeof library_items.$inferSelect;

// Scenes
export const scenes = pgTable('scenes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  layout: text('layout'),
  elements: text('elements'),
  background_config: text('background_config'),
  transition_config: text('transition_config'),
  aspect_ratio: text('aspect_ratio'),
  is_template: boolean('is_template').default(false),
  tags: text('tags').array(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertSceneSchema = createInsertSchema(scenes).omit({ id: true, created_at: true, updated_at: true });
export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Scene = typeof scenes.$inferSelect;

// Presentation Sets
export const presentation_sets = pgTable('presentation_sets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scenes: text('scenes'),
  settings: text('settings'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertPresentationSetSchema = createInsertSchema(presentation_sets).omit({ id: true, created_at: true, updated_at: true });
export type InsertPresentationSet = z.infer<typeof insertPresentationSetSchema>;
export type PresentationSet = typeof presentation_sets.$inferSelect;

// Ticker Playlists
export const ticker_playlists = pgTable('ticker_playlists', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  items: text('items'),
  speed: integer('speed'),
  is_active: boolean('is_active').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertTickerPlaylistSchema = createInsertSchema(ticker_playlists).omit({ id: true, created_at: true, updated_at: true });
export type InsertTickerPlaylist = z.infer<typeof insertTickerPlaylistSchema>;
export type TickerPlaylist = typeof ticker_playlists.$inferSelect;

// Video Sources
export const video_sources = pgTable('video_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }),
  url: text('url'),
  settings: text('settings'),
  is_active: boolean('is_active').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertVideoSourceSchema = createInsertSchema(video_sources).omit({ id: true, created_at: true, updated_at: true });
export type InsertVideoSource = z.infer<typeof insertVideoSourceSchema>;
export type VideoSource = typeof video_sources.$inferSelect;

// Source Templates
export const source_templates = pgTable('source_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }),
  config: text('config'),
  preview_url: text('preview_url'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertSourceTemplateSchema = createInsertSchema(source_templates).omit({ id: true, created_at: true });
export type InsertSourceTemplate = z.infer<typeof insertSourceTemplateSchema>;
export type SourceTemplate = typeof source_templates.$inferSelect;

// Set Templates
export const set_templates = pgTable('set_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  config: text('config'),
  preview_url: text('preview_url'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertSetTemplateSchema = createInsertSchema(set_templates).omit({ id: true, created_at: true });
export type InsertSetTemplate = z.infer<typeof insertSetTemplateSchema>;
export type SetTemplate = typeof set_templates.$inferSelect;

// Templates
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  type: varchar('type', { length: 50 }),
  content: text('content'),
  settings: text('settings'),
  preview_url: text('preview_url'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, created_at: true, updated_at: true });
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// Render Jobs
export const render_jobs = pgTable('render_jobs', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id'),
  status: varchar('status', { length: 50 }),
  progress: integer('progress'),
  output_url: text('output_url'),
  error_message: text('error_message'),
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertRenderJobSchema = createInsertSchema(render_jobs).omit({ id: true, created_at: true });
export type InsertRenderJob = z.infer<typeof insertRenderJobSchema>;
export type RenderJob = typeof render_jobs.$inferSelect;

// Projects
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  settings: text('settings'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, created_at: true, updated_at: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Clips
export const clips = pgTable('clips', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').references(() => projects.id),
  name: varchar('name', { length: 255 }),
  source_url: text('source_url'),
  start_time: real('start_time'),
  end_time: real('end_time'),
  duration: real('duration'),
  position: integer('position'),
  track: integer('track'),
  effects: text('effects'),
  transitions: text('transitions'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertClipSchema = createInsertSchema(clips).omit({ id: true, created_at: true });
export type InsertClip = z.infer<typeof insertClipSchema>;
export type Clip = typeof clips.$inferSelect;

// Text Overlays
export const text_overlays = pgTable('text_overlays', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').references(() => projects.id),
  text: text('text'),
  font_family: varchar('font_family', { length: 100 }),
  font_size: integer('font_size'),
  font_color: varchar('font_color', { length: 20 }),
  position_x: real('position_x'),
  position_y: real('position_y'),
  start_time: real('start_time'),
  end_time: real('end_time'),
  animation: text('animation'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertTextOverlaySchema = createInsertSchema(text_overlays).omit({ id: true, created_at: true });
export type InsertTextOverlay = z.infer<typeof insertTextOverlaySchema>;
export type TextOverlay = typeof text_overlays.$inferSelect;

// Keyframes
export const keyframes = pgTable('keyframes', {
  id: serial('id').primaryKey(),
  clip_id: integer('clip_id').references(() => clips.id),
  property: varchar('property', { length: 50 }),
  time: real('time'),
  value: text('value'),
  easing: varchar('easing', { length: 50 }),
  created_at: timestamp('created_at').defaultNow()
});

export const insertKeyframeSchema = createInsertSchema(keyframes).omit({ id: true, created_at: true });
export type InsertKeyframe = z.infer<typeof insertKeyframeSchema>;
export type Keyframe = typeof keyframes.$inferSelect;

// Audio Tracks
export const audio_tracks = pgTable('audio_tracks', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').references(() => projects.id),
  name: varchar('name', { length: 255 }),
  source_url: text('source_url'),
  start_time: real('start_time'),
  duration: real('duration'),
  volume: real('volume'),
  fade_in: real('fade_in'),
  fade_out: real('fade_out'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertAudioTrackSchema = createInsertSchema(audio_tracks).omit({ id: true, created_at: true });
export type InsertAudioTrack = z.infer<typeof insertAudioTrackSchema>;
export type AudioTrack = typeof audio_tracks.$inferSelect;

// Historical Head-to-Head Table
export const historicalHeadToHead = pgTable('historical_head_to_head', {
  id: serial('id').primaryKey(),
  team1Id: integer('team1_id').references(() => football_teams.id),
  team1Name: varchar('team1_name', { length: 255 }),
  team2Id: integer('team2_id').references(() => football_teams.id),
  team2Name: varchar('team2_name', { length: 255 }),
  fixtureDate: timestamp('fixture_date').notNull(),
  competition: varchar('competition', { length: 255 }),
  competitionId: integer('competition_id'),
  venue: varchar('venue', { length: 255 }),
  homeTeamId: integer('home_team_id'),
  awayTeamId: integer('away_team_id'),
  team1Score: integer('team1_score'),
  team2Score: integer('team2_score'),
  winner: varchar('winner', { length: 50 }),
  season: integer('season'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  isFallback: boolean('is_fallback').default(false),
  fallbackReason: text('fallback_reason'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  fixtureDateIdx: index('idx_h2h_fixture_date').on(table.fixtureDate),
  team1Team2DateIdx: uniqueIndex('idx_h2h_teams_date').on(table.team1Id, table.team2Id, table.fixtureDate),
  seasonIdx: index('idx_h2h_season').on(table.season),
  lastUpdatedIdx: index('idx_h2h_last_updated').on(table.lastUpdated)
}));

export const insertHistoricalHeadToHeadSchema = createInsertSchema(historicalHeadToHead).omit({ id: true, createdAt: true, lastUpdated: true });
export type InsertHistoricalHeadToHead = z.infer<typeof insertHistoricalHeadToHeadSchema>;
export type HistoricalHeadToHead = typeof historicalHeadToHead.$inferSelect;

// Framework Categories
export const framework_categories = pgTable('framework_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  created_at: timestamp('created_at').defaultNow()
});

export const insertFrameworkCategorySchema = createInsertSchema(framework_categories).omit({ id: true, created_at: true });
export type InsertFrameworkCategory = z.infer<typeof insertFrameworkCategorySchema>;
export type FrameworkCategory = typeof framework_categories.$inferSelect;

// Frameworks
export const frameworks = pgTable('frameworks', {
  id: serial('id').primaryKey(),
  category_id: integer('category_id').references(() => framework_categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  template: text('template'),
  variables: text('variables'),
  example: text('example'),
  is_public: boolean('is_public').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertFrameworkSchema = createInsertSchema(frameworks).omit({ id: true, created_at: true, updated_at: true });
export type InsertFramework = z.infer<typeof insertFrameworkSchema>;
export type Framework = typeof frameworks.$inferSelect;

// Framework Versions
export const framework_versions = pgTable('framework_versions', {
  id: serial('id').primaryKey(),
  framework_id: integer('framework_id').references(() => frameworks.id),
  version: varchar('version', { length: 20 }),
  changes: text('changes'),
  template: text('template'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertFrameworkVersionSchema = createInsertSchema(framework_versions).omit({ id: true, created_at: true });
export type InsertFrameworkVersion = z.infer<typeof insertFrameworkVersionSchema>;
export type FrameworkVersion = typeof framework_versions.$inferSelect;

// Live States
export const live_states = pgTable('live_states', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: text('value'),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertLiveStateSchema = createInsertSchema(live_states).omit({ id: true, updated_at: true });
export type InsertLiveState = z.infer<typeof insertLiveStateSchema>;
export type LiveState = typeof live_states.$inferSelect;

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password_hash: text('password_hash'),
  role: varchar('role', { length: 50 }),
  preferences: text('preferences'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, created_at: true, updated_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Images
export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  filename: varchar('filename', { length: 255 }),
  alt_text: text('alt_text'),
  caption: text('caption'),
  category: varchar('category', { length: 100 }),
  width: integer('width'),
  height: integer('height'),
  size: integer('size'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertImageSchema = createInsertSchema(images).omit({ id: true, created_at: true, updated_at: true });
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;

// Presentation Styles
export const presentationStyles = pgTable('presentation_styles', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  config: text('config'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertPresentationStyleSchema = createInsertSchema(presentationStyles).omit({ id: true, created_at: true, updated_at: true });
export type InsertPresentationStyle = z.infer<typeof insertPresentationStyleSchema>;
export type PresentationStyle = typeof presentationStyles.$inferSelect;

// Reports
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content'),
  type: varchar('type', { length: 50 }),
  status: varchar('status', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, created_at: true, updated_at: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Report Renderings
export const reportRenderings = pgTable('report_renderings', {
  id: serial('id').primaryKey(),
  report_id: integer('report_id').references(() => reports.id),
  format: varchar('format', { length: 50 }),
  url: text('url'),
  status: varchar('status', { length: 50 }),
  created_at: timestamp('created_at').defaultNow()
});

export const insertReportRenderingSchema = createInsertSchema(reportRenderings).omit({ id: true, created_at: true });
export type InsertReportRendering = z.infer<typeof insertReportRenderingSchema>;
export type ReportRendering = typeof reportRenderings.$inferSelect;

// Source Name Presets
export const sourceNamePresets = pgTable('source_name_presets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }),
  config: text('config'),
  created_at: timestamp('created_at').defaultNow()
});

export const insertSourceNamePresetSchema = createInsertSchema(sourceNamePresets).omit({ id: true, created_at: true });
export type InsertSourceNamePreset = z.infer<typeof insertSourceNamePresetSchema>;
export type SourceNamePreset = typeof sourceNamePresets.$inferSelect;

// Recordings
export const recordings = pgTable('recordings', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url'),
  duration: real('duration'),
  size: integer('size'),
  format: varchar('format', { length: 50 }),
  created_at: timestamp('created_at').defaultNow()
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({ id: true, created_at: true });
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;

// Data Imports
export const data_imports = pgTable('data_imports', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  file_type: varchar('file_type', { length: 50 }).notNull(),
  operation: varchar('operation', { length: 10 }).notNull(),
  target_table: varchar('target_table', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  records_affected: integer('records_affected'),
  error_message: text('error_message'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  file_size: integer('file_size')
});

export const insertDataImportSchema = createInsertSchema(data_imports).omit({ id: true, created_at: true });
export type InsertDataImport = z.infer<typeof insertDataImportSchema>;
export type SelectDataImport = typeof data_imports.$inferSelect;

// ============================================
// ALL CAMELCASE ALIASES FOR BACKWARD COMPATIBILITY
// ============================================

// Export all camelCase aliases for backward compatibility
// Football tables
export const footballCompetitions = football_competitions;
export const footballTeams = football_teams;
export const footballPlayers = football_players;
export const footballFixtures = football_fixtures;
export const teamSeasonStatistics = team_season_statistics;
export const playerSeasonStatistics = player_season_statistics;
// historicalHeadToHead is already defined directly above (not an alias)

// Other tables
export const audioTracks = audio_tracks;
export const liveStates = live_states;
export const rssComparisons = rss_comparisons;
export const rssAnalysis = rss_analysis;
export const rssArticles = rss_articles;
export const rssSources = rss_sources;
export const presentationSets = presentation_sets;
export const videoSources = video_sources;
export const sourceTemplates = source_templates;
export const setTemplates = set_templates;
export const textOverlays = text_overlays;
export const renderJobs = render_jobs;


// Meta-Agent Task History
export const agentTasks = pgTable("agent_tasks", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  userConfirmed: boolean("user_confirmed").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const agentTaskSteps = pgTable("agent_task_steps", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").references(() => agentTasks.id).notNull(),
  stepId: text("step_id").notNull(),
  description: text("description").notNull(),
  completed: boolean("completed").default(false),
  result: text("result"),
  timestamp: timestamp("timestamp"),
});
