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