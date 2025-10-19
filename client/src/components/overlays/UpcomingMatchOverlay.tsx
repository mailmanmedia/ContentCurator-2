import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
} from "./OverlayStates";
import { COLOR_PALETTES, type ColorPaletteKey } from "./FormGuideOverlay";

type Size = number | string;

type Team = {
  id: string | number;
  name: string;
  shortName?: string;
  logo?: string;
};

type Match = {
  id: string | number;
  dateUtc: string;
  venue?: string;
  competition?: { name: string; code?: string };
  home: Team;
  away: Team;
};

type UpcomingMatchPayload = {
  data?: {
    upcomingMatch?: Match;
  };
  fixture?: any;
  source?: string;
  timestamp?: string;
};

export interface UpcomingMatchOverlayProps {
  width: Size;
  height: Size;
  teamId?: string | number;
  opacity?: number;
  colorPalette?: ColorPaletteKey;
  endpoint?: string;
}

function cssSize(v: Size) {
  return typeof v === "number" ? `${v}px` : v;
}

export default function UpcomingMatchOverlay({
  width,
  height,
  teamId,
  opacity = 0.98,
  colorPalette = 'navy',
  endpoint,
}: UpcomingMatchOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeUntilMatch, setTimeUntilMatch] = useState<string>("");

  const url = endpoint || `/api/h2h/upcoming${teamId ? `?teamId=${teamId}` : ''}`;

  const { data, isLoading, error, refetch } = useQuery<UpcomingMatchPayload>({
    queryKey: ["upcoming-match", teamId],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch upcoming match (${res.status})`);
      return res.json();
    },
    refetchInterval: 5 * 60_000, // 5 minutes
    staleTime: 60_000,
  });

  const upcomingMatch: Match | undefined =
    (data as any)?.data?.upcomingMatch || (data as any)?.fixture;

  // Countdown timer
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

  function onRefresh() {
    setIsRefreshing(true);
    refetch()
      .then(() =>
        toast({ title: "Match updated", description: "Data refreshed." })
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

  if (isLoading) {
    return (
      <OverlayLoadingSkeleton
        width={width}
        height={height}
        message="Loading upcoming match…"
      />
    );
  }

  if (error) {
    return (
      <OverlayErrorState
        width={width}
        height={height}
        message={(error as Error).message || "Failed to load match data"}
        onRetry={onRefresh}
      />
    );
  }

  if (!upcomingMatch) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="No upcoming match found"
        onRetry={onRefresh}
      />
    );
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
      data-testid="upcoming-match-overlay"
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
          <Calendar size={18} />
          <div style={{ fontWeight: 700 }}>
            Next Match
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

      {/* Upcoming Match - Full Display */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 136, 255, 0.15))",
          border: `2px solid ${palette.accent || "rgba(0, 255, 136, 0.5)"}`,
          borderRadius: 12,
          padding: 16,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
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

        {/* Teams */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 12,
          }}
        >
          {/* Home Team */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {upcomingMatch.home.logo && (
              <img
                src={upcomingMatch.home.logo}
                alt={upcomingMatch.home.name}
                style={{ width: 40, height: 40, objectFit: "contain" }}
              />
            )}
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {upcomingMatch.home.shortName || upcomingMatch.home.name}
            </div>
          </div>

          <div style={{ fontWeight: 700, fontSize: 16, opacity: 0.6 }}>
            VS
          </div>

          {/* Away Team */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {upcomingMatch.away.shortName || upcomingMatch.away.name}
            </div>
            {upcomingMatch.away.logo && (
              <img
                src={upcomingMatch.away.logo}
                alt={upcomingMatch.away.name}
                style={{ width: 40, height: 40, objectFit: "contain" }}
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
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            fontSize: 13,
            flexWrap: "wrap",
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
    </motion.div>
  );
}
