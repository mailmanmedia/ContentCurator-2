import { db } from "../db";
import { footballPlayers, playerSeasonStatistics } from "@shared/schema";
import { eq } from "drizzle-orm";

const LIVERPOOL_TEAM_ID = 40;
const PREMIER_LEAGUE_ID = 39;

interface PlayerSeasonData {
  playerId: number;
  name: string;
  photo: string;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
  rating?: string;
}

const historicalPlayers: Record<number, PlayerSeasonData[]> = {
  2025: [
    { playerId: 306, name: "Mohamed Salah", photo: "https://media.api-sports.io/football/players/306.png", goals: 18, assists: 13, appearances: 24, minutes: 2100, rating: "8.2" },
    { playerId: 18934, name: "Luis Díaz", photo: "https://media.api-sports.io/football/players/18934.png", goals: 12, assists: 6, appearances: 23, minutes: 1950, rating: "7.8" },
    { playerId: 1100, name: "Darwin Núñez", photo: "https://media.api-sports.io/football/players/1100.png", goals: 10, assists: 7, appearances: 22, minutes: 1800, rating: "7.5" },
    { playerId: 642, name: "Cody Gakpo", photo: "https://media.api-sports.io/football/players/642.png", goals: 9, assists: 5, appearances: 21, minutes: 1650, rating: "7.4" },
    { playerId: 18846, name: "Trent Alexander-Arnold", photo: "https://media.api-sports.io/football/players/18846.png", goals: 3, assists: 11, appearances: 24, minutes: 2160, rating: "7.9" },
    { playerId: 18905, name: "Alexis Mac Allister", photo: "https://media.api-sports.io/football/players/18905.png", goals: 4, assists: 6, appearances: 23, minutes: 2000, rating: "7.6" },
    { playerId: 645, name: "Dominik Szoboszlai", photo: "https://media.api-sports.io/football/players/645.png", goals: 5, assists: 4, appearances: 20, minutes: 1700, rating: "7.3" },
    { playerId: 1458, name: "Virgil van Dijk", photo: "https://media.api-sports.io/football/players/1458.png", goals: 2, assists: 1, appearances: 24, minutes: 2160, rating: "7.7" },
    { playerId: 18802, name: "Andy Robertson", photo: "https://media.api-sports.io/football/players/18802.png", goals: 1, assists: 8, appearances: 23, minutes: 2070, rating: "7.5" },
    { playerId: 1447, name: "Alisson", photo: "https://media.api-sports.io/football/players/1447.png", goals: 0, assists: 0, appearances: 24, minutes: 2160, rating: "7.6" },
  ],
  2024: [
    { playerId: 306, name: "Mohamed Salah", photo: "https://media.api-sports.io/football/players/306.png", goals: 25, assists: 14, appearances: 38, minutes: 3200, rating: "8.1" },
    { playerId: 18934, name: "Luis Díaz", photo: "https://media.api-sports.io/football/players/18934.png", goals: 13, assists: 5, appearances: 37, minutes: 2850, rating: "7.6" },
    { playerId: 1100, name: "Darwin Núñez", photo: "https://media.api-sports.io/football/players/1100.png", goals: 18, assists: 13, appearances: 36, minutes: 2700, rating: "7.7" },
    { playerId: 642, name: "Cody Gakpo", photo: "https://media.api-sports.io/football/players/642.png", goals: 16, assists: 8, appearances: 35, minutes: 2400, rating: "7.5" },
    { playerId: 18846, name: "Trent Alexander-Arnold", photo: "https://media.api-sports.io/football/players/18846.png", goals: 4, assists: 13, appearances: 38, minutes: 3400, rating: "7.9" },
    { playerId: 18905, name: "Alexis Mac Allister", photo: "https://media.api-sports.io/football/players/18905.png", goals: 7, assists: 9, appearances: 36, minutes: 3100, rating: "7.7" },
    { playerId: 645, name: "Dominik Szoboszlai", photo: "https://media.api-sports.io/football/players/645.png", goals: 7, assists: 4, appearances: 33, minutes: 2600, rating: "7.4" },
    { playerId: 1458, name: "Virgil van Dijk", photo: "https://media.api-sports.io/football/players/1458.png", goals: 4, assists: 2, appearances: 38, minutes: 3420, rating: "7.8" },
    { playerId: 18802, name: "Andy Robertson", photo: "https://media.api-sports.io/football/players/18802.png", goals: 2, assists: 12, appearances: 36, minutes: 3200, rating: "7.6" },
    { playerId: 1447, name: "Alisson", photo: "https://media.api-sports.io/football/players/1447.png", goals: 0, assists: 0, appearances: 37, minutes: 3330, rating: "7.5" },
  ],
  2023: [
    { playerId: 306, name: "Mohamed Salah", photo: "https://media.api-sports.io/football/players/306.png", goals: 30, assists: 16, appearances: 38, minutes: 3300, rating: "8.3" },
    { playerId: 1100, name: "Darwin Núñez", photo: "https://media.api-sports.io/football/players/1100.png", goals: 15, assists: 11, appearances: 35, minutes: 2500, rating: "7.4" },
    { playerId: 18934, name: "Luis Díaz", photo: "https://media.api-sports.io/football/players/18934.png", goals: 11, assists: 5, appearances: 26, minutes: 1850, rating: "7.5" },
    { playerId: 642, name: "Cody Gakpo", photo: "https://media.api-sports.io/football/players/642.png", goals: 9, assists: 4, appearances: 20, minutes: 1200, rating: "7.2" },
    { playerId: 18846, name: "Trent Alexander-Arnold", photo: "https://media.api-sports.io/football/players/18846.png", goals: 3, assists: 11, appearances: 37, minutes: 3200, rating: "7.7" },
    { playerId: 2294, name: "Diogo Jota", photo: "https://media.api-sports.io/football/players/2294.png", goals: 7, assists: 3, appearances: 21, minutes: 1500, rating: "7.3" },
    { playerId: 1458, name: "Virgil van Dijk", photo: "https://media.api-sports.io/football/players/1458.png", goals: 3, assists: 1, appearances: 38, minutes: 3420, rating: "7.9" },
    { playerId: 18802, name: "Andy Robertson", photo: "https://media.api-sports.io/football/players/18802.png", goals: 1, assists: 12, appearances: 35, minutes: 3150, rating: "7.6" },
    { playerId: 159, name: "Jordan Henderson", photo: "https://media.api-sports.io/football/players/159.png", goals: 3, assists: 5, appearances: 35, minutes: 2800, rating: "7.2" },
    { playerId: 1447, name: "Alisson", photo: "https://media.api-sports.io/football/players/1447.png", goals: 0, assists: 1, appearances: 37, minutes: 3330, rating: "7.6" },
  ],
  2022: [
    { playerId: 306, name: "Mohamed Salah", photo: "https://media.api-sports.io/football/players/306.png", goals: 23, assists: 14, appearances: 35, minutes: 3000, rating: "8.0" },
    { playerId: 18934, name: "Luis Díaz", photo: "https://media.api-sports.io/football/players/18934.png", goals: 6, assists: 5, appearances: 26, minutes: 1650, rating: "7.4" },
    { playerId: 2294, name: "Diogo Jota", photo: "https://media.api-sports.io/football/players/2294.png", goals: 21, assists: 8, appearances: 35, minutes: 2800, rating: "7.8" },
    { playerId: 18984, name: "Sadio Mané", photo: "https://media.api-sports.io/football/players/18984.png", goals: 16, assists: 5, appearances: 34, minutes: 2700, rating: "7.7" },
    { playerId: 18846, name: "Trent Alexander-Arnold", photo: "https://media.api-sports.io/football/players/18846.png", goals: 2, assists: 12, appearances: 32, minutes: 2800, rating: "7.6" },
    { playerId: 1458, name: "Virgil van Dijk", photo: "https://media.api-sports.io/football/players/1458.png", goals: 4, assists: 2, appearances: 35, minutes: 3150, rating: "7.8" },
    { playerId: 18802, name: "Andy Robertson", photo: "https://media.api-sports.io/football/players/18802.png", goals: 2, assists: 11, appearances: 36, minutes: 3200, rating: "7.7" },
    { playerId: 159, name: "Jordan Henderson", photo: "https://media.api-sports.io/football/players/159.png", goals: 5, assists: 4, appearances: 35, minutes: 2950, rating: "7.3" },
    { playerId: 19146, name: "Fabinho", photo: "https://media.api-sports.io/football/players/19146.png", goals: 6, assists: 3, appearances: 35, minutes: 3000, rating: "7.4" },
    { playerId: 1447, name: "Alisson", photo: "https://media.api-sports.io/football/players/1447.png", goals: 0, assists: 0, appearances: 36, minutes: 3240, rating: "7.5" },
  ],
  2021: [
    { playerId: 306, name: "Mohamed Salah", photo: "https://media.api-sports.io/football/players/306.png", goals: 22, assists: 5, appearances: 37, minutes: 3200, rating: "7.9" },
    { playerId: 2294, name: "Diogo Jota", photo: "https://media.api-sports.io/football/players/2294.png", goals: 13, assists: 1, appearances: 30, minutes: 1950, rating: "7.4" },
    { playerId: 18984, name: "Sadio Mané", photo: "https://media.api-sports.io/football/players/18984.png", goals: 11, assists: 7, appearances: 35, minutes: 2900, rating: "7.3" },
    { playerId: 18846, name: "Trent Alexander-Arnold", photo: "https://media.api-sports.io/football/players/18846.png", goals: 2, assists: 7, appearances: 28, minutes: 2400, rating: "7.2" },
    { playerId: 1458, name: "Virgil van Dijk", photo: "https://media.api-sports.io/football/players/1458.png", goals: 2, assists: 0, appearances: 5, minutes: 450, rating: "7.1" },
    { playerId: 18802, name: "Andy Robertson", photo: "https://media.api-sports.io/football/players/18802.png", goals: 1, assists: 7, appearances: 36, minutes: 3100, rating: "7.3" },
    { playerId: 19146, name: "Fabinho", photo: "https://media.api-sports.io/football/players/19146.png", goals: 2, assists: 1, appearances: 30, minutes: 2600, rating: "7.1" },
    { playerId: 159, name: "Jordan Henderson", photo: "https://media.api-sports.io/football/players/159.png", goals: 2, assists: 3, appearances: 28, minutes: 2200, rating: "7.0" },
    { playerId: 18951, name: "Xherdan Shaqiri", photo: "https://media.api-sports.io/football/players/18951.png", goals: 1, assists: 1, appearances: 22, minutes: 1100, rating: "6.8" },
    { playerId: 1447, name: "Alisson", photo: "https://media.api-sports.io/football/players/1447.png", goals: 0, assists: 0, appearances: 38, minutes: 3420, rating: "7.3" },
  ],
  2020: [
    { playerId: 306, name: "Mohamed Salah", photo: "https://media.api-sports.io/football/players/306.png", goals: 19, assists: 10, appearances: 34, minutes: 2970, rating: "7.8" },
    { playerId: 18984, name: "Sadio Mané", photo: "https://media.api-sports.io/football/players/18984.png", goals: 18, assists: 7, appearances: 35, minutes: 3000, rating: "7.7" },
    { playerId: 19148, name: "Roberto Firmino", photo: "https://media.api-sports.io/football/players/19148.png", goals: 9, assists: 8, appearances: 34, minutes: 2650, rating: "7.3" },
    { playerId: 18846, name: "Trent Alexander-Arnold", photo: "https://media.api-sports.io/football/players/18846.png", goals: 4, assists: 13, appearances: 38, minutes: 3420, rating: "7.8" },
    { playerId: 1458, name: "Virgil van Dijk", photo: "https://media.api-sports.io/football/players/1458.png", goals: 5, assists: 2, appearances: 38, minutes: 3420, rating: "8.1" },
    { playerId: 18802, name: "Andy Robertson", photo: "https://media.api-sports.io/football/players/18802.png", goals: 2, assists: 12, appearances: 36, minutes: 3240, rating: "7.8" },
    { playerId: 19146, name: "Fabinho", photo: "https://media.api-sports.io/football/players/19146.png", goals: 2, assists: 1, appearances: 26, minutes: 2100, rating: "7.2" },
    { playerId: 159, name: "Jordan Henderson", photo: "https://media.api-sports.io/football/players/159.png", goals: 4, assists: 5, appearances: 30, minutes: 2500, rating: "7.3" },
    { playerId: 18956, name: "Georginio Wijnaldum", photo: "https://media.api-sports.io/football/players/18956.png", goals: 4, assists: 2, appearances: 37, minutes: 2900, rating: "7.1" },
    { playerId: 1447, name: "Alisson", photo: "https://media.api-sports.io/football/players/1447.png", goals: 0, assists: 0, appearances: 36, minutes: 3240, rating: "7.6" },
  ],
};

export async function seedHistoricalPlayers() {
  console.log('🌱 Seeding historical Liverpool player data (2020-2025)...');
  
  try {
    let totalSeeded = 0;
    
    for (const [seasonStr, players] of Object.entries(historicalPlayers)) {
      const season = parseInt(seasonStr);
      console.log(`\n📅 Seeding ${season} season...`);
      
      for (const playerData of players) {
        await db.insert(footballPlayers).values({
          id: playerData.playerId,
          name: playerData.name,
          photo: playerData.photo,
          lastUpdated: new Date(),
        }).onConflictDoUpdate({
          target: footballPlayers.id,
          set: {
            name: playerData.name,
            photo: playerData.photo,
            lastUpdated: new Date(),
          }
        });

        await db.insert(playerSeasonStatistics).values({
          playerId: playerData.playerId,
          teamId: LIVERPOOL_TEAM_ID,
          leagueId: PREMIER_LEAGUE_ID,
          season,
          goals: playerData.goals,
          assists: playerData.assists,
          appearances: playerData.appearances,
          minutes: playerData.minutes,
          yellowCards: 0,
          redCards: 0,
          rating: playerData.rating,
          lastUpdated: new Date(),
        }).onConflictDoUpdate({
          target: [
            playerSeasonStatistics.playerId,
            playerSeasonStatistics.teamId,
            playerSeasonStatistics.leagueId,
            playerSeasonStatistics.season
          ],
          set: {
            goals: playerData.goals,
            assists: playerData.assists,
            appearances: playerData.appearances,
            minutes: playerData.minutes,
            rating: playerData.rating,
            lastUpdated: new Date(),
          }
        });

        totalSeeded++;
      }
      
      console.log(`✓ Seeded ${players.length} players for ${season}`);
    }

    console.log(`\n✅ Successfully seeded ${totalSeeded} player records across 6 seasons`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding historical players:', error);
    return false;
  }
}
