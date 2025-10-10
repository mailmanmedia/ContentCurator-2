import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";

export const COLOR_PALETTES = {
  classic: {
    name: "Classic LFC",
    background: "#C8102E",
    border: "#002147",
    text: "#FFFFFF",
    accent: "#F6EB61",
    muted: "rgba(255,255,255,0.72)",
    resultColors: { W: "#00FF87", D: "#F6EB61", L: "#FF4444" },
  },
  navy: {
    name: "Navy Professional",
    background: "#002147",
    border: "#C8102E",
    text: "#F5F1E9",
    accent: "#4CA9E0",
    muted: "rgba(245,241,233,0.64)",
    resultColors: { W: "#00FF87", D: "#4CA9E0", L: "#FF5C5C" },
  },
  cream: {
    name: "Cream Elegant",
    background: "#F5F1E9",
    border: "#002147",
    text: "#002147",
    accent: "#C8102E",
    muted: "rgba(0,33,71,0.58)",
    resultColors: { W: "#00D977", D: "#F6EB61", L: "#FF4444" },
  },
  dark: {
    name: "Dark Mode",
    background: "#0A0A0A",
    border: "#C8102E",
    text: "#FFFFFF",
    accent: "#F6EB61",
    muted: "rgba(255,255,255,0.62)",
    resultColors: { W: "#00FF87", D: "#F6EB61", L: "#FF5C5C" },
  },
} as const;

export type ColorPaletteKey = keyof typeof COLOR_PALETTES;

interface FormGuideOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  layout?: "horizontal" | "vertical";
  teamId?: number;
  colorPalette?: ColorPaletteKey;
  titleSize?: number;
  circleSize?: number;
  labelSize?: number;
  matchLimit?: 3 | 5 | 10;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const venueLabel = (venue: "H" | "A" | "N") => {
  switch (venue) {
    case "H":
      return "Home";
    case "A":
      return "Away";
    case "N":
      return "Neutral";
    default:
      return "";
  }
};

export default function FormGuideOverlay({
  width,
  height,
  opacity = 0.92,
  layout = "horizontal",
  teamId = 40,
  colorPalette = "navy",
  titleSize = 20,
  circleSize = 54,
  labelSize = 13,
  matchLimit = 5,
}: FormGuideOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Define leagueId and season as constants or derive them from props/context if needed
  const leagueId = 39; 
  const season = 2025;

  // Fetch team statistics from database with retry logic
  const { 
    data: teamStatsData, 
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['database-team-stats', teamId, leagueId, season],
    queryFn: async () => {
      const response = await fetch(`/api/database/teams/${teamId}/statistics?leagueId=${leagueId}&season=${season}`);
      if (!response.ok) throw new Error('Failed to fetch team stats');
      return response.json();
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Fetch team fixtures from database with retry logic
  const { 
    data: fixturesData, 
    isLoading: isLoadingFixtures,
    error: fixturesError,
    refetch: refetchFixtures
  } = useQuery({
    queryKey: ['database-team-fixtures', teamId, matchLimit, season],
    queryFn: async () => {
      const response = await fetch(`/api/database/teams/${teamId}/fixtures?last=${matchLimit}&season=${season}`);
      if (!response.ok) throw new Error('Failed to fetch fixtures');
      return response.json();
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  // Handle refresh of data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger database update for this team
      const response = await fetch(`/api/admin/update/team/${teamId}`, { 
        method: 'POST' 
      });

      if (response.ok) {
        // Refetch data after successful update
        await Promise.all([refetchStats(), refetchFixtures()]);
        toast({
          title: "Data refreshed",
          description: "Team data has been updated successfully.",
        });
      } else {
        throw new Error('Failed to refresh data');
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update team data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = isLoadingStats || isLoadingFixtures;
  const error = statsError || fixturesError;

  const { teamName, matches, sequence, record, competition, source, lastUpdated } = useMemo(() => {
    // Extract data from database responses
    const statsDbData = teamStatsData?.data?.statistics || teamStatsData?.data;
    const fixturesDbData = fixturesData?.data?.fixtures || fixturesData?.data;

    // Get last updated timestamp
    const statsLastUpdated = teamStatsData?.lastUpdated;
    const fixturesLastUpdated = fixturesData?.lastUpdated;
    const mostRecentUpdate = statsLastUpdated || fixturesLastUpdated || new Date().toISOString();

    // Extract team name from stats data
    const teamNameFromStats = statsDbData?.team?.name || "Liverpool";

    // Check if we have fixtures data
    const hasFixtures = fixturesDbData && Array.isArray(fixturesDbData) && fixturesDbData.length > 0;

    if (!hasFixtures) {
      // Try to use form data from team statistics if available
      const formString = statsDbData?.form;
      if (formString && typeof formString === 'string') {
        const formArray = formString.split('').slice(0, matchLimit);
        const formRecord = formArray.reduce(
          (acc: any, result: string) => {
            if (result === 'W' || result === 'D' || result === 'L') {
              acc[result] = (acc[result] || 0) + 1;
            }
            return acc;
          },
          { W: 0, D: 0, L: 0 }
        );

        return {
          teamName: teamNameFromStats,
          matches: [],
          sequence: formArray,
          record: formRecord,
          competition: "Premier League",
          source: "Database",
          lastUpdated: mostRecentUpdate
        };
      }

      return {
        teamName: teamNameFromStats,
        matches: [],
        sequence: [],
        record: { W: 0, D: 0, L: 0 },
        competition: "Premier League",
        source: "No Data",
        lastUpdated: mostRecentUpdate
      };
    }

    const fixtures = fixturesDbData;

    const processedMatches = fixtures
      .filter((f: any) => f.status?.short === 'FT' && f.goals?.home !== null && f.goals?.away !== null)
      .slice(0, matchLimit)
      .map((fixture: any) => {
        const isHome = fixture.teams?.home?.id === teamId || fixture.homeTeamId === teamId;
        const homeScore = fixture.goals?.home ?? 0;
        const awayScore = fixture.goals?.away ?? 0;
        const teamScore = isHome ? homeScore : awayScore;
        const opponentScore = isHome ? awayScore : homeScore;

        let result: 'W' | 'D' | 'L';
        if (teamScore > opponentScore) result = 'W';
        else if (teamScore < opponentScore) result = 'L';
        else result = 'D';

        const opponentName = isHome 
          ? (fixture.teams?.away?.name || fixture.awayTeam?.name || "Opponent")
          : (fixture.teams?.home?.name || fixture.homeTeam?.name || "Opponent");

        return {
          opponent: opponentName,
          date: fixture.fixture?.date || fixture.date,
          competition: fixture.league?.name || "Premier League",
          venue: isHome ? "H" : "A" as "H" | "A",
          score: `${teamScore}-${opponentScore}`,
          result,
        };
      });

    const formSequence = processedMatches.map((m: any) => m.result);
    const tally = formSequence.reduce(
      (acc: any, result: string) => {
        acc[result] = (acc[result] || 0) + 1;
        return acc;
      },
      { W: 0, D: 0, L: 0 }
    );

    return {
      teamName: teamNameFromStats,
      matches: processedMatches,
      sequence: formSequence,
      record: tally,
      competition: processedMatches[0]?.competition || "Premier League",
      source: "Database",
      lastUpdated: mostRecentUpdate
    };
  }, [teamStatsData, fixturesData, teamId, matchLimit]);

  // Dynamic scaling based on container dimensions
  const { scale, px } = useMemo(() => {
    if (!width || !height) {
      return {
        scale: 1,
        px: (value: number, options?: { min?: number; max?: number }) =>
          clamp(value, options?.min ?? value * 0.6, options?.max ?? value * 1.4),
      };
    }

    const baseWidth = 420;
    const baseHeight = 260;
    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;
    const computed = clamp(Math.min(widthScale, heightScale), 0.4, 1.6);

    const px = (value: number, options?: { min?: number; max?: number }) =>
      clamp(value * computed, options?.min ?? value * 0.5, options?.max ?? value * 1.6);

    return { scale: computed, px };
  }, [width, height]);

  // Responsive layout decisions
  const isStacked = layout === "vertical" || width < 360 || height < 220 || scale < 0.75;
  const isUltraCompact = width < 280 || height < 180 || scale < 0.6;

  // Dynamic pixel calculations
  const circlePx = px(isUltraCompact ? circleSize * 0.7 : isStacked ? circleSize * 0.82 : circleSize, {
    min: 24,
    max: 88,
  });
  const titlePx = px(titleSize, { min: 13, max: 30 });
  const labelPx = px(isUltraCompact ? labelSize * 0.78 : labelSize, { min: 9, max: 18 });
  const spacing = px(isStacked ? 12 : 18, { min: 6, max: 28 });
  const padding = px(isUltraCompact ? 14 : 18, { min: 10, max: 28 });
  const borderRadius = px(12, { min: 8, max: 22 });

  // Streak analysis
  const streakType = matches[0]?.result;
  let streakLabel = "";
  if (streakType) {
    let count = 0;
    for (const match of matches) {
      if (match.result === streakType) {
        count += 1;
      } else {
        break;
      }
    }
    if (count > 1) {
      const noun = streakType === "W" ? "winning" : streakType === "L" ? "losing" : "unbeaten";
      streakLabel = `${count}-match ${noun} streak`;
    } else {
      streakLabel = streakType === "W" ? "Won last match" : streakType === "L" ? "Lost last match" : "Drew last match";
    }
  }

  const badgeText = `${record.W}W-${record.D}D-${record.L}L`;

  // Debug logging
  console.log('[FormGuideOverlay] Team ID:', teamId);
  console.log('[FormGuideOverlay] Loading states:', { isLoadingStats, isLoadingFixtures });
  console.log('[FormGuideOverlay] Fixtures data:', fixturesData);
  console.log('[FormGuideOverlay] Team stats data:', teamStatsData);
  console.log('[FormGuideOverlay] Processed data:', { teamName, matches, sequence, record });

  if (isLoading) {
    return <OverlayLoadingSkeleton width={width} height={height} />;
  }

  if (error) {
    console.error('[FormGuideOverlay] Error:', error);
    return <OverlayErrorState width={width} height={height} error={error as Error} />;
  }

  if (!sequence.length) {
    console.warn('[FormGuideOverlay] No form data found for team:', teamId);
    return <OverlayEmptyState width={width} height={height} message={`No recent form data available for ${teamName}`} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(145deg, ${palette.background}, ${palette.border})`,
        opacity,
        color: palette.text,
        fontFamily: "League Spartan, sans-serif",
        padding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius,
        border: `${Math.max(2 * scale, 1)}px solid ${palette.border}`,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isStacked ? "flex-start" : "baseline",
          gap: px(12, { min: 6, max: 20 }),
          marginBottom: spacing,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: `${titlePx}px`,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: palette.accent,
            }}
          >
            RECENT FORM
          </div>
          <div
            style={{
              fontSize: `${px(14, { min: 10, max: 18 })}px`,
              fontWeight: 600,
              color: palette.text,
              opacity: 0.85,
            }}
          >
            {teamName.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: `${px(11, { min: 9, max: 14 })}px`,
              color: palette.muted,
            }}
          >
            {competition} · {streakLabel}
          </div>
        </div>
        <div
          style={{
            backgroundColor: `${palette.accent}22`,
            border: `1px solid ${palette.accent}55`,
            borderRadius: px(999, { min: 18, max: 48 }),
            padding: `${px(6, { min: 4, max: 10 })}px ${px(14, { min: 8, max: 18 })}px`,
            fontSize: `${px(13, { min: 10, max: 16 })}px`,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: px(8, { min: 4, max: 12 }),
            color: palette.text,
            whiteSpace: "nowrap",
            marginLeft: isStacked ? 0 : "auto",
          }}
        >
          <span style={{ opacity: 0.75 }}>Record:</span> {badgeText}
        </div>

        {/* Data Source Badge */}
        {source && lastUpdated && (
          <OverlaySourceBadge 
            source={source as any} 
            timestamp={new Date(lastUpdated).getTime()} 
          />
        )}
      </header>

      <div
        style={{
          display: "flex",
          flexDirection: isStacked ? "column" : "row",
          justifyContent: isStacked ? "flex-start" : "space-between",
          alignItems: isStacked ? "stretch" : "flex-end",
          gap: spacing,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: px(12, { min: 6, max: 20 }),
            flexWrap: "wrap",
            justifyContent: isStacked ? "center" : "flex-start",
            alignItems: "center",
            rowGap: px(isStacked ? 10 : 14, { min: 6, max: 18 }),
            minHeight: circlePx + px(20, { min: 6, max: 16 }),
          }}
        >
          {sequence.map((result: string, index: number) => (
            <motion.div
              key={`${result}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 220, damping: 18 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: px(6, { min: 3, max: 10 }) }}
            >
              <div
                style={{
                  width: circlePx,
                  height: circlePx,
                  borderRadius: "50%",
                  backgroundColor: palette.resultColors[result as 'W' | 'D' | 'L'],
                  color: result === "L" ? "#1A1A1A" : "#002147",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: `${px(18, { min: 12, max: 28 })}px`,
                  border: `2px solid rgba(0,0,0,0.12)`
                }}
              >
                {result}
              </div>
              <div
                style={{
                  fontSize: `${labelPx}px`,
                  letterSpacing: "0.05em",
                  color: palette.muted,
                }}
              >
                {formatDate(matches[index].date)}
              </div>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: `${palette.text}0F`,
            borderRadius: px(10, { min: 8, max: 18 }),
            border: `1px solid ${palette.text}18`,
            padding: `${px(12, { min: 8, max: 16 })}px ${px(14, { min: 10, max: 20 })}px`,
            display: "flex",
            flexDirection: "column",
            gap: px(10, { min: 6, max: 16 }),
            maxHeight: isStacked ? px(220, { min: isUltraCompact ? 110 : 140, max: 280 }) : "100%",
            overflowY: isStacked ? "auto" : "hidden",
            width: "100%",
          }}
        >
          {matches.map((match: any, index: number) => (
            <div
              key={`${match.date}-${match.opponent}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: px(12, { min: 6, max: 18 }),
                fontSize: `${px(12, { min: 10, max: 16 })}px`,
                color: palette.text,
                opacity: index === 0 ? 1 : 0.86,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: px(2, { min: 1, max: 4 }) }}>
                <span style={{ fontWeight: 600 }}>{match.opponent}</span>
                <span style={{ color: palette.muted, fontSize: `${px(11, { min: 9, max: 14 })}px` }}>
                  {match.competition} · {venueLabel(match.venue)}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: 700 }}>{match.score}</span>
                <div style={{
                  fontSize: `${px(11, { min: 9, max: 14 })}px`,
                  color: palette.muted,
                }}>
                  {formatDate(match.date)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer
        style={{
          marginTop: spacing,
          paddingTop: px(12, { min: 8, max: 16 }),
          borderTop: `${px(1.5, { min: 1, max: 2 })}px solid ${palette.text}20`,
          display: "flex",
          flexDirection: isStacked ? "column" : "row",
          justifyContent: isStacked ? "flex-start" : "space-between",
          alignItems: isStacked ? "flex-start" : "center",
          gap: px(12, { min: 6, max: 18 }),
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: px(14, { min: 8, max: 18 }),
            fontSize: `${px(11, { min: 9, max: 14 })}px`,
            color: palette.muted,
            flexWrap: "wrap",
            rowGap: px(6, { min: 4, max: 10 }),
          }}
        >
          <span>Wins: {record.W}</span>
          <span>Draws: {record.D}</span>
          <span>Losses: {record.L}</span>
          {streakLabel && <span>{streakLabel}</span>}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: px(8, { min: 4, max: 12 }),
            fontSize: `${px(11, { min: 9, max: 14 })}px`,
            color: palette.muted,
          }}
        >
          <span>
            Data as of {formatDistanceToNow(new Date(lastUpdated))} ago
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              width: px(24, { min: 20, max: 32 }),
              height: px(24, { min: 20, max: 32 }),
              padding: 0,
              background: `${palette.text}10`,
              border: `1px solid ${palette.text}20`,
            }}
          >
            <RefreshCw 
              className={isRefreshing ? "animate-spin" : ""} 
              style={{ 
                width: px(14, { min: 12, max: 18 }), 
                height: px(14, { min: 12, max: 18 }),
                color: palette.text
              }} 
            />
          </Button>
        </div>
      </footer>
    </motion.div>
  );
}