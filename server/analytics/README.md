# Mailman Media Analytics Engine

## Overview
Comprehensive football analytics calculation engine with 35 formulas organized into 9 sections (A-I). All formulas include proper TypeScript typing, JSDoc documentation, interpretation thresholds, and return structured results with both numerical values and human-readable interpretations.

## Implementation Summary

### Total: 35 Formulas Implemented ✅

---

## SECTION A: Mailman Branded Metrics (4 formulas)

### A1. Slot Intensity Index (SII)
**Method:** `calculateSlotIntensityIndex()`
- Measures managerial intensity via high press, transition speed, and rotation
- **Interpretation Thresholds:**
  - \> 75: Ultra-intense, Klopp-level pressing
  - 60-75: High intensity
  - 45-60: Moderate intensity
  - < 45: Low intensity

### A2. Integration Score
**Method:** `calculateIntegrationScore()`
- Measures new player/system integration
- **Interpretation Thresholds:**
  - \> 0.75: Seamless integration
  - 0.50-0.75: Good integration
  - 0.25-0.50: Adjustment period
  - < 0.25: Struggling integration

### A3. Competition Load Factor (CLF)
**Method:** `calculateCompetitionLoadFactor()`
- Measures fixture congestion impact
- **Interpretation Thresholds:**
  - \> 2.5: Severe congestion
  - 2.0-2.5: Heavy load
  - 1.5-2.0: Moderate load
  - < 1.5: Normal schedule

### A4. Squad Vulnerability Index (SVI)
**Method:** `calculateSquadVulnerabilityIndex()`
- Assesses injury risk and squad depth concerns
- **Interpretation Thresholds:**
  - \> 0.60: Critical vulnerability
  - 0.40-0.60: Elevated risk
  - 0.20-0.40: Moderate concern
  - < 0.20: Robust squad

---

## SECTION B: Team Performance Metrics (6 formulas)

### B1. Form Index
**Method:** `calculateFormIndex()`
- Weighted recent performance metric
- **Interpretation Thresholds:**
  - 2.5-3.0: Excellent form
  - 2.0-2.5: Good form
  - 1.5-2.0: Average form
  - < 1.5: Poor form

### B2. Expected Points (xPTS)
**Method:** `calculateExpectedPoints()`
- Calculate expected points from xG data
- **Interpretation Thresholds:**
  - ≥ 2.5: Dominant performance expected
  - ≥ 2.0: Likely winner
  - ≥ 1.5: Competitive match
  - ≥ 1.0: Slight underdog
  - < 1.0: Significant underdog

### B3. Goal Efficiency
**Method:** `calculateGoalEfficiency()`
- Measure finishing quality vs chances created
- Returns: goalEfficiency, chanceConversion, bigChanceConversion
- **Interpretation Thresholds:**
  - \> 0.30: Elite finishing
  - 0.25-0.30: Strong finishing
  - 0.20-0.25: Average finishing
  - < 0.20: Poor finishing

### B4. Defensive Solidity Index
**Method:** `calculateDefensiveSolidityIndex()`
- Measure defensive quality and chance prevention
- **Interpretation Thresholds:**
  - \> 1.5: Elite defense
  - 1.2-1.5: Strong defense
  - 0.9-1.2: Average defense
  - < 0.9: Vulnerable defense

### B5. Home/Away Performance Differential
**Method:** `calculateHomeAwayDifferential()`
- Identify venue-specific strengths or weaknesses
- Returns: hapd, homeGDAdvantage
- **Interpretation Thresholds:**
  - \> 1.5: Strong home advantage
  - 0.8-1.5: Normal home advantage
  - 0.3-0.8: Weak home advantage
  - < 0.3: No home advantage

### B6. Pressure Index
**Method:** `calculatePressureIndex()`
- Measure attacking dominance and territorial control
- Returns: value (basic), advanced (with field tilt)
- **Interpretation Thresholds:**
  - \> 35: Dominant attacking pressure
  - 28-35: Strong attacking presence
  - 22-28: Moderate pressure
  - < 22: Limited attacking threat

---

## SECTION C: Match Prediction Metrics (3 formulas)

### C1. Head-to-Head Advantage Index
**Method:** `calculateHeadToHeadIndex()`
- Quantify historical dominance in specific fixtures
- **Interpretation Thresholds:**
  - \> 0.5: Strong historical advantage
  - 0.2-0.5: Moderate advantage
  - -0.2 to 0.2: Even fixture
  - < -0.2: Historical disadvantage

### C2. Momentum Score
**Method:** `calculateMomentumScore()`
- Combine recent form with league position pressure
- **Interpretation Thresholds:**
  - \> 80: Peak momentum, hard to stop
  - 65-80: Strong momentum
  - 50-65: Moderate momentum
  - 35-50: Wavering momentum
  - < 35: Negative momentum, crisis

### C3. Match Outcome Probability
**Method:** `calculateMatchOutcomeProbability()`
- Predict match result using multiple factors
- Returns: win%, draw%, loss% probabilities
- **Interpretation Thresholds:**
  - Win > 65%: Strong favorite
  - Win ≥ 50%: Slight favorite
  - Win ≥ 35%: Competitive match
  - Win < 35%: Underdog

---

## SECTION D: Player Analysis Metrics (4 formulas)

### D1. Goals Per 90
**Method:** `calculateGoalsPer90()`
- Normalized goal scoring rate
- **Position-Adjusted Benchmarks:**
  - **Striker:** Elite >0.65, Good 0.45-0.65, Average 0.30-0.45
  - **Winger:** Elite >0.45, Good 0.30-0.45, Average 0.15-0.30
  - **Midfielder:** Elite >0.25, Good 0.15-0.25, Average 0.08-0.15
  - **Defender:** Elite >0.10, Good 0.05-0.10, Average 0.02-0.05

### D2. Assist Rate & Creativity Index
**Method:** `calculateCreativityIndex()`
- Measure creative contribution
- Returns: assistRate, creativityIndex
- **Interpretation Thresholds:**
  - CI > 4.0: Elite creator
  - CI 3.0-4.0: Strong creator
  - CI 2.0-3.0: Average creator
  - CI < 2.0: Limited creativity

### D3. Involvement Score
**Method:** `calculateInvolvementScore()`
- Measure total offensive contribution
- Returns: basic, advanced scores
- **Interpretation Thresholds:**
  - \> 50%: Offensive focal point, irreplaceable
  - 35-50%: Key contributor
  - 20-35%: Regular contributor
  - < 20%: Squad player role

### D4. Impact Rating
**Method:** `calculateImpactRating()`
- Weight contributions by importance
- Returns: total, per90 ratings
- **Position-Specific Benchmarks (per 90):**
  - **Attackers:** > 5.0 (World class), 4.0-5.0 (Elite)
  - **Midfielders:** > 4.5 (World class), 3.5-4.5 (Elite)
  - **Defenders:** > 4.5 (World class), 3.5-4.5 (Elite)

---

## SECTION E: Season Progression Metrics (4 formulas)

### E1. PPG Trajectory
**Method:** `calculatePPGTrajectory()`
- Project final points total
- Returns: currentPPG, recentPPG, simpleProjection, formAdjustedProjection
- **Interpretation Thresholds:**
  - ≥ 90 points: Title-winning pace
  - ≥ 75 points: Top 4 pace
  - ≥ 60 points: European qualification pace
  - ≥ 45 points: Mid-table pace
  - < 45 points: Relegation battle

### E2. Goal Difference Trend
**Method:** `calculateGoalDifferenceTrend()`
- Analyze GD performance vs expectations
- Returns: currentGDPerMatch, expectedGD, variance
- **Interpretation Thresholds:**
  - Variance > 20%: Significantly outperforming expectations
  - Variance > 5%: Above expectations
  - Variance ≥ -5%: Meeting expectations
  - Variance ≥ -20%: Below expectations
  - Variance < -20%: Significantly underperforming

### E3. Top 4 Probability
**Method:** `calculateTop4Probability()`
- Model probability of finishing in top 4
- **Interpretation Thresholds:**
  - \> 95%: Virtually certain
  - ≥ 80%: Highly likely
  - ≥ 60%: Probable
  - ≥ 40%: Possible
  - ≥ 20%: Unlikely
  - < 20%: Very unlikely

### E4. Title Race Index
**Method:** `calculateTitleRaceIndex()`
- Quantify realistic title chances
- **Interpretation Thresholds:**
  - \> 0.90: Strong title contention
  - 0.75-0.90: Realistic chance
  - 0.50-0.75: Outside chance
  - < 0.50: Unlikely

---

## SECTION F: Tactical Analysis Metrics (4 formulas)

### F1. Pressing Success Rate
**Method:** `calculatePressingSuccessRate()`
- Measure pressing effectiveness
- Returns: psr (Pressing Success Rate), cpe (Counter-Pressing Efficiency)
- **Interpretation Thresholds:**
  - **PSR:** > 20% (Elite), 15-20% (Strong), 10-15% (Average), < 10% (Weak)
  - **CPE:** > 30% (Elite), 20-30% (Good), < 20% (Poor)

### F2. Possession Efficiency
**Method:** `calculatePossessionEfficiency()`
- Measure quality of possession
- Returns: basic, advanced, buildUpRate, conversionRate
- **Interpretation Thresholds:**
  - \> 20: Highly efficient possession
  - 15-20: Good efficiency
  - 10-15: Average
  - < 10: Inefficient possession

### F3. Set Piece Threat Index
**Method:** `calculateSetPieceThreatIndex()`
- Measure set piece effectiveness
- Returns: spti, defensiveSolidity
- **Interpretation Thresholds:**
  - \> 6%: Elite set piece attack
  - 4-6%: Strong threat
  - 2-4%: Average
  - < 2%: Weak set piece threat

### F4. Counter-Attack Effectiveness
**Method:** `calculateCounterAttackEffectiveness()`
- Measure counter-attacking quality
- Returns: cae, transitionCompletion, counterXGPerAttempt
- **Interpretation Thresholds:**
  - \> 45%: Elite counter-attacking
  - 35-45%: Strong transitions
  - 25-35%: Average
  - < 25%: Weak counter-attack

---

## SECTION G: Comparative Metrics (3 formulas)

### G1. League Average Comparison Index
**Method:** `calculateLeagueAverageComparisonIndex()`
- Compare team stats to league averages
- **Interpretation Thresholds:**
  - \> 125: Significantly above average (title contender)
  - 110-125: Above average (top 6)
  - 90-110: Average (mid-table)
  - < 90: Below average

### G2. Position-Specific Ranking
**Method:** `calculatePositionSpecificRanking()`
- Rank player performance vs position peers
- Returns: psr, percentile
- **Interpretation Thresholds:**
  - ≥ 95th percentile: Elite (top 5%)
  - ≥ 90th percentile: Excellent (top 10%)
  - ≥ 75th percentile: Above average (top 25%)
  - ≥ 50th percentile: Average
  - < 50th percentile: Below average

### G3. Strength of Schedule Adjustment
**Method:** `calculateStrengthOfScheduleAdjustment()`
- Adjust stats for opponent quality
- Returns: adjusted, adjustmentFactor
- **Interpretation Thresholds:**
  - Factor > 1.05: Easier schedule than average
  - Factor 0.95-1.05: Average schedule difficulty
  - Factor < 0.95: Harder schedule than average

---

## SECTION H: RSS/News Analysis Metrics (4 formulas)

### H1. Sentiment Aggregation Score
**Method:** `calculateSentimentAggregationScore()`
- Aggregate news sentiment with credibility weighting
- **Interpretation Thresholds:**
  - \> 0.6: Very positive coverage
  - \> 0.3: Positive coverage
  - -0.3 to 0.3: Neutral coverage
  - \> -0.6: Negative coverage
  - ≤ -0.6: Very negative coverage

### H2. Topic Trending Score
**Method:** `calculateTopicTrendingScore()`
- Identify trending topics in coverage
- **Interpretation Thresholds:**
  - \> 1.0: Explosive trending
  - \> 0.5: Strongly trending
  - \> 0.2: Moderately trending
  - \> -0.2: Stable coverage
  - ≤ -0.2: Declining interest

### H3. Coverage Intensity Index
**Method:** `calculateCoverageIntensityIndex()`
- Measure volume of coverage
- **Interpretation Thresholds:**
  - \> 200: Exceptional coverage spike
  - ≥ 150: High coverage
  - ≥ 80: Normal coverage
  - ≥ 50: Below average coverage
  - < 50: Minimal coverage

### H4. Source Diversity Index
**Method:** `calculateSourceDiversityIndex()`
- Measure diversity of news sources
- **Interpretation Thresholds:**
  - \> 80: Excellent source diversity
  - ≥ 60: Good diversity
  - ≥ 40: Moderate diversity
  - < 40: Limited diversity

---

## SECTION I: Advanced Combined Metrics (3 formulas)

### I1. Comprehensive Match Strength Rating
**Method:** `calculateComprehensiveMatchStrengthRating()`
- Combine multiple factors for overall match rating
- **Interpretation Thresholds:**
  - \> 80: Peak strength
  - ≥ 65: Strong position
  - ≥ 50: Solid position
  - ≥ 35: Vulnerable
  - < 35: Weakened state

### I2. Fixture Difficulty Rating
**Method:** `calculateFixtureDifficultyRating()`
- Rate upcoming fixture difficulty
- Returns: rating, homeAdvantage
- **Interpretation Thresholds:**
  - \> 75: Very difficult run
  - ≥ 60: Challenging fixtures
  - ≥ 45: Average difficulty
  - ≥ 30: Favorable fixtures
  - < 30: Very favorable run

### I3. Player Value Index
**Method:** `calculatePlayerValueIndex()`
- Comprehensive player value rating
- **Interpretation Thresholds:**
  - \> 80: Elite value, cornerstone player
  - ≥ 60: High value, key player
  - ≥ 40: Good value, regular contributor
  - ≥ 20: Moderate value, squad player
  - < 20: Limited value

---

## Usage Example

```typescript
import { analyticsEngine } from './analyticsEngine';

// Example: Calculate Form Index
const formResult = analyticsEngine.calculateFormIndex('WWDWL');
console.log(formResult);
// { value: 2.47, interpretation: 'Good form' }

// Example: Calculate Goal Efficiency
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

const efficiency = analyticsEngine.calculateGoalEfficiency(teamStats);
console.log(efficiency);
// {
//   goalEfficiency: 0.363,
//   chanceConversion: 15.7,
//   bigChanceConversion: 66.7,
//   interpretation: 'Elite finishing'
// }

// Example: Calculate Player Impact
const playerStats = {
  goals: 15,
  assists: 8,
  minutesPlayed: 2340,
  matchesPlayed: 26,
  keyPasses: 52,
  shotCreatingActions: 78,
  tackles: 35,
  position: 'WG' as const
};

const impact = analyticsEngine.calculateImpactRating(playerStats);
console.log(impact);
// {
//   total: 119.5,
//   per90: 4.60,
//   interpretation: 'Elite attacker'
// }
```

## TypeScript Types

All methods are fully typed with:
- Input parameter interfaces
- Return type interfaces
- Position enums
- Comprehensive JSDoc comments

## Export

The engine is exported as a singleton:
```typescript
export const analyticsEngine = new AnalyticsEngine();
```

## File Stats
- **Lines of Code:** 1,613
- **Total Methods:** 35
- **TypeScript Interfaces:** 11
- **Zero LSP Errors:** ✅
