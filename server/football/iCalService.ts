import ical from 'node-ical';

const LIVERPOOL_ICAL_URL = 'https://ics.fixtur.es/v2/liverpool.ics';

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

        const isHomeMatch = location.toLowerCase().includes('anfield');
        
        let homeTeam = 'Liverpool';
        let awayTeam = 'TBD';
        
        if (summary.includes(' - ')) {
          const teams = summary.split(' - ');
          if (teams.length === 2) {
            homeTeam = teams[0].trim();
            awayTeam = teams[1].trim();
          }
        } else if (summary.includes(' v ')) {
          const teams = summary.split(' v ');
          if (teams.length === 2) {
            homeTeam = teams[0].trim();
            awayTeam = teams[1].trim();
          }
        } else if (summary.includes(' vs ')) {
          const teams = summary.split(' vs ');
          if (teams.length === 2) {
            homeTeam = teams[0].trim();
            awayTeam = teams[1].trim();
          }
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
            id: isHomeMatch ? 40 : 0,
            name: homeTeam,
            logo: isHomeMatch ? 'https://media.api-sports.io/football/teams/40.png' : ''
          },
          awayTeam: {
            id: !isHomeMatch ? 40 : 0,
            name: awayTeam,
            logo: !isHomeMatch ? 'https://media.api-sports.io/football/teams/40.png' : ''
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
