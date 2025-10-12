/**
 * Standard data fetching hook for all overlays
 * Includes automatic retry, error handling, and detailed error messages
 */
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UseOverlayDataOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  overlayName?: string;
  staleTime?: number;
  retry?: number;
}

export function useOverlayData<T>({
  queryKey,
  queryFn,
  enabled = true,
  overlayName = 'Overlay',
  staleTime = 5 * 60 * 1000,
  retry = 3,
}: UseOverlayDataOptions<T>) {
  const { toast } = useToast();

  return useQuery<T>({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error: Error) => {
      console.error(`[useOverlayData] ${overlayName} error:`, error);
      toast({
        title: `${overlayName} Error`,
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useOverlayData(overlayType: string | undefined, metricData: any) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['overlay-data', overlayType, metricData],
    queryFn: async () => {
      if (!overlayType) return null;

      let endpoint = '';

      if (overlayType === 'h2h-card') {
        const { homeTeamId, awayTeamId } = metricData || {};
        if (!homeTeamId || !awayTeamId) {
          console.log('[useOverlayData] H2H: Missing team IDs, returning placeholder');
          return {
            homeTeam: { id: homeTeamId || 0, name: 'Home Team', logo: '' },
            awayTeam: { id: awayTeamId || 0, name: 'Away Team', logo: '' },
            matches: [],
            stats: { home: { wins: 0, draws: 0, losses: 0 }, away: { wins: 0, draws: 0, losses: 0 } }
          };
        }
        endpoint = `/api/football/h2h/${homeTeamId}/${awayTeamId}`;
      } else if (overlayType === 'form-guide') {
        const { teamId } = metricData || {};
        if (!teamId) {
          console.log('[useOverlayData] Form Guide: Missing team ID, returning placeholder');
          return {
            team: { id: teamId || 0, name: 'Team Name', logo: '' },
            form: [],
            stats: { played: 0, wins: 0, draws: 0, losses: 0 }
          };
        }
        endpoint = `/api/football/team/${teamId}/form`;
      }

      if (!endpoint) {
        console.log('[useOverlayData] No endpoint defined for overlay type:', overlayType);
        return null;
      }

      try {
        console.log('[useOverlayData] Fetching from:', endpoint);
        const response = await fetch(endpoint);

        if (!response.ok) {
          console.error('[useOverlayData] HTTP error:', response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[useOverlayData] Invalid content type:', contentType);
          throw new Error('Invalid response type - expected JSON');
        }

        const data = await response.json();
        console.log('[useOverlayData] Data received:', data);
        return data;
      } catch (err) {
        console.error('[useOverlayData] Error fetching', endpoint + ':', err);
        throw err;
      }
    },
    enabled: !!overlayType,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return { data, isLoading, error };
}