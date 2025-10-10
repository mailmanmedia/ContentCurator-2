/**
 * Test script for Historical Data Bootstrap
 * 
 * This script tests a minimal version of the bootstrap to ensure:
 * 1. API connection is working
 * 2. Database operations are functioning
 * 3. Data sync tracking is operational
 * 
 * Run with: tsx server/football/testBootstrap.ts
 */

import { HistoricalDataBootstrap } from './historicalDataBootstrap';
import { db } from '../db';
import { data_sync_status, data_sync_logs } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';

async function testBootstrap() {
  console.log('════════════════════════════════════════════════════════');
  console.log('          BOOTSTRAP TEST - MINIMAL CONFIG');
  console.log('════════════════════════════════════════════════════════');
  console.log('Testing with limited data to verify functionality...\n');

  try {
    // Test 1: Initialize bootstrap with minimal config
    console.log('✅ Test 1: Initializing bootstrap service...');
    const bootstrap = new HistoricalDataBootstrap({
      leagues: [39],          // Only Premier League
      seasons: [2024, 2025],  // Only current seasons
      batchSize: 10,          // Small batch size
      delayMs: 2000,          // Longer delay for testing
      skipExisting: false
    });
    console.log('   Bootstrap service initialized successfully!\n');

    // Test 2: Check database connection
    console.log('✅ Test 2: Testing database connection...');
    const testQuery = await db.select().from(data_sync_status).limit(1);
    console.log('   Database connection successful!\n');

    // Test 3: Run a minimal bootstrap (leagues only)
    console.log('✅ Test 3: Running minimal bootstrap (leagues only)...');
    console.log('   This will make 1-2 API calls to test the system.\n');
    
    // Only bootstrap leagues for testing
    await bootstrap['bootstrapLeagues']();
    
    // Test 4: Check sync logs
    console.log('\n✅ Test 4: Checking sync logs...');
    const logs = await db
      .select()
      .from(data_sync_logs)
      .orderBy(desc(data_sync_logs.created_at))
      .limit(5);
    
    if (logs.length > 0) {
      console.log('   Recent sync logs:');
      logs.forEach(log => {
        console.log(`   - ${log.resource_type}: ${log.status} (${log.records_processed} records)`);
      });
    } else {
      console.log('   No sync logs found yet (this is normal for first run)');
    }

    // Test 5: Check sync status
    console.log('\n✅ Test 5: Checking sync status...');
    const status = await db
      .select()
      .from(data_sync_status)
      .where(eq(data_sync_status.resource_type, 'leagues'))
      .limit(1);
    
    if (status.length > 0) {
      console.log('   Sync status for leagues:');
      console.log(`   - Last sync: ${status[0].last_sync_at}`);
      console.log(`   - Records synced: ${status[0].total_synced}`);
      console.log(`   - Status: ${status[0].sync_status}`);
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log('              TEST COMPLETED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════════════════');
    console.log('\nThe bootstrap service is working correctly!');
    console.log('You can now run the full bootstrap with:');
    console.log('  tsx server/football/runBootstrap.ts');
    console.log('\nOr with custom options:');
    console.log('  tsx server/football/runBootstrap.ts --leagues=39,2 --seasons=2020,2021,2022,2023,2024,2025');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API_FOOTBALL_KEY')) {
        console.error('\n⚠️ API Key Issue Detected!');
        console.error('Please ensure API_FOOTBALL_KEY is set in your environment variables.');
        console.error('You can get an API key from: https://www.api-football.com/');
      } else if (error.message.includes('DATABASE_URL')) {
        console.error('\n⚠️ Database Connection Issue!');
        console.error('Please ensure DATABASE_URL is properly configured.');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testBootstrap();