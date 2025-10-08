import axios from 'axios';

interface PlayerStats {
  name: string;
  position: string;
  age: number;
  matches: number;
  starts: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutes: number;
}

interface TeamStats {
  name: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

class FBRefService {
  private readonly BASE_URL = 'https://fbref.com';
  
  async getPremierLeagueTable(): Promise<TeamStats[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/en/comps/9/Premier-League-Stats`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const html = response.data;
      const stats: TeamStats[] = [];

      // FBRef uses specific table structure - find the league table
      const tableRegex = /<table[^>]*class="[^"]*stats_table[^"]*"[^>]*>([\s\S]*?)<\/table>/g;
      const tables = html.match(tableRegex) || [];

      for (const table of tables) {
        // Look for the standings table (contains squad names and points)
        if (table.includes('Squad') && table.includes('Pts')) {
          const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
          const rows = table.match(rowRegex) || [];
          
          let position = 1;
          
          for (const row of rows) {
            // Skip header rows
            if (row.includes('<th')) {
              continue;
            }

            // Extract cell data
            const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
            const cells: string[] = [];
            let match;

            while ((match = cellRegex.exec(row)) !== null) {
              const cellContent = match[1]
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim();
              cells.push(cellContent);
            }

            // FBRef table format: Squad, MP, W, D, L, GF, GA, GD, Pts, ...
            if (cells.length >= 9) {
              const name = cells[0];
              const matches = parseInt(cells[1]) || 0;
              const wins = parseInt(cells[2]) || 0;
              const draws = parseInt(cells[3]) || 0;
              const losses = parseInt(cells[4]) || 0;
              const goalsFor = parseInt(cells[5]) || 0;
              const goalsAgainst = parseInt(cells[6]) || 0;
              const goalDifference = parseInt(cells[7]) || 0;
              const points = parseInt(cells[8]) || 0;

              if (name && matches > 0) {
                stats.push({
                  name,
                  matches,
                  wins,
                  draws,
                  losses,
                  goalsFor,
                  goalsAgainst,
                  goalDifference,
                  points,
                  position: position++,
                });
              }
            }
          }
          
          break; // Found the table, stop searching
        }
      }

      return stats.sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('Error fetching Premier League table from FBRef:', error);
      return [];
    }
  }

  async getLiverpoolPlayerStats(): Promise<PlayerStats[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/en/squads/822bd0ba/Liverpool-Stats`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const html = response.data;
      const players: PlayerStats[] = [];

      // Find the player statistics table
      const tableRegex = /<table[^>]*class="[^"]*stats_table[^"]*"[^>]*>([\s\S]*?)<\/table>/g;
      const tables = html.match(tableRegex) || [];

      for (const table of tables) {
        if (table.includes('Player') && (table.includes('Goals') || table.includes('Gls'))) {
          const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
          const rows = table.match(rowRegex) || [];

          for (const row of rows) {
            if (row.includes('<th')) {
              continue;
            }

            const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
            const cells: string[] = [];
            let match;

            while ((match = cellRegex.exec(row)) !== null) {
              const cellContent = match[1]
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim();
              cells.push(cellContent);
            }

            // FBRef player table: Player, Nation, Pos, Age, MP, Starts, Min, Gls, Ast, CrdY, CrdR, ...
            if (cells.length >= 11) {
              const name = cells[0];
              const position = cells[2] || 'N/A';
              const age = parseInt(cells[3]) || 0;
              const matches = parseInt(cells[4]) || 0;
              const starts = parseInt(cells[5]) || 0;
              const minutes = parseInt(cells[6]?.replace(/,/g, '')) || 0;
              const goals = parseInt(cells[7]) || 0;
              const assists = parseInt(cells[8]) || 0;
              const yellowCards = parseInt(cells[9]) || 0;
              const redCards = parseInt(cells[10]) || 0;

              if (name && matches > 0) {
                players.push({
                  name,
                  position,
                  age,
                  matches,
                  starts,
                  goals,
                  assists,
                  yellowCards,
                  redCards,
                  minutes,
                });
              }
            }
          }
          
          break;
        }
      }

      return players.sort((a, b) => b.goals - a.goals);
    } catch (error) {
      console.error('Error fetching Liverpool player stats from FBRef:', error);
      return [];
    }
  }

  async getTeamStats(teamName: string): Promise<TeamStats | null> {
    const table = await this.getPremierLeagueTable();
    return table.find(t => 
      t.name.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(t.name.toLowerCase())
    ) || null;
  }

  async getPlayerGoals(playerName: string): Promise<number> {
    const players = await this.getLiverpoolPlayerStats();
    const player = players.find(p => 
      p.name.toLowerCase().includes(playerName.toLowerCase()) ||
      playerName.toLowerCase().includes(p.name.toLowerCase())
    );
    return player?.goals || 0;
  }

  // Combined data from both FBRef and The Fishy for most accurate results
  async getEnrichedTeamData(teamName: string): Promise<{
    fbref?: TeamStats;
    position?: number;
    stats?: TeamStats;
  }> {
    const fbrefData = await this.getTeamStats(teamName);
    
    return {
      fbref: fbrefData || undefined,
      position: fbrefData?.position,
      stats: fbrefData || undefined,
    };
  }
}

export const fbrefService = new FBRefService();
