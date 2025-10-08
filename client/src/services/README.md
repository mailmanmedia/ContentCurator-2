# Football Data Service

A centralized service for fetching football data with automatic multi-source fallback and caching.

## Features

- **Multi-source fallback**: Automatically tries The Fishy API → FBRef API → localStorage cache
- **Automatic caching**: Successful responses are cached with configurable expiry times
- **Source attribution**: Every response includes the data source and timestamp
- **Type-safe**: Full TypeScript support with exported types
- **Error handling**: Graceful degradation when all sources fail
- **Debug logging**: Console logs show which source was used for each request

## Installation

```typescript
import { footballDataService } from '@/services/footballDataService';
```

## API Reference

### Methods

#### `getLeagueTable()`
Get Premier League standings

- **Cache expiry**: 1 hour
- **Primary source**: The Fishy API
- **Fallback source**: FBRef API
- **Returns**: `Promise<DataResponse<TableEntry[]>>`

```typescript
const result = await footballDataService.getLeagueTable();
if (result.data) {
  console.log(`Table from ${result.source}:`, result.data);
}
```

#### `getPlayerStats(teamId?: string)`
Get Liverpool player statistics

- **Cache expiry**: 30 minutes
- **Primary source**: FBRef API
- **Returns**: `Promise<DataResponse<PlayerStats[]>>`

```typescript
const result = await footballDataService.getPlayerStats();
if (result.data) {
  console.log(`Players from ${result.source}:`, result.data);
}
```

#### `getTeamData(teamName: string)`
Get team data with enriched information

- **Cache expiry**: 30 minutes
- **Primary source**: The Fishy API
- **Fallback source**: FBRef API
- **Returns**: `Promise<DataResponse<TeamData>>`

```typescript
const result = await footballDataService.getTeamData('Liverpool');
if (result.data) {
  console.log(`Form: ${result.data.form?.join(', ')}`);
}
```

#### `getFixtures()`
Get upcoming Liverpool fixtures

- **Cache expiry**: 5 minutes
- **Primary source**: Liverpool API
- **Returns**: `Promise<DataResponse<{ fixtures: Fixture[] }>>`

```typescript
const result = await footballDataService.getFixtures();
if (result.data?.fixtures) {
  console.log(`Next match: ${result.data.fixtures[0]}`);
}
```

#### `getH2HData(homeTeamId: string, awayTeamId: string)`
Get head-to-head match history

- **Cache expiry**: 1 hour
- **Primary source**: Football API
- **Returns**: `Promise<DataResponse<H2HData>>`

```typescript
const result = await footballDataService.getH2HData('64', '65');
if (result.data?.matches) {
  console.log(`Recent matches:`, result.data.matches);
}
```

#### `getTopScorers()`
Get Liverpool top scorers

- **Cache expiry**: 30 minutes
- **Returns**: `Promise<DataResponse<PlayerStats[]>>`

```typescript
const result = await footballDataService.getTopScorers();
```

### Utility Methods

#### `clearCache()`
Clear all cached football data

```typescript
footballDataService.clearCache();
```

#### `getCacheStatus(cacheKey: string)`
Get cache status for a specific key

```typescript
const status = footballDataService.getCacheStatus('football_league_table');
if (status.exists) {
  console.log(`Age: ${status.ageMinutes} minutes`);
}
```

## React Usage Example

```typescript
import { useEffect, useState } from 'react';
import { footballDataService, DataResponse, TableEntry } from '@/services/footballDataService';

function LeagueTable() {
  const [data, setData] = useState<DataResponse<TableEntry[]> | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await footballDataService.getLeagueTable();
      setData(result);
      setLoading(false);
    }
    
    fetchData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (!data?.data) return <div>No data available</div>;
  
  return (
    <div>
      <p>Source: {data.source} | Updated: {new Date(data.timestamp).toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Team</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((team) => (
            <tr key={team.position}>
              <td>{team.position}</td>
              <td>{team.team}</td>
              <td>{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Response Format

All methods return a `DataResponse<T>` object:

```typescript
interface DataResponse<T> {
  data: T | null;                                    // The actual data or null if failed
  source: 'thefishy' | 'fbref' | 'cache' | 'none';  // Where the data came from
  timestamp: string;                                 // ISO timestamp of the data
  error?: string;                                    // Error message if all sources failed
}
```

## Data Source Priority

1. **The Fishy API** (Primary)
   - `/api/football/premier-league/table`
   - `/api/football/team/:teamName/form`

2. **FBRef API** (Secondary)
   - `/api/football/fbref/table`
   - `/api/football/fbref/liverpool/players`

3. **localStorage Cache** (Tertiary)
   - Used when both APIs fail
   - Automatic expiry based on data type

## Cache Expiry Times

| Data Type | Expiry Time |
|-----------|-------------|
| League Table | 1 hour |
| Player Stats | 30 minutes |
| Team Data | 30 minutes |
| Fixtures | 5 minutes |
| Head-to-Head | 1 hour |

## Error Handling

```typescript
const result = await footballDataService.getLeagueTable();

if (result.source === 'none') {
  // All sources failed
  console.error('All data sources failed:', result.error);
} else if (result.source === 'cache') {
  // Using cached data (might be stale)
  console.warn('Using cached data');
} else {
  // Fresh data from API
  console.log('Fresh data from API');
}
```

## Exported Types

```typescript
export interface TableEntry {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

export interface PlayerStats {
  name: string;
  position: string;
  age?: number;
  matches?: number;
  starts?: number;
  goals?: number;
  assists?: number;
  [key: string]: any;
}

export interface TeamData {
  name: string;
  form?: string[];
  position?: number;
  [key: string]: any;
}

export interface Fixture {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  competition?: string;
  [key: string]: any;
}

export interface H2HData {
  matches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    competition?: string;
  }>;
  [key: string]: any;
}
```

## Console Logging

The service logs all operations to the console with a `[FootballDataService]` prefix:

- `✓` indicates successful operations
- `✗` indicates failures
- Shows which source was used for each request
- Reports cache age and status

Example console output:
```
[FootballDataService] Fetching from primary source: /api/football/premier-league/table
[FootballDataService] ✓ Primary source successful (The Fishy)
[FootballDataService] Cached data for: football_league_table (source: thefishy)
```
