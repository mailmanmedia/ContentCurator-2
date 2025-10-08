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
  // New filtering props
  competitionFilter?: number;
  seasonRange?: {
    from: number;
    to: number;
  };
  venueFilter?: 'all' | 'home' | 'away';
}

interface H2HResult {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
}

interface H2HData {
  results?: H2HResult[];
  statistics?: {
    homeWins: number;
    awayWins: number;
    draws: number;
    totalMatches: number;
  };
}

export default function H2HMatchCardOverlay({
  homeTeamId,
  awayTeamId,
  width,
  height,
  opacity = 0.95,
  competitionFilter,
  seasonRange,
  venueFilter = 'all',
}: H2HMatchCardOverlayProps) {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Build query params for filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('team1', homeTeamId.toString());
    params.append('team2', awayTeamId.toString());
    params.append('limit', '10');
    if (competitionFilter) params.append('competitionId', competitionFilter.toString());
    if (seasonRange?.from) params.append('seasonFrom', seasonRange.from.toString());
    if (seasonRange?.to) params.append('seasonTo', seasonRange.to.toString());
    if (venueFilter !== 'all') params.append('venueFilter', venueFilter);
    return params.toString();
  };

  // Fetch real H2H match results with filters
  const { data: h2hData, isLoading, refetch } = useQuery<H2HData>({
    queryKey: ['/api/fixtures/h2h', homeTeamId, awayTeamId, competitionFilter, seasonRange, venueFilter],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const h2hRes = await fetch(`/api/fixtures/h2h?${queryParams}`);
      if (h2hRes.ok) {
        const data = await h2hRes.json();
        setLastUpdated(new Date());
        return data;
      }
      
      // Fallback to cached data if API fails
      const res = await fetch(`/api/cached-stats/matchup/${homeTeamId}/${awayTeamId}`);
      if (!res.ok) throw new Error('Failed to fetch H2H data');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 24 * 60 * 60 * 1000,
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
        homeWins++;
      } else if (match.awayScore > match.homeScore) {
        awayWins++;
      } else {
        draws++;
      }
    });
    
    return { homeWins, awayWins, draws, totalMatches: results?.length || 0 };
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

  // Extract stats - use provided statistics or calculate from results
  const stats = h2hData.statistics || (h2hData.results ? calculateStats(h2hData.results) : { homeWins: 0, awayWins: 0, draws: 0, totalMatches: 0 });
  const { homeWins, awayWins, draws, totalMatches } = stats;

  // Calculate percentages
  const homeWinPct = totalMatches > 0 ? Math.round((homeWins / totalMatches) * 100) : 0;
  const awayWinPct = totalMatches > 0 ? Math.round((awayWins / totalMatches) * 100) : 0;
  const drawPct = totalMatches > 0 ? Math.round((draws / totalMatches) * 100) : 0;

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F6EB61' }}>
          HEAD-TO-HEAD
        </div>
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
          title="Refresh data"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
          >
            <RefreshCw size={11} />
          </motion.div>
        </motion.button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Home Team</div>
          <div style={{ fontSize: '12px', color: '#F6EB61', marginTop: '4px' }}>
            #{homeTeamId}
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F6EB61', padding: '0 16px' }}>
          VS
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Away Team</div>
          <div style={{ fontSize: '12px', color: '#F6EB61', marginTop: '4px' }}>
            #{awayTeamId}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(246, 235, 97, 0.3)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00FF87' }}>
              {homeWinPct}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>HOME WIN</div>
            <div style={{ fontSize: '10px', color: '#888888' }}>({homeWins})</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F6EB61' }}>
              {drawPct}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>DRAW</div>
            <div style={{ fontSize: '10px', color: '#888888' }}>({draws})</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF4444' }}>
              {awayWinPct}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>AWAY WIN</div>
            <div style={{ fontSize: '10px', color: '#888888' }}>({awayWins})</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Trophy size={12} color="#F6EB61" />
            <span>H2H: {homeWins}W-{draws}D-{awayWins}L</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            <span>{formatTimestamp(lastUpdated)}</span>
          </div>
        </div>

        {totalMatches > 0 && (
          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: '#CCCCCC',
            textAlign: 'center'
          }}>
            Based on {totalMatches} match{totalMatches !== 1 ? 'es' : ''}
            {competitionFilter && ' (Filtered)'}
            {venueFilter !== 'all' && ` (${venueFilter} only)`}
          </div>
        )}
      </div>
    </motion.div>
  );
}
