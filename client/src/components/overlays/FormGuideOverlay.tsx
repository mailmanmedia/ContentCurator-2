import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";

// Mailman Media Color Palettes
export const COLOR_PALETTES = {
  "classic": {
    name: 'Classic LFC',
    background: '#C8102E',
    border: '#002147',
    text: '#FFFFFF',
    accent: '#F6EB61',
    resultColors: { "W": '#00FF87', "D": '#F6EB61', "L": '#FF4444' }
  },
  "navy": {
    name: 'Navy Professional',
    background: '#002147',
    border: '#C8102E',
    text: '#F5F1E9',
    accent: '#4CA9E0',
    resultColors: { "W": '#00FF87', "D": '#4CA9E0', "L": '#FF4444' }
  },
  "cream": {
    name: 'Cream Elegant',
    background: '#F5F1E9',
    border: '#002147',
    text: '#002147',
    accent: '#C8102E',
    resultColors: { "W": '#00D977', "D": '#F6EB61', "L": '#FF4444' }
  },
  "dark": {
    name: 'Dark Mode',
    background: '#0A0A0A',
    border: '#C8102E',
    text: '#FFFFFF',
    accent: '#F6EB61',
    resultColors: { "W": '#00FF87', "D": '#F6EB61', "L": '#FF4444' }
  }
} as const;

export type ColorPaletteKey = keyof typeof COLOR_PALETTES;

interface FormGuideOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  layout?: 'horizontal' | 'vertical';
  teamId?: number;
  colorPalette?: ColorPaletteKey;
  titleSize?: number;
  circleSize?: number;
  labelSize?: number;
}

export default function FormGuideOverlay({
  width,
  height,
  opacity = 0.9,
  layout = 'horizontal',
  teamId = 40,
  colorPalette = 'classic',
  titleSize = 20,
  circleSize = 60,
  labelSize = 14,
}: FormGuideOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch real match results instead of just stats
  const { data: matchResults, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['/api/fixtures/results', teamId],
    queryFn: async () => {
      const res = await fetch(`/api/fixtures/results?teamId=${teamId}&limit=5`);
      if (!res.ok) {
        // Fallback to cached stats
        const fallback = await fetch(`/api/cached-stats/team/${teamId}/39`);
        if (!fallback.ok) throw new Error('Failed to fetch match results');
        return fallback.json();
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 24 * 60 * 60 * 1000,
  });

  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['/api/cached-stats/team', teamId, 39],
    queryFn: async () => {
      const res = await fetch(`/api/cached-stats/team/${teamId}/39`);
      if (!res.ok) throw new Error('Failed to fetch team stats');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 24 * 60 * 60 * 1000, // Auto-refresh daily
  });

  // Update timestamp when data changes
  useEffect(() => {
    if (metrics) {
      setLastUpdated(new Date());
    }
  }, [metrics]);

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

  if (isLoading || !metrics) {
    return (
      <div
        style={{
          width: `${width}%`,
          height: `${height}px`,
          backgroundColor: palette.background,
          opacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: palette.text,
          fontFamily: 'League Spartan, sans-serif',
          fontSize: '14px',
          border: `3px solid ${palette.border}`,
          borderRadius: '8px',
          boxSizing: 'border-box',
        }}
      >
        Loading...
      </div>
    );
  }

  const formString = metrics.statistics?.form || '';
  const formArray = formString.split('').slice(0, 5);

  const getResultColor = (result: string) => {
    return palette.resultColors[result as 'W' | 'D' | 'L'] || '#CCCCCC';
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'W': return 'WIN';
      case 'D': return 'DRAW';
      case 'L': return 'LOSS';
      default: return result;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        width: `${width}%`,
        height: `${height}px`,
        backgroundColor: palette.background,
        opacity,
        color: palette.text,
        fontFamily: 'League Spartan, sans-serif',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '8px',
        border: `3px solid ${palette.border}`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: `${titleSize}px`, fontWeight: 'bold', color: palette.accent, marginBottom: '10px', letterSpacing: '0.5px' }}>
        RECENT FORM
      </div>

      <div style={{
        display: 'flex',
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        gap: layout === 'horizontal' ? '10px' : '8px',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {formArray.map((result: string, index: number) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            style={{
              display: 'flex',
              flexDirection: layout === 'horizontal' ? 'column' : 'row',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                borderRadius: '50%',
                backgroundColor: getResultColor(result),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${circleSize * 0.4}px`,
                fontWeight: 'bold',
                color: '#000000',
                border: '2px solid rgba(0,0,0,0.1)',
              }}
            >
              {result}
            </div>
            <div style={{
              fontSize: `${labelSize}px`,
              color: palette.text,
              opacity: 0.8,
              textAlign: 'center',
              fontWeight: 500,
            }}>
              {getResultText(result)}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{
        borderTop: `1px solid ${palette.accent}40`,
        paddingTop: '10px',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: palette.text, opacity: 0.7 }}>
            <Clock size={12} />
            <span>Updated: {formatTimestamp(lastUpdated)}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              background: 'transparent',
              border: `1px solid ${palette.accent}40`,
              borderRadius: '4px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: palette.accent,
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
            Refresh
          </motion.button>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 500,
        }}>
          <span>Last 5 Matches</span>
          <span style={{ color: palette.accent, fontWeight: 'bold' }}>
            {formArray.filter((r: string) => r === 'W').length}W-
            {formArray.filter((r: string) => r === 'D').length}D-
            {formArray.filter((r: string) => r === 'L').length}L
          </span>
        </div>
      </div>
    </motion.div>
  );
}
