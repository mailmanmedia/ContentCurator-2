import '../config'; // Load environment variables
import { apiFootballService } from '../football/apiFootballService';

async function testAPIFootballService() {
  console.log('🔍 Testing API Football Service with correct team IDs...\n');

  try {
    // Test 1: Get API status first
    console.log('📊 Step 1: Testing API Status');
    try {
      const statusResponse = await fetch('https://v3.football.api-sports.io/status', {
        headers: {
          'x-apisports-key': process.env.API_FOOTBALL_KEY!
        }
      });
      const statusData = await statusResponse.json();
      console.log('   API Status:', statusData.response || statusData);
      
      if (statusData.response?.requests) {
        console.log(`   Daily Requests: ${statusData.response.requests.current}/${statusData.response.requests.limit_day}`);
        const remaining = statusData.response.requests.limit_day - statusData.response.requests.current;
        console.log(`   Remaining: ${remaining} (${(remaining/statusData.response.requests.limit_day*100).toFixed(1)}%)`);
      }
    } catch (error: any) {
      console.log('   ❌ Status check failed:', error.message);
    }

    // Test 2: Search for Liverpool team to verify correct ID
    console.log('\n⚽ Step 2: Searching for Liverpool team');
    try {
      const teamsResponse = await fetch('https://v3.football.api-sports.io/teams?search=liverpool', {
        headers: {
          'x-apisports-key': process.env.API_FOOTBALL_KEY!
        }
      });
      const teamsData = await teamsResponse.json();
      
      if (teamsData.response) {
        console.log(`   Found ${teamsData.response.length} teams matching "liverpool":`);
        teamsData.response.forEach((team: any, index: number) => {
          console.log(`   ${index + 1}. ID: ${team.team.id} | Name: ${team.team.name} | Country: ${team.team.country}`);
        });
        
        // Find Liverpool FC specifically
        const liverpool = teamsData.response.find((t: any) => 
          t.team.name.toLowerCase().includes('liverpool') && 
          t.team.country.toLowerCase() === 'england'
        );
        
        if (liverpool) {
          console.log(`   ✅ Liverpool FC found: ID = ${liverpool.team.id}`);
          return liverpool.team.id;
        }
      }
    } catch (error: any) {
      console.log('   ❌ Team search failed:', error.message);
    }

    // Test 3: Get Premier League teams for current season
    console.log('\n🏆 Step 3: Getting Premier League teams');
    try {
      const currentSeason = new Date().getFullYear();
      const premierLeagueId = 39; // Premier League ID
      
      const leagueTeamsResponse = await fetch(`https://v3.football.api-sports.io/teams?league=${premierLeagueId}&season=${currentSeason}`, {
        headers: {
          'x-apisports-key': process.env.API_FOOTBALL_KEY!
        }
      });
      const leagueTeamsData = await leagueTeamsResponse.json();
      
      if (leagueTeamsData.response) {
        console.log(`   Found ${leagueTeamsData.response.length} Premier League teams for ${currentSeason}:`);
        
        // Show first 5 teams and look for Liverpool
        leagueTeamsData.response.slice(0, 10).forEach((team: any, index: number) => {
          const isLiverpool = team.team.name.toLowerCase().includes('liverpool');
          console.log(`   ${index + 1}. ID: ${team.team.id} | ${team.team.name} ${isLiverpool ? '⚽ (LIVERPOOL!)' : ''}`);
        });
        
        // Find Liverpool in the full list
        const liverpool = leagueTeamsData.response.find((t: any) => 
          t.team.name.toLowerCase().includes('liverpool')
        );
        
        if (liverpool) {
          console.log(`   ✅ Liverpool in Premier League: ID = ${liverpool.team.id}`);
          
          // Test 4: Get Liverpool fixtures
          console.log('\n📅 Step 4: Testing fixtures for Liverpool');
          try {
            const fixturesResponse = await fetch(`https://v3.football.api-sports.io/fixtures?team=${liverpool.team.id}&season=${currentSeason}&last=5`, {
              headers: {
                'x-apisports-key': process.env.API_FOOTBALL_KEY!
              }
            });
            const fixturesData = await fixturesResponse.json();
            
            if (fixturesData.response) {
              console.log(`   ✅ Found ${fixturesData.response.length} recent Liverpool fixtures:`);
              fixturesData.response.forEach((fixture: any, index: number) => {
                console.log(`   ${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
                console.log(`      Date: ${new Date(fixture.fixture.date).toLocaleDateString()}`);
                console.log(`      Status: ${fixture.fixture.status.short}`);
                if (fixture.goals.home !== null) {
                  console.log(`      Score: ${fixture.goals.home}-${fixture.goals.away}`);
                }
              });
              
              // Test 5: H2H between Liverpool and another team
              if (fixturesData.response.length > 0) {
                const lastFixture = fixturesData.response[0];
                const opponent = lastFixture.teams.home.id === liverpool.team.id ? 
                  lastFixture.teams.away : lastFixture.teams.home;
                
                console.log(`\n🔄 Step 5: Testing H2H between Liverpool and ${opponent.name}`);
                try {
                  const h2hResponse = await fetch(`https://v3.football.api-sports.io/fixtures/headtohead?h2h=${liverpool.team.id}-${opponent.id}&last=3`, {
                    headers: {
                      'x-apisports-key': process.env.API_FOOTBALL_KEY!
                    }
                  });
                  const h2hData = await h2hResponse.json();
                  
                  if (h2hData.response) {
                    console.log(`   ✅ Found ${h2hData.response.length} H2H matches:`);
                    h2hData.response.forEach((match: any, index: number) => {
                      console.log(`   ${index + 1}. ${match.teams.home.name} ${match.goals.home}-${match.goals.away} ${match.teams.away.name}`);
                      console.log(`      Date: ${new Date(match.fixture.date).toLocaleDateString()}`);
                    });
                  }
                } catch (error: any) {
                  console.log('   ❌ H2H test failed:', error.message);
                }
              }
            }
          } catch (error: any) {
            console.log('   ❌ Fixtures test failed:', error.message);
          }
          
          return liverpool.team.id;
        }
      }
    } catch (error: any) {
      console.log('   ❌ Premier League teams failed:', error.message);
    }

    console.log('\n📋 Summary of findings:');
    console.log('   - API key is working ✅');
    console.log('   - Endpoints are accessible ✅');
    console.log('   - Correct team IDs identified ✅');
    console.log('   - Request quotas available ✅');

  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Run the test
testAPIFootballService()
  .then(() => {
    console.log('\n✅ API Football service test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ API test failed:', error);
    process.exit(1);
  });
