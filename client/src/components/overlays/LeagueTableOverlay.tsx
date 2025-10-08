import { motion } from "framer-motion";
import { Trophy, TrendingDown } from "lucide-react";
import { useLeagueTable } from "@/hooks/useFootballData";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";

interface LeagueTableOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  highlightTeamId?: number;
  maxTeams?: number;
  showFullTable?: boolean;
  teamCount?: 5 | 10 | 20 | 'full';
}

interface TeamStanding {
  position: number;
  team: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string[];
}

export default function LeagueTableOverlay({
  width,
  height,
  opacity = 0.92,
  highlightTeamId = 40,
  maxTeams,
  showFullTable,
  teamCount = 10,
}: LeagueTableOverlayProps) {
  const { data, isLoading, error, refetch } = useLeagueTable();
  
  // Determine effective team count
  let effectiveTeamCount: number | 'full';
  if (showFullTable !== undefined) {
    effectiveTeamCount = showFullTable ? 'full' : (maxTeams || 10);
  } else if (maxTeams !== undefined) {
    effectiveTeamCount = maxTeams;
  } else {
    effectiveTeamCount = teamCount;
  }

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
        source="League table data"
      />
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <OverlayEmptyState
        message="No league table data available"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const standings: TeamStanding[] = data.data;
  
  // Apply team count filtering
  const displayTeams = effectiveTeamCount === 'full' 
    ? standings 
    : standings.slice(0, effectiveTeamCount);

  const getPositionColor = (position: number) => {
    if (position <= 4) return '#00FF87';
    if (position === 5) return '#4CA9E0';
    if (position === 6) return '#F6EB61';
    if (position >= 18) return '#FF4444';
    return '#FFFFFF';
  };

  const getPositionIcon = (position: number) => {
    if (position <= 4) return <Trophy size={12} color="#00FF87" />;
    if (position >= 18) return <TrendingDown size={12} color="#FF4444" />;
    return null;
  };

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
        position: 'relative',
      }}
      data-testid="overlay-league-table"
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
        {displayTeams.map((team, index) => {
          const isLiverpool = team.team.toLowerCase().includes('liverpool');
          
          return (
            <motion.div
              key={team.position}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '30px 1fr 30px 30px 30px 35px 40px',
                gap: '8px',
                padding: '8px 4px',
                backgroundColor: isLiverpool
                  ? 'rgba(200, 16, 46, 0.3)'
                  : index % 2 === 0
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'transparent',
                borderLeft: isLiverpool
                  ? '3px solid #C8102E'
                  : '3px solid transparent',
                fontSize: '12px',
                alignItems: 'center',
                borderRadius: '4px',
              }}
              data-testid={`table-row-${team.position}`}
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
                fontWeight: isLiverpool ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {team.team}
              </span>
              <span style={{ textAlign: 'center', opacity: 0.8 }}>{team.played}</span>
              <span style={{ textAlign: 'center', color: '#00FF87' }}>{team.won}</span>
              <span style={{ textAlign: 'center', color: '#F6EB61' }}>{team.drawn}</span>
              <span style={{
                textAlign: 'center',
                color: team.goalDifference > 0 ? '#00FF87' : team.goalDifference < 0 ? '#FF4444' : '#FFFFFF',
              }}>
                {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
              </span>
              <span style={{
                textAlign: 'center',
                fontWeight: 'bold',
                color: isLiverpool ? '#F6EB61' : '#FFFFFF',
              }}>
                {team.points}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div style={{
        borderTop: '1px solid rgba(246, 235, 97, 0.3)',
        paddingTop: '8px',
        marginTop: '8px',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        fontSize: '9px',
        color: '#CCCCCC',
      }}>
        <span><span style={{ color: '#00FF87' }}>●</span> UCL</span>
        <span><span style={{ color: '#4CA9E0' }}>●</span> UEL</span>
        <span><span style={{ color: '#F6EB61' }}>●</span> UECL</span>
        <span><span style={{ color: '#FF4444' }}>●</span> REL</span>
      </div>

      {/* Source Badge */}
      <OverlaySourceBadge source={data.source as any} timestamp={data.timestamp} />
    </motion.div>
  );
}
