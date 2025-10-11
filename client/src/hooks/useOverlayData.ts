
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
