import { useEffect, useRef } from "react";

interface ActiveSource {
  id: string;
  name: string;
  type: 'camera' | 'screen' | 'overlay';
  deviceId?: string;
  deviceLabel?: string;
  stream?: MediaStream;
  overlayConfig?: {
    text: string;
    animation: 'scroll' | 'fade' | 'pulse';
    template: 'ticker' | 'banner' | 'corner';
  };
}

interface VideoCompositorProps {
  activeSources?: ActiveSource[];
  className?: string;
}

export default function VideoCompositor({ activeSources = [], className = "" }: VideoCompositorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const animationFrameRef = useRef<number>();

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

    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (activeSources.length === 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No active sources', canvas.width / 2, canvas.height / 2);
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

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
          ctx.drawImage(video, x, y, width, height);
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

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeSources]);

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
