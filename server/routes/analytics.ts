import type { Express, Request, Response } from "express";
import { analyticsEngine } from "../analytics/analyticsEngine";
import type {
  TeamStats,
  HomeAwayStats,
  HeadToHeadRecord,
  PlayerStats,
  SetPieceStats,
  CounterAttackStats,
  PressingStats,
  ArticleSentiment,
  FixtureInfo
} from "../analytics/analyticsEngine";
import { analyticsCache, CACHE_TTL } from "../analytics/analyticsCache";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "server", "data");

function loadJSONFile(filename: string): any {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

function aggregateTeamStats(matches: any[]): TeamStats {
  const stats: TeamStats = {
    matchesPlayed: matches.length,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    cleanSheets: 0,
    form: "",
    xG: 0,
    xGA: 0,
    shotsOnTarget: 0,
    shotsOnTargetAgainst: 0,
    totalShots: 0,
    bigChances: 0,
    bigChancesScored: 0,
    possession: 0,
    corners: 0,
    ppda: 0,
    finalThirdPasses: 0,
    totalPasses: 0,
  };

  let formArray: string[] = [];

  matches.forEach((match) => {
    if (match.result === "W") stats.wins++;
    else if (match.result === "D") stats.draws++;
    else if (match.result === "L") stats.losses++;

    formArray.push(match.result);

    stats.goalsFor += match.score.liverpool;
    stats.goalsAgainst += match.score.opponent;

    if (match.score.opponent === 0) stats.cleanSheets++;

    if (match.xG) {
      stats.xG! += match.xG.liverpool;
      stats.xGA! += match.xG.opponent;
    }

    if (match.shots) {
      stats.shotsOnTarget! += match.shots.onTarget?.liverpool || 0;
      stats.shotsOnTargetAgainst! += match.shots.onTarget?.opponent || 0;
      stats.totalShots! += match.shots.liverpool || 0;
    }

    if (match.possession) {
      stats.possession! += match.possession.liverpool;
    }

    if (match.corners) {
      stats.corners! += match.corners.liverpool;
    }

    if (match.passes) {
      stats.totalPasses! += match.passes.liverpool;
    }

    if (match.finalThirdEntries) {
      stats.finalThirdPasses! += match.finalThirdEntries.liverpool;
    }
  });

  stats.form = formArray.slice(0, 5).join("");
  stats.possession = stats.possession! / matches.length;
  stats.corners = stats.corners! / matches.length;
  
  return stats;
}

function getHomeAwayStats(matches: any[]): HomeAwayStats {
  const homeMatches = matches.filter((m) => m.venue.type === "home");
  const awayMatches = matches.filter((m) => m.venue.type === "away");

  function calculatePoints(matches: any[]): number {
    return matches.reduce((acc, m) => {
      if (m.result === "W") return acc + 3;
      if (m.result === "D") return acc + 1;
      return acc;
    }, 0);
  }

  function calculateGD(matches: any[]): number {
    return matches.reduce(
      (acc, m) => acc + (m.score.liverpool - m.score.opponent),
      0
    );
  }

  return {
    homeMatches: homeMatches.length,
    homePoints: calculatePoints(homeMatches),
    homeGoalDifference: calculateGD(homeMatches),
    awayMatches: awayMatches.length,
    awayPoints: calculatePoints(awayMatches),
    awayGoalDifference: calculateGD(awayMatches),
  };
}

function getH2HRecord(h2hData: any, opponentId: number): HeadToHeadRecord | null {
  const opponent = h2hData.headToHead.find(
    (h: any) => h.opponentId === opponentId
  );
  if (!opponent) return null;

  const recentResults = opponent.last10Matches
    .map((m: any) => m.result)
    .slice(0, 10) as ('W' | 'D' | 'L')[];

  return {
    wins: opponent.record.wins,
    draws: opponent.record.draws,
    losses: opponent.record.losses,
    recentResults,
    totalMatches: opponent.last10Matches.length,
  };
}

export function registerAnalyticsRoutes(app: Express) {
  app.get("/api/analytics/team-metrics", async (req: Request, res: Response) => {
    try {
      const metrics = await analyticsCache.get("team-metrics", () => {
        const matchesData = loadJSONFile("matches.json");
        const leagueTable = loadJSONFile("league_table.json");

        if (!matchesData || !leagueTable) {
          throw new Error("Failed to load required data files");
        }

        const matches = matchesData.matches;
        const teamStats = aggregateTeamStats(matches);
        const homeAwayStats = getHomeAwayStats(matches);

        const liverpoolStanding = leagueTable.standings.find(
          (s: any) => s.team.id === 40
        );

        const formIndex = analyticsEngine.calculateFormIndex(
          liverpoolStanding?.form || teamStats.form
        );

        const xPTS = analyticsEngine.calculateExpectedPoints(
          teamStats.xG! / teamStats.matchesPlayed,
          teamStats.xGA! / teamStats.matchesPlayed
        );

        const goalEfficiency = analyticsEngine.calculateGoalEfficiency(teamStats);

        const defensiveSolidityIndex =
          analyticsEngine.calculateDefensiveSolidityIndex(teamStats);

        const homeAwayDifferential =
          analyticsEngine.calculateHomeAwayDifferential(homeAwayStats);

        const pressureIndex = analyticsEngine.calculatePressureIndex(
          teamStats.totalShots! / teamStats.matchesPlayed,
          teamStats.possession!,
          teamStats.corners!,
          teamStats.finalThirdPasses! / teamStats.totalPasses!
        );

        const slotIntensityIndex = analyticsEngine.calculateSlotIntensityIndex(
          120,
          8.5,
          0.65
        );

        const competitionLoadFactor =
          analyticsEngine.calculateCompetitionLoadFactor(7, 30, 2);

        const squadVulnerabilityIndex =
          analyticsEngine.calculateSquadVulnerabilityIndex(2, 14, 1, 0.85);

        return {
          overview: {
            matchesPlayed: teamStats.matchesPlayed,
            record: {
              wins: teamStats.wins,
              draws: teamStats.draws,
              losses: teamStats.losses,
            },
            goalsFor: teamStats.goalsFor,
            goalsAgainst: teamStats.goalsAgainst,
            goalDifference: teamStats.goalsFor - teamStats.goalsAgainst,
            cleanSheets: teamStats.cleanSheets,
            form: teamStats.form,
            position: liverpoolStanding?.position,
            points: liverpoolStanding?.points,
          },
          mailmanMetrics: {
            slotIntensityIndex,
            competitionLoadFactor,
            squadVulnerabilityIndex,
          },
          performanceMetrics: {
            formIndex,
            expectedPoints: xPTS,
            goalEfficiency,
            defensiveSolidityIndex,
            homeAwayDifferential,
            pressureIndex,
          },
          rawStats: teamStats,
        };
      }, { ttl: CACHE_TTL.TEAM_METRICS, backgroundRefresh: true });

      res.json(metrics);
    } catch (error: any) {
      console.error("Error calculating team metrics:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get(
    "/api/analytics/player-metrics/:playerId",
    async (req: Request, res: Response) => {
      try {
        const playerId = parseInt(req.params.playerId);
        const metrics = await analyticsCache.get(`player-${playerId}`, () => {
          const playersData = loadJSONFile("players.json");
          const matchesData = loadJSONFile("matches.json");

          if (!playersData || !matchesData) {
            throw new Error("Failed to load required data files");
          }

          const player = playersData.squad.find(
            (p: any) => p.playerId === playerId
          );

          if (!player) {
            throw new Error("Player not found");
          }

          const stats = player.seasonStats;
          const playerStats: PlayerStats = {
            goals: stats.goals || 0,
            assists: stats.assists || 0,
            minutesPlayed: stats.minutes || 0,
            matchesPlayed: stats.appearances || 0,
            keyPasses: stats.keyPasses || 0,
            shotCreatingActions: stats.shotCreatingActions || 0,
            tackles: stats.tackles || 0,
            interceptions: stats.interceptions || 0,
            clearances: stats.clearances || 0,
            position: mapPosition(player.position[0]),
          };

          const goalsPer90 = analyticsEngine.calculateGoalsPer90(playerStats);
          
          const minutes90 = playerStats.minutesPlayed / 90;
          const assistsPer90 = {
            value: minutes90 > 0 ? parseFloat((playerStats.assists / minutes90).toFixed(2)) : 0,
            interpretation: minutes90 > 0 && playerStats.assists / minutes90 > 0.3 ? 'Strong creativity' : 'Average creativity'
          };

          const teamTotalGoals = matchesData.matches.reduce(
            (sum: number, m: any) => sum + m.score.liverpool,
            0
          );

          const involvementScore = analyticsEngine.calculateInvolvementScore(
            playerStats,
            teamTotalGoals
          );

          const impactRating = analyticsEngine.calculateImpactRating(playerStats);
          
          const creativityIndex = analyticsEngine.calculateCreativityIndex(playerStats);

          return {
            player: {
              id: player.playerId,
              name: player.name,
              position: player.position,
              number: player.number,
              photo: player.photo,
            },
            metrics: {
              goalsPer90,
              assistsPer90,
              creativityIndex,
              involvementScore,
              impactRating,
            },
            stats: playerStats,
            seasonStats: stats,
          };
        }, { ttl: CACHE_TTL.PLAYER_METRICS, backgroundRefresh: true });

        res.json(metrics);
      } catch (error: any) {
        console.error("Error calculating player metrics:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/api/analytics/match-prediction/:homeTeam/:awayTeam",
    async (req: Request, res: Response) => {
      try {
        const homeTeamId = parseInt(req.params.homeTeam);
        const awayTeamId = parseInt(req.params.awayTeam);

        const prediction = await analyticsCache.get(
          `prediction-${homeTeamId}-${awayTeamId}`,
          () => {
            const matchesData = loadJSONFile("matches.json");
            const h2hData = loadJSONFile("historical_h2h.json");
            const leagueTable = loadJSONFile("league_table.json");
            const opponentsData = loadJSONFile("opponents.json");

            if (!matchesData || !h2hData || !leagueTable || !opponentsData) {
              throw new Error("Failed to load required data files");
            }

            const isLiverpoolHome = homeTeamId === 40;
            const opponentId = isLiverpoolHome ? awayTeamId : homeTeamId;

            const opponent = opponentsData.opponents.find(
              (o: any) => o.teamId === opponentId
            );

            const h2hRecord = getH2HRecord(h2hData, opponentId);
            if (!h2hRecord) {
              throw new Error("No head-to-head data found");
            }

            const h2hAdvantage = analyticsEngine.calculateHeadToHeadIndex(
              h2hRecord,
              isLiverpoolHome
            );

            const liverpoolStanding = leagueTable.standings.find(
              (s: any) => s.team.id === 40
            );
            const opponentStanding = leagueTable.standings.find(
              (s: any) => s.team.id === opponentId
            );

            const formIndex = analyticsEngine.calculateFormIndex(
              liverpoolStanding?.form || ""
            ).value;

            const opponentFormIndex = analyticsEngine.calculateFormIndex(
              opponentStanding?.form || opponent?.form?.last5 || ""
            ).value;

            const momentumDiff = formIndex - opponentFormIndex;

            const matchOutcome =
              analyticsEngine.calculateMatchOutcomeProbability(
                h2hAdvantage.value,
                momentumDiff,
                isLiverpoolHome,
                0.9,
                0.15
              );

            const matches = matchesData.matches;
            const teamStats = aggregateTeamStats(matches);

            const xPTS = analyticsEngine.calculateExpectedPoints(
              teamStats.xG! / teamStats.matchesPlayed,
              teamStats.xGA! / teamStats.matchesPlayed
            );

            return {
              fixture: {
                homeTeam: isLiverpoolHome
                  ? { id: 40, name: "Liverpool" }
                  : { id: opponentId, name: opponent?.teamName || "Opponent" },
                awayTeam: isLiverpoolHome
                  ? { id: opponentId, name: opponent?.teamName || "Opponent" }
                  : { id: 40, name: "Liverpool" },
              },
              prediction: {
                h2hAdvantage,
                momentumDifference: parseFloat(momentumDiff.toFixed(2)),
                matchOutcome,
                expectedPoints: xPTS,
              },
              context: {
                liverpoolForm: liverpoolStanding?.form,
                opponentForm: opponentStanding?.form || opponent?.form?.last5,
                h2hRecord: {
                  wins: h2hRecord.wins,
                  draws: h2hRecord.draws,
                  losses: h2hRecord.losses,
                },
              },
            };
          },
          { ttl: CACHE_TTL.MATCH_PREDICTION, backgroundRefresh: true }
        );

        res.json(prediction);
      } catch (error: any) {
        console.error("Error calculating match prediction:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/api/analytics/season-progression",
    async (req: Request, res: Response) => {
      try {
        const progression = await analyticsCache.get("season-progression", () => {
          const matchesData = loadJSONFile("matches.json");
          const leagueTable = loadJSONFile("league_table.json");

          if (!matchesData || !leagueTable) {
            throw new Error("Failed to load required data files");
          }

          const matches = matchesData.matches;
          const liverpoolStanding = leagueTable.standings.find(
            (s: any) => s.team.id === 40
          );

          let cumulativePoints = 0;
          let cumulativeGD = 0;

          const ppgTrajectory = matches.map((match: any, index: number) => {
            let points = 0;
            if (match.result === "W") points = 3;
            else if (match.result === "D") points = 1;

            cumulativePoints += points;
            cumulativeGD += match.score.liverpool - match.score.opponent;

            return {
              matchNumber: index + 1,
              date: match.date,
              opponent: match.opponent.name,
              result: match.result,
              score: `${match.score.liverpool}-${match.score.opponent}`,
              points,
              cumulativePoints,
              ppg: parseFloat((cumulativePoints / (index + 1)).toFixed(2)),
              goalDifference: cumulativeGD,
            };
          });

          const titleRaceIndex = analyticsEngine.calculateTitleRaceIndex(
            liverpoolStanding?.played || 7,
            liverpoolStanding?.points || 16,
            (leagueTable.standings[0]?.points || 19) -
              (liverpoolStanding?.points || 16),
            parseFloat(
              ppgTrajectory
                .slice(-5)
                .reduce((sum: number, m: any) => sum + m.points, 0) / 5
            )
          );

          const top4Probability = analyticsEngine.calculateTop4Probability(
            liverpoolStanding?.points || 16,
            ppgTrajectory[ppgTrajectory.length - 1]?.ppg || 2.29,
            0.35,
            liverpoolStanding?.points -
              (leagueTable.standings[4]?.points || 15) || 1
          );

          return {
            currentSeason: matchesData.season,
            matchesPlayed: matches.length,
            currentPosition: liverpoolStanding?.position,
            currentPoints: liverpoolStanding?.points,
            ppgTrajectory,
            projections: {
              titleRaceIndex,
              top4Probability,
              projectedPoints: parseFloat(
                (ppgTrajectory[ppgTrajectory.length - 1]?.ppg * 38).toFixed(0)
              ),
            },
          };
        }, { ttl: CACHE_TTL.TEAM_METRICS, backgroundRefresh: true });

        res.json(progression);
      } catch (error: any) {
        console.error("Error calculating season progression:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/api/analytics/tactical-analysis",
    async (req: Request, res: Response) => {
      try {
        const analysis = await analyticsCache.get("tactical-analysis", () => {
          const matchesData = loadJSONFile("matches.json");

          if (!matchesData) {
            throw new Error("Failed to load required data files");
          }

          const matches = matchesData.matches;

          let totalHighTurnovers = 0;
          let totalTackles = 0;
          let totalInterceptions = 0;
          let totalShots = 0;
          let totalPossession = 0;
          let totalFinalThirdEntries = 0;
          let totalFastBreakAttempts = 0;
          let totalFastBreakGoals = 0;

          matches.forEach((match: any) => {
            totalHighTurnovers += match.highTurnovers?.liverpool || 0;
            totalTackles += match.tackles?.liverpool || 0;
            totalInterceptions += match.interceptions?.liverpool || 0;
            totalShots += match.shots?.liverpool || 0;
            totalPossession += match.possession?.liverpool || 0;
            totalFinalThirdEntries += match.finalThirdEntries?.liverpool || 0;
            totalFastBreakAttempts += match.fastBreaks?.attempts?.liverpool || 0;
            totalFastBreakGoals += match.fastBreaks?.goals?.liverpool || 0;
          });

          const pressingStats: PressingStats = {
            highTurnovers: totalHighTurnovers,
            tackles: totalTackles,
            interceptions: totalInterceptions,
            pressures: totalTackles + totalInterceptions,
            ballLosses: 150,
            regainedWithin5Sec: 85,
          };

          const pressingSuccessRate =
            analyticsEngine.calculatePressingSuccessRate(pressingStats);

          const avgPossession = totalPossession / matches.length;
          const avgShots = totalShots / matches.length;
          const avgFinalThird = totalFinalThirdEntries / matches.length;

          const teamStats = aggregateTeamStats(matches);

          const possessionEfficiency =
            analyticsEngine.calculatePossessionEfficiency(
              avgPossession,
              avgShots * 0.7,
              (teamStats.xG! / teamStats.matchesPlayed) * 0.8,
              teamStats.totalPasses!,
              teamStats.finalThirdPasses!,
              avgFinalThird,
              avgShots
            );

          const counterStats: CounterAttackStats = {
            fastBreakGoals: totalFastBreakGoals,
            fastBreakAttempts: totalFastBreakAttempts,
            avgTransitionSpeed: 9.2,
            successfulCounters: totalFastBreakGoals + 8,
            counterOpportunities: totalFastBreakAttempts + 12,
            counterXG: totalFastBreakGoals * 0.3,
          };

          const counterAttackEffectiveness =
            analyticsEngine.calculateCounterAttackEffectiveness(counterStats);

          const setPieceStats: SetPieceStats = {
            goalsFromSetPieces: 3,
            totalCorners: teamStats.corners! * teamStats.matchesPlayed,
            freekicksInRange: 18,
            uniqueRoutines: 8,
            goalsConcededFromSetPieces: 2,
            opponentSetPieces: 35,
          };

          const setPieceThreatIndex =
            analyticsEngine.calculateSetPieceThreatIndex(setPieceStats);

          return {
            pressing: {
              metrics: pressingSuccessRate,
              rawStats: {
                highTurnovers: totalHighTurnovers,
                tacklesPerMatch: parseFloat(
                  (totalTackles / matches.length).toFixed(1)
                ),
                interceptionsPerMatch: parseFloat(
                  (totalInterceptions / matches.length).toFixed(1)
                ),
              },
            },
            possession: {
              metrics: possessionEfficiency,
              rawStats: {
                avgPossession: parseFloat(avgPossession.toFixed(1)),
                avgShotsPerMatch: parseFloat(avgShots.toFixed(1)),
                avgFinalThirdEntries: parseFloat(avgFinalThird.toFixed(1)),
              },
            },
            counterAttacking: {
              metrics: counterAttackEffectiveness,
              rawStats: {
                fastBreakAttempts: totalFastBreakAttempts,
                fastBreakGoals: totalFastBreakGoals,
                conversionRate: parseFloat(
                  ((totalFastBreakGoals / totalFastBreakAttempts) * 100).toFixed(
                    1
                  )
                ),
              },
            },
            setPieces: {
              metrics: setPieceThreatIndex,
              rawStats: setPieceStats,
            },
          };
        }, { ttl: CACHE_TTL.TEAM_METRICS, backgroundRefresh: true });

        res.json(analysis);
      } catch (error: any) {
        console.error("Error calculating tactical analysis:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/api/analytics/comparative-metrics",
    async (req: Request, res: Response) => {
      try {
        const comparisons = await analyticsCache.get("comparative-metrics", () => {
          const matchesData = loadJSONFile("matches.json");
          const leagueTable = loadJSONFile("league_table.json");
          const opponentsData = loadJSONFile("opponents.json");

          if (!matchesData || !leagueTable || !opponentsData) {
            throw new Error("Failed to load required data files");
          }

          const matches = matchesData.matches;
          const teamStats = aggregateTeamStats(matches);

          const leagueAvgGoalsFor =
            leagueTable.standings.reduce(
              (sum: number, t: any) => sum + t.goalsFor,
              0
            ) / leagueTable.standings.length;

          const leagueAvgGoalsAgainst =
            leagueTable.standings.reduce(
              (sum: number, t: any) => sum + t.goalsAgainst,
              0
            ) / leagueTable.standings.length;

          const leagueAvgXG = 1.5;

          const goalsForComparison =
            analyticsEngine.calculateLeagueAverageComparisonIndex(
              teamStats.goalsFor / teamStats.matchesPlayed,
              leagueAvgGoalsFor
            );

          const goalsAgainstComparison =
            analyticsEngine.calculateLeagueAverageComparisonIndex(
              teamStats.goalsAgainst / teamStats.matchesPlayed,
              leagueAvgGoalsAgainst,
              true
            );

          const xGComparison =
            analyticsEngine.calculateLeagueAverageComparisonIndex(
              teamStats.xG! / teamStats.matchesPlayed,
              leagueAvgXG
            );

          const avgOpponentStrength =
            opponentsData.opponents
              .slice(0, teamStats.matchesPlayed)
              .reduce((sum: number, o: any) => sum + o.strengthRating, 0) /
            Math.min(teamStats.matchesPlayed, opponentsData.opponents.length);

          const sosAdjustment =
            analyticsEngine.calculateStrengthOfScheduleAdjustment(
              teamStats.goalsFor / teamStats.matchesPlayed,
              avgOpponentStrength,
              75
            );

          const liverpoolStanding = leagueTable.standings.find(
            (s: any) => s.team.id === 40
          );

          const top6Teams = leagueTable.standings.slice(0, 6).map((t: any) => ({
            position: t.position,
            name: t.team.name,
            points: t.points,
            goalDifference: t.goalDifference,
            form: t.form,
          }));

          return {
            leagueComparisons: {
              goalsFor: goalsForComparison,
              goalsAgainst: goalsAgainstComparison,
              expectedGoals: xGComparison,
            },
            strengthOfSchedule: sosAdjustment,
            leagueContext: {
              currentPosition: liverpoolStanding?.position,
              pointsFromTop: liverpoolStanding
                ? leagueTable.standings[0].points - liverpoolStanding.points
                : 0,
              pointsFromTop4: liverpoolStanding
                ? Math.max(
                    0,
                    leagueTable.standings[3].points - liverpoolStanding.points
                  )
                : 0,
              top6Standings: top6Teams,
            },
            benchmarks: {
              leagueAvgGoalsFor: parseFloat(leagueAvgGoalsFor.toFixed(2)),
              leagueAvgGoalsAgainst: parseFloat(
                leagueAvgGoalsAgainst.toFixed(2)
              ),
              leagueAvgXG,
            },
          };
        }, { ttl: CACHE_TTL.TEAM_METRICS, backgroundRefresh: true });

        res.json(comparisons);
      } catch (error: any) {
        console.error("Error calculating comparative metrics:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/api/analytics/rss-metrics",
    async (req: Request, res: Response) => {
      try {
        const metrics = await analyticsCache.get("rss-metrics", () => {
          const mockArticles: ArticleSentiment[] = [
            { sentiment: 0.75, sourceCredibility: 0.9, ageInHours: 12 },
            { sentiment: 0.65, sourceCredibility: 0.85, ageInHours: 18 },
            { sentiment: 0.55, sourceCredibility: 0.8, ageInHours: 24 },
            { sentiment: -0.2, sourceCredibility: 0.7, ageInHours: 36 },
            { sentiment: 0.8, sourceCredibility: 0.95, ageInHours: 6 },
            { sentiment: 0.45, sourceCredibility: 0.75, ageInHours: 48 },
          ];

          const sentimentScore =
            analyticsEngine.calculateSentimentAggregationScore(mockArticles);

          const topicTrending = analyticsEngine.calculateTopicTrendingScore(
            15,
            10,
            6
          );

          const coverageIntensity =
            analyticsEngine.calculateCoverageIntensityIndex(28, 18);

          const sourceDiversity = analyticsEngine.calculateSourceDiversityIndex(
            8,
            3,
            3,
            2
          );

          return {
            sentiment: {
              aggregatedScore: sentimentScore,
              sampleSize: mockArticles.length,
            },
            trending: {
              topicScore: topicTrending,
            },
            coverage: {
              intensity: coverageIntensity,
              diversity: sourceDiversity,
            },
            recentArticles: mockArticles.length,
          };
        }, { ttl: CACHE_TTL.RSS_SENTIMENT, backgroundRefresh: true });

        res.json(metrics);
      } catch (error: any) {
        console.error("Error calculating RSS metrics:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get("/api/analytics/dashboard", async (req: Request, res: Response) => {
    try {
      const dashboard = await analyticsCache.get("dashboard", () => {
        const matchesData = loadJSONFile("matches.json");
        const leagueTable = loadJSONFile("league_table.json");
        const playersData = loadJSONFile("players.json");

        if (!matchesData || !leagueTable || !playersData) {
          throw new Error("Failed to load required data files");
        }

        const matches = matchesData.matches;
        const teamStats = aggregateTeamStats(matches);
        const liverpoolStanding = leagueTable.standings.find(
          (s: any) => s.team.id === 40
        );

        const formIndex = analyticsEngine.calculateFormIndex(
          liverpoolStanding?.form || teamStats.form
        );

        const xPTS = analyticsEngine.calculateExpectedPoints(
          teamStats.xG! / teamStats.matchesPlayed,
          teamStats.xGA! / teamStats.matchesPlayed
        );

        const goalEfficiency =
          analyticsEngine.calculateGoalEfficiency(teamStats);

        const defensiveSolidityIndex =
          analyticsEngine.calculateDefensiveSolidityIndex(teamStats);

        const slotIntensityIndex = analyticsEngine.calculateSlotIntensityIndex(
          120,
          8.5,
          0.65
        );

        const topScorers = playersData.squad
          .filter((p: any) => p.seasonStats.goals > 0)
          .sort((a: any, b: any) => b.seasonStats.goals - a.seasonStats.goals)
          .slice(0, 5)
          .map((p: any) => ({
            name: p.name,
            goals: p.seasonStats.goals,
            assists: p.seasonStats.assists,
            appearances: p.seasonStats.appearances,
          }));

        const upcomingFixtures = [
          { opponent: "Next Opponent", date: "TBD", venue: "TBD" },
        ];

        return {
          overview: {
            position: liverpoolStanding?.position,
            points: liverpoolStanding?.points,
            played: teamStats.matchesPlayed,
            form: teamStats.form,
            goalDifference: teamStats.goalsFor - teamStats.goalsAgainst,
          },
          keyMetrics: {
            formIndex,
            expectedPoints: xPTS,
            goalEfficiency,
            defensiveSolidityIndex,
            slotIntensityIndex,
          },
          performance: {
            goalsScored: teamStats.goalsFor,
            goalsConceded: teamStats.goalsAgainst,
            cleanSheets: teamStats.cleanSheets,
            avgPossession: parseFloat(teamStats.possession!.toFixed(1)),
            wins: teamStats.wins,
            draws: teamStats.draws,
            losses: teamStats.losses,
          },
          topPlayers: topScorers,
          upcomingFixtures,
          lastUpdated: new Date().toISOString(),
        };
      }, { ttl: CACHE_TTL.TEAM_METRICS, backgroundRefresh: true });

      res.json(dashboard);
    } catch (error: any) {
      console.error("Error generating dashboard:", error);
      res.status(500).json({ error: error.message });
    }
  });

  console.log("✅ Analytics routes registered");
}

function mapPosition(pos: string): 'GK' | 'CB' | 'FB' | 'CM' | 'AM' | 'WG' | 'ST' {
  if (pos === "GK") return "GK";
  if (pos === "CB") return "CB";
  if (["LB", "RB", "LWB", "RWB"].includes(pos)) return "FB";
  if (["CM", "CDM", "DM"].includes(pos)) return "CM";
  if (["CAM", "AM"].includes(pos)) return "AM";
  if (["LW", "RW", "LM", "RM"].includes(pos)) return "WG";
  return "ST";
}
