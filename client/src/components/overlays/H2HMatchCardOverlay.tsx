import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Users2, RefreshCw, Calendar, MapPin, Clock } from "lucide-react";
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

type Team = {
  id: string | number;
  name: string;
  shortName?: string;
  logo?: string;
  form?: string; // e.g., WDLWW
};

type MatchLite = {
  id: string | number;
  dateUtc: string; // ISO
  venue?: string;
  competition?: { name: string; code?: string };
  home: Team;
  away: Team;
  score?: { home: number; away: number };
};

type H2HPayload =
  | {
      data: {
        recent: MatchLite[]; // most recent head-to-heads
        summary?: {
          winsA: number;
          winsB: number;
          draws: number;
        };
      };
      source?: string;
      timestamp?: string;
    }
  | {
      recent: MatchLite[];
      summary?: { winsA: number; winsB: number; draws: number };
      source?: string;
      timestamp?: string;
    };

export interface H2HMatchCardOverlayProps {
  width: Size;
  height: Size;
  /** player- or team-centric IDs; keep naming stable with your API */
  teamAId: string | number;
  teamBId: string | number;
  /** limit of H2H matches to show */
  limit?: number;
  /** visual options */
  opacity?: number;
  colorPalette?: ColorPaletteKey;
  /** API override; default /api/h2h */
  endpoint?: string;
}

function cssSize(v: Size) {
  return typeof v === "number" ? `${v}px` : v;
}

export default function H2HMatchCardOverlay({
  width,
  height,
  teamAId,
  teamBId,
  limit = 5,
  opacity = 0.95,
  colorPalette = "classic",
  endpoint,
}: H2HMatchCardOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Build URL reactively when props change
  const url = useMemo(() => {
    console.log('[H2HMatchCardOverlay] Building URL with props:', { teamAId, teamBId, limit, endpoint });
    const params = new URLSearchParams();
    params.set("teamAId", String(teamAId));
    params.set("teamBId", String(teamBId));
    if (limit) params.set("limit", String(limit));
    const finalUrl = `${endpoint || "/api/h2h"}?${params.toString()}`;
    console.log('[H2HMatchCardOverlay] Final URL:', finalUrl);
    return finalUrl;
  }, [teamAId, teamBId, limit, endpoint]);

  const { data, isLoading, error, refetch } = useQuery<H2HPayload>({
    queryKey: ["h2h", teamAId, teamBId, limit, endpoint],
    queryFn: async () => {
      console.log('[H2HMatchCardOverlay] Fetching with URL:', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch H2H (${res.status})`);
      return res.json();
    },
    enabled: teamAId != null && teamBId != null && teamAId !== undefined && teamBId !== undefined,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  const sourceLabel = (data as any)?.source || "H2H";
  const timestampIso = (data as any)?.timestamp;
  const recent: MatchLite[] =
    (data as any)?.data?.recent ?? (data as any)?.recent ?? [];

  const [teamAName, teamBName] = useMemo(() => {
    if (!recent.length) return ["Team A", "Team B"];
    const a = recent[0]?.home?.id === teamAId ? recent[0].home : recent[0]?.away;
    const b = recent[0]?.home?.id === teamBId ? recent[0].home : recent[0]?.away;
    return [a?.shortName || a?.name || "Team A", b?.shortName || b?.name || "Team B"];
  }, [recent, teamAId, teamBId]);

  if (isLoading) {
    return (
      <OverlayLoadingSkeleton
        width={width}
        height={height}
        message="Loading head-to-head…"
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
        expectedData="{ data: { recent: MatchLite[] } } or { recent: MatchLite[] }"
        source="H2H"
      />
    );
  }

  if (!recent.length) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="No recent head-to-head matches found"
      />
    );
  }

  function onRefresh() {
    setIsRefreshing(true);
    refetch()
      .then(() =>
        toast({ title: "H2H updated", description: "Data refreshed." })
      )
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
      data-testid="h2h-match-card-overlay"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users2 size={18} />
          <div style={{ fontWeight: 700 }}>
            Head-to-Head • {teamAName} vs {teamBName}
          </div>
        </div>

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

      {/* Matches */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
        }}
      >
        {recent.map((m) => {
          const d = new Date(m.dateUtc);
          const vs = `${m.home.shortName || m.home.name} vs ${
            m.away.shortName || m.away.name
          }`;
          const score =
            m.score && Number.isFinite(m.score.home) && Number.isFinite(m.score.away)
              ? `${m.score.home}–${m.score.away}`
              : "—";

          return (
            <div
              key={m.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 1fr",
                gap: 10,
                alignItems: "center",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                padding: 12,
              }}
            >
              {/* Teams */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
                title={vs}
              >
                {m.home.logo && (
                  <img
                    src={m.home.logo}
                    alt={m.home.name}
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                )}
                <div
                  style={{
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {vs}
                </div>
              </div>

              {/* Date/venue */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <Calendar size={16} />
                <span>
                  {d.toLocaleDateString()} •{" "}
                  {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <Clock size={16} style={{ marginLeft: 6, opacity: 0.7 }} />
              </div>

              {/* Venue + score */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <MapPin size={16} />
                <span style={{ opacity: 0.85 }}>
                  {m.venue || m.competition?.name || "TBD"}
                </span>
                <span
                  style={{
                    marginLeft: 8,
                    fontWeight: 800,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 8,
                    padding: "2px 8px",
                  }}
                >
                  {score}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <OverlaySourceBadge label={sourceLabel} timestampIso={timestampIso} />
    </motion.div>
  );
}
