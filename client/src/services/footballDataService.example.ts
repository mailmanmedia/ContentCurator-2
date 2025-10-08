/**
 * Football Data Service - Usage Examples
 * 
 * This file demonstrates how to use the FootballDataService
 * in your React components or other services.
 */

import { footballDataService, FootballDataService } from './footballDataService';

// Example 1: Get Premier League Table
export async function exampleGetLeagueTable() {
  const result = await footballDataService.getLeagueTable();
  
  if (result.data) {
    console.log(`League table from ${result.source}:`, result.data);
    console.log(`Data timestamp: ${result.timestamp}`);
    
    // Display top 3 teams
    result.data.slice(0, 3).forEach(team => {
      console.log(`${team.position}. ${team.team} - ${team.points} pts`);
    });
  } else {
    console.error('Failed to get league table:', result.error);
  }
}

// Example 2: Get Liverpool Player Stats
export async function exampleGetPlayerStats() {
  const result = await footballDataService.getPlayerStats();
  
  if (result.data) {
    console.log(`Player stats from ${result.source}:`, result.data);
    
    // Find top scorer
    const topScorer = result.data.reduce((prev, current) => 
      (current.goals || 0) > (prev.goals || 0) ? current : prev
    );
    console.log(`Top scorer: ${topScorer.name} (${topScorer.goals} goals)`);
  } else {
    console.error('Failed to get player stats:', result.error);
  }
}

// Example 3: Get Team Data
export async function exampleGetTeamData() {
  const result = await footballDataService.getTeamData('Liverpool');
  
  if (result.data) {
    console.log(`Team data from ${result.source}:`, result.data);
    console.log(`Current form: ${result.data.form?.join(', ')}`);
    console.log(`League position: ${result.data.position}`);
  } else {
    console.error('Failed to get team data:', result.error);
  }
}

// Example 4: Get Upcoming Fixtures
export async function exampleGetFixtures() {
  const result = await footballDataService.getFixtures();
  
  if (result.data && result.data.fixtures) {
    console.log(`Fixtures from ${result.source}:`, result.data.fixtures);
    
    // Display next 3 fixtures
    result.data.fixtures.slice(0, 3).forEach(fixture => {
      console.log(`${fixture.homeTeam} vs ${fixture.awayTeam} - ${fixture.date}`);
    });
  } else {
    console.error('Failed to get fixtures:', result.error);
  }
}

// Example 5: Get Head-to-Head Data
export async function exampleGetH2H() {
  const homeTeamId = '64'; // Liverpool
  const awayTeamId = '65'; // Manchester City
  
  const result = await footballDataService.getH2HData(homeTeamId, awayTeamId);
  
  if (result.data && result.data.matches) {
    console.log(`H2H data from ${result.source}:`, result.data.matches);
    
    // Display recent matches
    result.data.matches.slice(0, 5).forEach(match => {
      console.log(`${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.date})`);
    });
  } else {
    console.error('Failed to get H2H data:', result.error);
  }
}

// Example 6: Use in React Component
export function useFootballData() {
  // In a React component, you would use this with useEffect and useState
  
  /*
  import { useEffect, useState } from 'react';
  import { footballDataService, DataResponse, TableEntry } from '@/services/footballDataService';
  
  function LeagueTableComponent() {
    const [tableData, setTableData] = useState<DataResponse<TableEntry[]> | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      async function fetchData() {
        setLoading(true);
        const result = await footballDataService.getLeagueTable();
        setTableData(result);
        setLoading(false);
      }
      
      fetchData();
    }, []);
    
    if (loading) return <div>Loading...</div>;
    if (!tableData?.data) return <div>No data available</div>;
    
    return (
      <div>
        <p>Data source: {tableData.source}</p>
        <p>Last updated: {new Date(tableData.timestamp).toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {tableData.data.map((team) => (
              <tr key={team.position}>
                <td>{team.position}</td>
                <td>{team.team}</td>
                <td>{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  */
}

// Example 7: Check Cache Status
export function exampleCacheStatus() {
  const status = footballDataService.getCacheStatus('football_league_table');
  
  if (status.exists) {
    console.log(`Cache exists for league table`);
    console.log(`Age: ${status.ageMinutes} minutes`);
    console.log(`Source: ${status.source}`);
    console.log(`Timestamp: ${status.timestamp}`);
  } else {
    console.log('No cache found for league table');
  }
}

// Example 8: Clear All Cache
export function exampleClearCache() {
  footballDataService.clearCache();
  console.log('All football cache cleared');
}

// Example 9: Create Multiple Instances (if needed)
export function exampleMultipleInstances() {
  // You can create multiple instances if you need different configurations
  const customService = new FootballDataService();
  
  // Use the custom instance
  customService.getLeagueTable().then(result => {
    console.log('Custom service result:', result);
  });
}

// Example 10: Handle Errors Gracefully
export async function exampleErrorHandling() {
  try {
    const result = await footballDataService.getLeagueTable();
    
    if (result.source === 'none') {
      // All sources failed
      console.error('All data sources failed');
      // Show user a friendly error message
      // Maybe retry with exponential backoff
    } else if (result.source === 'cache') {
      // Using cached data - might be stale
      console.warn('Using cached data, may be outdated');
      // Show indicator to user that data might be stale
    } else {
      // Fresh data from API
      console.log('Fresh data received from API');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}
