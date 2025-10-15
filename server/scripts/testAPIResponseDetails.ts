import '../config'; // Load environment variables

/**
 * Detailed API response test to see exactly what the API returns
 */
async function testAPIResponseDetails() {
  console.log('🔍 Testing API Football Response Details...\n');

  const API_KEY = process.env.API_FOOTBALL_KEY;
  const BASE_URL = 'https://v3.football.api-sports.io';
  
  if (!API_KEY) {
    console.error('❌ API_FOOTBALL_KEY not found in environment variables');
    return;
  }

  console.log(`🔑 Using API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  const headers = {
    'x-apisports-key': API_KEY
  };

  // Test 1: API Status
  console.log('📊 Test 1: API Status');
  console.log('━'.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/status`, {
      method: 'GET',
      headers: headers
    });

    console.log(`Status Code: ${response.status} ${response.statusText}`);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      if (key.includes('rate') || key.includes('limit') || key.includes('remaining')) {
        console.log(`  ${key}: ${value}`);
      }
    });

    const data = await response.json();
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Search for Liverpool
  console.log('⚽ Test 2: Search for Liverpool');
  console.log('━'.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/teams?search=liverpool`, {
      method: 'GET',
      headers: headers
    });

    console.log(`Status Code: ${response.status} ${response.statusText}`);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      if (key.includes('rate') || key.includes('limit') || key.includes('remaining')) {
        console.log(`  ${key}: ${value}`);
      }
    });

    const data = await response.json();
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
    
    if (data.response && data.response.length > 0) {
      console.log(`\n✅ Found ${data.response.length} teams`);
      console.log('First team:', data.response[0].team);
    } else {
      console.log('\n⚠️ No teams found in response');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Get specific team by ID
  console.log('🏆 Test 3: Get Liverpool by ID (team=40)');
  console.log('━'.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/teams?id=40`, {
      method: 'GET',
      headers: headers
    });

    console.log(`Status Code: ${response.status} ${response.statusText}`);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      if (key.includes('rate') || key.includes('limit') || key.includes('remaining')) {
        console.log(`  ${key}: ${value}`);
      }
    });

    const data = await response.json();
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
    
    if (data.response && data.response.length > 0) {
      console.log(`\n✅ Found team: ${data.response[0].team.name}`);
    } else {
      console.log('\n⚠️ No team found in response');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Get Premier League fixtures
  console.log('📅 Test 4: Get Premier League fixtures (league=39, season=2024)');
  console.log('━'.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/fixtures?league=39&season=2024&last=5`, {
      method: 'GET',
      headers: headers
    });

    console.log(`Status Code: ${response.status} ${response.statusText}`);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      if (key.includes('rate') || key.includes('limit') || key.includes('remaining')) {
        console.log(`  ${key}: ${value}`);
      }
    });

    const data = await response.json();
    console.log('\nResponse Summary:');
    console.log(`  Get: ${data.get}`);
    console.log(`  Parameters: ${JSON.stringify(data.parameters)}`);
    console.log(`  Errors: ${JSON.stringify(data.errors)}`);
    console.log(`  Results: ${data.results}`);
    
    if (data.response && data.response.length > 0) {
      console.log(`\n✅ Found ${data.response.length} fixtures`);
      console.log('First fixture:', {
        id: data.response[0].fixture?.id,
        date: data.response[0].fixture?.date,
        teams: `${data.response[0].teams?.home?.name} vs ${data.response[0].teams?.away?.name}`
      });
    } else {
      console.log('\n⚠️ No fixtures found in response');
    }
    
    console.log('\nFull Response (first 2000 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 5: Get H2H between Liverpool and Man United
  console.log('⚔️ Test 5: Get H2H Liverpool vs Man United (40-33)');
  console.log('━'.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/fixtures/headtohead?h2h=40-33&last=5`, {
      method: 'GET',
      headers: headers
    });

    console.log(`Status Code: ${response.status} ${response.statusText}`);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      if (key.includes('rate') || key.includes('limit') || key.includes('remaining')) {
        console.log(`  ${key}: ${value}`);
      }
    });

    const data = await response.json();
    console.log('\nResponse Summary:');
    console.log(`  Get: ${data.get}`);
    console.log(`  Parameters: ${JSON.stringify(data.parameters)}`);
    console.log(`  Errors: ${JSON.stringify(data.errors)}`);
    console.log(`  Results: ${data.results}`);
    
    if (data.response && data.response.length > 0) {
      console.log(`\n✅ Found ${data.response.length} H2H fixtures`);
      data.response.forEach((fixture: any, i: number) => {
        console.log(`  ${i + 1}. ${fixture.teams?.home?.name} ${fixture.goals?.home} - ${fixture.goals?.away} ${fixture.teams?.away?.name} (${fixture.fixture?.date?.substring(0, 10)})`);
      });
    } else {
      console.log('\n⚠️ No H2H fixtures found in response');
    }
    
    console.log('\nFull Response (first 2000 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testAPIResponseDetails()
  .then(() => {
    console.log('\n✅ API Response Details test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
