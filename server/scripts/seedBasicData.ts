import '../config'; // Load environment variables
import { db } from '../db';
import { footballTeams, footballFixtures } from '@shared/schema';

async function seedBasicData() {
  console.log('🌱 Seeding basic football data...');

  try {
    // Add Liverpool and a few Premier League teams
    const teams = [
      { id: 40, name: 'Liverpool', code: 'LIV', country: 'England', logo: 'https://media.api-sports.io/football/teams/40.png' },
      { id: 33, name: 'Manchester United', code: 'MUN', country: 'England', logo: 'https://media.api-sports.io/football/teams/33.png' },
      { id: 50, name: 'Manchester City', code: 'MCI', country: 'England', logo: 'https://media.api-sports.io/football/teams/50.png' },
      { id: 49, name: 'Chelsea', code: 'CHE', country: 'England', logo: 'https://media.api-sports.io/football/teams/49.png' },
      { id: 42, name: 'Arsenal', code: 'ARS', country: 'England', logo: 'https://media.api-sports.io/football/teams/42.png' },
    ];

    console.log('📊 Adding teams...');
    for (const team of teams) {
      await db.insert(footballTeams).values(team).onConflictDoNothing();
      console.log(`✓ Added ${team.name}`);
    }

    // Add some sample H2H fixtures (Liverpool vs others)
    const fixtures = [
      {
        id: 1001,
        referee: 'Michael Oliver',
        timezone: 'UTC',
        date: new Date('2024-05-15'),
        timestamp: Math.floor(new Date('2024-05-15').getTime() / 1000),
        periods: JSON.stringify({ first: 1715734800, second: 1715738400 }),
        venue: JSON.stringify({ name: 'Anfield', city: 'Liverpool' }),
        status: JSON.stringify({ long: 'Match Finished', short: 'FT' }),
        league_id: 39, // Premier League
        season: 2024,
        round: 'Regular Season - 38',
        home_team_id: 40, // Liverpool
        away_team_id: 33, // Man United
        goals: JSON.stringify({ home: 3, away: 0 }),
        score: JSON.stringify({ halftime: { home: 2, away: 0 }, fulltime: { home: 3, away: 0 } }),
        status_short: 'FT'
      },
      {
        id: 1002,
        referee: 'Anthony Taylor',
        timezone: 'UTC',
        date: new Date('2024-01-20'),
        timestamp: Math.floor(new Date('2024-01-20').getTime() / 1000),
        periods: JSON.stringify({ first: 1705752000, second: 1705755600 }),
        venue: JSON.stringify({ name: 'Old Trafford', city: 'Manchester' }),
        status: JSON.stringify({ long: 'Match Finished', short: 'FT' }),
        league_id: 39,
        season: 2024,
        round: 'Regular Season - 22',
        home_team_id: 33, // Man United
        away_team_id: 40, // Liverpool
        goals: JSON.stringify({ home: 1, away: 2 }),
        score: JSON.stringify({ halftime: { home: 0, away: 1 }, fulltime: { home: 1, away: 2 } }),
        status_short: 'FT'
      },
      {
        id: 1003,
        referee: 'Paul Tierney',
        timezone: 'UTC',
        date: new Date('2024-04-10'),
        timestamp: Math.floor(new Date('2024-04-10').getTime() / 1000),
        periods: JSON.stringify({ first: 1712764800, second: 1712768400 }),
        venue: JSON.stringify({ name: 'Anfield', city: 'Liverpool' }),
        status: JSON.stringify({ long: 'Match Finished', short: 'FT' }),
        league_id: 39,
        season: 2024,
        round: 'Regular Season - 32',
        home_team_id: 40, // Liverpool
        away_team_id: 50, // Man City
        goals: JSON.stringify({ home: 2, away: 1 }),
        score: JSON.stringify({ halftime: { home: 1, away: 0 }, fulltime: { home: 2, away: 1 } }),
        status_short: 'FT'
      },
      {
        id: 1004,
        referee: 'Stuart Attwell',
        timezone: 'UTC',
        date: new Date('2023-11-25'),
        timestamp: Math.floor(new Date('2023-11-25').getTime() / 1000),
        periods: JSON.stringify({ first: 1700924400, second: 1700928000 }),
        venue: JSON.stringify({ name: 'Etihad Stadium', city: 'Manchester' }),
        status: JSON.stringify({ long: 'Match Finished', short: 'FT' }),
        league_id: 39,
        season: 2024,
        round: 'Regular Season - 13',
        home_team_id: 50, // Man City
        away_team_id: 40, // Liverpool
        goals: JSON.stringify({ home: 1, away: 1 }),
        score: JSON.stringify({ halftime: { home: 1, away: 1 }, fulltime: { home: 1, away: 1 } }),
        status_short: 'FT'
      },
      {
        id: 1005,
        referee: 'Craig Pawson',
        timezone: 'UTC',
        date: new Date('2024-02-14'),
        timestamp: Math.floor(new Date('2024-02-14').getTime() / 1000),
        periods: JSON.stringify({ first: 1707926400, second: 1707930000 }),
        venue: JSON.stringify({ name: 'Emirates Stadium', city: 'London' }),
        status: JSON.stringify({ long: 'Match Finished', short: 'FT' }),
        league_id: 39,
        season: 2024,
        round: 'Regular Season - 25',
        home_team_id: 42, // Arsenal
        away_team_id: 40, // Liverpool
        goals: JSON.stringify({ home: 0, away: 3 }),
        score: JSON.stringify({ halftime: { home: 0, away: 2 }, fulltime: { home: 0, away: 3 } }),
        status_short: 'FT'
      }
    ];

    console.log('⚽ Adding sample fixtures...');
    for (const fixture of fixtures) {
      await db.insert(footballFixtures).values(fixture).onConflictDoNothing();
      console.log(`✓ Added fixture: ${fixture.id}`);
    }

    console.log('\n✅ Basic football data seeded successfully!');
    console.log('📊 Added:');
    console.log(`   - ${teams.length} teams`);
    console.log(`   - ${fixtures.length} sample fixtures`);
    console.log('\n🎯 You can now test the H2H match card with:');
    console.log('   - Liverpool (40) vs Manchester United (33)');
    console.log('   - Liverpool (40) vs Manchester City (50)');
    console.log('   - Liverpool (40) vs Arsenal (42)');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedBasicData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
