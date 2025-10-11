/**
 * Date/Time Validation System for Football API
 * Ensures accurate date awareness and proper season calculations
 */

export interface DateContext {
  currentDateTime: Date;
  currentDateTimeString: string;
  timezone: string;
  currentYear: number;
  currentMonth: number;
  currentSeason: string;
  currentSeasonYear: number;
  historicalStatsSeason: string;
  historicalStatsSeasonYear: number;
  fixturesSeason: string;
  fixturesSeasonYear: number;
  isActiveSeason: boolean;
  isOffSeason: boolean;
  seasonPhase: 'pre-season' | 'active-season' | 'off-season';
}

export interface DateValidationResult {
  isValid: boolean;
  context: DateContext;
  validationMessage: string;
  warnings: string[];
}

/**
 * Get the current system date and time
 */
export function getCurrentDateTime(): Date {
  return new Date();
}

/**
 * Format date/time for display
 */
export function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Get the current timezone
 */
export function getCurrentTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Determine the current football season based on the current date
 * Football seasons run from August to May
 * Season is named by the year it starts (e.g., 2025/26 season starts in August 2025)
 */
export function getCurrentFootballSeason(date: Date = new Date()): { season: string; year: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  
  // Season starts in August (month 8)
  // If we're in August or later, the season is the current year
  // If we're before August (Jan-July), the season is the previous year
  let seasonYear: number;
  
  if (month >= 8) {
    // August onwards - current season
    seasonYear = year;
  } else {
    // January to July - still in previous season or off-season
    seasonYear = year - 1;
  }
  
  const nextYear = seasonYear + 1;
  const season = `${seasonYear}/${nextYear.toString().slice(-2)}`;
  
  return { season, year: seasonYear };
}

/**
 * Determine which season to use for historical statistics
 * This should be the most recently COMPLETED season
 */
export function getHistoricalStatsSeason(date: Date = new Date()): { season: string; year: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  // Historical stats always come from the COMPLETED season
  // Season completes in May
  // From June onwards, we can use the season that just completed
  // Before June, we use the season before that
  
  let statsSeasonYear: number;
  
  if (month >= 6) {
    // June onwards - use the season that just completed (ended in May)
    // Current year minus 1
    statsSeasonYear = year - 1;
  } else {
    // January to May - still in current season, so previous completed is 2 years ago
    statsSeasonYear = year - 2;
  }
  
  const nextYear = statsSeasonYear + 1;
  const season = `${statsSeasonYear}/${nextYear.toString().slice(-2)}`;
  
  return { season, year: statsSeasonYear };
}

/**
 * Determine which season to use for fixtures
 * This should be the current/upcoming season
 */
export function getFixturesSeason(date: Date = new Date()): { season: string; year: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  
  let fixturesSeasonYear: number;
  
  // During off-season (June-July), fixtures should target the UPCOMING season
  if (month === 6 || month === 7) {
    // June-July: use current year for upcoming season
    fixturesSeasonYear = year;
  } else if (month >= 8) {
    // August onwards - current season
    fixturesSeasonYear = year;
  } else {
    // January to May - still in current season that started previous year
    fixturesSeasonYear = year - 1;
  }
  
  const nextYear = fixturesSeasonYear + 1;
  const season = `${fixturesSeasonYear}/${nextYear.toString().slice(-2)}`;
  
  return { season, year: fixturesSeasonYear };
}

/**
 * Determine the current phase of the football season
 */
export function getSeasonPhase(date: Date = new Date()): 'pre-season' | 'active-season' | 'off-season' {
  const month = date.getMonth() + 1;
  
  if (month >= 8 && month <= 12) {
    // August to December - active season (first half)
    return 'active-season';
  } else if (month >= 1 && month <= 5) {
    // January to May - active season (second half)
    return 'active-season';
  } else if (month === 6 || month === 7) {
    // June to July - off-season
    return 'off-season';
  }
  
  return 'active-season';
}

/**
 * Build comprehensive date context for the football API
 */
export function buildDateContext(date: Date = new Date()): DateContext {
  const currentSeason = getCurrentFootballSeason(date);
  const historicalSeason = getHistoricalStatsSeason(date);
  const fixturesSeason = getFixturesSeason(date);
  const seasonPhase = getSeasonPhase(date);
  
  return {
    currentDateTime: date,
    currentDateTimeString: formatDateTime(date),
    timezone: getCurrentTimezone(),
    currentYear: date.getFullYear(),
    currentMonth: date.getMonth() + 1,
    currentSeason: currentSeason.season,
    currentSeasonYear: currentSeason.year,
    historicalStatsSeason: historicalSeason.season,
    historicalStatsSeasonYear: historicalSeason.year,
    fixturesSeason: fixturesSeason.season,
    fixturesSeasonYear: fixturesSeason.year,
    isActiveSeason: seasonPhase === 'active-season',
    isOffSeason: seasonPhase === 'off-season',
    seasonPhase
  };
}

/**
 * Validate the current date and build comprehensive context
 */
export function validateCurrentDate(): DateValidationResult {
  const now = getCurrentDateTime();
  const context = buildDateContext(now);
  const warnings: string[] = [];
  
  // Validate that the date is reasonable
  const currentYear = now.getFullYear();
  if (currentYear < 2020 || currentYear > 2030) {
    warnings.push(`Unusual year detected: ${currentYear}. Please verify system clock.`);
  }
  
  // Check if we're in off-season
  if (context.isOffSeason) {
    warnings.push(`Currently in off-season (${context.currentMonth === 6 ? 'June' : 'July'}). Using previous season for historical stats.`);
  }
  
  // Build validation message
  const validationMessage = `✓ Date Validation:
  Current: ${context.currentDateTimeString}
  Current Season: ${context.currentSeason}
  Historical Stats: ${context.historicalStatsSeason} season (${context.isOffSeason ? 'most recent completed' : 'completed'})
  Fixtures: ${context.fixturesSeason} season (${context.isActiveSeason ? 'active' : 'upcoming'})`;
  
  return {
    isValid: warnings.length === 0 || warnings.every(w => w.includes('off-season')),
    context,
    validationMessage,
    warnings
  };
}

/**
 * Log the date validation results
 */
export function logDateValidation(): DateContext {
  const validation = validateCurrentDate();
  
  console.log('\n' + '='.repeat(60));
  console.log('📅 FOOTBALL API DATE/TIME VALIDATION');
  console.log('='.repeat(60));
  console.log(validation.validationMessage);
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n📊 Detailed Context:');
  console.log(`   • Current Date/Time: ${validation.context.currentDateTimeString}`);
  console.log(`   • Timezone: ${validation.context.timezone}`);
  console.log(`   • Current Season: ${validation.context.currentSeason}`);
  console.log(`   • Using season ${validation.context.historicalStatsSeasonYear} for historical stats`);
  console.log(`   • Using season ${validation.context.fixturesSeasonYear} for fixtures`);
  console.log(`   • Season Phase: ${validation.context.seasonPhase}`);
  console.log(`   • Active Season: ${validation.context.isActiveSeason ? 'Yes' : 'No'}`);
  console.log('='.repeat(60) + '\n');
  
  return validation.context;
}

/**
 * Quick helper to get the season year for API calls
 */
export function getSeasonForStats(): number {
  const context = buildDateContext();
  return context.historicalStatsSeasonYear;
}

/**
 * Quick helper to get the season year for fixtures
 */
export function getSeasonForFixtures(): number {
  const context = buildDateContext();
  return context.fixturesSeasonYear;
}

/**
 * Get season context with minimal logging
 */
export function getSeasonContext(): {
  current: number;
  stats: number;
  fixtures: number;
  dateInfo: string;
} {
  const context = buildDateContext();
  
  return {
    current: context.currentSeasonYear,
    stats: context.historicalStatsSeasonYear,
    fixtures: context.fixturesSeasonYear,
    dateInfo: `Current: ${context.currentDateTimeString}, Season: ${context.currentSeason}`
  };
}
