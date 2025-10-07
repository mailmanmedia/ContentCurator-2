import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Scissors, Trash2 } from "lucide-react";
import type { VideoClip } from "@shared/schema";

interface TimelineEditorProps {
  clips: VideoClip[];
  currentTime: number;
  onTimeChange: (time: number) => void;
  onClipUpdate: (clipId: string, updates: Partial<VideoClip>) => void;
  onClipDelete: (clipId: string) => void;
  onSplitClip: (clipId: string, atTime: number) => void;
}

export default function TimelineEditor({
  clips,
  currentTime,
  onTimeChange,
  onClipUpdate,
  onClipDelete,
  onSplitClip
}: TimelineEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);

  const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
  
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * totalDuration;
    onTimeChange(newTime);
  };

  const handleClipDragStart = (clipId: string) => {
    setDraggedClipId(clipId);
  };

  const handleClipDrop = (targetClipId: string) => {
    if (!draggedClipId || draggedClipId === targetClipId) return;
    
    const draggedIndex = clips.findIndex(c => c.id === draggedClipId);
    const targetIndex = clips.findIndex(c => c.id === targetClipId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      onClipUpdate(draggedClipId, { order: targetIndex });
      onClipUpdate(targetClipId, { order: draggedIndex });
    }
    
    setDraggedClipId(null);
  };

  return (
    <Card data-testid="timeline-editor">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="outline"
              onClick={() => onTimeChange(Math.max(0, currentTime - 5000))}
              data-testid="button-skip-back"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button 
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button 
              size="icon" 
              variant="outline"
              onClick={() => onTimeChange(Math.min(totalDuration, currentTime + 5000))}
              data-testid="button-skip-forward"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm font-mono" data-testid="text-current-time">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>

        <div 
          className="relative h-16 bg-muted rounded cursor-pointer"
          onClick={handleTimelineClick}
          data-testid="timeline-track"
        >
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          />
          
          {clips.map((clip) => {
            const startPos = clips
              .filter(c => c.order < clip.order)
              .reduce((sum, c) => sum + c.duration, 0);
            const widthPercent = (clip.duration / totalDuration) * 100;
            const leftPercent = (startPos / totalDuration) * 100;

            return (
              <div
                key={clip.id}
                className="absolute top-2 bottom-2 bg-primary/20 border border-primary rounded cursor-move hover-elevate"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`
                }}
                draggable
                onDragStart={() => handleClipDragStart(clip.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleClipDrop(clip.id)}
                data-testid={`clip-${clip.id}`}
              >
                <div className="px-2 py-1 text-xs truncate">
                  Clip {clip.order + 1}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Clips</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {clips.map((clip) => (
              <div 
                key={clip.id}
                className="flex items-center justify-between p-2 bg-muted rounded"
                data-testid={`clip-row-${clip.id}`}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">Clip {clip.order + 1}</div>
                  <div className="text-xs text-muted-foreground">
                    Duration: {formatTime(clip.duration)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => onSplitClip(clip.id, clip.startTime + clip.duration / 2)}
                    data-testid={`button-split-${clip.id}`}
                  >
                    <Scissors className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => onClipDelete(clip.id)}
                    data-testid={`button-delete-clip-${clip.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
