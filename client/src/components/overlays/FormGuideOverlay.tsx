import { motion } from "framer-motion";
import { useTeamData } from "@/hooks/useFootballData";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";

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
  teamName?: string;
  colorPalette?: ColorPaletteKey;
  titleSize?: number;
  circleSize?: number;
  labelSize?: number;
  matchLimit?: 3 | 5 | 10;
}

export default function FormGuideOverlay({
  width,
  height,
  opacity = 0.9,
  layout = 'horizontal',
  teamName = 'Liverpool',
  colorPalette = 'classic',
  titleSize = 20,
  circleSize = 60,
  labelSize = 14,
  matchLimit = 5,
}: FormGuideOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { data, isLoading, error, refetch } = useTeamData(teamName);

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
        source="Team form data"
      />
    );
  }

  if (!data?.data) {
    return (
      <OverlayEmptyState
        message="No team form data available"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const teamData = data.data;
  const formString = teamData.form?.join('') || '';
  const formArray = formString.split('').slice(0, matchLimit);

  if (formArray.length === 0) {
    return (
      <OverlayEmptyState
        message="No recent matches available"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

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
        width: '100%',
        height: '100%',
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
        position: 'relative',
      }}
      data-testid="overlay-form-guide"
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
            data-testid={`form-result-${index}`}
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
        justifyContent: 'space-between',
        fontWeight: 500,
      }}>
        <span>Last {formArray.length} Matches</span>
        <span style={{ color: palette.accent, fontWeight: 'bold' }}>
          {formArray.filter((r) => r === 'W').length}W-
          {formArray.filter((r) => r === 'D').length}D-
          {formArray.filter((r) => r === 'L').length}L
        </span>
      </div>

      {/* Source Badge */}
      <OverlaySourceBadge source={data.source as any} timestamp={data.timestamp} />
    </motion.div>
  );
}
