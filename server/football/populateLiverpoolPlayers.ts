import { db } from "../db";
import { footballPlayers, football_player_statistics } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { footballService } from "./footballService";

const LIVERPOOL_TEAM_ID = 40;
const PREMIER_LEAGUE_ID = 39;

export async function populateLiverpoolPlayers(season?: number) {
  const currentSeason = season || new Date().getFullYear();
  
  console.log(`🔄 Populating Liverpool players for ${currentSeason} season...`);
  
  try {
    const squadData = await footballService.getTeamSquad(LIVERPOOL_TEAM_ID, currentSeason);
    
    if (!squadData || squadData.length === 0) {
      console.log('⚠️ No squad data available from Football API');
      return false;
    }

    for (const playerData of squadData) {
      const player = playerData.player;
      const statistics = playerData.statistics?.[0];
      
      if (!player || !player.id) continue;

      await db.insert(footballPlayers).values({
        id: player.id,
        name: player.name,
        firstname: player.firstname,
        lastname: player.lastname,
        age: player.age,
        birth: player.birth,
        nationality: player.nationality,
        height: player.height,
        weight: player.weight,
        injured: player.injured || false,
        photo: player.photo,
        last_updated: new Date(),
      }).onConflictDoUpdate({
        target: footballPlayers.id,
        set: {
          name: player.name,
          age: player.age,
          injured: player.injured || false,
          photo: player.photo,
          last_updated: new Date(),
        }
      });

      if (statistics?.games) {
        // First check if detailed stats already exist (from FBref import)
        const existingStats = await db
          .select()
          .from(football_player_statistics)
          .where(
            and(
              eq(football_player_statistics.player_id, player.id),
              eq(football_player_statistics.team_id, LIVERPOOL_TEAM_ID),
              eq(football_player_statistics.league_id, PREMIER_LEAGUE_ID),
              eq(football_player_statistics.season, String(currentSeason))
            )
          )
          .limit(1);

        // Skip API update if detailed FBref data already exists
        // (indicated by passes_total or shots_total being populated)
        if (existingStats.length > 0) {
          const existing = existingStats[0];
          if (existing && (existing.passes_total !== null || existing.shots_total !== null)) {
            console.log(`⏩ Skipping ${player.name} - detailed stats already exist from HTML import`);
            continue;
          }
        }

        const goals = statistics.goals?.total || 0;
        const assists = statistics.goals?.assists || 0;
        const appearances = statistics.games?.appearences || 0;
        const minutes = statistics.games?.minutes || 0;
        const yellowCards = statistics.cards?.yellow || 0;
        const redCards = statistics.cards?.red || 0;

        // Use COALESCE to only update NULL fields, preserving existing data
        await db.insert(football_player_statistics).values({
          player_id: player.id,
          team_id: LIVERPOOL_TEAM_ID,
          league_id: PREMIER_LEAGUE_ID,
          season: String(currentSeason),
          games_appearances: appearances || null,
          games_minutes: minutes || null,
          goals_total: goals || null,
          goals_assists: assists || null,
          cards_yellow: yellowCards || null,
          cards_red: redCards || null,
          updated_at: new Date(),
        }).onConflictDoUpdate({
          target: [
            football_player_statistics.player_id,
            football_player_statistics.team_id,
            football_player_statistics.league_id,
            football_player_statistics.season
          ],
          set: {
            // Only update if existing value is NULL (COALESCE pattern)
            games_appearances: sql`COALESCE(${football_player_statistics.games_appearances}, ${appearances})`,
            games_minutes: sql`COALESCE(${football_player_statistics.games_minutes}, ${minutes})`,
            goals_total: sql`COALESCE(${football_player_statistics.goals_total}, ${goals})`,
            goals_assists: sql`COALESCE(${football_player_statistics.goals_assists}, ${assists})`,
            cards_yellow: sql`COALESCE(${football_player_statistics.cards_yellow}, ${yellowCards})`,
            cards_red: sql`COALESCE(${football_player_statistics.cards_red}, ${redCards})`,
            updated_at: new Date(),
          }
        });
      }

      console.log(`✓ Populated: ${player.name}`);
    }

    console.log(`✅ Successfully populated ${squadData.length} Liverpool players for ${currentSeason}`);
    return true;
  } catch (error) {
    console.error('❌ Error populating Liverpool players:', error);
    return false;
  }
}

export async function checkAndPopulateIfEmpty() {
  try {
    const currentSeason = new Date().getFullYear();
    
    const existingPlayers = await db
      .select()
      .from(football_player_statistics)
      .where(
        and(
          eq(football_player_statistics.team_id, LIVERPOOL_TEAM_ID),
          eq(football_player_statistics.season, String(currentSeason))
        )
      )
      .limit(1);

    if (existingPlayers.length === 0) {
      console.log('📊 No Liverpool player statistics found in football_player_statistics. Auto-populating...');
      await populateLiverpoolPlayers(currentSeason);
    } else {
      console.log('✓ Liverpool player statistics already exist in football_player_statistics');
    }
  } catch (error) {
    console.error('Error checking player statistics:', error);
  }
}
