CREATE TABLE "audio_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"name" varchar(255),
	"source_url" text,
	"start_time" real,
	"duration" real,
	"volume" real,
	"fade_in" real,
	"fade_out" real,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clips" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"name" varchar(255),
	"source_url" text,
	"start_time" real,
	"end_time" real,
	"duration" real,
	"position" integer,
	"track" integer,
	"effects" text,
	"transitions" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"operation" varchar(10) NOT NULL,
	"target_table" varchar(100) NOT NULL,
	"status" varchar(20) NOT NULL,
	"records_affected" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"file_size" integer
);
--> statement-breakpoint
CREATE TABLE "data_sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"league_id" integer,
	"season" varchar(10),
	"action" varchar(50),
	"status" varchar(50),
	"records_processed" integer,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"api_calls_made" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_sync_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"league_id" integer,
	"season" varchar(10),
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"total_expected" integer,
	"total_synced" integer,
	"completeness_percentage" real,
	"sync_status" varchar(50),
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_update_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"schedule_cron" varchar(100),
	"last_run" timestamp,
	"next_run" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_competitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"type" varchar(50),
	"logo" text,
	"country" varchar(100),
	"season" varchar(10),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_fixtures" (
	"id" serial PRIMARY KEY NOT NULL,
	"referee" varchar(100),
	"timezone" varchar(50),
	"timestamp" timestamp,
	"venue_id" integer,
	"venue_name" varchar(255),
	"venue_city" varchar(100),
	"status_long" varchar(50),
	"status_short" varchar(10),
	"status_elapsed" integer,
	"league_id" integer,
	"season" varchar(10),
	"round" varchar(100),
	"home_team_id" integer,
	"home_team_name" varchar(255),
	"home_team_logo" text,
	"home_team_winner" boolean,
	"away_team_id" integer,
	"away_team_name" varchar(255),
	"away_team_logo" text,
	"away_team_winner" boolean,
	"goals_home" integer,
	"goals_away" integer,
	"score_halftime_home" integer,
	"score_halftime_away" integer,
	"score_fulltime_home" integer,
	"score_fulltime_away" integer,
	"score_extratime_home" integer,
	"score_extratime_away" integer,
	"score_penalty_home" integer,
	"score_penalty_away" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_lineups" (
	"id" serial PRIMARY KEY NOT NULL,
	"fixture_id" integer,
	"team_id" integer,
	"formation" varchar(20),
	"lineup" text,
	"substitutes" text,
	"coach" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"name" varchar(255) NOT NULL,
	"firstname" varchar(100),
	"lastname" varchar(100),
	"age" integer,
	"birth_date" timestamp,
	"birth_place" varchar(255),
	"birth_country" varchar(100),
	"nationality" varchar(100),
	"height" varchar(20),
	"weight" varchar(20),
	"photo" text,
	"position" varchar(50),
	"jersey_number" integer,
	"injured" boolean DEFAULT false,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"fixture_id" integer,
	"team_id" integer,
	"possession" integer,
	"shots_total" integer,
	"shots_on_target" integer,
	"shots_off_target" integer,
	"shots_blocked" integer,
	"corners" integer,
	"offsides" integer,
	"fouls" integer,
	"yellow_cards" integer,
	"red_cards" integer,
	"passes_total" integer,
	"passes_accurate" integer,
	"pass_percentage" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(10),
	"country" varchar(100),
	"founded" integer,
	"venue" varchar(255),
	"city" varchar(100),
	"capacity" integer,
	"logo" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_leagues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" varchar(100),
	"logo" text,
	"type" varchar(50),
	"season" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "football_player_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"team_id" integer,
	"league_id" integer,
	"season" varchar(10),
	"games_appearances" integer,
	"games_lineups" integer,
	"games_minutes" integer,
	"games_number" integer,
	"games_position" varchar(50),
	"games_rating" real,
	"games_captain" boolean,
	"substitutes_in" integer,
	"substitutes_out" integer,
	"substitutes_bench" integer,
	"shots_total" integer,
	"shots_on" integer,
	"goals_total" integer,
	"goals_conceded" integer,
	"goals_assists" integer,
	"goals_saves" integer,
	"passes_total" integer,
	"passes_key" integer,
	"passes_accuracy" integer,
	"tackles_total" integer,
	"tackles_blocks" integer,
	"tackles_interceptions" integer,
	"duels_total" integer,
	"duels_won" integer,
	"dribbles_attempts" integer,
	"dribbles_success" integer,
	"dribbles_past" integer,
	"fouls_drawn" integer,
	"fouls_committed" integer,
	"cards_yellow" integer,
	"cards_yellowred" integer,
	"cards_red" integer,
	"penalty_won" integer,
	"penalty_committed" integer,
	"penalty_scored" integer,
	"penalty_missed" integer,
	"penalty_saved" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_standings" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer,
	"season" varchar(10),
	"rank" integer,
	"team_id" integer,
	"team_name" varchar(255),
	"points" integer,
	"goals_diff" integer,
	"group" varchar(50),
	"form" varchar(20),
	"status" varchar(50),
	"description" text,
	"all_played" integer,
	"all_win" integer,
	"all_draw" integer,
	"all_lose" integer,
	"all_goals_for" integer,
	"all_goals_against" integer,
	"home_played" integer,
	"home_win" integer,
	"home_draw" integer,
	"home_lose" integer,
	"home_goals_for" integer,
	"home_goals_against" integer,
	"away_played" integer,
	"away_win" integer,
	"away_draw" integer,
	"away_lose" integer,
	"away_goals_for" integer,
	"away_goals_against" integer,
	"last_update" timestamp
);
--> statement-breakpoint
CREATE TABLE "football_team_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer,
	"fixture_id" integer,
	"league_id" integer,
	"games_played" integer,
	"games_wins" integer,
	"games_draws" integer,
	"games_losses" integer,
	"goals_for_total" integer,
	"goals_for_average" real,
	"goals_against_total" integer,
	"goals_against_average" real,
	"biggest_win_home" varchar(50),
	"biggest_win_away" varchar(50),
	"biggest_loss_home" varchar(50),
	"biggest_loss_away" varchar(50),
	"clean_sheets_home" integer,
	"clean_sheets_away" integer,
	"clean_sheets_total" integer,
	"failed_to_score_home" integer,
	"failed_to_score_away" integer,
	"failed_to_score_total" integer,
	"penalty_scored" integer,
	"penalty_missed" integer,
	"penalty_total" integer,
	"lineups" text,
	"cards_yellow" integer,
	"cards_red" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "framework_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "framework_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework_id" integer,
	"version" varchar(20),
	"changes" text,
	"template" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "frameworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template" text,
	"variables" text,
	"example" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "historical_head_to_head" (
	"id" serial PRIMARY KEY NOT NULL,
	"team1_id" integer,
	"team1_name" varchar(255),
	"team2_id" integer,
	"team2_name" varchar(255),
	"fixture_date" timestamp NOT NULL,
	"competition" varchar(255),
	"competition_id" integer,
	"venue" varchar(255),
	"home_team_id" integer,
	"away_team_id" integer,
	"team1_score" integer,
	"team2_score" integer,
	"winner" varchar(50),
	"season" integer,
	"last_updated" timestamp DEFAULT now(),
	"is_fallback" boolean DEFAULT false,
	"fallback_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"filename" varchar(255),
	"alt_text" text,
	"caption" text,
	"category" varchar(100),
	"width" integer,
	"height" integer,
	"size" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "keyframes" (
	"id" serial PRIMARY KEY NOT NULL,
	"clip_id" integer,
	"property" varchar(50),
	"time" real,
	"value" text,
	"easing" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"path" text,
	"url" text,
	"thumbnail_url" text,
	"metadata" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "live_states_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "player_season_statistics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"league_id" integer NOT NULL,
	"season" integer NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"appearances" integer DEFAULT 0 NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"rating" text,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presentation_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"scenes" text,
	"settings" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "presentation_styles" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"config" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "presentation_styles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"settings" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text,
	"duration" real,
	"size" integer,
	"format" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "render_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"status" varchar(50),
	"progress" integer,
	"output_url" text,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_renderings" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer,
	"format" varchar(50),
	"url" text,
	"status" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"content" text,
	"type" varchar(50),
	"status" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rss_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer,
	"analysis_type" varchar(50),
	"content" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rss_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"title" text NOT NULL,
	"link" text,
	"description" text,
	"published_at" timestamp,
	"guid" text,
	"author" varchar(255),
	"categories" text[],
	"sentiment_score" real,
	"keywords" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rss_comparisons" (
	"id" serial PRIMARY KEY NOT NULL,
	"article1_id" integer,
	"article2_id" integer,
	"similarity_score" real,
	"comparison_type" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rss_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"feed_url" text NOT NULL,
	"description" text,
	"category" varchar(100),
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"last_fetched_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scenes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"layout" text,
	"elements" text,
	"background_config" text,
	"transition_config" text,
	"aspect_ratio" text,
	"is_template" boolean DEFAULT false,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "set_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"config" text,
	"preview_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "source_name_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50),
	"config" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "source_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50),
	"config" text,
	"preview_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_matchup_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"team1_id" integer,
	"team2_id" integer,
	"analysis_date" timestamp,
	"h2h_wins_team1" integer,
	"h2h_wins_team2" integer,
	"h2h_draws" integer,
	"avg_goals_team1" real,
	"avg_goals_team2" real,
	"form_team1" varchar(20),
	"form_team2" varchar(20),
	"prediction" text,
	"confidence_score" real,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_season_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer,
	"season" varchar(10),
	"competition" varchar(255),
	"matches_played" integer,
	"wins" integer,
	"draws" integer,
	"losses" integer,
	"goals_for" integer,
	"goals_against" integer,
	"goal_difference" integer,
	"points" integer,
	"position" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"type" varchar(50),
	"content" text,
	"settings" text,
	"preview_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "text_overlays" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"text" text,
	"font_family" varchar(100),
	"font_size" integer,
	"font_color" varchar(20),
	"position_x" real,
	"position_y" real,
	"start_time" real,
	"end_time" real,
	"animation" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticker_playlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"items" text,
	"speed" integer,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"role" varchar(50),
	"preferences" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "agent_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"user_confirmed" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_task_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"step_id" text NOT NULL,
	"description" text NOT NULL,
	"completed" boolean DEFAULT false,
	"result" text,
	"timestamp" timestamp
);
--> statement-breakpoint
ALTER TABLE "agent_task_steps" ADD CONSTRAINT "agent_task_steps_task_id_agent_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."agent_tasks"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "video_clips" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"name" varchar(255),
	"source_url" text,
	"start_time" real,
	"end_time" real,
	"duration" real,
	"position" integer,
	"track" integer,
	"effects" text,
	"transitions" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"settings" text,
	"duration" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50),
	"url" text,
	"settings" text,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audio_tracks" ADD CONSTRAINT "audio_tracks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_fixtures" ADD CONSTRAINT "football_fixtures_league_id_football_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."football_leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_fixtures" ADD CONSTRAINT "football_fixtures_home_team_id_football_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_fixtures" ADD CONSTRAINT "football_fixtures_away_team_id_football_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_lineups" ADD CONSTRAINT "football_lineups_fixture_id_football_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."football_fixtures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_lineups" ADD CONSTRAINT "football_lineups_team_id_football_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_statistics" ADD CONSTRAINT "football_statistics_fixture_id_football_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."football_fixtures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_statistics" ADD CONSTRAINT "football_statistics_team_id_football_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_player_statistics" ADD CONSTRAINT "football_player_statistics_player_id_football_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."football_players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_player_statistics" ADD CONSTRAINT "football_player_statistics_team_id_football_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_player_statistics" ADD CONSTRAINT "football_player_statistics_league_id_football_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."football_leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_standings" ADD CONSTRAINT "football_standings_league_id_football_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."football_leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_standings" ADD CONSTRAINT "football_standings_team_id_football_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_team_statistics" ADD CONSTRAINT "football_team_statistics_team_id_football_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_team_statistics" ADD CONSTRAINT "football_team_statistics_fixture_id_football_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."football_fixtures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_team_statistics" ADD CONSTRAINT "football_team_statistics_league_id_football_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."football_leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_versions" ADD CONSTRAINT "framework_versions_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frameworks" ADD CONSTRAINT "frameworks_category_id_framework_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."framework_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_head_to_head" ADD CONSTRAINT "historical_head_to_head_team1_id_football_teams_id_fk" FOREIGN KEY ("team1_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_head_to_head" ADD CONSTRAINT "historical_head_to_head_team2_id_football_teams_id_fk" FOREIGN KEY ("team2_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyframes" ADD CONSTRAINT "keyframes_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_renderings" ADD CONSTRAINT "report_renderings_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rss_analysis" ADD CONSTRAINT "rss_analysis_article_id_rss_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."rss_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rss_articles" ADD CONSTRAINT "rss_articles_source_id_rss_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."rss_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rss_comparisons" ADD CONSTRAINT "rss_comparisons_article1_id_rss_articles_id_fk" FOREIGN KEY ("article1_id") REFERENCES "public"."rss_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rss_comparisons" ADD CONSTRAINT "rss_comparisons_article2_id_rss_articles_id_fk" FOREIGN KEY ("article2_id") REFERENCES "public"."rss_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_matchup_analysis" ADD CONSTRAINT "team_matchup_analysis_team1_id_football_teams_id_fk" FOREIGN KEY ("team1_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_matchup_analysis" ADD CONSTRAINT "team_matchup_analysis_team2_id_football_teams_id_fk" FOREIGN KEY ("team2_id") REFERENCES "public"."football_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_overlays" ADD CONSTRAINT "text_overlays_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_clips" ADD CONSTRAINT "video_clips_project_id_video_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."video_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sync_logs_resource" ON "data_sync_logs" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_status" ON "data_sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_created" ON "data_sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sync_status_resource" ON "data_sync_status" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_sync_status_status" ON "data_sync_status" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "idx_sync_status_next_sync" ON "data_sync_status" USING btree ("next_sync_at");--> statement-breakpoint
CREATE INDEX "idx_football_fixtures_league_id" ON "football_fixtures" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_football_fixtures_home_team_id" ON "football_fixtures" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "idx_football_fixtures_away_team_id" ON "football_fixtures" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "idx_football_fixtures_timestamp" ON "football_fixtures" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_football_fixtures_season" ON "football_fixtures" USING btree ("season");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lineups_fixture_team" ON "football_lineups" USING btree ("fixture_id","team_id");--> statement-breakpoint
CREATE INDEX "idx_football_players_name" ON "football_players" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_football_players_position" ON "football_players" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_football_players_player_id" ON "football_players" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_statistics_fixture_team" ON "football_statistics" USING btree ("fixture_id","team_id");--> statement-breakpoint
CREATE INDEX "idx_football_teams_name" ON "football_teams" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_football_teams_code" ON "football_teams" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_football_teams_country" ON "football_teams" USING btree ("country");--> statement-breakpoint
CREATE INDEX "idx_football_leagues_name_season" ON "football_leagues" USING btree ("name","season");--> statement-breakpoint
CREATE INDEX "idx_football_leagues_country" ON "football_leagues" USING btree ("country");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_player_stats_unique" ON "football_player_statistics" USING btree ("player_id","season","league_id");--> statement-breakpoint
CREATE INDEX "idx_player_stats_team_id" ON "football_player_statistics" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_player_stats_league_id" ON "football_player_statistics" USING btree ("league_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_football_standings_unique" ON "football_standings" USING btree ("league_id","season","team_id");--> statement-breakpoint
CREATE INDEX "idx_football_standings_rank" ON "football_standings" USING btree ("rank");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_team_stats_unique" ON "football_team_statistics" USING btree ("team_id","fixture_id");--> statement-breakpoint
CREATE INDEX "idx_team_stats_league_id" ON "football_team_statistics" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_h2h_fixture_date" ON "historical_head_to_head" USING btree ("fixture_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_h2h_teams_date" ON "historical_head_to_head" USING btree ("team1_id","team2_id","fixture_date");--> statement-breakpoint
CREATE INDEX "idx_h2h_season" ON "historical_head_to_head" USING btree ("season");--> statement-breakpoint
CREATE INDEX "idx_h2h_last_updated" ON "historical_head_to_head" USING btree ("last_updated");--> statement-breakpoint
CREATE UNIQUE INDEX "player_season_league_unique" ON "player_season_statistics" USING btree ("player_id","team_id","league_id","season");