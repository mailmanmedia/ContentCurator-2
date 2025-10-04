import fs from 'fs';
import path from 'path';

interface StaticFootballData {
  version: string;
  lastUpdated: string;
  competitions: Record<string, any>;
  venues: Record<string, any>;
  historicalMatches: any[];
  seasonTables: Record<string, any>;
}

interface SeedPlayersData {
  version: string;
  lastUpdated: string;
  liverpool: any[];
  topSix: Record<string, any[]>;
  topScorers: any[];
  topAssisters: any[];
}

class StaticDataLoader {
  private static staticData: StaticFootballData | null = null;
  private static seedPlayers: SeedPlayersData | null = null;
  private static dataDir = path.join(process.cwd(), 'server', 'data');

  static loadStaticData(): StaticFootballData {
    if (this.staticData) {
      return this.staticData;
    }
    
    try {
      const filePath = path.join(this.dataDir, 'staticFootballData.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      this.staticData = JSON.parse(fileContent);
      console.log(`✅ Loaded static football data v${this.staticData?.version} (${this.staticData?.historicalMatches.length} matches)`);
    } catch (error) {
      console.warn('⚠️ Could not load static football data:', error);
      this.staticData = {
        version: '0.0',
        lastUpdated: new Date().toISOString(),
        competitions: {},
        venues: {},
        historicalMatches: [],
        seasonTables: {}
      };
    }
    
    return this.staticData!;
  }

  static loadSeedPlayers(): SeedPlayersData {
    if (this.seedPlayers) {
      return this.seedPlayers;
    }
    
    try {
      const filePath = path.join(this.dataDir, 'seedPlayers.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      this.seedPlayers = JSON.parse(fileContent);
      console.log(`✅ Loaded seed players v${this.seedPlayers?.version} (${this.seedPlayers?.liverpool.length} Liverpool players)`);
    } catch (error) {
      console.warn('⚠️ Could not load seed players:', error);
      this.seedPlayers = {
        version: '0.0',
        lastUpdated: new Date().toISOString(),
        liverpool: [],
        topSix: {},
        topScorers: [],
        topAssisters: []
      };
    }
    
    return this.seedPlayers!;
  }

  // Get competition by ID from static data
  static getCompetition(id: number): any | null {
    const data = this.loadStaticData();
    return data.competitions[id.toString()] || null;
  }

  // Get all competitions
  static getAllCompetitions(): any[] {
    const data = this.loadStaticData();
    return Object.values(data.competitions);
  }

  // Get historical matches for a team (most recent first)
  static getHistoricalMatches(teamId: number, limit?: number): any[] {
    const data = this.loadStaticData();
    const matches = data.historicalMatches
      .filter(
        (match: any) => 
          match.teams.home.id === teamId || match.teams.away.id === teamId
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
    
    return limit ? matches.slice(0, limit) : matches;
  }

  // Get historical matches between two teams (most recent first)
  static getHeadToHeadMatches(team1Id: number, team2Id: number, limit?: number): any[] {
    const data = this.loadStaticData();
    const matches = data.historicalMatches
      .filter(
        (match: any) =>
          (match.teams.home.id === team1Id && match.teams.away.id === team2Id) ||
          (match.teams.home.id === team2Id && match.teams.away.id === team1Id)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
    
    return limit ? matches.slice(0, limit) : matches;
  }

  // Get season table
  static getSeasonTable(season: number): any[] | null {
    const data = this.loadStaticData();
    return data.seasonTables[season.toString()] || null;
  }

  // Get team players from seed data
  static getTeamPlayers(teamId: number): any[] {
    const players = this.loadSeedPlayers();
    
    // Check if it's Liverpool
    if (teamId === 40) {
      return players.liverpool;
    }
    
    // Check top 6 teams
    const teamMap: Record<number, string> = {
      50: 'manCity',
      42: 'arsenal',
      33: 'manUnited',
      49: 'chelsea',
      47: 'tottenham',
      34: 'newcastle'
    };
    
    const teamKey = teamMap[teamId];
    if (teamKey && players.topSix[teamKey]) {
      return players.topSix[teamKey];
    }
    
    return [];
  }

  // Check if we have player data for a team
  static hasTeamPlayers(teamId: number): boolean {
    return this.getTeamPlayers(teamId).length > 0;
  }

  // Get data age in days
  static getDataAge(): number {
    const data = this.loadStaticData();
    const lastUpdated = new Date(data.lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Get statistics about loaded data
  static getStats() {
    const staticData = this.loadStaticData();
    const seedPlayers = this.loadSeedPlayers();
    
    return {
      static: {
        version: staticData.version,
        lastUpdated: staticData.lastUpdated,
        ageInDays: this.getDataAge(),
        competitions: Object.keys(staticData.competitions).length,
        venues: Object.keys(staticData.venues).length,
        historicalMatches: staticData.historicalMatches.length,
        seasonTables: Object.keys(staticData.seasonTables).length
      },
      players: {
        version: seedPlayers.version,
        liverpool: seedPlayers.liverpool.length,
        topSixTeams: Object.keys(seedPlayers.topSix).length,
        topScorers: seedPlayers.topScorers.length,
        topAssisters: seedPlayers.topAssisters.length
      }
    };
  }
}

export default StaticDataLoader;
