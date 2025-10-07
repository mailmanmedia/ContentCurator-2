import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Type, Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TextOverlay } from "@shared/schema";

interface TextOverlayManagerProps {
  projectId: string;
  currentTime: number;
  duration: number;
}

export default function TextOverlayManager({ projectId, currentTime, duration }: TextOverlayManagerProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<TextOverlay | null>(null);

  // Form state
  const [type, setType] = useState<string>("title");
  const [text, setText] = useState("");
  const [startTime, setStartTime] = useState(currentTime);
  const [endTime, setEndTime] = useState(currentTime + 3000);
  const [fontSize, setFontSize] = useState([48]);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [backgroundOpacity, setBackgroundOpacity] = useState([80]);
  const [positionX, setPositionX] = useState([50]);
  const [positionY, setPositionY] = useState([50]);
  const [alignment, setAlignment] = useState("center");
  const [animation, setAnimation] = useState("fade");
  const [liverpoolBranded, setLiverpoolBranded] = useState(false);

  const { data: overlays } = useQuery<TextOverlay[]>({
    queryKey: ['/api/video-projects', projectId, 'text-overlays'],
  });

  const createOverlayMutation = useMutation({
    mutationFn: async (overlay: any) => {
      return apiRequest('POST', `/api/video-projects/${projectId}/text-overlays`, overlay);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects', projectId, 'text-overlays'] });
      resetForm();
      toast({ title: "Success", description: "Text overlay added" });
    },
  });

  const updateOverlayMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest('PATCH', `/api/video-projects/${projectId}/text-overlays/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects', projectId, 'text-overlays'] });
      resetForm();
      toast({ title: "Success", description: "Text overlay updated" });
    },
  });

  const deleteOverlayMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/video-projects/${projectId}/text-overlays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects', projectId, 'text-overlays'] });
      toast({ title: "Success", description: "Text overlay deleted" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingOverlay(null);
    setText("");
    setType("title");
    setStartTime(currentTime);
    setEndTime(currentTime + 3000);
    setFontSize([48]);
    setFontColor("#FFFFFF");
    setBackgroundColor("#000000");
    setBackgroundOpacity([80]);
    setPositionX([50]);
    setPositionY([50]);
    setAlignment("center");
    setAnimation("fade");
    setLiverpoolBranded(false);
  };

  const handleSubmit = () => {
    const overlayData = {
      type,
      text,
      startTime,
      endTime,
      position: { x: positionX[0], y: positionY[0], anchor: alignment },
      styling: {
        fontSize: fontSize[0],
        color: fontColor,
        backgroundColor,
        backgroundOpacity: backgroundOpacity[0],
        textAlign: alignment,
      },
      animation,
      animationDuration: 300,
      isLiverpoolBranded: liverpoolBranded,
    };

    if (editingOverlay) {
      updateOverlayMutation.mutate({ id: editingOverlay.id, updates: overlayData });
    } else {
      createOverlayMutation.mutate(overlayData);
    }
  };

  const handleEdit = (overlay: TextOverlay) => {
    setEditingOverlay(overlay);
    setType(overlay.type);
    setText(overlay.text);
    setStartTime(overlay.startTime);
    setEndTime(overlay.endTime);
    const pos = overlay.position as any;
    setPositionX([pos.x || 50]);
    setPositionY([pos.y || 50]);
    setAlignment(pos.anchor || "center");
    const styling = overlay.styling as any;
    setFontSize([styling.fontSize || 48]);
    setFontColor(styling.color || "#FFFFFF");
    setBackgroundColor(styling.backgroundColor || "#000000");
    setBackgroundOpacity([styling.backgroundOpacity || 80]);
    setAnimation(overlay.animation || "fade");
    setLiverpoolBranded(overlay.isLiverpoolBranded || false);
    setShowForm(true);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card data-testid="text-overlay-manager">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Text & Graphics
          </div>
          <Button 
            size="sm"
            onClick={() => setShowForm(!showForm)}
            data-testid="button-add-text-overlay"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Text
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-4 p-4 border rounded-lg" data-testid="text-overlay-form">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-text-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title Card</SelectItem>
                  <SelectItem value="subtitle">Subtitle</SelectItem>
                  <SelectItem value="lower_third">Lower Third</SelectItem>
                  <SelectItem value="scoreboard">Scoreboard</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Text</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text..."
                data-testid="input-overlay-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time (ms)</Label>
                <Input
                  type="number"
                  value={startTime}
                  onChange={(e) => setStartTime(parseInt(e.target.value))}
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time (ms)</Label>
                <Input
                  type="number"
                  value={endTime}
                  onChange={(e) => setEndTime(parseInt(e.target.value))}
                  data-testid="input-end-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Size: {fontSize[0]}px</Label>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                min={12}
                max={120}
                step={1}
                data-testid="slider-font-size"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  data-testid="input-font-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Background</Label>
                <Input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  data-testid="input-bg-color"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Opacity: {backgroundOpacity[0]}%</Label>
              <Slider
                value={backgroundOpacity}
                onValueChange={setBackgroundOpacity}
                min={0}
                max={100}
                step={5}
                data-testid="slider-bg-opacity"
              />
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">X: {positionX[0]}%</Label>
                  <Slider
                    value={positionX}
                    onValueChange={setPositionX}
                    min={0}
                    max={100}
                    data-testid="slider-position-x"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y: {positionY[0]}%</Label>
                  <Slider
                    value={positionY}
                    onValueChange={setPositionY}
                    min={0}
                    max={100}
                    data-testid="slider-position-y"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alignment</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={alignment === "left" ? "default" : "outline"}
                  onClick={() => setAlignment("left")}
                  data-testid="button-align-left"
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={alignment === "center" ? "default" : "outline"}
                  onClick={() => setAlignment("center")}
                  data-testid="button-align-center"
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={alignment === "right" ? "default" : "outline"}
                  onClick={() => setAlignment("right")}
                  data-testid="button-align-right"
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Animation</Label>
              <Select value={animation} onValueChange={setAnimation}>
                <SelectTrigger data-testid="select-animation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="typewriter">Typewriter</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="liverpool-branded"
                checked={liverpoolBranded}
                onCheckedChange={setLiverpoolBranded}
                data-testid="switch-liverpool-branded"
              />
              <Label htmlFor="liverpool-branded">Liverpool FC Branding</Label>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!text || createOverlayMutation.isPending || updateOverlayMutation.isPending}
                data-testid="button-save-overlay"
              >
                {editingOverlay ? 'Update' : 'Add'} Overlay
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-overlay">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Text Overlays ({overlays?.length || 0})</Label>
          {overlays && overlays.length > 0 ? (
            <div className="space-y-2">
              {overlays.map((overlay) => (
                <div
                  key={overlay.id}
                  className="flex items-center justify-between p-3 border rounded hover-elevate"
                  data-testid={`overlay-${overlay.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{overlay.text.substring(0, 50)}...</div>
                    <div className="text-xs text-muted-foreground">
                      {overlay.type} • {formatTime(overlay.startTime)} - {formatTime(overlay.endTime)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(overlay)}
                      data-testid={`button-edit-overlay-${overlay.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteOverlayMutation.mutate(overlay.id)}
                      data-testid={`button-delete-overlay-${overlay.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No text overlays yet. Click "Add Text" to create one.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
