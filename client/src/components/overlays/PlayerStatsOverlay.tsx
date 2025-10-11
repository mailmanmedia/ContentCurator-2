import { motion } from "framer-motion";
import { Activity, Target, TrendingUp, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";

interface PlayerStatsOverlayProps {
  playerId?: number;
  width: number;
  height: number;
  opacity?: number;
}

interface Player {
  id?: number;
  name: string;
  photo?: string;
  goals: number;
  assists: number;
  appearances?: number;
  minutes?: number;
  rating?: string;
}

export default function PlayerStatsOverlay({
  playerId,
  width,
  height,
  opacity = 0.92,
}: PlayerStatsOverlayProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch player statistics from database
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['player-stats-db', 40, 2025],
    queryFn: async () => {
      const response = await fetch('/api/database/players/top-scorers?season=2025&teamId=40&limit=50');
      if (!response.ok) throw new Error('Failed to fetch player stats');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Handle refresh of data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/update/players', { method: 'POST' });
      if (response.ok) {
        await refetch();
        toast({
          title: "Data refreshed",
          description: "Player statistics have been updated.",
        });
      } else {
        throw new Error('Failed to refresh data');
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update player stats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
        source="Player statistics"
      />
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <OverlayEmptyState
        message="No player statistics available"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const players: Player[] = data.data;
  const selectedPlayer = playerId 
    ? players.find((p: Player) => p.id === playerId) 
    : players[0];

  if (!selectedPlayer) {
    return (
      <OverlayEmptyState
        message="Player not found"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const goalsPer90 = selectedPlayer.minutes && selectedPlayer.minutes > 0 
    ? (selectedPlayer.goals / (selectedPlayer.minutes / 90)).toFixed(2) 
    : '0.00';
  
  const assistsPer90 = selectedPlayer.minutes && selectedPlayer.minutes > 0 
    ? (selectedPlayer.assists / (selectedPlayer.minutes / 90)).toFixed(2) 
    : '0.00';

  const goalsAndAssists = selectedPlayer.goals + selectedPlayer.assists;

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: `rgba(246, 235, 97, ${opacity})`,
        color: '#002147',
        fontFamily: 'League Spartan, sans-serif',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '8px',
        border: '3px solid #C8102E',
        position: 'relative',
      }}
      data-testid="overlay-player-stats"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {selectedPlayer.photo && (
          <img
            src={selectedPlayer.photo}
            alt={selectedPlayer.name}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '2px solid #C8102E',
              objectFit: 'cover',
            }}
            data-testid="player-photo"
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }} data-testid="player-name">
            {selectedPlayer.name}
          </div>
          <div style={{ fontSize: '12px', color: '#C8102E', marginTop: '2px' }}>
            Liverpool FC • 2024 Season
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
          data-testid="stat-goals"
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <Target size={14} style={{ display: 'inline', marginRight: '4px' }} />
            GOALS
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#C8102E' }}>
            {selectedPlayer.goals}
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
          data-testid="stat-assists"
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <Activity size={14} style={{ display: 'inline', marginRight: '4px' }} />
            ASSISTS
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#002147' }}>
            {selectedPlayer.assists}
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: 'rgba(0, 33, 71, 0.1)',
            padding: '8px',
            borderRadius: '6px',
            textAlign: 'center',
          }}
          data-testid="stat-g+a"
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            G+A
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00D977' }}>
            {goalsAndAssists}
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            backgroundColor: 'rgba(0, 33, 71, 0.1)',
            padding: '8px',
            borderRadius: '6px',
            textAlign: 'center',
          }}
          data-testid="stat-apps"
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            APPEARANCES
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#002147' }}>
            {selectedPlayer.appearances || 0}
          </div>
        </motion.div>
      </div>

      <div style={{
        backgroundColor: 'rgba(0, 33, 71, 0.05)',
        padding: '10px',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-around',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>GOALS/90</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#C8102E' }}>
            <TrendingUp size={12} style={{ display: 'inline', marginRight: '3px' }} />
            {goalsPer90}
          </div>
        </div>
        <div style={{ width: '1px', backgroundColor: 'rgba(0, 33, 71, 0.2)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>ASSISTS/90</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#002147' }}>
            <TrendingUp size={12} style={{ display: 'inline', marginRight: '3px' }} />
            {assistsPer90}
          </div>
        </div>
      </div>

      {/* Source Badge */}
      <OverlaySourceBadge source={data.source as any} timestamp={data.timestamp} />
    </motion.div>
  );
}
