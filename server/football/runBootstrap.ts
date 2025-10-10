#!/usr/bin/env tsx
/**
 * Bootstrap Runner Script
 * 
 * This script provides an easy way to run the historical data bootstrap process.
 * 
 * Usage Examples:
 * ---------------
 * 
 * 1. Run with defaults (Premier League & Champions League, seasons 2020-2025):
 *    tsx server/football/runBootstrap.ts
 * 
 * 2. Specify custom leagues:
 *    tsx server/football/runBootstrap.ts --leagues=39,2
 * 
 * 3. Specify custom seasons:
 *    tsx server/football/runBootstrap.ts --seasons=2023,2024,2025
 * 
 * 4. Skip existing data:
 *    tsx server/football/runBootstrap.ts --skip-existing
 * 
 * 5. Custom batch size and delay:
 *    tsx server/football/runBootstrap.ts --batch-size=50 --delay=2000
 * 
 * 6. Complete example:
 *    tsx server/football/runBootstrap.ts --leagues=39 --seasons=2024,2025 --skip-existing
 * 
 * Available Options:
 * ------------------
 *   --leagues=39,2         League IDs (default: 39=Premier League, 2=Champions League)
 *   --seasons=2020,2021    Seasons to fetch (default: 2020-2025)
 *   --batch-size=100       Records per batch insert (default: 100)
 *   --delay=1000          Delay between API calls in ms (default: 1000)
 *   --skip-existing       Skip data that already exists
 *   --help               Show help message
 */

import { HistoricalDataBootstrap } from './historicalDataBootstrap';

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         FOOTBALL DATA HISTORICAL BOOTSTRAP TOOL           ║
║                                                            ║
║  This tool will fetch and store historical football data  ║
║  for Premier League and Champions League                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

// Run the bootstrap
const bootstrap = new HistoricalDataBootstrap();
bootstrap.bootstrapAll().then(() => {
  console.log('\n✨ Bootstrap process completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Bootstrap process failed:', error);
  process.exit(1);
});