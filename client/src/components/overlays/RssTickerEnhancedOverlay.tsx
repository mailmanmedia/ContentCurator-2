import React, { useMemo } from "react";
import {
  OverlayLoadingSkeleton,
  OverlayErrorState,
  OverlayEmptyState,
  OverlaySourceBadge,
} from "./OverlayStates";
import { useOverlayData } from "@/hooks/useOverlayData";

type Size = number | string;

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  sentiment?: number;
}

interface Props {
  width: Size;
  height: Size;
  sourceIds?: string[];      // optional: filter to selected feeds
  maxArticles?: number;      // default 10
  showSource?: boolean;      // default true
  showSentiment?: boolean;   // default false
  opacity?: number;          // default 0.9
  endpoint?: string;         // default /api/rss-articles
  speedSeconds?: number;     // default 40 (scroll duration)
  pauseOnHover?: boolean;    // default true
}

export default function RssTickerEnhancedOverlay({
  width,
  height,
  sourceIds = [],
  maxArticles = 10,
  showSource = true,
  showSentiment = false,
  opacity = 0.9,
  endpoint,
  speedSeconds = 40,
  pauseOnHover = true,
}: Props) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (sourceIds.length) params.set("sourceIds", sourceIds.join(","));
    params.set("limit", String(maxArticles));
    return `${endpoint || "/api/rss-articles"}?${params.toString()}`;
  }, [sourceIds, maxArticles, endpoint]);

  const { data, isLoading, error } = useOverlayData<{ articles: Article[]; lastUpdated?: string }>({
    queryKey: ["rss-articles", sourceIds, maxArticles, endpoint],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch RSS articles (${res.status})`);
      return res.json();
    },
    overlayName: "RSS Ticker",
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <OverlayLoadingSkeleton
        width={width}
        height={height}
        message="Loading headlines…"
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
        expectedData="{ articles: Article[], lastUpdated?: string }"
        source="RSS Ticker"
      />
    );
  }

  const articles = data?.articles ?? [];
  const lastUpdated = data?.lastUpdated;

  if (!articles.length) {
    return (
      <OverlayEmptyState
        width={width}
        height={height}
        message="No headlines available"
      />
    );
  }

  const items = useMemo(() => {
    return articles.map((a) => {
      const s = typeof a.sentiment === "number" ? a.sentiment : undefined;
      const sentimentBadge =
        showSentiment && typeof s === "number"
          ? ` ${s > 0 ? "▲" : s < 0 ? "▼" : "•"}`
          : "";
      const tail = showSource ? ` — ${a.source}` : "";
      return { text: `${a.title}${tail}${sentimentBadge}`, url: a.url };
    });
  }, [articles, showSource, showSentiment]);

  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    background: "rgba(200,16,46,0.95)",
    border: "2px solid rgba(255,255,255,0.5)",
    color: "#fff",
    fontFamily: "League Spartan, sans-serif",
    opacity,
    position: "relative",
    paddingLeft: 16,
  };

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const duration = Math.max(10, Math.round(speedSeconds));
  const animation = prefersReducedMotion ? "none" : `ticker-scroll ${duration}s linear infinite`;

  return (
    <div
      style={style}
      data-testid="rss-ticker-enhanced-overlay"
    >
      <div
        style={{
          display: "flex",
          animation,
          whiteSpace: "nowrap",
          paddingRight: 32,
        }}
      >
        {items.map((item, idx) => (
          <span
            key={idx}
            style={{
              marginRight: 48,
              fontWeight: 500,
              fontSize: 16,
            }}
          >
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {item.text}
              </a>
            ) : (
              item.text
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
