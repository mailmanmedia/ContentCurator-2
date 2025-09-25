import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
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
