
import { historicalDataService } from './server/services/historicalDataService';

async function testH2H() {
  console.log('Testing H2H data fetching...');
  
  // Test Liverpool vs Man United
  const h2hData = await historicalDataService.getHeadToHeadData(40, 33, 10);
  console.log('Liverpool vs Man United H2H:', h2hData.length, 'matches found');
  
  if (h2hData.length > 0) {
    const latest = h2hData[0];
    console.log('Latest match:', {
      date: latest.date,
      season: latest.season,
      score: `${latest.homeTeamId === 40 ? 'Liverpool' : 'Man United'} ${latest.homeScore}-${latest.awayScore} ${latest.awayTeamId === 40 ? 'Liverpool' : 'Man United'}`
    });
  }
  
  // Check if 2025 season data is present
  const has2025 = h2hData.some(match => match.season === 2025);
  console.log('Has 2025 season data:', has2025);
  
  process.exit(0);
}

testH2H().catch(console.error);

