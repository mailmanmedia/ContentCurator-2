import ical from 'node-ical';

const LIVERPOOL_ICAL_URL = 'https://ics.fixtur.es/v2/liverpool.ics';

// Team name to ID mapping for accurate badge display
const TEAM_MAPPING: Record<string, { id: number; name: string }> = {
  // Premier League
  'liverpool': { id: 40, name: 'Liverpool' },
  'manchester united': { id: 33, name: 'Manchester United' },
  'man united': { id: 33, name: 'Manchester United' },
  'man utd': { id: 33, name: 'Manchester United' },
  'manchester city': { id: 50, name: 'Manchester City' },
  'man city': { id: 50, name: 'Manchester City' },
  'arsenal': { id: 42, name: 'Arsenal' },
  'chelsea': { id: 49, name: 'Chelsea' },
  'tottenham': { id: 47, name: 'Tottenham Hotspur' },
  'tottenham hotspur': { id: 47, name: 'Tottenham Hotspur' },
  'spurs': { id: 47, name: 'Tottenham Hotspur' },
  'newcastle': { id: 34, name: 'Newcastle United' },
  'newcastle united': { id: 34, name: 'Newcastle United' },
  'aston villa': { id: 66, name: 'Aston Villa' },
  'west ham': { id: 48, name: 'West Ham United' },
  'west ham united': { id: 48, name: 'West Ham United' },
  'brighton': { id: 51, name: 'Brighton & Hove Albion' },
  'brighton & hove albion': { id: 51, name: 'Brighton & Hove Albion' },
  'crystal palace': { id: 52, name: 'Crystal Palace' },
  'fulham': { id: 36, name: 'Fulham' },
  'brentford': { id: 55, name: 'Brentford' },
  'everton': { id: 45, name: 'Everton' },
  'nottingham forest': { id: 65, name: 'Nottingham Forest' },
  'wolves': { id: 39, name: 'Wolverhampton Wanderers' },
  'wolverhampton': { id: 39, name: 'Wolverhampton Wanderers' },
  'wolverhampton wanderers': { id: 39, name: 'Wolverhampton Wanderers' },
  'bournemouth': { id: 35, name: 'AFC Bournemouth' },
  'afc bournemouth': { id: 35, name: 'AFC Bournemouth' },
  'southampton': { id: 41, name: 'Southampton' },
  'leicester': { id: 46, name: 'Leicester City' },
  'leicester city': { id: 46, name: 'Leicester City' },
  'ipswich': { id: 57, name: 'Ipswich Town' },
  'ipswich town': { id: 57, name: 'Ipswich Town' },
  
  // Champions League Teams
  'real madrid': { id: 541, name: 'Real Madrid' },
  'barcelona': { id: 529, name: 'Barcelona' },
  'bayern munich': { id: 157, name: 'Bayern München' },
  'bayern münchen': { id: 157, name: 'Bayern München' },
  'bayern': { id: 157, name: 'Bayern München' },
  'psg': { id: 85, name: 'Paris Saint-Germain' },
  'paris saint-germain': { id: 85, name: 'Paris Saint-Germain' },
  'paris saint germain': { id: 85, name: 'Paris Saint-Germain' },
  'inter': { id: 505, name: 'Inter Milan' },
  'inter milan': { id: 505, name: 'Inter Milan' },
  'ac milan': { id: 487, name: 'AC Milan' },
  'milan': { id: 487, name: 'AC Milan' },
  'juventus': { id: 496, name: 'Juventus' },
  'atletico madrid': { id: 530, name: 'Atlético Madrid' },
  'atlético madrid': { id: 530, name: 'Atlético Madrid' },
  'atletico': { id: 530, name: 'Atlético Madrid' },
  'borussia dortmund': { id: 165, name: 'Borussia Dortmund' },
  'dortmund': { id: 165, name: 'Borussia Dortmund' },
  'rb leipzig': { id: 173, name: 'RB Leipzig' },
  'leipzig': { id: 173, name: 'RB Leipzig' },
  'bayer leverkusen': { id: 168, name: 'Bayer Leverkusen' },
  'leverkusen': { id: 168, name: 'Bayer Leverkusen' },
  'benfica': { id: 211, name: 'Benfica' },
  'sporting': { id: 228, name: 'Sporting CP' },
  'sporting cp': { id: 228, name: 'Sporting CP' },
  'ajax': { id: 610, name: 'Ajax' },
  'psv': { id: 179, name: 'PSV Eindhoven' },
  'psv eindhoven': { id: 179, name: 'PSV Eindhoven' },
  'napoli': { id: 492, name: 'Napoli' },
  'roma': { id: 488, name: 'AS Roma' },
  'as roma': { id: 488, name: 'AS Roma' },
  'atalanta': { id: 499, name: 'Atalanta' },
  'monaco': { id: 497, name: 'AS Monaco' },
  'as monaco': { id: 497, name: 'AS Monaco' },
  'marseille': { id: 81, name: 'Marseille' },
  'rangers': { id: 727, name: 'Rangers' },
  'club brugge': { id: 569, name: 'Club Brugge' },
  'copenhagen': { id: 400, name: 'Copenhagen' },
  'galatasaray': { id: 645, name: 'Galatasaray' },
  'olympiacos': { id: 553, name: 'Olympiacos' },
  'slavia praha': { id: 614, name: 'Slavia Praha' },
  'qarabağ': { id: 551, name: 'Qarabağ' },
  'real sociedad': { id: 548, name: 'Real Sociedad' },
  'athletic club': { id: 531, name: 'Athletic Club' },
  'villarreal': { id: 555, name: 'Villarreal' },
};

function getTeamInfo(teamName: string): { id: number; name: string; logo: string } {
  // Remove score information like "(2-1)", "(0-0)", etc.
  const cleanName = teamName.replace(/\s*\(\d+-\d+\)\s*$/g, '').trim();
  const normalizedName = cleanName.toLowerCase().trim();
  const teamInfo = TEAM_MAPPING[normalizedName];
  
  if (teamInfo) {
    return {
      id: teamInfo.id,
      name: teamInfo.name,
      logo: `https://media.api-sports.io/football/teams/${teamInfo.id}.png`
    };
  }
  
  // Fallback for unknown teams
  return {
    id: 0,
    name: cleanName,
    logo: ''
  };
}

interface ICalFixture {
  id: number;
  date: Date;
  timestamp: number;
  venue: {
    id: number;
    name: string;
    city: string;
  };
  status: {
    long: string;
    short: string;
    elapsed: number;
  };
  league: {
    id: number;
    name: string;
    logo: string;
    round: string;
  };
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  isLiverpool: boolean;
}

export class ICalService {
  private static instance: ICalService;
  private cachedFixtures: ICalFixture[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  static getInstance(): ICalService {
    if (!ICalService.instance) {
      ICalService.instance = new ICalService();
    }
    return ICalService.instance;
  }

  async fetchLiverpoolFixtures(): Promise<ICalFixture[]> {
    const now = Date.now();
    
    if (this.cachedFixtures.length > 0 && now - this.lastFetchTime < this.CACHE_DURATION) {
      return this.cachedFixtures;
    }

    try {
      const events = await ical.async.fromURL(LIVERPOOL_ICAL_URL);
      const fixtures: ICalFixture[] = [];

      for (const event of Object.values(events)) {
        if (event.type !== 'VEVENT') continue;

        const summary = event.summary || '';
        const location = event.location || '';
        const startDate = event.start;

        if (!startDate) continue;

        let homeTeamName = 'Liverpool';
        let awayTeamName = 'TBD';
        
        // Parse team names from summary
        if (summary.includes(' - ')) {
          const teams = summary.split(' - ');
          if (teams.length === 2) {
            homeTeamName = teams[0].trim();
            awayTeamName = teams[1].trim();
          }
        } else if (summary.includes(' v ')) {
          const teams = summary.split(' v ');
          if (teams.length === 2) {
            homeTeamName = teams[0].trim();
            awayTeamName = teams[1].trim();
          }
        } else if (summary.includes(' vs ')) {
          const teams = summary.split(' vs ');
          if (teams.length === 2) {
            homeTeamName = teams[0].trim();
            awayTeamName = teams[1].trim();
          }
        }
        
        // Get team info with IDs and logos
        const homeTeam = getTeamInfo(homeTeamName);
        const awayTeam = getTeamInfo(awayTeamName);
        
        // Debug logging for first fixture
        if (fixtures.length === 0) {
          console.log(`First fixture parsed: ${homeTeamName} (ID: ${homeTeam.id}) vs ${awayTeamName} (ID: ${awayTeam.id})`);
        }

        let competition = 'Premier League';
        let competitionId = 39;
        const desc = event.description || '';
        if (desc.toLowerCase().includes('champions league')) {
          competition = 'UEFA Champions League';
          competitionId = 2;
        } else if (desc.toLowerCase().includes('fa cup')) {
          competition = 'FA Cup';
          competitionId = 45;
        } else if (desc.toLowerCase().includes('carabao') || desc.toLowerCase().includes('league cup')) {
          competition = 'Carabao Cup';
          competitionId = 48;
        } else if (summary.toLowerCase().includes('champions league')) {
          competition = 'UEFA Champions League';
          competitionId = 2;
        } else if (summary.toLowerCase().includes('fa cup')) {
          competition = 'FA Cup';
          competitionId = 45;
        } else if (summary.toLowerCase().includes('carabao') || summary.toLowerCase().includes('league cup')) {
          competition = 'Carabao Cup';
          competitionId = 48;
        }

        const venueName = location || 'TBD';
        const venueCity = venueName.includes('Anfield') ? 'Liverpool' : venueName.split(',').pop()?.trim() || '';

        const fixture: ICalFixture = {
          id: startDate.getTime(),
          date: startDate,
          timestamp: startDate.getTime() / 1000,
          venue: {
            id: venueName.includes('Anfield') ? 550 : 0,
            name: venueName,
            city: venueCity
          },
          status: {
            long: 'Not Started',
            short: 'NS',
            elapsed: 0
          },
          league: {
            id: competitionId,
            name: competition,
            logo: `https://media.api-sports.io/football/leagues/${competitionId}.png`,
            round: 'Regular Season'
          },
          homeTeam: {
            id: homeTeam.id,
            name: homeTeam.name,
            logo: homeTeam.logo
          },
          awayTeam: {
            id: awayTeam.id,
            name: awayTeam.name,
            logo: awayTeam.logo
          },
          goals: {
            home: null,
            away: null
          },
          isLiverpool: true
        };

        fixtures.push(fixture);
      }

      fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      this.cachedFixtures = fixtures;
      this.lastFetchTime = now;

      return fixtures;
    } catch (error) {
      console.error('Error fetching Liverpool iCal fixtures:', error);
      
      if (this.cachedFixtures.length > 0) {
        console.log('Returning cached fixtures due to fetch error');
        return this.cachedFixtures;
      }
      
      throw new Error('Failed to fetch Liverpool fixtures and no cached data available');
    }
  }

  async getUpcomingFixtures(limit: number = 10): Promise<ICalFixture[]> {
    const allFixtures = await this.fetchLiverpoolFixtures();
    const now = new Date();
    
    const upcoming = allFixtures.filter(f => new Date(f.date) > now);
    
    return upcoming.slice(0, limit);
  }

  async getNextFixture(): Promise<ICalFixture | null> {
    const upcoming = await this.getUpcomingFixtures(1);
    return upcoming[0] || null;
  }
}

export const iCalService = ICalService.getInstance();
