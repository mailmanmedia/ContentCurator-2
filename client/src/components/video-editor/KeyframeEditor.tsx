import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Keyframe } from "@shared/schema";

interface KeyframeEditorProps {
  clipId: string | null;
  clipDuration: number;
  currentTime: number;
}

export default function KeyframeEditor({ clipId, clipDuration, currentTime }: KeyframeEditorProps) {
  const { toast } = useToast();
  const [property, setProperty] = useState("zoom");
  const [value, setValue] = useState("");
  const [easing, setEasing] = useState("linear");

  const { data: keyframes } = useQuery<Keyframe[]>({
    queryKey: ['/api/video-clips', clipId, 'keyframes'],
    enabled: !!clipId,
  });

  const addKeyframeMutation = useMutation({
    mutationFn: async (keyframe: any) => {
      return apiRequest('POST', `/api/video-clips/${clipId}/keyframes`, keyframe);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-clips', clipId, 'keyframes'] });
      setValue("");
      toast({ title: "Success", description: "Keyframe added" });
    },
  });

  const deleteKeyframeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/video-clips/${clipId}/keyframes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-clips', clipId, 'keyframes'] });
      toast({ title: "Success", description: "Keyframe deleted" });
    },
  });

  const handleAddKeyframe = () => {
    if (!clipId || !value) return;
    
    addKeyframeMutation.mutate({
      property,
      time: currentTime,
      value,
      easing,
    });
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!clipId) {
    return (
      <Card data-testid="keyframe-editor">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Animation Keyframes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a clip to add keyframe animations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="keyframe-editor">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Animation Keyframes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Property</Label>
          <Select value={property} onValueChange={setProperty}>
            <SelectTrigger data-testid="select-keyframe-property">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zoom">Zoom (Scale)</SelectItem>
              <SelectItem value="pan_x">Pan Horizontal</SelectItem>
              <SelectItem value="pan_y">Pan Vertical</SelectItem>
              <SelectItem value="rotation">Rotation</SelectItem>
              <SelectItem value="opacity">Opacity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Value at {formatTime(currentTime)}</Label>
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              property === "zoom" ? "1.0 (normal)" :
              property.includes("pan") ? "0 (center)" :
              property === "rotation" ? "0 (degrees)" :
              "1.0 (fully visible)"
            }
            data-testid="input-keyframe-value"
          />
        </div>

        <div className="space-y-2">
          <Label>Easing</Label>
          <Select value={easing} onValueChange={setEasing}>
            <SelectTrigger data-testid="select-easing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="ease-in">Ease In</SelectItem>
              <SelectItem value="ease-out">Ease Out</SelectItem>
              <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={handleAddKeyframe}
          disabled={!value || addKeyframeMutation.isPending}
          data-testid="button-add-keyframe"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Keyframe at Current Time
        </Button>

        <div className="space-y-2">
          <Label>Keyframes ({keyframes?.length || 0})</Label>
          {keyframes && keyframes.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {keyframes.map((kf) => (
                <div
                  key={kf.id}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                  data-testid={`keyframe-${kf.id}`}
                >
                  <div>
                    <div className="font-medium">{kf.property}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(kf.time)} • {kf.value} • {kf.easing}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteKeyframeMutation.mutate(kf.id)}
                    data-testid={`button-delete-keyframe-${kf.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No keyframes yet. Add keyframes to animate properties over time.
            </p>
          )}
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Quick Tips</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div><strong>Zoom:</strong> 1.0 = normal, 1.5 = 150% zoom, 0.5 = zoomed out</div>
            <div><strong>Pan:</strong> 0 = center, positive = right/down, negative = left/up</div>
            <div><strong>Rotation:</strong> Degrees (360 = full rotation)</div>
            <div><strong>Opacity:</strong> 0 = invisible, 1 = fully visible</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
