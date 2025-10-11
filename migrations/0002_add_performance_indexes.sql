
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_football_fixtures_date ON football_fixtures(date);
CREATE INDEX IF NOT EXISTS idx_football_fixtures_home_team ON football_fixtures(home_team_id);
CREATE INDEX IF NOT EXISTS idx_football_fixtures_away_team ON football_fixtures(away_team_id);
CREATE INDEX IF NOT EXISTS idx_football_fixtures_league_season ON football_fixtures(league_id, season);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_season ON player_season_statistics(player_id, season);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_season ON player_season_statistics(team_id, season);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_task_steps_task_id ON agent_task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_rss_articles_source ON rss_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_rss_articles_published ON rss_articles(published_at DESC);
