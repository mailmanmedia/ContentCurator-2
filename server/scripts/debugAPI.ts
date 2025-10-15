import '../config'; // Load environment variables

async function debugAPIResponse() {
  console.log('🔍 Debugging API Football Responses...\n');

  const API_KEY = process.env.API_FOOTBALL_KEY;
  console.log(`API Key: ${API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET'}`);

  // Test 1: Simple status check with full response logging
  console.log('📊 Testing API Status with full response...');
  try {
    const response = await fetch('https://v3.football.api-sports.io/status', {
      headers: {
        'x-apisports-key': API_KEY!,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status Code: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));

    const data = await response.text();
    console.log(`   Raw Response: ${data}`);

    try {
      const jsonData = JSON.parse(data);
      console.log(`   Parsed JSON:`, JSON.stringify(jsonData, null, 2));
    } catch (parseError) {
      console.log(`   JSON Parse Error: ${parseError}`);
    }

  } catch (error: any) {
    console.log(`   Request Error: ${error.message}`);
  }

  // Test 2: Try a different endpoint
  console.log('\n⚽ Testing leagues endpoint...');
  try {
    const response = await fetch('https://v3.football.api-sports.io/leagues', {
      headers: {
        'x-apisports-key': API_KEY!
      }
    });

    console.log(`   Status Code: ${response.status}`);
    const data = await response.text();
    console.log(`   Response Length: ${data.length} characters`);
    
    if (data.length < 1000) {
      console.log(`   Full Response: ${data}`);
    } else {
      console.log(`   Response Preview: ${data.substring(0, 500)}...`);
    }

  } catch (error: any) {
    console.log(`   Request Error: ${error.message}`);
  }

  // Test 3: Check if we need specific parameters
  console.log('\n🏆 Testing with season parameter...');
  try {
    const currentYear = new Date().getFullYear();
    const testYear = 2024; // Use 2024 season which definitely exists
    
    const response = await fetch(`https://v3.football.api-sports.io/leagues?season=${testYear}`, {
      headers: {
        'x-apisports-key': API_KEY!
      }
    });

    console.log(`   Status Code: ${response.status}`);
    const data = await response.text();
    console.log(`   Response Length: ${data.length} characters`);
    
    try {
      const jsonData = JSON.parse(data);
      console.log(`   Response structure:`, Object.keys(jsonData));
      if (jsonData.response && Array.isArray(jsonData.response)) {
        console.log(`   Found ${jsonData.response.length} leagues for ${testYear}`);
        if (jsonData.response.length > 0) {
          console.log(`   First league:`, jsonData.response[0]);
        }
      }
      if (jsonData.errors && jsonData.errors.length > 0) {
        console.log(`   API Errors:`, jsonData.errors);
      }
    } catch (parseError) {
      console.log(`   JSON Parse Error: ${parseError}`);
    }

  } catch (error: any) {
    console.log(`   Request Error: ${error.message}`);
  }

  // Test 4: Test a very basic team search
  console.log('\n🔍 Testing basic team search...');
  try {
    const response = await fetch('https://v3.football.api-sports.io/teams?search=manchester', {
      headers: {
        'x-apisports-key': API_KEY!
      }
    });

    console.log(`   Status Code: ${response.status}`);
    const data = await response.text();
    
    try {
      const jsonData = JSON.parse(data);
      console.log(`   Response has 'response' key:`, 'response' in jsonData);
      console.log(`   Response has 'errors' key:`, 'errors' in jsonData);
      
      if (jsonData.errors && jsonData.errors.length > 0) {
        console.log(`   🚨 API Errors found:`, jsonData.errors);
      }
      
      if (jsonData.response) {
        console.log(`   Found ${jsonData.response.length} teams matching 'manchester'`);
        if (jsonData.response.length > 0) {
          console.log(`   First team:`, JSON.stringify(jsonData.response[0], null, 2));
        }
      }
    } catch (parseError) {
      console.log(`   JSON Parse Error: ${parseError}`);
      console.log(`   Raw response: ${data.substring(0, 200)}...`);
    }

  } catch (error: any) {
    console.log(`   Request Error: ${error.message}`);
  }
}

// Run the debug
debugAPIResponse()
  .then(() => {
    console.log('\n✅ API debugging completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
