import { motion } from "framer-motion";
import { useH2HData } from "@/hooks/useFootballData";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";

interface H2HMatchCardOverlayProps {
  homeTeamId: number;
  awayTeamId: number;
  width: number;
  height: number;
  opacity?: number;
  colorPalette?: 'classic' | 'navy' | 'cream' | 'dark';
}

interface H2HMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition?: string;
}

export default function H2HMatchCardOverlay({
  homeTeamId,
  awayTeamId,
  width,
  height,
  opacity = 0.95,
  colorPalette = 'classic',
}: H2HMatchCardOverlayProps) {
  const { data, isLoading, error, refetch } = useH2HData(homeTeamId, awayTeamId);

  // Color palette configurations
  const palettes = {
    classic: {
      primary: '#C8102E',
      secondary: '#0891A8',
      accent: '#E8D9C5',
      text: '#FFFFFF',
      statBg: '#0891A8',
      valueBg: '#E8D9C5',
      valueText: '#002147',
      background: 'rgba(0, 33, 71, 0.95)'
    },
    navy: {
      primary: '#002147',
      secondary: '#0891A8',
      accent: '#E8D9C5',
      text: '#FFFFFF',
      statBg: '#0891A8',
      valueBg: '#E8D9C5',
      valueText: '#002147',
      background: 'rgba(0, 33, 71, 0.95)'
    },
    cream: {
      primary: '#8B7355',
      secondary: '#0891A8',
      accent: '#E8D9C5',
      text: '#2C2416',
      statBg: '#8B7355',
      valueBg: '#E8D9C5',
      valueText: '#2C2416',
      background: 'rgba(232, 217, 197, 0.95)'
    },
    dark: {
      primary: '#FFFFFF',
      secondary: '#0891A8',
      accent: '#333333',
      text: '#FFFFFF',
      statBg: '#0891A8',
      valueBg: '#333333',
      valueText: '#FFFFFF',
      background: 'rgba(17, 17, 17, 0.95)'
    }
  };

  const colors = palettes[colorPalette];

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
        source="Head-to-head data"
      />
    );
  }

  if (!data?.data) {
    return (
      <OverlayEmptyState
        message="No head-to-head data available"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const h2hData = data.data;
  const matches: H2HMatch[] = h2hData.fixtures || [];

  if (matches.length === 0) {
    return (
      <OverlayEmptyState
        message="No previous matches found between these teams"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  // Calculate statistics
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  let homeGoals = 0;
  let awayGoals = 0;

  matches.forEach((match) => {
    homeGoals += match.homeScore;
    awayGoals += match.awayScore;
    if (match.homeScore > match.awayScore) {
      homeWins++;
    } else if (match.awayScore > match.homeScore) {
      awayWins++;
    } else {
      draws++;
    }
  });

  const totalMatches = matches.length;
  const homeWinPct = totalMatches > 0 ? Math.round((homeWins / totalMatches) * 100) : 0;
  const awayWinPct = totalMatches > 0 ? Math.round((awayWins / totalMatches) * 100) : 0;
  const avgHomeGoals = totalMatches > 0 ? (homeGoals / totalMatches).toFixed(1) : '0.0';
  const avgAwayGoals = totalMatches > 0 ? (awayGoals / totalMatches).toFixed(1) : '0.0';

  // Halftone dot pattern
  const HalftoneDots = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const dots = [];
    const rows = 4;
    const cols = 4;
    const dotSize = 8;
    const gap = 12;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        dots.push(
          <circle
            key={`${row}-${col}`}
            cx={col * gap}
            cy={row * gap}
            r={dotSize - (row + col) * 0.8}
            fill={colors.text}
            opacity={0.3}
          />
        );
      }
    }

    const positions = {
      tl: { top: 60, left: 20 },
      tr: { top: 60, right: 20 },
      bl: { bottom: 20, left: 20 },
      br: { bottom: 20, right: 20 },
    };

    return (
      <svg
        style={{
          position: 'absolute',
          ...positions[position],
          width: 60,
          height: 60,
        }}
      >
        {dots}
      </svg>
    );
  };

  // Stat bar component
  const StatBar = ({ label, leftValue, rightValue }: { label: string; leftValue: string | number; rightValue: string | number }) => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      marginBottom: '12px',
    }}>
      <div style={{
        backgroundColor: colors.valueBg,
        color: colors.valueText,
        padding: '8px 16px',
        fontWeight: 'bold',
        fontSize: '20px',
        minWidth: '60px',
        textAlign: 'center',
        fontFamily: 'League Spartan, sans-serif',
      }}>
        {leftValue}
      </div>
      <div style={{
        flex: 1,
        backgroundColor: colors.statBg,
        color: colors.text,
        padding: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontFamily: 'League Spartan, sans-serif',
      }}>
        {label}
      </div>
      <div style={{
        backgroundColor: colors.valueBg,
        color: colors.valueText,
        padding: '8px 16px',
        fontWeight: 'bold',
        fontSize: '20px',
        minWidth: '60px',
        textAlign: 'center',
        fontFamily: 'League Spartan, sans-serif',
      }}>
        {rightValue}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: 'League Spartan, sans-serif',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      data-testid="overlay-h2h"
    >
      {/* Halftone decorative dots */}
      <HalftoneDots position="tl" />
      <HalftoneDots position="tr" />
      <HalftoneDots position="bl" />
      <HalftoneDots position="br" />

      {/* Title */}
      <div style={{
        fontSize: '32px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: colors.text,
        marginBottom: '20px',
      }}>
        TEAMS HEAD 2 HEAD
      </div>

      {/* Team badges and VS */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '40px',
        marginBottom: '24px',
        padding: '16px 0',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: colors.valueBg,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
            color: colors.valueText,
          }}>
            {h2hData.homeTeam?.team?.substring(0, 2).toUpperCase() || 'H'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
            {h2hData.homeTeam?.team || `Team ${homeTeamId}`}
          </div>
        </div>

        <div style={{
          width: '60px',
          height: '60px',
          backgroundColor: colors.secondary,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          color: colors.text,
        }}>
          VS
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: colors.valueBg,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
            color: colors.valueText,
          }}>
            {h2hData.awayTeam?.team?.substring(0, 2).toUpperCase() || 'A'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
            {h2hData.awayTeam?.team || `Team ${awayTeamId}`}
          </div>
        </div>
      </div>

      {/* Stat bars */}
      <div style={{ marginTop: '8px' }}>
        <StatBar label="Head 2 Head Wins" leftValue={homeWins} rightValue={awayWins} />
        <StatBar label="Win Percentage" leftValue={`${homeWinPct}%`} rightValue={`${awayWinPct}%`} />
        <StatBar label="Total Matches" leftValue={totalMatches} rightValue={totalMatches} />
        <StatBar label="Average Goals" leftValue={avgHomeGoals} rightValue={avgAwayGoals} />
        <StatBar label="Draws" leftValue={draws} rightValue={draws} />
      </div>

      {/* Footer info */}
      {totalMatches > 0 && (
        <div style={{
          marginTop: 'auto',
          paddingTop: '12px',
          fontSize: '11px',
          color: colors.text,
          opacity: 0.7,
          textAlign: 'center',
        }}>
          Based on {totalMatches} match{totalMatches !== 1 ? 'es' : ''}
        </div>
      )}

      {/* Source Badge */}
      <OverlaySourceBadge source={data.source as any} timestamp={data.timestamp} />
    </motion.div>
  );
}
