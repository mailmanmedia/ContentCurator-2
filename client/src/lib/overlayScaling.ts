
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
  minScale = 0.3,
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
