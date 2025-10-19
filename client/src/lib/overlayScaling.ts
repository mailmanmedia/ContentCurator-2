
/**
 * Standard scaling utilities for all overlays
 * Ensures consistent responsive behavior
 */

export interface ScalingConfig {
  width: number;
  height: number;
  baseWidth?: number;
  baseHeight?: number;
  minScale?: number;
  maxScale?: number;
}

export function createScalingSystem({
  width,
  height,
  baseWidth = 600,
  baseHeight = 800,
  // Lower the default scale floor to allow more compact layouts when needed
  minScale = 0.28,
  maxScale = 2.0,
}: ScalingConfig) {
  const widthScale = width / baseWidth;
  const heightScale = height / baseHeight;
  const scale = Math.min(widthScale, heightScale);
  const clampedScale = Math.max(minScale, Math.min(scale, maxScale));

  // Pixel scaling function with minimum size protection
  const px = (value: number): number => {
    const scaled = value * clampedScale;
    if (value > 0 && scaled < 1) return 1;
    return Math.round(scaled);
  };

  // Breakpoint detection
  const isMini = width < 240 || height < 300;
  const isVeryCompact = width < 320 || height < 400;
  const isCompact = width < 400 || height < 500;

  return {
    scale: clampedScale,
    px,
    isMini,
    isVeryCompact,
    isCompact,
    isNormal: !isCompact && !isVeryCompact && !isMini,
  };
}

/**
 * Compute a simple uniform scale based on container and baseline sizes.
 * Returns the clamped scale and a helper to scale numeric values with optional min/max.
 */
export function computeOverlayScale(
  container: { width: number; height: number },
  baseline: { width: number; height: number } = { width: 600, height: 800 },
  options: { minScale?: number; maxScale?: number } = {}
) {
  const { minScale = 0.28, maxScale = 2.0 } = options;
  const raw = Math.min(container.width / baseline.width, container.height / baseline.height);
  const scale = Math.max(minScale, Math.min(raw, maxScale));
  const scaleValue = (base: number, opts?: { min?: number; max?: number; round?: boolean }) => {
    const min = opts?.min ?? base * 0.25; // softer floors than before
    const max = opts?.max ?? base * 2.0;
    const val = Math.min(Math.max(base * scale, min), max);
    return opts?.round === false ? val : Math.round(val);
  };
  return { scale, scaleValue };
}

/** In dev, log overlay sizing diagnostics to help catch overflow conditions. */
export function devOverlayDiagnostics(
  overlayId: string,
  info: Record<string, unknown>
) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(`[overlay:${overlayId}]`, info);
  }
}

