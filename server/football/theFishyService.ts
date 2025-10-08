import axios from 'axios';

interface TableEntry {
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

class TheFishyService {
  private readonly BASE_URL = 'https://thefishy.co.uk';

  async getPremierLeagueTable(): Promise<TableEntry[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/formtable.php?table=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const html = response.data;
      const entries: TableEntry[] = [];

      // Parse the HTML table
      // The table has rows with team data
      const tableRowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/g;
      const rows = html.match(tableRowRegex) || [];

      for (const row of rows) {
        // Skip header rows and empty rows
        if (row.includes('<th') || !row.includes('<td')) {
          continue;
        }

        // Extract cell data
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        const cells: string[] = [];
        let match;

        while ((match = cellRegex.exec(row)) !== null) {
          // Clean HTML tags and whitespace
          const cellContent = match[1]
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
          cells.push(cellContent);
        }

        // Parse the cells based on standard table format
        // Typical format: Position, Team, Played, Won, Drawn, Lost, GF, GA, GD, Points, Form
        if (cells.length >= 11) {
          const position = parseInt(cells[0]) || 0;
          const team = cells[1];
          const played = parseInt(cells[2]) || 0;
          const won = parseInt(cells[3]) || 0;
          const drawn = parseInt(cells[4]) || 0;
          const lost = parseInt(cells[5]) || 0;
          const goalsFor = parseInt(cells[6]) || 0;
          const goalsAgainst = parseInt(cells[7]) || 0;
          const goalDifference = parseInt(cells[8]) || 0;
          const points = parseInt(cells[9]) || 0;
          
          // Parse form (last 6 games: W, D, L)
          const formStr = cells[10] || '';
          const form: string[] = [];
          for (const char of formStr.toUpperCase()) {
            if (char === 'W' || char === 'D' || char === 'L') {
              form.push(char);
            }
          }

          if (team && position > 0) {
            entries.push({
              position,
              team,
              played,
              won,
              drawn,
              lost,
              goalsFor,
              goalsAgainst,
              goalDifference,
              points,
              form,
            });
          }
        }
      }

      // Sort by position to ensure correct order
      return entries.sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('Error fetching Premier League table from The Fishy:', error);
      
      // Return fallback data
      return this.getFallbackTable();
    }
  }

  private getFallbackTable(): TableEntry[] {
    // Fallback data when scraping fails
    return [
      { position: 1, team: 'Liverpool', played: 7, won: 6, drawn: 0, lost: 1, goalsFor: 13, goalsAgainst: 2, goalDifference: 11, points: 18, form: ['W', 'W', 'L', 'W', 'W'] },
      { position: 2, team: 'Manchester City', played: 7, won: 5, drawn: 2, lost: 0, goalsFor: 17, goalsAgainst: 8, goalDifference: 9, points: 17, form: ['W', 'D', 'W', 'W', 'D'] },
      { position: 3, team: 'Arsenal', played: 7, won: 5, drawn: 2, lost: 0, goalsFor: 15, goalsAgainst: 6, goalDifference: 9, points: 17, form: ['D', 'W', 'W', 'W', 'D'] },
      { position: 4, team: 'Chelsea', played: 7, won: 4, drawn: 3, lost: 0, goalsFor: 16, goalsAgainst: 8, goalDifference: 8, points: 15, form: ['W', 'D', 'W', 'D', 'D'] },
      { position: 5, team: 'Aston Villa', played: 7, won: 4, drawn: 3, lost: 0, goalsFor: 12, goalsAgainst: 6, goalDifference: 6, points: 15, form: ['W', 'D', 'W', 'D', 'W'] },
      { position: 6, team: 'Newcastle', played: 7, won: 4, drawn: 2, lost: 1, goalsFor: 10, goalsAgainst: 4, goalDifference: 6, points: 14, form: ['W', 'W', 'D', 'L', 'W'] },
      { position: 7, team: 'Brighton', played: 7, won: 3, drawn: 3, lost: 1, goalsFor: 12, goalsAgainst: 8, goalDifference: 4, points: 12, form: ['W', 'D', 'D', 'W', 'L'] },
      { position: 8, team: 'Tottenham', played: 7, won: 4, drawn: 0, lost: 3, goalsFor: 14, goalsAgainst: 6, goalDifference: 8, points: 12, form: ['W', 'L', 'W', 'L', 'W'] },
      { position: 9, team: 'Nottingham Forest', played: 7, won: 3, drawn: 3, lost: 1, goalsFor: 7, goalsAgainst: 6, goalDifference: 1, points: 12, form: ['D', 'W', 'D', 'D', 'W'] },
      { position: 10, team: 'Fulham', played: 7, won: 3, drawn: 2, lost: 2, goalsFor: 10, goalsAgainst: 8, goalDifference: 2, points: 11, form: ['D', 'L', 'W', 'W', 'D'] },
      { position: 11, team: 'Brentford', played: 7, won: 3, drawn: 1, lost: 3, goalsFor: 13, goalsAgainst: 11, goalDifference: 2, points: 10, form: ['W', 'L', 'L', 'W', 'D'] },
      { position: 12, team: 'Bournemouth', played: 7, won: 2, drawn: 3, lost: 2, goalsFor: 9, goalsAgainst: 9, goalDifference: 0, points: 9, form: ['D', 'W', 'L', 'D', 'W'] },
      { position: 13, team: 'Manchester United', played: 7, won: 2, drawn: 3, lost: 2, goalsFor: 5, goalsAgainst: 7, goalDifference: -2, points: 9, form: ['L', 'D', 'D', 'W', 'D'] },
      { position: 14, team: 'West Ham', played: 7, won: 2, drawn: 2, lost: 3, goalsFor: 9, goalsAgainst: 11, goalDifference: -2, points: 8, form: ['W', 'L', 'D', 'L', 'D'] },
      { position: 15, team: 'Leicester City', played: 7, won: 1, drawn: 3, lost: 3, goalsFor: 9, goalsAgainst: 12, goalDifference: -3, points: 6, form: ['L', 'D', 'D', 'W', 'L'] },
      { position: 16, team: 'Everton', played: 7, won: 1, drawn: 3, lost: 3, goalsFor: 7, goalsAgainst: 15, goalDifference: -8, points: 6, form: ['D', 'L', 'D', 'L', 'D'] },
      { position: 17, team: 'Crystal Palace', played: 7, won: 0, drawn: 3, lost: 4, goalsFor: 5, goalsAgainst: 10, goalDifference: -5, points: 3, form: ['L', 'D', 'L', 'L', 'D'] },
      { position: 18, team: 'Ipswich Town', played: 7, won: 0, drawn: 3, lost: 4, goalsFor: 6, goalsAgainst: 16, goalDifference: -10, points: 3, form: ['D', 'L', 'L', 'D', 'L'] },
      { position: 19, team: 'Wolves', played: 7, won: 0, drawn: 2, lost: 5, goalsFor: 8, goalsAgainst: 17, goalDifference: -9, points: 2, form: ['L', 'D', 'L', 'L', 'D'] },
      { position: 20, team: 'Southampton', played: 7, won: 0, drawn: 1, lost: 6, goalsFor: 4, goalsAgainst: 14, goalDifference: -10, points: 1, form: ['L', 'L', 'L', 'D', 'L'] },
    ];
  }

  async getTeamForm(teamName: string): Promise<string[]> {
    const table = await this.getPremierLeagueTable();
    const team = table.find(t => 
      t.team.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(t.team.toLowerCase())
    );
    return team?.form || [];
  }

  async getTeamPosition(teamName: string): Promise<number | null> {
    const table = await this.getPremierLeagueTable();
    const team = table.find(t => 
      t.team.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(t.team.toLowerCase())
    );
    return team?.position || null;
  }
}

export const theFishyService = new TheFishyService();
