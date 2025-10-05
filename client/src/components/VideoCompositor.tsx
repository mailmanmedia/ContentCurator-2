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

interface VideoCompositorProps {
  activeSources?: string[];
  sceneId?: string | null;
  className?: string;
}

export default function VideoCompositor({ activeSources, sceneId, className = "" }: VideoCompositorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const animationFrameRef = useRef<number>();
  const { acquireStream, acquireScreenShare, releaseStream } = useCameraStreams();

  const { data: videoSourcesData } = useQuery<{ videoSources: VideoSource[] }>({
    queryKey: ['/api/video-sources'],
  });

  const videoSources = videoSourcesData?.videoSources;

  const [mediaStreams, setMediaStreams] = useState<Map<string, MediaStream>>(new Map());
  const streamsRefMap = useRef<Map<string, MediaStream>>(new Map());

  // Initialize video elements for camera and screen sources
  useEffect(() => {
    if (!videoSources) return;

    const initializeStreams = async () => {
      const neededSourceIds = new Set<string>();
      
      // If activeSources prop is provided, use it; otherwise fall back to isActive flag
      const targetSources = activeSources 
        ? videoSources.filter(s => activeSources.includes(s.id))
        : videoSources.filter(s => s.isActive);
      
      // Identify which sources we need
      for (const source of targetSources) {
        if ((source.sourceType === 'camera' || source.sourceType === 'screen') && source.isConnected) {
          neededSourceIds.add(source.id);
        }
      }

      // Release streams we no longer need
      for (const [sourceId] of Array.from(streamsRefMap.current.entries())) {
        if (!neededSourceIds.has(sourceId)) {
          releaseStream(sourceId);
          streamsRefMap.current.delete(sourceId);
        }
      }

      // Acquire new streams we don't have yet
      for (const source of targetSources) {
        if (source.isConnected && !streamsRefMap.current.has(source.id)) {
          try {
            if (source.sourceType === 'camera' && source.deviceId) {
              const stream = await acquireStream(source.id, source.deviceId);
              streamsRefMap.current.set(source.id, stream);
            } else if (source.sourceType === 'screen') {
              const stream = await acquireScreenShare(source.id);
              streamsRefMap.current.set(source.id, stream);
            }
          } catch (err) {
            console.error(`Failed to get stream for ${source.name}:`, err);
          }
        }
      }

      // Update state with current streams
      setMediaStreams(new Map(streamsRefMap.current));
    };

    initializeStreams();
  }, [videoSources, activeSources, acquireStream, acquireScreenShare, releaseStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamsRefMap.current.forEach((stream, sourceId) => {
        releaseStream(sourceId);
      });
      streamsRefMap.current.clear();
    };
  }, [releaseStream]);

  // Create video elements from streams
  useEffect(() => {
    mediaStreams.forEach((stream, sourceId) => {
      let video = videoRefs.current.get(sourceId);
      if (!video) {
        video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        videoRefs.current.set(sourceId, video);
      }
      video.srcObject = stream;
      
      video.play().catch(err => {
        console.error(`Failed to play video for source ${sourceId}:`, err);
      });
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

    // If activeSources prop is provided, use simplified rendering mode
    if (activeSources !== undefined) {
      const render = () => {
        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!videoSources || activeSources.length === 0) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('No active sources', canvas.width / 2, canvas.height / 2);
          animationFrameRef.current = requestAnimationFrame(render);
          return;
        }

        // Get active sources
        const activeSourceObjects = activeSources
          .map(id => videoSources?.find(s => s.id === id))
          .filter(Boolean) as VideoSource[];

        if (activeSourceObjects.length === 0) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('No active sources', canvas.width / 2, canvas.height / 2);
          animationFrameRef.current = requestAnimationFrame(render);
          return;
        }

        // Calculate grid layout based on number of sources
        const count = activeSourceObjects.length;
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
        const padding = 4; // Small padding between cells

        // Render each active source in grid
        activeSourceObjects.forEach((source, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = col * cellWidth + padding;
          const y = row * cellHeight + padding;
          const width = cellWidth - padding * 2;
          const height = cellHeight - padding * 2;

          const video = videoRefs.current.get(source.id);
          
          if (video && video.readyState >= 2) {
            ctx.drawImage(video, x, y, width, height);
          } else {
            // Placeholder
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '#374151';
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = '#9ca3af';
            ctx.font = `${Math.floor(height * 0.08)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (!source.isConnected) {
              ctx.fillText(`${source.name}`, x + width / 2, y + height / 2 - 10);
              ctx.fillText('(Not connected)', x + width / 2, y + height / 2 + 10);
            } else {
              ctx.fillText(`${source.name}`, x + width / 2, y + height / 2 - 10);
              ctx.fillText('(Loading...)', x + width / 2, y + height / 2 + 10);
            }
          }

          // Draw source name label at bottom
          const labelHeight = 30;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x, y + height - labelHeight, width, labelHeight);
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(source.name, x + width / 2, y + height - labelHeight / 2);
        });

        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }

    // Original scene-based rendering (backward compatibility)
    // This code path is maintained for any other uses of VideoCompositor
    // that still rely on sceneId
    if (!sceneId) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No scene selected', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Scene-based rendering would go here but is not needed for this simplified view
  }, [activeSources, sceneId, mediaStreams, videoSources]);

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
