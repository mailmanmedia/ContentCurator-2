import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const images = pgTable("images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  url: text("url").notNull(),
  thumbnail: text("thumbnail").notNull(),
  size: text("size").notNull(),
  type: text("type").notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  category: text("category").notNull().default('Uploads'),
  isStarred: boolean("is_starred").notNull().default(false),
  fileSize: text("file_size"),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const presentationStyles = pgTable("presentation_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  configJson: jsonb("config_json").notNull().default('{}'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  bodyJson: jsonb("body_json").notNull(),
  contextJson: jsonb("context_json").notNull().default('{}'),
  status: text("status").notNull().default('draft'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const reportRenderings = pgTable("report_renderings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  styleKey: text("style_key").notNull(),
  contentHtml: text("content_html").notNull(),
  blocksJson: jsonb("blocks_json").notNull().default('{}'),
  metaJson: jsonb("meta_json").notNull().default('{}'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const frameworkCategories = pgTable("framework_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  color: text("color").notNull().default('#3B82F6'),
  icon: text("icon").notNull().default('folder'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const frameworks = pgTable("frameworks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  isPublic: boolean("is_public").notNull().default(false),
  isStarred: boolean("is_starred").notNull().default(false),
  totalDownloads: text("total_downloads").notNull().default('0'),
  currentVersionId: varchar("current_version_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const frameworkVersions = pgTable("framework_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  frameworkId: varchar("framework_id").notNull(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  contentJson: jsonb("content_json").notNull(),
  templateStructure: jsonb("template_structure").notNull().default('{}'),
  changelogMarkdown: text("changelog_markdown").notNull().default(''),
  isActive: boolean("is_active").notNull().default(true),
  downloadCount: text("download_count").notNull().default('0'),
  fileSize: text("file_size"),
  sourceType: text("source_type").notNull().default('manual'), // 'manual' or 'upload'
  sourceFileName: text("source_file_name"),
  sourceFileUrl: text("source_file_url"),
  processingStatus: text("processing_status").default('completed'), // 'uploading', 'processing', 'completed', 'failed'
  extractedText: text("extracted_text"),
  extractionError: text("extraction_error"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// RSS Intelligence System Schema
export const rssSources = pgTable("rss_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  feedUrl: text("feed_url").notNull().unique(),
  category: text("category").notNull(), // 'official', 'fan_site', 'media', 'podcast'
  language: text("language").notNull().default('en'),
  updateFrequency: integer("update_frequency").notNull().default(60), // minutes
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  totalArticles: integer("total_articles").notNull().default(0),
  lastFetchedAt: timestamp("last_fetched_at"),
  lastArticleDate: timestamp("last_article_date"),
  fetchErrors: integer("fetch_errors").notNull().default(0),
  metadataJson: jsonb("metadata_json").notNull().default('{}'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const rssArticles = pgTable("rss_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  link: text("link").notNull(),
  guid: text("guid"),
  author: text("author"),
  categories: text("categories").array().default(sql`'{}'::text[]`),
  publishedAt: timestamp("published_at"),
  imageUrl: text("image_url"),
  wordCount: integer("word_count"),
  readingTime: integer("reading_time"), // estimated minutes
  sentiment: text("sentiment"), // 'positive', 'neutral', 'negative'
  topics: text("topics").array().default(sql`'{}'::text[]`),
  keywords: text("keywords").array().default(sql`'{}'::text[]`),
  isAnalyzed: boolean("is_analyzed").notNull().default(false),
  qualityScore: integer("quality_score"), // 1-100
  engagementPotential: text("engagement_potential"), // 'low', 'medium', 'high'
  contentHash: text("content_hash").unique(),
  rawDataJson: jsonb("raw_data_json").notNull().default('{}'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const rssAnalysis = pgTable("rss_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull(),
  analysisType: text("analysis_type").notNull(), // 'summary', 'sentiment', 'topics', 'tactical', 'transfer'
  resultJson: jsonb("result_json").notNull(),
  confidence: integer("confidence"), // 1-100
  aiModel: text("ai_model").notNull().default('gpt-4'),
  processingTime: integer("processing_time"), // milliseconds
  tokensUsed: integer("tokens_used"),
  status: text("status").notNull().default('pending'), // 'pending', 'completed', 'failed'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const rssComparisons = pgTable("rss_comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  articleIds: text("article_ids").array().notNull(),
  comparisonType: text("comparison_type").notNull(), // 'sentiment', 'coverage', 'timing', 'bias'
  timeRange: text("time_range").notNull(), // '24h', '7d', '30d'
  resultJson: jsonb("result_json").notNull(),
  insights: text("insights").array().default(sql`'{}'::text[]`),
  visualizationConfig: jsonb("visualization_config").notNull().default('{}'),
  isPublic: boolean("is_public").notNull().default(false),
  generatedBy: text("generated_by").notNull().default('system'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true,
});

export const insertPresentationStyleSchema = createInsertSchema(presentationStyles).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportRenderingSchema = createInsertSchema(reportRenderings).omit({
  id: true,
  createdAt: true,
});

export const insertFrameworkCategorySchema = createInsertSchema(frameworkCategories).omit({
  id: true,
  createdAt: true,
});

export const insertFrameworkSchema = createInsertSchema(frameworks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFrameworkVersionSchema = createInsertSchema(frameworkVersions).omit({
  id: true,
  createdAt: true,
});

export const insertRssSourceSchema = createInsertSchema(rssSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRssArticleSchema = createInsertSchema(rssArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRssAnalysisSchema = createInsertSchema(rssAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRssComparisonSchema = createInsertSchema(rssComparisons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
export type InsertPresentationStyle = z.infer<typeof insertPresentationStyleSchema>;
export type PresentationStyle = typeof presentationStyles.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReportRendering = z.infer<typeof insertReportRenderingSchema>;
export type ReportRendering = typeof reportRenderings.$inferSelect;
export type InsertFrameworkCategory = z.infer<typeof insertFrameworkCategorySchema>;
export type FrameworkCategory = typeof frameworkCategories.$inferSelect;
export type InsertFramework = z.infer<typeof insertFrameworkSchema>;
export type Framework = typeof frameworks.$inferSelect;
export type InsertFrameworkVersion = z.infer<typeof insertFrameworkVersionSchema>;
export type FrameworkVersion = typeof frameworkVersions.$inferSelect;
export type InsertRssSource = z.infer<typeof insertRssSourceSchema>;
export type RssSource = typeof rssSources.$inferSelect;
export type InsertRssArticle = z.infer<typeof insertRssArticleSchema>;
export type RssArticle = typeof rssArticles.$inferSelect;
export type InsertRssAnalysis = z.infer<typeof insertRssAnalysisSchema>;
export type RssAnalysis = typeof rssAnalysis.$inferSelect;
export type InsertRssComparison = z.infer<typeof insertRssComparisonSchema>;
export type RssComparison = typeof rssComparisons.$inferSelect;

// Team Matchup Studio Schema
export const footballCompetitions = pgTable("football_competitions", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'league', 'cup'
  country: text("country").notNull(),
  logo: text("logo"),
  flag: text("flag"),
  season: integer("season").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const footballTeams = pgTable("football_teams", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  country: text("country").notNull(),
  founded: integer("founded"),
  national: boolean("national").notNull().default(false),
  logo: text("logo"),
  venue: jsonb("venue"),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const footballPlayers = pgTable("football_players", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  firstname: text("firstname"),
  lastname: text("lastname"),
  age: integer("age"),
  birth: jsonb("birth"),
  nationality: text("nationality"),
  height: text("height"),
  weight: text("weight"),
  injured: boolean("injured").notNull().default(false),
  photo: text("photo"),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const footballLineups = pgTable("football_lineups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fixtureId: integer("fixture_id").notNull(),
  teamId: integer("team_id").notNull(),
  formation: text("formation").notNull(),
  startXI: jsonb("start_xi").notNull(),
  substitutes: jsonb("substitutes").notNull(),
  coach: jsonb("coach"),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const footballFixtures = pgTable("football_fixtures", {
  id: integer("id").primaryKey(),
  referee: text("referee"),
  timezone: text("timezone").notNull(),
  date: timestamp("date").notNull(),
  timestamp: integer("timestamp"),
  periods: jsonb("periods"),
  venue: jsonb("venue"),
  status: jsonb("status").notNull(),
  leagueId: integer("league_id").notNull(),
  season: integer("season").notNull(),
  round: text("round"),
  homeTeamId: integer("home_team_id").notNull(),
  awayTeamId: integer("away_team_id").notNull(),
  goals: jsonb("goals"),
  score: jsonb("score"),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const footballStatistics = pgTable("football_statistics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fixtureId: integer("fixture_id").notNull(),
  teamId: integer("team_id").notNull(),
  statistics: jsonb("statistics").notNull(),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const teamMatchupAnalysis = pgTable("team_matchup_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeTeamId: integer("home_team_id").notNull(),
  awayTeamId: integer("away_team_id").notNull(),
  competitionId: integer("competition_id").notNull(),
  analysisType: text("analysis_type").notNull(), // 'head_to_head', 'form', 'statistics'
  resultJson: jsonb("result_json").notNull(),
  fixtureIds: text("fixture_ids").array().default(sql`'{}'::text[]`),
  seasonRange: text("season_range").notNull(),
  generatedAt: timestamp("generated_at").notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at").notNull(),
});

export const teamSeasonStatistics = pgTable("team_season_statistics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: integer("team_id").notNull(),
  leagueId: integer("league_id").notNull(),
  season: integer("season").notNull(),
  form: text("form"),
  matchesPlayed: integer("matches_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  goalsFor: integer("goals_for").notNull().default(0),
  goalsAgainst: integer("goals_against").notNull().default(0),
  cleanSheets: integer("clean_sheets").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
}, (table) => ({
  uniqueTeamSeasonLeague: unique("team_season_league_unique").on(table.teamId, table.leagueId, table.season),
}));

export const insertFootballCompetitionSchema = createInsertSchema(footballCompetitions);
export const insertFootballTeamSchema = createInsertSchema(footballTeams);
export const insertFootballPlayerSchema = createInsertSchema(footballPlayers);
export const insertFootballLineupSchema = createInsertSchema(footballLineups).omit({
  id: true,
});
export const insertFootballFixtureSchema = createInsertSchema(footballFixtures);
export const insertFootballStatisticsSchema = createInsertSchema(footballStatistics).omit({
  id: true,
});
export const insertTeamMatchupAnalysisSchema = createInsertSchema(teamMatchupAnalysis).omit({
  id: true,
});
export const insertTeamSeasonStatisticsSchema = createInsertSchema(teamSeasonStatistics).omit({
  id: true,
});

export type InsertFootballCompetition = z.infer<typeof insertFootballCompetitionSchema>;
export type FootballCompetition = typeof footballCompetitions.$inferSelect;
export type InsertFootballTeam = z.infer<typeof insertFootballTeamSchema>;
export type FootballTeam = typeof footballTeams.$inferSelect;
export type InsertFootballPlayer = z.infer<typeof insertFootballPlayerSchema>;
export type FootballPlayer = typeof footballPlayers.$inferSelect;
export type InsertFootballLineup = z.infer<typeof insertFootballLineupSchema>;
export type FootballLineup = typeof footballLineups.$inferSelect;
export type InsertFootballFixture = z.infer<typeof insertFootballFixtureSchema>;
export type FootballFixture = typeof footballFixtures.$inferSelect;
export type InsertFootballStatistics = z.infer<typeof insertFootballStatisticsSchema>;
export type FootballStatistics = typeof footballStatistics.$inferSelect;
export type InsertTeamMatchupAnalysis = z.infer<typeof insertTeamMatchupAnalysisSchema>;
export type TeamMatchupAnalysis = typeof teamMatchupAnalysis.$inferSelect;
export type InsertTeamSeasonStatistics = z.infer<typeof insertTeamSeasonStatisticsSchema>;
export type TeamSeasonStatistics = typeof teamSeasonStatistics.$inferSelect;

// Live Presentation System Schema
export const libraryItems = pgTable("library_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'image', 'template', 'dashboard', 'lower_third', 'ticker_item'
  name: text("name").notNull(),
  description: text("description").default(''),
  metaJson: jsonb("meta_json").notNull().default('{}'), // Contains type-specific metadata
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  category: text("category").notNull().default('General'),
  isStarred: boolean("is_starred").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  thumbnailUrl: text("thumbnail_url"),
  contentUrl: text("content_url"), // URL or reference to the actual content
  fileSize: text("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const scenes = pgTable("scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  layout: text("layout").notNull(), // 'single', 'split', 'grid', 'stack'
  elements: jsonb("elements").notNull().default('[]'), // Array of {itemId?, dataSource?, kind, slot, props}
  backgroundConfig: jsonb("background_config").notNull().default('{}'), // Background styling
  transitionConfig: jsonb("transition_config").notNull().default('{}'), // Transition effects
  aspectRatio: text("aspect_ratio").notNull().default('16:9'),
  isTemplate: boolean("is_template").notNull().default(false),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const presentationSets = pgTable("presentation_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  sceneIds: text("scene_ids").array().notNull().default(sql`'{}'::text[]`),
  defaultTickerId: varchar("default_ticker_id"),
  defaultTransition: text("default_transition").notNull().default('fade'),
  isActive: boolean("is_active").notNull().default(true),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const tickerPlaylists = pgTable("ticker_playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  items: jsonb("items").notNull().default('[]'), // Array of {text, source: 'manual'|'rss'|'stat', iconUrl?, expiry?}
  speed: integer("speed").notNull().default(50), // Pixels per second
  mode: text("mode").notNull().default('loop'), // 'loop', 'once'
  isActive: boolean("is_active").notNull().default(true),
  backgroundColor: text("background_color").default('#1a1a1a'),
  textColor: text("text_color").default('#ffffff'),
  fontSize: integer("font_size").notNull().default(16),
  height: integer("height").notNull().default(40),
  autoRefresh: boolean("auto_refresh").notNull().default(true),
  refreshInterval: integer("refresh_interval").notNull().default(300), // seconds
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const videoSources = pgTable("video_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  sourceType: text("source_type").notNull(), // 'camera', 'screen', 'media', 'rtmp', 'webrtc', 'youtube'
  deviceId: text("device_id"), // For camera/screen sources
  deviceLabel: text("device_label"),
  streamUrl: text("stream_url"), // For RTMP/WebRTC sources
  mediaFileId: varchar("media_file_id"), // Reference to library item for media files
  configJson: jsonb("config_json").notNull().default('{}'), // Resolution, frame rate, youtubeUrl, videoId, embedConfig, etc.
  isActive: boolean("is_active").notNull().default(true),
  isConnected: boolean("is_connected").notNull().default(false),
  lastConnectedAt: timestamp("last_connected_at"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const sourceTemplates = pgTable("source_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  sourceType: text("source_type").notNull(),
  configJson: jsonb("config_json").notNull().default('{}'),
  isDefault: boolean("is_default").notNull().default(false),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const setTemplates = pgTable("set_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  sceneTemplateIds: text("scene_template_ids").array().notNull().default(sql`'{}'::text[]`),
  configJson: jsonb("config_json").notNull().default('{}'),
  isDefault: boolean("is_default").notNull().default(false),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const sourceNamePresets = pgTable("source_name_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category").notNull().default('Custom'),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  category: text("category").notNull(),
  templateType: text("template_type").notNull(),
  styling: jsonb("styling").notNull().default('{}'),
  defaultContent: jsonb("default_content").notNull().default('{}'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const liveStates = pgTable("live_states", {
  id: varchar("id").primaryKey().default('default'),
  activeSources: jsonb("active_sources").notNull().default('[]'),
  overlays: jsonb("overlays").notNull().default('[]'),
  outputResolution: jsonb("output_resolution").notNull().default('{"width":3840,"height":2160}'),
  globalFitMode: text("global_fit_mode").notNull().default('contain'),
  sourceFitModes: jsonb("source_fit_modes").notNull().default('{}'),
  isBroadcasting: boolean("is_broadcasting").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSceneSchema = createInsertSchema(scenes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPresentationSetSchema = createInsertSchema(presentationSets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTickerPlaylistSchema = createInsertSchema(tickerPlaylists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoSourceSchema = createInsertSchema(videoSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastConnectedAt: true,
});

export const insertSourceTemplateSchema = createInsertSchema(sourceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSetTemplateSchema = createInsertSchema(setTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSourceNamePresetSchema = createInsertSchema(sourceNamePresets).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveStateSchema = createInsertSchema(liveStates).omit({
  id: true,
  updatedAt: true,
});

export type InsertLibraryItem = z.infer<typeof insertLibraryItemSchema>;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Scene = typeof scenes.$inferSelect;
export type InsertPresentationSet = z.infer<typeof insertPresentationSetSchema>;
export type PresentationSet = typeof presentationSets.$inferSelect;
export type InsertTickerPlaylist = z.infer<typeof insertTickerPlaylistSchema>;
export type TickerPlaylist = typeof tickerPlaylists.$inferSelect;
export type InsertVideoSource = z.infer<typeof insertVideoSourceSchema>;
export type VideoSource = typeof videoSources.$inferSelect;
export type InsertSourceTemplate = z.infer<typeof insertSourceTemplateSchema>;
export type SourceTemplate = typeof sourceTemplates.$inferSelect;
export type InsertSetTemplate = z.infer<typeof insertSetTemplateSchema>;
export type SetTemplate = typeof setTemplates.$inferSelect;
export type InsertSourceNamePreset = z.infer<typeof insertSourceNamePresetSchema>;
export type SourceNamePreset = typeof sourceNamePresets.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertLiveState = z.infer<typeof insertLiveStateSchema>;
export type LiveState = typeof liveStates.$inferSelect;
