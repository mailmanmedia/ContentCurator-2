import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Trash2 } from "lucide-react";
import type { VideoClip } from "@shared/schema";

interface ClipPropertiesProps {
  clip: VideoClip | null;
  onUpdate: (updates: Partial<VideoClip>) => void;
  onDelete: () => void;
}

export default function ClipProperties({ clip, onUpdate, onDelete }: ClipPropertiesProps) {
  if (!clip) {
    return (
      <Card data-testid="clip-properties">
        <CardHeader>
          <CardTitle>Clip Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a clip to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card data-testid="clip-properties">
      <CardHeader>
        <CardTitle>Clip {clip.order + 1} Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Duration</Label>
          <div className="text-sm text-muted-foreground" data-testid="text-clip-duration">
            {formatTime(clip.duration)}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trim-start">Trim Start (ms)</Label>
          <Input
            id="trim-start"
            type="number"
            value={clip.trimStart}
            onChange={(e) => onUpdate({ trimStart: parseInt(e.target.value) || 0 })}
            data-testid="input-trim-start"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trim-end">Trim End (ms)</Label>
          <Input
            id="trim-end"
            type="number"
            value={clip.trimEnd}
            onChange={(e) => onUpdate({ trimEnd: parseInt(e.target.value) || 0 })}
            data-testid="input-trim-end"
          />
        </div>

        <div className="space-y-2">
          <Label>Color Adjustments</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Brightness</Label>
              <Slider
                defaultValue={[0]}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-brightness"
              />
            </div>
            <div>
              <Label className="text-xs">Contrast</Label>
              <Slider
                defaultValue={[0]}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-contrast"
              />
            </div>
            <div>
              <Label className="text-xs">Saturation</Label>
              <Slider
                defaultValue={[0]}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-saturation"
              />
            </div>
          </div>
        </div>

        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={onDelete}
          data-testid="button-delete-clip"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Clip
        </Button>
      </CardContent>
    </Card>
  );
}
