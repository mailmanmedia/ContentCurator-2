import '../config'; // Load environment variables
import { db } from '../db';
import { footballTeams, footballFixtures, footballCompetitions } from '@shared/schema';

/**
 * Import real data from API-Football into the database
 */
async function importRealAPIData() {
  console.log('🔄 Importing Real API-Football Data...\n');

  const API_KEY = process.env.API_FOOTBALL_KEY;
  const BASE_URL = 'https://v3.football.api-sports.io';
  
  if (!API_KEY) {
    console.error('❌ API_FOOTBALL_KEY not found');
    return;
  }

  const headers = {
    'x-apisports-key': API_KEY
  };

  try {
    // 1. Import Premier League competition
    console.log('📊 Step 1: Importing Premier League competition...');
    const leagueResponse = await fetch(`${BASE_URL}/leagues?id=39`, { headers });
    const leagueData = await leagueResponse.json();
    
    if (leagueData.response?.[0]) {
      const league = leagueData.response[0].league;
      await db.insert(footballCompetitions)
        .values({
          apiId: league.id,
          name: league.name,
          type: league.type,
          logo: league.logo,
          country: leagueData.response[0].country.name,
          countryCode: leagueData.response[0].country.code,
        })
        .onConflictDoUpdate({
          target: footballCompetitions.apiId,
          set: {
            name: league.name,
            logo: league.logo,
          }
        });
      console.log(`   ✅ Imported: ${league.name}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Import Premier League teams for current season
    console.log('\n⚽ Step 2: Importing Premier League teams (2024 season)...');
    const teamsResponse = await fetch(`${BASE_URL}/teams?league=39&season=2024`, { headers });
    const teamsData = await teamsResponse.json();
    
    let teamsImported = 0;
    if (teamsData.response) {
      for (const item of teamsData.response) {
        const team = item.team;
        await db.insert(footballTeams)
          .values({
            apiId: team.id,
            name: team.name,
            shortName: team.code || team.name.substring(0, 3).toUpperCase(),
            logo: team.logo,
            founded: team.founded,
            country: team.country,
            venue: item.venue?.name || null,
            venueCapacity: item.venue?.capacity || null,
            venueCity: item.venue?.city || null,
          })
          .onConflictDoUpdate({
            target: footballTeams.apiId,
            set: {
              name: team.name,
              logo: team.logo,
            }
          });
        teamsImported++;
      }
      console.log(`   ✅ Imported ${teamsImported} teams`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Import recent Liverpool fixtures (last 10)
    console.log('\n📅 Step 3: Importing recent Liverpool fixtures...');
    const fixturesResponse = await fetch(`${BASE_URL}/fixtures?team=40&season=2024&last=10`, { headers });
    const fixturesData = await fixturesResponse.json();
    
    let fixturesImported = 0;
    if (fixturesData.response) {
      for (const fixture of fixturesData.response) {
        await db.insert(footballFixtures)
          .values({
            apiId: fixture.fixture.id,
            dateUtc: new Date(fixture.fixture.date),
            venue: fixture.fixture.venue?.name || 'Unknown',
            status: fixture.fixture.status.short,
            elapsed: fixture.fixture.status.elapsed,
            competitionId: 1, // Premier League
            homeTeamId: fixture.teams.home.id,
            awayTeamId: fixture.teams.away.id,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            round: fixture.league.round,
          })
          .onConflictDoUpdate({
            target: footballFixtures.apiId,
            set: {
              homeScore: fixture.goals.home,
              awayScore: fixture.goals.away,
              status: fixture.fixture.status.short,
              elapsed: fixture.fixture.status.elapsed,
            }
          });
        fixturesImported++;
      }
      console.log(`   ✅ Imported ${fixturesImported} Liverpool fixtures`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Import Liverpool vs Man United H2H fixtures
    console.log('\n⚔️ Step 4: Importing Liverpool vs Man United H2H...');
    const h2hResponse = await fetch(`${BASE_URL}/fixtures/headtohead?h2h=40-33&last=10`, { headers });
    const h2hData = await h2hResponse.json();
    
    let h2hImported = 0;
    if (h2hData.response) {
      for (const fixture of h2hData.response) {
        await db.insert(footballFixtures)
          .values({
            apiId: fixture.fixture.id,
            dateUtc: new Date(fixture.fixture.date),
            venue: fixture.fixture.venue?.name || 'Unknown',
            status: fixture.fixture.status.short,
            elapsed: fixture.fixture.status.elapsed,
            competitionId: 1, // Premier League (assuming)
            homeTeamId: fixture.teams.home.id,
            awayTeamId: fixture.teams.away.id,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            round: fixture.league.round,
          })
          .onConflictDoUpdate({
            target: footballFixtures.apiId,
            set: {
              homeScore: fixture.goals.home,
              awayScore: fixture.goals.away,
              status: fixture.fixture.status.short,
              elapsed: fixture.fixture.status.elapsed,
            }
          });
        h2hImported++;
      }
      console.log(`   ✅ Imported ${h2hImported} H2H fixtures`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Competition: Premier League`);
    console.log(`✅ Teams: ${teamsImported} imported`);
    console.log(`✅ Liverpool Fixtures: ${fixturesImported} imported`);
    console.log(`✅ H2H Fixtures: ${h2hImported} imported`);
    console.log('='.repeat(60));
    
    // Verify data
    console.log('\n🔍 Verifying database...');
    const teamCount = await db.select().from(footballTeams);
    const fixtureCount = await db.select().from(footballFixtures);
    console.log(`   📊 Total teams in DB: ${teamCount.length}`);
    console.log(`   📅 Total fixtures in DB: ${fixtureCount.length}`);

  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

// Run the import
importRealAPIData()
  .then(() => {
    console.log('\n✅ Real API data import completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
