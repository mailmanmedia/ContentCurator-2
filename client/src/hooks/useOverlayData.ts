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
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error: any) {
        console.error(`[useOverlayData] Error fetching ${overlayName}:`, error);
        
        // If it's a JSON parse error, the endpoint likely returned HTML (error page)
        if (error.message?.includes('JSON')) {
          throw new Error(`Endpoint returned invalid response (not JSON). Check if the API endpoint exists.`);
        }
        throw error;
      }
    },
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