/**
 * Mailman Media Analytics Engine
 * Comprehensive football analytics calculation system with 35 formulas
 * organized into 9 sections (A-I)
 */

export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  form?: string;
  xG?: number;
  xGA?: number;
  shotsOnTarget?: number;
  shotsOnTargetAgainst?: number;
  totalShots?: number;
  bigChances?: number;
  bigChancesScored?: number;
  possession?: number;
  corners?: number;
  ppda?: number;
  finalThirdPasses?: number;
  totalPasses?: number;
}

export interface HomeAwayStats {
  homeMatches: number;
  homePoints: number;
  homeGoalDifference: number;
  awayMatches: number;
  awayPoints: number;
  awayGoalDifference: number;
}

export interface HeadToHeadRecord {
  wins: number;
  draws: number;
  losses: number;
  recentResults: ('W' | 'D' | 'L')[];
  totalMatches: number;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  minutesPlayed: number;
  matchesPlayed: number;
  keyPasses?: number;
  shotCreatingActions?: number;
  tackles?: number;
  interceptions?: number;
  clearances?: number;
  penaltiesWon?: number;
  position: 'GK' | 'CB' | 'FB' | 'CM' | 'AM' | 'WG' | 'ST';
}

export interface SetPieceStats {
  goalsFromSetPieces: number;
  totalCorners: number;
  freekicksInRange: number;
  uniqueRoutines: number;
  goalsConcededFromSetPieces: number;
  opponentSetPieces: number;
}

export interface CounterAttackStats {
  fastBreakGoals: number;
  fastBreakAttempts: number;
  avgTransitionSpeed: number;
  successfulCounters: number;
  counterOpportunities: number;
  counterXG: number;
}

export interface PressingStats {
  highTurnovers: number;
  tackles: number;
  interceptions: number;
  pressures: number;
  ballLosses: number;
  regainedWithin5Sec: number;
}

export interface ArticleSentiment {
  sentiment: number;
  sourceCredibility: number;
  ageInHours: number;
  topic?: string;
}

export interface FixtureInfo {
  teamId: number;
  opponentId: number;
  isHome: boolean;
  opponentStrength: number;
}

/**
 * Comprehensive Analytics Engine
 */
export class AnalyticsEngine {
  private readonly leagueAvgPPDA = 12.5;
  private readonly leagueAvgXGA = 1.35;
  private readonly leagueAvgHAPD = 0.4;

  /**
   * Calculate only specified metrics instead of all 35 formulas
   * @param metrics - Array of metric names to calculate
   * @param data - Input data
   * @returns Object with only requested metrics
   */
  calculateSelective(metrics: string[], data: any): Record<string, any> {
    const results: Record<string, any> = {};
    for (const metric of metrics) {
      if (typeof this[metric as keyof this] === 'function') {
        results[metric] = (this[metric as keyof this] as Function).call(this, data);
      }
    }
    return results;
  }

  /**
   * SECTION A: MAILMAN BRANDED METRICS
   */

  /**
   * A1. Slot Intensity Index (SII)
   * Measures managerial intensity via high press, transition speed, and rotation
   * 
   * @param pressingActions - Total pressing actions per match
   * @param transitionSpeed - Avg seconds from turnover to attacking third
   * @param rotationRate - Squad rotation percentage
   * @returns SII value with interpretation
   * 
   * Interpretation:
   * - SII > 75: Ultra-intense, Klopp-level pressing
   * - SII 60-75: High intensity
   * - SII 45-60: Moderate intensity
   * - SII < 45: Low intensity
   */
  calculateSlotIntensityIndex(
    pressingActions: number,
    transitionSpeed: number,
    rotationRate: number
  ): { value: number; interpretation: string } {
    const pressingComponent = Math.min(pressingActions / 150 * 40, 40);
    const speedComponent = Math.max(0, 30 - (transitionSpeed / 10 * 30));
    const rotationComponent = rotationRate * 30;

    const sii = pressingComponent + speedComponent + rotationComponent;

    let interpretation: string;
    if (sii > 75) interpretation = 'Ultra-intense, Klopp-level pressing';
    else if (sii >= 60) interpretation = 'High intensity';
    else if (sii >= 45) interpretation = 'Moderate intensity';
    else interpretation = 'Low intensity';

    return { value: parseFloat(sii.toFixed(2)), interpretation };
  }

  /**
   * A2. Integration Score
   * Measures new player/system integration
   * 
   * @param newPlayerMinutes - Minutes played by new signings
   * @param totalMinutes - Total team minutes available
   * @param performanceVsExpected - Performance delta from baseline
   * @returns Integration score with interpretation
   * 
   * Interpretation:
   * - IS > 0.75: Seamless integration
   * - IS 0.50-0.75: Good integration
   * - IS 0.25-0.50: Adjustment period
   * - IS < 0.25: Struggling integration
   */
  calculateIntegrationScore(
    newPlayerMinutes: number,
    totalMinutes: number,
    performanceVsExpected: number
  ): { value: number; interpretation: string } {
    const utilizationRate = newPlayerMinutes / totalMinutes;
    const performanceMultiplier = 1 + performanceVsExpected;
    
    const is = utilizationRate * performanceMultiplier;

    let interpretation: string;
    if (is > 0.75) interpretation = 'Seamless integration';
    else if (is >= 0.50) interpretation = 'Good integration';
    else if (is >= 0.25) interpretation = 'Adjustment period';
    else interpretation = 'Struggling integration';

    return { value: parseFloat(is.toFixed(3)), interpretation };
  }

  /**
   * A3. Competition Load Factor (CLF)
   * Measures fixture congestion impact
   * 
   * @param matchesInPeriod - Number of matches in time window
   * @param daysInPeriod - Length of period in days
   * @param competitionsActive - Number of active competitions
   * @returns CLF value with interpretation
   * 
   * Interpretation:
   * - CLF > 2.5: Severe congestion
   * - CLF 2.0-2.5: Heavy load
   * - CLF 1.5-2.0: Moderate load
   * - CLF < 1.5: Normal schedule
   */
  calculateCompetitionLoadFactor(
    matchesInPeriod: number,
    daysInPeriod: number,
    competitionsActive: number
  ): { value: number; interpretation: string } {
    const matchDensity = matchesInPeriod / (daysInPeriod / 7);
    const clf = matchDensity * (1 + (competitionsActive - 1) * 0.2);

    let interpretation: string;
    if (clf > 2.5) interpretation = 'Severe congestion';
    else if (clf >= 2.0) interpretation = 'Heavy load';
    else if (clf >= 1.5) interpretation = 'Moderate load';
    else interpretation = 'Normal schedule';

    return { value: parseFloat(clf.toFixed(2)), interpretation };
  }

  /**
   * A4. Squad Vulnerability Index (SVI)
   * Assesses injury risk and squad depth concerns
   * 
   * @param injuredFirstXI - Number of first XI players injured
   * @param totalFirstXI - Total first XI size (typically 11-14)
   * @param recentInjuryRate - Injuries in last 30 days
   * @param depthQuality - Squad depth rating 0-1
   * @returns SVI value with interpretation
   * 
   * Interpretation:
   * - SVI > 0.60: Critical vulnerability
   * - SVI 0.40-0.60: Elevated risk
   * - SVI 0.20-0.40: Moderate concern
   * - SVI < 0.20: Robust squad
   */
  calculateSquadVulnerabilityIndex(
    injuredFirstXI: number,
    totalFirstXI: number,
    recentInjuryRate: number,
    depthQuality: number
  ): { value: number; interpretation: string } {
    const injuryRatio = injuredFirstXI / totalFirstXI;
    const injuryTrendFactor = 1 + (recentInjuryRate * 0.1);
    const depthFactor = 1 - depthQuality;

    const svi = injuryRatio * injuryTrendFactor * depthFactor;

    let interpretation: string;
    if (svi > 0.60) interpretation = 'Critical vulnerability';
    else if (svi >= 0.40) interpretation = 'Elevated risk';
    else if (svi >= 0.20) interpretation = 'Moderate concern';
    else interpretation = 'Robust squad';

    return { value: parseFloat(svi.toFixed(3)), interpretation };
  }

  /**
   * SECTION B: TEAM PERFORMANCE METRICS
   */

  /**
   * B1. Form Index
   * Weighted recent performance metric
   * 
   * @param formString - Last 5 results as string (e.g., "WWDWL")
   * @returns Form Index and interpretation
   * 
   * Interpretation:
   * - FI 2.5-3.0: Excellent form
   * - FI 2.0-2.5: Good form
   * - FI 1.5-2.0: Average form
   * - FI < 1.5: Poor form
   */
  calculateFormIndex(formString: string): { value: number; interpretation: string } {
    const weights = [1.5, 1.3, 1.1, 0.9, 0.7];
    let totalWeightedPoints = 0;
    let totalWeight = 0;

    const results = formString.split('').slice(0, 5);
    
    results.forEach((result, index) => {
      const points = result === 'W' ? 3 : result === 'D' ? 1 : 0;
      totalWeightedPoints += points * weights[index];
      totalWeight += weights[index];
    });

    const fi = totalWeightedPoints / totalWeight;

    let interpretation: string;
    if (fi >= 2.5) interpretation = 'Excellent form';
    else if (fi >= 2.0) interpretation = 'Good form';
    else if (fi >= 1.5) interpretation = 'Average form';
    else interpretation = 'Poor form';

    return { value: parseFloat(fi.toFixed(2)), interpretation };
  }

  /**
   * B2. Expected Points (xPTS)
   * Calculate expected points from xG data
   * 
   * @param xGFor - Team's expected goals
   * @param xGAgainst - Opponent's expected goals
   * @returns Expected points value
   */
  calculateExpectedPoints(xGFor: number, xGAgainst: number): { value: number; interpretation: string } {
    const xGDiff = xGFor - xGAgainst;
    
    let pWin: number, pDraw: number;
    
    if (xGDiff > 1.0) {
      pWin = 0.7;
      pDraw = 0.2;
    } else if (xGDiff > 0.5) {
      pWin = 0.55;
      pDraw = 0.3;
    } else if (xGDiff > 0) {
      pWin = 0.45;
      pDraw = 0.35;
    } else if (xGDiff > -0.5) {
      pWin = 0.35;
      pDraw = 0.35;
    } else if (xGDiff > -1.0) {
      pWin = 0.25;
      pDraw = 0.3;
    } else {
      pWin = 0.15;
      pDraw = 0.25;
    }

    const xPTS = (pWin * 3) + (pDraw * 1);

    let interpretation: string;
    if (xPTS >= 2.5) interpretation = 'Dominant performance expected';
    else if (xPTS >= 2.0) interpretation = 'Likely winner';
    else if (xPTS >= 1.5) interpretation = 'Competitive match';
    else if (xPTS >= 1.0) interpretation = 'Slight underdog';
    else interpretation = 'Significant underdog';

    return { value: parseFloat(xPTS.toFixed(2)), interpretation };
  }

  /**
   * B3. Goal Efficiency
   * Measure finishing quality vs chances created
   * 
   * @param stats - Team statistics including goals, shots, xG
   * @returns Goal efficiency metrics
   * 
   * Interpretation:
   * - GE > 0.30: Elite finishing
   * - GE 0.25-0.30: Strong finishing
   * - GE 0.20-0.25: Average finishing
   * - GE < 0.20: Poor finishing
   */
  calculateGoalEfficiency(stats: TeamStats): {
    goalEfficiency: number;
    chanceConversion: number;
    bigChanceConversion: number;
    interpretation: string;
  } {
    const shotsOnTarget = stats.shotsOnTarget || 1;
    const xG = stats.xG || 1;
    const totalShots = stats.totalShots || 1;
    const bigChances = stats.bigChances || 0;
    const bigChancesScored = stats.bigChancesScored || 0;

    const shotAccuracy = stats.goalsFor / shotsOnTarget;
    const xGConversion = stats.goalsFor / xG;
    const ge = shotAccuracy * xGConversion;

    const chanceConversion = (stats.goalsFor / totalShots) * 100;
    const bigChanceConversion = bigChances > 0 
      ? (bigChancesScored / bigChances) * 100 
      : 0;

    let interpretation: string;
    if (ge > 0.30) interpretation = 'Elite finishing';
    else if (ge >= 0.25) interpretation = 'Strong finishing';
    else if (ge >= 0.20) interpretation = 'Average finishing';
    else interpretation = 'Poor finishing';

    return {
      goalEfficiency: parseFloat(ge.toFixed(3)),
      chanceConversion: parseFloat(chanceConversion.toFixed(1)),
      bigChanceConversion: parseFloat(bigChanceConversion.toFixed(1)),
      interpretation
    };
  }

  /**
   * B4. Defensive Solidity Index
   * Measure defensive quality and chance prevention
   * 
   * @param stats - Team defensive statistics
   * @param leagueAvgXGA - League average xGA per match
   * @returns DSI value and interpretation
   * 
   * Interpretation:
   * - DSI > 1.5: Elite defense
   * - DSI 1.2-1.5: Strong defense
   * - DSI 0.9-1.2: Average defense
   * - DSI < 0.9: Vulnerable defense
   */
  calculateDefensiveSolidityIndex(
    stats: TeamStats,
    leagueAvgXGA: number = this.leagueAvgXGA
  ): { value: number; interpretation: string } {
    const shotsOnTargetAgainst = stats.shotsOnTargetAgainst || 1;
    const shotStopRate = 1 - (stats.goalsAgainst / shotsOnTargetAgainst);
    const cleanSheetMultiplier = 1 + (stats.cleanSheets / stats.matchesPlayed);
    
    const teamPPDA = stats.ppda || this.leagueAvgPPDA;
    const pressingFactor = this.leagueAvgPPDA / teamPPDA;

    const baseDSI = shotStopRate * cleanSheetMultiplier * pressingFactor;

    const xGAPerMatch = (stats.xGA || stats.goalsAgainst) / stats.matchesPlayed;
    const xGAFactor = 1 - (xGAPerMatch / leagueAvgXGA);
    
    const dsi = baseDSI * (1 + xGAFactor);

    let interpretation: string;
    if (dsi > 1.5) interpretation = 'Elite defense';
    else if (dsi >= 1.2) interpretation = 'Strong defense';
    else if (dsi >= 0.9) interpretation = 'Average defense';
    else interpretation = 'Vulnerable defense';

    return { value: parseFloat(dsi.toFixed(3)), interpretation };
  }

  /**
   * B5. Home/Away Performance Differential
   * Identify venue-specific strengths or weaknesses
   * 
   * @param homeAwayStats - Home and away statistics
   * @param leagueAvgHAPD - League average home/away differential
   * @returns HAPD value and interpretation
   * 
   * Interpretation:
   * - HAPD > 1.5: Strong home advantage
   * - HAPD 0.8-1.5: Normal home advantage
   * - HAPD 0.3-0.8: Weak home advantage
   * - HAPD < 0.3: No home advantage
   */
  calculateHomeAwayDifferential(
    homeAwayStats: HomeAwayStats,
    leagueAvgHAPD: number = this.leagueAvgHAPD
  ): { 
    hapd: number; 
    homeGDAdvantage: number; 
    interpretation: string 
  } {
    const homePPG = homeAwayStats.homePoints / homeAwayStats.homeMatches;
    const awayPPG = homeAwayStats.awayPoints / homeAwayStats.awayMatches;
    
    const hapd = (homePPG - awayPPG) / leagueAvgHAPD;

    const homeGDPerMatch = homeAwayStats.homeGoalDifference / homeAwayStats.homeMatches;
    const awayGDPerMatch = homeAwayStats.awayGoalDifference / homeAwayStats.awayMatches;
    const homeGDAdvantage = homeGDPerMatch - awayGDPerMatch;

    let interpretation: string;
    if (hapd > 1.5) interpretation = 'Strong home advantage (using it well)';
    else if (hapd >= 0.8) interpretation = 'Normal home advantage';
    else if (hapd >= 0.3) interpretation = 'Weak home advantage';
    else interpretation = 'No home advantage (concern)';

    return {
      hapd: parseFloat(hapd.toFixed(2)),
      homeGDAdvantage: parseFloat(homeGDAdvantage.toFixed(2)),
      interpretation
    };
  }

  /**
   * B6. Pressure Index
   * Measure attacking dominance and territorial control
   * 
   * @param shotsPerMatch - Average shots per match
   * @param possessionPct - Average possession percentage
   * @param cornersPerMatch - Average corners per match
   * @param finalThirdPassPct - Percentage of passes in final third
   * @returns Pressure Index and interpretation
   * 
   * Interpretation:
   * - PI > 35: Dominant attacking pressure
   * - PI 28-35: Strong attacking presence
   * - PI 22-28: Moderate pressure
   * - PI < 22: Limited attacking threat
   */
  calculatePressureIndex(
    shotsPerMatch: number,
    possessionPct: number,
    cornersPerMatch: number,
    finalThirdPassPct: number = 0
  ): { value: number; advanced: number; interpretation: string } {
    const pi = (shotsPerMatch * 0.4) + (possessionPct * 0.3) + (cornersPerMatch * 0.3);
    const piAdvanced = pi * (1 + finalThirdPassPct);

    let interpretation: string;
    const value = finalThirdPassPct > 0 ? piAdvanced : pi;
    if (value > 35) interpretation = 'Dominant attacking pressure';
    else if (value >= 28) interpretation = 'Strong attacking presence';
    else if (value >= 22) interpretation = 'Moderate pressure';
    else interpretation = 'Limited attacking threat';

    return {
      value: parseFloat(pi.toFixed(2)),
      advanced: parseFloat(piAdvanced.toFixed(2)),
      interpretation
    };
  }

  /**
   * SECTION C: MATCH PREDICTION METRICS
   */

  /**
   * C1. Head-to-Head Advantage Index
   * Quantify historical dominance in specific fixtures
   * 
   * @param h2hRecord - Historical head-to-head record
   * @param isHome - Whether match is at home
   * @returns H2H index and interpretation
   * 
   * Interpretation:
   * - H2H > 0.5: Strong historical advantage
   * - H2H 0.2-0.5: Moderate advantage
   * - H2H -0.2 to 0.2: Even fixture
   * - H2H < -0.2: Historical disadvantage
   */
  calculateHeadToHeadIndex(
    h2hRecord: HeadToHeadRecord,
    isHome: boolean
  ): { value: number; interpretation: string } {
    const recencyWeights = [1.5, 1.5, 1.5, 1.0, 1.0, 1.0, 0.7, 0.7, 0.7, 0.7];
    
    let weightedWins = 0;
    let weightedLosses = 0;

    h2hRecord.recentResults.slice(0, 10).forEach((result, index) => {
      if (result === 'W') {
        weightedWins += recencyWeights[index];
      } else if (result === 'L') {
        weightedLosses += recencyWeights[index];
      }
    });

    const h2hBase = (weightedWins - weightedLosses) / Math.min(h2hRecord.totalMatches, 10);
    const venueFactor = isHome ? 1.2 : 0.9;
    const h2h = h2hBase * venueFactor;

    let interpretation: string;
    if (h2h > 0.5) interpretation = 'Strong historical advantage';
    else if (h2h >= 0.2) interpretation = 'Moderate advantage';
    else if (h2h >= -0.2) interpretation = 'Even fixture';
    else interpretation = 'Historical disadvantage';

    return { value: parseFloat(h2h.toFixed(3)), interpretation };
  }

  /**
   * C2. Momentum Score
   * Combine recent form with league position pressure
   * 
   * @param formIndex - Current form index (0-100 scale)
   * @param pointsBehindLeader - Points behind first place
   * @param position - Current league position
   * @param pointsBehind4th - Points behind 4th place
   * @param pointsAbove18th - Points above relegation zone
   * @param goalsLast3 - Goals scored in last 3 matches
   * @param goalsConcededLast3 - Goals conceded in last 3 matches
   * @returns Momentum Score and interpretation
   * 
   * Interpretation:
   * - MS > 80: Peak momentum, hard to stop
   * - MS 65-80: Strong momentum
   * - MS 50-65: Moderate momentum
   * - MS 35-50: Wavering momentum
   * - MS < 35: Negative momentum, crisis
   */
  calculateMomentumScore(
    formIndex: number,
    pointsBehindLeader: number,
    position: number,
    pointsBehind4th: number,
    pointsAbove18th: number,
    goalsLast3: number,
    goalsConcededLast3: number
  ): { value: number; interpretation: string } {
    let positionPressure: number;

    if (pointsBehindLeader <= 6) {
      positionPressure = 100 - (pointsBehindLeader * 5);
    } else if (position >= 5 && position <= 8) {
      positionPressure = 70 - (pointsBehind4th * 3);
    } else if (position >= 9 && position <= 14) {
      positionPressure = 50;
    } else {
      positionPressure = 30 + (pointsAbove18th * 2);
    }

    const goalMomentum = Math.max(-30, Math.min(30, (goalsLast3 - goalsConcededLast3) * 5));

    const ms = (formIndex * 0.5) + (positionPressure * 0.3) + (goalMomentum * 0.2);

    let interpretation: string;
    if (ms > 80) interpretation = 'Peak momentum, hard to stop';
    else if (ms >= 65) interpretation = 'Strong momentum';
    else if (ms >= 50) interpretation = 'Moderate momentum';
    else if (ms >= 35) interpretation = 'Wavering momentum';
    else interpretation = 'Negative momentum, crisis';

    return { value: parseFloat(ms.toFixed(2)), interpretation };
  }

  /**
   * C3. Match Outcome Probability
   * Predict match result using multiple factors
   * 
   * @param h2hAdvantage - Head-to-head advantage index
   * @param momentumDiff - Difference in momentum scores
   * @param isHome - Whether team is at home
   * @param squadAvailability - First XI availability (0-1)
   * @param tacticalAdvantage - Tactical matchup rating (-1 to +1)
   * @returns Win/Draw/Loss probabilities
   */
  calculateMatchOutcomeProbability(
    h2hAdvantage: number,
    momentumDiff: number,
    isHome: boolean,
    squadAvailability: number,
    tacticalAdvantage: number
  ): { 
    win: number; 
    draw: number; 
    loss: number;
    interpretation: string;
  } {
    const beta0 = 0.2;
    const beta1 = 1.5;
    const beta2 = 0.02;
    const beta3 = 0.5;
    const beta4 = 0.8;
    const beta5 = 0.6;

    const venue = isHome ? 0.5 : -0.5;

    const z = beta0 + 
              (beta1 * h2hAdvantage) + 
              (beta2 * momentumDiff) + 
              (beta3 * venue) + 
              (beta4 * squadAvailability) + 
              (beta5 * tacticalAdvantage);

    const rawProbWin = 1 / (1 + Math.exp(-z));

    const pWin = Math.max(0.05, Math.min(0.90, rawProbWin * 0.7));
    const pDraw = 0.15 + (1 - pWin) * 0.3;
    const pLoss = 1 - pWin - pDraw;

    let interpretation: string;
    if (pWin > 0.65) interpretation = 'Strong favorite';
    else if (pWin >= 0.50) interpretation = 'Slight favorite';
    else if (pWin >= 0.35) interpretation = 'Competitive match';
    else interpretation = 'Underdog';

    return {
      win: parseFloat((pWin * 100).toFixed(1)),
      draw: parseFloat((pDraw * 100).toFixed(1)),
      loss: parseFloat((pLoss * 100).toFixed(1)),
      interpretation
    };
  }

  /**
   * SECTION D: PLAYER ANALYSIS METRICS
   */

  /**
   * D1. Goals Per 90
   * Normalized goal scoring rate
   * 
   * @param playerStats - Player statistics
   * @returns Goals per 90 and interpretation based on position
   * 
   * Position-adjusted benchmarks:
   * - Striker: Elite >0.65, Good 0.45-0.65, Average 0.30-0.45
   * - Winger: Elite >0.45, Good 0.30-0.45, Average 0.15-0.30
   * - Midfielder: Elite >0.25, Good 0.15-0.25, Average 0.08-0.15
   * - Defender: Elite >0.10, Good 0.05-0.10, Average 0.02-0.05
   */
  calculateGoalsPer90(playerStats: PlayerStats): { 
    value: number; 
    interpretation: string 
  } {
    const minutes90 = playerStats.minutesPlayed / 90;
    const g90 = minutes90 > 0 ? playerStats.goals / minutes90 : 0;

    let interpretation: string;
    const pos = playerStats.position;

    if (pos === 'ST') {
      if (g90 > 0.65) interpretation = 'Elite striker';
      else if (g90 >= 0.45) interpretation = 'Good striker';
      else if (g90 >= 0.30) interpretation = 'Average striker';
      else interpretation = 'Below average striker';
    } else if (pos === 'WG') {
      if (g90 > 0.45) interpretation = 'Elite winger';
      else if (g90 >= 0.30) interpretation = 'Good winger';
      else if (g90 >= 0.15) interpretation = 'Average winger';
      else interpretation = 'Below average winger';
    } else if (pos === 'CM' || pos === 'AM') {
      if (g90 > 0.25) interpretation = 'Elite midfielder';
      else if (g90 >= 0.15) interpretation = 'Good midfielder';
      else if (g90 >= 0.08) interpretation = 'Average midfielder';
      else interpretation = 'Below average midfielder';
    } else {
      if (g90 > 0.10) interpretation = 'Elite defender';
      else if (g90 >= 0.05) interpretation = 'Good defender';
      else if (g90 >= 0.02) interpretation = 'Average defender';
      else interpretation = 'Defensive minded';
    }

    return { value: parseFloat(g90.toFixed(3)), interpretation };
  }

  /**
   * D2. Assist Rate & Creativity Index
   * Measure creative contribution
   * 
   * @param playerStats - Player statistics
   * @returns Assist rate and creativity metrics
   * 
   * Interpretation:
   * - CI > 4.0: Elite creator
   * - CI 3.0-4.0: Strong creator
   * - CI 2.0-3.0: Average creator
   * - CI < 2.0: Limited creativity
   */
  calculateCreativityIndex(playerStats: PlayerStats): {
    assistRate: number;
    creativityIndex: number;
    interpretation: string;
  } {
    const ar = playerStats.assists / playerStats.matchesPlayed;
    
    const keyPasses = playerStats.keyPasses || 0;
    const sca = playerStats.shotCreatingActions || 0;
    
    const ci = (playerStats.assists * 3) + (keyPasses * 1) + (sca * 0.5);
    const minutes90 = playerStats.minutesPlayed / 90;
    const ciPer90 = minutes90 > 0 ? ci / minutes90 : 0;

    let interpretation: string;
    if (ciPer90 > 4.0) interpretation = 'Elite creator';
    else if (ciPer90 >= 3.0) interpretation = 'Strong creator';
    else if (ciPer90 >= 2.0) interpretation = 'Average creator';
    else interpretation = 'Limited creativity';

    return {
      assistRate: parseFloat(ar.toFixed(3)),
      creativityIndex: parseFloat(ciPer90.toFixed(2)),
      interpretation
    };
  }

  /**
   * D3. Involvement Score
   * Measure total offensive contribution
   * 
   * @param playerStats - Player statistics
   * @param teamTotalGoals - Team's total goals
   * @returns Involvement score and interpretation
   * 
   * Interpretation:
   * - IS > 50%: Offensive focal point, irreplaceable
   * - IS 35-50%: Key contributor
   * - IS 20-35%: Regular contributor
   * - IS < 20%: Squad player role
   */
  calculateInvolvementScore(
    playerStats: PlayerStats,
    teamTotalGoals: number
  ): { basic: number; advanced: number; interpretation: string } {
    const basicIS = ((playerStats.goals + playerStats.assists) / teamTotalGoals) * 100;

    const penaltiesWon = playerStats.penaltiesWon || 0;
    const keyPasses = playerStats.keyPasses || 0;
    
    const advancedContribution = 
      (playerStats.goals + playerStats.assists) + 
      (penaltiesWon * 0.5) + 
      (keyPasses * 0.1);
    
    const advancedIS = (advancedContribution / teamTotalGoals) * 100;

    let interpretation: string;
    const value = advancedIS > 0 ? advancedIS : basicIS;
    if (value > 50) interpretation = 'Offensive focal point, irreplaceable';
    else if (value >= 35) interpretation = 'Key contributor';
    else if (value >= 20) interpretation = 'Regular contributor';
    else interpretation = 'Squad player role';

    return {
      basic: parseFloat(basicIS.toFixed(1)),
      advanced: parseFloat(advancedIS.toFixed(1)),
      interpretation
    };
  }

  /**
   * D4. Impact Rating
   * Weight contributions by importance
   * 
   * @param playerStats - Player statistics
   * @returns Impact rating and interpretation
   * 
   * Position-specific benchmarks (per 90):
   * - Attackers: IR > 5.0 (World class), 4.0-5.0 (Elite)
   * - Midfielders: IR > 4.5 (World class), 3.5-4.5 (Elite)
   * - Defenders: IR > 4.5 (World class), 3.5-4.5 (Elite)
   */
  calculateImpactRating(playerStats: PlayerStats): {
    total: number;
    per90: number;
    interpretation: string;
  } {
    const pos = playerStats.position;
    let ir = 0;

    if (pos === 'ST' || pos === 'WG') {
      ir = (playerStats.goals * 3) + 
           (playerStats.assists * 2) + 
           ((playerStats.keyPasses || 0) * 0.5);
    } else if (pos === 'CM' || pos === 'AM') {
      ir = (playerStats.goals * 3) + 
           (playerStats.assists * 2.5) + 
           ((playerStats.tackles || 0) * 0.4);
    } else {
      const clearances = playerStats.clearances || 0;
      const tackles = playerStats.tackles || 0;
      const interceptions = playerStats.interceptions || 0;
      
      ir = (playerStats.goals * 4) + 
           (clearances * 0.3) + 
           (tackles * 0.5) + 
           (interceptions * 0.4);
    }

    const minutes90 = playerStats.minutesPlayed / 90;
    const irPer90 = minutes90 > 0 ? ir / minutes90 : 0;

    let interpretation: string;
    if (pos === 'ST' || pos === 'WG') {
      if (irPer90 > 5.0) interpretation = 'World class attacker';
      else if (irPer90 >= 4.0) interpretation = 'Elite attacker';
      else if (irPer90 >= 3.0) interpretation = 'Good attacker';
      else interpretation = 'Average attacker';
    } else if (pos === 'CM' || pos === 'AM') {
      if (irPer90 > 4.5) interpretation = 'World class midfielder';
      else if (irPer90 >= 3.5) interpretation = 'Elite midfielder';
      else if (irPer90 >= 2.5) interpretation = 'Good midfielder';
      else interpretation = 'Average midfielder';
    } else {
      if (irPer90 > 4.5) interpretation = 'World class defender';
      else if (irPer90 >= 3.5) interpretation = 'Elite defender';
      else if (irPer90 >= 2.5) interpretation = 'Good defender';
      else interpretation = 'Average defender';
    }

    return {
      total: parseFloat(ir.toFixed(2)),
      per90: parseFloat(irPer90.toFixed(2)),
      interpretation
    };
  }

  /**
   * SECTION E: SEASON PROGRESSION METRICS
   */

  /**
   * E1. PPG Trajectory
   * Project final points total
   * 
   * @param currentPoints - Current points total
   * @param matchesPlayed - Matches played
   * @param recent5Points - Points from last 5 matches
   * @returns PPG metrics and projection
   */
  calculatePPGTrajectory(
    currentPoints: number,
    matchesPlayed: number,
    recent5Points: number
  ): {
    currentPPG: number;
    recentPPG: number;
    simpleProjection: number;
    formAdjustedProjection: number;
    interpretation: string;
  } {
    const currentPPG = currentPoints / matchesPlayed;
    const recentPPG = recent5Points / 5;
    
    const simpleProjection = currentPPG * 38;
    
    const weightedPPG = (recentPPG * 0.6) + (currentPPG * 0.4);
    const formAdjustedProjection = weightedPPG * 38;

    let interpretation: string;
    if (formAdjustedProjection >= 90) interpretation = 'Title-winning pace';
    else if (formAdjustedProjection >= 75) interpretation = 'Top 4 pace';
    else if (formAdjustedProjection >= 60) interpretation = 'European qualification pace';
    else if (formAdjustedProjection >= 45) interpretation = 'Mid-table pace';
    else interpretation = 'Relegation battle';

    return {
      currentPPG: parseFloat(currentPPG.toFixed(2)),
      recentPPG: parseFloat(recentPPG.toFixed(2)),
      simpleProjection: parseFloat(simpleProjection.toFixed(1)),
      formAdjustedProjection: parseFloat(formAdjustedProjection.toFixed(1)),
      interpretation
    };
  }

  /**
   * E2. Goal Difference Trend
   * Analyze GD performance vs expectations
   * 
   * @param currentGD - Current goal difference
   * @param matchesPlayed - Matches played
   * @param historicalAvgGDPerMatch - Historical average (e.g., 1.5 for title challengers)
   * @returns GD analysis
   */
  calculateGoalDifferenceTrend(
    currentGD: number,
    matchesPlayed: number,
    historicalAvgGDPerMatch: number = 1.5
  ): {
    currentGDPerMatch: number;
    expectedGD: number;
    variance: number;
    interpretation: string;
  } {
    const currentGDPerMatch = currentGD / matchesPlayed;
    const expectedGD = historicalAvgGDPerMatch * matchesPlayed;
    const variance = ((currentGD - expectedGD) / expectedGD) * 100;

    let interpretation: string;
    if (variance > 20) interpretation = 'Significantly outperforming expectations';
    else if (variance > 5) interpretation = 'Above expectations';
    else if (variance >= -5) interpretation = 'Meeting expectations';
    else if (variance >= -20) interpretation = 'Below expectations';
    else interpretation = 'Significantly underperforming';

    return {
      currentGDPerMatch: parseFloat(currentGDPerMatch.toFixed(2)),
      expectedGD: parseFloat(expectedGD.toFixed(1)),
      variance: parseFloat(variance.toFixed(1)),
      interpretation
    };
  }

  /**
   * E3. Top 4 Probability
   * Model probability of finishing in top 4
   * 
   * @param currentPoints - Current points
   * @param ppg - Points per game
   * @param remainingDifficultPct - Percentage of difficult remaining fixtures
   * @param gapAbove5th - Points gap to 5th place
   * @returns Top 4 probability
   */
  calculateTop4Probability(
    currentPoints: number,
    ppg: number,
    remainingDifficultPct: number,
    gapAbove5th: number
  ): { probability: number; interpretation: string } {
    const beta0 = -15;
    const beta1 = 0.3;
    const beta2 = 8;
    const beta3 = -5;
    const beta4 = 2;

    const z = beta0 + 
              (beta1 * currentPoints) + 
              (beta2 * ppg) + 
              (beta3 * remainingDifficultPct) + 
              (beta4 * gapAbove5th);

    const probability = (1 / (1 + Math.exp(-z))) * 100;

    let interpretation: string;
    if (probability > 95) interpretation = 'Virtually certain';
    else if (probability >= 80) interpretation = 'Highly likely';
    else if (probability >= 60) interpretation = 'Probable';
    else if (probability >= 40) interpretation = 'Possible';
    else if (probability >= 20) interpretation = 'Unlikely';
    else interpretation = 'Very unlikely';

    return {
      probability: parseFloat(probability.toFixed(1)),
      interpretation
    };
  }

  /**
   * E4. Title Race Index
   * Quantify realistic title chances
   * 
   * @param matchesPlayed - Matches played
   * @param currentPoints - Current points
   * @param pointsGapToLeader - Gap to first place
   * @param recent5PPG - Recent form (PPG from last 5)
   * @param h2hFactor - Head-to-head factor (0.8-1.2)
   * @returns Title race index
   * 
   * Interpretation:
   * - TRI > 0.90: Strong title contention
   * - TRI 0.75-0.90: Realistic chance
   * - TRI 0.50-0.75: Outside chance
   * - TRI < 0.50: Unlikely
   */
  calculateTitleRaceIndex(
    matchesPlayed: number,
    currentPoints: number,
    pointsGapToLeader: number,
    recent5PPG: number,
    h2hFactor: number = 1.0
  ): { value: number; interpretation: string } {
    const remainingMatches = 38 - matchesPlayed;
    const remainingPossible = remainingMatches * 3;
    
    const gapComponent = 1 - (pointsGapToLeader / remainingPossible);
    const formMultiplier = recent5PPG / 3.0;
    
    const tri = gapComponent * formMultiplier * h2hFactor;

    let interpretation: string;
    if (tri > 0.90) interpretation = 'Strong title contention';
    else if (tri >= 0.75) interpretation = 'Realistic chance';
    else if (tri >= 0.50) interpretation = 'Outside chance';
    else interpretation = 'Unlikely';

    return { value: parseFloat(tri.toFixed(3)), interpretation };
  }

  /**
   * SECTION F: TACTICAL ANALYSIS METRICS
   */

  /**
   * F1. Pressing Success Rate
   * Measure pressing effectiveness
   * 
   * @param pressingStats - Pressing statistics
   * @returns PSR and CPE metrics
   * 
   * Interpretation:
   * - PSR > 20%: Elite pressing
   * - PSR 15-20%: Strong pressing
   * - PSR 10-15%: Average pressing
   * - PSR < 10%: Weak pressing
   */
  calculatePressingSuccessRate(pressingStats: PressingStats): {
    psr: number;
    cpe: number;
    interpretation: string;
  } {
    const totalDefensiveActions = 
      pressingStats.tackles + 
      pressingStats.interceptions + 
      pressingStats.pressures;

    const psr = (pressingStats.highTurnovers / totalDefensiveActions) * 100;
    
    const cpe = (pressingStats.regainedWithin5Sec / pressingStats.ballLosses) * 100;

    let interpretation: string;
    if (psr > 20) interpretation = 'Elite pressing';
    else if (psr >= 15) interpretation = 'Strong pressing';
    else if (psr >= 10) interpretation = 'Average pressing';
    else interpretation = 'Weak pressing';

    return {
      psr: parseFloat(psr.toFixed(1)),
      cpe: parseFloat(cpe.toFixed(1)),
      interpretation
    };
  }

  /**
   * F2. Possession Efficiency
   * Measure quality of possession
   * 
   * @param possessionPct - Possession percentage
   * @param shotsFromPossession - Shots created from possession
   * @param xGFromPossession - xG from possession play
   * @param totalPasses - Total passes made
   * @param finalThirdPasses - Passes in final third
   * @param finalThirdEntries - Entries to final third
   * @returns Possession efficiency metrics
   * 
   * Interpretation:
   * - PE > 20: Highly efficient possession
   * - PE 15-20: Good efficiency
   * - PE 10-15: Average
   * - PE < 10: Inefficient possession
   */
  calculatePossessionEfficiency(
    possessionPct: number,
    shotsFromPossession: number,
    xGFromPossession: number,
    totalPasses: number,
    finalThirdPasses: number,
    finalThirdEntries: number,
    totalShots: number
  ): {
    basic: number;
    advanced: number;
    buildUpRate: number;
    conversionRate: number;
    interpretation: string;
  } {
    const peBasic = (shotsFromPossession / possessionPct) * 100;
    const peAdvanced = (xGFromPossession / possessionPct) * 100;
    
    const buildUpRate = (finalThirdPasses / totalPasses) * 100;
    const conversionRate = (totalShots / finalThirdEntries) * 100;

    let interpretation: string;
    if (peBasic > 20) interpretation = 'Highly efficient possession';
    else if (peBasic >= 15) interpretation = 'Good efficiency';
    else if (peBasic >= 10) interpretation = 'Average';
    else interpretation = 'Inefficient possession';

    return {
      basic: parseFloat(peBasic.toFixed(1)),
      advanced: parseFloat(peAdvanced.toFixed(2)),
      buildUpRate: parseFloat(buildUpRate.toFixed(1)),
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      interpretation
    };
  }

  /**
   * F3. Set Piece Threat Index
   * Measure set piece effectiveness
   * 
   * @param setPieceStats - Set piece statistics
   * @returns SPTI and defensive solidity
   * 
   * Interpretation:
   * - SPTI > 6%: Elite set piece attack
   * - SPTI 4-6%: Strong threat
   * - SPTI 2-4%: Average
   * - SPTI < 2%: Weak set piece threat
   */
  calculateSetPieceThreatIndex(setPieceStats: SetPieceStats): {
    spti: number;
    defensiveSolidity: number;
    interpretation: string;
  } {
    const totalSetPieces = setPieceStats.totalCorners + setPieceStats.freekicksInRange;
    const conversionRate = (setPieceStats.goalsFromSetPieces / totalSetPieces) * 100;
    
    const varietyMultiplier = Math.min(setPieceStats.uniqueRoutines / 10, 1.5);
    const spti = conversionRate * varietyMultiplier;

    const defensiveSolidity = 
      (1 - (setPieceStats.goalsConcededFromSetPieces / setPieceStats.opponentSetPieces)) * 100;

    let interpretation: string;
    if (spti > 6) interpretation = 'Elite set piece attack';
    else if (spti >= 4) interpretation = 'Strong threat';
    else if (spti >= 2) interpretation = 'Average';
    else interpretation = 'Weak set piece threat';

    return {
      spti: parseFloat(spti.toFixed(2)),
      defensiveSolidity: parseFloat(defensiveSolidity.toFixed(1)),
      interpretation
    };
  }

  /**
   * F4. Counter-Attack Effectiveness
   * Measure counter-attacking quality
   * 
   * @param counterStats - Counter-attack statistics
   * @returns CAE and related metrics
   * 
   * Interpretation:
   * - CAE > 45%: Elite counter-attacking
   * - CAE 35-45%: Strong transitions
   * - CAE 25-35%: Average
   * - CAE < 25%: Weak counter-attack
   */
  calculateCounterAttackEffectiveness(counterStats: CounterAttackStats): {
    cae: number;
    transitionCompletion: number;
    counterXGPerAttempt: number;
    interpretation: string;
  } {
    const conversionRate = counterStats.fastBreakGoals / counterStats.fastBreakAttempts;
    const speedFactor = 10 / counterStats.avgTransitionSpeed;
    
    const cae = conversionRate * speedFactor * 100;

    const transitionCompletion = 
      (counterStats.successfulCounters / counterStats.counterOpportunities) * 100;
    
    const counterXGPerAttempt = counterStats.counterXG / counterStats.fastBreakAttempts;

    let interpretation: string;
    if (cae > 45) interpretation = 'Elite counter-attacking';
    else if (cae >= 35) interpretation = 'Strong transitions';
    else if (cae >= 25) interpretation = 'Average';
    else interpretation = 'Weak counter-attack';

    return {
      cae: parseFloat(cae.toFixed(1)),
      transitionCompletion: parseFloat(transitionCompletion.toFixed(1)),
      counterXGPerAttempt: parseFloat(counterXGPerAttempt.toFixed(3)),
      interpretation
    };
  }

  /**
   * SECTION G: COMPARATIVE METRICS
   */

  /**
   * G1. League Average Comparison Index
   * Compare team stats to league averages
   * 
   * @param teamStat - Team's statistic value
   * @param leagueAvg - League average value
   * @param inverse - Whether lower is better (e.g., goals against)
   * @returns LACI value
   * 
   * Interpretation:
   * - LACI > 125: Significantly above average (title contender)
   * - LACI 110-125: Above average (top 6)
   * - LACI 90-110: Average (mid-table)
   * - LACI < 90: Below average
   */
  calculateLeagueAverageComparisonIndex(
    teamStat: number,
    leagueAvg: number,
    inverse: boolean = false
  ): { value: number; interpretation: string } {
    let laci: number;
    
    if (inverse) {
      laci = (leagueAvg / teamStat) * 100;
    } else {
      laci = (teamStat / leagueAvg) * 100;
    }

    let interpretation: string;
    if (laci > 125) interpretation = 'Significantly above average (title contender)';
    else if (laci >= 110) interpretation = 'Above average (top 6)';
    else if (laci >= 90) interpretation = 'Average (mid-table)';
    else interpretation = 'Below average';

    return { value: parseFloat(laci.toFixed(0)), interpretation };
  }

  /**
   * G2. Position-Specific Ranking
   * Rank player performance vs position peers
   * 
   * @param playerStatPer90 - Player's per-90 statistic
   * @param positionAvgPer90 - Position average
   * @param playersBelow - Number of players ranked below
   * @param totalPlayers - Total players in position
   * @returns PSR metrics
   */
  calculatePositionSpecificRanking(
    playerStatPer90: number,
    positionAvgPer90: number,
    playersBelow: number,
    totalPlayers: number
  ): {
    psr: number;
    percentile: number;
    interpretation: string;
  } {
    const psr = (playerStatPer90 / positionAvgPer90) * 100;
    const percentile = (playersBelow / totalPlayers) * 100;

    let interpretation: string;
    if (percentile >= 95) interpretation = 'Elite (top 5%)';
    else if (percentile >= 90) interpretation = 'Excellent (top 10%)';
    else if (percentile >= 75) interpretation = 'Above average (top 25%)';
    else if (percentile >= 50) interpretation = 'Average';
    else interpretation = 'Below average';

    return {
      psr: parseFloat(psr.toFixed(0)),
      percentile: parseFloat(percentile.toFixed(1)),
      interpretation
    };
  }

  /**
   * G3. Strength of Schedule Adjustment
   * Adjust stats for opponent quality
   * 
   * @param rawStat - Raw statistic value
   * @param teamAvgOpponentStrength - Team's average opponent strength
   * @param leagueAvgOpponentStrength - League average opponent strength
   * @returns SOS-adjusted statistic
   */
  calculateStrengthOfScheduleAdjustment(
    rawStat: number,
    teamAvgOpponentStrength: number,
    leagueAvgOpponentStrength: number
  ): {
    adjusted: number;
    adjustmentFactor: number;
    interpretation: string;
  } {
    const adjustmentFactor = leagueAvgOpponentStrength / teamAvgOpponentStrength;
    const adjusted = rawStat * adjustmentFactor;

    let interpretation: string;
    if (adjustmentFactor > 1.05) interpretation = 'Easier schedule than average';
    else if (adjustmentFactor >= 0.95) interpretation = 'Average schedule difficulty';
    else interpretation = 'Harder schedule than average';

    return {
      adjusted: parseFloat(adjusted.toFixed(2)),
      adjustmentFactor: parseFloat(adjustmentFactor.toFixed(3)),
      interpretation
    };
  }

  /**
   * SECTION H: RSS/NEWS ANALYSIS METRICS
   */

  /**
   * H1. Sentiment Aggregation Score
   * Aggregate news sentiment with credibility weighting
   * 
   * @param articles - Array of article sentiment data
   * @returns Aggregated sentiment score
   * 
   * Sentiment scale: -1.0 (very negative) to +1.0 (very positive)
   */
  calculateSentimentAggregationScore(articles: ArticleSentiment[]): {
    score: number;
    interpretation: string;
  } {
    if (articles.length === 0) {
      return { score: 0, interpretation: 'No coverage' };
    }

    let totalWeightedSentiment = 0;
    let totalWeight = 0;

    articles.forEach(article => {
      let recencyWeight: number;
      if (article.ageInHours <= 24) recencyWeight = 1.0;
      else if (article.ageInHours <= 48) recencyWeight = 0.85;
      else if (article.ageInHours <= 168) recencyWeight = 0.70;
      else if (article.ageInHours <= 336) recencyWeight = 0.50;
      else recencyWeight = 0.30;

      const weight = article.sourceCredibility * recencyWeight;
      totalWeightedSentiment += article.sentiment * weight;
      totalWeight += weight;
    });

    const sas = totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;

    let interpretation: string;
    if (sas > 0.6) interpretation = 'Very positive coverage';
    else if (sas > 0.3) interpretation = 'Positive coverage';
    else if (sas > -0.3) interpretation = 'Neutral coverage';
    else if (sas > -0.6) interpretation = 'Negative coverage';
    else interpretation = 'Very negative coverage';

    return { score: parseFloat(sas.toFixed(3)), interpretation };
  }

  /**
   * H2. Topic Trending Score
   * Identify trending topics in coverage
   * 
   * @param topicMentionsToday - Mentions in last 24 hours
   * @param topicMentionsYesterday - Mentions 24-48 hours ago
   * @param topicMentionsLastWeek - Average daily mentions last week
   * @returns Trending score
   */
  calculateTopicTrendingScore(
    topicMentionsToday: number,
    topicMentionsYesterday: number,
    topicMentionsLastWeek: number
  ): { score: number; interpretation: string } {
    const dayOverDayGrowth = topicMentionsYesterday > 0
      ? (topicMentionsToday - topicMentionsYesterday) / topicMentionsYesterday
      : 0;

    const weekOverWeekGrowth = topicMentionsLastWeek > 0
      ? (topicMentionsToday - topicMentionsLastWeek) / topicMentionsLastWeek
      : 0;

    const tts = (dayOverDayGrowth * 0.6) + (weekOverWeekGrowth * 0.4);

    let interpretation: string;
    if (tts > 1.0) interpretation = 'Explosive trending';
    else if (tts > 0.5) interpretation = 'Strongly trending';
    else if (tts > 0.2) interpretation = 'Moderately trending';
    else if (tts > -0.2) interpretation = 'Stable coverage';
    else interpretation = 'Declining interest';

    return { score: parseFloat(tts.toFixed(3)), interpretation };
  }

  /**
   * H3. Coverage Intensity Index
   * Measure volume of coverage
   * 
   * @param articlesLast24h - Articles in last 24 hours
   * @param avgDailyArticles - Historical average daily articles
   * @returns Coverage intensity
   */
  calculateCoverageIntensityIndex(
    articlesLast24h: number,
    avgDailyArticles: number
  ): { value: number; interpretation: string } {
    const cii = avgDailyArticles > 0 
      ? (articlesLast24h / avgDailyArticles) * 100 
      : 0;

    let interpretation: string;
    if (cii > 200) interpretation = 'Exceptional coverage spike';
    else if (cii >= 150) interpretation = 'High coverage';
    else if (cii >= 80) interpretation = 'Normal coverage';
    else if (cii >= 50) interpretation = 'Below average coverage';
    else interpretation = 'Minimal coverage';

    return { value: parseFloat(cii.toFixed(0)), interpretation };
  }

  /**
   * H4. Source Diversity Index
   * Measure diversity of news sources
   * 
   * @param totalSources - Total number of sources
   * @param tier1Sources - Number of tier 1 sources
   * @param tier2Sources - Number of tier 2 sources
   * @param tier3Sources - Number of tier 3 sources
   * @returns Diversity index
   */
  calculateSourceDiversityIndex(
    totalSources: number,
    tier1Sources: number,
    tier2Sources: number,
    tier3Sources: number
  ): { value: number; interpretation: string } {
    if (totalSources === 0) {
      return { value: 0, interpretation: 'No sources' };
    }

    const tier1Pct = tier1Sources / totalSources;
    const tier2Pct = tier2Sources / totalSources;
    const tier3Pct = tier3Sources / totalSources;

    const entropy = -1 * (
      (tier1Pct > 0 ? tier1Pct * Math.log(tier1Pct) : 0) +
      (tier2Pct > 0 ? tier2Pct * Math.log(tier2Pct) : 0) +
      (tier3Pct > 0 ? tier3Pct * Math.log(tier3Pct) : 0)
    );

    const maxEntropy = Math.log(3);
    const sdi = (entropy / maxEntropy) * 100;

    let interpretation: string;
    if (sdi > 80) interpretation = 'Excellent source diversity';
    else if (sdi >= 60) interpretation = 'Good diversity';
    else if (sdi >= 40) interpretation = 'Moderate diversity';
    else interpretation = 'Limited diversity';

    return { value: parseFloat(sdi.toFixed(1)), interpretation };
  }

  /**
   * SECTION I: ADVANCED COMBINED METRICS
   */

  /**
   * I1. Comprehensive Match Strength Rating
   * Combine multiple factors for overall match rating
   * 
   * @param formIndex - Team form (0-100)
   * @param squadAvailability - First XI availability (0-100)
   * @param recentGoalDiff - Goal difference last 5 matches
   * @param opponentStrength - Opponent strength rating (0-100)
   * @returns CMSR value
   */
  calculateComprehensiveMatchStrengthRating(
    formIndex: number,
    squadAvailability: number,
    recentGoalDiff: number,
    opponentStrength: number
  ): { value: number; interpretation: string } {
    const formComponent = formIndex * 0.35;
    const squadComponent = squadAvailability * 0.25;
    const momentumComponent = Math.max(0, Math.min(40, recentGoalDiff * 4));
    const opponentAdjustment = (100 - opponentStrength) * 0.15;

    const cmsr = formComponent + squadComponent + momentumComponent + opponentAdjustment;

    let interpretation: string;
    if (cmsr > 80) interpretation = 'Peak strength';
    else if (cmsr >= 65) interpretation = 'Strong position';
    else if (cmsr >= 50) interpretation = 'Solid position';
    else if (cmsr >= 35) interpretation = 'Vulnerable';
    else interpretation = 'Weakened state';

    return { value: parseFloat(cmsr.toFixed(1)), interpretation };
  }

  /**
   * I2. Fixture Difficulty Rating
   * Rate upcoming fixture difficulty
   * 
   * @param fixtures - Array of upcoming fixtures
   * @returns FDR metrics
   */
  calculateFixtureDifficultyRating(fixtures: FixtureInfo[]): {
    rating: number;
    homeAdvantage: number;
    interpretation: string;
  } {
    if (fixtures.length === 0) {
      return { rating: 50, homeAdvantage: 0, interpretation: 'No fixtures' };
    }

    let totalDifficulty = 0;
    let homeMatches = 0;

    fixtures.forEach(fixture => {
      const venueFactor = fixture.isHome ? 0.85 : 1.15;
      const adjustedDifficulty = fixture.opponentStrength * venueFactor;
      totalDifficulty += adjustedDifficulty;
      if (fixture.isHome) homeMatches++;
    });

    const rating = totalDifficulty / fixtures.length;
    const homeAdvantage = (homeMatches / fixtures.length) * 100;

    let interpretation: string;
    if (rating > 75) interpretation = 'Very difficult run';
    else if (rating >= 60) interpretation = 'Challenging fixtures';
    else if (rating >= 45) interpretation = 'Average difficulty';
    else if (rating >= 30) interpretation = 'Favorable fixtures';
    else interpretation = 'Very favorable run';

    return {
      rating: parseFloat(rating.toFixed(1)),
      homeAdvantage: parseFloat(homeAdvantage.toFixed(1)),
      interpretation
    };
  }

  /**
   * I3. Player Value Index
   * Comprehensive player value rating
   * 
   * @param playerStats - Player statistics
   * @param teamTotalGoals - Team total goals
   * @param age - Player age
   * @param contractYearsRemaining - Years left on contract
   * @returns PVI rating
   */
  calculatePlayerValueIndex(
    playerStats: PlayerStats,
    teamTotalGoals: number,
    age: number,
    contractYearsRemaining: number
  ): { value: number; interpretation: string } {
    const g90 = this.calculateGoalsPer90(playerStats).value;
    const involvement = this.calculateInvolvementScore(playerStats, teamTotalGoals).advanced;
    const impact = this.calculateImpactRating(playerStats).per90;

    const performanceScore = (g90 * 20) + (involvement * 0.5) + (impact * 10);

    let ageFactor: number;
    if (age <= 23) ageFactor = 1.2;
    else if (age <= 27) ageFactor = 1.1;
    else if (age <= 30) ageFactor = 1.0;
    else if (age <= 32) ageFactor = 0.9;
    else ageFactor = 0.7;

    const contractFactor = Math.min(1.0, 0.7 + (contractYearsRemaining * 0.1));

    const pvi = performanceScore * ageFactor * contractFactor;

    let interpretation: string;
    if (pvi > 80) interpretation = 'Elite value, cornerstone player';
    else if (pvi >= 60) interpretation = 'High value, key player';
    else if (pvi >= 40) interpretation = 'Good value, regular contributor';
    else if (pvi >= 20) interpretation = 'Moderate value, squad player';
    else interpretation = 'Limited value';

    return { value: parseFloat(pvi.toFixed(1)), interpretation };
  }
}

export const analyticsEngine = new AnalyticsEngine();
