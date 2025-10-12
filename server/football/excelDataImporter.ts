
import * as XLSX from 'xlsx';
import { db } from '../db';
import { 
  football_fixtures,
  football_teams,
  football_leagues,
  football_standings,
  football_team_statistics,
  type InsertFootballFixture,
  type InsertFootballTeam,
  type InsertFootballLeague,
  type InsertFootballStanding,
  type InsertFootballTeamStatistics
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface ExcelRow {
  [key: string]: any;
}

export class ExcelDataImporter {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async importData() {
    console.log('📊 Starting Excel data import...');
    
    try {
      const workbook = XLSX.readFile(this.filePath);
      console.log(`📋 Found ${workbook.SheetNames.length} sheets`);

      // Check if there's a manifest sheet
      const hasManifest = workbook.SheetNames.includes('📋 Manifest');
      
      if (hasManifest) {
        return await this.importFromManifest(workbook);
      } else {
        return await this.importDirectSheets(workbook);
      }

    } catch (error) {
      console.error('❌ Error importing Excel data:', error);
      throw error;
    }
  }

  private async importFromManifest(workbook: XLSX.WorkBook) {
    console.log('📋 Reading manifest-based workbook...');
    
    const manifestSheet = workbook.Sheets['📋 Manifest'];
    const manifest: ExcelRow[] = XLSX.utils.sheet_to_json(manifestSheet);
    
    console.log(`📊 Manifest contains ${manifest.length} table definitions`);

    let totalProcessed = 0;
    const results: any[] = [];

    // Process each table defined in manifest
    for (const entry of manifest) {
      const sheetName = entry['Source'] || entry['Name'];
      const tableName = entry['Name'];
      const tableType = entry['Type'];
      
      if (!sheetName || !workbook.Sheets[sheetName]) {
        console.log(`⚠️ Skipping ${tableName} - sheet not found`);
        continue;
      }

      console.log(`\n📄 Processing: ${tableName} (${tableType})`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
      
      const result = await this.processTableByName(tableName, data);
      if (result) {
        totalProcessed += result.rowsProcessed || 0;
        results.push(result);
      }
    }

    console.log(`\n✅ Excel import completed! Total rows: ${totalProcessed}`);
    return { success: true, rowsProcessed: totalProcessed, results };
  }

  private async importDirectSheets(workbook: XLSX.WorkBook) {
    console.log('📄 Processing sheets directly...');
    
    let totalProcessed = 0;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      console.log(`\n📄 Sheet: ${sheetName} (${data.length} rows)`);

      const firstRow = data[0];
      if (this.isFixtureData(firstRow)) {
        await this.importFixtures(data);
        totalProcessed += data.length;
      } else if (this.isStandingsData(firstRow)) {
        await this.importStandings(data);
        totalProcessed += data.length;
      } else if (this.isTeamStatsData(firstRow)) {
        await this.importTeamStats(data);
        totalProcessed += data.length;
      }
    }

    console.log('✅ Excel data import completed!');
    return { success: true, rowsProcessed: totalProcessed };
  }

  private async processTableByName(tableName: string, data: ExcelRow[]) {
    // Match table name patterns
    if (tableName.includes('Standard Stats')) {
      return await this.importPlayerStats(tableName, data);
    } else if (tableName.includes('Scores & Fixtures')) {
      return await this.importFixturesFromTable(tableName, data);
    } else if (tableName.includes('Standings') || tableName.includes('League Table')) {
      return await this.importStandings(data);
    } else {
      console.log(`⚠️ Unknown table type: ${tableName}`);
      return null;
    }
  }

  private async importPlayerStats(tableName: string, data: ExcelRow[]) {
    console.log(`📊 Importing player stats from: ${tableName}`);
    
    // Extract team name from table name (e.g., "Standard Stats 2025-2026 Wolverhampton Wanderers Table")
    const teamMatch = tableName.match(/Standard Stats \d{4}-\d{4} (.+?) Table/);
    const teamName = teamMatch ? teamMatch[1] : 'Unknown Team';
    
    let imported = 0;

    for (const row of data) {
      try {
        const playerName = row['Player'] || row['player'] || row['name'];
        if (!playerName || playerName === 'Squad Total') continue;

        const team = await this.ensureTeamExists(teamName);

        // Import player statistics
        const statsData: InsertFootballTeamStatistics = {
          team_id: team.id,
          league_id: 39, // Premier League
          games_played: parseInt(row['MP'] || row['Played'] || '0'),
          games_wins: 0,
          games_draws: 0,
          games_losses: 0,
          goals_for_total: parseInt(row['Gls'] || row['Goals'] || '0'),
          goals_against_total: 0,
          clean_sheets_total: 0
        };

        await db.insert(football_team_statistics)
          .values(statsData)
          .onConflictDoNothing();

        imported++;
      } catch (error) {
        console.warn(`⚠️ Failed to import player stats:`, error);
      }
    }

    console.log(`✅ Imported ${imported} player records`);
    return { rowsProcessed: imported };
  }

  private async importFixturesFromTable(tableName: string, data: ExcelRow[]) {
    console.log(`⚽ Importing fixtures from: ${tableName}`);
    
    const teamMatch = tableName.match(/Scores & Fixtures \d{4}-\d{4} (.+?):/);
    const teamName = teamMatch ? teamMatch[1] : 'Unknown Team';
    
    let imported = 0;

    for (const row of data) {
      try {
        const dateStr = row['Date'] || row['date'];
        const opponent = row['Opponent'] || row['opponent'];
        
        if (!dateStr || !opponent) continue;

        const team = await this.ensureTeamExists(teamName);
        const opponentTeam = await this.ensureTeamExists(opponent);
        const league = await this.ensureLeagueExists('Premier League', 'England');

        const fixtureData: InsertFootballFixture = {
          league_id: league.id,
          season: row['Season'] || '2025',
          round: row['Round'] || null,
          timestamp: new Date(dateStr),
          home_team_id: team.id,
          home_team_name: team.name,
          home_team_logo: team.logo,
          away_team_id: opponentTeam.id,
          away_team_name: opponentTeam.name,
          away_team_logo: opponentTeam.logo,
          goals_home: parseInt(row['GF'] || '0'),
          goals_away: parseInt(row['GA'] || '0'),
          status_short: 'FT',
          status_long: 'Match Finished',
          venue_name: row['Venue'] || null,
          venue_city: null
        };

        await db.insert(football_fixtures)
          .values(fixtureData)
          .onConflictDoNothing();

        imported++;
      } catch (error) {
        console.warn(`⚠️ Failed to import fixture:`, error);
      }
    }

    console.log(`✅ Imported ${imported} fixtures`);
    return { rowsProcessed: imported };
  }

  private isFixtureData(row: ExcelRow): boolean {
    const fixtureKeys = ['date', 'home_team', 'away_team', 'score', 'result'];
    return fixtureKeys.some(key => 
      Object.keys(row).some(k => k.toLowerCase().includes(key))
    );
  }

  private isStandingsData(row: ExcelRow): boolean {
    const standingsKeys = ['position', 'team', 'points', 'played'];
    return standingsKeys.some(key => 
      Object.keys(row).some(k => k.toLowerCase().includes(key))
    );
  }

  private isTeamStatsData(row: ExcelRow): boolean {
    const statsKeys = ['goals_for', 'goals_against', 'wins', 'draws'];
    return statsKeys.some(key => 
      Object.keys(row).some(k => k.toLowerCase().includes(key))
    );
  }

  private async importFixtures(data: ExcelRow[]) {
    console.log('🏟️ Importing fixtures data...');
    let imported = 0;

    for (const row of data) {
      try {
        // Ensure teams exist
        const homeTeam = await this.ensureTeamExists(row.home_team || row.HomeTeam || row['Home Team']);
        const awayTeam = await this.ensureTeamExists(row.away_team || row.AwayTeam || row['Away Team']);
        
        // Ensure league exists
        const league = await this.ensureLeagueExists('Premier League', 'England');

        const fixtureData: InsertFootballFixture = {
          league_id: league.id,
          season: row.season || '2024',
          round: row.round || row.matchday || null,
          timestamp: new Date(row.date || row.Date),
          home_team_id: homeTeam.id,
          home_team_name: homeTeam.name,
          home_team_logo: homeTeam.logo,
          away_team_id: awayTeam.id,
          away_team_name: awayTeam.name,
          away_team_logo: awayTeam.logo,
          goals_home: row.home_goals || row.home_score || null,
          goals_away: row.away_goals || row.away_score || null,
          status_short: row.status || 'FT',
          status_long: row.status === 'FT' ? 'Match Finished' : row.status,
          venue_name: row.venue || null,
          venue_city: row.city || null
        };

        await db.insert(football_fixtures)
          .values(fixtureData)
          .onConflictDoUpdate({
            target: [
              football_fixtures.home_team_name,
              football_fixtures.away_team_name,
              football_fixtures.timestamp,
              football_fixtures.league_id
            ],
            set: fixtureData
          });

        imported++;
      } catch (error) {
        console.warn(`⚠️ Failed to import fixture row:`, row, error);
      }
    }

    console.log(`✅ Imported ${imported} fixtures`);
  }

  private async importStandings(data: ExcelRow[]) {
    console.log('📊 Importing standings data...');
    let imported = 0;

    const league = await this.ensureLeagueExists('Premier League', 'England');

    for (const row of data) {
      try {
        const team = await this.ensureTeamExists(row.team || row.Team);

        const standingData: InsertFootballStanding = {
          league_id: league.id,
          season: row.season || '2024',
          rank: row.position || row.rank || row.Position,
          team_id: team.id,
          team_name: team.name,
          points: row.points || row.Points || 0,
          goals_diff: row.goal_difference || row.GD || 0,
          all_played: row.played || row.Played || 0,
          all_win: row.wins || row.W || 0,
          all_draw: row.draws || row.D || 0,
          all_lose: row.losses || row.L || 0,
          all_goals_for: row.goals_for || row.GF || 0,
          all_goals_against: row.goals_against || row.GA || 0,
          form: row.form || null,
          last_update: new Date()
        };

        await db.insert(football_standings)
          .values(standingData)
          .onConflictDoUpdate({
            target: [
              football_standings.league_id,
              football_standings.season,
              football_standings.team_id
            ],
            set: standingData
          });

        imported++;
      } catch (error) {
        console.warn(`⚠️ Failed to import standing row:`, row, error);
      }
    }

    console.log(`✅ Imported ${imported} standings`);
  }

  private async importTeamStats(data: ExcelRow[]) {
    console.log('📈 Importing team statistics...');
    let imported = 0;

    for (const row of data) {
      try {
        const team = await this.ensureTeamExists(row.team || row.Team);

        const statsData: InsertFootballTeamStatistics = {
          team_id: team.id,
          league_id: row.league_id || 39, // Premier League
          games_played: row.played || 0,
          games_wins: row.wins || 0,
          games_draws: row.draws || 0,
          games_losses: row.losses || 0,
          goals_for_total: row.goals_for || 0,
          goals_against_total: row.goals_against || 0,
          clean_sheets_total: row.clean_sheets || 0
        };

        await db.insert(football_team_statistics)
          .values(statsData)
          .onConflictDoUpdate({
            target: [
              football_team_statistics.team_id,
              football_team_statistics.fixture_id
            ],
            set: statsData
          });

        imported++;
      } catch (error) {
        console.warn(`⚠️ Failed to import team stats row:`, row, error);
      }
    }

    console.log(`✅ Imported ${imported} team statistics`);
  }

  private async importGeneric(data: ExcelRow[]) {
    console.log('📋 Attempting generic import based on column detection...');
    
    // Log the structure
    console.log('Columns found:', Object.keys(data[0]));
    console.log('Sample row:', data[0]);
    
    // You can add custom logic here based on your Excel structure
  }

  private async ensureTeamExists(teamName: string): Promise<any> {
    if (!teamName) throw new Error('Team name is required');

    const existing = await db.select()
      .from(football_teams)
      .where(eq(football_teams.name, teamName))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [newTeam] = await db.insert(football_teams)
      .values({
        name: teamName,
        country: 'England'
      })
      .returning();

    return newTeam;
  }

  private async ensureLeagueExists(name: string, country: string): Promise<any> {
    const existing = await db.select()
      .from(football_leagues)
      .where(
        and(
          eq(football_leagues.name, name),
          eq(football_leagues.country, country)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [newLeague] = await db.insert(football_leagues)
      .values({
        name,
        country,
        season: '2024',
        type: 'League'
      })
      .returning();

    return newLeague;
  }
}

// CLI execution
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  const filePath = process.argv[2] || 'attached_assets/extracted_data_20251012_002708_1760289279749.xlsx';
  
  const importer = new ExcelDataImporter(filePath);
  importer.importData()
    .then(result => {
      console.log('✅ Import completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}
