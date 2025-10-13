import React from "react";

type Size = number | string;

function toCssSize(v: Size) {
  return typeof v === "number" ? `${v}px` : v;
}

export function OverlayLoadingSkeleton({
  width,
  height,
  message = "Loading overlay…",
}: {
  width: Size;
  height: Size;
  message?: string;
}) {
  const w = toCssSize(width);
  const h = toCssSize(height);
  return (
    <div
      style={{
        width: w,
        height: h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "repeating-linear-gradient( 90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 12px, rgba(255,255,255,0.10) 12px, rgba(255,255,255,0.10) 24px )",
        color: "#fff",
        border: "2px solid rgba(200,16,46,0.5)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.25) inset",
        fontFamily: "League Spartan, system-ui, sans-serif",
      }}
      data-testid="overlay-loading-skeleton"
    >
      <span style={{ opacity: 0.85 }}>{message}</span>
    </div>
  );
}

export function OverlayErrorState({
  width,
  height,
  error,
  endpoint,
  expectedData,
  source,
}: {
  width: Size;
  height: Size;
  error: Error;
  endpoint?: string;
  expectedData?: string;
  source?: string;
}) {
  const w = toCssSize(width);
  const h = toCssSize(height);

  return (
    <div
      style={{
        width: w,
        height: h,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.95)",
        color: "#fff",
        border: "2px solid rgba(255, 76, 76, 0.7)",
        fontFamily: "League Spartan, system-ui, sans-serif",
        padding: 16,
        textAlign: "center",
      }}
      data-testid="overlay-error-state"
    >
      <div style={{ fontWeight: 700, color: "#FF5C5C" }}>
        {source || "Overlay"} error
      </div>
      <div style={{ opacity: 0.85, maxWidth: 640 }}>
        {error?.message || "Unknown error"}
      </div>
      {endpoint && (
        <div style={{ opacity: 0.6, fontSize: 12 }}>Endpoint: {endpoint}</div>
      )}
      {expectedData && (
        <div style={{ opacity: 0.6, fontSize: 12 }}>
          Expected: <code>{expectedData}</code>
        </div>
      )}
    </div>
  );
}

export function OverlayEmptyState({
  width,
  height,
  message = "No data available",
}: {
  width: Size;
  height: Size;
  message?: string;
}) {
  const w = toCssSize(width);
  const h = toCssSize(height);

  return (
    <div
      style={{
        width: w,
        height: h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        color: "#FFFFFF",
        fontFamily: "League Spartan, sans-serif",
        padding: 20,
        textAlign: "center",
        border: "2px dashed rgba(255,255,255,0.25)",
      }}
      data-testid="overlay-empty-state"
    >
      <span style={{ opacity: 0.85 }}>{message}</span>
    </div>
  );
}

export function OverlaySourceBadge({
  label,
  timestampIso,
}: {
  label: string;
  timestampIso?: string;
}) {
  const ts =
    timestampIso &&
    new Date(timestampIso).toLocaleString(undefined, {
      hour12: false,
    });
  return (
    <div
      style={{
        position: "absolute",
        right: 8,
        bottom: 8,
        fontSize: 10,
        padding: "4px 8px",
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      {label}
      {ts ? ` • ${ts}` : ""}
    </div>
  );
}
