
import { db } from "../db";
import { football_fixtures, football_teams, football_leagues } from "@shared/schema";
import { apiFootballService } from "../football/apiFootballService";
import { eq, and } from "drizzle-orm";
import { toUnixTimestamp } from "../utils/dateUtils";

const LIVERPOOL_ID = 40;
const CURRENT_SEASON = 2025; // 2025-26 season (Oct 2025)

async function fetch2025Fixtures() {
  console.log('🔄 Fetching Liverpool FC 2025-26 season fixtures...\n');
  
  try {
    // Fetch fixtures for Liverpool in current season
    const fixtures = await apiFootballService.fetchFixturesByTeam({
      season: CURRENT_SEASON,
      team: LIVERPOOL_ID
    });

    console.log(`📊 Found ${fixtures.length} fixtures for Liverpool in 2025-26 season\n`);

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const fixture of fixtures) {
      try {
        // Check if fixture already exists
        const existing = await db
          .select()
          .from(football_fixtures)
          .where(eq(football_fixtures.id, fixture.fixture.id))
          .limit(1);

        const fixtureDate = new Date(fixture.fixture.date);
        const fixtureData = {
          id: fixture.fixture.id,
          referee: fixture.fixture.referee || null,
          timezone: fixture.fixture.timezone || 'UTC',
          date: fixtureDate,
          timestamp: toUnixTimestamp(fixture.fixture.timestamp, fixtureDate),
          periods: JSON.stringify(fixture.fixture.periods || {}),
          venue: JSON.stringify(fixture.fixture.venue || {}),
          status: JSON.stringify(fixture.fixture.status || {}),
          league_id: fixture.league.id,
          season: fixture.league.season,
          round: fixture.league.round,
          home_team_id: fixture.teams.home.id,
          away_team_id: fixture.teams.away.id,
          goals: JSON.stringify(fixture.goals || {}),
          score: JSON.stringify(fixture.score || {}),
          status_short: fixture.fixture.status.short,
          last_updated: new Date()
        };

        if (existing.length === 0) {
          // Insert new fixture
          await db.insert(football_fixtures).values(fixtureData);
          newCount++;
          console.log(`✅ Added: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${new Date(fixture.fixture.date).toLocaleDateString()})`);
        } else {
          // Update existing fixture
          await db.update(football_fixtures)
            .set(fixtureData)
            .where(eq(football_fixtures.id, fixture.fixture.id));
          updatedCount++;
          console.log(`🔄 Updated: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${new Date(fixture.fixture.date).toLocaleDateString()})`);
        }

        // Ensure teams exist in database
        for (const teamData of [fixture.teams.home, fixture.teams.away]) {
          const teamExists = await db
            .select()
            .from(football_teams)
            .where(eq(football_teams.id, teamData.id))
            .limit(1);

          if (teamExists.length === 0) {
            await db.insert(football_teams).values({
              id: teamData.id,
              name: teamData.name,
              logo: teamData.logo,
              code: teamData.name.substring(0, 3).toUpperCase(),
              country: 'England',
              updated_at: new Date()
            });
            console.log(`  📌 Added team: ${teamData.name}`);
          }
        }

        // Ensure league exists in database
        const leagueExists = await db
          .select()
          .from(football_leagues)
          .where(
            and(
              eq(football_leagues.id, fixture.league.id),
              eq(football_leagues.season, CURRENT_SEASON.toString())
            )
          )
          .limit(1);

        if (leagueExists.length === 0) {
          await db.insert(football_leagues).values({
            id: fixture.league.id,
            name: fixture.league.name,
            country: fixture.league.country,
            logo: fixture.league.logo,
            type: 'League',
            season: CURRENT_SEASON.toString()
          });
          console.log(`  📌 Added league: ${fixture.league.name}`);
        }

      } catch (error) {
        console.error(`❌ Error processing fixture ${fixture.fixture.id}:`, error);
        skippedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ New fixtures added: ${newCount}`);
    console.log(`  🔄 Fixtures updated: ${updatedCount}`);
    console.log(`  ❌ Fixtures skipped: ${skippedCount}`);
    console.log(`  📅 Total processed: ${fixtures.length}`);
    console.log('\n✅ 2025-26 fixtures sync complete!');

  } catch (error) {
    console.error('❌ Error fetching 2025-26 fixtures:', error);
    throw error;
  }
}

// Run the script
fetch2025Fixtures()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
