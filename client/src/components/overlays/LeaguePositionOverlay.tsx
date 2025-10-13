import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  OverlayLoadingSkeleton,
  OverlayEmptyState,
  OverlayErrorState,
  OverlaySourceBadge,
} from "./OverlayStates";

type Size = number | string;

interface LeaguePositionOverlayProps {
  width: number;                 // numeric for layout math
  height: number;                // numeric for layout math
  opacity?: number;
  leagueId?: number | string;    // default 39
  season?: number | string;      // default 2025
  endpoint?: string;             // default "/api/database/standings"
  adminEndpoint?: string;        // default "/api/admin/update/standings"
}

interface ComparativeMetrics {
  standings?: {
    liverpoolPosition?: number;
    liverpoolPoints?: number;
    pointsFromLeader?: number;
    pointsFromTop4?: number;
    top6Standings?: Array<{ position: number; name: string; points: number }>;
  };
}

type ApiPayload =
  | {
      data: Array<{
        position: number;
        team: string;
        points: number;
      }>;
      lastUpdated?: string;
      source?: string;
    }
  | {
      standings: Array<{
        position: number;
        team: string;
        points: number;
      }>;
      lastUpdated?: string;
      source?: string;
    };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function cssSize(v: Size) {
  return typeof v === "number" ? `${v}px` : v;
}

export default function LeaguePositionOverlay({
  width,
  height,
  opacity = 0.88,
  leagueId = 39,
  season = 2025,
  endpoint = "/api/database/standings",
  adminEndpoint = "/api/admin/update/standings",
}: LeaguePositionOverlayProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ---- Data Fetch ----
  const params = new URLSearchParams();
  params.set("leagueId", String(leagueId));
  params.set("season", String(season));
  const url = `${endpoint}?${params.toString()}`;

  const {
    data: standingsData,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiPayload>({
    queryKey: ["standings-db", leagueId, season, endpoint],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch standings (${response.status})`);
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // ---- Refresh handler ----
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(adminEndpoint, { method: "POST" });
      if (!response.ok) throw new Error("Failed to refresh data");
      await refetch();
      toast({
        title: "Data refreshed",
        description: "League standings have been updated.",
      });
    } catch (e) {
      toast({
        title: "Refresh failed",
        description: "Could not update standings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // ---- Transform ----
  const comparative = useMemo(() => {
    const rows: Array<{ position: number; team: string; points: number }> =
      (standingsData as any)?.data ??
      (standingsData as any)?.standings ??
      [];

    if (!rows || !rows.length) return null;

    const liverpoolData = rows.find(
      (t) => t.team === "Liverpool" || t.team?.includes?.("Liverpool")
    );
    const top6 = rows.slice(0, 6);

    if (!liverpoolData) return null;

    const leaderPoints = rows[0]?.points || 0;
    const top4Points = rows[3]?.points || 0;

    return {
      standings: {
        liverpoolPosition: liverpoolData.position,
        liverpoolPoints: liverpoolData.points,
        pointsFromLeader: leaderPoints - liverpoolData.points,
        pointsFromTop4: Math.max(0, top4Points - liverpoolData.points),
        top6Standings: top6.map((t) => ({
          position: t.position,
          name: t.team,
          points: t.points,
        })),
      },
      lastUpdated: (standingsData as any)?.lastUpdated,
      source: (standingsData as any)?.source,
    } as ComparativeMetrics & { lastUpdated?: string; source?: string };
  }, [standingsData]);

  // ---- Scale helpers ----
  const { scale, scaleValue } = useMemo(() => {
    // Use actual container dimensions
    const containerWidth = width || 100;
    const containerHeight = height || 100;

    // Smaller baseline for better scaling
    const baseWidth = 280;
    const baseHeight = 220;

    const scaleWidth = containerWidth / baseWidth;
    const scaleHeight = containerHeight / baseHeight;
    const calculatedScale = Math.min(scaleWidth, scaleHeight);

    // More flexible scale range
    const finalScale = clamp(calculatedScale, 0.3, 2.5);

    const valueFn = (base: number, options?: { min?: number; max?: number }) => {
      const scaled = base * finalScale;
      const min = options?.min ?? base * 0.25;
      const max = options?.max ?? base * 2;
      return clamp(scaled, min, max);
    };

    return { scale: finalScale, scaleValue: valueFn };
  }, [width, height]);

  // ---- States ----
  if (isLoading) {
    return (
      <OverlayLoadingSkeleton
        width={width}
        height={height}
        message="Loading league position…"
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
        expectedData="{ data: Array<{position, team, points}> } or { standings: Array<{...}> }"
        source="League Position"
      />
    );
  }

  if (!comparative) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="No standings data available"
      />
    );
  }

  const { standings } = comparative;
  const liverpoolPosition = standings?.liverpoolPosition ?? 0;
  const liverpoolPoints = standings?.liverpoolPoints ?? 0;
  const pointsFromLeader = standings?.pointsFromLeader ?? 0;
  const pointsFromTop4 = standings?.pointsFromTop4 ?? 0;
  const top6Teams = standings?.top6Standings ?? [];

  const isUltraCompact = height < 120;
  const isCompact = height < 180 && !isUltraCompact;
  const showTopRace = height >= 150;

  const maxChars = Math.max(6, Math.floor(width / scaleValue(20, { min: 10, max: 26 })));

  const estimatedReserved = isUltraCompact ? 70 : showTopRace ? 170 : 130;
  const rowHeight = scaleValue(isUltraCompact ? 16 : 22, { min: 12, max: 28 });
  const availableRows = Math.max(Math.floor((height - estimatedReserved) / rowHeight), 1);
  const teamCount = Math.min(top6Teams.length, Math.min(6, availableRows));

  const containerPadding = scaleValue(16, { min: 6, max: 24 });
  const sectionGap = scaleValue(12, { min: 4, max: 16 });

  const sourceLabel = comparative?.source || "Database";
  const timestampIso = comparative?.lastUpdated;

  return (
    <motion.div
      style={{
        width: cssSize(width),
        height: cssSize(height),
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        border: "2px solid rgba(200,16,46,0.5)",
        borderRadius: 12,
        padding: containerPadding,
        fontFamily: "League Spartan, system-ui, sans-serif",
        opacity,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: sectionGap,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      data-testid="league-position-overlay"
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={18} />
          <div style={{ fontWeight: 700 }}>League Position</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={14} />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* Position Info */}
      <div style={{ fontSize: 32, fontWeight: 700 }}>
        #{liverpoolPosition}
      </div>
      <div style={{ fontSize: 14 }}>
        {liverpoolPoints} points
      </div>

      {showTopRace && pointsFromLeader > 0 && (
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {pointsFromLeader} pts from leader
        </div>
      )}

      {/* Top 6 Teams */}
      {teamCount > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {top6Teams.slice(0, teamCount).map((team, idx) => (
            <div
              key={team.name || idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 8,
                background: team.name?.includes("Liverpool") ? "rgba(200,16,46,0.2)" : "rgba(255,255,255,0.05)",
                borderRadius: 6,
              }}
            >
              <div style={{ fontWeight: team.name?.includes("Liverpool") ? 700 : 400 }}>
                {team.position}. {team.name}
              </div>
              <div style={{ fontWeight: 600 }}>{team.points} pts</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
          borderTop: "1px solid rgba(200,16,46,0.5)",
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
