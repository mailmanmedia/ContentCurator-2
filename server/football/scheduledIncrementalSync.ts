
import cron from 'node-cron';
import { incrementalSyncService } from './incrementalSyncService';

/**
 * Scheduled Incremental Sync
 * 
 * Runs every 15 minutes to fetch only new/updated data
 * Much more efficient than full syncs
 */
export function startIncrementalSyncSchedule() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running scheduled incremental sync...');
    try {
      await incrementalSyncService.runIncrementalSync();
    } catch (error) {
      console.error('❌ Scheduled incremental sync failed:', error);
    }
  });

  console.log('✅ Incremental sync scheduler started (every 15 minutes)');
}
