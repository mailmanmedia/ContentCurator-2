import React from "react";
import { useQuery } from "@tanstack/react-query";
import { OverlayLoadingSkeleton, OverlayErrorState, OverlayEmptyState, OverlaySourceBadge } from "./OverlayStates";

type Size = number | string;

interface SentimentBucket {
  label: string;   // e.g. "Positive"
  score: number;   // -1..1 average
  count: number;   // #articles
}

interface Summary {
  buckets: SentimentBucket[];
  lastUpdated?: string;
}

export default function RssSentimentOverlay({
  width,
  height,
  timeframe = "24h",
  opacity = 0.95,
}: {
  width: Size;
  height: Size;
  timeframe?: "1h" | "6h" | "12h" | "24h" | "7d";
  opacity?: number;
}) {
  const { data, isLoading, error } = useQuery<Summary>({
    queryKey: ["/api/rss/sentiment-summary", timeframe],
    queryFn: async () => {
      const res = await fetch(`/api/rss/sentiment-summary?timeframe=${timeframe}`);
      if (!res.ok) throw new Error(`Failed to fetch RSS sentiment summary (${res.status})`);
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (isLoading) return <OverlayLoadingSkeleton width={width} height={height} />;

  if (error) {
    return (
      <OverlayErrorState
        width={width}
        height={height}
        error={error as Error}
        endpoint={`/api/rss/sentiment-summary?timeframe=${timeframe}`}
        expectedData="{ buckets: {label, score, count}[], lastUpdated?: string }"
        source="RSS Sentiment"
      />
    );
  }

  const buckets = data?.buckets ?? [];
  if (!buckets.length) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="No sentiment data available"
      />
    );
  }

  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    background: "rgba(0, 33, 71, 0.95)",
    border: "2px solid rgba(200,16,46,0.4)",
    color: "#fff",
    fontFamily: "League Spartan, sans-serif",
    padding: 16,
    position: "relative",
    opacity,
  };

  return (
    <div style={style} data-testid="rss-sentiment-overlay">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>News Sentiment • {timeframe}</div>
      <div style={{ display: "flex", gap: 12 }}>
        {buckets.map((b) => (
          <div
            key={b.label}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: 12,
              textAlign: "center",
            }}
          >
            <div style={{ opacity: 0.85 }}>{b.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>
              {b.score.toFixed(2)}
            </div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>{b.count} articles</div>
          </div>
        ))}
      </div>
      <OverlaySourceBadge label="RSS" timestampIso={data?.lastUpdated} />
    </div>
  );
}
