import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Target, TrendingUp, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface PlayerStatsOverlayProps {
  playerId?: number;
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
  const { data: topScorersData, isLoading: isLoadingScorers } = useQuery({
    queryKey: ['/api/football/players/liverpool/top-scorers'],
    queryFn: async () => {
      const res = await fetch('/api/football/players/liverpool/top-scorers?limit=5');
      if (!res.ok) throw new Error('Failed to fetch Liverpool top scorers');
      return res.json();
    },
  });

  if (isLoadingScorers || !topScorersData) {
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
        Loading player stats...
      </div>
    );
  }

  const selectedPlayer = playerId 
    ? topScorersData.players?.find((p: any) => p.id === playerId) 
    : topScorersData.players?.[0];

  if (!selectedPlayer) {
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
          fontSize: '14px',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        No player statistics available. Please populate the database with Liverpool player data.
      </div>
    );
  }

  const goalsPer90 = selectedPlayer.minutes > 0 
    ? (selectedPlayer.goals / (selectedPlayer.minutes / 90)).toFixed(2) 
    : '0.00';
  
  const assistsPer90 = selectedPlayer.minutes > 0 
    ? (selectedPlayer.assists / (selectedPlayer.minutes / 90)).toFixed(2) 
    : '0.00';

  const goalsAndAssists = selectedPlayer.goals + selectedPlayer.assists;

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
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{selectedPlayer.name}</div>
          <div style={{ fontSize: '12px', color: '#C8102E', marginTop: '2px' }}>
            Liverpool FC • {topScorersData.season} Season
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
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <Activity size={12} style={{ display: 'inline', marginRight: '4px' }} />
            ASSISTS
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#C8102E' }}>
            {selectedPlayer.assists}
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
          <span style={{ color: '#666' }}>Goals per 90</span>
          <span style={{ fontWeight: 'bold', color: '#002147' }}>
            {goalsPer90}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#666' }}>Assists per 90</span>
          <span style={{ fontWeight: 'bold', color: '#002147' }}>
            {assistsPer90}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#666' }}>Appearances</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} color="#00FF87" />
            <span style={{ fontWeight: 'bold', color: '#00FF87' }}>
              {selectedPlayer.appearances}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#666' }}>Goal Contributions</span>
          <span style={{ fontWeight: 'bold', color: '#C8102E' }}>
            {goalsAndAssists}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
