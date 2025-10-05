import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCameraStreams } from "@/contexts/CameraStreamContext";

interface VideoSource {
  id: string;
  name: string;
  sourceType: string;
  deviceId?: string;
  streamUrl?: string;
  isActive: boolean;
  isConnected: boolean;
}

interface SceneElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'graphic' | 'ticker';
  zone: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  sourceId?: string;
}

interface RssArticle {
  id: string;
  title: string;
  sourceId: string;
  publishedAt: string;
}

interface RssSource {
  id: string;
  name: string;
}

interface Scene {
  id: string;
  name: string;
  description: string;
  layout: string;
  elements: SceneElement[];
}

interface VideoCompositorProps {
  sceneId: string | null;
  className?: string;
}

export default function VideoCompositor({ sceneId, className = "" }: VideoCompositorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const animationFrameRef = useRef<number>();
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const { getStream, hasStream } = useCameraStreams();

  const { data: sceneData } = useQuery<{ scene: Scene }>({
    queryKey: [`/api/presentation/scenes/${sceneId}`],
    enabled: !!sceneId,
  });

  const scene = sceneData?.scene;

  const { data: videoSourcesData } = useQuery<{ videoSources: VideoSource[] }>({
    queryKey: ['/api/video-sources'],
  });

  const videoSources = videoSourcesData?.videoSources;

  const [mediaStreams, setMediaStreams] = useState<Map<string, MediaStream>>(new Map());
  const tickerScrollOffset = useRef<number>(0);

  // Fetch RSS articles for ticker
  const { data: rssData } = useQuery<{ articles: RssArticle[], sources: RssSource[] }>({
    queryKey: ['/api/rss-articles?limit=20'],
    refetchInterval: 60000, // Refetch every minute
  });

  // Initialize video elements for camera sources using global camera manager
  useEffect(() => {
    if (!videoSources) return;

    const initializeStreams = async () => {
      const newStreams = new Map<string, MediaStream>();

      for (const source of videoSources) {
        if (source.sourceType === 'camera' && source.deviceId && source.isActive && source.isConnected) {
          try {
            const stream = await getStream(source.id, source.deviceId);
            newStreams.set(source.id, stream);
          } catch (err) {
            console.error(`Failed to get camera stream for ${source.name}:`, err);
          }
        }
      }

      setMediaStreams(newStreams);
    };

    initializeStreams();

    // Note: We don't cleanup streams here because they're managed globally
    // This allows cameras to persist when switching tabs
  }, [videoSources, getStream]);

  // Create video elements from streams
  useEffect(() => {
    mediaStreams.forEach((stream, sourceId) => {
      let video = videoRefs.current.get(sourceId);
      if (!video) {
        video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        videoRefs.current.set(sourceId, video);
      }
      video.srcObject = stream;
    });
  }, [mediaStreams]);

  // Render composite scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (!sceneId) {
      // No scene selected - draw once and don't start loop
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No scene selected', canvas.width / 2, canvas.height / 2);
      return;
    }

    const render = () => {
      // Clear canvas with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!scene) {
        // Scene loading
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading scene...', canvas.width / 2, canvas.height / 2);
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      if (!scene.elements || scene.elements.length === 0) {
        // Show "No Content" message
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No layers configured', canvas.width / 2, canvas.height / 2);
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Sort elements by zone with explicit z-ordering
      const zOrder: Record<string, number> = { 
        background: 0, 
        main: 1, 
        overlay: 2, 
        foreground: 3 
      };
      const sortedElements = [...scene.elements].sort((a, b) => {
        const aOrder = zOrder[a.zone] ?? 1; // Default to main layer
        const bOrder = zOrder[b.zone] ?? 1;
        return aOrder - bOrder;
      });

      // Render each element
      sortedElements.forEach((element: SceneElement) => {
        const x = (element.position.x / 100) * canvas.width;
        const y = (element.position.y / 100) * canvas.height;
        const width = (element.position.width / 100) * canvas.width;
        const height = (element.position.height / 100) * canvas.height;

        if (element.type === 'video') {
          if (!element.sourceId) {
            // No source configured
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(x, y, width, height);
            ctx.fillStyle = '#9ca3af';
            ctx.font = `${Math.floor(height * 0.15)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No source configured', x + width / 2, y + height / 2);
            ctx.fillText('Edit scene to assign source', x + width / 2, y + height / 2 + Math.floor(height * 0.15) + 4);
          } else {
            const video = videoRefs.current.get(element.sourceId);
            const source = videoSources?.find(s => s.id === element.sourceId);
            if (video && video.readyState >= 2) {
              ctx.drawImage(video, x, y, width, height);
            } else {
              // Placeholder for video not ready
              ctx.fillStyle = '#1f2937';
              ctx.fillRect(x, y, width, height);
              ctx.strokeStyle = '#374151';
              ctx.strokeRect(x, y, width, height);
              // Show status message
              ctx.fillStyle = '#9ca3af';
              ctx.font = `${Math.floor(height * 0.12)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              if (!source) {
                ctx.fillText('Source not found', x + width / 2, y + height / 2);
              } else if (!source.isConnected) {
                ctx.fillText(`${source.name} (Not connected)`, x + width / 2, y + height / 2);
                ctx.fillText('Connect source to see video', x + width / 2, y + height / 2 + Math.floor(height * 0.12) + 4);
              } else if (!source.isActive) {
                ctx.fillText(`${source.name} (Not active)`, x + width / 2, y + height / 2);
              } else {
                ctx.fillText(`${source.name} (Loading...)`, x + width / 2, y + height / 2);
              }
            }
          }
        } else if (element.type === 'text' && element.content) {
          // Render text overlay
          ctx.fillStyle = '#ffffff';
          ctx.font = `${Math.floor(height * 0.6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(element.content, x + width / 2, y + height / 2);
        } else if (element.type === 'image' && element.content) {
          // Render image from URL
          let img = imageCache.current.get(element.content);
          if (!img) {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = element.content;
            imageCache.current.set(element.content, img);
          }
          if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x, y, width, height);
          } else {
            // Placeholder while loading
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '#34d399';
            ctx.strokeRect(x, y, width, height);
          }
        } else if (element.type === 'graphic') {
          // Render graphic placeholder (could be enhanced with actual graphic rendering)
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(x, y, width, height);
          ctx.strokeStyle = '#60a5fa';
          ctx.strokeRect(x, y, width, height);
        } else if (element.type === 'ticker') {
          // Render scrolling RSS ticker with Liverpool FC branding
          // Background: Liverpool red #C8102E
          ctx.fillStyle = '#C8102E';
          ctx.fillRect(x, y, width, height);

          if (rssData && rssData.articles && rssData.articles.length > 0) {
            // Build ticker text from articles
            const sourcesMap = new Map(rssData.sources?.map(s => [s.id, s.name]) || []);
            const tickerItems = rssData.articles.map(article => {
              const sourceName = sourcesMap.get(article.sourceId) || 'LFC News';
              return `${sourceName}: ${article.title}`;
            });
            const tickerText = tickerItems.join('  •  ') + '  •  ';

            // Set font and measure text
            const fontSize = Math.floor(height * 0.5);
            ctx.font = `bold ${fontSize}px sans-serif`;
            const textWidth = ctx.measureText(tickerText).width;

            // Update scroll position (2 pixels per frame for smooth scrolling)
            tickerScrollOffset.current += 2;
            if (tickerScrollOffset.current > textWidth) {
              tickerScrollOffset.current = 0;
            }

            // Save context for clipping
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            // Draw text with Liverpool navy color #1B365D
            ctx.fillStyle = '#1B365D';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // Draw two copies for seamless looping
            const xPos1 = x + width - tickerScrollOffset.current;
            const xPos2 = xPos1 + textWidth;
            
            ctx.fillText(tickerText, xPos1, y + height / 2);
            ctx.fillText(tickerText, xPos2, y + height / 2);

            // Restore context
            ctx.restore();
          } else {
            // Loading or no articles
            ctx.fillStyle = '#1B365D';
            ctx.font = `bold ${Math.floor(height * 0.5)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading Liverpool FC News...', x + width / 2, y + height / 2);
          }
        }

        // Debug: Draw zone label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, 80, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${element.zone}`, x + 4, y + 14);
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [sceneId, scene, mediaStreams, rssData]);

  if (!sceneId) {
    return (
      <div className={`bg-black flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground text-sm">No scene selected</p>
      </div>
    );
  }

  return (
    <div className={`bg-black ${className}`}>
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-full object-contain"
        data-testid="canvas-video-compositor"
      />
    </div>
  );
}
