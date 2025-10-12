import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
} from "./OverlayStates";

interface H2HMatchCardOverlayProps {
  homeTeamId: number;
  awayTeamId: number;
  width: number;
  height: number;
  opacity?: number;
  colorPalette?: 'classic' | 'navy' | 'cream' | 'dark';
}

interface H2HMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition?: string;
  homeXg?: number;
  awayXg?: number;
}

interface TopScorer {
  name: string;
  goals: number;
}

interface TeamInfo {
  id: number;
  name: string;
  badge: string | null;
  code?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function useTeamBadge(teamId?: number) {
  return useQuery<TeamInfo>({
    queryKey: ['teamBadge', teamId],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID required');
      const response = await fetch(`/api/football/team/${teamId}`);
      if (!response.ok) throw new Error('Failed to fetch team badge');
      return response.json();
    },
    enabled: !!teamId,
    staleTime: 60 * 60 * 1000,
  });
}

export default function H2HMatchCardOverlay({
  homeTeamId,
  awayTeamId,
  width,
  height,
  opacity = 0.95,
  colorPalette = 'classic',
}: H2HMatchCardOverlayProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all teams with stats
  const { data: teamsData } = useQuery({
    queryKey: ['all-teams-stats'],
    queryFn: async () => {
      const response = await fetch('/api/database/teams/all');
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  // Fetch H2H data from database
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['h2h-db', homeTeamId, awayTeamId],
    queryFn: async () => {
      const response = await fetch(`/api/database/head-to-head/${homeTeamId}/${awayTeamId}?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch H2H data');
      return response.json();
    },
    enabled: !!homeTeamId && !!awayTeamId,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  const { data: homeTeam } = useTeamBadge(homeTeamId);
  const { data: awayTeam } = useTeamBadge(awayTeamId);

  // Get team stats from teams data
  const homeTeamStats = teamsData?.data?.find((t: any) => t.id === homeTeamId);
  const awayTeamStats = teamsData?.data?.find((t: any) => t.id === awayTeamId);

  // Scaling system similar to Form Guide
  const { scale, px } = useMemo(() => {
    if (!width || !height) {
      return {
        scale: 1,
        px: (value: number) => value,
      };
    }

    const baseWidth = 600;
    const baseHeight = 800;
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

  // Responsive breakpoints
  const isCompact = width < 400 || height < 500;
  const isVeryCompact = width < 320 || height < 400;
  const isMini = width < 240 || height < 300;

  // Handle refresh of data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/admin/update/all`, { 
        method: 'POST' 
      });

      if (response.ok) {
        await refetch();
        toast({
          title: "Data refreshed",
          description: "H2H data has been updated successfully.",
        });
      } else {
        throw new Error('Failed to refresh data');
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update H2H data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const palettes = {
    classic: {
      primary: '#C8102E',
      secondary: '#0891A8',
      accent: '#00FF87',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      background: 'rgba(0, 33, 71, 0.95)',
      cardBg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(200, 16, 46, 0.3)',
    },
    navy: {
      primary: '#002147',
      secondary: '#0891A8',
      accent: '#00FF87',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      background: 'rgba(0, 33, 71, 0.95)',
      cardBg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(8, 145, 168, 0.3)',
    },
    cream: {
      primary: '#8B7355',
      secondary: '#0891A8',
      accent: '#00FF87',
      text: '#2C2416',
      textSecondary: '#6B5D4F',
      background: 'rgba(232, 217, 197, 0.95)',
      cardBg: 'rgba(0, 0, 0, 0.05)',
      border: 'rgba(139, 115, 85, 0.3)',
    },
    dark: {
      primary: '#C8102E',
      secondary: '#0891A8',
      accent: '#00FF87',
      text: '#FFFFFF',
      textSecondary: '#999999',
      background: 'rgba(17, 17, 17, 0.95)',
      cardBg: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(200, 16, 46, 0.3)',
    }
  };

  const colors = palettes[colorPalette];

  if (isLoading) {
    return <OverlayLoadingSkeleton width={width} height={height} />;
  }

  if (error) {
    return (
      <OverlayErrorState
        error={error as Error}
        width={width}
        height={height}
      />
    );
  }

  if (!data?.data?.fixtures && !data?.data) {
    return (
      <OverlayEmptyState
        message="No head-to-head data available"
        width={width}
        height={height}
      />
    );
  }

  const h2hData = data.data;
  const allMatches: H2HMatch[] = h2hData?.fixtures || h2hData || [];
  const lastUpdated = data.lastUpdated || new Date().toISOString();

  const sortedMatches = [...allMatches].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const completedMatches = sortedMatches.filter(
    m => m.homeScore != null && m.awayScore != null
  );

  if (completedMatches.length === 0) {
    return (
      <OverlayEmptyState
        message="No previous matches found between these teams"
        width={width}
        height={height}
      />
    );
  }

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  completedMatches.forEach((match) => {
    if (match.homeScore > match.awayScore) {
      homeWins++;
    } else if (match.awayScore > match.homeScore) {
      awayWins++;
    } else {
      draws++;
    }
  });

  const totalMatches = completedMatches.length;
  const recentMatches = completedMatches.slice(0, isVeryCompact ? 3 : isMini ? 2 : 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  // Scaled sizes
  const padding = px(isMini ? 8 : isVeryCompact ? 12 : isCompact ? 16 : 24);
  const spacing = px(isMini ? 6 : isVeryCompact ? 8 : isCompact ? 12 : 16);
  const smallSpacing = px(isMini ? 3 : isVeryCompact ? 4 : 6);
  const borderRadius = px(isMini ? 4 : isVeryCompact ? 6 : 8);
  const borderWidth = isMini ? 1 : px(3);

  const titleSize = px(isMini ? 14 : isVeryCompact ? 18 : isCompact ? 22 : 28);
  const textSize = px(isMini ? 9 : isVeryCompact ? 11 : isCompact ? 13 : 16);
  const smallTextSize = px(isMini ? 7 : isVeryCompact ? 8 : isCompact ? 10 : 11);
  const badgeSize = px(isMini ? 50 : isVeryCompact ? 60 : isCompact ? 80 : 100);
  const vsSize = px(isMini ? 30 : isVeryCompact ? 40 : isCompact ? 50 : 60);
  const wdlSize = px(isMini ? 28 : isVeryCompact ? 35 : isCompact ? 45 : 55);

  const TeamBadge = ({ team, teamId, side }: { team?: TeamInfo; teamId: number; side: 'home' | 'away' }) => {
    const initials = team?.name?.substring(0, 2).toUpperCase() || (side === 'home' ? 'H' : 'A');
    const logo = team?.badge;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: px(6),
        flex: 1,
      }}>
        <div style={{
          width: badgeSize,
          height: badgeSize,
          backgroundColor: colors.cardBg,
          borderRadius: px(6),
          border: `${Math.max(1, px(2))}px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {logo ? (
            <img
              src={logo}
              alt={team?.name || `Team ${teamId}`}
              style={{
                width: '75%',
                height: '75%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && parent.lastChild) {
                  (parent.lastChild as HTMLElement).style.display = 'flex';
                }
              }}
              data-testid={`team-badge-${side}`}
            />
          ) : null}
          <div style={{
            display: logo ? 'none' : 'flex',
            fontSize: px(isMini ? 20 : isVeryCompact ? 28 : 36),
            fontWeight: 'bold',
            color: colors.text,
          }}>
            {initials}
          </div>
        </div>
      </div>
    );
  };

  const WDLIndicator = ({ type, count }: { type: 'W' | 'D' | 'L'; count: number }) => {
    const colorMap = {
      W: '#00FF87',
      D: '#F6EB61',
      L: '#FF4444',
    };

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: px(6),
        flexDirection: isMini ? 'column' : 'row',
      }}>
        <div style={{
          width: wdlSize,
          height: wdlSize,
          borderRadius: '50%',
          backgroundColor: colorMap[type],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: px(isMini ? 14 : isVeryCompact ? 18 : 24),
          fontWeight: 'bold',
          color: '#000',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          flexShrink: 0,
        }} data-testid={`wdl-badge-${type.toLowerCase()}`}>
          {count}
        </div>
        {!isMini && (
          <div style={{
            fontSize: smallTextSize,
            fontWeight: 'bold',
            color: colors.text,
            letterSpacing: '0.5px',
            lineHeight: 1,
          }}>
            {type === 'W' ? 'WINS' : type === 'D' ? 'DRAWS' : 'LOSSES'}
          </div>
        )}
      </div>
    );
  };

  const MatchHistoryCard = ({ match, index }: { match: H2HMatch; index: number }) => {
    const isHomeWin = match.homeScore > match.awayScore;
    const isAwayWin = match.awayScore > match.homeScore;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: px(4),
          padding: px(isMini ? 6 : 10),
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: px(4),
          flexShrink: 0,
        }}
        data-testid={`match-history-${index}`}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: px(6),
        }}>
          <div style={{
            flex: 1,
            fontSize: smallTextSize,
            color: colors.text,
            fontWeight: isHomeWin ? 'bold' : 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}>
            {match.homeTeam}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: px(4),
            padding: `${px(3)}px ${px(8)}px`,
            backgroundColor: isHomeWin ? 'rgba(0, 255, 135, 0.15)' : isAwayWin ? 'rgba(255, 68, 68, 0.15)' : 'rgba(246, 235, 97, 0.15)',
            borderRadius: px(3),
            fontSize: textSize,
            fontWeight: 'bold',
            color: colors.text,
            flexShrink: 0,
            lineHeight: 1,
          }}>
            <span>{match.homeScore}</span>
            <span style={{ opacity: 0.5 }}>-</span>
            <span>{match.awayScore}</span>
          </div>

          <div style={{
            flex: 1,
            fontSize: smallTextSize,
            color: colors.text,
            fontWeight: isAwayWin ? 'bold' : 'normal',
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}>
            {match.awayTeam}
          </div>
        </div>

        {!isMini && match.homeXg !== undefined && match.awayXg !== undefined && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: px(8),
            fontSize: px(7),
            color: colors.textSecondary,
            lineHeight: 1,
          }}>
            <span>xG: {match.homeXg.toFixed(1)}</span>
            <span style={{ opacity: 0.5 }}>-</span>
            <span>{match.awayXg.toFixed(1)}</span>
          </div>
        )}

        {!isMini && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: px(8),
            color: colors.textSecondary,
            gap: px(6),
            lineHeight: 1.2,
          }}>
            <span>{formatDate(match.date)}</span>
            {match.competition && !isVeryCompact && (
              <div style={{
                backgroundColor: `${colors.secondary}30`,
                padding: `${px(2)}px ${px(4)}px`,
                borderRadius: px(2),
                fontWeight: 'bold',
                fontSize: px(7),
              }}>
                {match.competition}
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: 'League Spartan, sans-serif',
        padding,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius,
        border: `${borderWidth}px solid ${colors.primary}`,
        boxSizing: 'border-box',
      }}
      data-testid="overlay-h2h"
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing,
        gap: smallSpacing,
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: titleSize,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: colors.accent,
          lineHeight: 1.1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: isMini ? 'nowrap' : 'normal',
        }} data-testid="overlay-title">
          {isMini ? 'H2H' : isVeryCompact ? 'HEAD-TO-HEAD' : 'HEAD-TO-HEAD RECORD'}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: px(4),
          flexShrink: 0,
        }}>
          {!isMini && (
            <div style={{
              fontSize: px(8),
              color: colors.textSecondary,
              textAlign: 'right',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }} data-testid="last-updated">
              {formatTimeAgo(lastUpdated)}
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: px(3),
              padding: px(4),
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.accent,
              transition: 'all 0.2s ease',
              opacity: isRefreshing ? 0.5 : 1,
            }}
            data-testid="button-refresh-h2h"
          >
            <RefreshCw
              size={px(isMini ? 10 : 14)}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing,
        marginBottom: spacing,
        padding: `${px(8)}px 0`,
        flexShrink: 0,
      }}>
        <TeamBadge team={homeTeam} teamId={homeTeamId} side="home" />

        <div style={{
          width: vsSize,
          height: vsSize,
          backgroundColor: colors.secondary,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: px(isMini ? 12 : isVeryCompact ? 16 : 20),
          fontWeight: 'bold',
          color: colors.text,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          flexShrink: 0,
          lineHeight: 1,
        }}>
          VS
        </div>

        <TeamBadge team={awayTeam} teamId={awayTeamId} side="away" />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: smallSpacing,
        marginBottom: spacing,
        padding: px(isMini ? 6 : 12),
        backgroundColor: colors.cardBg,
        borderRadius: px(6),
        border: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
        <WDLIndicator type="W" count={homeWins} />
        <WDLIndicator type="D" count={draws} />
        <WDLIndicator type="L" count={awayWins} />
      </div>

      {!isMini && (
        <div style={{
          marginBottom: px(6),
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: textSize,
            fontWeight: 'bold',
            color: colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            lineHeight: 1.2,
          }}>
            Recent Matches
          </div>
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: px(isMini ? 4 : 6),
        minHeight: 0,
      }}>
        {recentMatches.map((match, index) => (
          <MatchHistoryCard key={`${match.date}-${index}`} match={match} index={index} />
        ))}
      </div>

      {!isMini && totalMatches > 5 && (
        <div style={{
          marginTop: spacing,
          paddingTop: px(6),
          borderTop: `1px solid ${colors.border}`,
          fontSize: px(8),
          color: colors.textSecondary,
          textAlign: 'center',
          flexShrink: 0,
          lineHeight: 1.2,
        }}>
          Showing {recentMatches.length} of {totalMatches} total matches
        </div>
      )}
    </motion.div>
  );
}