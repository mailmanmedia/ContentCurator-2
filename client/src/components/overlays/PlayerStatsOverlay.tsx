import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Target, TrendingUp } from "lucide-react";

interface PlayerStatsOverlayProps {
  playerId: number;
  width: number;
  height: number;
  opacity?: number;
}

export default function PlayerStatsOverlay({
  playerId,
  width,
  height,
  opacity = 0.92,
}: PlayerStatsOverlayProps) {
  const { data: playerData, isLoading } = useQuery({
    queryKey: ['/api/analytics/player-metrics', playerId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/player-metrics/${playerId}`);
      if (!res.ok) throw new Error('Failed to fetch player metrics');
      return res.json();
    },
  });

  if (isLoading || !playerData) {
    return (
      <div
        style={{
          width: `${width}%`,
          height: `${height}px`,
          backgroundColor: `rgba(246, 235, 97, ${opacity})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#002147',
          fontFamily: 'League Spartan, sans-serif',
          fontSize: '16px',
        }}
      >
        Loading...
      </div>
    );
  }

  const { player, metrics, stats } = playerData;

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: `${width}%`,
        height: `${height}px`,
        backgroundColor: `rgba(246, 235, 97, ${opacity})`,
        color: '#002147',
        fontFamily: 'League Spartan, sans-serif',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '8px',
        border: '3px solid #C8102E',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {player.photo && (
          <img
            src={player.photo}
            alt={player.name}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '2px solid #C8102E',
              objectFit: 'cover',
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{player.name}</div>
          <div style={{ fontSize: '12px', color: '#C8102E', marginTop: '2px' }}>
            #{player.number} • {player.position.join(', ')}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            backgroundColor: 'rgba(0, 33, 71, 0.1)',
            padding: '8px',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <Target size={12} style={{ display: 'inline', marginRight: '4px' }} />
            GOALS/90
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#C8102E' }}>
            {metrics.goalsPer90?.value?.toFixed(2) || '0.00'}
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: 'rgba(0, 33, 71, 0.1)',
            padding: '8px',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <Activity size={12} style={{ display: 'inline', marginRight: '4px' }} />
            ASSISTS/90
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#C8102E' }}>
            {metrics.assistsPer90?.value?.toFixed(2) || '0.00'}
          </div>
        </motion.div>
      </div>

      <div style={{
        borderTop: '2px solid rgba(0, 33, 71, 0.2)',
        paddingTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#666' }}>Creativity Index</span>
          <span style={{ fontWeight: 'bold', color: '#002147' }}>
            {metrics.creativityIndex?.value?.toFixed(1) || '0.0'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#666' }}>Involvement Score</span>
          <span style={{ fontWeight: 'bold', color: '#002147' }}>
            {metrics.involvementScore?.value?.toFixed(1) || '0.0'}%
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#666' }}>Impact Rating</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} color="#00FF87" />
            <span style={{ fontWeight: 'bold', color: '#00FF87' }}>
              {metrics.impactRating?.value?.toFixed(1) || '0.0'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
