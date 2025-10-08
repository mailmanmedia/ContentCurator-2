import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, Clock, Trophy } from "lucide-react";
import { useState, useEffect } from "react";

interface H2HMatchCardOverlayProps {
  homeTeamId: number;
  awayTeamId: number;
  width: number;
  height: number;
  opacity?: number;
}

interface H2HResult {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
}

export default function H2HMatchCardOverlay({
  homeTeamId,
  awayTeamId,
  width,
  height,
  opacity = 0.95,
}: H2HMatchCardOverlayProps) {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real H2H match results - show actual scores
  const { data: h2hData, isLoading, refetch } = useQuery({
    queryKey: ['/api/fixtures/h2h', homeTeamId, awayTeamId],
    queryFn: async () => {
      // Try to get real H2H results first
      const h2hRes = await fetch(`/api/fixtures/h2h?team1=${homeTeamId}&team2=${awayTeamId}&limit=10`);
      if (h2hRes.ok) {
        const data = await h2hRes.json();
        setLastUpdated(new Date());
        return data;
      }
      
      // Fallback to prediction/cached data
      const res = await fetch(`/api/cached-stats/matchup/${homeTeamId}/${awayTeamId}`);
      if (!res.ok) throw new Error('Failed to fetch H2H data');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 24 * 60 * 60 * 1000, // Daily auto-refresh
  });

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

  // Calculate H2H stats from real match data
  const calculateStats = (results: H2HResult[]) => {
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    
    results?.forEach((match) => {
      if (match.homeScore > match.awayScore) {
        if (match.homeTeam.includes('Liverpool') || match.homeTeam.includes(homeTeamId.toString())) {
          homeWins++;
        } else {
          awayWins++;
        }
      } else if (match.awayScore > match.homeScore) {
        if (match.awayTeam.includes('Liverpool') || match.awayTeam.includes(awayTeamId.toString())) {
          homeWins++;
        } else {
          awayWins++;
        }
      } else {
        draws++;
      }
    });
    
    return { homeWins, awayWins, draws };
  };

  if (isLoading || !h2hData) {
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
          fontSize: '16px',
        }}
      >
        Loading...
      </div>
    );
  }

  const { fixture, prediction: pred, context } = prediction;
  const { matchOutcome } = pred;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: `${width}%`,
        height: `${height}px`,
        backgroundColor: `rgba(0, 33, 71, ${opacity})`,
        color: '#FFFFFF',
        fontFamily: 'League Spartan, sans-serif',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '8px',
        border: '2px solid #C8102E',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F6EB61', marginBottom: '8px' }}>
        HEAD-TO-HEAD PREDICTION
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fixture.homeTeam.name}</div>
          <div style={{ fontSize: '12px', color: '#F6EB61', marginTop: '4px' }}>
            {context.liverpoolForm}
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F6EB61', padding: '0 16px' }}>
          VS
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fixture.awayTeam.name}</div>
          <div style={{ fontSize: '12px', color: '#F6EB61', marginTop: '4px' }}>
            {context.opponentForm}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(246, 235, 97, 0.3)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00FF87' }}>
              {Math.round(matchOutcome.winProbability * 100)}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>WIN</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F6EB61' }}>
              {Math.round(matchOutcome.drawProbability * 100)}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>DRAW</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF4444' }}>
              {Math.round(matchOutcome.lossProbability * 100)}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>LOSS</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px' }}>
          <div>
            H2H: {context.h2hRecord.wins}W-{context.h2hRecord.draws}D-{context.h2hRecord.losses}L
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {pred.momentumDifference > 0 ? (
              <>
                <TrendingUp size={12} color="#00FF87" />
                <span style={{ color: '#00FF87' }}>Momentum</span>
              </>
            ) : (
              <>
                <TrendingDown size={12} color="#FF4444" />
                <span style={{ color: '#FF4444' }}>Momentum</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
