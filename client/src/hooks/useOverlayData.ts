
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UseOverlayDataOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: any[];
  queryFn: () => Promise<T>;
  overlayName: string;
}

export function useOverlayData<T>({ queryKey, queryFn, overlayName, ...options }: UseOverlayDataOptions<T>) {
  const { toast } = useToast();

  return useQuery<T>({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes default
    retry: 2,
    retryDelay: 1000,
    ...options,
    onError: (error: any) => {
      console.error(`${overlayName} overlay error:`, error);
      toast({
        title: `${overlayName} Error`,
        description: error.message || 'Failed to load data',
        variant: 'destructive'
      });
    }
  });
}
/**
 * Standard data fetching hook for all overlays
 * Includes automatic retry, error handling, and detailed error messages
 */
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UseOverlayDataOptions {
  queryKey: string[];
  endpoint: string;
  enabled?: boolean;
  errorMessage?: string;
  expectedDataStructure?: string;
}

export function useOverlayData<T>({
  queryKey,
  endpoint,
  enabled = true,
  errorMessage = 'Failed to fetch data',
  expectedDataStructure = 'Unknown data structure'
}: UseOverlayDataOptions) {
  const { toast } = useToast();

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `API Error (${response.status}): ${errorMessage}\n` +
            `Endpoint: ${endpoint}\n` +
            `Response: ${errorText}\n` +
            `Expected structure: ${expectedDataStructure}`
          );
        }
        
        const data = await response.json();
        
        // Validate data structure
        if (!data || typeof data !== 'object') {
          throw new Error(
            `Invalid data structure received from ${endpoint}\n` +
            `Expected: ${expectedDataStructure}\n` +
            `Received: ${JSON.stringify(data)}`
          );
        }
        
        return data;
      } catch (error) {
        console.error(`[useOverlayData] Error fetching ${endpoint}:`, error);
        throw error;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error: Error) => {
      toast({
        title: 'Data Fetch Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
