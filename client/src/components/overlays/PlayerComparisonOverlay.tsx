import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { COLOR_PALETTES, type ColorPaletteKey } from "./FormGuideOverlay";

interface PlayerComparisonOverlayProps {
  player1Id: number;
  player2Id: number;
  width: number;
  height: number;
  opacity?: number;
  statCategories?: string[];
  viewMode?: 'sideBySide' | 'radar' | 'bars';
  season?: number;
  competition?: number;
  colorPalette?: ColorPaletteKey;
}

interface Player {
  id: number;
  name: string;
  photo?: string;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
  rating?: string;
}

interface PlayersData {
  players: Player[];
  season: number;
  teamId: number;
  teamName: string;
}

export default function PlayerComparisonOverlay({
  player1Id,
  player2Id,
  width,
  height,
  opacity = 0.9,
  statCategories = ['goals', 'assists', 'appearances'],
  viewMode = 'sideBySide',
  season,
  competition,
  colorPalette = 'classic',
}: PlayerComparisonOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: playersData, isLoading, refetch } = useQuery<PlayersData>({
    queryKey: ['/api/football/players/liverpool/top-scorers'],
    queryFn: async () => {
      const res = await fetch('/api/football/players/liverpool/top-scorers');
      if (!res.ok) throw new Error('Failed to fetch player data');
      const data = await res.json();
      setLastUpdated(new Date());
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 24 * 60 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

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

  if (isLoading || !playersData) {
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
        Loading player data...
      </div>
    );
  }

  const player1 = playersData.players.find(p => p.id === player1Id);
  const player2 = playersData.players.find(p => p.id === player2Id);

  if (!player1 || !player2) {
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
        Player data not found (IDs: {player1Id}, {player2Id})
      </div>
    );
  }

  const getStatValue = (player: Player, stat: string): number => {
    switch (stat) {
      case 'goals': return player.goals;
      case 'assists': return player.assists;
      case 'appearances': return player.appearances;
      case 'minutes': return player.minutes;
      case 'goalsPerGame': return player.appearances > 0 ? Number((player.goals / player.appearances).toFixed(2)) : 0;
      case 'assistsPerGame': return player.appearances > 0 ? Number((player.assists / player.appearances).toFixed(2)) : 0;
      default: return 0;
    }
  };

  const getStatLabel = (stat: string): string => {
    switch (stat) {
      case 'goals': return 'Goals';
      case 'assists': return 'Assists';
      case 'appearances': return 'Apps';
      case 'minutes': return 'Minutes';
      case 'goalsPerGame': return 'Goals/Game';
      case 'assistsPerGame': return 'Assists/Game';
      default: return stat;
    }
  };

  const compareStats = (stat: string): 'player1' | 'player2' | 'draw' => {
    const val1 = getStatValue(player1, stat);
    const val2 = getStatValue(player2, stat);
    if (val1 > val2) return 'player1';
    if (val2 > val1) return 'player2';
    return 'draw';
  };

  const renderSideBySide = () => (
    <div style={{
      display: 'flex',
      gap: '12px',
      flex: 1,
      overflow: 'hidden',
    }}>
      {[player1, player2].map((player, idx) => (
        <motion.div
          key={player.id}
          initial={{ x: idx === 0 ? -50 : 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            flex: 1,
            backgroundColor: `${palette.border}20`,
            borderRadius: '8px',
            padding: '12px',
            border: `2px solid ${palette.border}40`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
          data-testid={`player-card-${idx + 1}`}
        >
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: palette.text,
            textAlign: 'center',
            marginBottom: '4px',
          }}>
            {player.name}
          </div>

          {player.photo && (
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid ${palette.accent}`,
            }}>
              <img 
                src={player.photo} 
                alt={player.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            {statCategories.map((stat) => {
              const value = getStatValue(player, stat);
              const winner = compareStats(stat);
              const isWinner = (idx === 0 && winner === 'player1') || (idx === 1 && winner === 'player2');
              const isDraw = winner === 'draw';

              return (
                <div
                  key={stat}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    backgroundColor: isWinner ? '#00FF8720' : isDraw ? '#F6EB6120' : 'transparent',
                    border: `1px solid ${isWinner ? '#00FF87' : isDraw ? '#F6EB61' : 'transparent'}`,
                  }}
                  data-testid={`stat-${stat}-player${idx + 1}`}
                >
                  <span style={{ color: palette.text, opacity: 0.8 }}>{getStatLabel(stat)}</span>
                  <span style={{
                    fontWeight: 'bold',
                    color: isWinner ? '#00FF87' : palette.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {value}
                    {isWinner && <TrendingUp size={12} />}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderBars = () => {
    const maxStats: { [key: string]: number } = {};
    statCategories.forEach(stat => {
      const val1 = getStatValue(player1, stat);
      const val2 = getStatValue(player2, stat);
      maxStats[stat] = Math.max(val1, val2, 1);
    });

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        justifyContent: 'center',
      }}>
        {statCategories.map((stat, index) => {
          const val1 = getStatValue(player1, stat);
          const val2 = getStatValue(player2, stat);
          const max = maxStats[stat];
          const pct1 = (val1 / max) * 100;
          const pct2 = (val2 / max) * 100;

          return (
            <motion.div
              key={stat}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: palette.accent,
                textAlign: 'center',
              }}>
                {getStatLabel(stat)}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', minWidth: '30px', textAlign: 'right' }}>
                  {val1}
                </span>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct1}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{
                      height: '16px',
                      backgroundColor: val1 >= val2 ? '#00FF87' : `${palette.text}40`,
                      borderRadius: '2px 0 0 2px',
                      marginLeft: 'auto',
                    }}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct2}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{
                      height: '16px',
                      backgroundColor: val2 >= val1 ? '#00FF87' : `${palette.text}40`,
                      borderRadius: '0 2px 2px 0',
                    }}
                  />
                </div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', minWidth: '30px', textAlign: 'left' }}>
                  {val2}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderRadar = () => {
    const centerX = 150;
    const centerY = 150;
    const radius = 100;
    const numStats = statCategories.length;
    
    const getPoint = (index: number, percentage: number) => {
      const angle = (Math.PI * 2 * index) / numStats - Math.PI / 2;
      const distance = radius * (percentage / 100);
      return {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle),
      };
    };

    const maxStats: { [key: string]: number } = {};
    statCategories.forEach(stat => {
      const val1 = getStatValue(player1, stat);
      const val2 = getStatValue(player2, stat);
      maxStats[stat] = Math.max(val1, val2, 1);
    });

    const player1Points = statCategories.map((stat, i) => {
      const value = getStatValue(player1, stat);
      const pct = (value / maxStats[stat]) * 100;
      return getPoint(i, pct);
    });

    const player2Points = statCategories.map((stat, i) => {
      const value = getStatValue(player2, stat);
      const pct = (value / maxStats[stat]) * 100;
      return getPoint(i, pct);
    });

    const pathString1 = player1Points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    const pathString2 = player2Points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <svg width="300" height="300" style={{ maxWidth: '100%', maxHeight: '100%' }}>
          {[20, 40, 60, 80, 100].map((pct) => {
            const points = statCategories.map((_, i) => getPoint(i, pct));
            const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
            return (
              <path
                key={pct}
                d={path}
                fill="none"
                stroke={`${palette.text}20`}
                strokeWidth="1"
              />
            );
          })}

          {statCategories.map((stat, i) => {
            const point = getPoint(i, 100);
            return (
              <g key={stat}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={point.x}
                  y2={point.y}
                  stroke={`${palette.text}30`}
                  strokeWidth="1"
                />
                <text
                  x={point.x + (point.x - centerX) * 0.2}
                  y={point.y + (point.y - centerY) * 0.2}
                  fill={palette.text}
                  fontSize="10"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {getStatLabel(stat)}
                </text>
              </g>
            );
          })}

          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5 }}
            d={pathString1}
            fill="#00FF87"
            stroke="#00FF87"
            strokeWidth="2"
          />

          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            d={pathString2}
            fill="#FF4444"
            stroke="#FF4444"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
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
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        border: `3px solid ${palette.border}`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: palette.accent, letterSpacing: '0.5px' }}>
          PLAYER COMPARISON
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
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: palette.accent,
            opacity: isRefreshing ? 0.5 : 1,
            fontSize: '11px',
          }}
          title="Refresh data"
          data-testid="button-refresh-comparison"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
          >
            <RefreshCw size={12} />
          </motion.div>
        </motion.button>
      </div>

      <div style={{
        fontSize: '12px',
        color: palette.text,
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: '8px',
      }}>
        {player1.name} vs {player2.name}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {viewMode === 'sideBySide' && renderSideBySide()}
          {viewMode === 'bars' && renderBars()}
          {viewMode === 'radar' && renderRadar()}
        </motion.div>
      </AnimatePresence>

      <div style={{
        borderTop: `1px solid ${palette.accent}40`,
        paddingTop: '8px',
        marginTop: '8px',
        fontSize: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: palette.text,
        opacity: 0.7,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={10} />
          <span>Updated: {formatTimestamp(lastUpdated)}</span>
        </div>
        <span>Season {playersData.season}</span>
      </div>
    </motion.div>
  );
}
