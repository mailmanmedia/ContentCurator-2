import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft, Scissors } from "lucide-react";
import { useState } from "react";
import type { VideoClip } from "@shared/schema";

interface TransitionsPanelProps {
  clip: VideoClip | null;
  onUpdate: (updates: Partial<VideoClip>) => void;
}

export default function TransitionsPanel({ clip, onUpdate }: TransitionsPanelProps) {
  const [transition, setTransition] = useState(clip?.transition || "cut");
  const [duration, setDuration] = useState([clip?.transitionDuration || 500]);

  const handleTransitionChange = (value: string) => {
    setTransition(value);
    onUpdate({ transition: value });
  };

  const handleDurationChange = (value: number[]) => {
    setDuration(value);
    onUpdate({ transitionDuration: value[0] });
  };

  if (!clip) {
    return (
      <Card data-testid="transitions-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Transitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a clip to add transitions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="transitions-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          Transitions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Transition Type</Label>
          <Select value={transition} onValueChange={handleTransitionChange}>
            <SelectTrigger data-testid="select-transition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cut">Cut (No Transition)</SelectItem>
              <SelectItem value="fade">Fade to Black</SelectItem>
              <SelectItem value="dissolve">Dissolve (Cross-fade)</SelectItem>
              <SelectItem value="wipe">Wipe</SelectItem>
              <SelectItem value="slide_left">Slide Left</SelectItem>
              <SelectItem value="slide_right">Slide Right</SelectItem>
              <SelectItem value="slide_up">Slide Up</SelectItem>
              <SelectItem value="slide_down">Slide Down</SelectItem>
              <SelectItem value="zoom_in">Zoom In</SelectItem>
              <SelectItem value="zoom_out">Zoom Out</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {transition !== "cut" && (
          <div className="space-y-2">
            <Label>Duration: {duration[0]}ms</Label>
            <Slider
              value={duration}
              onValueChange={handleDurationChange}
              min={100}
              max={2000}
              step={100}
              data-testid="slider-transition-duration"
            />
            <p className="text-xs text-muted-foreground">
              Transition will be applied when this clip starts
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransitionChange("dissolve")}
            data-testid="button-quick-dissolve"
          >
            Quick Dissolve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransitionChange("fade")}
            data-testid="button-quick-fade"
          >
            Quick Fade
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Preview Transition</h4>
          <div className="text-xs text-muted-foreground">
            {transition === "cut" && "Instant cut to next clip"}
            {transition === "fade" && "Fade to black then fade in next clip"}
            {transition === "dissolve" && "Smooth blend between clips"}
            {transition === "wipe" && "Wipe effect revealing next clip"}
            {transition?.includes("slide") && "Slide transition effect"}
            {transition?.includes("zoom") && "Zoom transition effect"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
