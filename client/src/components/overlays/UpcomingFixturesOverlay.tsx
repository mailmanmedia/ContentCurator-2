import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";
import { COLOR_PALETTES, type ColorPaletteKey } from "./FormGuideOverlay";

interface UpcomingFixturesOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  fixtureCount?: 3 | 5 | 7;
  showCountdown?: boolean;
  showOpponentForm?: boolean;
  colorPalette?: ColorPaletteKey;
}

interface Fixture {
  id: number | string;
  date: string;
  timestamp?: number;
  homeTeam: string;
  awayTeam: string;
  league?: string;
  venue?: string;
  isHome?: boolean;
}

export default function UpcomingFixturesOverlay({
  width,
  height,
  opacity = 0.9,
  fixtureCount = 5,
  showCountdown = true,
  showOpponentForm = true,
  colorPalette = 'classic',
}: UpcomingFixturesOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch upcoming fixtures from database
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['upcoming-fixtures-db', 40],
    queryFn: async () => {
      const response = await fetch('/api/database/fixtures/upcoming?teamId=40&limit=15');
      if (!response.ok) throw new Error('Failed to fetch fixtures');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Handle refresh of data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/update/fixtures', { method: 'POST' });
      if (response.ok) {
        await refetch();
        toast({
          title: "Data refreshed",
          description: "Fixtures have been updated.",
        });
      } else {
        throw new Error('Failed to refresh data');
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update fixtures. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
        source="Fixtures data"
      />
    );
  }

  if (!data?.data) {
    return (
      <OverlayEmptyState
        message="No fixtures data available"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const fixturesData = data.data;
  const fixtures = (fixturesData.fixtures || []).slice(0, fixtureCount);

  if (fixtures.length === 0) {
    return (
      <OverlayEmptyState
        message="No upcoming fixtures found"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

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
    return fixture.isHome || fixture.homeTeam?.toLowerCase().includes('liverpool') ? 'H' : 'A';
  };

  const getOpponent = (fixture: Fixture) => {
    const isHome = fixture.isHome || fixture.homeTeam?.toLowerCase().includes('liverpool');
    return isHome ? fixture.awayTeam : fixture.homeTeam;
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
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        border: `3px solid ${palette.border}`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
      data-testid="overlay-upcoming-fixtures"
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
              key={fixture.id || index}
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
                  vs {opponent}
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

              {fixture.league && (
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
                    {fixture.league}
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
              )}
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
        justifyContent: 'center',
        alignItems: 'center',
        color: palette.text,
        opacity: 0.7,
      }}>
        <span>Next {fixtures.length} matches</span>
      </div>

      {/* Source Badge */}
      <OverlaySourceBadge source={data.source as any} timestamp={data.timestamp} />
    </motion.div>
  );
}
