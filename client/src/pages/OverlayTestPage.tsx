import React, { useMemo, useState } from "react";
import OverlayErrorBoundary from "@/components/overlays/OverlayErrorBoundary";

// Import the overlays you want to preview
import UpcomingFixturesOverlay from "@/components/overlays/UpcomingFixturesOverlay";
import LeagueTableOverlay from "@/components/overlays/LeagueTableOverlay";
import PlayerStatsOverlay from "@/components/overlays/PlayerStatsOverlay";
import PlayerComparisonOverlay from "@/components/overlays/PlayerComparisonOverlay";
import RssTickerEnhancedOverlay from "@/components/overlays/RssTickerEnhancedOverlay";
import RssSentimentOverlay from "@/components/overlays/RssSentimentOverlay";
import H2HMatchCardOverlay from "@/components/overlays/H2HMatchCardOverlay";

type OverlayKey =
  | "fixtures"
  | "table"
  | "playerStats"
  | "playerComparison"
  | "rssTicker"
  | "rssSentiment"
  | "h2h";

const overlayOptions: { key: OverlayKey; label: string }[] = [
  { key: "fixtures", label: "Upcoming Fixtures" },
  { key: "table", label: "League Table" },
  { key: "playerStats", label: "Player Stats" },
  { key: "playerComparison", label: "Player Comparison" },
  { key: "rssTicker", label: "RSS Ticker" },
  { key: "rssSentiment", label: "RSS Sentiment" },
  { key: "h2h", label: "Head-to-Head" },
];

export default function OverlayTestPage() {
  const [selected, setSelected] = useState<OverlayKey>("fixtures");
  const [size, setSize] = useState({ width: 960, height: 540 });

  const overlayEl = useMemo(() => {
    switch (selected) {
      case "fixtures":
        return (
          <UpcomingFixturesOverlay
            width={size.width}
            height={size.height}
            fixtureCount={5}
          />
        );
      case "table":
        return (
          <LeagueTableOverlay
            width={size.width}
            height={size.height}
            leagueId={39}
            season={2025}
          />
        );
      case "playerStats":
        return (
          <PlayerStatsOverlay
            width={size.width}
            height={size.height}
            teamId={40}
            season={2025}
            sortBy="goals"
            limit={12}
          />
        );
      case "playerComparison":
        return (
          <PlayerComparisonOverlay
            width={size.width}
            height={size.height}
            playerIds={[123, 456]}
            season={2025}
          />
        );
      case "rssTicker":
        return (
          <RssTickerEnhancedOverlay
            width={size.width}
            height={size.height}
            maxArticles={12}
            showSource
            showSentiment
          />
        );
      case "rssSentiment":
        return (
          <RssSentimentOverlay
            width={size.width}
            height={size.height}
            timeframe="24h"
          />
        );
      case "h2h":
        return (
          <H2HMatchCardOverlay
            width={size.width}
            height={size.height}
            teamAId={40}
            teamBId={50}
            limit={6}
          />
        );
      default:
        return null;
    }
  }, [selected, size]);

  return (
    <div style={{ padding: 20, color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Overlay Test Page</h2>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <label>
          Overlay:
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as OverlayKey)}
            style={{ marginLeft: 8 }}
          >
            {overlayOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Width:
          <input
            type="number"
            value={size.width}
            onChange={(e) => setSize((s) => ({ ...s, width: Number(e.target.value) }))}
            style={{ width: 100, marginLeft: 6 }}
          />
        </label>

        <label>
          Height:
          <input
            type="number"
            value={size.height}
            onChange={(e) => setSize((s) => ({ ...s, height: Number(e.target.value) }))}
            style={{ width: 100, marginLeft: 6 }}
          />
        </label>
      </div>

      {/* Preview with error boundary */}
      <OverlayErrorBoundary overlayId={selected}>
        {overlayEl}
      </OverlayErrorBoundary>
    </div>
  );
}
