import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";
import { COLOR_PALETTES, type ColorPaletteKey } from "./FormGuideOverlay";
import { useOverlayData } from "@/hooks/useOverlayData";

type Size = number | string;

type Player = {
  id: string | number;
  name: string;
  shortName?: string;
  position?: string;
  number?: number;
  nationality?: string;
  photoUrl?: string;
};

type PlayerStatLine = {
  playerId: string | number;
  appearances?: number;
  minutes?: number;
  goals?: number;
  assists?: number;
  shots?: number;
  shotsOnTarget?: number;
  chancesCreated?: number;
  passes?: number;
  passAccuracy?: number; // 0..1
  tackles?: number;
  interceptions?: number;
  clearances?: number;
  duelsWon?: number;
  xG?: number;
  xA?: number;
};

type DatabasePlayerStat = {
  id: number;
  player_id: number;
  player_name: string;
  player_photo: string | null;
  team_name: string;
  games_appearances?: number | null;
  games_minutes?: number | null;
  games_position?: string | null;
  goals_total?: number | null;
  goals_assists?: number | null;
  shots_total?: number | null;
  shots_on?: number | null;
  passes_total?: number | null;
  passes_key?: number | null;
  passes_accuracy?: number | null;
  tackles_total?: number | null;
  tackles_interceptions?: number | null;
  duels_total?: number | null;
  duels_won?: number | null;
};

type ApiPayload =
  | {
      data: {
        players: Player[];
        stats: PlayerStatLine[];
      };
      source?: string;
      timestamp?: string;
      lastUpdated?: string;
    }
  | {
      players: Player[];
      stats: PlayerStatLine[];
      source?: string;
      timestamp?: string;
      lastUpdated?: string;
    }
  | {
      data: {
        statistics: DatabasePlayerStat[];
      };
      source?: string;
      lastUpdated?: string;
    };

export interface PlayerStatsOverlayProps {
  width: Size;
  height: Size;
  /** Team or squad identifier to fetch stats for */
  teamId?: string | number;
  /** League identifier (optional) */
  leagueId?: string | number;
  /** Season used for both query and subtitle (e.g., 2025) */
  season?: string | number;
  /** Limit of players to show; defaults to 12 */
  limit?: number;
  /** Sort key (e.g., "goals", "assists", "xG") */
  sortBy?: keyof PlayerStatLine;
  /** Opacity of the card container */
  opacity?: number;
  /** Theme palette key */
  colorPalette?: ColorPaletteKey;
  /** API endpoint override. Defaults to /api/database/stats for database-first approach */
  endpoint?: string;
  /** Use legacy API endpoint instead of database. Defaults to false (use database) */
  useLegacyApi?: boolean;
}

function cssSize(v: Size) {
  return typeof v === "number" ? `${v}px` : v;
}

export default function PlayerStatsOverlay({
  width,
  height,
  teamId,
  leagueId,
  season = 2025,
  limit = 12,
  sortBy = "goals",
  opacity = 0.95,
  colorPalette = "classic",
  endpoint,
  useLegacyApi = false,
}: PlayerStatsOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (teamId != null) params.set("teamId", String(teamId));
    if (leagueId != null) params.set("leagueId", String(leagueId));
    if (season != null) params.set("season", String(season));
    if (limit != null) params.set("limit", String(limit));

    const defaultEndpoint = useLegacyApi ? "/api/player-stats" : "/api/database/stats";
    const resolvedEndpoint = endpoint || defaultEndpoint;
    return `${resolvedEndpoint}?${params.toString()}`;
  }, [teamId, leagueId, season, limit, endpoint, useLegacyApi]);

  const { data, isLoading, error, refetch } = useOverlayData<ApiPayload>({
    queryKey: ["player-stats", teamId, leagueId, season, limit, url],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch player stats (${res.status})`);
      return res.json();
    },
    overlayName: "Player Stats",
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <OverlayLoadingSkeleton
        width={width}
        height={height}
        message="Loading player stats…"
      />
    );
  }

  if (error) {
    return (
      <OverlayErrorState
        width={width}
        height={height}
        error={error as Error}
        endpoint={url}
        expectedData="{ data: { players: Player[], stats: PlayerStatLine[] } } or { players: Player[], stats: PlayerStatLine[] }"
        source="Player Stats"
      />
    );
  }

  // Transform database format to overlay format
  const transformDatabaseStats = (dbStats: DatabasePlayerStat[]): { players: Player[], stats: PlayerStatLine[] } => {
    const players: Player[] = dbStats.map(s => ({
      id: s.player_id,
      name: s.player_name,
      position: s.games_position || undefined,
      photoUrl: s.player_photo || undefined,
    }));

    const stats: PlayerStatLine[] = dbStats.map(s => ({
      playerId: s.player_id,
      appearances: s.games_appearances ?? undefined,
      minutes: s.games_minutes ?? undefined,
      goals: s.goals_total ?? undefined,
      assists: s.goals_assists ?? undefined,
      shots: s.shots_total ?? undefined,
      shotsOnTarget: s.shots_on ?? undefined,
      chancesCreated: s.passes_key ?? undefined,
      passes: s.passes_total ?? undefined,
      passAccuracy: s.passes_accuracy ? s.passes_accuracy / 100 : undefined, // Convert 70.4 to 0.704
      tackles: s.tackles_total ?? undefined,
      interceptions: s.tackles_interceptions ?? undefined,
      duelsWon: s.duels_won ?? undefined,
    }));

    return { players, stats };
  };

  // Handle both database and legacy API formats
  let payloadPlayers: Player[];
  let payloadStats: PlayerStatLine[];
  
  if ((data as any)?.data?.statistics) {
    // Database format
    const transformed = transformDatabaseStats((data as any).data.statistics);
    payloadPlayers = transformed.players;
    payloadStats = transformed.stats;
  } else {
    // Legacy API format
    payloadPlayers = (data as any)?.data?.players ?? (data as any)?.players ?? [];
    payloadStats = (data as any)?.data?.stats ?? (data as any)?.stats ?? [];
  }
  
  const sourceLabel = (data as any)?.source || "Squad";
  const timestampIso = (data as any)?.timestamp || (data as any)?.lastUpdated;

  if (!payloadPlayers.length || !payloadStats.length) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="No player stats available"
      />
    );
  }

  // Join players + stat lines
  const rows = useMemo(() => {
    const byId = new Map<string | number, Player>();
    payloadPlayers.forEach((p) => byId.set(p.id, p));

    const joined = payloadStats
      .map((s) => ({
        player: byId.get(s.playerId),
        stats: s,
      }))
      .filter((r) => r.player);

    // Sort by selected metric (desc if numeric)
    const sorted = [...joined].sort((a, b) => {
      const av = (a.stats as any)?.[sortBy];
      const bv = (b.stats as any)?.[sortBy];

      // if values absent, push to bottom
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      // numeric desc
      if (typeof av === "number" && typeof bv === "number") {
        return bv - av;
      }

      // fallback: string compare asc
      return String(av).localeCompare(String(bv));
    });

    return limit ? sorted.slice(0, limit) : sorted;
  }, [payloadPlayers, payloadStats, sortBy, limit]);

  function onRefresh() {
    setIsRefreshing(true);
    refetch()
      .then(() => {
        toast({ title: "Player stats updated", description: "Data refreshed." });
      })
      .catch((e) =>
        toast({
          title: "Refresh failed",
          description: String(e),
          variant: "destructive",
        })
      )
      .finally(() => setIsRefreshing(false));
  }

  return (
    <motion.div
      style={{
        width: cssSize(width),
        height: cssSize(height),
        background: palette.background,
        color: palette.text,
        border: `2px solid ${palette.border}`,
        borderRadius: 12,
        padding: 16,
        fontFamily: "League Spartan, system-ui, sans-serif",
        opacity,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      data-testid="player-stats-overlay"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <User size={18} />
            <div style={{ fontWeight: 700 }}>Player Stats</div>
          </div>
          <div style={{ fontSize: 12, color: "#C8102E" }}>
            Liverpool FC • {season} Season
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(150px, 2fr) repeat(3, minmax(60px, 1fr))",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          fontSize: 12,
          fontWeight: 700,
          opacity: 0.9,
        }}
      >
        <div>Player</div>
        <div>Apps</div>
        <div>Goals</div>
        <div>Assists</div>
      </div>

      {/* Rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          overflowY: "auto",
          flex: 1,
        }}
      >
        {rows.map((row) => (
          <div
            key={row.player?.id || row.player?.name}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(150px, 2fr) repeat(3, minmax(60px, 1fr))",
              gap: 8,
              alignItems: "center",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {row.player?.name || "Unknown"}
            </div>
            <div>{row.stats?.appearances ?? 0}</div>
            <div>{row.stats?.goals ?? 0}</div>
            <div>{row.stats?.assists ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
          borderTop: `1px solid ${palette.border}`,
          fontSize: 11,
          opacity: 0.7,
        }}
      >
        <OverlaySourceBadge label={sourceLabel} />
        {timestampIso && (
          <div>Updated: {new Date(timestampIso).toLocaleString()}</div>
        )}
      </div>
    </motion.div>
  );
}
