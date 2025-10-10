import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
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
}

interface TeamInfo {
  id: number;
  name: string;
  badge: string | null;
  code?: string;
}

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
  
  // Fetch H2H data from database
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['h2h-db', homeTeamId, awayTeamId],
    queryFn: async () => {
      const response = await fetch(`/api/database/head-to-head/${homeTeamId}/${awayTeamId}?limit=30`);
      if (!response.ok) throw new Error('Failed to fetch H2H data');
      return response.json();
    },
    enabled: !!homeTeamId && !!awayTeamId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const { data: homeTeam } = useTeamBadge(homeTeamId);
  const { data: awayTeam } = useTeamBadge(awayTeamId);
  
  // Handle refresh of data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger database update for these teams
      const response = await fetch(`/api/admin/update/all`, { 
        method: 'POST' 
      });
      
      if (response.ok) {
        // Refetch data after successful update
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
    return <OverlayLoadingSkeleton width={`${width}%`} height={`${height}px`} />;
  }

  if (error) {
    return (
      <OverlayErrorState
        error={error}
        onRetry={refetch}
        width={`${width}%`}
        height={`${height}px`}
        source="Head-to-head data"
      />
    );
  }

  if (!data?.data?.fixtures && !data?.data) {
    return (
      <OverlayEmptyState
        message="No head-to-head data available"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  // Extract fixtures from database response
  const h2hData = data.data;
  const allMatches: H2HMatch[] = h2hData?.fixtures || h2hData || [];
  const lastUpdated = data.lastUpdated || new Date().toISOString();

  // Sort matches by date (most recent first)
  const sortedMatches = [...allMatches].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Filter out upcoming/unplayed matches (only include completed matches)
  const completedMatches = sortedMatches.filter(
    m => m.homeScore != null && m.awayScore != null
  );

  if (completedMatches.length === 0) {
    return (
      <OverlayEmptyState
        message="No previous matches found between these teams"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  // Calculate W-D-L stats from completed matches only
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
  const recentMatches = completedMatches.slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TeamBadge = ({ team, teamId, side }: { team?: TeamInfo; teamId: number; side: 'home' | 'away' }) => {
    const initials = team?.name?.substring(0, 2).toUpperCase() || (side === 'home' ? 'H' : 'A');
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
      }}>
        <div style={{
          width: 'clamp(80px, 12vw, 120px)',
          height: 'clamp(80px, 12vw, 120px)',
          backgroundColor: colors.cardBg,
          borderRadius: '8px',
          border: `2px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {team?.badge ? (
            <img
              src={team.badge}
              alt={team.name}
              style={{
                width: '75%',
                height: '75%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                }
              }}
              data-testid={`team-badge-${side}`}
            />
          ) : null}
          <div style={{
            display: team?.badge ? 'none' : 'flex',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 'bold',
            color: colors.text,
          }}>
            {initials}
          </div>
        </div>
        <div style={{
          fontSize: 'clamp(12px, 1.8vw, 16px)',
          fontWeight: 'bold',
          textAlign: 'center',
          color: colors.text,
          maxWidth: '140px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }} data-testid={`team-name-${side}`}>
          {team?.name || `Team ${teamId}`}
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
        gap: '8px',
      }}>
        <div style={{
          width: 'clamp(40px, 6vw, 60px)',
          height: 'clamp(40px, 6vw, 60px)',
          borderRadius: '50%',
          backgroundColor: colorMap[type],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(18px, 3vw, 28px)',
          fontWeight: 'bold',
          color: '#000',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }} data-testid={`wdl-badge-${type.toLowerCase()}`}>
          {count}
        </div>
        <div style={{
          fontSize: 'clamp(12px, 1.8vw, 16px)',
          fontWeight: 'bold',
          color: colors.text,
          letterSpacing: '0.5px',
        }}>
          {type === 'W' ? 'WINS' : type === 'D' ? 'DRAWS' : 'LOSSES'}
        </div>
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
        transition={{ delay: index * 0.1 }}
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: '6px',
          padding: 'clamp(8px, 1.5vw, 12px)',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
        data-testid={`match-history-${index}`}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            flex: 1,
            fontSize: 'clamp(11px, 1.5vw, 13px)',
            color: colors.text,
            fontWeight: isHomeWin ? 'bold' : 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {match.homeTeam}
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            backgroundColor: isHomeWin ? 'rgba(0, 255, 135, 0.15)' : isAwayWin ? 'rgba(255, 68, 68, 0.15)' : 'rgba(246, 235, 97, 0.15)',
            borderRadius: '4px',
            fontSize: 'clamp(13px, 2vw, 16px)',
            fontWeight: 'bold',
            color: colors.text,
          }}>
            <span>{match.homeScore}</span>
            <span style={{ opacity: 0.5 }}>-</span>
            <span>{match.awayScore}</span>
          </div>
          
          <div style={{
            flex: 1,
            fontSize: 'clamp(11px, 1.5vw, 13px)',
            color: colors.text,
            fontWeight: isAwayWin ? 'bold' : 'normal',
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {match.awayTeam}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'clamp(9px, 1.2vw, 11px)',
          color: colors.textSecondary,
          gap: '8px',
        }}>
          <span>{formatDate(match.date)}</span>
          {match.competition && (
            <div style={{
              backgroundColor: `${colors.secondary}30`,
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 'bold',
              fontSize: 'clamp(8px, 1.1vw, 10px)',
            }}>
              {match.competition}
            </div>
          )}
        </div>
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
        padding: 'clamp(16px, 3vw, 24px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        border: `3px solid ${colors.primary}`,
      }}
      data-testid="overlay-h2h"
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'clamp(12px, 2vw, 16px)',
      }}>
        <div style={{
          fontSize: 'clamp(18px, 3.5vw, 28px)',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: colors.accent,
        }} data-testid="overlay-title">
          HEAD-TO-HEAD RECORD
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            fontSize: 'clamp(8px, 1.1vw, 10px)',
            color: colors.textSecondary,
            textAlign: 'right',
          }} data-testid="last-updated">
            Data as of {formatDistanceToNow(new Date(lastUpdated))} ago
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              padding: 'clamp(4px, 0.8vw, 6px)',
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
              size={parseInt('clamp(12px, 2vw, 16px)'.match(/\d+/)?.[0] || '14')}
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
        gap: 'clamp(20px, 4vw, 40px)',
        marginBottom: 'clamp(16px, 2.5vw, 20px)',
        padding: 'clamp(12px, 2vw, 16px) 0',
      }}>
        <TeamBadge team={homeTeam} teamId={homeTeamId} side="home" />
        
        <div style={{
          width: 'clamp(50px, 8vw, 70px)',
          height: 'clamp(50px, 8vw, 70px)',
          backgroundColor: colors.secondary,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(16px, 2.5vw, 22px)',
          fontWeight: 'bold',
          color: colors.text,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          VS
        </div>

        <TeamBadge team={awayTeam} teamId={awayTeamId} side="away" />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 'clamp(12px, 2vw, 16px)',
        marginBottom: 'clamp(16px, 2.5vw, 20px)',
        padding: 'clamp(12px, 2vw, 16px)',
        backgroundColor: colors.cardBg,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
      }}>
        <WDLIndicator type="W" count={homeWins} />
        <WDLIndicator type="D" count={draws} />
        <WDLIndicator type="L" count={awayWins} />
      </div>

      <div style={{
        marginBottom: 'clamp(8px, 1.5vw, 12px)',
      }}>
        <div style={{
          fontSize: 'clamp(13px, 2vw, 16px)',
          fontWeight: 'bold',
          color: colors.accent,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
        }}>
          Recent Matches
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(6px, 1vw, 8px)',
      }}>
        {recentMatches.map((match, index) => (
          <MatchHistoryCard key={index} match={match} index={index} />
        ))}
      </div>

      {totalMatches > 5 && (
        <div style={{
          marginTop: 'clamp(8px, 1.5vw, 12px)',
          paddingTop: 'clamp(8px, 1.5vw, 12px)',
          borderTop: `1px solid ${colors.border}`,
          fontSize: 'clamp(9px, 1.2vw, 11px)',
          color: colors.textSecondary,
          textAlign: 'center',
        }}>
          Showing 5 of {totalMatches} total matches
        </div>
      )}
    </motion.div>
  );
}
