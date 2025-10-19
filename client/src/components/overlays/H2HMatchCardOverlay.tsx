import React, { useMemo, useState, useEffect } from "react";
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
        upcomingMatch?: MatchLite; // upcoming match (auto mode only)
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
  teamAId?: string | number;
  teamBId?: string | number;
  /** limit of H2H matches to show */
  limit?: number;
  /** visual options */
  opacity?: number;
  colorPalette?: ColorPaletteKey;
  /** API override; default /api/h2h */
  endpoint?: string;
  /**
   * Automatic mode: if true, automatically fetches and displays the next upcoming match
   * If autoTeamId is provided, filters to that team's next match
   */
  auto?: boolean;
  autoTeamId?: string | number;
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
  opacity = 0.98,
  colorPalette = 'navy',
  endpoint,
  auto = false,
  autoTeamId,
}: H2HMatchCardOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeUntilMatch, setTimeUntilMatch] = useState<string>("");

  // Determine if we're in auto mode or manual mode
  const isAutoMode = auto || (!teamAId && !teamBId);

  // Build URL reactively when props change
  const url = useMemo(() => {
    if (isAutoMode) {
      // Auto mode: fetch upcoming match
      const params = new URLSearchParams();
      if (autoTeamId) params.set("teamId", String(autoTeamId));
      if (limit) params.set("limit", String(limit));
      return `${endpoint || "/api/h2h/upcoming"}?${params.toString()}`;
    } else {
      // Manual mode: fetch specific H2H
      const params = new URLSearchParams();
      params.set("teamAId", String(teamAId));
      params.set("teamBId", String(teamBId));
      if (limit) params.set("limit", String(limit));
      return `${endpoint || "/api/h2h"}?${params.toString()}`;
    }
  }, [isAutoMode, autoTeamId, teamAId, teamBId, limit, endpoint]);

  const { data, isLoading, error, refetch } = useQuery<H2HPayload>({
    queryKey: isAutoMode
      ? ["h2h-auto", autoTeamId, limit, endpoint]
      : ["h2h", teamAId, teamBId, limit, endpoint],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch H2H (${res.status})`);
      return res.json();
    },
    enabled: isAutoMode || (teamAId != null && teamBId != null && teamAId !== undefined && teamBId !== undefined),
    refetchInterval: 5 * 60_000, // Default 5 minutes, will be updated dynamically
    staleTime: 60_000,
  });

  const sourceLabel = (data as any)?.source || "H2H";
  const timestampIso = (data as any)?.timestamp;
  const upcomingMatch: MatchLite | undefined = (data as any)?.data?.upcomingMatch;
  const recent: MatchLite[] =
    (data as any)?.data?.recent ?? (data as any)?.recent ?? [];

  // Countdown timer for upcoming match
  useEffect(() => {
    if (!upcomingMatch) return;

    const updateCountdown = () => {
      const now = new Date();
      const matchTime = new Date(upcomingMatch.dateUtc);
      const diff = matchTime.getTime() - now.getTime();

      if (diff < 0) {
        setTimeUntilMatch("Match in progress or completed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeUntilMatch(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeUntilMatch(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeUntilMatch(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [upcomingMatch]);

  const [teamAName, teamBName] = useMemo(() => {
    // In auto mode, get names from upcoming match
    if (isAutoMode && upcomingMatch) {
      return [
        upcomingMatch.home.shortName || upcomingMatch.home.name,
        upcomingMatch.away.shortName || upcomingMatch.away.name
      ];
    }
    // In manual mode or fallback, get names from recent matches
    if (!recent.length) return ["Team A", "Team B"];
    const a = recent[0]?.home?.id === teamAId ? recent[0].home : recent[0]?.away;
    const b = recent[0]?.home?.id === teamBId ? recent[0].home : recent[0]?.away;
    return [a?.shortName || a?.name || "Team A", b?.shortName || b?.name || "Team B"];
  }, [isAutoMode, upcomingMatch, recent, teamAId, teamBId]);

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

  if (!recent.length && !upcomingMatch) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message={isAutoMode ? "No upcoming matches found" : "No recent head-to-head matches found"}
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
        boxSizing: "border-box",
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
            {isAutoMode ? "Next Match" : "Head-to-Head"} • {teamAName} vs {teamBName}
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

      {/* Upcoming Match - Highlighted */}
      {upcomingMatch && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 136, 255, 0.15))",
            border: `2px solid ${palette.accent || "rgba(0, 255, 136, 0.5)"}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>UPCOMING MATCH</div>
            {timeUntilMatch && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: palette.accent || "#00ff88",
                  background: "rgba(0, 255, 136, 0.1)",
                  padding: "4px 10px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Clock size={14} />
                {timeUntilMatch}
              </div>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 16,
              alignItems: "center",
            }}
          >
            {/* Home Team */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {upcomingMatch.home.logo && (
                <img
                  src={upcomingMatch.home.logo}
                  alt={upcomingMatch.home.name}
                  style={{ width: 32, height: 32, objectFit: "contain" }}
                />
              )}
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {upcomingMatch.home.shortName || upcomingMatch.home.name}
              </div>
            </div>

            {/* VS */}
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                opacity: 0.6,
                padding: "4px 12px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            >
              VS
            </div>

            {/* Away Team */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {upcomingMatch.away.shortName || upcomingMatch.away.name}
              </div>
              {upcomingMatch.away.logo && (
                <img
                  src={upcomingMatch.away.logo}
                  alt={upcomingMatch.away.name}
                  style={{ width: 32, height: 32, objectFit: "contain" }}
                />
              )}
            </div>
          </div>

          {/* Match Details */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.15)",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} />
              {new Date(upcomingMatch.dateUtc).toLocaleDateString()} •{" "}
              {new Date(upcomingMatch.dateUtc).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} />
              {upcomingMatch.venue || "TBD"}
            </div>
            {upcomingMatch.competition && (
              <div style={{ marginLeft: "auto", opacity: 0.7 }}>
                {upcomingMatch.competition.name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Matches */}
      {recent.length > 0 && (
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginTop: 4, marginBottom: 4 }}>
          {upcomingMatch ? "RECENT HEAD-TO-HEAD" : "RECENT MATCHES"}
        </div>
      )}

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