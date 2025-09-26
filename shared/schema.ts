import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
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
