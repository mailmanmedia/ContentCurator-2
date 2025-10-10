import { db } from '../db';
import { football_players } from '@shared/schema';
import { eq, isNull, or } from 'drizzle-orm';
import { APIFootballService } from './apiFootballService';

interface CleaningResult {
  playersUpdated: number;
  photosFixed: number;
  errors: Array<{
    playerId: number;
    playerName: string;
    error: string;
  }>;
}

class DataCleaningService {
  private apiFootballService: APIFootballService;

  constructor() {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      throw new Error('API_FOOTBALL_KEY environment variable is not set');
    }
    this.apiFootballService = new APIFootballService();
  }

  /**
   * Fetches and updates player_id from API Football for players missing this data
   * Uses efficient team squad endpoint instead of search-by-name
   * Also updates photo URLs from API response
   */
  async fetchAndUpdatePlayerIds(season: number = 2025, teamId: number = 40): Promise<CleaningResult> {
    console.log(`🔍 Starting player ID cleaning process for team ${teamId}, season ${season}...`);
    
    const result: CleaningResult = {
      playersUpdated: 0,
      photosFixed: 0,
      errors: []
    };

    try {
      // Query all players where player_id IS NULL
      const playersWithoutId = await db
        .select()
        .from(football_players)
        .where(isNull(football_players.player_id));

      console.log(`📊 Found ${playersWithoutId.length} players without player_id`);

      if (playersWithoutId.length === 0) {
        console.log('✅ No players need updating');
        return result;
      }

      // Fetch entire Liverpool squad using team squad endpoint (efficient!)
      console.log(`🔎 Fetching full squad for team ${teamId}, season ${season}...`);
      const apiPlayers = await this.apiFootballService.fetchAllPlayersForTeam(teamId, season);
      
      console.log(`📥 Received ${apiPlayers.length} players from API`);

      // Index API players by normalized name for quick matching
      const playerIndex = new Map<string, typeof apiPlayers[0]>();
      for (const apiPlayer of apiPlayers) {
        const normalizedName = this.normalizeName(apiPlayer.player.name);
        playerIndex.set(normalizedName, apiPlayer);
        
        // Also index by first + last name for better matching
        const parts = normalizedName.split(' ');
        if (parts.length >= 2) {
          const firstLast = `${parts[0]} ${parts[parts.length - 1]}`;
          if (!playerIndex.has(firstLast)) {
            playerIndex.set(firstLast, apiPlayer);
          }
        }
      }

      console.log(`📇 Indexed ${playerIndex.size} name variations`);

      // Match DB players to API players
      for (const player of playersWithoutId) {
        try {
          const normalizedDbName = this.normalizeName(player.name);
          
          // Try to find match in index
          let matchedPlayer = playerIndex.get(normalizedDbName);
          
          // If no exact match, try first + last name
          if (!matchedPlayer) {
            const parts = normalizedDbName.split(' ');
            if (parts.length >= 2) {
              const firstLast = `${parts[0]} ${parts[parts.length - 1]}`;
              matchedPlayer = playerIndex.get(firstLast);
            }
          }

          if (!matchedPlayer) {
            console.log(`⚠️ No match found for player: ${player.name}`);
            result.errors.push({
              playerId: player.id,
              playerName: player.name,
              error: 'No matching player found in API squad'
            });
            continue;
          }

          // Update player_id and photo in database
          const updateData: any = {
            player_id: matchedPlayer.player.id,
            last_updated: new Date()
          };

          // Also update photo if available
          if (matchedPlayer.player.photo) {
            updateData.photo = matchedPlayer.player.photo;
            result.photosFixed++;
          }

          await db
            .update(football_players)
            .set(updateData)
            .where(eq(football_players.id, player.id));

          console.log(`✅ Updated ${player.name}: player_id=${matchedPlayer.player.id}, photo=${matchedPlayer.player.photo || 'none'}`);
          result.playersUpdated++;

        } catch (error: any) {
          console.error(`❌ Error processing player ${player.name}:`, error.message);
          result.errors.push({
            playerId: player.id,
            playerName: player.name,
            error: error.message
          });
        }
      }

      console.log(`✅ Player ID cleaning complete. Updated: ${result.playersUpdated}, Photos fixed: ${result.photosFixed}, Errors: ${result.errors.length}`);

    } catch (error: any) {
      console.error('❌ Fatal error in fetchAndUpdatePlayerIds:', error);
      throw error;
    }

    return result;
  }

  /**
   * Validates and fixes photo URLs for players
   * Uses team squad endpoint for efficiency
   */
  async validateAndFixPhotos(season: number = 2025, teamId: number = 40): Promise<CleaningResult> {
    console.log(`🖼️ Starting photo validation and fixing process for team ${teamId}, season ${season}...`);
    
    const result: CleaningResult = {
      playersUpdated: 0,
      photosFixed: 0,
      errors: []
    };

    try {
      // Query players with NULL photo or broken photo URLs
      const playersWithoutPhotos = await db
        .select()
        .from(football_players)
        .where(
          or(
            isNull(football_players.photo),
            eq(football_players.photo, '')
          )
        );

      console.log(`📊 Found ${playersWithoutPhotos.length} players without photos`);

      if (playersWithoutPhotos.length === 0) {
        console.log('✅ No players need photo updates');
        return result;
      }

      // Fetch entire Liverpool squad using team squad endpoint (efficient!)
      console.log(`🔎 Fetching full squad for team ${teamId}, season ${season}...`);
      const apiPlayers = await this.apiFootballService.fetchAllPlayersForTeam(teamId, season);
      
      console.log(`📥 Received ${apiPlayers.length} players from API`);

      // Index API players by player_id for quick lookup
      const playerIdIndex = new Map<number, typeof apiPlayers[0]>();
      const playerNameIndex = new Map<string, typeof apiPlayers[0]>();
      
      for (const apiPlayer of apiPlayers) {
        playerIdIndex.set(apiPlayer.player.id, apiPlayer);
        const normalizedName = this.normalizeName(apiPlayer.player.name);
        playerNameIndex.set(normalizedName, apiPlayer);
      }

      // Match players by player_id first, then by name
      for (const player of playersWithoutPhotos) {
        try {
          let matchedPlayer = null;

          // Try to match by player_id first
          if (player.player_id) {
            matchedPlayer = playerIdIndex.get(player.player_id);
          }

          // If no match by ID, try by name
          if (!matchedPlayer) {
            const normalizedName = this.normalizeName(player.name);
            matchedPlayer = playerNameIndex.get(normalizedName);
          }

          if (!matchedPlayer || !matchedPlayer.player.photo) {
            console.log(`⚠️ No photo found for player: ${player.name}`);
            result.errors.push({
              playerId: player.id,
              playerName: player.name,
              error: 'No photo available in API'
            });
            continue;
          }

          // Update photo in database
          await db
            .update(football_players)
            .set({
              photo: matchedPlayer.player.photo,
              last_updated: new Date()
            })
            .where(eq(football_players.id, player.id));

          console.log(`✅ Updated photo for ${player.name}: ${matchedPlayer.player.photo}`);
          result.photosFixed++;
          result.playersUpdated++;

        } catch (error: any) {
          console.error(`❌ Error processing player ${player.name}:`, error.message);
          result.errors.push({
            playerId: player.id,
            playerName: player.name,
            error: error.message
          });
        }
      }

      console.log(`✅ Photo fixing complete. Fixed: ${result.photosFixed}, Errors: ${result.errors.length}`);

    } catch (error: any) {
      console.error('❌ Fatal error in validateAndFixPhotos:', error);
      throw error;
    }

    return result;
  }

  /**
   * Normalizes a name for comparison (lowercase, trim whitespace, remove accents)
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, ' '); // Normalize spaces
  }

  /**
   * Adds a delay in milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const dataCleaningService = new DataCleaningService();
