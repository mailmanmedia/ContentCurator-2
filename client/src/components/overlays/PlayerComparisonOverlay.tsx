/**
 * NOTE FOR FUTURE CODERS:
 * Vite's "Missing semicolon" error came from checking in a git diff blob
 * instead of real TypeScript. This rebuild restores a proper component and
 * tightens the responsive math so the comparison never collapses into an
 * empty navy box on compact canvases.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, RefreshCw } from "lucide-react";
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

type ViewMode = "sideBySide" | "radar" | "bars";

interface PlayerComparisonOverlayProps {
  player1Id: number;
  player2Id: number;
  width: number;
  height: number;
  opacity?: number;
  statCategories?: (StatKey | string)[];
  viewMode?: ViewMode;
  colorPalette?: ColorPaletteKey;
}

type RawEntry = Record<string, unknown>;

interface NormalisedPlayer {
  id: number;
  name: string;
  team?: string;
  photo?: string;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
  rating?: number;
  keyPasses?: number;
  shotsOnTarget?: number;
}

type StatKey =
  | "goals"
  | "assists"
  | "appearances"
  | "minutes"
  | "goalsPer90"
  | "assistsPer90"
  | "keyPasses"
  | "shotsOnTarget"
  | "rating";

type StatDefinition = {
  label: string;
  accessor: (player: NormalisedPlayer) => number;
  formatter?: (value: number) => string;
};

const DEFAULT_STATS: StatKey[] = ["goals", "assists", "appearances", "minutes"];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.\-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toStringValue = (value: unknown) => (typeof value === "string" ? value : "");

const minutesSafe = (player: NormalisedPlayer) => {
  if (player.minutes > 0) return player.minutes;
  if (player.appearances > 0) return player.appearances * 90;
  return 0;
};

const per90 = (player: NormalisedPlayer, stat: number) => {
  const minutes = minutesSafe(player);
  if (!minutes) return 0;
  return (stat / minutes) * 90;
};

const STAT_DEFINITIONS: Record<StatKey, StatDefinition> = {
  goals: {
    label: "Goals",
    accessor: (player) => player.goals,
  },
  assists: {
    label: "Assists",
    accessor: (player) => player.assists,
  },
  appearances: {
    label: "Appearances",
    accessor: (player) => player.appearances,
  },
  minutes: {
    label: "Minutes",
    accessor: (player) => player.minutes,
    formatter: (value) => Math.round(value).toLocaleString(),
  },
  goalsPer90: {
    label: "Goals / 90",
    accessor: (player) => per90(player, player.goals),
    formatter: (value) => value.toFixed(2),
  },
  assistsPer90: {
    label: "Assists / 90",
    accessor: (player) => per90(player, player.assists),
    formatter: (value) => value.toFixed(2),
  },
  keyPasses: {
    label: "Key Passes",
    accessor: (player) => player.keyPasses ?? 0,
  },
  shotsOnTarget: {
    label: "Shots on Target",
    accessor: (player) => player.shotsOnTarget ?? 0,
  },
  rating: {
    label: "Average Rating",
    accessor: (player) => player.rating ?? 0,
    formatter: (value) => (value ? value.toFixed(2) : "—"),
  },
};

const normaliseEntry = (entry: RawEntry | undefined): NormalisedPlayer | null => {
  if (!entry) return null;

  const playerBlock =
    entry.player && typeof entry.player === "object"
      ? (entry.player as Record<string, unknown>)
      : entry;

  const statisticsBlock = Array.isArray(entry.statistics)
    ? entry.statistics[0]
    : typeof entry.statistics === "object"
    ? (entry.statistics as Record<string, unknown>)
    : entry;

  const stats = (statisticsBlock ?? {}) as Record<string, any>;
  const games = (stats.games ?? {}) as Record<string, any>;
  const goals = (stats.goals ?? {}) as Record<string, any>;
  const passes = (stats.passes ?? {}) as Record<string, any>;
  const shots = (stats.shots ?? {}) as Record<string, any>;
  const teamBlock =
    (playerBlock.team && typeof playerBlock.team === "object"
      ? (playerBlock.team as Record<string, unknown>)
      : stats.team && typeof stats.team === "object"
      ? (stats.team as Record<string, unknown>)
      : entry.team && typeof entry.team === "object"
      ? (entry.team as Record<string, unknown>)
      : undefined) ?? {};

  const id = toNumber(playerBlock.id ?? entry.id, NaN);
  const name = toStringValue(playerBlock.name ?? entry.name);
  const first = toStringValue(playerBlock.firstname);
  const last = toStringValue(playerBlock.lastname);
  const resolvedName = (name || `${first} ${last}`.trim()).trim();

  if (!Number.isFinite(id) || !resolvedName) return null;

  return {
    id,
    name: resolvedName,
    team: toStringValue(teamBlock.name ?? entry.team) || undefined,
    photo: toStringValue(playerBlock.photo ?? entry.photo) || undefined,
    goals: toNumber(goals.total ?? stats.goals ?? entry.goals, 0),
    assists: toNumber(goals.assists ?? stats.assists ?? entry.assists, 0),
    appearances: toNumber(
      games.appearances ?? games.appearences ?? stats.appearances ?? entry.appearances,
      0,
    ),
    minutes: toNumber(games.minutes ?? stats.minutes ?? entry.minutes, 0),
    rating: (() => {
      const rating = toNumber(games.rating ?? stats.rating ?? entry.rating, NaN);
      return Number.isFinite(rating) ? rating : undefined;
    })(),
    keyPasses: (() => {
      const value = toNumber(passes.key ?? entry.keyPasses, NaN);
      return Number.isFinite(value) ? value : undefined;
    })(),
    shotsOnTarget: (() => {
      const value = toNumber(shots.on ?? entry.shotsOnTarget, NaN);
      return Number.isFinite(value) ? value : undefined;
    })(),
  };
};

const buildScaleHelpers = (width: number, height: number) => {
  if (!width || !height) {
    return {
      scale: 1,
      px: (value: number, bounds?: { min?: number; max?: number }) =>
        clamp(value, bounds?.min ?? value * 0.6, bounds?.max ?? value * 1.4),
    };
  }

  const baseWidth = 440;
  const baseHeight = 320;
  const computed = clamp(Math.min(width / baseWidth, height / baseHeight), 0.5, 1.75);

  const px = (value: number, bounds?: { min?: number; max?: number }) =>
    clamp(value * computed, bounds?.min ?? value * 0.45, bounds?.max ?? value * 1.8);

  return { scale: computed, px };
};

const compareWinner = (
  stat: StatKey,
  playerA: NormalisedPlayer,
  playerB: NormalisedPlayer,
): "player1" | "player2" | "draw" => {
  const valueA = STAT_DEFINITIONS[stat].accessor(playerA);
  const valueB = STAT_DEFINITIONS[stat].accessor(playerB);
  if (valueA > valueB) return "player1";
  if (valueB > valueA) return "player2";
  return "draw";
};

const formatValue = (definition: StatDefinition, raw: number) => {
  if (definition.formatter) return definition.formatter(raw);
  return Number.isFinite(raw) ? raw.toString() : "—";
};

const totalGoalInvolvements = (player: NormalisedPlayer) => player.goals + player.assists;

export default function PlayerComparisonOverlay({
  player1Id,
  player2Id,
  width,
  height,
  opacity = 0.92,
  statCategories = DEFAULT_STATS,
  viewMode = "sideBySide",
  colorPalette = "classic",
}: PlayerComparisonOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch player statistics from database
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['player-comparison-db'],
    queryFn: async () => {
      const response = await fetch('/api/database/players/top-scorers?season=2025&teamId=40&limit=20');
      if (!response.ok) throw new Error('Failed to fetch player stats');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Handle refresh of data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/update/players', { method: 'POST' });
      if (response.ok) {
        await refetch();
        toast({
          title: "Data refreshed",
          description: "Player data has been updated.",
        });
      } else {
        throw new Error('Failed to refresh data');
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update player data. Please try again.",
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
        source="Player comparison data"
      />
    );
  }

  if (!data?.data || !Array.isArray(data.data)) {
    return (
      <OverlayEmptyState
        message="No player data available for comparison"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const players = useMemo(() => {
    return data.data
      .map((entry) => normaliseEntry(entry as RawEntry))
      .filter((player): player is NormalisedPlayer => Boolean(player));
  }, [data.data]);

  const lookup = useMemo(() => {
    const map = new Map<number, NormalisedPlayer>();
    for (const player of players) {
      if (!map.has(player.id)) {
        map.set(player.id, player);
      }
    }
    return map;
  }, [players]);

  const player1 = lookup.get(player1Id) ?? players[0];
  const player2 = lookup.get(player2Id) ?? players.find((player) => player.id !== player1?.id);

  if (!player1 || !player2) {
    const missing: number[] = [];
    if (!player1) missing.push(player1Id);
    if (!player2) missing.push(player2Id);
    return (
      <OverlayEmptyState
        message={`Player data missing (ID${missing.length > 1 ? "s" : ""}: ${missing.join(", ")})`}
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const statKeys = statCategories.filter((key): key is StatKey => key in STAT_DEFINITIONS);
  const statsToRender = statKeys.length ? statKeys : DEFAULT_STATS;

  const { scale, px } = useMemo(() => buildScaleHelpers(width, height), [width, height]);
  const compactHeight = height * scale < 280;
  const narrowWidth = width * scale < 360;
  const stackCards = narrowWidth || compactHeight;

  const cardPadding = px(16, { min: 10, max: 28 });
  const gap = px(16, { min: 8, max: 26 });
  const borderRadius = px(14, { min: 8, max: 24 });
  const headerSize = px(20, { min: 14, max: 28 });
  const subHeaderSize = px(14, { min: 11, max: 20 });
  const statLabelSize = px(12, { min: 10, max: 16 });
  const badgeSize = px(56, { min: 40, max: 74 });

  const total1 = totalGoalInvolvements(player1);
  const total2 = totalGoalInvolvements(player2);
  const leader = total1 === total2 ? null : total1 > total2 ? player1 : player2;
  const leadDiff = Math.abs(total1 - total2);
  const headline = leader
    ? `${leader.name.split(" ")[0]} leads by ${leadDiff} goal involvement${leadDiff === 1 ? "" : "s"}`
    : "Level on goal involvements";

  const playerSummary = (player: NormalisedPlayer) => `${player.goals} G / ${player.assists} A`;

  const renderSideBySide = () => (
    <div
      style={{
        display: "flex",
        flexDirection: stackCards ? "column" : "row",
        gap,
        flex: 1,
      }}
    >
      {[player1, player2].map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            flex: 1,
            minWidth: stackCards ? "100%" : 0,
            background: `${palette.border}22`,
            border: `1px solid ${palette.border}55`,
            borderRadius,
            padding: cardPadding,
            display: "flex",
            flexDirection: "column",
            gap: px(12, { min: 8, max: 18 }),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: px(12, { min: 8, max: 18 }),
            }}
          >
            <div>
              <div style={{ fontSize: subHeaderSize, fontWeight: 700 }}>{player.name}</div>
              <div style={{ fontSize: px(11, { min: 9, max: 14 }), opacity: 0.72 }}>
                {player.team ?? "Club TBC"}
              </div>
            </div>
            {player.photo && (
              <div
                style={{
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `2px solid ${palette.accent}`,
                  flexShrink: 0,
                }}
              >
                <img
                  src={player.photo}
                  alt={player.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: px(6, { min: 4, max: 12 }),
            }}
          >
            {statsToRender.map((stat) => {
              const definition = STAT_DEFINITIONS[stat];
              const value = definition.accessor(player);
              const winner = compareWinner(stat, player1, player2);
              const isWinner = (index === 0 && winner === "player1") || (index === 1 && winner === "player2");
              const isDraw = winner === "draw";

              return (
                <div
                  key={`${player.id}-${stat}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: `${px(6, { min: 4, max: 10 })}px ${px(8, { min: 6, max: 14 })}px`,
                    borderRadius: px(10, { min: 6, max: 16 }),
                    fontSize: statLabelSize,
                    backgroundColor: isWinner
                      ? `${palette.accent}25`
                      : isDraw
                      ? `${palette.text}18`
                      : "transparent",
                    border: isWinner
                      ? `1px solid ${palette.accent}`
                      : isDraw
                      ? `1px solid ${palette.text}25`
                      : "1px solid transparent",
                  }}
                >
                  <span style={{ opacity: 0.78 }}>{definition.label}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: px(6, { min: 4, max: 10 }),
                      color: isWinner ? palette.accent : palette.text,
                    }}
                  >
                    {formatValue(definition, value)}
                    {isWinner && <TrendingUp size={px(14, { min: 12, max: 18 })} />}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderBars = () => {
    const maxima = new Map<StatKey, number>();
    statsToRender.forEach((stat) => {
      const definition = STAT_DEFINITIONS[stat];
      maxima.set(stat, Math.max(definition.accessor(player1), definition.accessor(player2), 1));
    });

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: px(12, { min: 8, max: 18 }),
          flex: 1,
          justifyContent: "center",
        }}
      >
        {statsToRender.map((stat, index) => {
          const definition = STAT_DEFINITIONS[stat];
          const value1 = definition.accessor(player1);
          const value2 = definition.accessor(player2);
          const max = maxima.get(stat) ?? 1;
          const pct1 = clamp((value1 / max) * 100, 0, 100);
          const pct2 = clamp((value2 / max) * 100, 0, 100);

          return (
            <motion.div
              key={stat}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              style={{ display: "flex", flexDirection: "column", gap: px(4, { min: 2, max: 6 }) }}
            >
              <div
                style={{
                  fontSize: statLabelSize,
                  fontWeight: 700,
                  color: palette.accent,
                  textAlign: "center",
                }}
              >
                {definition.label}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `${px(46, { min: 34, max: 60 })}px 1fr ${px(46, {
                    min: 34,
                    max: 60,
                  })}px`,
                  gap: px(10, { min: 6, max: 14 }),
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 700, textAlign: "right" }}>{formatValue(definition, value1)}</span>
                <div
                  style={{
                    position: "relative",
                    height: px(18, { min: 12, max: 22 }),
                    backgroundColor: `${palette.text}15`,
                    borderRadius: px(10, { min: 6, max: 14 }),
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct1}%` }}
                    transition={{ duration: 0.45 }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      backgroundColor: palette.accent,
                    }}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct2}%` }}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      backgroundColor: palette.text,
                      opacity: 0.6,
                    }}
                  />
                </div>
                <span style={{ fontWeight: 700 }}>{formatValue(definition, value2)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderRadar = () => {
    const chartSize = px(280, { min: 220, max: 360 });
    const radius = chartSize / 2.6;
    const center = chartSize / 2;
    const statsCount = statsToRender.length;

    const maxima = new Map<StatKey, number>();
    statsToRender.forEach((stat) => {
      const definition = STAT_DEFINITIONS[stat];
      maxima.set(stat, Math.max(definition.accessor(player1), definition.accessor(player2), 1));
    });

    const pointFor = (index: number, value: number, max: number) => {
      const angle = (Math.PI * 2 * index) / statsCount - Math.PI / 2;
      const distance = radius * (value / max);
      return {
        x: center + distance * Math.cos(angle),
        y: center + distance * Math.sin(angle),
      };
    };

    const pathFor = (player: NormalisedPlayer) => {
      const points = statsToRender.map((stat, index) => {
        const definition = STAT_DEFINITIONS[stat];
        const max = maxima.get(stat) ?? 1;
        const value = clamp(definition.accessor(player), 0, max);
        return pointFor(index, value, max);
      });
      return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z";
    };

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: chartSize,
        }}
      >
        <svg
          width={chartSize}
          height={chartSize}
          viewBox={`0 0 ${chartSize} ${chartSize}`}
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        >
          {[0.25, 0.5, 0.75, 1].map((step) => {
            const points = statsToRender.map((_, index) => {
              const angle = (Math.PI * 2 * index) / statsCount - Math.PI / 2;
              return {
                x: center + radius * step * Math.cos(angle),
                y: center + radius * step * Math.sin(angle),
              };
            });
            const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z";
            return <path key={step} d={path} fill="none" stroke={`${palette.text}25`} strokeWidth={1} />;
          })}

          {statsToRender.map((stat, index) => {
            const angle = (Math.PI * 2 * index) / statsCount - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <g key={stat}>
                <line x1={center} y1={center} x2={x} y2={y} stroke={`${palette.text}35`} strokeWidth={1} />
                <text
                  x={center + (radius + px(16, { min: 12, max: 22 })) * Math.cos(angle)}
                  y={center + (radius + px(16, { min: 12, max: 22 })) * Math.sin(angle)}
                  fill={palette.text}
                  fontSize={px(10, { min: 8, max: 14 })}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {STAT_DEFINITIONS[stat].label}
                </text>
              </g>
            );
          })}

          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.4 }}
            d={pathFor(player1)}
            fill={`${palette.accent}55`}
            stroke={palette.accent}
            strokeWidth={2}
          />
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            d={pathFor(player2)}
            fill={`${palette.text}40`}
            stroke={palette.text}
            strokeWidth={2}
          />
        </svg>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: `linear-gradient(138deg, ${palette.background}, ${palette.border})`,
        opacity,
        color: palette.text,
        fontFamily: "League Spartan, sans-serif",
        padding: cardPadding,
        borderRadius,
        border: `${Math.max(2 * scale, 1)}px solid ${palette.border}`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap,
        overflow: "hidden",
      }}
      data-testid="overlay-player-comparison"
    >
      <header
        style={{
          display: "flex",
          flexDirection: compactHeight ? "column" : "row",
          alignItems: compactHeight ? "flex-start" : "center",
          justifyContent: "space-between",
          gap,
        }}
      >
        <div>
          <div style={{ fontSize: headerSize, fontWeight: 800, letterSpacing: "0.08em", color: palette.accent }}>
            PLAYER COMPARISON
          </div>
          <div style={{ fontSize: subHeaderSize, fontWeight: 600, opacity: 0.85 }}>
            {player1.name} vs {player2.name}
          </div>
          <div style={{ fontSize: px(11, { min: 9, max: 14 }), opacity: 0.72 }}>{headline}</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: compactHeight ? "column" : "row",
            alignItems: compactHeight ? "flex-start" : "center",
            gap: px(10, { min: 6, max: 14 }),
            backgroundColor: `${palette.text}12`,
            borderRadius: px(999, { min: 18, max: 48 }),
            padding: `${px(8, { min: 6, max: 12 })}px ${px(18, { min: 10, max: 26 })}px`,
            border: `1px solid ${palette.text}25`,
            whiteSpace: compactHeight ? "normal" : "nowrap",
          }}
        >
          <span style={{ fontWeight: 700 }}>{playerSummary(player1)}</span>
          <span style={{ opacity: 0.6 }}>vs</span>
          <span style={{ fontWeight: 700 }}>{playerSummary(player2)}</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          style={{ flex: 1, display: "flex" }}
        >
          {viewMode === "sideBySide" && renderSideBySide()}
          {viewMode === "bars" && renderBars()}
          {viewMode === "radar" && renderRadar()}
        </motion.div>
      </AnimatePresence>

      <footer
        style={{
          display: "flex",
          flexDirection: compactHeight ? "column" : "row",
          gap: px(8, { min: 6, max: 14 }),
          fontSize: px(11, { min: 9, max: 14 }),
          opacity: 0.76,
        }}
      >
        <span>{player1.name.split(" ")[0]}: {total1} goal involvements</span>
        <span>·</span>
        <span>{player2.name.split(" ")[0]}: {total2} goal involvements</span>
      </footer>

      <OverlaySourceBadge source={data.source as string} timestamp={data.timestamp} />
    </motion.div>
  );
}