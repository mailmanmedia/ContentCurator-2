import { useEffect, useRef } from "react";

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
  overlayType: 'text' | 'image' | 'rss';
  imageUrl?: string;
  imageData?: string;
  rssSourceIds?: string[];
  rssMaxArticles?: number;
  rssShowSource?: boolean;
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
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const animationFrameRef = useRef<number>();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const fadeStates = useRef<Map<string, number>>(new Map());

  const drawVideoWithAspectRatio = (
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
  };

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

      overlays.forEach(overlay => {
        if (!overlay.visible) return;

        const yPosition = overlay.position === 'top' ? 0 : canvas.height - overlay.height;

        if (overlay.overlayType === 'image') {
          const imageSrc = overlay.imageData || overlay.imageUrl;
          if (!imageSrc) return;

          let img = loadedImages.current.get(imageSrc);
          
          if (!img) {
            loadImage(imageSrc)
              .then(loadedImg => {
                loadedImages.current.set(imageSrc, loadedImg);
              })
              .catch(error => {
                console.error('Failed to load overlay image:', error);
              });
            return;
          }

          const overlayWidth = canvas.width;
          const overlayHeight = overlay.height;
          
          const imgAspect = img.width / img.height;
          const overlayAspect = overlayWidth / overlayHeight;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspect > overlayAspect) {
            drawWidth = overlayWidth;
            drawHeight = overlayWidth / imgAspect;
            drawX = 0;
            drawY = (overlayHeight - drawHeight) / 2;
          } else {
            drawHeight = overlayHeight;
            drawWidth = overlayHeight * imgAspect;
            drawX = (overlayWidth - drawWidth) / 2;
            drawY = 0;
          }

          if (overlay.backgroundColor) {
            ctx.fillStyle = hexToRgba(overlay.backgroundColor, 0.95);
            ctx.fillRect(0, yPosition, overlayWidth, overlayHeight);
          }

          ctx.drawImage(
            img,
            drawX,
            yPosition + drawY,
            drawWidth,
            drawHeight
          );
        } else {
          ctx.fillStyle = hexToRgba(overlay.backgroundColor, 0.95);
          ctx.fillRect(0, yPosition, canvas.width, overlay.height);

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
              ctx.fillText(overlay.text, canvas.width / 2, scrollY + overlay.height / 2);
              
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
                scrollX = overlay.scrollDirection === 'right' ? -canvas.width : canvas.width;
              }
              
              ctx.textAlign = 'left';
              ctx.fillText(overlay.text, scrollX, yPosition + overlay.height / 2);
              
              const textWidth = ctx.measureText(overlay.text).width;
              if (overlay.scrollDirection === 'left') {
                scrollX -= scrollSpeed;
                if (scrollX < -textWidth - 50) {
                  scrollX = canvas.width;
                }
              } else {
                scrollX += scrollSpeed;
                if (scrollX > canvas.width + 50) {
                  scrollX = -textWidth;
                }
              }
              
              scrollPositions.current.set(overlay.id, scrollX);
            }
          } else if (overlay.animationType === 'fade') {
            let fadeTime = fadeStates.current.get(overlay.id) || 0;
            fadeTime += 0.02;
            
            const opacity = (Math.sin(fadeTime) + 1) / 2;
            ctx.globalAlpha = opacity * 0.5 + 0.5;
            
            ctx.textAlign = 'center';
            ctx.fillText(overlay.text, canvas.width / 2, yPosition + overlay.height / 2);
            ctx.globalAlpha = 1;
            
            fadeStates.current.set(overlay.id, fadeTime);
          } else {
            ctx.textAlign = 'center';
            ctx.fillText(overlay.text, canvas.width / 2, yPosition + overlay.height / 2);
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeSources, overlays, outputResolution, globalFitMode, sourceFitModes]);

  return (
    <div className={`bg-black ${className}`}>
      <canvas
        ref={canvasRef}
        width={outputResolution.width}
        height={outputResolution.height}
        className="w-full h-full object-contain"
        data-testid="canvas-video-compositor"
      />
    </div>
  );
}
