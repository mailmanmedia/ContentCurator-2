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

  const leagueId = 39; 
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const season = currentMonth >= 8 ? currentYear : currentYear - 1;

  const { 
    data: teamStatsData, 
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['database-team-stats', teamId, leagueId],
    queryFn: async () => {
      const response = await fetch(`/api/database/teams/${teamId}/statistics?leagueId=${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch team stats');
      return response.json();
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  const { 
    data: fixturesData, 
    isLoading: isLoadingFixtures,
    error: fixturesError,
    refetch: refetchFixtures
  } = useQuery({
    queryKey: ['database-team-fixtures', teamId, matchLimit],
    queryFn: async () => {
      const response = await fetch(`/api/database/teams/${teamId}/fixtures?last=${matchLimit}`);
      if (!response.ok) throw new Error('Failed to fetch fixtures');
      return response.json();
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/admin/update/team/${teamId}`, { 
        method: 'POST' 
      });

      if (response.ok) {
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
    const statsDbData = teamStatsData?.data?.statistics || teamStatsData?.data;
    const fixturesDbData = fixturesData?.data?.fixtures || fixturesData?.data;

    const statsLastUpdated = teamStatsData?.lastUpdated;
    const fixturesLastUpdated = fixturesData?.lastUpdated;
    const mostRecentUpdate = statsLastUpdated || fixturesLastUpdated || new Date().toISOString();

    const teamNameFromStats = statsDbData?.team?.name || "Liverpool";

    const hasFixtures = fixturesDbData && Array.isArray(fixturesDbData) && fixturesDbData.length > 0;

    if (!hasFixtures) {
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

  // Clean scaling with NO Math.max constraints
  const { scale, px } = useMemo(() => {
    if (!width || !height) {
      return {
        scale: 1,
        px: (value: number) => value,
      };
    }

    const baseWidth = 480;
    const baseHeight = 270;
    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;

    const computed = clamp(Math.min(widthScale, heightScale), 0.3, 2.0);

    const px = (value: number) => {
      const scaled = value * computed;
      if (value > 0 && scaled < 1) return 1;
      return Math.round(scaled);
    };

    return { scale: computed, px };
  }, [width, height]);

  const isCompact = width < 400 || height < 250;
  const isVeryCompact = width < 320 || height < 200;
  const isMini = width < 240 || height < 150;
  const isStacked = layout === "vertical" || isCompact;

  // NO Math.max() - pure scaling
  const circlePx = px(isMini ? 24 : isVeryCompact ? 32 : isCompact ? 40 : circleSize);
  const titlePx = px(isMini ? 12 : isVeryCompact ? 14 : titleSize);
  const subtitlePx = px(isMini ? 10 : isVeryCompact ? 11 : 14);
  const labelPx = px(isMini ? 8 : isVeryCompact ? 9 : labelSize);
  const textPx = px(isMini ? 9 : isVeryCompact ? 10 : 13);
  const smallTextPx = px(isMini ? 7 : isVeryCompact ? 8 : 11);

  const displayMatchLimit = isMini ? 2 : isVeryCompact ? 3 : matchLimit;

  const spacing = px(isMini ? 4 : isVeryCompact ? 6 : isCompact ? 10 : 16);
  const smallSpacing = px(isMini ? 2 : isVeryCompact ? 3 : isCompact ? 5 : 8);
  const padding = px(isMini ? 6 : isVeryCompact ? 8 : isCompact ? 12 : 20);
  const borderRadius = px(isMini ? 4 : isVeryCompact ? 6 : 10);
  const borderWidth = isMini ? 1 : Math.max(Math.round(2 * scale), 1);

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
      streakLabel = streakType === "W" ? "Won last" : streakType === "L" ? "Lost last" : "Drew last";
    }
  }

  const badgeText = `${record.W}W-${record.D}D-${record.L}L`;

  if (isLoading) {
    return <OverlayLoadingSkeleton width={width} height={height} />;
  }

  if (error) {
    return <OverlayErrorState width={width} height={height} error={error as Error} />;
  }

  if (!sequence.length) {
    return <OverlayEmptyState width={width} height={height} message={`No recent form data available for ${teamName}`} />;
  }

  return (
    <div
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
        borderRadius,
        border: `${borderWidth}px solid ${palette.border}`,
        boxSizing: "border-box",
        overflow: "hidden",
        gap: smallSpacing,
      }}
      data-testid="form-guide-overlay"
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: smallSpacing,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: titlePx,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: palette.accent,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.1,
            }}
          >
            {isMini ? "FORM" : "RECENT FORM"}
          </div>
          <div
            style={{
              fontSize: subtitlePx,
              fontWeight: 600,
              color: palette.text,
              opacity: 0.9,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: px(1),
              lineHeight: 1.2,
            }}
          >
            {teamName.toUpperCase()}
          </div>
          {!isMini && !isVeryCompact && streakLabel && (
            <div
              style={{
                fontSize: smallTextPx,
                color: palette.muted,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: px(1),
                lineHeight: 1.2,
              }}
            >
              {competition} · {streakLabel}
            </div>
          )}
        </div>

        {!isMini && !isVeryCompact && (
          <div
            style={{
              backgroundColor: `${palette.accent}22`,
              border: `1px solid ${palette.accent}55`,
              borderRadius: px(20),
              padding: `${px(4)}px ${px(10)}px`,
              fontSize: textPx,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: px(4),
              color: palette.text,
              whiteSpace: "nowrap",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            <span style={{ opacity: 0.75 }}>Record:</span> {badgeText}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: isStacked ? "column" : "row",
          gap: spacing,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Form Circles */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: px(isMini ? 4 : isVeryCompact ? 6 : 10),
            flexWrap: "wrap",
            justifyContent: isStacked ? "center" : "flex-start",
            alignItems: "flex-start",
            alignContent: "flex-start",
            flexShrink: 0,
          }}
        >
          {sequence.slice(0, displayMatchLimit).map((result: string, index: number) => (
            <motion.div
              key={`${result}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 220, damping: 18 }}
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                gap: px(2),
              }}
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
                  fontSize: px(isMini ? 12 : isVeryCompact ? 14 : 18),
                  border: `${Math.max(Math.round(2 * scale), 1)}px solid rgba(0,0,0,0.12)`,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {result}
              </div>
              {!isMini && !isVeryCompact && matches[index] && (
                <div
                  style={{
                    fontSize: labelPx,
                    letterSpacing: "0.03em",
                    color: palette.muted,
                    whiteSpace: "nowrap",
                    lineHeight: 1.2,
                  }}
                >
                  {formatDate(matches[index].date)}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Match Details */}
        {!isMini && matches.length > 0 && (
          <div
            style={{
              flex: 1,
              backgroundColor: `${palette.text}0F`,
              borderRadius: px(6),
              border: `1px solid ${palette.text}18`,
              padding: `${px(6)}px ${px(8)}px`,
              display: "flex",
              flexDirection: "column",
              gap: px(isVeryCompact ? 4 : 6),
              minHeight: 0,
              minWidth: 0,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {matches.slice(0, displayMatchLimit).map((match: any, index: number) => (
              <div
                key={`${match.date}-${match.opponent}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: px(4),
                  fontSize: textPx,
                  color: palette.text,
                  opacity: index === 0 ? 1 : 0.85,
                  lineHeight: 1.3,
                }}
              >
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: px(1),
                  flex: 1,
                  minWidth: 0,
                }}>
                  <span style={{ 
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {match.opponent}
                  </span>
                  {!isVeryCompact && (
                    <span style={{ 
                      color: palette.muted, 
                      fontSize: smallTextPx,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.2,
                    }}>
                      {match.competition} · {venueLabel(match.venue)}
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontWeight: 700 }}>{match.score}</span>
                  {!isVeryCompact && (
                    <div style={{
                      fontSize: smallTextPx,
                      color: palette.muted,
                      whiteSpace: "nowrap",
                      lineHeight: 1.2,
                    }}>
                      {formatDate(match.date)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isMini && (
        <footer
          style={{
            borderTop: `1px solid ${palette.text}20`,
            paddingTop: smallSpacing,
            display: "flex",
            flexDirection: isVeryCompact ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isVeryCompact ? "flex-start" : "center",
            gap: px(4),
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: px(isVeryCompact ? 6 : 10),
              fontSize: smallTextPx,
              color: palette.muted,
              flexWrap: "wrap",
              lineHeight: 1.2,
            }}
          >
            <span>W: {record.W}</span>
            <span>D: {record.D}</span>
            <span>L: {record.L}</span>
            {!isVeryCompact && streakLabel && <span>• {streakLabel}</span>}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: px(4),
              fontSize: smallTextPx,
              color: palette.muted,
              lineHeight: 1.2,
            }}
          >
            {!isVeryCompact && (
              <span style={{ whiteSpace: "nowrap" }}>
                {formatDistanceToNow(new Date(lastUpdated))} ago
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-form"
              style={{
                width: px(20),
                height: px(20),
                padding: 0,
                background: `${palette.text}10`,
                border: `1px solid ${palette.text}20`,
                flexShrink: 0,
              }}
            >
              <RefreshCw 
                className={isRefreshing ? "animate-spin" : ""} 
                style={{ 
                  width: px(12), 
                  height: px(12),
                  color: palette.text
                }} 
              />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}