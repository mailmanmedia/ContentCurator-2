import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";
import { COLOR_PALETTES, type ColorPaletteKey } from "./FormGuideOverlay";

type Size = number | string;

type Player = {
  id: string | number;
  name: string;
  shortName?: string;
  position?: string;
  number?: number;
  nationality?: string;
  photoUrl?: string;
  teamName?: string;
};

type StatLine = {
  playerId: string | number;
  appearances?: number;
  minutes?: number;
  goals?: number;
  assists?: number;
  shots?: number;
  shotsOnTarget?: number;
  chancesCreated?: number;
  xG?: number;
  xA?: number;
  passes?: number;
  passAccuracy?: number; // 0..1
  tackles?: number;
  interceptions?: number;
  duelsWon?: number;
};

type ApiPayload =
  | {
      data: {
        players: Player[];
        stats: StatLine[];
        season?: string | number;
      };
      source?: string;
      timestamp?: string;
    }
  | {
      players: Player[];
      stats: StatLine[];
      season?: string | number;
      source?: string;
      timestamp?: string;
    };

export interface PlayerComparisonOverlayProps {
  width: Size;
  height: Size;
  /** Provide exactly two player IDs for direct comparison */
  playerIds: Array<string | number>;
  /** Optional team/league filters to scope the API */
  teamId?: string | number;
  leagueId?: string | number;
  /** Season to display/query (e.g., 2025) */
  season?: string | number;
  /** Which metrics to show and in what order */
  metrics?: (keyof StatLine)[];
  /** Max rows (metrics) to render; default shows all passed metrics */
  limit?: number;
  /** Visual opacity */
  opacity?: number;
  /** Theme palette key */
  colorPalette?: ColorPaletteKey;
  /** API endpoint override (defaults to /api/player-comparison) */
  endpoint?: string;
}

function cssSize(v: Size) {
  return typeof v === "number" ? `${v}px` : v;
}

const DEFAULT_METRICS: (keyof StatLine)[] = [
  "appearances",
  "minutes",
  "goals",
  "assists",
  "shotsOnTarget",
  "xG",
  "xA",
  "passes",
  "passAccuracy",
  "tackles",
  "interceptions",
  "duelsWon",
];

export default function PlayerComparisonOverlay({
  width,
  height,
  playerIds,
  teamId,
  leagueId,
  season,
  metrics = DEFAULT_METRICS,
  limit,
  opacity = 0.95,
  colorPalette = "classic",
  endpoint,
}: PlayerComparisonOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Guard: require exactly two players
  const twoPlayersValid = Array.isArray(playerIds) && playerIds.length === 2;

  const params = new URLSearchParams();
  if (twoPlayersValid) params.set("playerIds", playerIds.join(","));
  if (teamId != null) params.set("teamId", String(teamId));
  if (leagueId != null) params.set("leagueId", String(leagueId));
  if (season != null) params.set("season", String(season));
  const url = `${endpoint || "/api/player-comparison"}?${params.toString()}`;

  const { data, isLoading, error, refetch } = useQuery<ApiPayload>({
    queryKey: ["player-comparison", playerIds, teamId, leagueId, season, endpoint],
    queryFn: async () => {
      if (!twoPlayersValid) {
        // Early, but maintain consistent error surface
        throw new Error("PlayerComparisonOverlay requires exactly two playerIds.");
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch player comparison (${res.status})`);
      return res.json();
    },
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  if (!twoPlayersValid) {
    return (
      <OverlayErrorState
        width={width}
        height={height}
        error={new Error("Provide exactly two playerIds to compare.")}
        expectedData="playerIds: [id1, id2]"
        source="Player Comparison"
      />
    );
  }

  if (isLoading) {
    return (
      <OverlayLoadingSkeleton
        width={width}
        height={height}
        message="Loading player comparison…"
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
        expectedData="{ data: { players: Player[], stats: StatLine[] } } or { players: Player[], stats: StatLine[] }"
        source="Player Comparison"
      />
    );
  }

  const players: Player[] =
    (data as any)?.data?.players ?? (data as any)?.players ?? [];
  const stats: StatLine[] =
    (data as any)?.data?.stats ?? (data as any)?.stats ?? [];
  const payloadSeason =
    (data as any)?.data?.season ?? (data as any)?.season ?? season;
  const sourceLabel = (data as any)?.source || "Comparison";
  const timestampIso = (data as any)?.timestamp;

  // map for quick access
  const playerMap = useMemo(() => {
    const m = new Map<string | number, Player>();
    players.forEach((p) => m.set(p.id, p));
    return m;
  }, [players]);

  const statMap = useMemo(() => {
    const m = new Map<string | number, StatLine>();
    stats.forEach((s) => m.set(s.playerId, s));
    return m;
  }, [stats]);

  const [aId, bId] = playerIds;
  const playerA = playerMap.get(aId);
  const playerB = playerMap.get(bId);
  const statsA = statMap.get(aId) || {};
  const statsB = statMap.get(bId) || {};

  if (!playerA || !playerB) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="Players not found for comparison"
      />
    );
  }

  const shownMetrics = limit ? metrics.slice(0, limit) : metrics;

  function onRefresh() {
    setIsRefreshing(true);
    refetch()
      .then(() => toast({ title: "Comparison updated", description: "Data refreshed." }))
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
      data-testid="player-comparison-overlay"
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
            <Users size={18} />
            <div style={{ fontWeight: 700 }}>Player Comparison</div>
          </div>
          <div style={{ fontSize: 12, color: "#C8102E" }}>
            {playerA.shortName || playerA.name} vs {playerB.shortName || playerB.name}
            {payloadSeason ? ` • ${payloadSeason} Season` : ""}
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

      {/* Player headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px 1fr",
          gap: 12,
          alignItems: "center",
        }}
      >
        <PlayerHeader player={playerA} align="right" />
        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "6px 10px",
          }}
        >
          Metrics
        </div>
        <PlayerHeader player={playerB} align="left" />
      </div>

      {/* Metric rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
        }}
      >
        {shownMetrics.map((key) => {
          const aVal = (statsA as any)?.[key];
          const bVal = (statsB as any)?.[key];

          // normalize to number where possible for simple bar viz
          const aNum = typeof aVal === "number" ? aVal : aVal == null ? 0 : Number(aVal);
          const bNum = typeof bVal === "number" ? bVal : bVal == null ? 0 : Number(bVal);
          const max = Math.max(aNum || 0, bNum || 0, 1);

          return (
            <div
              key={String(key)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 1fr",
                gap: 12,
                alignItems: "center",
              }}
            >
              {/* A value with bar right-aligned */}
              <ValueWithBar
                value={aVal}
                fraction={aNum / max}
                align="right"
                accent="rgba(76,169,224,0.9)" // sky
              />

              {/* Metric label */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  opacity: 0.9,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={labelForMetric(key)}
              >
                {labelForMetric(key)}
              </div>

              {/* B value with bar left-aligned */}
              <ValueWithBar
                value={bVal}
                fraction={bNum / max}
                align="left"
                accent="rgba(200,16,46,0.9)" // red
              />
            </div>
          );
        })}
      </div>

      <OverlaySourceBadge label={sourceLabel} timestampIso={timestampIso} />
    </motion.div>
  );
}

function PlayerHeader({
  player,
  align,
}: {
  player: Player;
  align: "left" | "right";
}) {
  const justify = align === "left" ? "flex-start" : "flex-end";
  const textAlign = align;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: justify,
      }}
    >
      {align === "right" ? (
        <>
          <div style={{ textAlign, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={player.shortName || player.name}
            >
              {player.shortName || player.name}
            </div>
            {player.teamName && (
              <div style={{ fontSize: 11, opacity: 0.75 }}>{player.teamName}</div>
            )}
          </div>
          <Avatar photoUrl={player.photoUrl} name={player.shortName || player.name} />
        </>
      ) : (
        <>
          <Avatar photoUrl={player.photoUrl} name={player.shortName || player.name} />
          <div style={{ textAlign, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={player.shortName || player.name}
            >
              {player.shortName || player.name}
            </div>
            {player.teamName && (
              <div style={{ fontSize: 11, opacity: 0.75 }}>{player.teamName}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ photoUrl, name }: { photoUrl?: string; name: string }) {
  return photoUrl ? (
    <img
      src={photoUrl}
      alt={name}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid rgba(255,255,255,0.3)",
      }}
    />
  ) : (
    <div
      title="No photo"
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.3)",
      }}
    >
      ?
    </div>
  );
}

function ValueWithBar({
  value,
  fraction,
  align,
  accent,
}: {
  value: any;
  fraction: number; // 0..1
  align: "left" | "right";
  accent: string;
}) {
  // pretty-print percentages if metric looks like accuracy ratio
  const display =
    typeof value === "number" && value > 0 && value <= 1
      ? `${(value * 100).toFixed(0)}%`
      : value ?? "—";

  const barStyle: React.CSSProperties = {
    height: 8,
    width: `${Math.max(4, Math.min(100, Math.round(fraction * 100)))}%`,
    background: accent,
    borderRadius: 6,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        alignItems: "center",
      }}
      title={String(display)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: align === "left" ? "flex-start" : "flex-end",
          gap: 8,
          alignItems: "center",
        }}
      >
        {align === "right" && (
          <div style={{ fontVariantNumeric: "tabular-nums" }}>{display}</div>
        )}
        <div
          style={{
            flex: "0 0 60%",
            display: "flex",
            justifyContent: align === "left" ? "flex-start" : "flex-end",
          }}
        >
          <div style={barStyle} />
        </div>
        {align === "left" && (
          <div style={{ fontVariantNumeric: "tabular-nums" }}>{display}</div>
        )}
      </div>
    </div>
  );
}

function labelForMetric(key: keyof StatLine): string {
  switch (key) {
    case "appearances":
      return "Appearances";
    case "minutes":
      return "Minutes";
    case "goals":
      return "Goals";
    case "assists":
      return "Assists";
    case "shots":
      return "Shots";
    case "shotsOnTarget":
      return "Shots on Target";
    case "chancesCreated":
      return "Chances Created";
    case "xG":
      return "Expected Goals (xG)";
    case "xA":
      return "Expected Assists (xA)";
    case "passes":
      return "Passes";
    case "passAccuracy":
      return "Pass Accuracy";
    case "tackles":
      return "Tackles";
    case "interceptions":
      return "Interceptions";
    case "duelsWon":
      return "Duels Won";
    default:
      return String(key);
  }
}
