import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { COLOR_PALETTES, type ColorPaletteKey } from "./FormGuideOverlay";

interface UpcomingFixturesOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  fixtureCount?: 3 | 5 | 7;
  competitionFilter?: string[];
  showCountdown?: boolean;
  showOpponentForm?: boolean;
  colorPalette?: ColorPaletteKey;
}

interface Fixture {
  id: number | string;
  date: string;
  timestamp: number;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    logo?: string;
  };
  venue: {
    name: string;
    city: string;
  };
  isLiverpool: boolean;
}

interface FixturesData {
  fixtures: Fixture[];
}

export default function UpcomingFixturesOverlay({
  width,
  height,
  opacity = 0.9,
  fixtureCount = 5,
  competitionFilter,
  showCountdown = true,
  showOpponentForm = true,
  colorPalette = 'classic',
}: UpcomingFixturesOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: fixturesData, isLoading, refetch } = useQuery<FixturesData>({
    queryKey: ['/api/football/liverpool/upcoming'],
    queryFn: async () => {
      const res = await fetch('/api/football/liverpool/upcoming');
      if (!res.ok) throw new Error('Failed to fetch fixtures');
      const data = await res.json();
      setLastUpdated(new Date());
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
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

  const formatFixtureDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    
    return `${dayName} ${day} ${month}, ${hours}:${mins} GMT`;
  };

  const getCountdown = (dateString: string) => {
    const now = new Date();
    const matchDate = new Date(dateString);
    const diff = matchDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Match started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `in ${days} day${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    return 'soon';
  };

  const getVenue = (fixture: Fixture) => {
    return fixture.homeTeam.name === 'Liverpool' ? 'H' : 'A';
  };

  const getOpponent = (fixture: Fixture) => {
    return fixture.homeTeam.name === 'Liverpool' ? fixture.awayTeam : fixture.homeTeam;
  };

  if (isLoading || !fixturesData) {
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
        Loading fixtures...
      </div>
    );
  }

  let filteredFixtures = fixturesData.fixtures || [];
  
  if (competitionFilter && competitionFilter.length > 0) {
    filteredFixtures = filteredFixtures.filter(f => 
      competitionFilter.includes(f.league.name)
    );
  }
  
  const fixtures = filteredFixtures.slice(0, fixtureCount);

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
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: palette.accent, letterSpacing: '0.5px' }}>
          UPCOMING FIXTURES
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
          title="Refresh fixtures"
          data-testid="button-refresh-fixtures"
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
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {fixtures.map((fixture, index) => {
          const opponent = getOpponent(fixture);
          const venue = getVenue(fixture);
          
          return (
            <motion.div
              key={fixture.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              style={{
                backgroundColor: `${palette.border}20`,
                borderRadius: '6px',
                padding: '10px',
                border: `2px solid ${palette.border}40`,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
              data-testid={`fixture-card-${index}`}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: palette.text,
                  flex: 1,
                }}>
                  vs {opponent.name}
                </div>
                <div
                  style={{
                    backgroundColor: venue === 'H' ? palette.accent : `${palette.text}20`,
                    color: venue === 'H' ? '#000' : palette.text,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                  data-testid={`venue-badge-${index}`}
                >
                  {venue}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: palette.text,
                opacity: 0.8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  <span data-testid={`fixture-date-${index}`}>{formatFixtureDate(fixture.date)}</span>
                </div>
              </div>

              {showCountdown && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: palette.accent,
                  fontWeight: 'bold',
                }}>
                  <Clock size={12} />
                  <span data-testid={`countdown-${index}`}>{getCountdown(fixture.date)}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10px',
                color: palette.text,
                opacity: 0.7,
                borderTop: `1px solid ${palette.border}20`,
                paddingTop: '6px',
              }}>
                <div style={{
                  backgroundColor: `${palette.accent}20`,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                }}>
                  {fixture.league.name}
                </div>
                {showOpponentForm && (
                  <div style={{
                    display: 'flex',
                    gap: '2px',
                    marginLeft: 'auto',
                  }}>
                    {['W', 'D', 'L', 'W', 'W'].map((result, i) => (
                      <div
                        key={i}
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: result === 'W' ? '#00FF87' : result === 'D' ? '#F6EB61' : '#FF4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          color: '#000',
                        }}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

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
        <span>Next {fixtures.length} matches</span>
      </div>
    </motion.div>
  );
}
