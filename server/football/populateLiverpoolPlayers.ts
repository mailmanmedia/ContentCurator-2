import { db } from "../db";
import { footballPlayers, playerSeasonStatistics } from "@shared/schema";
import { eq, and } from "drizzle-orm";
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
        lastUpdated: new Date(),
      }).onConflictDoUpdate({
        target: footballPlayers.id,
        set: {
          name: player.name,
          age: player.age,
          injured: player.injured || false,
          photo: player.photo,
          lastUpdated: new Date(),
        }
      });

      if (statistics?.games) {
        const goals = statistics.goals?.total || 0;
        const assists = statistics.goals?.assists || 0;
        const appearances = statistics.games?.appearences || 0;
        const minutes = statistics.games?.minutes || 0;
        const yellowCards = statistics.cards?.yellow || 0;
        const redCards = statistics.cards?.red || 0;
        const rating = statistics.games?.rating || null;

        await db.insert(playerSeasonStatistics).values({
          playerId: player.id,
          teamId: LIVERPOOL_TEAM_ID,
          leagueId: PREMIER_LEAGUE_ID,
          season: currentSeason,
          goals,
          assists,
          appearances,
          minutes,
          yellowCards,
          redCards,
          rating,
          lastUpdated: new Date(),
        }).onConflictDoUpdate({
          target: [
            playerSeasonStatistics.playerId,
            playerSeasonStatistics.teamId,
            playerSeasonStatistics.leagueId,
            playerSeasonStatistics.season
          ],
          set: {
            goals,
            assists,
            appearances,
            minutes,
            yellowCards,
            redCards,
            rating,
            lastUpdated: new Date(),
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
      .from(playerSeasonStatistics)
      .where(
        and(
          eq(playerSeasonStatistics.teamId, LIVERPOOL_TEAM_ID),
          eq(playerSeasonStatistics.season, currentSeason)
        )
      )
      .limit(1);

    if (existingPlayers.length === 0) {
      console.log('📊 No Liverpool player statistics found. Auto-populating...');
      await populateLiverpoolPlayers(currentSeason);
    } else {
      console.log('✓ Liverpool player statistics already exist');
    }
  } catch (error) {
    console.error('Error checking player statistics:', error);
  }
}
