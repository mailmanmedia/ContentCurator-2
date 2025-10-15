/**
 * Test different API-Football header formats to determine the correct one
 * This script tests both x-rapidapi-key and x-apisports-key headers
 */

import '../config'; // Load environment variables
import axios from 'axios';

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

if (!API_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found in environment');
  process.exit(1);
}

// Now API_KEY is guaranteed to be a string
const apiKey: string = API_KEY;

console.log('🔑 API Key (first 8 chars):', API_KEY.substring(0, 8) + '...');
console.log('🌍 Base URL:', BASE_URL);
console.log();

async function testHeaderFormat(headerName: string, headerValue: string): Promise<boolean> {
  console.log(`\n📡 Testing header: ${headerName}`);
  
  try {
    const response = await axios.get(`${BASE_URL}/status`, {
      headers: {
        [headerName]: headerValue
      },
      timeout: 10000
    });

    console.log(`✅ ${headerName} - Status:`, response.status);
    console.log(`✅ ${headerName} - Response:`, JSON.stringify(response.data, null, 2));
    return true;
  } catch (error: any) {
    if (error.response) {
      console.log(`❌ ${headerName} - Status:`, error.response.status);
      console.log(`❌ ${headerName} - Error:`, error.response.data);
    } else if (error.request) {
      console.log(`❌ ${headerName} - Network Error:`, error.message);
    } else {
      console.log(`❌ ${headerName} - Unexpected Error:`, error.message);
    }
    return false;
  }
}

async function testAPIHeaders() {
  console.log('🧪 Testing API-Football Header Formats');
  console.log('='.repeat(50));

  // Test x-rapidapi-key (RapidAPI format)
  const rapidApiWorked = await testHeaderFormat('x-rapidapi-key', API_KEY);
  
  // Test x-apisports-key (direct API-Sports format)
  const apiSportsWorked = await testHeaderFormat('x-apisports-key', API_KEY);

  // Test X-RapidAPI-Key (capitalized)
  const rapidApiCapWorked = await testHeaderFormat('X-RapidAPI-Key', API_KEY);

  console.log('\n📊 Results Summary:');
  console.log('='.repeat(30));
  console.log(`x-rapidapi-key:     ${rapidApiWorked ? '✅ Works' : '❌ Failed'}`);
  console.log(`x-apisports-key:    ${apiSportsWorked ? '✅ Works' : '❌ Failed'}`);
  console.log(`X-RapidAPI-Key:     ${rapidApiCapWorked ? '✅ Works' : '❌ Failed'}`);

  if (rapidApiWorked) {
    console.log('\n🎯 Recommendation: Use x-rapidapi-key header (RapidAPI format)');
  } else if (apiSportsWorked) {
    console.log('\n🎯 Recommendation: Use x-apisports-key header (direct API-Sports format)');
  } else if (rapidApiCapWorked) {
    console.log('\n🎯 Recommendation: Use X-RapidAPI-Key header (capitalized RapidAPI format)');
  } else {
    console.log('\n❌ No header format worked - check API key validity');
  }
}

// Also test a simple fixture endpoint to verify the working header
async function testFixturesEndpoint() {
  console.log('\n\n🏈 Testing Fixtures Endpoint with Working Header');
  console.log('='.repeat(50));

  const headers = [
    { name: 'x-rapidapi-key', value: API_KEY },
    { name: 'x-apisports-key', value: API_KEY },
    { name: 'X-RapidAPI-Key', value: API_KEY }
  ];

  for (const header of headers) {
    try {
      console.log(`\n📡 Testing /fixtures with ${header.name}`);
      const response = await axios.get(`${BASE_URL}/fixtures`, {
        params: {
          date: '2024-10-15',
          league: 39, // Premier League
          season: 2024
        },
        headers: {
          [header.name]: header.value
        },
        timeout: 10000
      });

      console.log(`✅ ${header.name} - Status:`, response.status);
      console.log(`✅ ${header.name} - Results:`, response.data.results || 0);
      if (response.data.response && response.data.response.length > 0) {
        console.log(`✅ ${header.name} - First fixture:`, response.data.response[0].teams.home.name, 'vs', response.data.response[0].teams.away.name);
      }
      break; // Stop on first success
    } catch (error: any) {
      if (error.response) {
        console.log(`❌ ${header.name} - Status:`, error.response.status);
        console.log(`❌ ${header.name} - Error:`, error.response.data?.message || error.response.data);
      } else {
        console.log(`❌ ${header.name} - Error:`, error.message);
      }
    }
  }
}

async function main() {
  try {
    await testAPIHeaders();
    await testFixturesEndpoint();
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
  }
}

main();
