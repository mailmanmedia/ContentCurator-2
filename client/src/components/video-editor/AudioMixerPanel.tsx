import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Volume2, Plus, Trash2, Music, Mic } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AudioTrack } from "@shared/schema";

interface AudioMixerPanelProps {
  projectId: string;
}

export default function AudioMixerPanel({ projectId }: AudioMixerPanelProps) {
  const { toast } = useToast();
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [trackType, setTrackType] = useState("music");

  const { data: tracks } = useQuery<AudioTrack[]>({
    queryKey: ['/api/video-projects', projectId, 'audio-tracks'],
  });

  const createTrackMutation = useMutation({
    mutationFn: async (track: any) => {
      return apiRequest('POST', `/api/video-projects/${projectId}/audio-tracks`, track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects', projectId, 'audio-tracks'] });
      setShowAddTrack(false);
      setTrackName("");
      toast({ title: "Success", description: "Audio track added" });
    },
  });

  const updateTrackMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest('PATCH', `/api/video-projects/${projectId}/audio-tracks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects', projectId, 'audio-tracks'] });
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/video-projects/${projectId}/audio-tracks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects', projectId, 'audio-tracks'] });
      toast({ title: "Success", description: "Audio track deleted" });
    },
  });

  return (
    <Card data-testid="audio-mixer-panel">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio Mixer
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddTrack(!showAddTrack)}
            data-testid="button-add-audio-track"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Track
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddTrack && (
          <div className="space-y-3 p-3 border rounded" data-testid="add-track-form">
            <Input
              placeholder="Track name..."
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              data-testid="input-track-name"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={trackType === "music" ? "default" : "outline"}
                onClick={() => setTrackType("music")}
              >
                <Music className="w-4 h-4 mr-2" />
                Music
              </Button>
              <Button
                size="sm"
                variant={trackType === "voiceover" ? "default" : "outline"}
                onClick={() => setTrackType("voiceover")}
              >
                <Mic className="w-4 h-4 mr-2" />
                Voiceover
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={() =>
                createTrackMutation.mutate({
                  name: trackName,
                  type: trackType,
                  startTime: 0,
                  duration: 30000,
                  volume: 100,
                })
              }
              disabled={!trackName}
            >
              Create Track
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {tracks && tracks.length > 0 ? (
            tracks.map((track) => (
              <div
                key={track.id}
                className="space-y-2 p-3 border rounded"
                data-testid={`audio-track-${track.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {track.type === "music" ? (
                      <Music className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                    <span className="font-medium text-sm">{track.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!track.isMuted}
                      onCheckedChange={(checked) =>
                        updateTrackMutation.mutate({
                          id: track.id,
                          updates: { isMuted: !checked },
                        })
                      }
                      data-testid={`switch-mute-${track.id}`}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTrackMutation.mutate(track.id)}
                      data-testid={`button-delete-track-${track.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Volume: {track.volume}%</Label>
                  <Slider
                    value={[track.volume]}
                    onValueChange={(v) =>
                      updateTrackMutation.mutate({
                        id: track.id,
                        updates: { volume: v[0] },
                      })
                    }
                    min={0}
                    max={200}
                    data-testid={`slider-volume-${track.id}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fade In (ms)</Label>
                    <Input
                      type="number"
                      value={track.fadeIn || 0}
                      onChange={(e) =>
                        updateTrackMutation.mutate({
                          id: track.id,
                          updates: { fadeIn: parseInt(e.target.value) || 0 },
                        })
                      }
                      data-testid={`input-fade-in-${track.id}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fade Out (ms)</Label>
                    <Input
                      type="number"
                      value={track.fadeOut || 0}
                      onChange={(e) =>
                        updateTrackMutation.mutate({
                          id: track.id,
                          updates: { fadeOut: parseInt(e.target.value) || 0 },
                        })
                      }
                      data-testid={`input-fade-out-${track.id}`}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No audio tracks yet. Add music or voiceover tracks.
            </p>
          )}
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Audio Tips</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• Keep dialogue at ~80-100% volume</div>
            <div>• Background music typically 30-50%</div>
            <div>• Use fade in/out to avoid abrupt starts</div>
            <div>• Mute tracks to isolate specific audio</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
