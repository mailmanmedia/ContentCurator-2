
import cron from 'node-cron';
import { execSync } from 'child_process';

/**
 * Schedule automatic H2H data export
 * Runs daily at 3 AM to keep data fresh
 */
export function initializeH2HExportScheduler() {
  console.log('📅 Initializing H2H export scheduler...');
  
  // Run daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('🔄 Running scheduled H2H export...');
    try {
      execSync('npm run export:h2h', { stdio: 'inherit' });
      console.log('✅ Scheduled H2H export completed');
    } catch (error) {
      console.error('❌ Scheduled H2H export failed:', error);
    }
  });

  // Run on startup (after 30 seconds delay)
  setTimeout(async () => {
    console.log('🚀 Running initial H2H export on startup...');
    try {
      execSync('npm run export:h2h', { stdio: 'inherit' });
      console.log('✅ Initial H2H export completed');
    } catch (error) {
      console.error('❌ Initial H2H export failed:', error);
    }
  }, 30000);

  console.log('✓ H2H export scheduler initialized');
  console.log('  - Daily export at 3 AM');
  console.log('  - Initial export on startup (30 seconds delay)');
}
