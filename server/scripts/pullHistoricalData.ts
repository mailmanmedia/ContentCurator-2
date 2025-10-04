import fs from 'fs/promises';
import path from 'path';

interface APIResponse<T> {
  response: T[];
  results: number;
}

// API-Football configuration using CURRENTFOOTBALL key
const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.CURRENTFOOTBALL;

if (!API_KEY) {
  console.error('❌ CURRENTFOOTBALL API key not found in environment');
  process.exit(1);
}

const headers = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

let requestCount = 0;
const MAX_REQUESTS = 55; // Budget for initial pull

async function fetchFromAPI<T>(endpoint: string, params: Record<string, any> = {}): Promise<APIResponse<T>> {
  if (requestCount >= MAX_REQUESTS) {
    throw new Error(`Request limit reached (${MAX_REQUESTS})`);
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  console.log(`📡 Request ${requestCount + 1}/${MAX_REQUESTS}: ${endpoint}`, params);
  
  const response = await fetch(url.toString(), { headers });
  requestCount++;
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    console.warn(`⚠️ API warnings:`, data.errors);
  }

  return data;
}

async function pullCompetitions() {
  console.log('\n📋 Pulling competition metadata...');
  const competitions: any = {};
  
  const leagueIds = [39, 2, 3, 45, 48]; // PL, CL, EL, FA Cup, League Cup
  
  for (const id of leagueIds) {
    const data = await fetchFromAPI<any>('/leagues', { id, current: true });
    if (data.response?.[0]) {
      const item = data.response[0];
      competitions[id] = {
        id: item.league.id,
        name: item.league.name,
        type: item.league.type,
        logo: item.league.logo,
        country: item.country.name,
        flag: item.country.flag,
        currentSeason: item.seasons?.find((s: any) => s.current)?.year
      };
    }
  }
  
  return competitions;
}

async function pullVenues() {
  console.log('\n🏟️ Pulling Premier League venues...');
  const venues: any = {};
  
  // Get all PL teams to extract their venues
  const teamsData = await fetchFromAPI<any>('/teams', { league: 39, season: 2025 });
  
  for (const item of (teamsData.response || []) as any[]) {
    if (item.venue) {
      venues[item.venue.id] = {
        id: item.venue.id,
        name: item.venue.name,
        city: item.venue.city,
        capacity: item.venue.capacity,
        surface: item.venue.surface,
        image: item.venue.image,
        teamId: item.team.id,
        teamName: item.team.name
      };
    }
  }
  
  return venues;
}

async function pullHistoricalMatches() {
  console.log('\n⚽ Pulling Liverpool historical matches (2022-2025)...');
  const matches: any[] = [];
  const seasons = [2022, 2023, 2024, 2025];
  
  for (const season of seasons) {
    // Get Liverpool matches for this season
    const data = await fetchFromAPI<any>('/fixtures', {
      team: 40, // Liverpool
      season,
      status: 'FT' // Only finished matches
    });
    
    for (const match of (data.response || []) as any[]) {
      matches.push({
        id: match.fixture.id,
        date: match.fixture.date,
        timestamp: match.fixture.timestamp,
        venue: match.fixture.venue,
        status: match.fixture.status,
        league: {
          id: match.league.id,
          name: match.league.name,
          season: match.league.season,
          round: match.league.round
        },
        teams: {
          home: {
            id: match.teams.home.id,
            name: match.teams.home.name,
            logo: match.teams.home.logo
          },
          away: {
            id: match.teams.away.id,
            name: match.teams.away.name,
            logo: match.teams.away.logo
          }
        },
        goals: match.goals,
        score: match.score
      });
    }
  }
  
  return matches;
}

async function pullSeasonTables() {
  console.log('\n📊 Pulling historical season tables...');
  const tables: any = {};
  const seasons = [2022, 2023, 2024];
  
  for (const season of seasons) {
    const data = await fetchFromAPI<any>('/standings', {
      league: 39, // Premier League
      season
    });
    
    if (data.response?.[0]?.league?.standings?.[0]) {
      tables[season] = data.response[0].league.standings[0].map((team: any) => ({
        rank: team.rank,
        team: {
          id: team.team.id,
          name: team.team.name,
          logo: team.team.logo
        },
        points: team.points,
        goalsDiff: team.goalsDiff,
        form: team.form,
        status: team.status,
        all: team.all
      }));
    }
  }
  
  return tables;
}

async function pullCorePlayers() {
  console.log('\n👥 Pulling core player seed data...');
  const players: any = {
    liverpool: [],
    topSix: {},
    topScorers: [],
    topAssisters: []
  };
  
  // Liverpool squad
  const livSquad = await fetchFromAPI<any>('/players/squads', { team: 40 });
  players.liverpool = livSquad.response?.[0]?.players || [];
  
  // Top 6 rivals
  const rivals = [
    { id: 50, name: 'manCity' },
    { id: 42, name: 'arsenal' },
    { id: 33, name: 'manUnited' },
    { id: 49, name: 'chelsea' },
    { id: 47, name: 'tottenham' },
    { id: 34, name: 'newcastle' }
  ];
  
  for (const rival of rivals) {
    const squad = await fetchFromAPI<any>('/players/squads', { team: rival.id });
    players.topSix[rival.name] = squad.response?.[0]?.players || [];
  }
  
  // Top scorers (current season)
  const scorers = await fetchFromAPI<any>('/players/topscorers', { league: 39, season: 2025 });
  players.topScorers = scorers.response?.slice(0, 20).map((item: any) => item.player) || [];
  
  // Top assisters (current season)
  const assisters = await fetchFromAPI<any>('/players/topassists', { league: 39, season: 2025 });
  players.topAssisters = assisters.response?.slice(0, 20).map((item: any) => item.player) || [];
  
  return players;
}

async function main() {
  console.log('🚀 Starting historical data pull...');
  console.log(`📊 Budget: ${MAX_REQUESTS} requests\n`);
  
  const staticData: any = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    competitions: {},
    venues: {},
    historicalMatches: [],
    seasonTables: {}
  };
  
  const seedPlayers: any = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    liverpool: [],
    topSix: {},
    topScorers: [],
    topAssisters: []
  };
  
  try {
    // Phase 1: Static data (~25 requests)
    staticData.competitions = await pullCompetitions(); // 5 requests
    staticData.venues = await pullVenues(); // 1 request
    staticData.historicalMatches = await pullHistoricalMatches(); // ~16 requests (4 seasons × 4 leagues)
    staticData.seasonTables = await pullSeasonTables(); // 3 requests
    
    console.log(`\n✅ Phase 1 complete: ${requestCount} requests used`);
    
    // Phase 2: Core players (~15 requests)
    const playerData = await pullCorePlayers(); // ~9 requests
    seedPlayers.liverpool = playerData.liverpool;
    seedPlayers.topSix = playerData.topSix;
    seedPlayers.topScorers = playerData.topScorers;
    seedPlayers.topAssisters = playerData.topAssisters;
    
    console.log(`\n✅ Phase 2 complete: ${requestCount} requests used total`);
    
    // Save to files
    const dataDir = path.join(process.cwd(), 'server', 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(
      path.join(dataDir, 'staticFootballData.json'),
      JSON.stringify(staticData, null, 2)
    );
    
    await fs.writeFile(
      path.join(dataDir, 'seedPlayers.json'),
      JSON.stringify(seedPlayers, null, 2)
    );
    
    console.log('\n✅ Data saved successfully!');
    console.log(`📁 Location: server/data/`);
    console.log(`📊 Total requests used: ${requestCount}/${MAX_REQUESTS}`);
    console.log(`💰 Requests saved: ${MAX_REQUESTS - requestCount}`);
    
    // Summary
    console.log('\n📈 Summary:');
    console.log(`   Competitions: ${Object.keys(staticData.competitions).length}`);
    console.log(`   Venues: ${Object.keys(staticData.venues).length}`);
    console.log(`   Historical matches: ${staticData.historicalMatches.length}`);
    console.log(`   Season tables: ${Object.keys(staticData.seasonTables).length}`);
    console.log(`   Liverpool players: ${seedPlayers.liverpool.length}`);
    console.log(`   Top 6 teams: ${Object.keys(seedPlayers.topSix).length}`);
    console.log(`   Top scorers: ${seedPlayers.topScorers.length}`);
    console.log(`   Top assisters: ${seedPlayers.topAssisters.length}`);
    
  } catch (error) {
    console.error('❌ Error during data pull:', error);
    console.log(`\n📊 Requests used before error: ${requestCount}/${MAX_REQUESTS}`);
    process.exit(1);
  }
}

main();
