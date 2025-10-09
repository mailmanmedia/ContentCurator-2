import { useEffect, useRef, useMemo, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { useQuery } from "@tanstack/react-query";
import type { RssArticle, RssSource } from "@shared/schema";
import H2HMatchCardOverlay from "./overlays/H2HMatchCardOverlay";
import FormGuideOverlay from "./overlays/FormGuideOverlay";
import PlayerStatsOverlay from "./overlays/PlayerStatsOverlay";
import LeaguePositionOverlay from "./overlays/LeaguePositionOverlay";
import RssSentimentOverlay from "./overlays/RssSentimentOverlay";
import RssTickerEnhancedOverlay from "./overlays/RssTickerEnhancedOverlay";
import UpcomingFixturesOverlay from "./overlays/UpcomingFixturesOverlay";
import PlayerComparisonOverlay from "./overlays/PlayerComparisonOverlay";
import OverlayErrorBoundary from "./overlays/OverlayErrorBoundary";

// Mailman Media Color Palettes for Tickers
const COLOR_PALETTES = {
  "classic": {
    background: '#C8102E',
    text: '#FFFFFF',
  },
  "navy": {
    background: '#002147',
    text: '#F5F1E9',
  },
  "cream": {
    background: '#F5F1E9',
    text: '#002147',
  },
  "dark": {
    background: '#0A0A0A',
    text: '#FFFFFF',
  }
} as const;

interface RssArticlesResponse {
  articles: RssArticle[];
}

interface RssSourcesResponse {
  sources: RssSource[];
}

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface ActiveSource {
  id: string;
  name: string;
  type: 'camera' | 'screen';
  deviceId?: string;
  deviceLabel?: string;
  stream?: MediaStream;
}

interface OverlayConfig {
  id: string;
  text: string;
  animationType: 'scroll' | 'fade' | 'static';
  templateStyle: 'ticker' | 'banner' | 'corner';
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  position: 'top' | 'bottom';
  height: number;
  visible: boolean;
  fontFamily: string;
  scrollSpeed: number;
  scrollDirection: 'left' | 'right' | 'up' | 'down';
  isBold: boolean;
  isItalic: boolean;
  overlayType: 'text' | 'image' | 'rss' | 'video' | 'metric';
  imageUrl?: string;
  imageData?: string;
  rssSourceIds?: string[];
  rssMaxArticles?: number;
  rssShowSource?: boolean;
  width: number;
  zIndex: number;
  opacity: number;
  videoUrl?: string;
  metricType?: string;
  metricData?: any;
  x: number;
  y: number;
  category: string;
  borderWidth?: number;
  borderColor?: string;
  colorPalette?: 'classic' | 'navy' | 'cream' | 'dark';
  // Form Guide sizing
  formTitleSize?: number;
  formCircleSize?: number;
  formLabelSize?: number;
  
  // Advanced Typography
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textShadow?: string;
  
  // Advanced Background
  backgroundType?: 'solid' | 'linear-gradient' | 'radial-gradient';
  gradientAngle?: number;
  gradientColor1?: string;
  gradientColor2?: string;
  
  // Border Customization
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  
  // Shadow/Glow
  boxShadow?: string;
  glowEffect?: boolean;
}

interface VideoCompositorProps {
  activeSources?: ActiveSource[];
  outputResolution?: { width: number; height: number };
  globalFitMode?: 'contain' | 'cover' | 'fill';
  sourceFitModes?: Record<string, 'contain' | 'cover' | 'fill'>;
  overlays?: OverlayConfig[];
  className?: string;
  onUpdateOverlay?: (overlayId: string, updates: Partial<OverlayConfig>) => void;
  onSelectOverlay?: (overlayId: string | null) => void;
}

export interface VideoCompositorRef {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const VideoCompositor = forwardRef<VideoCompositorRef, VideoCompositorProps>(({ 
  activeSources = [], 
  outputResolution = { width: 1920, height: 1080 },
  globalFitMode = 'contain',
  sourceFitModes = {},
  overlays = [],
  className = "",
  onUpdateOverlay,
  onSelectOverlay
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const animationFrameRef = useRef<number>();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const fadeStates = useRef<Map<string, number>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const lastOverlayUpdate = useRef<number>(0);
  
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialOverlayState, setInitialOverlayState] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useImperativeHandle(ref, () => ({
    canvasRef
  }), []);

  // Fetch RSS articles when RSS overlay exists
  const rssOverlays = overlays.filter(o => o.overlayType === 'rss');
  const hasRssOverlay = rssOverlays.length > 0;
  
  // Collect all unique source IDs from all RSS overlays
  const allRssSourceIds = useMemo(() => {
    const sourceIds = new Set<string>();
    rssOverlays.forEach(overlay => {
      overlay.rssSourceIds?.forEach(id => sourceIds.add(id));
    });
    return Array.from(sourceIds);
  }, [rssOverlays]);
  
  const { data: rssArticlesData } = useQuery<RssArticlesResponse>({
    queryKey: ['/api/rss-articles', { 
      sources: allRssSourceIds.length > 0 ? allRssSourceIds.join(',') : undefined,
      limit: 100 
    }],
    enabled: hasRssOverlay && allRssSourceIds.length > 0,
  });

  const { data: rssSourcesData } = useQuery<RssSourcesResponse>({
    queryKey: ['/api/rss-sources'],
    enabled: hasRssOverlay,
  });

  const rssArticles = rssArticlesData?.articles;
  const rssSources = rssSourcesData?.sources;

  // Build source name lookup map
  const sourceNameMap = useMemo(() => {
    if (!rssSources) return new Map<string, string>();
    const map = new Map<string, string>();
    rssSources.forEach(source => {
      map.set(source.id, source.name);
    });
    return map;
  }, [rssSources]);

  // Format RSS ticker text from articles
  const formatRssTicker = useCallback((
    overlay: OverlayConfig, 
    articles: RssArticle[] | undefined
  ): string => {
    if (!overlay.rssSourceIds || overlay.rssSourceIds.length === 0) {
      return 'No RSS sources selected';
    }

    if (!articles || articles.length === 0) {
      return 'No recent headlines available';
    }

    // Filter articles by selected sources
    const filteredArticles = articles
      .filter(a => overlay.rssSourceIds?.includes(a.sourceId))
      .slice(0, overlay.rssMaxArticles || 10);

    if (filteredArticles.length === 0) {
      return 'No recent headlines available';
    }

    // Format: "SOURCE: Headline - Description • SOURCE: Headline - Description • ..."
    const tickerItems = filteredArticles.map(article => {
      const sourceName = sourceNameMap.get(article.sourceId) || article.sourceId;
      const headline = article.title;
      // Include first 80 chars of description as "important detail"
      const description = article.description 
        ? (article.description.length > 80 ? article.description.substring(0, 77) + '...' : article.description)
        : '';
      
      if (overlay.rssShowSource) {
        return description 
          ? `${sourceName.toUpperCase()}: ${headline} - ${description}`
          : `${sourceName.toUpperCase()}: ${headline}`;
      } else {
        return description 
          ? `${headline} - ${description}`
          : headline;
      }
    });

    return tickerItems.join(' • ');
  }, [sourceNameMap]);

  const createOffscreenCanvas = useCallback((width: number, height: number): HTMLCanvasElement => {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    return offscreen;
  }, []);

  const getCachedOverlay = useCallback((
    overlayId: string,
    width: number,
    height: number,
    renderer: (ctx: CanvasRenderingContext2D) => void
  ): HTMLCanvasElement => {
    const cacheKey = `${overlayId}-${width}-${height}`;
    let cached = overlayCanvasCache.current.get(cacheKey);
    
    if (!cached || cached.width !== width || cached.height !== height) {
      cached = createOffscreenCanvas(width, height);
      const ctx = cached.getContext('2d');
      if (ctx) {
        renderer(ctx);
      }
      overlayCanvasCache.current.set(cacheKey, cached);
    }
    
    return cached;
  }, [createOffscreenCanvas]);

  const debouncedOverlayUpdate = useMemo(
    () => debounce(() => {
      overlayCanvasCache.current.clear();
      lastOverlayUpdate.current = Date.now();
    }, 300),
    []
  );

  const drawVideoWithAspectRatio = useCallback((
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    cellX: number,
    cellY: number,
    cellWidth: number,
    cellHeight: number,
    fitMode: 'contain' | 'cover' | 'fill'
  ) => {
    const videoAspect = video.videoWidth / video.videoHeight;
    const cellAspect = cellWidth / cellHeight;
    
    let drawWidth = cellWidth;
    let drawHeight = cellHeight;
    let drawX = cellX;
    let drawY = cellY;
    
    if (fitMode === 'contain') {
      if (videoAspect > cellAspect) {
        drawHeight = cellWidth / videoAspect;
        drawY = cellY + (cellHeight - drawHeight) / 2;
      } else {
        drawWidth = cellHeight * videoAspect;
        drawX = cellX + (cellWidth - drawWidth) / 2;
      }
    } else if (fitMode === 'cover') {
      if (videoAspect > cellAspect) {
        drawWidth = cellHeight * videoAspect;
        drawX = cellX - (drawWidth - cellWidth) / 2;
      } else {
        drawHeight = cellWidth / videoAspect;
        drawY = cellY - (drawHeight - cellHeight) / 2;
      }
    }
    
    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    activeSources.forEach((source) => {
      if (!source.stream) return;
      
      // Verify stream is actually a MediaStream (not a serialized object)
      if (!(source.stream instanceof MediaStream)) {
        console.warn(`Source ${source.id} has invalid stream object, skipping`);
        return;
      }

      let video = videoRefs.current.get(source.id);
      if (!video) {
        video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        videoRefs.current.set(source.id, video);
      }
      
      if (video.srcObject !== source.stream) {
        video.srcObject = source.stream;
        video.play().catch(err => {
          console.error(`Failed to play video for source ${source.id}:`, err);
        });
      }
    });

    const currentSourceIds = new Set(activeSources.map(s => s.id));
    Array.from(videoRefs.current.keys()).forEach(id => {
      if (!currentSourceIds.has(id)) {
        const video = videoRefs.current.get(id);
        if (video) {
          video.srcObject = null;
        }
        videoRefs.current.delete(id);
      }
    });

    overlays.forEach(overlay => {
      if (!scrollPositions.current.has(overlay.id)) {
        scrollPositions.current.set(overlay.id, canvas.width);
      }
      if (!fadeStates.current.has(overlay.id)) {
        fadeStates.current.set(overlay.id, 0);
      }
    });

    const currentImageSources = new Set(
      overlays
        .filter(o => o.overlayType === 'image')
        .map(o => o.imageData || o.imageUrl)
        .filter(Boolean)
    );
    Array.from(loadedImages.current.keys()).forEach(src => {
      if (!currentImageSources.has(src)) {
        loadedImages.current.delete(src);
      }
    });

    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (activeSources.length === 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No active sources', canvas.width / 2, canvas.height / 2);
      } else {
        const count = activeSources.length;
        let cols, rows;
        if (count === 1) {
          cols = 1;
          rows = 1;
        } else if (count === 2) {
          cols = 2;
          rows = 1;
        } else if (count <= 4) {
          cols = 2;
          rows = 2;
        } else if (count <= 6) {
          cols = 3;
          rows = 2;
        } else if (count <= 9) {
          cols = 3;
          rows = 3;
        } else {
          cols = 4;
          rows = Math.ceil(count / 4);
        }

        const cellWidth = canvas.width / cols;
        const cellHeight = canvas.height / rows;
        const padding = 4;

        activeSources.forEach((source, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = col * cellWidth + padding;
          const y = row * cellHeight + padding;
          const width = cellWidth - padding * 2;
          const height = cellHeight - padding * 2;

          const video = videoRefs.current.get(source.id);
          
          if (video && video.readyState >= 2) {
            const fitMode = sourceFitModes[source.id] || globalFitMode;
            drawVideoWithAspectRatio(ctx, video, x, y, width, height, fitMode);
          } else {
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '#374151';
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = '#9ca3af';
            ctx.font = `${Math.floor(height * 0.08)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${source.name}`, x + width / 2, y + height / 2 - 10);
            ctx.fillText('(Loading...)', x + width / 2, y + height / 2 + 10);
          }

          const labelHeight = 30;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x, y + height - labelHeight, width, labelHeight);
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(source.name, x + width / 2, y + height - labelHeight / 2);
        });
      }

      const hexToRgba = (hex: string, alpha: number = 1) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const sortedOverlays = [...overlays]
        .filter(o => o.visible)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      sortedOverlays.forEach(overlay => {
        const overlayWidth = (canvas.width * (overlay.width || 100)) / 100;
        const xPosition = overlay.x || 0;

        // Scale overlay height based on canvas resolution (larger canvas = larger overlay)
        const baseHeight = 1080; // Reference height (Full HD)
        const heightScale = canvas.height / baseHeight;
        const scaledHeight = Math.max(60, Math.floor(overlay.height * heightScale)); // Min 60px
        
        // Scale font size proportionally
        const scaledFontSize = Math.max(20, Math.floor(overlay.fontSize * heightScale)); // Min 20px

        // Handle legacy position field or use y coordinate
        let yPosition = overlay.y || 0;
        if (overlay.position === 'bottom') {
          yPosition = canvas.height - scaledHeight;
        } else if (overlay.position === 'top') {
          yPosition = 0;
        }
        
        ctx.globalAlpha = overlay.opacity !== undefined ? overlay.opacity : 1;

        if (overlay.overlayType === 'video') {
          const videoSrc = overlay.videoUrl;
          if (!videoSrc) {
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.9);
            ctx.fillRect(xPosition, yPosition, overlayWidth, scaledHeight);
            
            // Add accent stripe
            const stripeHeight = Math.max(4, Math.floor(scaledHeight * 0.06));
            ctx.fillStyle = hexToRgba(overlay.textColor, 0.3);
            ctx.fillRect(xPosition, yPosition, overlayWidth, stripeHeight);
            
            ctx.fillStyle = overlay.textColor;
            ctx.font = `${scaledFontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No video source', xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
            ctx.globalAlpha = 1;
            return;
          }

          let video = videoRefs.current.get(`overlay-${overlay.id}`);
          if (!video) {
            video = document.createElement('video');
            video.src = videoSrc;
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            videoRefs.current.set(`overlay-${overlay.id}`, video);
            video.play().catch(err => console.error('Failed to play overlay video:', err));
          }

          if (overlay.backgroundColor) {
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.9);
            ctx.fillRect(xPosition, yPosition, overlayWidth, scaledHeight);
            
            // Add accent stripe
            const stripeHeight = Math.max(4, Math.floor(scaledHeight * 0.06));
            ctx.fillStyle = hexToRgba(overlay.textColor, 0.3);
            ctx.fillRect(xPosition, yPosition, overlayWidth, stripeHeight);
          }

          if (video.readyState >= 2) {
            ctx.drawImage(video, xPosition, yPosition, overlayWidth, scaledHeight);
          } else {
            ctx.fillStyle = overlay.textColor;
            ctx.font = `14px "${overlay.fontFamily}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading video...', xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
          }
        } else if (overlay.overlayType === 'metric') {
          ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.9);
          ctx.fillRect(xPosition, yPosition, overlayWidth, scaledHeight);
          
          // Add accent stripe
          const stripeHeight = Math.max(4, Math.floor(scaledHeight * 0.06));
          ctx.fillStyle = hexToRgba(overlay.textColor, 0.3);
          ctx.fillRect(xPosition, yPosition, overlayWidth, stripeHeight);

          ctx.fillStyle = overlay.textColor;
          const fontWeight = overlay.isBold ? 'bold' : 'normal';
          const fontStyle = overlay.isItalic ? 'italic' : 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px "${overlay.fontFamily}", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const metricType = overlay.metricType || 'default';
          const metricData = overlay.metricData;

          if (metricType === 'h2h-card' && metricData) {
            ctx.font = `bold ${scaledFontSize + 2}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText('H2H STATS', xPosition + overlayWidth / 2, yPosition + 25);
            ctx.font = `${fontWeight} ${scaledFontSize - 2}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`Wins: ${metricData.wins || 0}`, xPosition + overlayWidth / 2, yPosition + 60);
            ctx.fillText(`Draws: ${metricData.draws || 0}`, xPosition + overlayWidth / 2, yPosition + 90);
            ctx.fillText(`Losses: ${metricData.losses || 0}`, xPosition + overlayWidth / 2, yPosition + 120);
          } else if (metricType === 'form-guide' && metricData) {
            const titleSize = overlay.formTitleSize || scaledFontSize;
            const circleSize = overlay.formCircleSize || (scaledFontSize + 4);
            ctx.font = `bold ${titleSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText('RECENT FORM', xPosition + overlayWidth / 2, yPosition + 25);
            const form = metricData.form || 'WWDLL';
            ctx.font = `bold ${circleSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(form, xPosition + overlayWidth / 2, yPosition + 70);
          } else if (metricType === 'player-stats' && metricData) {
            ctx.font = `bold ${scaledFontSize + 2}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(metricData.playerName || 'Player', xPosition + overlayWidth / 2, yPosition + 25);
            ctx.font = `${fontWeight} ${scaledFontSize - 2}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`Goals/90: ${metricData.goalsPerGame || 0}`, xPosition + overlayWidth / 2, yPosition + 60);
            ctx.fillText(`Assists: ${metricData.assists || 0}`, xPosition + overlayWidth / 2, yPosition + 95);
            ctx.fillText(`Rating: ${metricData.rating || 0}`, xPosition + overlayWidth / 2, yPosition + 130);
          } else if (metricType === 'league-table' && metricData) {
            ctx.font = `bold ${scaledFontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText('LEAGUE POSITION', xPosition + overlayWidth / 2, yPosition + 25);
            ctx.font = `bold ${scaledFontSize + 8}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`#${metricData.position || '?'}`, xPosition + overlayWidth / 2, yPosition + 80);
            ctx.font = `${fontWeight} ${scaledFontSize - 4}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`${metricData.points || 0} pts`, xPosition + overlayWidth / 2, yPosition + 130);
          } else if (metricType === 'live-metrics') {
            const metricsText = metricData?.text || 'Live Analytics';
            if (overlay.animationType === 'scroll') {
              const scrollSpeed = overlay.scrollSpeed / 10;
              let scrollX = scrollPositions.current.get(overlay.id) || overlayWidth;
              ctx.textAlign = 'left';
              const textWidth = ctx.measureText(metricsText).width;
              
              if (overlay.scrollDirection === 'left') {
                scrollX -= scrollSpeed;
                if (scrollX < -textWidth - 100) scrollX = overlayWidth;
              } else {
                scrollX += scrollSpeed;
                if (scrollX > overlayWidth + 100) scrollX = -textWidth;
              }
              
              ctx.fillText(metricsText, xPosition + scrollX, yPosition + scaledHeight / 2);
              const x2 = overlay.scrollDirection === 'left'
                ? scrollX + textWidth + 100
                : scrollX - textWidth - 100;
              ctx.fillText(metricsText, xPosition + x2, yPosition + scaledHeight / 2);
              scrollPositions.current.set(overlay.id, scrollX);
            } else {
              ctx.fillText(metricsText, xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
            }
          } else if (metricType === 'live-score' && metricData) {
            ctx.font = `bold ${scaledFontSize + 8}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`${metricData.homeScore || 0} - ${metricData.awayScore || 0}`, 
              xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
          } else {
            ctx.fillText(overlay.text || 'Metric Display', xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
          }
        } else if (overlay.overlayType === 'image') {
          const imageSrc = overlay.imageData || overlay.imageUrl;
          if (!imageSrc) {
            ctx.globalAlpha = 1;
            return;
          }

          let img = loadedImages.current.get(imageSrc);
          
          if (!img) {
            loadImage(imageSrc)
              .then(loadedImg => {
                loadedImages.current.set(imageSrc, loadedImg);
              })
              .catch(error => {
                console.error('Failed to load overlay image:', error);
              });
            ctx.globalAlpha = 1;
            return;
          }

          const imgAspect = img.width / img.height;
          const overlayAspect = overlayWidth / scaledHeight;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspect > overlayAspect) {
            drawWidth = overlayWidth;
            drawHeight = overlayWidth / imgAspect;
            drawX = xPosition;
            drawY = (scaledHeight - drawHeight) / 2;
          } else {
            drawHeight = scaledHeight;
            drawWidth = scaledHeight * imgAspect;
            drawX = xPosition + (overlayWidth - drawWidth) / 2;
            drawY = 0;
          }

          if (overlay.backgroundColor) {
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.95);
            ctx.fillRect(xPosition, yPosition, overlayWidth, scaledHeight);
          }

          ctx.drawImage(
            img,
            drawX,
            yPosition + drawY,
            drawWidth,
            drawHeight
          );
        } else if (overlay.overlayType === 'rss') {
          // RSS Ticker Overlay
          // Use color palette if set, otherwise use overlay colors
          const bgColor = overlay.colorPalette && COLOR_PALETTES[overlay.colorPalette]
            ? COLOR_PALETTES[overlay.colorPalette].background
            : overlay.backgroundColor;
          const textColor = overlay.colorPalette && COLOR_PALETTES[overlay.colorPalette]
            ? COLOR_PALETTES[overlay.colorPalette].text
            : overlay.textColor;
          
          if (!rssArticles || rssArticles.length === 0) {
            // Show loading or no data message
            ctx.fillStyle = hexToRgba(bgColor, overlay.opacity || 0.95);
            ctx.fillRect(xPosition, yPosition, overlayWidth, scaledHeight);
            
            // Add accent stripe
            const stripeHeight = Math.max(4, Math.floor(scaledHeight * 0.06));
            ctx.fillStyle = hexToRgba(textColor, 0.3);
            ctx.fillRect(xPosition, yPosition, overlayWidth, stripeHeight);
            
            ctx.fillStyle = textColor;
            ctx.font = `bold ${scaledFontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const loadingMsg = rssSources ? 'No recent headlines available' : 'Loading RSS feed...';
            
            // Add text shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(loadingMsg, xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.globalAlpha = 1;
            return;
          }

          // Build ticker text from RSS articles
          const tickerText = formatRssTicker(overlay, rssArticles);
          
          if (!tickerText || tickerText === 'No RSS sources selected' || tickerText === 'No recent headlines available') {
            // Show message
            ctx.fillStyle = hexToRgba(bgColor, overlay.opacity || 0.95);
            ctx.fillRect(xPosition, yPosition, overlayWidth, scaledHeight);
            
            // Add accent stripe
            const stripeHeight = Math.max(4, Math.floor(scaledHeight * 0.06));
            ctx.fillStyle = hexToRgba(textColor, 0.3);
            ctx.fillRect(xPosition, yPosition, overlayWidth, stripeHeight);
            
            ctx.fillStyle = textColor;
            // Measure text and scale to fit if needed
            let actualFontSize = scaledFontSize;
            const maxTextWidth = overlayWidth - 20; // Leave padding
            
            // Function to find the right font size using measureText
            const fitTextToContainer = () => {
              for (let size = scaledFontSize; size > 10; size -= 2) {
                ctx.font = `bold ${size}px "${overlay.fontFamily}", sans-serif`;
                const textMetrics = ctx.measureText(tickerText);
                if (textMetrics.width <= maxTextWidth) {
                  actualFontSize = size;
                  break;
                }
              }
            };
            
            fitTextToContainer();
            
            ctx.font = `bold ${actualFontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add text shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(tickerText, xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.globalAlpha = 1;
            return;
          }

          // Draw background with color palette
          ctx.fillStyle = hexToRgba(bgColor, overlay.opacity || 0.95);
          ctx.fillRect(xPosition, yPosition, overlayWidth, scaledHeight);
          
          // Add accent stripe at top
          const stripeHeight = Math.max(4, Math.floor(scaledHeight * 0.06));
          ctx.fillStyle = hexToRgba(textColor, 0.3);
          ctx.fillRect(xPosition, yPosition, overlayWidth, stripeHeight);
          
          ctx.fillStyle = textColor;
          const fontWeight = overlay.isBold ? 'bold' : 'normal';
          const fontStyle = overlay.isItalic ? 'italic' : 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px "${overlay.fontFamily}", sans-serif`;
          ctx.textBaseline = 'middle';

          // Add text shadow for readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          if (overlay.animationType === 'scroll') {
            const scrollSpeed = overlay.scrollSpeed / 10;
            let scrollX = scrollPositions.current.get(overlay.id) || overlayWidth;
            ctx.textAlign = 'left';
            const textWidth = ctx.measureText(tickerText).width;
            
            if (overlay.scrollDirection === 'left') {
              scrollX -= scrollSpeed;
              if (scrollX < -textWidth - 100) scrollX = overlayWidth;
            } else {
              scrollX += scrollSpeed;
              if (scrollX > overlayWidth + 100) scrollX = -textWidth;
            }
            
            ctx.fillText(tickerText, xPosition + scrollX, yPosition + scaledHeight / 2);
            const x2 = overlay.scrollDirection === 'left'
              ? scrollX + textWidth + 100
              : scrollX - textWidth - 100;
            ctx.fillText(tickerText, xPosition + x2, yPosition + scaledHeight / 2);
            scrollPositions.current.set(overlay.id, scrollX);
          } else {
            ctx.textAlign = 'center';
            ctx.fillText(tickerText, xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
          }

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else if (overlay.overlayType === 'text') {
          // Enhanced Background Rendering
          if (overlay.backgroundType === 'linear-gradient') {
            const angle = (overlay.gradientAngle || 0) * Math.PI / 180;
            const x1 = xPosition + overlayWidth / 2 - Math.cos(angle) * overlayWidth / 2;
            const y1 = yPosition + scaledHeight / 2 - Math.sin(angle) * scaledHeight / 2;
            const x2 = xPosition + overlayWidth / 2 + Math.cos(angle) * overlayWidth / 2;
            const y2 = yPosition + scaledHeight / 2 + Math.sin(angle) * scaledHeight / 2;
            
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, overlay.gradientColor1 || overlay.backgroundColor);
            gradient.addColorStop(1, overlay.gradientColor2 || overlay.backgroundColor);
            ctx.fillStyle = gradient;
          } else if (overlay.backgroundType === 'radial-gradient') {
            const gradient = ctx.createRadialGradient(
              xPosition + overlayWidth / 2, yPosition + scaledHeight / 2, 0,
              xPosition + overlayWidth / 2, yPosition + scaledHeight / 2, Math.max(overlayWidth, scaledHeight) / 2
            );
            gradient.addColorStop(0, overlay.gradientColor1 || overlay.backgroundColor);
            gradient.addColorStop(1, overlay.gradientColor2 || overlay.backgroundColor);
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.9);
          }

          // Apply border radius if specified
          if (overlay.borderRadius && overlay.borderRadius > 0) {
            ctx.save();
            ctx.beginPath();
            const radius = Math.min(overlay.borderRadius, scaledHeight / 2, overlayWidth / 2);
            ctx.moveTo(xPosition + radius, yPosition);
            ctx.lineTo(xPosition + overlayWidth - radius, yPosition);
            ctx.quadraticCurveTo(xPosition + overlayWidth, yPosition, xPosition + overlayWidth, yPosition + radius);
            ctx.lineTo(xPosition + overlayWidth, yPosition + scaledHeight - radius);
            ctx.quadraticCurveTo(xPosition + overlayWidth, yPosition + scaledHeight, xPosition + overlayWidth - radius, yPosition + scaledHeight);
            ctx.lineTo(xPosition + radius, yPosition + scaledHeight);
            ctx.quadraticCurveTo(xPosition, yPosition + scaledHeight, xPosition, yPosition + scaledHeight - radius);
            ctx.lineTo(xPosition, yPosition + radius);
            ctx.quadraticCurveTo(xPosition, yPosition, xPosition + radius, yPosition);
            ctx.closePath();
            ctx.clip();
          }

          ctx.fillRect(xPosition, yPosition, overlayWidth, scaledHeight);

          // Add box shadow/glow effect
          if (overlay.boxShadow || overlay.glowEffect) {
            ctx.shadowColor = overlay.glowEffect ? overlay.textColor : 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = overlay.glowEffect ? 20 : 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }

          // Add accent stripe
          const stripeHeight = Math.max(4, Math.floor(scaledHeight * 0.06));
          ctx.fillStyle = hexToRgba(overlay.textColor, 0.3);
          ctx.fillRect(xPosition, yPosition, overlayWidth, stripeHeight);

          ctx.fillStyle = overlay.textColor;
          const fontWeight = overlay.fontWeight || (overlay.isBold ? 700 : 400);
          const fontStyle = overlay.isItalic ? 'italic' : 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px "${overlay.fontFamily}", sans-serif`;
          ctx.textBaseline = 'middle';

          // Add text shadow
          if (overlay.textShadow) {
            const parts = overlay.textShadow.split(' ');
            if (parts.length >= 3) {
              ctx.shadowOffsetX = parseFloat(parts[0]) || 2;
              ctx.shadowOffsetY = parseFloat(parts[1]) || 2;
              ctx.shadowBlur = parseFloat(parts[2]) || 8;
              ctx.shadowColor = parts[3] || 'rgba(0, 0, 0, 0.7)';
            }
          } else {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
          }

          // Apply text transform
          let displayText = overlay.text;
          if (overlay.textTransform === 'uppercase') {
            displayText = displayText.toUpperCase();
          } else if (overlay.textTransform === 'lowercase') {
            displayText = displayText.toLowerCase();
          } else if (overlay.textTransform === 'capitalize') {
            displayText = displayText.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }

          if (overlay.animationType === 'scroll') {
            const scrollSpeed = overlay.scrollSpeed / 10;
            const isVertical = overlay.scrollDirection === 'up' || overlay.scrollDirection === 'down';
            
            if (isVertical) {
              let scrollY = scrollPositions.current.get(overlay.id);
              if (scrollY === undefined) {
                scrollY = overlay.scrollDirection === 'down' ? -scaledHeight : canvas.height;
              }
              
              ctx.textAlign = 'center';
              if (overlay.borderWidth && overlay.borderWidth > 0) {
                ctx.strokeStyle = overlay.borderColor || '#000000';
                ctx.lineWidth = overlay.borderWidth;
                ctx.setLineDash(overlay.borderStyle === 'dashed' ? [10, 5] : overlay.borderStyle === 'dotted' ? [2, 5] : []);
                ctx.strokeText(displayText, xPosition + overlayWidth / 2, scrollY + scaledHeight / 2);
                ctx.setLineDash([]);
              }
              ctx.fillText(displayText, xPosition + overlayWidth / 2, scrollY + scaledHeight / 2);
              
              const textHeight = scaledFontSize * 1.2;
              if (overlay.scrollDirection === 'up') {
                scrollY -= scrollSpeed;
                if (scrollY < -textHeight - 50) {
                  scrollY = canvas.height;
                }
              } else {
                scrollY += scrollSpeed;
                if (scrollY > canvas.height + 50) {
                  scrollY = -scaledHeight;
                }
              }
              
              scrollPositions.current.set(overlay.id, scrollY);
            } else {
              let scrollX = scrollPositions.current.get(overlay.id);
              if (scrollX === undefined) {
                scrollX = overlay.scrollDirection === 'right' ? -overlayWidth : overlayWidth;
              }
              
              ctx.textAlign = 'left';
              if (overlay.borderWidth && overlay.borderWidth > 0) {
                ctx.strokeStyle = overlay.borderColor || '#000000';
                ctx.lineWidth = overlay.borderWidth;
                ctx.setLineDash(overlay.borderStyle === 'dashed' ? [10, 5] : overlay.borderStyle === 'dotted' ? [2, 5] : []);
                ctx.strokeText(displayText, xPosition + scrollX, yPosition + scaledHeight / 2);
                ctx.setLineDash([]);
              }
              ctx.fillText(displayText, xPosition + scrollX, yPosition + scaledHeight / 2);
              
              const textWidth = ctx.measureText(displayText).width;
              if (overlay.scrollDirection === 'left') {
                scrollX -= scrollSpeed;
                if (scrollX < -textWidth - 50) {
                  scrollX = overlayWidth;
                }
              } else {
                scrollX += scrollSpeed;
                if (scrollX > overlayWidth + 50) {
                  scrollX = -textWidth;
                }
              }
              
              scrollPositions.current.set(overlay.id, scrollX);
            }
          } else if (overlay.animationType === 'fade') {
            let fadeTime = fadeStates.current.get(overlay.id) || 0;
            fadeTime += 0.02;
            
            const opacity = (Math.sin(fadeTime) + 1) / 2;
            const baseOpacity = overlay.opacity !== undefined ? overlay.opacity : 1;
            ctx.globalAlpha = opacity * 0.5 * baseOpacity + 0.5 * baseOpacity;
            
            ctx.textAlign = 'center';
            if (overlay.borderWidth && overlay.borderWidth > 0) {
              ctx.strokeStyle = overlay.borderColor || '#000000';
              ctx.lineWidth = overlay.borderWidth;
              ctx.setLineDash(overlay.borderStyle === 'dashed' ? [10, 5] : overlay.borderStyle === 'dotted' ? [2, 5] : []);
              ctx.strokeText(displayText, xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
              ctx.setLineDash([]);
            }
            ctx.fillText(displayText, xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
            ctx.globalAlpha = baseOpacity;
            
            fadeStates.current.set(overlay.id, fadeTime);
          } else {
            ctx.textAlign = 'center';
            if (overlay.borderWidth && overlay.borderWidth > 0) {
              ctx.strokeStyle = overlay.borderColor || '#000000';
              ctx.lineWidth = overlay.borderWidth;
              ctx.setLineDash(overlay.borderStyle === 'dashed' ? [10, 5] : overlay.borderStyle === 'dotted' ? [2, 5] : []);
              ctx.strokeText(displayText, xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
              ctx.setLineDash([]);
            }
            ctx.fillText(displayText, xPosition + overlayWidth / 2, yPosition + scaledHeight / 2);
          }

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Restore canvas context if border radius was applied
          if (overlay.borderRadius && overlay.borderRadius > 0) {
            ctx.restore();
          }
        }
        
        ctx.globalAlpha = 1;
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeSources, overlays, outputResolution, globalFitMode, sourceFitModes, rssArticles, sourceNameMap, formatRssTicker]);

  const handleOverlayClick = (overlayId: string) => {
    setSelectedOverlayId(overlayId);
    if (onSelectOverlay) {
      onSelectOverlay(overlayId);
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent, overlayId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const overlay = overlays.find(o => o.id === overlayId);
    if (!overlay) return;

    setSelectedOverlayId(overlayId);
    if (onSelectOverlay) {
      onSelectOverlay(overlayId);
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialOverlayState({ 
      x: overlay.x, 
      y: overlay.y, 
      width: overlay.width, 
      height: overlay.height 
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, overlayId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const overlay = overlays.find(o => o.id === overlayId);
    if (!overlay) return;

    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedOverlayId(overlayId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialOverlayState({ 
      x: overlay.x, 
      y: overlay.y, 
      width: overlay.width, 
      height: overlay.height 
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart || !initialOverlayState || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      const deltaX = (e.clientX - dragStart.x) * scaleX;
      const deltaY = (e.clientY - dragStart.y) * scaleY;

      if (isDragging && selectedOverlayId && onUpdateOverlay) {
        const newX = Math.max(0, Math.min(canvas.width - (canvas.width * initialOverlayState.width / 100), initialOverlayState.x + deltaX));
        const newY = Math.max(0, Math.min(canvas.height - initialOverlayState.height, initialOverlayState.y + deltaY));
        
        onUpdateOverlay(selectedOverlayId, { 
          x: newX, 
          y: newY 
        });
      } else if (isResizing && selectedOverlayId && resizeHandle && onUpdateOverlay) {
        const overlay = overlays.find(o => o.id === selectedOverlayId);
        if (!overlay) return;

        const canvasWidthPx = canvas.width * (initialOverlayState.width / 100);
        let newX = initialOverlayState.x;
        let newY = initialOverlayState.y;
        let newWidth = initialOverlayState.width;
        let newHeight = initialOverlayState.height;

        switch (resizeHandle) {
          case 'nw':
            newX = initialOverlayState.x + deltaX;
            newY = initialOverlayState.y + deltaY;
            newWidth = Math.max(10, (canvasWidthPx - deltaX) / canvas.width * 100);
            newHeight = Math.max(30, initialOverlayState.height - deltaY);
            break;
          case 'n':
            newY = initialOverlayState.y + deltaY;
            newHeight = Math.max(30, initialOverlayState.height - deltaY);
            break;
          case 'ne':
            newY = initialOverlayState.y + deltaY;
            newWidth = Math.max(10, (canvasWidthPx + deltaX) / canvas.width * 100);
            newHeight = Math.max(30, initialOverlayState.height - deltaY);
            break;
          case 'e':
            newWidth = Math.max(10, (canvasWidthPx + deltaX) / canvas.width * 100);
            break;
          case 'se':
            newWidth = Math.max(10, (canvasWidthPx + deltaX) / canvas.width * 100);
            newHeight = Math.max(30, initialOverlayState.height + deltaY);
            break;
          case 's':
            newHeight = Math.max(30, initialOverlayState.height + deltaY);
            break;
          case 'sw':
            newX = initialOverlayState.x + deltaX;
            newWidth = Math.max(10, (canvasWidthPx - deltaX) / canvas.width * 100);
            newHeight = Math.max(30, initialOverlayState.height + deltaY);
            break;
          case 'w':
            newX = initialOverlayState.x + deltaX;
            newWidth = Math.max(10, (canvasWidthPx - deltaX) / canvas.width * 100);
            break;
        }

        // Ensure overlay stays within canvas bounds
        newX = Math.max(0, Math.min(canvas.width - (canvas.width * newWidth / 100), newX));
        newY = Math.max(0, Math.min(canvas.height - newHeight, newY));

        onUpdateOverlay(selectedOverlayId, { 
          x: newX, 
          y: newY, 
          width: newWidth, 
          height: newHeight 
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      setDragStart(null);
      setInitialOverlayState(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, initialOverlayState, selectedOverlayId, resizeHandle, overlays, onUpdateOverlay]);

  const renderMetricOverlay = (overlay: OverlayConfig) => {
    const { metricType, metricData, width, height, opacity, x, y } = overlay;

    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate adjusted y position to prevent clipping at bottom
    let adjustedY = y;
    const canvasHeight = canvas.height;
    
    // If overlay extends beyond canvas height, adjust y position
    if (y + height > canvasHeight) {
      adjustedY = canvasHeight - height;
    }
    
    // Ensure overlay doesn't go above canvas
    adjustedY = Math.max(0, adjustedY);

    const isSelected = selectedOverlayId === overlay.id;

    const style: React.CSSProperties = {
      position: 'absolute',
      width: `${width}%`,
      height: `${height}px`,
      left: `${x}px`,
      top: `${adjustedY}px`,
      zIndex: overlay.zIndex || 100,
      pointerEvents: 'auto',
      cursor: isDragging ? 'grabbing' : 'grab',
      border: isSelected ? '2px solid #C8102E' : 'none',
      boxSizing: 'border-box',
    };

    const overlayComponent = (() => {
      switch (metricType) {
        case 'h2h-card':
          return (
            <H2HMatchCardOverlay
              homeTeamId={metricData?.homeTeamId || 40}
              awayTeamId={metricData?.awayTeamId || 47}
              competitionFilter={metricData?.competitionFilter}
              venueFilter={metricData?.venueFilter || 'all'}
              seasonRange={metricData?.seasonFilter ? { from: metricData.seasonFilter, to: metricData.seasonFilter } : undefined}
              width={100}
              height={height}
              opacity={opacity}
            />
          );
        case 'form-guide':
          return (
            <FormGuideOverlay
              width={100}
              height={height}
              opacity={opacity}
              layout={metricData?.layout || 'horizontal'}
              teamId={metricData?.teamId || 40}
              competitionId={metricData?.competitionId}
              seasonFilter={metricData?.seasonFilter}
              matchLimit={metricData?.matchLimit || 5}
              showCompetitionBadges={metricData?.showCompetitionBadges || false}
              colorPalette={overlay.colorPalette || 'classic'}
              titleSize={overlay.formTitleSize}
              circleSize={overlay.formCircleSize}
              labelSize={overlay.formLabelSize}
            />
          );
        case 'player-stats':
          return (
            <PlayerStatsOverlay
              playerId={metricData?.playerId || 1}
              width={100}
              height={height}
              opacity={opacity}
            />
          );
        case 'league-table':
          return (
            <LeaguePositionOverlay
              width={100}
              height={height}
              opacity={opacity}
            />
          );
        case 'rss-sentiment':
          return (
            <RssSentimentOverlay
              width={overlay.width}
              height={overlay.height}
              opacity={overlay.opacity}
              timeframe={metricData?.timeframe || '24h'}
              showTrendingTopics={metricData?.showTrendingTopics}
              showSentimentBreakdown={metricData?.showSentimentBreakdown}
              minSentiment={metricData?.minSentiment}
            />
          );
        case 'rss-ticker-enhanced':
          return (
            <RssTickerEnhancedOverlay
              width={overlay.width}
              height={overlay.height}
              opacity={overlay.opacity}
              rssSourceIds={metricData?.rssSourceIds || []}
              maxArticles={metricData?.maxArticles}
              showSentiment={metricData?.showSentiment}
              showTopics={metricData?.showTopics}
              showKeywords={metricData?.showKeywords}
              showCredibility={metricData?.showCredibility}
              sentimentFilter={metricData?.sentimentFilter}
            />
          );
        case 'upcoming-fixtures':
          return (
            <UpcomingFixturesOverlay
              width={overlay.width}
              height={overlay.height}
              opacity={overlay.opacity}
              fixtureCount={metricData?.fixtureCount}
              competitionFilter={metricData?.competitionFilter}
              showCountdown={metricData?.showCountdown}
              showOpponentForm={metricData?.showOpponentForm}
              colorPalette={overlay.colorPalette}
            />
          );
        case 'player-comparison':
          return (
            <PlayerComparisonOverlay
              player1Id={metricData?.player1Id}
              player2Id={metricData?.player2Id}
              width={overlay.width}
              height={overlay.height}
              opacity={overlay.opacity}
              viewMode={metricData?.viewMode}
              statCategories={metricData?.statCategories}
              season={metricData?.season}
              competition={metricData?.competition}
              colorPalette={overlay.colorPalette}
            />
          );
        default:
          return null;
      }
    })();

    const resizeHandles = isSelected ? (
      <>
        {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => {
          let cursorStyle = '';
          let positionStyle: React.CSSProperties = {};
          
          switch (handle) {
            case 'nw':
              cursorStyle = 'nwse-resize';
              positionStyle = { top: '-4px', left: '-4px' };
              break;
            case 'n':
              cursorStyle = 'ns-resize';
              positionStyle = { top: '-4px', left: '50%', transform: 'translateX(-50%)' };
              break;
            case 'ne':
              cursorStyle = 'nesw-resize';
              positionStyle = { top: '-4px', right: '-4px' };
              break;
            case 'e':
              cursorStyle = 'ew-resize';
              positionStyle = { top: '50%', right: '-4px', transform: 'translateY(-50%)' };
              break;
            case 'se':
              cursorStyle = 'nwse-resize';
              positionStyle = { bottom: '-4px', right: '-4px' };
              break;
            case 's':
              cursorStyle = 'ns-resize';
              positionStyle = { bottom: '-4px', left: '50%', transform: 'translateX(-50%)' };
              break;
            case 'sw':
              cursorStyle = 'nesw-resize';
              positionStyle = { bottom: '-4px', left: '-4px' };
              break;
            case 'w':
              cursorStyle = 'ew-resize';
              positionStyle = { top: '50%', left: '-4px', transform: 'translateY(-50%)' };
              break;
          }

          return (
            <div
              key={handle}
              data-testid={`resize-handle-${handle}-${overlay.id}`}
              onMouseDown={(e) => handleResizeMouseDown(e, overlay.id, handle)}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #C8102E',
                cursor: cursorStyle,
                zIndex: 1000,
                ...positionStyle,
              }}
            />
          );
        })}
      </>
    ) : null;

    return (
      <OverlayErrorBoundary key={overlay.id} overlayId={overlay.id}>
        <div 
          style={style}
          onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id)}
          onClick={() => handleOverlayClick(overlay.id)}
          data-testid={`metric-overlay-${overlay.id}`}
        >
          {overlayComponent}
          {resizeHandles}
        </div>
      </OverlayErrorBoundary>
    );
  };

  const metricOverlays = overlays.filter(o => 
    o.visible && 
    o.overlayType === 'metric' && 
    ['h2h-card', 'form-guide', 'player-stats', 'league-table', 'rss-sentiment', 'rss-ticker-enhanced', 'upcoming-fixtures', 'player-comparison'].includes(o.metricType || '')
  );

  return (
    <div className={`bg-black ${className}`} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={outputResolution.width}
        height={outputResolution.height}
        className="w-full h-full object-contain"
        data-testid="canvas-video-compositor"
      />
      {metricOverlays.map(overlay => renderMetricOverlay(overlay))}
    </div>
  );
});

VideoCompositor.displayName = 'VideoCompositor';

export default VideoCompositor;
