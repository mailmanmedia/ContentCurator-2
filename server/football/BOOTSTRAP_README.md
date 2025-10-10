# Historical Data Bootstrap Service

## Overview

The Historical Data Bootstrap Service is a comprehensive tool for fetching and storing historical football data from the API-Football service. It supports Premier League and Champions League data from 2020 to present, with intelligent rate limiting, error recovery, and progress tracking.

## Features

- **Comprehensive Data Import**: Fetches leagues, teams, players, fixtures, standings, and statistics
- **Rate Limit Compliance**: Automatically handles API rate limits (10 requests/minute)
- **Progress Tracking**: Real-time logging and database sync status tracking
- **Error Recovery**: Automatic retry mechanism for failed requests
- **Batch Operations**: Efficient database operations with configurable batch sizes
- **Resume Capability**: Can resume from interruptions based on sync status
- **CLI Support**: Command-line interface with customizable options

## Prerequisites

1. **API Key**: You need an API-Football key from https://www.api-football.com/
2. **Environment Variable**: Set your API key:
   ```bash
   export API_FOOTBALL_KEY=your_api_key_here
   ```
3. **Database**: PostgreSQL database must be running and accessible via DATABASE_URL

## Installation

The service is already integrated into the project. No additional installation required.

## Usage

### Quick Test

First, run the test script to verify everything is working:

```bash
tsx server/football/testBootstrap.ts
```

This will:
- Test API connection
- Verify database connectivity
- Run a minimal bootstrap (leagues only)
- Check sync logs and status

### Running Full Bootstrap

#### Method 1: Using the Runner Script (Recommended)

```bash
tsx server/football/runBootstrap.ts
```

#### Method 2: Direct Execution

```bash
tsx server/football/historicalDataBootstrap.ts
```

#### Method 3: With Custom Options

```bash
# Specific leagues and seasons
tsx server/football/historicalDataBootstrap.ts --leagues=39 --seasons=2024,2025

# Skip existing data
tsx server/football/historicalDataBootstrap.ts --skip-existing

# Custom batch size and delay
tsx server/football/historicalDataBootstrap.ts --batch-size=50 --delay=2000

# Complete example
tsx server/football/historicalDataBootstrap.ts --leagues=39,2 --seasons=2023,2024,2025 --skip-existing --batch-size=100
```

### Command Line Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--leagues` | Comma-separated league IDs | 39,2 | `--leagues=39,2` |
| `--seasons` | Comma-separated seasons | 2020-2025 | `--seasons=2023,2024` |
| `--batch-size` | Records per batch insert | 100 | `--batch-size=50` |
| `--delay` | Delay between API calls (ms) | 1000 | `--delay=2000` |
| `--skip-existing` | Skip already imported data | false | `--skip-existing` |
| `--help` | Show help message | - | `--help` |

## League IDs Reference

- **39**: Premier League (England)
- **2**: UEFA Champions League
- **61**: Ligue 1 (France)
- **78**: Bundesliga (Germany)
- **135**: Serie A (Italy)
- **140**: La Liga (Spain)

## Bootstrap Process

The bootstrap follows this sequence:

1. **Leagues**: Fetches league information for each season
2. **Teams**: Fetches all teams participating in each league/season
3. **Fixtures**: Fetches all matches for each league/season
4. **Standings**: Fetches league tables for each season
5. **Team Statistics**: Fetches detailed team statistics
6. **Players**: Fetches all players for each team/season
7. **Player Statistics**: Fetches individual player statistics (most resource-intensive)

## Database Tables Used

The service populates these tables:

- `football_leagues` - League information
- `football_teams` - Team details
- `football_players` - Player information
- `football_fixtures` - Match fixtures and results
- `football_standings` - League standings
- `football_team_statistics` - Team performance statistics
- `football_player_statistics` - Individual player statistics
- `data_sync_status` - Tracks synchronization progress
- `data_sync_logs` - Logs of sync operations

## Progress Tracking

### Console Output

The service provides detailed console output:

```
════════════════════════════════════════════════════════
      HISTORICAL DATA BOOTSTRAP - STARTING
════════════════════════════════════════════════════════
Leagues: 39, 2
Seasons: 2020, 2021, 2022, 2023, 2024, 2025
Batch Size: 100
Skip Existing: false
════════════════════════════════════════════════════════

📊 Phase 1: Fetching Leagues...
  → Fetching league 39 for season 2020...
    ✓ Saved league: Premier League (2020)
  ✅ Leagues completed: 12 saved

🏟️ Phase 2: Fetching Teams...
  → Fetching teams for league 39, season 2020...
    ✓ Saved 20 teams
  ✅ Teams completed: 240 saved
```

### Database Tracking

Check sync status:

```sql
-- View sync status
SELECT * FROM data_sync_status ORDER BY last_sync_at DESC;

-- View sync logs
SELECT * FROM data_sync_logs ORDER BY created_at DESC LIMIT 10;

-- Check completion percentage
SELECT 
  resource_type,
  COUNT(*) as leagues_seasons,
  AVG(completeness_percentage) as avg_completion
FROM data_sync_status
GROUP BY resource_type;
```

## Error Handling

The service includes robust error handling:

1. **API Errors**: Automatically retries with exponential backoff
2. **Rate Limiting**: Queues requests when rate limit is reached
3. **Database Errors**: Logs errors and continues with next item
4. **Failed Items**: Collects and retries at the end
5. **Critical Failures**: Generates detailed error report

## Performance Considerations

### API Rate Limits

- **Free Tier**: 100 requests/day, 10 requests/minute
- The service automatically manages rate limits
- Estimated time for full bootstrap: 2-3 hours (with delays)

### Resource Usage

- **Memory**: ~200-500MB depending on batch size
- **Database**: Ensure sufficient storage (expect ~100MB of data)
- **Network**: Stable internet connection required

### Optimization Tips

1. **Run During Off-Peak**: Less load on API servers
2. **Use --skip-existing**: Avoid re-fetching unchanged data
3. **Smaller Batch Size**: Reduces memory usage
4. **Increase Delay**: Reduces API pressure

## Troubleshooting

### Common Issues

#### 1. API Key Not Set
```
Error: API_FOOTBALL_KEY environment variable is not set
```
**Solution**: Set the environment variable with your API key

#### 2. Rate Limit Exceeded
```
Rate limit reached. Waiting...
```
**Solution**: This is normal. The service will automatically wait and retry

#### 3. Database Connection Failed
```
Error: DATABASE_URL must be set
```
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is configured

#### 4. Quota Exceeded
```
Error: API quota exceeded. Please check your subscription
```
**Solution**: Wait until quota resets (usually daily) or upgrade your API plan

### Verification

After bootstrap, verify data:

```sql
-- Count imported data
SELECT 
  'Leagues' as type, COUNT(*) as count FROM football_leagues
UNION ALL SELECT 'Teams', COUNT(*) FROM football_teams
UNION ALL SELECT 'Players', COUNT(*) FROM football_players
UNION ALL SELECT 'Fixtures', COUNT(*) FROM football_fixtures
UNION ALL SELECT 'Standings', COUNT(*) FROM football_standings;
```

## Maintenance

### Regular Updates

Schedule regular updates to keep data current:

```bash
# Daily update (current season only)
tsx server/football/historicalDataBootstrap.ts --seasons=2025 --skip-existing

# Weekly full refresh
tsx server/football/historicalDataBootstrap.ts --skip-existing
```

### Cleanup Old Data

```sql
-- Remove data older than 3 years
DELETE FROM football_fixtures 
WHERE season::integer < EXTRACT(YEAR FROM NOW()) - 3;
```

## Support

For issues or questions:

1. Check the sync logs: `SELECT * FROM data_sync_logs WHERE status = 'failed'`
2. Review console output for specific error messages
3. Verify API key and database connectivity
4. Check API-Football service status

## License

This service uses the API-Football service. Please ensure compliance with their terms of service.

---

**Note**: Player statistics fetching is the most resource-intensive operation and may require a paid API plan for comprehensive data. The free tier may have limitations on detailed player statistics.