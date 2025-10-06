import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { RssArticle, RssSource } from "@shared/schema";
import H2HMatchCardOverlay from "./overlays/H2HMatchCardOverlay";
import FormGuideOverlay from "./overlays/FormGuideOverlay";
import PlayerStatsOverlay from "./overlays/PlayerStatsOverlay";
import LeaguePositionOverlay from "./overlays/LeaguePositionOverlay";
import RssSentimentOverlay from "./overlays/RssSentimentOverlay";

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
}

interface VideoCompositorProps {
  activeSources?: ActiveSource[];
  outputResolution?: { width: number; height: number };
  globalFitMode?: 'contain' | 'cover' | 'fill';
  sourceFitModes?: Record<string, 'contain' | 'cover' | 'fill'>;
  overlays?: OverlayConfig[];
  className?: string;
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

export default function VideoCompositor({ 
  activeSources = [], 
  outputResolution = { width: 1920, height: 1080 },
  globalFitMode = 'contain',
  sourceFitModes = {},
  overlays = [],
  className = "" 
}: VideoCompositorProps) {
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

  // Fetch RSS articles when RSS overlay exists
  const hasRssOverlay = overlays.some(o => o.overlayType === 'rss');
  
  const { data: rssArticlesData } = useQuery<RssArticlesResponse>({
    queryKey: ['/api/rss-articles', { limit: 50 }],
    enabled: hasRssOverlay,
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

    // Format: "SOURCE: Headline • SOURCE: Headline • ..."
    const tickerItems = filteredArticles.map(article => {
      const sourceName = sourceNameMap.get(article.sourceId) || article.sourceId;
      const headline = article.title;
      
      if (overlay.rssShowSource) {
        return `${sourceName.toUpperCase()}: ${headline}`;
      } else {
        return headline;
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

        // Handle legacy position field or use y coordinate
        let yPosition = overlay.y || 0;
        if (overlay.position === 'bottom') {
          yPosition = canvas.height - overlay.height;
        } else if (overlay.position === 'top') {
          yPosition = 0;
        }
        
        ctx.globalAlpha = overlay.opacity !== undefined ? overlay.opacity : 1;

        if (overlay.overlayType === 'video') {
          const videoSrc = overlay.videoUrl;
          if (!videoSrc) {
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.9);
            ctx.fillRect(xPosition, yPosition, overlayWidth, overlay.height);
            ctx.fillStyle = overlay.textColor;
            ctx.font = `${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No video source', xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
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
            ctx.fillRect(xPosition, yPosition, overlayWidth, overlay.height);
          }

          if (video.readyState >= 2) {
            ctx.drawImage(video, xPosition, yPosition, overlayWidth, overlay.height);
          } else {
            ctx.fillStyle = overlay.textColor;
            ctx.font = `14px "${overlay.fontFamily}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading video...', xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
          }
        } else if (overlay.overlayType === 'metric') {
          ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.9);
          ctx.fillRect(xPosition, yPosition, overlayWidth, overlay.height);

          ctx.fillStyle = overlay.textColor;
          const fontWeight = overlay.isBold ? 'bold' : 'normal';
          const fontStyle = overlay.isItalic ? 'italic' : 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const metricType = overlay.metricType || 'default';
          const metricData = overlay.metricData;

          if (metricType === 'h2h-card' && metricData) {
            ctx.font = `bold ${overlay.fontSize + 2}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText('H2H STATS', xPosition + overlayWidth / 2, yPosition + 25);
            ctx.font = `${fontWeight} ${overlay.fontSize - 2}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`Wins: ${metricData.wins || 0}`, xPosition + overlayWidth / 2, yPosition + 60);
            ctx.fillText(`Draws: ${metricData.draws || 0}`, xPosition + overlayWidth / 2, yPosition + 90);
            ctx.fillText(`Losses: ${metricData.losses || 0}`, xPosition + overlayWidth / 2, yPosition + 120);
          } else if (metricType === 'form-guide' && metricData) {
            ctx.font = `bold ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText('RECENT FORM', xPosition + overlayWidth / 2, yPosition + 25);
            const form = metricData.form || 'WWDLL';
            ctx.font = `bold ${overlay.fontSize + 4}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(form, xPosition + overlayWidth / 2, yPosition + 70);
          } else if (metricType === 'player-stats' && metricData) {
            ctx.font = `bold ${overlay.fontSize + 2}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(metricData.playerName || 'Player', xPosition + overlayWidth / 2, yPosition + 25);
            ctx.font = `${fontWeight} ${overlay.fontSize - 2}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`Goals/90: ${metricData.goalsPerGame || 0}`, xPosition + overlayWidth / 2, yPosition + 60);
            ctx.fillText(`Assists: ${metricData.assists || 0}`, xPosition + overlayWidth / 2, yPosition + 95);
            ctx.fillText(`Rating: ${metricData.rating || 0}`, xPosition + overlayWidth / 2, yPosition + 130);
          } else if (metricType === 'league-table' && metricData) {
            ctx.font = `bold ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText('LEAGUE POSITION', xPosition + overlayWidth / 2, yPosition + 25);
            ctx.font = `bold ${overlay.fontSize + 8}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`#${metricData.position || '?'}`, xPosition + overlayWidth / 2, yPosition + 80);
            ctx.font = `${fontWeight} ${overlay.fontSize - 4}px "${overlay.fontFamily}", sans-serif`;
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
              
              ctx.fillText(metricsText, xPosition + scrollX, yPosition + overlay.height / 2);
              const x2 = overlay.scrollDirection === 'left'
                ? scrollX + textWidth + 100
                : scrollX - textWidth - 100;
              ctx.fillText(metricsText, xPosition + x2, yPosition + overlay.height / 2);
              scrollPositions.current.set(overlay.id, scrollX);
            } else {
              ctx.fillText(metricsText, xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
            }
          } else if (metricType === 'live-score' && metricData) {
            ctx.font = `bold ${overlay.fontSize + 8}px "${overlay.fontFamily}", sans-serif`;
            ctx.fillText(`${metricData.homeScore || 0} - ${metricData.awayScore || 0}`, 
              xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
          } else {
            ctx.fillText(overlay.text || 'Metric Display', xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
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

          const overlayHeight = overlay.height;
          
          const imgAspect = img.width / img.height;
          const overlayAspect = overlayWidth / overlayHeight;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspect > overlayAspect) {
            drawWidth = overlayWidth;
            drawHeight = overlayWidth / imgAspect;
            drawX = xPosition;
            drawY = (overlayHeight - drawHeight) / 2;
          } else {
            drawHeight = overlayHeight;
            drawWidth = overlayHeight * imgAspect;
            drawX = xPosition + (overlayWidth - drawWidth) / 2;
            drawY = 0;
          }

          if (overlay.backgroundColor) {
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.95);
            ctx.fillRect(xPosition, yPosition, overlayWidth, overlayHeight);
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
          if (!rssArticles || rssArticles.length === 0) {
            // Show loading or no data message
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.95);
            ctx.fillRect(xPosition, yPosition, overlayWidth, overlay.height);
            
            ctx.fillStyle = overlay.textColor;
            ctx.font = `bold ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const loadingMsg = rssSources ? 'No recent headlines available' : 'Loading RSS feed...';
            ctx.fillText(loadingMsg, xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
            ctx.globalAlpha = 1;
            return;
          }

          // Build ticker text from RSS articles
          const tickerText = formatRssTicker(overlay, rssArticles);
          
          if (!tickerText || tickerText === 'No RSS sources selected' || tickerText === 'No recent headlines available') {
            // Show message
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.95);
            ctx.fillRect(xPosition, yPosition, overlayWidth, overlay.height);
            
            ctx.fillStyle = overlay.textColor;
            ctx.font = `bold ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tickerText, xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
            ctx.globalAlpha = 1;
            return;
          }

          // Render background
          ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.95);
          ctx.fillRect(xPosition, yPosition, overlayWidth, overlay.height);

          // Render scrolling ticker text
          const fontWeight = overlay.isBold ? 'bold' : 'normal';
          const fontStyle = overlay.isItalic ? 'italic' : 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`;
          ctx.fillStyle = overlay.textColor;
          ctx.textBaseline = 'middle';

          // Use existing scroll animation logic
          if (overlay.animationType === 'scroll') {
            const scrollSpeed = overlay.scrollSpeed / 10;
            const isVertical = overlay.scrollDirection === 'up' || overlay.scrollDirection === 'down';
            
            if (isVertical) {
              let scrollY = scrollPositions.current.get(overlay.id);
              if (scrollY === undefined) {
                scrollY = overlay.scrollDirection === 'down' ? -overlay.height : canvas.height;
              }
              
              ctx.textAlign = 'center';
              ctx.fillText(tickerText, xPosition + overlayWidth / 2, scrollY + overlay.height / 2);
              
              const textHeight = overlay.fontSize * 1.2;
              if (overlay.scrollDirection === 'up') {
                scrollY -= scrollSpeed;
                if (scrollY < -textHeight - 50) {
                  scrollY = canvas.height;
                }
              } else {
                scrollY += scrollSpeed;
                if (scrollY > canvas.height + 50) {
                  scrollY = -overlay.height;
                }
              }
              
              scrollPositions.current.set(overlay.id, scrollY);
            } else {
              // Horizontal scrolling - seamless loop
              let scrollX = scrollPositions.current.get(overlay.id);
              if (scrollX === undefined) {
                scrollX = overlayWidth;
              }
              
              ctx.textAlign = 'left';
              const textWidth = ctx.measureText(tickerText).width;
              
              if (overlay.scrollDirection === 'left') {
                scrollX -= scrollSpeed;
                if (scrollX < -textWidth - 100) {
                  scrollX = overlayWidth;
                }
              } else {
                scrollX += scrollSpeed;
                if (scrollX > overlayWidth + 100) {
                  scrollX = -textWidth;
                }
              }
              
              // Draw main text
              ctx.fillText(tickerText, xPosition + scrollX, yPosition + overlay.height / 2);
              
              // Draw duplicate for seamless loop
              const x2 = overlay.scrollDirection === 'left'
                ? scrollX + textWidth + 100
                : scrollX - textWidth - 100;
              ctx.fillText(tickerText, xPosition + x2, yPosition + overlay.height / 2);
              
              scrollPositions.current.set(overlay.id, scrollX);
            }
          } else if (overlay.animationType === 'fade') {
            let fadeTime = fadeStates.current.get(overlay.id) || 0;
            fadeTime += 0.02;
            
            const opacity = (Math.sin(fadeTime) + 1) / 2;
            const baseOpacity = overlay.opacity !== undefined ? overlay.opacity : 1;
            ctx.globalAlpha = opacity * 0.5 * baseOpacity + 0.5 * baseOpacity;
            
            ctx.textAlign = 'center';
            ctx.fillText(tickerText, xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
            ctx.globalAlpha = baseOpacity;
            
            fadeStates.current.set(overlay.id, fadeTime);
          } else {
            // Static display
            ctx.textAlign = 'center';
            ctx.fillText(tickerText, xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
          }
        } else if (overlay.overlayType === 'text') {
          // Text Overlay
          ctx.fillStyle = hexToRgba(overlay.backgroundColor, overlay.opacity || 0.95);
          ctx.fillRect(xPosition, yPosition, overlayWidth, overlay.height);

          ctx.fillStyle = overlay.textColor;
          const fontWeight = overlay.isBold ? 'bold' : 'normal';
          const fontStyle = overlay.isItalic ? 'italic' : 'normal';
          ctx.font = `${fontStyle} ${fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`;
          ctx.textBaseline = 'middle';

          if (overlay.animationType === 'scroll') {
            const scrollSpeed = overlay.scrollSpeed / 10;
            const isVertical = overlay.scrollDirection === 'up' || overlay.scrollDirection === 'down';
            
            if (isVertical) {
              let scrollY = scrollPositions.current.get(overlay.id);
              if (scrollY === undefined) {
                scrollY = overlay.scrollDirection === 'down' ? -overlay.height : canvas.height;
              }
              
              ctx.textAlign = 'center';
              ctx.fillText(overlay.text, xPosition + overlayWidth / 2, scrollY + overlay.height / 2);
              
              const textHeight = overlay.fontSize * 1.2;
              if (overlay.scrollDirection === 'up') {
                scrollY -= scrollSpeed;
                if (scrollY < -textHeight - 50) {
                  scrollY = canvas.height;
                }
              } else {
                scrollY += scrollSpeed;
                if (scrollY > canvas.height + 50) {
                  scrollY = -overlay.height;
                }
              }
              
              scrollPositions.current.set(overlay.id, scrollY);
            } else {
              let scrollX = scrollPositions.current.get(overlay.id);
              if (scrollX === undefined) {
                scrollX = overlay.scrollDirection === 'right' ? -overlayWidth : overlayWidth;
              }
              
              ctx.textAlign = 'left';
              ctx.fillText(overlay.text, xPosition + scrollX, yPosition + overlay.height / 2);
              
              const textWidth = ctx.measureText(overlay.text).width;
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
            ctx.fillText(overlay.text, xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
            ctx.globalAlpha = baseOpacity;
            
            fadeStates.current.set(overlay.id, fadeTime);
          } else {
            ctx.textAlign = 'center';
            ctx.fillText(overlay.text, xPosition + overlayWidth / 2, yPosition + overlay.height / 2);
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

  const renderMetricOverlay = (overlay: OverlayConfig) => {
    const { metricType, metricData, width, height, opacity, x, y } = overlay;

    const style: React.CSSProperties = {
      position: 'absolute',
      width: `${width}%`,
      height: `${height}px`,
      left: `${x}px`,
      top: `${y}px`,
      zIndex: overlay.zIndex || 100,
      pointerEvents: 'none',
    };

    switch (metricType) {
      case 'h2h-card':
        return (
          <div key={overlay.id} style={style}>
            <H2HMatchCardOverlay
              homeTeamId={metricData?.homeTeamId || 40}
              awayTeamId={metricData?.awayTeamId || 47}
              width={100}
              height={height}
              opacity={opacity}
            />
          </div>
        );
      case 'form-guide':
        return (
          <div key={overlay.id} style={style}>
            <FormGuideOverlay
              width={100}
              height={height}
              opacity={opacity}
              layout={metricData?.layout || 'horizontal'}
              teamId={metricData?.teamId || 40}
            />
          </div>
        );
      case 'player-stats':
        return (
          <div key={overlay.id} style={style}>
            <PlayerStatsOverlay
              playerId={metricData?.playerId || 1}
              width={100}
              height={height}
              opacity={opacity}
            />
          </div>
        );
      case 'league-table':
        return (
          <div key={overlay.id} style={style}>
            <LeaguePositionOverlay
              width={100}
              height={height}
              opacity={opacity}
            />
          </div>
        );
      case 'rss-sentiment':
        return (
          <div key={overlay.id} style={style}>
            <RssSentimentOverlay
              width={100}
              height={height}
              opacity={opacity}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const metricOverlays = overlays.filter(o => 
    o.visible && 
    o.overlayType === 'metric' && 
    ['h2h-card', 'form-guide', 'player-stats', 'league-table', 'rss-sentiment'].includes(o.metricType || '')
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
}
