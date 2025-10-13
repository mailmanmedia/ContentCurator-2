import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
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
  id?: number | string;
  name: string;
  shortName?: string;
  logo?: string;
  form?: string; // e.g., WDLWW
};

type Fixture = {
  id: string | number;
  utcDate: string; // ISO time
  status?: string;
  venue?: string;
  homeTeam: Team;
  awayTeam: Team;
  competition?: { name: string; code?: string };
  round?: string;
};

type ApiShape =
  | {
      data: { fixtures: Fixture[] };
      source?: string;
      timestamp?: string;
    }
  | {
      fixtures: Fixture[];
      source?: string;
      timestamp?: string;
    };

export interface UpcomingFixturesOverlayProps {
  width: Size;
  height: Size;
  /** Optional team filter */
  teamId?: string | number;
  /** Optional league filter */
  leagueId?: string | number;
  /** Number of fixtures to show (default 5) */
  fixtureCount?: number;
  /** Transparency of card (default 0.9) */
  opacity?: number;
  /** Show relative countdown (default true) */
  showCountdown?: boolean;
  /** Show opponent recent form if available (default true) */
  showOpponentForm?: boolean;
  /** Color theme key */
  colorPalette?: ColorPaletteKey;
  /** Override the fetch endpoint. If omitted we call /api/upcoming-fixtures */
  endpoint?: string;
}

function getCssSize(v: Size) {
  return typeof v === "number" ? `${v}px` : v;
}

export default function UpcomingFixturesOverlay({
  width,
  height,
  teamId,
  leagueId,
  opacity = 0.9,
  fixtureCount = 5,
  showCountdown = true,
  showOpponentForm = true,
  colorPalette = "classic",
  endpoint,
}: UpcomingFixturesOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Build params
  const params = new URLSearchParams();
  if (fixtureCount) params.set("limit", String(fixtureCount));
  if (teamId != null) params.set("teamId", String(teamId));
  if (leagueId != null) params.set("leagueId", String(leagueId));

  const url = `${endpoint || "/api/upcoming-fixtures"}?${params.toString()}`;

  const { data, isLoading, error, refetch } = useQuery<ApiShape>({
    queryKey: ["upcoming-fixtures", fixtureCount, teamId, leagueId, endpoint],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch upcoming fixtures (${res.status})`);
      return res.json();
    },
    refetchInterval: 5 * 60_000, // 5 minutes
    staleTime: 60_000,
  });

  if (isLoading) {
    return <OverlayLoadingSkeleton width={width} height={height} message="Loading fixtures…" />;
  }

  if (error) {
    return (
      <OverlayErrorState
        width={width}
        height={height}
        error={error as Error}
        endpoint={url}
        expectedData="{ data: { fixtures: Fixture[] } } or { fixtures: Fixture[] }"
        source="Upcoming Fixtures"
      />
    );
  }

  const sourceLabel = (data as any)?.source;
  const timestampIso = (data as any)?.timestamp;
  const fixturesData = (data as any)?.data?.fixtures ?? (data as any)?.fixtures ?? [];
  const fixtures: Fixture[] = (fixturesData || []).slice(0, fixtureCount);

  if (!fixtures.length) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="No upcoming fixtures found"
      />
    );
  }

  function onRefresh() {
    setIsRefreshing(true);
    refetch()
      .then(() => {
        toast({ title: "Fixtures updated", description: "Data refreshed." });
      })
      .catch((e) => {
        toast({ title: "Refresh failed", description: String(e), variant: "destructive" });
      })
      .finally(() => setIsRefreshing(false));
  }

  return (
    <motion.div
      style={{
        width: getCssSize(width),
        height: getCssSize(height),
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
        gap: 10,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      data-testid="upcoming-fixtures-overlay"
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          <Calendar size={18} />
          <span>Upcoming Fixtures</span>
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

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        {fixtures.map((fx) => {
          const kickoff = new Date(fx.utcDate);
          const rel = formatDistanceToNow(kickoff, { addSuffix: true });
          const vs = `${fx.homeTeam?.shortName || fx.homeTeam?.name} vs ${fx.awayTeam?.shortName || fx.awayTeam?.name}`;

          return (
            <div
              key={fx.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.9fr 0.9fr",
                gap: 10,
                alignItems: "center",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {/* Team crests if present */}
                {fx.homeTeam?.logo && (
                  <img src={fx.homeTeam.logo} alt={fx.homeTeam.name} style={{ width: 28, height: 28, objectFit: "contain" }} />
                )}
                <div
                  style={{
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={vs}
                >
                  {vs}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={16} />
                <div title={kickoff.toLocaleString()}>
                  {kickoff.toLocaleDateString()} • {kickoff.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                {showCountdown && (
                  <div style={{ opacity: 0.7, fontSize: 12, marginLeft: 6 }} title={kickoff.toISOString()}>
                    ({rel})
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                <MapPin size={16} />
                <div style={{ opacity: 0.85 }}>{fx.venue || fx.competition?.name || fx.round || "TBD"}</div>
              </div>

              {showOpponentForm && (fx.homeTeam?.form || fx.awayTeam?.form) && (
                <div style={{ gridColumn: "1 / span 3", display: "flex", gap: 8, marginTop: 6 }}>
                  {fx.homeTeam?.form && (
                    <FormBadge label={`${fx.homeTeam.shortName || "Home"} form`} form={fx.homeTeam.form} />
                  )}
                  {fx.awayTeam?.form && (
                    <FormBadge label={`${fx.awayTeam.shortName || "Away"} form`} form={fx.awayTeam.form} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: palette.text,
          opacity: 0.7,
          fontSize: 12,
        }}
      >
        <span>Next {fixtures.length} matches</span>
      </div>

      <OverlaySourceBadge label={sourceLabel || "Fixtures"} timestampIso={timestampIso} />
    </motion.div>
  );
}

function FormBadge({ label, form }: { label: string; form: string }) {
  const tokens = (form || "").trim().split("").slice(-5); // last 5
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.15)",
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: 12,
      }}
    >
      <span style={{ opacity: 0.85 }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {tokens.map((t, i) => (
          <span
            key={`${t}-${i}`}
            title={t === "W" ? "Win" : t === "D" ? "Draw" : t === "L" ? "Loss" : t}
            style={{
              width: 16,
              height: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              background:
                t === "W" ? "rgba(0,200,83,0.9)" : t === "D" ? "rgba(255,205,0,0.9)" : "rgba(244,67,54,0.9)",
              color: "#000",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
