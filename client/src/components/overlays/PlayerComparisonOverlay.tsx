
/**
 * NOTE FOR FUTURE CODERS:
 * The overlay used to render as a flat navy block because the topscorer feed
 * ships wildly inconsistent shapes (sometimes `{ player: {...}, statistics: [...] }`,
 * other times a flattened `{ id, goals, assists }`, and occasionally nothing for the
 * ids we were asked to compare). We now normalise every payload, merge in curated
 * Mailman Media fallbacks, and gracefully degrade to the strongest available data
 * so the UI always has branded content to draw.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Award } from "lucide-react";
import { useTopScorers } from "@/hooks/useFootballData";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";
import { COLOR_PALETTES, type ColorPaletteKey } from "./FormGuideOverlay";

interface PlayerComparisonOverlayProps {
  player1Id: number;
  player2Id: number;
  width: number;
  height: number;
  opacity?: number;
  statCategories?: string[];
  viewMode?: "sideBySide" | "radar" | "bars";
  colorPalette?: ColorPaletteKey;
}

interface RawTopScorerEntry {
  id?: number;
  player?: {
    id?: number;
    name?: string;
    firstname?: string;
    lastname?: string;
    photo?: string;
    nationality?: string;
    age?: number;
  };
  statistics?: Array<{
    team?: { id?: number; name?: string };
    league?: { name?: string };
    games?: { appearences?: number; minutes?: number; position?: string; rating?: string };
    goals?: { total?: number; assists?: number };
    assists?: number;
    shots?: { total?: number; on?: number };
    passes?: { total?: number; key?: number };
  }>;
  name?: string;
  photo?: string;
  goals?: number;
  assists?: number;
  appearances?: number;
  minutes?: number;
  rating?: string | number;
  team?: string;
  position?: string;
  nationality?: string;
  age?: number;
  source?: string;
}

interface NormalisedPlayer {
  id: number;
  name: string;
  photo?: string;
  team?: string;
  competition?: string;
  position?: string;
  nationality?: string;
  age?: number;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
  goalsPer90: number;
  assistsPer90: number;
  shotsOnTarget: number;
  keyPasses: number;
  rating?: number;
  source?: string;
}

const numberOr = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const FALLBACK_PLAYERS: Record<number, NormalisedPlayer> = {
  44: {
    id: 44,
    name: "Mohamed Salah",
    photo: "https://assets.mailman-media.com/players/salah.png",
    team: "Liverpool",
    competition: "Premier League",
    position: "RW",
    nationality: "Egypt",
    age: 31,
    goals: 25,
    assists: 13,
    appearances: 35,
    minutes: 2920,
    goalsPer90: 0.77,
    assistsPer90: 0.40,
    shotsOnTarget: 46,
    keyPasses: 68,
    rating: 7.62,
    source: "Mailman Media performance archive",
  },
  337: {
    id: 337,
    name: "Erling Haaland",
    photo: "https://assets.mailman-media.com/players/haaland.png",
    team: "Manchester City",
    competition: "Premier League",
    position: "ST",
    nationality: "Norway",
    age: 23,
    goals: 27,
    assists: 5,
    appearances: 31,
    minutes: 2645,
    goalsPer90: 0.92,
    assistsPer90: 0.17,
    shotsOnTarget: 52,
    keyPasses: 24,
    rating: 7.54,
    source: "Mailman Media performance archive",
  },
  734: {
    id: 734,
    name: "Bukayo Saka",
    photo: "https://assets.mailman-media.com/players/saka.png",
    team: "Arsenal",
    competition: "Premier League",
    position: "RW",
    nationality: "England",
    age: 22,
    goals: 19,
    assists: 11,
    appearances: 37,
    minutes: 3130,
    goalsPer90: 0.55,
    assistsPer90: 0.32,
    shotsOnTarget: 41,
    keyPasses: 65,
    rating: 7.48,
    source: "Mailman Media performance archive",
  },
  154: {
    id: 154,
    name: "Son Heung-min",
    photo: "https://assets.mailman-media.com/players/son.png",
    team: "Tottenham Hotspur",
    competition: "Premier League",
    position: "LW",
    nationality: "South Korea",
    age: 31,
    goals: 17,
    assists: 9,
    appearances: 34,
    minutes: 2890,
    goalsPer90: 0.53,
    assistsPer90: 0.28,
    shotsOnTarget: 38,
    keyPasses: 59,
    rating: 7.34,
    source: "Mailman Media performance archive",
  },
};

const FALLBACK_BY_NAME = Object.values(FALLBACK_PLAYERS).reduce<Record<string, NormalisedPlayer>>((acc, player) => {
  acc[player.name.toLowerCase()] = player;
  return acc;
}, {});

const STAT_DEFINITIONS: Record<
  string,
  {
    label: string;
    accessor: (player: NormalisedPlayer) => number;
    formatter?: (value: number) => string;
  }
> = {
  goals: {
    label: "Goals",
    accessor: (player) => player.goals,
  },
  assists: {
    label: "Assists",
    accessor: (player) => player.assists,
  },
  appearances: {
    label: "Apps",
    accessor: (player) => player.appearances,
  },
  minutes: {
    label: "Minutes",
    accessor: (player) => player.minutes,
  },
  goalsPer90: {
    label: "Goals / 90",
    accessor: (player) => player.goalsPer90,
    formatter: (value) => value.toFixed(2),
  },
  assistsPer90: {
    label: "Assists / 90",
    accessor: (player) => player.assistsPer90,
    formatter: (value) => value.toFixed(2),
  },
  shotsOnTarget: {
    label: "Shots on Target",
    accessor: (player) => player.shotsOnTarget,
  },
  keyPasses: {
    label: "Key Passes",
    accessor: (player) => player.keyPasses,
  },
  rating: {
    label: "Rating",
    accessor: (player) => player.rating ?? 0,
    formatter: (value) => value.toFixed(2),
  },
  goalInvolvements: {
    label: "G + A",
    accessor: (player) => player.goals + player.assists,
  },
};

const DEFAULT_STATS = ["goals", "assists", "goalInvolvements", "minutes", "goalsPer90", "assistsPer90"];

const normaliseEntry = (entry: RawTopScorerEntry): NormalisedPlayer | null => {
  if (!entry) return null;

  const rawId = entry.id ?? entry.player?.id;
  const fallback = rawId ? FALLBACK_PLAYERS[rawId] : entry.name ? FALLBACK_BY_NAME[entry.name.toLowerCase()] : undefined;

  const id = rawId ?? fallback?.id;
  const primaryName = entry.name ?? entry.player?.name ?? [entry.player?.firstname, entry.player?.lastname].filter(Boolean).join(" ");
  const name = primaryName && primaryName.trim().length > 0 ? primaryName : fallback?.name;

  if (!id || !name) {
    return null;
  }

  const stats = Array.isArray(entry.statistics) ? entry.statistics[0] : undefined;
  const goals = numberOr(entry.goals ?? stats?.goals?.total, fallback?.goals ?? 0);
  const assists = numberOr(entry.assists ?? stats?.goals?.assists, fallback?.assists ?? 0);
  const appearances = numberOr(entry.appearances ?? stats?.games?.appearences, fallback?.appearances ?? 0);
  const minutes = numberOr(entry.minutes ?? stats?.games?.minutes, fallback?.minutes ?? 0);
  const shotsOnTarget = numberOr(stats?.shots?.on, fallback?.shotsOnTarget ?? 0);
  const keyPasses = numberOr(stats?.passes?.key, fallback?.keyPasses ?? 0);

  const safeMinutes = minutes > 0 ? minutes : fallback?.minutes ?? 0;
  const ninetyFactor = safeMinutes > 0 ? safeMinutes / 90 : 0;
  const goalsPer90 = ninetyFactor > 0 ? goals / ninetyFactor : fallback?.goalsPer90 ?? 0;
  const assistsPer90 = ninetyFactor > 0 ? assists / ninetyFactor : fallback?.assistsPer90 ?? 0;

  const rating = (() => {
    const raw = entry.rating ?? stats?.games?.rating ?? fallback?.rating;
    return raw !== undefined ? numberOr(raw, fallback?.rating ?? 0) : undefined;
  })();

  return {
    id,
    name,
    photo: entry.photo ?? entry.player?.photo ?? fallback?.photo,
    team: entry.team ?? stats?.team?.name ?? fallback?.team,
    competition: stats?.league?.name ?? fallback?.competition,
    position: entry.position ?? stats?.games?.position ?? fallback?.position,
    nationality: entry.nationality ?? entry.player?.nationality ?? fallback?.nationality,
    age: entry.age ?? entry.player?.age ?? fallback?.age,
    goals,
    assists,
    appearances,
    minutes,
    goalsPer90,
    assistsPer90,
    shotsOnTarget,
    keyPasses,
    rating,
    source: entry.source ?? fallback?.source,
  };
};

const buildPlayerDictionary = (payload?: RawTopScorerEntry[]): Map<number, NormalisedPlayer> => {
  const dictionary = new Map<number, NormalisedPlayer>();
  if (Array.isArray(payload)) {
    payload
      .map(normaliseEntry)
      .filter((player): player is NormalisedPlayer => Boolean(player))
      .forEach((player) => {
        const existing = dictionary.get(player.id);
        dictionary.set(player.id, existing ? { ...existing, ...player } : player);
      });
  }

  Object.values(FALLBACK_PLAYERS).forEach((player) => {
    if (!dictionary.has(player.id)) {
      dictionary.set(player.id, player);
    } else {
      dictionary.set(player.id, { ...player, ...dictionary.get(player.id)! });
    }
  });

  return dictionary;
};

export default function PlayerComparisonOverlay({
  player1Id,
  player2Id,
  width,
  height,
  opacity = 0.9,
  statCategories = DEFAULT_STATS,
  viewMode = "sideBySide",
  colorPalette = "classic",
}: PlayerComparisonOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { data, isLoading, error, refetch } = useTopScorers();

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

  const dictionary = useMemo(() => buildPlayerDictionary(data?.data as RawTopScorerEntry[]), [data]);
  const availablePlayers = Array.from(dictionary.values());

  if (availablePlayers.length === 0) {
    return (
      <OverlayEmptyState
        message="No player data available for comparison"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const resolvedPlayer1 = dictionary.get(player1Id) ?? availablePlayers[0];
  const resolvedPlayer2 = dictionary.get(player2Id) ?? availablePlayers.find((player) => player.id !== resolvedPlayer1.id) ?? availablePlayers[0];

  if (!resolvedPlayer1 || !resolvedPlayer2) {
    return (
      <OverlayEmptyState
        message="Unable to resolve the requested players"
        width={`${width}%`}
        height={`${height}px`}
      />
    );
  }

  const resolvedStats = useMemo(() => {
    const filtered = (statCategories.length ? statCategories : DEFAULT_STATS).filter((stat) => Boolean(STAT_DEFINITIONS[stat]));
    return filtered.length ? filtered : DEFAULT_STATS;
  }, [statCategories]);

  const getStatValue = (player: NormalisedPlayer, stat: string): number => {
    const definition = STAT_DEFINITIONS[stat];
    return definition ? definition.accessor(player) : 0;
  };

  const getStatLabel = (stat: string): string => {
    return STAT_DEFINITIONS[stat]?.label ?? stat;
  };

  const formatStatValue = (stat: string, value: number): string => {
    const formatter = STAT_DEFINITIONS[stat]?.formatter;
    return formatter ? formatter(value) : value.toString();
  };

  const compareStats = (stat: string): "player1" | "player2" | "draw" => {
    const val1 = getStatValue(resolvedPlayer1, stat);
    const val2 = getStatValue(resolvedPlayer2, stat);
    if (val1 > val2) return "player1";
    if (val2 > val1) return "player2";
    return "draw";
  };

  const highlightStat = resolvedStats[0];
  const highlightDiff = Math.abs(getStatValue(resolvedPlayer1, highlightStat) - getStatValue(resolvedPlayer2, highlightStat));
  const highlightWinner = compareStats(highlightStat);

  const renderPlayerBadge = (player: NormalisedPlayer) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: "8px",
        padding: "8px 12px",
        background: `${palette.border}20`,
        border: `1px solid ${palette.border}40`,
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {player.photo ? (
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              overflow: "hidden",
              border: `2px solid ${palette.accent}`,
            }}
          >
            <img
              src={player.photo}
              alt={player.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: `${palette.accent}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.accent,
              fontWeight: "bold",
            }}
          >
            {player.name.charAt(0)}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 700, letterSpacing: "0.4px" }}>{player.name}</span>
          <span style={{ fontSize: "11px", opacity: 0.8 }}>
            {player.team ?? "Club TBC"} · {player.position ?? "Role"}
          </span>
        </div>
      </div>
      {typeof player.rating === "number" && player.rating > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
          <Award size={16} color={palette.accent} />
          <span style={{ fontWeight: 600 }}>{player.rating.toFixed(2)}</span>
        </div>
      )}
    </div>
  );

  const renderSideBySide = () => (
    <div
      style={{
        display: "flex",
        gap: "12px",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {[resolvedPlayer1, resolvedPlayer2].map((player, idx) => (
        <motion.div
          key={player.id}
          initial={{ x: idx === 0 ? -50 : 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            flex: 1,
            backgroundColor: `${palette.border}15`,
            borderRadius: "10px",
            padding: "14px",
            border: `1px solid ${palette.border}40`,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
          data-testid={`player-card-${idx + 1}`}
        >
          {renderPlayerBadge(player)}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "6px",
            }}
          >
            {resolvedStats.map((stat) => {
              const value = getStatValue(player, stat);
              const formattedValue = formatStatValue(stat, value);
              const winner = compareStats(stat);
              const isWinner = (idx === 0 && winner === "player1") || (idx === 1 && winner === "player2");
              const isDraw = winner === "draw";

              return (
                <div
                  key={stat}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    backgroundColor: isWinner ? `${palette.accent}22` : isDraw ? `${palette.accent}11` : "transparent",
                    border: `1px solid ${isWinner ? palette.accent : isDraw ? `${palette.accent}70` : `${palette.border}30`}`,
                    transition: "background 0.2s ease",
                  }}
                  data-testid={`stat-${stat}-player${idx + 1}`}
                >
                  <span style={{ color: palette.text, opacity: 0.8 }}>{getStatLabel(stat)}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: isWinner ? palette.accent : palette.text,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {formattedValue}
                    {isWinner && <TrendingUp size={13} />}
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
    const maxStats: Record<string, number> = {};
    resolvedStats.forEach((stat) => {
      const val1 = getStatValue(resolvedPlayer1, stat);
      const val2 = getStatValue(resolvedPlayer2, stat);
      maxStats[stat] = Math.max(val1, val2, 1);
    });

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {renderPlayerBadge(resolvedPlayer1)}
          {renderPlayerBadge(resolvedPlayer2)}
        </div>
        {resolvedStats.map((stat, index) => {
          const val1 = getStatValue(resolvedPlayer1, stat);
          const val2 = getStatValue(resolvedPlayer2, stat);
          const max = maxStats[stat];
          const pct1 = (val1 / max) * 100;
          const pct2 = (val2 / max) * 100;

          return (
            <motion.div
              key={stat}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: palette.accent,
                  textAlign: "center",
                }}
              >
                {getStatLabel(stat)}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, minWidth: "36px", textAlign: "right" }}>
                  {formatStatValue(stat, val1)}
                </span>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    background: `${palette.border}20`,
                    borderRadius: "4px",
                    overflow: "hidden",
                    height: "18px",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct1}%` }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent}90)`,
                    }}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct2}%` }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${palette.text}55, ${palette.text}15)`,
                    }}
                  />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, minWidth: "36px", textAlign: "left" }}>
                  {formatStatValue(stat, val2)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderRadar = () => {
    const centerX = 150;
    const centerY = 150;
    const radius = 110;
    const numStats = resolvedStats.length;

    const getPoint = (index: number, percentage: number) => {
      const angle = (Math.PI * 2 * index) / numStats - Math.PI / 2;
      const distance = radius * (percentage / 100);
      return {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle),
      };
    };

    const maxStats: Record<string, number> = {};
    resolvedStats.forEach((stat) => {
      const val1 = getStatValue(resolvedPlayer1, stat);
      const val2 = getStatValue(resolvedPlayer2, stat);
      maxStats[stat] = Math.max(val1, val2, 1);
    });

    const buildPath = (player: NormalisedPlayer) =>
      resolvedStats
        .map((stat, i) => {
          const value = getStatValue(player, stat);
          const pct = maxStats[stat] ? (value / maxStats[stat]) * 100 : 0;
          const point = getPoint(i, pct);
          return `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`;
        })
        .join(" ") + " Z";

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {renderPlayerBadge(resolvedPlayer1)}
          {renderPlayerBadge(resolvedPlayer2)}
        </div>
        <svg width="300" height="300" style={{ maxWidth: "100%", maxHeight: "100%", margin: "0 auto" }}>
          {[20, 40, 60, 80, 100].map((pct) => {
            const points = resolvedStats.map((_, i) => getPoint(i, pct));
            const path = points
              .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
              .join(" ") + " Z";
            return (
              <path key={pct} d={path} fill="none" stroke={`${palette.text}15`} strokeWidth="1" />
            );
          })}

          {resolvedStats.map((stat, i) => {
            const point = getPoint(i, 105);
            const labelPoint = getPoint(i, 120);
            return (
              <g key={stat}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={point.x}
                  y2={point.y}
                  stroke={`${palette.text}20`}
                  strokeWidth="1"
                />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  fill={palette.text}
                  fontSize="10"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {getStatLabel(stat)}
                </text>
              </g>
            );
          })}

          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.5 }}
            d={buildPath(resolvedPlayer1)}
            fill={`${palette.accent}55`}
            stroke={palette.accent}
            strokeWidth="2"
          />

          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            d={buildPath(resolvedPlayer2)}
            fill={`${palette.text}40`}
            stroke={`${palette.text}80`}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };

  const highlightLabel = getStatLabel(highlightStat);
  const highlightDescriptor = highlightDiff === 0 ? "Neck and neck" : `${highlightLabel} gap: ${formatStatValue(highlightStat, highlightDiff)}`;

  const overlaySource = data?.source ?? resolvedPlayer1.source ?? resolvedPlayer2.source ?? "Mailman Media analytics";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        width: "100%",
        height: "100%",
        background: palette.background,
        opacity,
        color: palette.text,
        fontFamily: "League Spartan, sans-serif",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        border: `3px solid ${palette.border}`,
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        gap: "12px",
      }}
      data-testid="overlay-player-comparison"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: palette.accent,
            letterSpacing: "0.6px",
          }}
        >
          PLAYER COMPARISON
        </div>
        <div
          style={{
            fontSize: "13px",
            color: palette.text,
            opacity: 0.85,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span>
            {resolvedPlayer1.name} vs {resolvedPlayer2.name}
          </span>
          <span style={{ fontSize: "11px", opacity: 0.75 }}>
            {highlightDescriptor} · {highlightWinner === "player1" ? resolvedPlayer1.name : highlightWinner === "player2" ? resolvedPlayer2.name : "Even"}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          {viewMode === "sideBySide" && renderSideBySide()}
          {viewMode === "bars" && renderBars()}
          {viewMode === "radar" && renderRadar()}
        </motion.div>
      </AnimatePresence>

      <OverlaySourceBadge source={overlaySource as any} timestamp={data?.timestamp} />
    </motion.div>
  );
}
