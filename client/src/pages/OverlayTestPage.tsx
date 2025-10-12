
/**
 * Visual testing page for all overlays
 * Access at: /overlay-test
 */
import { useState } from 'react';
import H2HMatchCardOverlay from '@/components/overlays/H2HMatchCardOverlay';
import FormGuideOverlay from '@/components/overlays/FormGuideOverlay';
import LeagueTableOverlay from '@/components/overlays/LeagueTableOverlay';
import LeaguePositionOverlay from '@/components/overlays/LeaguePositionOverlay';
import PlayerComparisonOverlay from '@/components/overlays/PlayerComparisonOverlay';
import PlayerStatsOverlay from '@/components/overlays/PlayerStatsOverlay';
import RssSentimentOverlay from '@/components/overlays/RssSentimentOverlay';
import RssTickerEnhancedOverlay from '@/components/overlays/RssTickerEnhancedOverlay';
import UpcomingFixturesOverlay from '@/components/overlays/UpcomingFixturesOverlay';

const OVERLAY_CONFIGS: Record<string, any> = {
  h2h: {
    component: H2HMatchCardOverlay,
    props: { homeTeamId: 40, awayTeamId: 47 },
    name: 'H2H Match Card',
    sizes: [
      { width: 240, height: 300, label: 'Mini' },
      { width: 320, height: 400, label: 'Very Compact' },
      { width: 400, height: 500, label: 'Compact' },
      { width: 600, height: 800, label: 'Normal' },
    ],
  },
  formGuide: {
    component: FormGuideOverlay,
    props: { teamId: 40, leagueId: 39 },
    name: 'Form Guide',
    sizes: [
      { width: 240, height: 300, label: 'Mini' },
      { width: 320, height: 400, label: 'Very Compact' },
      { width: 400, height: 500, label: 'Compact' },
      { width: 600, height: 800, label: 'Normal' },
    ],
  },
  leagueTable: {
    component: LeagueTableOverlay,
    props: { leagueId: 39, season: 2025 },
    name: 'League Table',
    sizes: [
      { width: 400, height: 600, label: 'Compact' },
      { width: 600, height: 800, label: 'Normal' },
      { width: 800, height: 1000, label: 'Large' },
    ],
  },
  leaguePosition: {
    component: LeaguePositionOverlay,
    props: { teamId: 40, leagueId: 39, season: 2025 },
    name: 'League Position',
    sizes: [
      { width: 240, height: 300, label: 'Mini' },
      { width: 320, height: 400, label: 'Very Compact' },
      { width: 400, height: 500, label: 'Compact' },
    ],
  },
  playerStats: {
    component: PlayerStatsOverlay,
    props: { teamId: 40, leagueId: 39, season: 2025 },
    name: 'Player Stats',
    sizes: [
      { width: 400, height: 600, label: 'Compact' },
      { width: 600, height: 800, label: 'Normal' },
    ],
  },
  playerComparison: {
    component: PlayerComparisonOverlay,
    props: { player1Id: 1, player2Id: 2 },
    name: 'Player Comparison',
    sizes: [
      { width: 500, height: 700, label: 'Compact' },
      { width: 700, height: 900, label: 'Normal' },
    ],
  },
  rssSentiment: {
    component: RssSentimentOverlay,
    props: {},
    name: 'RSS Sentiment',
    sizes: [
      { width: 400, height: 300, label: 'Compact' },
      { width: 600, height: 400, label: 'Normal' },
    ],
  },
  rssTicker: {
    component: RssTickerEnhancedOverlay,
    props: {},
    name: 'RSS Ticker',
    sizes: [
      { width: 800, height: 100, label: 'Standard' },
      { width: 1200, height: 120, label: 'Wide' },
    ],
  },
  upcomingFixtures: {
    component: UpcomingFixturesOverlay,
    props: { teamId: 40 },
    name: 'Upcoming Fixtures',
    sizes: [
      { width: 400, height: 600, label: 'Compact' },
      { width: 600, height: 800, label: 'Normal' },
    ],
  },
};

export default function OverlayTestPage() {
  const [selectedOverlay, setSelectedOverlay] = useState('h2h');
  const [selectedSize, setSelectedSize] = useState(3); // Default to "Normal"

  const config = OVERLAY_CONFIGS[selectedOverlay];
  const size = config.sizes[selectedSize] || config.sizes[0];
  const OverlayComponent = config.component;

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', marginBottom: '20px', fontFamily: 'League Spartan, sans-serif' }}>
        Overlay Testing Dashboard
      </h1>
      
      {/* Overlay selector */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {Object.entries(OVERLAY_CONFIGS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => {
              setSelectedOverlay(key);
              setSelectedSize(0);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedOverlay === key ? '#C8102E' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'League Spartan, sans-serif',
            }}
          >
            {cfg.name}
          </button>
        ))}
      </div>

      {/* Size selector */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {config.sizes.map((s: any, i: number) => (
          <button
            key={i}
            onClick={() => setSelectedSize(i)}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedSize === i ? '#0891A8' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'League Spartan, sans-serif',
            }}
          >
            {s.label} ({s.width}×{s.height})
          </button>
        ))}
      </div>

      {/* Overlay preview */}
      <div style={{
        border: '2px solid #C8102E',
        display: 'inline-block',
        backgroundColor: '#000',
        marginBottom: '20px',
      }}>
        <OverlayComponent
          {...config.props}
          width={size.width}
          height={size.height}
        />
      </div>

      {/* Debug info */}
      <div style={{
        padding: '20px',
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
      }}>
        <h3 style={{ marginBottom: '10px', fontFamily: 'League Spartan, sans-serif' }}>Debug Info:</h3>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify({ 
            overlay: selectedOverlay, 
            size, 
            props: config.props 
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
