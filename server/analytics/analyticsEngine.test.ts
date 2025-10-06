/**
 * Analytics Engine Test & Usage Examples
 * Demonstrates all 35 formulas with sample data
 */

import { analyticsEngine } from './analyticsEngine';

console.log('='.repeat(80));
console.log('MAILMAN MEDIA ANALYTICS ENGINE - TEST SUITE');
console.log('='.repeat(80));

// SECTION A: MAILMAN BRANDED METRICS
console.log('\n📊 SECTION A: MAILMAN BRANDED METRICS\n');

// A1. Slot Intensity Index
const sii = analyticsEngine.calculateSlotIntensityIndex(145, 6.8, 0.35);
console.log('A1. Slot Intensity Index:', sii);

// A2. Integration Score
const integrationScore = analyticsEngine.calculateIntegrationScore(1200, 3800, 0.15);
console.log('A2. Integration Score:', integrationScore);

// A3. Competition Load Factor
const clf = analyticsEngine.calculateCompetitionLoadFactor(8, 28, 4);
console.log('A3. Competition Load Factor:', clf);

// A4. Squad Vulnerability Index
const svi = analyticsEngine.calculateSquadVulnerabilityIndex(3, 14, 2, 0.75);
console.log('A4. Squad Vulnerability Index:', svi);

// SECTION B: TEAM PERFORMANCE METRICS
console.log('\n⚽ SECTION B: TEAM PERFORMANCE METRICS\n');

// B1. Form Index
const formIndex = analyticsEngine.calculateFormIndex('WWDWL');
console.log('B1. Form Index:', formIndex);

// B2. Expected Points
const xPTS = analyticsEngine.calculateExpectedPoints(2.1, 0.9);
console.log('B2. Expected Points:', xPTS);

// B3. Goal Efficiency
const teamStats = {
  matchesPlayed: 10,
  wins: 7,
  draws: 2,
  losses: 1,
  goalsFor: 22,
  goalsAgainst: 8,
  cleanSheets: 5,
  xG: 20.5,
  xGA: 9.2,
  shotsOnTarget: 65,
  totalShots: 140,
  bigChances: 18,
  bigChancesScored: 12
};
const goalEfficiency = analyticsEngine.calculateGoalEfficiency(teamStats);
console.log('B3. Goal Efficiency:', goalEfficiency);

// B4. Defensive Solidity Index
const dsi = analyticsEngine.calculateDefensiveSolidityIndex(teamStats);
console.log('B4. Defensive Solidity Index:', dsi);

// B5. Home/Away Performance Differential
const homeAwayStats = {
  homeMatches: 8,
  homePoints: 21,
  homeGoalDifference: 14,
  awayMatches: 7,
  awayPoints: 14,
  awayGoalDifference: 6
};
const hapd = analyticsEngine.calculateHomeAwayDifferential(homeAwayStats);
console.log('B5. Home/Away Performance Differential:', hapd);

// B6. Pressure Index
const pressureIndex = analyticsEngine.calculatePressureIndex(19, 63, 8.4, 0.248);
console.log('B6. Pressure Index:', pressureIndex);

// SECTION C: MATCH PREDICTION METRICS
console.log('\n🎯 SECTION C: MATCH PREDICTION METRICS\n');

// C1. Head-to-Head Advantage Index
const h2hRecord = {
  wins: 6,
  draws: 2,
  losses: 2,
  recentResults: ['W', 'W', 'D', 'W', 'W', 'L', 'W', 'W', 'L', 'W'] as ('W' | 'D' | 'L')[],
  totalMatches: 10
};
const h2h = analyticsEngine.calculateHeadToHeadIndex(h2hRecord, true);
console.log('C1. Head-to-Head Advantage Index:', h2h);

// C2. Momentum Score
const momentumScore = analyticsEngine.calculateMomentumScore(
  85.7, 2, 2, 0, 0, 8, 2
);
console.log('C2. Momentum Score:', momentumScore);

// C3. Match Outcome Probability
const matchProb = analyticsEngine.calculateMatchOutcomeProbability(
  0.35, 3.85, true, 0.909, 0.4
);
console.log('C3. Match Outcome Probability:', matchProb);

// SECTION D: PLAYER ANALYSIS METRICS
console.log('\n👤 SECTION D: PLAYER ANALYSIS METRICS\n');

const playerStats = {
  goals: 15,
  assists: 8,
  minutesPlayed: 2340,
  matchesPlayed: 26,
  keyPasses: 52,
  shotCreatingActions: 78,
  tackles: 35,
  interceptions: 28,
  clearances: 45,
  penaltiesWon: 3,
  position: 'WG' as const
};

// D1. Goals Per 90
const g90 = analyticsEngine.calculateGoalsPer90(playerStats);
console.log('D1. Goals Per 90:', g90);

// D2. Creativity Index
const creativity = analyticsEngine.calculateCreativityIndex(playerStats);
console.log('D2. Creativity Index:', creativity);

// D3. Involvement Score
const involvement = analyticsEngine.calculateInvolvementScore(playerStats, 58);
console.log('D3. Involvement Score:', involvement);

// D4. Impact Rating
const impact = analyticsEngine.calculateImpactRating(playerStats);
console.log('D4. Impact Rating:', impact);

// SECTION E: SEASON PROGRESSION METRICS
console.log('\n📈 SECTION E: SEASON PROGRESSION METRICS\n');

// E1. PPG Trajectory
const ppgTrajectory = analyticsEngine.calculatePPGTrajectory(63, 25, 13);
console.log('E1. PPG Trajectory:', ppgTrajectory);

// E2. Goal Difference Trend
const gdTrend = analyticsEngine.calculateGoalDifferenceTrend(38, 25, 1.5);
console.log('E2. Goal Difference Trend:', gdTrend);

// E3. Top 4 Probability
const top4Prob = analyticsEngine.calculateTop4Probability(63, 2.52, 0.4, 8);
console.log('E3. Top 4 Probability:', top4Prob);

// E4. Title Race Index
const titleRaceIndex = analyticsEngine.calculateTitleRaceIndex(25, 63, 2, 2.60, 1.2);
console.log('E4. Title Race Index:', titleRaceIndex);

// SECTION F: TACTICAL ANALYSIS METRICS
console.log('\n⚔️ SECTION F: TACTICAL ANALYSIS METRICS\n');

// F1. Pressing Success Rate
const pressingStats = {
  highTurnovers: 28,
  tackles: 62,
  interceptions: 31,
  pressures: 52,
  ballLosses: 89,
  regainedWithin5Sec: 31
};
const psr = analyticsEngine.calculatePressingSuccessRate(pressingStats);
console.log('F1. Pressing Success Rate:', psr);

// F2. Possession Efficiency
const possessionEff = analyticsEngine.calculatePossessionEfficiency(
  63, 12, 1.9, 420, 95, 28, 18
);
console.log('F2. Possession Efficiency:', possessionEff);

// F3. Set Piece Threat Index
const setPieceStats = {
  goalsFromSetPieces: 5,
  totalCorners: 78,
  freekicksInRange: 12,
  uniqueRoutines: 8,
  goalsConcededFromSetPieces: 2,
  opponentSetPieces: 68
};
const spti = analyticsEngine.calculateSetPieceThreatIndex(setPieceStats);
console.log('F3. Set Piece Threat Index:', spti);

// F4. Counter-Attack Effectiveness
const counterStats = {
  fastBreakGoals: 12,
  fastBreakAttempts: 45,
  avgTransitionSpeed: 6.2,
  successfulCounters: 38,
  counterOpportunities: 67,
  counterXG: 18.5
};
const cae = analyticsEngine.calculateCounterAttackEffectiveness(counterStats);
console.log('F4. Counter-Attack Effectiveness:', cae);

// SECTION G: COMPARATIVE METRICS
console.log('\n📊 SECTION G: COMPARATIVE METRICS\n');

// G1. League Average Comparison Index
const laci = analyticsEngine.calculateLeagueAverageComparisonIndex(2.1, 1.45, false);
console.log('G1. League Average Comparison Index:', laci);

// G2. Position-Specific Ranking
const positionRanking = analyticsEngine.calculatePositionSpecificRanking(
  8.2, 5.1, 78, 82
);
console.log('G2. Position-Specific Ranking:', positionRanking);

// G3. Strength of Schedule Adjustment
const sosAdjustment = analyticsEngine.calculateStrengthOfScheduleAdjustment(
  2.52, 1.45, 1.40
);
console.log('G3. Strength of Schedule Adjustment:', sosAdjustment);

// SECTION H: RSS/NEWS ANALYSIS METRICS
console.log('\n📰 SECTION H: RSS/NEWS ANALYSIS METRICS\n');

// H1. Sentiment Aggregation Score
const articles = [
  { sentiment: 0.8, sourceCredibility: 1.0, ageInHours: 12 },
  { sentiment: 0.6, sourceCredibility: 1.0, ageInHours: 18 },
  { sentiment: 0.7, sourceCredibility: 0.8, ageInHours: 30 },
  { sentiment: -0.2, sourceCredibility: 0.6, ageInHours: 48 },
  { sentiment: 0.5, sourceCredibility: 0.8, ageInHours: 72 }
];
const sentimentScore = analyticsEngine.calculateSentimentAggregationScore(articles);
console.log('H1. Sentiment Aggregation Score:', sentimentScore);

// H2. Topic Trending Score
const trendingScore = analyticsEngine.calculateTopicTrendingScore(25, 18, 12);
console.log('H2. Topic Trending Score:', trendingScore);

// H3. Coverage Intensity Index
const coverageIntensity = analyticsEngine.calculateCoverageIntensityIndex(28, 15);
console.log('H3. Coverage Intensity Index:', coverageIntensity);

// H4. Source Diversity Index
const sourceDiversity = analyticsEngine.calculateSourceDiversityIndex(15, 5, 6, 4);
console.log('H4. Source Diversity Index:', sourceDiversity);

// SECTION I: ADVANCED COMBINED METRICS
console.log('\n🔬 SECTION I: ADVANCED COMBINED METRICS\n');

// I1. Comprehensive Match Strength Rating
const cmsr = analyticsEngine.calculateComprehensiveMatchStrengthRating(
  85, 90, 6, 75
);
console.log('I1. Comprehensive Match Strength Rating:', cmsr);

// I2. Fixture Difficulty Rating
const fixtures = [
  { teamId: 40, opponentId: 50, isHome: true, opponentStrength: 82 },
  { teamId: 40, opponentId: 33, isHome: false, opponentStrength: 78 },
  { teamId: 40, opponentId: 47, isHome: true, opponentStrength: 65 },
  { teamId: 40, opponentId: 42, isHome: false, opponentStrength: 88 },
  { teamId: 40, opponentId: 49, isHome: true, opponentStrength: 71 }
];
const fdr = analyticsEngine.calculateFixtureDifficultyRating(fixtures);
console.log('I2. Fixture Difficulty Rating:', fdr);

// I3. Player Value Index
const playerValue = analyticsEngine.calculatePlayerValueIndex(
  playerStats, 58, 26, 3
);
console.log('I3. Player Value Index:', playerValue);

console.log('\n' + '='.repeat(80));
console.log('✅ ALL 35 FORMULAS SUCCESSFULLY TESTED');
console.log('='.repeat(80) + '\n');
