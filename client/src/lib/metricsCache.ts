/**
 * Client-side React Query Cache Configuration
 * Optimizes analytics data fetching with stale-while-revalidate patterns
 */

import { QueryClient } from "@tanstack/react-query";

export const STALE_TIME = {
  TEAM_METRICS: 5 * 60 * 1000,
  PLAYER_METRICS: 3 * 60 * 1000,
  MATCH_PREDICTION: 2 * 60 * 1000,
  LEAGUE_TABLE: 5 * 60 * 1000,
  RSS_DATA: 1 * 60 * 1000,
  DASHBOARD: 5 * 60 * 1000,
} as const;

export const CACHE_TIME = {
  TEAM_METRICS: 60 * 60 * 1000,
  PLAYER_METRICS: 30 * 60 * 1000,
  MATCH_PREDICTION: 15 * 60 * 1000,
  LEAGUE_TABLE: 60 * 60 * 1000,
  RSS_DATA: 10 * 60 * 1000,
  DASHBOARD: 60 * 60 * 1000,
} as const;

export const metricsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.TEAM_METRICS,
      gcTime: CACHE_TIME.TEAM_METRICS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

export const prefetchDashboardMetrics = async (queryClient: QueryClient) => {
  const prefetchQueries = [
    queryClient.prefetchQuery({
      queryKey: ['/api/analytics/dashboard'],
      staleTime: STALE_TIME.DASHBOARD,
    }),
    queryClient.prefetchQuery({
      queryKey: ['/api/analytics/team-metrics'],
      staleTime: STALE_TIME.TEAM_METRICS,
    }),
    queryClient.prefetchQuery({
      queryKey: ['/api/league-table'],
      staleTime: STALE_TIME.LEAGUE_TABLE,
    }),
  ];

  await Promise.allSettled(prefetchQueries);
};

export const invalidateTeamMetrics = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return (
        typeof key === 'string' &&
        (key.includes('/api/analytics/team-metrics') ||
          key.includes('/api/analytics/dashboard') ||
          key.includes('/api/analytics/season-progression') ||
          key.includes('/api/analytics/tactical-analysis') ||
          key.includes('/api/analytics/comparative-metrics'))
      );
    },
  });
};

export const invalidatePlayerMetrics = (queryClient: QueryClient, playerId?: number) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      if (playerId) {
        return (
          typeof key === 'string' &&
          key.includes(`/api/analytics/player-metrics/${playerId}`)
        );
      }
      return (
        typeof key === 'string' &&
        key.includes('/api/analytics/player-metrics')
      );
    },
  });
};

export const invalidateMatchPredictions = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return (
        typeof key === 'string' &&
        key.includes('/api/analytics/match-prediction')
      );
    },
  });
};

export const warmCache = async (
  queryClient: QueryClient,
  keys: Array<{ queryKey: any[]; staleTime: number }>
) => {
  const warmQueries = keys.map(({ queryKey, staleTime }) =>
    queryClient.prefetchQuery({
      queryKey,
      staleTime,
    })
  );

  await Promise.allSettled(warmQueries);
};

export const optimisticTeamUpdate = (
  queryClient: QueryClient,
  updater: (oldData: any) => any
) => {
  queryClient.setQueryData(['/api/analytics/team-metrics'], updater);
  queryClient.setQueryData(['/api/analytics/dashboard'], (oldData: any) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      lastUpdated: new Date().toISOString(),
    };
  });
};

export const getQueryOptions = (type: keyof typeof STALE_TIME) => ({
  staleTime: STALE_TIME[type],
  gcTime: CACHE_TIME[type],
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
});
