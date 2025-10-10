import { db } from "../db";
import { footballPlayers, playerSeasonStatistics } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { APIFootballService } from "./apiFootballService";

const LIVERPOOL_TEAM_ID = 40;
const PREMIER_LEAGUE_ID = 39;

/**
 * Populate complete Liverpool squad with player statistics for current season
 * This fetches ALL players from the API, not just a limited subset
 */
export async function populateLiverpoolSquadFull(season?: number) {
  const currentSeason = season || new Date().getFullYear();
  const apiService = new APIFootballService();
  
  console.log(`🔄 Populating FULL Liverpool squad for ${currentSeason} season...`);
  
  try {
    // Fetch ALL Liverpool players for the season using pagination
    const allPlayers = await apiService.fetchAllPlayerStatistics(
      PREMIER_LEAGUE_ID,
      currentSeason,
      LIVERPOOL_TEAM_ID
    );
    
    if (!allPlayers || allPlayers.length === 0) {
      console.log('⚠️ No player data available from Football API');
      return {
        success: false,
        playersPopulated: 0,
        season: currentSeason
      };
    }

    console.log(`📊 Found ${allPlayers.length} Liverpool players from API`);
    let playersPopulated = 0;

    for (const playerData of allPlayers) {
      const player = playerData.player;
      const statistics = playerData.statistics?.[0];
      
      if (!player || !player.id) continue;

      // Initialize variables outside the statistics block
      let goals = 0;
      let assists = 0;
      let appearances = 0;
      let lineups = 0;
      let minutes = 0;
      let yellowCards = 0;
      let redCards = 0;
      let rating: number | null = null;
      let shotsTotal = 0;
      let shotsOn = 0;
      let passesTotal = 0;
      let passesKey = 0;
      let passesAccuracy = 0;
      let tacklesTotal = 0;
      let duelsTotal = 0;
      let duelsWon = 0;
      let dribblesAttempts = 0;
      let dribblesSuccess = 0;
      let foulsDrawn = 0;
      let foulsCommitted = 0;

      // Insert/update player in football_players table
      await db.insert(footballPlayers).values({
        id: player.id,
        name: player.name,
        firstname: player.firstname,
        lastname: player.lastname,
        age: player.age,
        birth_date: player.birth?.date ? new Date(player.birth.date) : null,
        birth_place: player.birth?.place || null,
        birth_country: player.birth?.country || null,
        nationality: player.nationality,
        height: player.height,
        weight: player.weight,
        photo: player.photo,
        injured: player.injured || false,
        team_id: LIVERPOOL_TEAM_ID,
        updated_at: new Date(),
      }).onConflictDoUpdate({
        target: footballPlayers.id,
        set: {
          name: player.name,
          firstname: player.firstname,
          lastname: player.lastname,
          age: player.age,
          nationality: player.nationality,
          height: player.height,
          weight: player.weight,
          photo: player.photo,
          injured: player.injured || false,
          team_id: LIVERPOOL_TEAM_ID,
          updated_at: new Date(),
        }
      });

      // Insert/update player season statistics if available
      if (statistics && statistics.games) {
        goals = statistics.goals?.total || 0;
        assists = statistics.goals?.assists || 0;
        appearances = statistics.games?.appearences || statistics.games?.appearances || 0;
        lineups = statistics.games?.lineups || 0;
        minutes = statistics.games?.minutes || 0;
        yellowCards = statistics.cards?.yellow || 0;
        redCards = statistics.cards?.red || 0;
        rating = statistics.games?.rating ? parseFloat(statistics.games.rating) : null;
        
        // Additional stats
        shotsTotal = statistics.shots?.total || 0;
        shotsOn = statistics.shots?.on || 0;
        passesTotal = statistics.passes?.total || 0;
        passesKey = statistics.passes?.key || 0;
        passesAccuracy = statistics.passes?.accuracy || 0;
        tacklesTotal = statistics.tackles?.total || 0;
        duelsTotal = statistics.duels?.total || 0;
        duelsWon = statistics.duels?.won || 0;
        dribblesAttempts = statistics.dribbles?.attempts || 0;
        dribblesSuccess = statistics.dribbles?.success || 0;
        foulsDrawn = statistics.fouls?.drawn || 0;
        foulsCommitted = statistics.fouls?.committed || 0;

        await db.insert(playerSeasonStatistics).values({
          player_id: player.id,
          team_id: LIVERPOOL_TEAM_ID,
          competition_id: PREMIER_LEAGUE_ID,
          season: currentSeason.toString(),
          goals,
          assists,
          appearances,
          lineups,
          minutes,
          yellow_cards: yellowCards,
          red_cards: redCards,
          rating,
          shots_total: shotsTotal,
          shots_on: shotsOn,
          passes_total: passesTotal,
          passes_key: passesKey,
          passes_accuracy: passesAccuracy,
          tackles_total: tacklesTotal,
          duels_total: duelsTotal,
          duels_won: duelsWon,
          dribbles_attempts: dribblesAttempts,
          dribbles_success: dribblesSuccess,
          fouls_drawn: foulsDrawn,
          fouls_committed: foulsCommitted,
          updated_at: new Date(),
        }).onConflictDoUpdate({
          target: [
            playerSeasonStatistics.player_id,
            playerSeasonStatistics.team_id,
            playerSeasonStatistics.season
          ],
          set: {
            goals,
            assists,
            appearances,
            lineups,
            minutes,
            yellow_cards: yellowCards,
            red_cards: redCards,
            rating,
            shots_total: shotsTotal,
            shots_on: shotsOn,
            passes_total: passesTotal,
            passes_key: passesKey,
            passes_accuracy: passesAccuracy,
            tackles_total: tacklesTotal,
            duels_total: duelsTotal,
            duels_won: duelsWon,
            dribbles_attempts: dribblesAttempts,
            dribbles_success: dribblesSuccess,
            fouls_drawn: foulsDrawn,
            fouls_committed: foulsCommitted,
            updated_at: new Date(),
          }
        });
      }

      playersPopulated++;
      console.log(`✓ Populated: ${player.name} (${appearances} apps, ${goals} goals)`);
    }

    console.log(`✅ Successfully populated ${playersPopulated} Liverpool players for ${currentSeason}`);
    return {
      success: true,
      playersPopulated,
      season: currentSeason
    };
  } catch (error) {
    console.error('❌ Error populating Liverpool squad:', error);
    return {
      success: false,
      playersPopulated: 0,
      season: currentSeason,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
