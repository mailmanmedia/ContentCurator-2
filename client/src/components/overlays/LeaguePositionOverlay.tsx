import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";

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
          fontSize: '14px',
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
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '8px',
        border: '2px solid #F6EB61',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#FFFFFF' }}>
        LEAGUE POSITION
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '12px',
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: '#F6EB61',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#002147',
            border: '3px solid #C8102E',
          }}
        >
          {liverpoolPosition}
        </motion.div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {liverpoolPoints} PTS
          </div>
          <div style={{ fontSize: '12px', color: '#CCCCCC', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {trend === 'up' && <TrendingUp size={14} color="#00FF87" />}
            {trend === 'down' && <TrendingDown size={14} color="#FF4444" />}
            {trend === 'stable' && <Minus size={14} color="#F6EB61" />}
            <span>
              {trend === 'up' && 'Strong Position'}
              {trend === 'down' && 'Need Improvement'}
              {trend === 'stable' && 'Stable'}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(246, 235, 97, 0.3)',
        paddingTop: '12px',
        marginBottom: '8px',
      }}>
        <div style={{ fontSize: '11px', color: '#CCCCCC', marginBottom: '8px' }}>
          TOP 4 RACE
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          marginBottom: '6px',
        }}>
          <span style={{ color: '#FFFFFF' }}>Points from Leader</span>
          <span style={{ fontWeight: 'bold', color: pointsFromLeader === 0 ? '#00FF87' : '#FFFFFF' }}>
            {pointsFromLeader === 0 ? '1st Place' : `-${pointsFromLeader}`}
          </span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
        }}>
          <span style={{ color: '#FFFFFF' }}>Gap to 4th Place</span>
          <span style={{ fontWeight: 'bold', color: pointsFromTop4 <= 0 ? '#00FF87' : '#FF4444' }}>
            {pointsFromTop4 <= 0 ? `+${Math.abs(pointsFromTop4)}` : `-${pointsFromTop4}`}
          </span>
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(246, 235, 97, 0.1)',
        padding: '8px',
        borderRadius: '6px',
      }}>
        <div style={{ fontSize: '10px', color: '#CCCCCC', marginBottom: '6px' }}>
          TOP 6 STANDINGS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {top6Teams.slice(0, 6).map((team: any, index: number) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
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
