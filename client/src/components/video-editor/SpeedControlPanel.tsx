import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Gauge, FastForward, Rewind } from "lucide-react";
import { useState } from "react";
import type { VideoClip } from "@shared/schema";

interface SpeedControlPanelProps {
  clip: VideoClip | null;
  onUpdate: (updates: Partial<VideoClip>) => void;
}

export default function SpeedControlPanel({ clip, onUpdate }: SpeedControlPanelProps) {
  const [speed, setSpeed] = useState([clip?.speed || 100]);

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value);
    onUpdate({ speed: value[0] });
  };

  const presetSpeed = (speedValue: number) => {
    setSpeed([speedValue]);
    onUpdate({ speed: speedValue });
  };

  const getSpeedLabel = (speedValue: number) => {
    if (speedValue === 100) return "Normal (1.0x)";
    if (speedValue < 100) return `Slow Motion (${(speedValue / 100).toFixed(2)}x)`;
    return `Time-lapse (${(speedValue / 100).toFixed(2)}x)`;
  };

  if (!clip) {
    return (
      <Card data-testid="speed-control-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Speed Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a clip to adjust speed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="speed-control-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Speed Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{getSpeedLabel(speed[0])}</Label>
          <Slider
            value={speed}
            onValueChange={handleSpeedChange}
            min={25}
            max={400}
            step={25}
            data-testid="slider-speed"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.25x</span>
            <span>1x</span>
            <span>4x</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => presetSpeed(50)}
            data-testid="button-half-speed"
          >
            <Rewind className="w-4 h-4 mr-2" />
            Half Speed
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => presetSpeed(100)}
            data-testid="button-normal-speed"
          >
            Normal
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => presetSpeed(200)}
            data-testid="button-double-speed"
          >
            <FastForward className="w-4 h-4 mr-2" />
            Double Speed
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => presetSpeed(300)}
            data-testid="button-triple-speed"
          >
            Triple Speed
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Popular Use Cases</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div><strong>0.25x-0.5x:</strong> Dramatic slow motion for key moments</div>
            <div><strong>0.75x:</strong> Subtle slow motion for goals/celebrations</div>
            <div><strong>1.5x-2x:</strong> Quick replays or montages</div>
            <div><strong>3x-4x:</strong> Time-lapse for build-up sequences</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          ⚠️ Audio pitch will be maintained for speeds between 0.5x-2x. 
          Extreme speeds may have audio artifacts.
        </p>
      </CardContent>
    </Card>
  );
}
