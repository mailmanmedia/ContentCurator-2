import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface LeagueTableOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  highlightTeamId?: number;
  maxTeams?: number;
  showFullTable?: boolean;
}

interface TeamStanding {
  position: number;
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string;
  logo?: string;
}

export default function LeagueTableOverlay({
  width,
  height,
  opacity = 0.92,
  highlightTeamId = 40, // Liverpool by default
  maxTeams = 10,
  showFullTable = false,
}: LeagueTableOverlayProps) {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: tableData, isLoading, refetch } = useQuery({
    queryKey: ['/api/football/standings/39/2024'], // Premier League 2024
    queryFn: async () => {
      const res = await fetch('/api/football/standings/39/2024');
      if (!res.ok) throw new Error('Failed to fetch league table');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 24 * 60 * 60 * 1000, // Auto-refresh daily
  });

  // Update timestamp when data changes
  useEffect(() => {
    if (tableData) {
      setLastUpdated(new Date());
    }
  }, [tableData]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getPositionColor = (position: number) => {
    if (position <= 4) return '#00FF87'; // Champions League
    if (position === 5) return '#4CA9E0'; // Europa League
    if (position === 6) return '#F6EB61'; // Conference League
    if (position >= 18) return '#FF4444'; // Relegation
    return '#FFFFFF';
  };

  const getPositionIcon = (position: number) => {
    if (position <= 4) return <Trophy size={12} color="#00FF87" />;
    if (position >= 18) return <TrendingDown size={12} color="#FF4444" />;
    return null;
  };

  if (isLoading || !tableData) {
    return (
      <div
        style={{
          width: `${width}%`,
          height: `${height}px`,
          backgroundColor: `rgba(0, 33, 71, ${opacity})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontFamily: 'League Spartan, sans-serif',
          fontSize: '14px',
          borderRadius: '8px',
          border: '2px solid #C8102E',
        }}
      >
        Loading league table...
      </div>
    );
  }

  const standings: TeamStanding[] = tableData.standings || [];
  const displayTeams = showFullTable ? standings : standings.slice(0, maxTeams);
  const currentMatchday = tableData.matchday || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        width: `${width}%`,
        height: `${height}px`,
        backgroundColor: `rgba(0, 33, 71, ${opacity})`,
        color: '#FFFFFF',
        fontFamily: 'League Spartan, sans-serif',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        border: '2px solid #C8102E',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F6EB61' }}>
          PREMIER LEAGUE TABLE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#CCCCCC' }}>
            Matchday {currentMatchday}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              background: 'transparent',
              border: '1px solid #F6EB6140',
              borderRadius: '4px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#F6EB61',
              opacity: isRefreshing ? 0.5 : 1,
              fontSize: '11px',
            }}
            title="Refresh table"
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
            >
              <RefreshCw size={11} />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr 30px 30px 30px 35px 40px',
        gap: '8px',
        padding: '6px 0',
        borderBottom: '1px solid rgba(246, 235, 97, 0.3)',
        fontSize: '10px',
        color: '#CCCCCC',
        fontWeight: 'bold',
      }}>
        <span>POS</span>
        <span>TEAM</span>
        <span style={{ textAlign: 'center' }}>P</span>
        <span style={{ textAlign: 'center' }}>W</span>
        <span style={{ textAlign: 'center' }}>D</span>
        <span style={{ textAlign: 'center' }}>GD</span>
        <span style={{ textAlign: 'center' }}>PTS</span>
      </div>

      {/* Table Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginTop: '8px',
      }}>
        {displayTeams.map((team, index) => (
          <motion.div
            key={team.teamId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '30px 1fr 30px 30px 30px 35px 40px',
              gap: '8px',
              padding: '8px 4px',
              backgroundColor: team.teamId === highlightTeamId
                ? 'rgba(200, 16, 46, 0.3)'
                : index % 2 === 0
                ? 'rgba(255, 255, 255, 0.03)'
                : 'transparent',
              borderLeft: team.teamId === highlightTeamId
                ? '3px solid #C8102E'
                : '3px solid transparent',
              fontSize: '12px',
              alignItems: 'center',
              borderRadius: '4px',
            }}
          >
            <span style={{
              color: getPositionColor(team.position),
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}>
              {team.position}
              {getPositionIcon(team.position)}
            </span>
            <span style={{
              fontWeight: team.teamId === highlightTeamId ? 'bold' : 'normal',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {team.teamName}
            </span>
            <span style={{ textAlign: 'center', opacity: 0.8 }}>{team.matchesPlayed}</span>
            <span style={{ textAlign: 'center', color: '#00FF87' }}>{team.wins}</span>
            <span style={{ textAlign: 'center', color: '#F6EB61' }}>{team.draws}</span>
            <span style={{
              textAlign: 'center',
              color: team.goalDifference > 0 ? '#00FF87' : team.goalDifference < 0 ? '#FF4444' : '#FFFFFF',
            }}>
              {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
            </span>
            <span style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: team.teamId === highlightTeamId ? '#F6EB61' : '#FFFFFF',
            }}>
              {team.points}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Footer with Timestamp */}
      <div style={{
        borderTop: '1px solid rgba(246, 235, 97, 0.3)',
        paddingTop: '8px',
        marginTop: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
        color: '#CCCCCC',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={10} />
          <span>Updated: {formatTimestamp(lastUpdated)}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '9px' }}>
          <span><span style={{ color: '#00FF87' }}>●</span> UCL</span>
          <span><span style={{ color: '#4CA9E0' }}>●</span> UEL</span>
          <span><span style={{ color: '#F6EB61' }}>●</span> UECL</span>
          <span><span style={{ color: '#FF4444' }}>●</span> REL</span>
        </div>
      </div>
    </motion.div>
  );
}