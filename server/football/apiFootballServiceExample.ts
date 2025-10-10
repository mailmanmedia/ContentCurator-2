/**
 * Example integration showing how to use the APIFootballService
 * This demonstrates all the key features and best practices
 */

import { apiFootballService } from './apiFootballService';

// Example 1: Basic usage with error handling
async function getLiverpoolFixtures() {
  try {
    // Check remaining quota first
    const remaining = apiFootballService.getRemainingRequests();
    console.log(`Remaining requests: ${remaining.perMinute}/min, ${remaining.daily}/day`);

    // Fetch Liverpool's upcoming fixtures
    const fixtures = await apiFootballService.fetchFixtures(
      39,  // Premier League ID
      2025, // Current season
      new Date().toISOString().split('T')[0], // From today
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next 30 days
    );

    // Filter for Liverpool matches
    const liverpoolFixtures = fixtures.filter(f => 
      f.teams.home.id === 40 || f.teams.away.id === 40
    );

    return liverpoolFixtures;
  } catch (error) {
    console.error('Failed to fetch fixtures:', error);
    throw error;
  }
}

// Example 2: Fetching with pagination
async function getAllPlayersForTeam(teamId: number) {
  try {
    // This will automatically handle pagination
    const players = await apiFootballService.fetchAllPlayersForTeam(teamId, 2025);
    
    console.log(`Fetched ${players.length} players for team ${teamId}`);
    
    return players.map(p => ({
      id: p.player.id,
      name: p.player.name,
      position: p.statistics[0]?.games?.position || 'Unknown',
      age: p.player.age,
      photo: p.player.photo
    }));
  } catch (error) {
    console.error('Failed to fetch players:', error);
    throw error;
  }
}

// Example 3: Live match updates with high-frequency polling
async function trackLiveMatch(fixtureId: number) {
  const updateInterval = 30000; // 30 seconds
  
  const fetchMatchData = async () => {
    try {
      // Wait for rate limit if needed
      await apiFootballService.waitForRateLimit();
      
      // Fetch multiple data points in parallel
      const [events, statistics, lineups] = await Promise.all([
        apiFootballService.fetchFixtureEvents(fixtureId),
        apiFootballService.fetchFixtureStatistics(fixtureId),
        apiFootballService.fetchFixtureLineups(fixtureId)
      ]);

      return {
        events,
        statistics,
        lineups,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching live match data:', error);
      return null;
    }
  };

  // Initial fetch
  const initialData = await fetchMatchData();
  
  // Set up polling (in production, use WebSockets or Server-Sent Events)
  const intervalId = setInterval(fetchMatchData, updateInterval);
  
  // Return cleanup function
  return {
    data: initialData,
    stop: () => clearInterval(intervalId)
  };
}

// Example 4: Building a league table with team stats
async function getEnhancedLeagueTable(leagueId: number, season: number) {
  try {
    // Fetch standings
    const standingsData = await apiFootballService.fetchStandings(leagueId, season);
    
    if (!standingsData || standingsData.length === 0) {
      throw new Error('No standings data available');
    }

    const standings = standingsData[0].standings[0]; // First group
    
    // Enhance with team statistics (limit to top 5 to avoid rate limits)
    const enhancedTable = [];
    
    for (const team of standings.slice(0, 5)) {
      try {
        const stats = await apiFootballService.fetchTeamStatistics(
          team.team.id,
          leagueId,
          season
        );
        
        enhancedTable.push({
          ...team,
          statistics: {
            biggestWinHome: stats.biggest.wins.home,
            biggestWinAway: stats.biggest.wins.away,
            cleanSheets: stats.clean_sheet.total,
            failedToScore: stats.failed_to_score.total,
            averageGoalsFor: stats.goals.for.average.total,
            averageGoalsAgainst: stats.goals.against.average.total
          }
        });
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 6100)); // Just over 6 seconds
      } catch (error) {
        console.warn(`Failed to fetch stats for ${team.team.name}:`, error);
        enhancedTable.push(team); // Add without stats
      }
    }
    
    return enhancedTable;
  } catch (error) {
    console.error('Failed to build enhanced league table:', error);
    throw error;
  }
}

// Example 5: Cache management
async function manageCacheExample() {
  // Get cache statistics
  const cacheStats = apiFootballService.getCacheStats();
  console.log(`Cache has ${cacheStats.size} entries`);
  
  // Clear specific cache entries
  const clearedFixtures = apiFootballService.clearCache('fixtures');
  console.log(`Cleared ${clearedFixtures} fixture cache entries`);
  
  // Clear all cache
  const clearedAll = apiFootballService.clearCache();
  console.log(`Cleared all ${clearedAll} cache entries`);
}

// Example 6: Monitoring and logging
async function monitorApiUsage() {
  // Check API status
  const status = await apiFootballService.checkApiStatus();
  
  // Get rate limit info
  const rateLimits = apiFootballService.getRateLimitStatus();
  
  // Get request log
  const requestLog = apiFootballService.getRequestLog(50);
  
  // Calculate average response time
  const avgResponseTime = requestLog.reduce((sum, log) => sum + log.responseTime, 0) / requestLog.length;
  
  return {
    subscription: {
      plan: status.subscription.plan,
      active: status.subscription.active,
      endDate: status.subscription.end
    },
    usage: {
      today: status.requests.current,
      limit: status.requests.limit_day,
      percentUsed: (status.requests.current / status.requests.limit_day) * 100
    },
    performance: {
      averageResponseTime: Math.round(avgResponseTime),
      requestsLastHour: requestLog.filter(log => 
        new Date().getTime() - log.timestamp.getTime() < 3600000
      ).length,
      errors: requestLog.filter(log => log.error).length
    }
  };
}

// Example 7: Batch operations with queue management
async function batchFetchTeamData(teamIds: number[], leagueId: number, season: number) {
  const results = new Map<number, any>();
  const errors = new Map<number, Error>();
  
  for (const teamId of teamIds) {
    try {
      // The service will automatically queue requests if rate limit is reached
      const teamData = await apiFootballService.fetchTeamStatistics(teamId, leagueId, season);
      results.set(teamId, teamData);
      
      console.log(`✓ Fetched data for team ${teamId}`);
    } catch (error) {
      errors.set(teamId, error as Error);
      console.error(`✗ Failed to fetch team ${teamId}:`, error);
    }
  }
  
  return {
    successful: results,
    failed: errors,
    successRate: (results.size / teamIds.length) * 100
  };
}

// Export examples for use in other modules
export {
  getLiverpoolFixtures,
  getAllPlayersForTeam,
  trackLiveMatch,
  getEnhancedLeagueTable,
  manageCacheExample,
  monitorApiUsage,
  batchFetchTeamData
};

// Usage example
if (require.main === module) {
  (async () => {
    console.log('API Football Service Integration Examples\n');
    
    // Monitor API usage
    const usage = await monitorApiUsage();
    console.log('API Usage:', usage);
    
    // Get Liverpool fixtures
    const fixtures = await getLiverpoolFixtures();
    console.log(`Found ${fixtures.length} Liverpool fixtures`);
    
    // Fetch team players
    const players = await getAllPlayersForTeam(40); // Liverpool
    console.log(`Liverpool squad: ${players.length} players`);
  })();
}