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
    // Scale factors based on container dimensions (base: 576px × 450px for 30% width)
    const baseWidth = 576;
    const baseHeight = 450;
    const scaleWidth = width / baseWidth;
    const scaleHeight = height / baseHeight;
    // Use the smaller scale to ensure content fits in both dimensions
    const calculatedScale = Math.min(scaleWidth, scaleHeight);
    const fn = (size: number) => Math.max(size * calculatedScale, size * 0.5); // Min 50% of original
    
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
        padding: `${scaleFn(16)}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: `${scaleFn(8)}px`,
        border: `${Math.max(2 * scale, 1)}px solid #F6EB61`,
      }}
    >
      <div style={{ fontSize: `${scaleFn(14)}px`, fontWeight: 'bold', marginBottom: `${scaleFn(12)}px`, color: '#FFFFFF' }}>
        LEAGUE POSITION
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${scaleFn(16)}px`,
        marginBottom: `${scaleFn(12)}px`,
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{
            width: `${scaleFn(70)}px`,
            height: `${scaleFn(70)}px`,
            borderRadius: '50%',
            backgroundColor: '#F6EB61',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${scaleFn(36)}px`,
            fontWeight: 'bold',
            color: '#002147',
            border: `${Math.max(3 * scale, 1)}px solid #C8102E`,
          }}
        >
          {liverpoolPosition}
        </motion.div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: `${scaleFn(28)}px`, fontWeight: 'bold', color: '#FFFFFF' }}>
            {liverpoolPoints} PTS
          </div>
          <div style={{ fontSize: `${scaleFn(12)}px`, color: '#CCCCCC', marginTop: `${scaleFn(4)}px`, display: 'flex', alignItems: 'center', gap: `${scaleFn(4)}px` }}>
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

      <div style={{
        borderTop: `${Math.max(1 * scale, 0.5)}px solid rgba(246, 235, 97, 0.3)`,
        paddingTop: `${scaleFn(12)}px`,
        marginBottom: `${scaleFn(8)}px`,
      }}>
        <div style={{ fontSize: `${scaleFn(11)}px`, color: '#CCCCCC', marginBottom: `${scaleFn(8)}px` }}>
          TOP 4 RACE
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: `${scaleFn(12)}px`,
          marginBottom: `${scaleFn(6)}px`,
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
        }}>
          <span style={{ color: '#FFFFFF' }}>Gap to 4th Place</span>
          <span style={{ fontWeight: 'bold', color: pointsFromTop4 <= 0 ? '#00FF87' : '#FF4444' }}>
            {pointsFromTop4 <= 0 ? `+${Math.abs(pointsFromTop4)}` : `-${pointsFromTop4}`}
          </span>
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(246, 235, 97, 0.1)',
        padding: `${scaleFn(8)}px`,
        borderRadius: `${scaleFn(6)}px`,
      }}>
        <div style={{ fontSize: `${scaleFn(10)}px`, color: '#CCCCCC', marginBottom: `${scaleFn(6)}px` }}>
          TOP 6 STANDINGS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${scaleFn(3)}px` }}>
          {top6Teams.slice(0, 6).map((team: any, index: number) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: `${scaleFn(10)}px`,
                color: team.position === liverpoolPosition ? '#F6EB61' : '#FFFFFF',
                fontWeight: team.position === liverpoolPosition ? 'bold' : 'normal',
              }}
            >
              <span>{team.position}. {team.name.substring(0, 12)}</span>
              <span>{team.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
