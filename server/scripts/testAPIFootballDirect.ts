import '../config'; // Load environment variables

async function testAPIFootballDirect() {
  console.log('🔍 Testing API Football Service Directly...\n');

  const API_KEY = process.env.API_FOOTBALL_KEY;
  const BASE_URL = 'https://v3.football.api-sports.io';
  
  if (!API_KEY) {
    console.error('❌ API_FOOTBALL_KEY not found in environment variables');
    return;
  }

  console.log(`🔑 Using API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  // Test both header formats based on documentation
  console.log('📡 Testing with correct headers based on documentation...\n');
  
  // The API documentation shows two different authentication methods:
  // 1. API-SPORTS Account: x-apisports-key
  // 2. RAPIDAPI Account: x-rapidapi-key
  
  let headers = {
    'x-apisports-key': API_KEY  // Try API-SPORTS format first
  };

  // Test different endpoints from the documentation
  const testEndpoints = [
    { path: '/status', desc: 'API Status' },
    { path: '/leagues?season=2024&country=England', desc: 'English Leagues' },
    { path: '/teams?league=39&season=2024', desc: 'Premier League Teams' },
    { path: '/teams?id=40', desc: 'Liverpool Team Info' },
    { path: '/fixtures/headtohead?h2h=40-33&last=5', desc: 'Liverpool vs Man United H2H' }
  ];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint.desc}`);
      console.log(`   URL: ${BASE_URL}${endpoint.path}`);
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: 'GET',
        headers: headers
      });

      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success!`);
        console.log(`   📈 API Results: ${data.results || 'N/A'}`);
        console.log(`   � API Errors: ${data.errors?.length || 0}`);
        
        if (data.errors?.length > 0) {
          console.log(`   ❌ API Errors: ${data.errors.join(', ')}`);
        }
        
        // Show specific data based on endpoint
        if (endpoint.path === '/status' && data.response) {
          console.log(`   🎯 API Status:`, {
            requests: data.response.requests || 'N/A',
            account_requests: data.response.account?.requests || 'N/A'
          });
        }
        
        if (endpoint.path.includes('teams') && data.response?.[0]) {
          const team = data.response[0];
          if (team.team) {
            console.log(`   🏆 First team: ${team.team.name} (ID: ${team.team.id})`);
          }
        }
        
        if (endpoint.path.includes('headtohead') && data.response) {
          console.log(`   ⚽ H2H fixtures found: ${data.response.length}`);
          if (data.response[0]) {
            const fixture = data.response[0];
            console.log(`   📅 Latest: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
          }
        }
        
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${response.status} - ${response.statusText}`);
        console.log(`   📄 Response: ${errorText.substring(0, 200)}...`);
      }
      
    } catch (error: any) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log(''); // Empty line between tests
    
    // Rate limit between requests (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Now test if the header format is the issue in your current service
  console.log('🔧 Testing different header formats...\n');
  
  const headerFormats = [
    { name: 'x-rapidapi-key', headers: { 'x-rapidapi-key': API_KEY } as Record<string, string> },
    { name: 'x-apisports-key', headers: { 'x-apisports-key': API_KEY } as Record<string, string> },
    { name: 'X-RapidAPI-Key', headers: { 'X-RapidAPI-Key': API_KEY } as Record<string, string> }
  ];

  for (const format of headerFormats) {
    try {
      console.log(`🔍 Testing header format: ${format.name}`);
      
      const response = await fetch(`${BASE_URL}/status`, {
        method: 'GET',
        headers: format.headers
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS with ${format.name}!`);
        if (data.response?.requests) {
          console.log(`   📊 API Requests used: ${data.response.requests.current}/${data.response.requests.limit_day}`);
        }
      } else {
        console.log(`   ❌ Failed with ${format.name}`);
      }
      
    } catch (error: any) {
      console.log(`   ❌ Error with ${format.name}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎯 Based on the API documentation:');
  console.log('   - For API-SPORTS accounts: use "x-apisports-key" with https://v3.football.api-sports.io/');
  console.log('   - For RapidAPI accounts: use "x-rapidapi-key" with https://api-football-v1.p.rapidapi.com/v3/');
  console.log('📚 Documentation URL: https://www.api-football.com/documentation-v3');
}

// Run the test
testAPIFootballDirect()
  .then(() => {
    console.log('\n✅ API Football direct test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
