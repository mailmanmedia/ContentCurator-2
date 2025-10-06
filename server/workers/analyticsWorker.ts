/**
 * Analytics Worker for Heavy Calculations
 * Offloads CPU-intensive analytics calculations to prevent blocking
 */

import { parentPort, workerData } from 'worker_threads';

interface WorkerMessage {
  type: 'titleRaceIndex' | 'matchOutcome' | 'h2hAnalysis' | 'seasonProjection';
  data: any;
}

interface TitleRaceIndexInput {
  matchesPlayed: number;
  currentPoints: number;
  pointsFromLeader: number;
  recentPPG: number;
}

interface MatchOutcomeInput {
  h2hAdvantage: number;
  momentumDiff: number;
  isHomeTeam: boolean;
  squadDepth: number;
  injurySeverity: number;
}

interface H2HAnalysisInput {
  matches: Array<{
    date: string;
    result: 'W' | 'D' | 'L';
    goalsFor: number;
    goalsAgainst: number;
    venue: 'home' | 'away';
  }>;
}

interface SeasonProjectionInput {
  currentPoints: number;
  matchesPlayed: number;
  remainingFixtures: Array<{
    opponentStrength: number;
    isHome: boolean;
  }>;
  currentForm: string;
}

function calculateTitleRaceIndex(input: TitleRaceIndexInput) {
  const { matchesPlayed, currentPoints, pointsFromLeader, recentPPG } = input;
  
  const matchesRemaining = 38 - matchesPlayed;
  const maxPointsPossible = currentPoints + (matchesRemaining * 3);
  const currentPPG = currentPoints / matchesPlayed;
  
  const paceComponent = (currentPPG / 2.5) * 30;
  const gapComponent = Math.max(0, 25 - (pointsFromLeader * 2.5));
  const formComponent = (recentPPG / 2.5) * 25;
  const timeComponent = (matchesRemaining / 38) * 20;
  
  const tri = paceComponent + gapComponent + formComponent + timeComponent;
  
  let interpretation: string;
  if (tri >= 80) interpretation = 'Strong title contention';
  else if (tri >= 60) interpretation = 'In the race';
  else if (tri >= 40) interpretation = 'Outside chance';
  else interpretation = 'Out of contention';
  
  return {
    value: parseFloat(tri.toFixed(2)),
    interpretation,
    components: {
      pace: parseFloat(paceComponent.toFixed(2)),
      gap: parseFloat(gapComponent.toFixed(2)),
      form: parseFloat(formComponent.toFixed(2)),
      time: parseFloat(timeComponent.toFixed(2)),
    },
  };
}

function calculateMatchOutcome(input: MatchOutcomeInput) {
  const { h2hAdvantage, momentumDiff, isHomeTeam, squadDepth, injurySeverity } = input;
  
  const homeAdvantage = isHomeTeam ? 8 : -8;
  const squadFactor = squadDepth * 5;
  const injuryPenalty = injurySeverity * -10;
  
  const winProbability = Math.max(
    0,
    Math.min(
      100,
      50 + 
      (h2hAdvantage * 0.3) + 
      (momentumDiff * 1.5) + 
      homeAdvantage + 
      squadFactor + 
      injuryPenalty
    )
  );
  
  const drawProbability = Math.max(0, 30 - Math.abs(winProbability - 50) * 0.3);
  const lossProbability = Math.max(0, 100 - winProbability - drawProbability);
  
  const normalizedWin = (winProbability / (winProbability + drawProbability + lossProbability)) * 100;
  const normalizedDraw = (drawProbability / (winProbability + drawProbability + lossProbability)) * 100;
  const normalizedLoss = (lossProbability / (winProbability + drawProbability + lossProbability)) * 100;
  
  return {
    win: parseFloat(normalizedWin.toFixed(1)),
    draw: parseFloat(normalizedDraw.toFixed(1)),
    loss: parseFloat(normalizedLoss.toFixed(1)),
    confidence: parseFloat((Math.max(normalizedWin, normalizedDraw, normalizedLoss) / 100).toFixed(2)),
  };
}

function calculateH2HAnalysis(input: H2HAnalysisInput) {
  const { matches } = input;
  
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalGoalsFor = 0;
  let totalGoalsAgainst = 0;
  let homeWins = 0;
  let awayWins = 0;
  
  matches.forEach(match => {
    if (match.result === 'W') {
      wins++;
      if (match.venue === 'home') homeWins++;
      else awayWins++;
    } else if (match.result === 'D') {
      draws++;
    } else {
      losses++;
    }
    
    totalGoalsFor += match.goalsFor;
    totalGoalsAgainst += match.goalsAgainst;
  });
  
  const totalMatches = matches.length;
  const winRate = (wins / totalMatches) * 100;
  const avgGoalsFor = totalGoalsFor / totalMatches;
  const avgGoalsAgainst = totalGoalsAgainst / totalMatches;
  
  const recentForm = matches.slice(0, 5).map(m => m.result).join('');
  
  const dominanceScore = 
    (winRate * 0.5) + 
    (avgGoalsFor * 10) - 
    (avgGoalsAgainst * 10) +
    ((homeWins + awayWins) / totalMatches * 20);
  
  return {
    record: { wins, draws, losses },
    winRate: parseFloat(winRate.toFixed(1)),
    avgGoalsFor: parseFloat(avgGoalsFor.toFixed(2)),
    avgGoalsAgainst: parseFloat(avgGoalsAgainst.toFixed(2)),
    homeAwayBalance: {
      homeWins,
      awayWins,
    },
    recentForm,
    dominanceScore: parseFloat(dominanceScore.toFixed(2)),
  };
}

function calculateSeasonProjection(input: SeasonProjectionInput) {
  const { currentPoints, matchesPlayed, remainingFixtures, currentForm } = input;
  
  const formValue = currentForm.split('').reduce((sum, result) => {
    if (result === 'W') return sum + 3;
    if (result === 'D') return sum + 1;
    return sum;
  }, 0) / Math.min(currentForm.length, 5);
  
  let projectedPoints = currentPoints;
  
  remainingFixtures.forEach(fixture => {
    const baseWinProb = formValue / 3;
    
    const homeBonus = fixture.isHome ? 0.15 : 0;
    const strengthFactor = (100 - fixture.opponentStrength) / 100;
    
    const winProb = Math.min(0.9, baseWinProb + homeBonus + (strengthFactor * 0.2));
    const drawProb = 0.25;
    const lossProb = 1 - winProb - drawProb;
    
    const expectedPoints = (winProb * 3) + (drawProb * 1);
    projectedPoints += expectedPoints;
  });
  
  const optimisticPoints = currentPoints + (remainingFixtures.length * 2.5);
  const pessimisticPoints = currentPoints + (remainingFixtures.length * 1.2);
  
  return {
    projectedPoints: Math.round(projectedPoints),
    optimisticPoints: Math.round(optimisticPoints),
    pessimisticPoints: Math.round(pessimisticPoints),
    confidence: parseFloat(((projectedPoints - pessimisticPoints) / (optimisticPoints - pessimisticPoints)).toFixed(2)),
  };
}

if (parentPort) {
  parentPort.on('message', (message: WorkerMessage) => {
    try {
      let result;
      
      switch (message.type) {
        case 'titleRaceIndex':
          result = calculateTitleRaceIndex(message.data);
          break;
        case 'matchOutcome':
          result = calculateMatchOutcome(message.data);
          break;
        case 'h2hAnalysis':
          result = calculateH2HAnalysis(message.data);
          break;
        case 'seasonProjection':
          result = calculateSeasonProjection(message.data);
          break;
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
      
      parentPort?.postMessage({ success: true, result });
    } catch (error) {
      parentPort?.postMessage({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

export { 
  calculateTitleRaceIndex,
  calculateMatchOutcome,
  calculateH2HAnalysis,
  calculateSeasonProjection
};
