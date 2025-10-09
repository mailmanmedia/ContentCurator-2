import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface LeaguePositionOverlayProps {
  width: number;
  height: number;
  opacity?: number;
}

interface ComparativeMetrics {
  standings?: {
    liverpoolPosition?: number;
    liverpoolPoints?: number;
    pointsFromLeader?: number;
    pointsFromTop4?: number;
    top6Standings?: Array<{ position: number; name: string; points: number }>;
  };
}

export default function LeaguePositionOverlay({
  width,
  height,
  opacity = 0.88,
}: LeaguePositionOverlayProps) {
  const { data: comparative, isLoading } = useQuery<ComparativeMetrics>({
    queryKey: ['/api/analytics/comparative-metrics'],
  });

  // Memoize scale calculations to ensure they update when dimensions change
  const { scale, scaleFn } = useMemo(() => {
    // Scale factors based on container dimensions (base: 384px × 300px for 20% width)
    const baseWidth = 384;  // 20% of 1920px standard canvas
    const baseHeight = 300;
    const scaleWidth = width / baseWidth;
    const scaleHeight = height / baseHeight;
    // Use the smaller scale to ensure content fits in both dimensions
    const calculatedScale = Math.min(scaleWidth, scaleHeight);
    const fn = (size: number) => Math.max(size * calculatedScale, size * 0.2); // Min 20% of original for extreme compression
    
    return { scale: calculatedScale, scaleFn: fn };
  }, [width, height]);

  if (isLoading || !comparative) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: `rgba(0, 33, 71, ${opacity})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F6EB61',
          fontFamily: 'League Spartan, sans-serif',
          fontSize: `${scaleFn(14)}px`,
        }}
      >
        Loading...
      </div>
    );
  }

  const { standings } = comparative;
  const liverpoolPosition = standings?.liverpoolPosition || 0;
  const liverpoolPoints = standings?.liverpoolPoints || 0;
  const pointsFromLeader = standings?.pointsFromLeader || 0;
  const pointsFromTop4 = standings?.pointsFromTop4 || 0;
  const top6Teams = standings?.top6Standings || [];

  const getPositionTrend = () => {
    if (liverpoolPosition <= 2) return 'up';
    if (liverpoolPosition > 4) return 'down';
    return 'stable';
  };

  const trend = getPositionTrend();

  // Calculate adaptive values based on dimensions
  const isUltraCompact = height < 120;
  const isCompact = height < 150 && !isUltraCompact;
  const teamCount = isUltraCompact ? 2 : (height < 180 ? 3 : Math.max(3, Math.min(6, Math.floor((height - 150) / 25))));
  const maxChars = Math.max(8, Math.floor(width / 30));
  const dynamicPadding = isUltraCompact ? 3 : (isCompact ? Math.max(scaleFn(8), 4) : Math.max(scaleFn(16) * (height / 300), 8));
  const dynamicSpacing = isUltraCompact ? 1 : (isCompact ? Math.max(scaleFn(6), 2) : Math.max(scaleFn(12) * (height / 300), 4));

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: `rgba(0, 33, 71, ${opacity})`,
        color: '#F6EB61',
        fontFamily: 'League Spartan, sans-serif',
        padding: `${dynamicPadding}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: `${scaleFn(8)}px`,
        border: `${Math.max(2 * scale, 1)}px solid #F6EB61`,
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: `${isUltraCompact ? 7 : (isCompact ? 9 : Math.max(scaleFn(14), 10))}px`, fontWeight: 'bold', marginBottom: `${dynamicSpacing}px`, color: '#FFFFFF', lineHeight: (isUltraCompact || isCompact) ? '1' : 'normal' }}>
        LEAGUE POSITION
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${scaleFn(16)}px`,
        marginBottom: `${dynamicSpacing}px`,
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{
            width: `${isUltraCompact ? 30 : (isCompact ? scaleFn(50) : scaleFn(70))}px`,
            height: `${isUltraCompact ? 30 : (isCompact ? scaleFn(50) : scaleFn(70))}px`,
            borderRadius: '50%',
            backgroundColor: '#F6EB61',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${isUltraCompact ? 14 : (isCompact ? scaleFn(24) : scaleFn(36))}px`,
            fontWeight: 'bold',
            color: '#002147',
            border: `${Math.max(3 * scale, 1)}px solid #C8102E`,
            lineHeight: isUltraCompact ? '1' : 'normal',
          }}
        >
          {liverpoolPosition}
        </motion.div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: `${isUltraCompact ? 14 : scaleFn(28)}px`, fontWeight: 'bold', color: '#FFFFFF', lineHeight: (isUltraCompact || isCompact) ? '1' : 'normal' }}>
            {liverpoolPoints} PTS
          </div>
          <div style={{ fontSize: `${isUltraCompact ? 6 : scaleFn(12)}px`, color: '#CCCCCC', marginTop: `${scaleFn(4)}px`, display: 'flex', alignItems: 'center', gap: `${scaleFn(4)}px`, lineHeight: (isUltraCompact || isCompact) ? '1' : 'normal' }}>
            {trend === 'up' && <TrendingUp size={scaleFn(14)} color="#00FF87" />}
            {trend === 'down' && <TrendingDown size={scaleFn(14)} color="#FF4444" />}
            {trend === 'stable' && <Minus size={scaleFn(14)} color="#F6EB61" />}
            <span>
              {trend === 'up' && 'Strong Position'}
              {trend === 'down' && 'Need Improvement'}
              {trend === 'stable' && 'Stable'}
            </span>
          </div>
        </div>
      </div>

      {!isUltraCompact && height >= 130 && (
        <div style={{
          borderTop: `${Math.max(1 * scale, 0.5)}px solid rgba(246, 235, 97, 0.3)`,
          paddingTop: `${scaleFn(12)}px`,
          marginBottom: `${dynamicSpacing}px`,
        }}>
          <div style={{ fontSize: `${isCompact ? 7 : Math.max(scaleFn(11), 8)}px`, color: '#CCCCCC', marginBottom: `${scaleFn(8)}px`, lineHeight: (isUltraCompact || isCompact) ? '1' : 'normal' }}>
            TOP 4 RACE
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: `${scaleFn(12)}px`,
            marginBottom: `${scaleFn(6)}px`,
            lineHeight: (isUltraCompact || isCompact) ? '1' : 'normal',
          }}>
            <span style={{ color: '#FFFFFF' }}>Points from Leader</span>
            <span style={{ fontWeight: 'bold', color: pointsFromLeader === 0 ? '#00FF87' : '#FFFFFF' }}>
              {pointsFromLeader === 0 ? '1st Place' : `-${pointsFromLeader}`}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: `${scaleFn(12)}px`,
            lineHeight: (isUltraCompact || isCompact) ? '1' : 'normal',
          }}>
            <span style={{ color: '#FFFFFF' }}>Gap to 4th Place</span>
            <span style={{ fontWeight: 'bold', color: pointsFromTop4 <= 0 ? '#00FF87' : '#FF4444' }}>
              {pointsFromTop4 <= 0 ? `+${Math.abs(pointsFromTop4)}` : `-${pointsFromTop4}`}
            </span>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'rgba(246, 235, 97, 0.1)',
        padding: `${isUltraCompact ? 2 : (isCompact ? Math.max(scaleFn(4), 2) : scaleFn(8))}px`,
        borderRadius: `${scaleFn(6)}px`,
      }}>
        <div style={{ fontSize: `${isUltraCompact ? 5 : (isCompact ? 7 : Math.max(scaleFn(10), 7))}px`, color: '#CCCCCC', marginBottom: `${isUltraCompact ? 1 : scaleFn(6)}px`, lineHeight: (isUltraCompact || isCompact) ? '1' : 'normal' }}>
          TOP 6 STANDINGS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${isUltraCompact ? 0 : (isCompact ? Math.max(scaleFn(1), 1) : scaleFn(3))}px` }}>
          {top6Teams.slice(0, teamCount).map((team: any, index: number) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: `${isUltraCompact ? 5 : (isCompact ? 7 : Math.max(scaleFn(10), 7))}px`,
                color: team.position === liverpoolPosition ? '#F6EB61' : '#FFFFFF',
                fontWeight: team.position === liverpoolPosition ? 'bold' : 'normal',
                lineHeight: (isUltraCompact || isCompact) ? '1' : 'normal',
              }}
            >
              <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {team.position}. {team.name.substring(0, maxChars)}
              </span>
              <span>{team.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
