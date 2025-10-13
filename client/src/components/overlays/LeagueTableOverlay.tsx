import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, RefreshCw } from "lucide-react";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";
import { COLOR_PALETTES, type ColorPaletteKey } from "./FormGuideOverlay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Size = number | string;

export interface LeagueTableOverlayProps {
  width: Size;
  height: Size;
  leagueId: string | number;
  season?: string | number;         // e.g. 2025
  limit?: number;                   // limit rows displayed (optional)
  opacity?: number;                 // default 0.95
  colorPalette?: ColorPaletteKey;   // theme key from FormGuideOverlay
  showForm?: boolean;               // show recent form bubbles
  showGD?: boolean;                 // show goal difference
  endpoint?: string;                // override fetch endpoint (defaults below)
}

/** API models (kept broad to avoid coupling) */
type TableRow = {
  position: number;
  team: { id?: number | string; name: string; shortName?: string; logo?: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string; // e.g. "WDLDW"
};

type TablePayload =
  | { data: { standings: TableRow[] }; source?: string; timestamp?: string }
  | { standings: TableRow[]; source?: string; timestamp?: string };

function cssSize(v: Size) {
  return typeof v === "number" ? `${v}px` : v;
}

export default function LeagueTableOverlay({
  width,
  height,
  leagueId,
  season,
  limit,
  opacity = 0.95,
  colorPalette = "classic",
  showForm = true,
  showGD = true,
  endpoint,
}: LeagueTableOverlayProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const palette = COLOR_PALETTES[colorPalette];

  const params = new URLSearchParams();
  params.set("leagueId", String(leagueId));
  if (season != null) params.set("season", String(season));
  const url = `${endpoint || "/api/league-table"}?${params.toString()}`;

  const { data, isLoading, error, refetch } = useQuery<TablePayload>({
    queryKey: ["league-table", leagueId, season, endpoint],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch league table (${res.status})`);
      return res.json();
    },
    refetchInterval: 5 * 60_000, // 5 minutes
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <OverlayLoadingSkeleton
        width={width}
        height={height}
        message="Loading league table…"
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
        expectedData="{ data: { standings: TableRow[] } } or { standings: TableRow[] }"
        source="League Table"
      />
    );
  }

  const sourceLabel = (data as any)?.source;
  const timestampIso = (data as any)?.timestamp;
  const rows: TableRow[] =
    (data as any)?.data?.standings ?? (data as any)?.standings ?? [];

  const visibleRows = useMemo(
    () => (limit ? rows.slice(0, limit) : rows),
    [rows, limit]
  );

  if (!visibleRows.length) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="No table data available"
      />
    );
  }

  function onRefresh() {
    setIsRefreshing(true);
    refetch()
      .then(() => {
        toast({ title: "Table updated", description: "Data refreshed." });
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
      data-testid="league-table-overlay"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={18} />
          <div style={{ fontWeight: 700 }}>
            League Table{season ? ` • ${season}` : ""}
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
          gridTemplateColumns: `48px minmax(160px, 1.4fr) 48px 48px 48px 48px 64px ${showGD ? "64px " : ""}64px ${showForm ? "minmax(120px, 1fr)" : ""}`,
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
        <div>#</div>
        <div>Team</div>
        <div>P</div>
        <div>W</div>
        <div>D</div>
        <div>L</div>
        <div>GF</div>
        {showGD && <div>GD</div>}
        <div>Pts</div>
        {showForm && <div style={{ textAlign: "right" }}>Form</div>}
      </div>

      {/* Rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          overflowY: "auto",
        }}
      >
        {visibleRows.map((r) => {
          const teamName = r.team?.shortName || r.team?.name;
          const crest = r.team?.logo;

          return (
            <div
              key={teamName + r.position}
              style={{
                display: "grid",
                gridTemplateColumns: `48px minmax(160px, 1.4fr) 48px 48px 48px 48px 64px ${showGD ? "64px " : ""}64px ${showForm ? "minmax(120px, 1fr)" : ""}`,
                gap: 8,
                alignItems: "center",
                padding: "10px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontWeight: 700 }}>{r.position}</div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
                title={teamName}
              >
                {crest && (
                  <img
                    src={crest}
                    alt={teamName}
                    style={{ width: 20, height: 20, objectFit: "contain" }}
                  />
                )}
                <div
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {teamName}
                </div>
              </div>

              <div>{r.played}</div>
              <div>{r.won}</div>
              <div>{r.drawn}</div>
              <div>{r.lost}</div>
              <div>{r.goalsFor}</div>
              {showGD && <div>{r.goalDifference}</div>}
              <div style={{ fontWeight: 700 }}>{r.points}</div>

              {showForm && (
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <FormBubbles form={r.form} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <OverlaySourceBadge label={sourceLabel || "Standings"} timestampIso={timestampIso} />
    </motion.div>
  );
}

function FormBubbles({ form }: { form?: string }) {
  if (!form) return null;
  const lastFive = form.trim().split("").slice(-5);
  return (
    <>
      {lastFive.map((t, i) => {
        const bg =
          t === "W"
            ? "rgba(0,200,83,0.9)"
            : t === "D"
            ? "rgba(255,205,0,0.9)"
            : "rgba(244,67,54,0.9)";
        const label = t === "W" ? "Win" : t === "D" ? "Draw" : "Loss";
        return (
          <span
            key={`${t}-${i}`}
            title={label}
            style={{
              width: 16,
              height: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              background: bg,
              color: "#000",
            }}
          >
            {t}
          </span>
        );
      })}
    </>
  );
}
