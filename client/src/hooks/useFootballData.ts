import { useQuery } from '@tanstack/react-query';
import {
  footballDataService,
  type TableEntry,
  type PlayerStats,
  type TeamData,
  type Fixture,
  type H2HData,
  type DataResponse,
} from '@/services/footballDataService';

// Export return types for each hook
export type UseLeagueTableReturn = ReturnType<typeof useLeagueTable>;
export type UsePlayerStatsReturn = ReturnType<typeof usePlayerStats>;
export type UseTeamDataReturn = ReturnType<typeof useTeamData>;
export type UseFixturesReturn = ReturnType<typeof useFixtures>;
export type UseH2HDataReturn = ReturnType<typeof useH2HData>;
export type UseTopScorersReturn = ReturnType<typeof useTopScorers>;

/**
 * Hook to fetch Premier League standings
 * 
 * Fetches the current Premier League table with automatic fallback between data sources.
 * Data is cached for 5 minutes to minimize API calls.
 * 
 * @returns Query result with league table data, loading state, error, source, and refetch function
 * 
 * @example
 * ```tsx
 * function LeagueTableComponent() {
 *   const { data, isLoading, error, refetch } = useLeagueTable();
 *   
 *   if (isLoading) return <div>Loading table...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data?.data) return <div>No data available</div>;
 *   
 *   return (
 *     <div>
 *       <p>Data from: {data.source}</p>
 *       <table>
 *         {data.data.map(entry => (
 *           <tr key={entry.position}>
 *             <td>{entry.position}</td>
 *             <td>{entry.team}</td>
 *             <td>{entry.points}</td>
 *           </tr>
 *         ))}
 *       </table>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLeagueTable() {
  return useQuery({
    queryKey: ['leagueTable'],
    queryFn: async () => {
      const result = await footballDataService.getLeagueTable();
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch player statistics for a team
 * 
 * Fetches player statistics with automatic fallback between data sources.
 * Defaults to Liverpool if no teamId provided. Data is cached for 10 minutes.
 * 
 * @param teamId - Optional team identifier (defaults to Liverpool)
 * @returns Query result with player stats data, loading state, error, source, and refetch function
 * 
 * @example
 * ```tsx
 * function PlayerStatsComponent() {
 *   const { data, isLoading, error } = usePlayerStats();
 *   
 *   if (isLoading) return <div>Loading player stats...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data?.data) return <div>No players found</div>;
 *   
 *   return (
 *     <div>
 *       <p>Data from: {data.source}</p>
 *       {data.data.map(player => (
 *         <div key={player.name}>
 *           {player.name} - {player.position} - {player.goals} goals
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * // With specific team
 * function TeamPlayerStats({ teamId }: { teamId: number }) {
 *   const { data, isLoading } = usePlayerStats(teamId);
 *   // ... render logic
 * }
 * ```
 */
export function usePlayerStats(teamId?: number) {
  return useQuery({
    queryKey: ['playerStats', teamId],
    queryFn: async () => {
      const result = await footballDataService.getPlayerStats(
        teamId?.toString()
      );
      return result;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch enriched team data
 * 
 * Fetches team data including form, position, and other enriched information.
 * Data is cached for 15 minutes.
 * 
 * @param teamName - Name of the team (e.g., "Liverpool", "Manchester City")
 * @returns Query result with team data, loading state, error, source, and refetch function
 * 
 * @example
 * ```tsx
 * function TeamDataComponent({ teamName }: { teamName: string }) {
 *   const { data, isLoading, error, refetch } = useTeamData(teamName);
 *   
 *   if (isLoading) return <div>Loading team data...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data?.data) return <div>Team not found</div>;
 *   
 *   return (
 *     <div>
 *       <h2>{data.data.team}</h2>
 *       <p>Position: {data.data.position}</p>
 *       <p>Form: {data.data.form?.join(', ')}</p>
 *       <p>Source: {data.source}</p>
 *       <button onClick={() => refetch()}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTeamData(teamName: string) {
  return useQuery({
    queryKey: ['teamData', teamName],
    queryFn: async () => {
      const result = await footballDataService.getTeamData(teamName);
      return result;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch upcoming Liverpool fixtures
 * 
 * Fetches upcoming matches for Liverpool FC.
 * Data is cached for 30 minutes.
 * 
 * @returns Query result with fixtures data, loading state, error, source, and refetch function
 * 
 * @example
 * ```tsx
 * function UpcomingFixturesComponent() {
 *   const { data, isLoading, error } = useFixtures();
 *   
 *   if (isLoading) return <div>Loading fixtures...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data?.data?.fixtures) return <div>No fixtures available</div>;
 *   
 *   return (
 *     <div>
 *       <p>Data from: {data.source}</p>
 *       <h2>Upcoming Fixtures</h2>
 *       {data.data.fixtures.map(fixture => (
 *         <div key={fixture.id}>
 *           {fixture.homeTeam} vs {fixture.awayTeam}
 *           <br />
 *           {new Date(fixture.date).toLocaleDateString()}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFixtures() {
  return useQuery({
    queryKey: ['fixtures'],
    queryFn: async () => {
      const result = await footballDataService.getFixtures();
      return result;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch head-to-head match history between two teams
 * 
 * Fetches historical match data between two teams.
 * Only fetches when both team IDs are provided.
 * Data is cached for 1 hour.
 * 
 * @param homeTeamId - Home team identifier (required for fetch)
 * @param awayTeamId - Away team identifier (required for fetch)
 * @returns Query result with H2H data, loading state, error, source, and refetch function
 * 
 * @example
 * ```tsx
 * function H2HComponent({ homeId, awayId }: { homeId?: number; awayId?: number }) {
 *   const { data, isLoading, error } = useH2HData(homeId, awayId);
 *   
 *   if (!homeId || !awayId) {
 *     return <div>Please select both teams</div>;
 *   }
 *   
 *   if (isLoading) return <div>Loading head-to-head data...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data?.data?.matches) return <div>No matches found</div>;
 *   
 *   return (
 *     <div>
 *       <p>Data from: {data.source}</p>
 *       <h2>Head to Head History</h2>
 *       {data.data.matches.map((match, idx) => (
 *         <div key={idx}>
 *           {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
 *           <br />
 *           {new Date(match.date).toLocaleDateString()}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useH2HData(homeTeamId?: number, awayTeamId?: number) {
  return useQuery({
    queryKey: ['h2hData', homeTeamId, awayTeamId],
    queryFn: async () => {
      if (!homeTeamId || !awayTeamId) {
        throw new Error('Both team IDs are required');
      }
      const result = await footballDataService.getH2HData(
        homeTeamId.toString(),
        awayTeamId.toString()
      );
      return result;
    },
    enabled: !!homeTeamId && !!awayTeamId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch Liverpool top scorers
 * 
 * Fetches the top scoring players for Liverpool FC.
 * Data is cached for 10 minutes.
 * 
 * @returns Query result with top scorers data, loading state, error, source, and refetch function
 * 
 * @example
 * ```tsx
 * function TopScorersComponent() {
 *   const { data, isLoading, error, refetch } = useTopScorers();
 *   
 *   if (isLoading) return <div>Loading top scorers...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data?.data) return <div>No scorers found</div>;
 *   
 *   return (
 *     <div>
 *       <p>Data from: {data.source}</p>
 *       <h2>Top Scorers</h2>
 *       {data.data.map((player, idx) => (
 *         <div key={player.name}>
 *           {idx + 1}. {player.name} - {player.goals} goals
 *         </div>
 *       ))}
 *       <button onClick={() => refetch()}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTopScorers() {
  return useQuery({
    queryKey: ['topScorers'],
    queryFn: async () => {
      const result = await footballDataService.getTopScorers();
      return result;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
