
import { db } from "../db";
import { football_fixtures, football_teams, football_leagues } from "@shared/schema";
import { apiFootballService } from "../football/apiFootballService";
import { eq, and } from "drizzle-orm";

const LIVERPOOL_ID = 40;
const CURRENT_SEASON = 2024; // 2024-25 season

async function fetch2025Fixtures() {
  console.log('🔄 Fetching Liverpool FC 2024-25 season fixtures...\n');
  
  try {
    // Fetch fixtures for Liverpool in current season
    const fixtures = await apiFootballService.fetchFixturesByTeam({
      season: CURRENT_SEASON,
      team: LIVERPOOL_ID
    });

    console.log(`📊 Found ${fixtures.length} fixtures for Liverpool in 2024-25 season\n`);

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

        const fixtureData = {
          id: fixture.fixture.id,
          referee: fixture.fixture.referee || null,
          timezone: fixture.fixture.timezone || 'UTC',
          timestamp: new Date(fixture.fixture.date || fixture.fixture.timestamp),
          venue_id: fixture.fixture.venue?.id || null,
          venue_name: fixture.fixture.venue?.name || null,
          venue_city: fixture.fixture.venue?.city || null,
          status_long: fixture.fixture.status.long,
          status_short: fixture.fixture.status.short,
          status_elapsed: fixture.fixture.status.elapsed || null,
          league_id: fixture.league.id,
          season: fixture.league.season.toString(),
          round: fixture.league.round,
          home_team_id: fixture.teams.home.id,
          home_team_name: fixture.teams.home.name,
          home_team_logo: fixture.teams.home.logo,
          home_team_winner: fixture.teams.home.winner,
          away_team_id: fixture.teams.away.id,
          away_team_name: fixture.teams.away.name,
          away_team_logo: fixture.teams.away.logo,
          away_team_winner: fixture.teams.away.winner,
          goals_home: fixture.goals.home,
          goals_away: fixture.goals.away,
          score_halftime_home: fixture.score.halftime?.home || null,
          score_halftime_away: fixture.score.halftime?.away || null,
          score_fulltime_home: fixture.score.fulltime?.home || null,
          score_fulltime_away: fixture.score.fulltime?.away || null,
          score_extratime_home: fixture.score.extratime?.home || null,
          score_extratime_away: fixture.score.extratime?.away || null,
          score_penalty_home: fixture.score.penalty?.home || null,
          score_penalty_away: fixture.score.penalty?.away || null,
          updated_at: new Date()
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
    console.log('\n✅ 2024-25 fixtures sync complete!');

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
