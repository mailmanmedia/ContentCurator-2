import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { computeOverlayScale, devOverlayDiagnostics } from '@/lib/overlayScaling';

interface TeamStanding {
  team: string;
  position: number;
  played: number;
  points: number;
  gd?: number;
}

interface Props {
  title?: string;
  subtitle?: string;
  standings: TeamStanding[];
  containerWidth: number;
  containerHeight: number;
}

// Baseline card size the layout was designed around
const BASELINE = { width: 280, height: 220 } as const;

export const LeaguePositionOverlay: React.FC<Props> = ({
  title = 'League Position',
  subtitle = 'Top 8 race',
  standings,
  containerWidth,
  containerHeight,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const [measures, setMeasures] = useState({ header: 0, footer: 0 });

  // Measure header/footer in real pixels to avoid magic constants
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      const header = headerRef.current?.getBoundingClientRect().height ?? 0;
      const footer = footerRef.current?.getBoundingClientRect().height ?? 0;
      setMeasures({ header, footer });
    });
    if (rootRef.current) ro.observe(rootRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    if (footerRef.current) ro.observe(footerRef.current);
    return () => ro.disconnect();
  }, []);

  const { scale } = useMemo(() =>
    computeOverlayScale(
      { width: containerWidth, height: containerHeight },
      BASELINE,
      { minScale: 0.28, maxScale: 2.5 }
    ),
  [containerWidth, containerHeight]);

  // Layout metrics
  const padding = 12;
  const gap = 8;
  const rowHeight = 28; // base row height before scaling

  const reserved = useMemo(() => {
    const header = measures.header || 46; // fallback if RO not yet measured
    const footer = measures.footer || 18;
    return header + footer + padding * 2 + gap; // include spacing around list
  }, [measures.header, measures.footer]);

  const listHeight = Math.max(0, containerHeight - reserved);
  const scaledRow = Math.max(18, Math.round(rowHeight * scale));
  const maxVisibleRows = Math.max(3, Math.floor(listHeight / scaledRow));

  const rows = standings.slice(0, standings.length);
  const showTopRace = maxVisibleRows >= 6; // only show extra section if we truly have room

  useEffect(() => {
    devOverlayDiagnostics('league-position', {
      container: { w: containerWidth, h: containerHeight },
      baseline: BASELINE,
      scale: Number(scale.toFixed(3)),
      measures,
      listHeight,
      scaledRow,
      maxVisibleRows,
      showTopRace,
      rows: rows.length,
    });
  }, [containerWidth, containerHeight, scale, measures, listHeight, scaledRow, maxVisibleRows, showTopRace, rows.length]);

  return (
    <div
      ref={rootRef}
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: 'clip', // prevent bleed outside the overlay
        background: '#0B1020',
        color: '#F6EB61',
        borderRadius: 10,
        border: '1px solid rgba(246,235,97,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35) inset',
        padding,
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
    >
      <div ref={headerRef} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: Math.round(16 * scale), fontWeight: 800, letterSpacing: 0.3 }}>{title}</div>
        <div style={{ fontSize: Math.round(12 * scale), opacity: 0.85 }}>{subtitle}</div>
      </div>

      {showTopRace && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 6,
          alignItems: 'center',
          padding: '4px 6px',
          borderRadius: 8,
          background: 'rgba(246,235,97,0.06)'
        }}>
          <div style={{ fontSize: Math.round(13 * scale), fontWeight: 700 }}>Top 4 Race</div>
          <div style={{ fontSize: Math.round(12 * scale), opacity: 0.9 }}>Pts</div>
          <div style={{ fontSize: Math.round(12 * scale), opacity: 0.9 }}>GD</div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: 'auto', // allow internal scrolling instead of overflowing the overlay
          paddingRight: 4,
        }}
      >
        {rows.slice(0, maxVisibleRows).map((t, idx) => (
          <div
            key={t.team + idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto auto',
              gap: 8,
              alignItems: 'center',
              height: scaledRow,
              borderBottom: '1px dashed rgba(255,255,255,0.08)'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: Math.round(12 * scale) }}>{t.position}</div>
            <div style={{ fontWeight: 700, fontSize: Math.round(13 * scale), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.team}</div>
            <div style={{ textAlign: 'right', fontSize: Math.round(12 * scale) }}>{t.points}</div>
            <div style={{ textAlign: 'right', fontSize: Math.round(12 * scale), opacity: 0.9 }}>{t.gd ?? 0}</div>
          </div>
        ))}
      </div>

      <div ref={footerRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.85 }}>
        <div style={{ fontSize: Math.round(11 * scale) }}>Updated just now</div>
        <div style={{ fontSize: Math.round(11 * scale) }}>Showing {Math.min(rows.length, maxVisibleRows)} of {rows.length}</div>
      </div>
    </div>
  );
};

export default LeaguePositionOverlay;
