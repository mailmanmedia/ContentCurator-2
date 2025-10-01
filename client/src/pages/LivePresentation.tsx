import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Radio, Tv, AlertCircle, Settings, Video, Film } from "lucide-react";
import Header from "@/components/Header";
import { queryClient } from "@/lib/queryClient";
import SceneManager from "@/components/SceneManager";
import PresentationSetManager from "@/components/PresentationSetManager";
import VideoSourceManager from "@/components/VideoSourceManager";
import VideoCompositor from "@/components/VideoCompositor";

interface LiveState {
  currentSetId: string | null;
  programSceneId: string | null;
  previewSceneId: string | null;
  tickerOn: boolean;
  tickerPlaylistId: string | null;
  bannerOn: boolean;
  bannerText: string;
  bannerConfig: {
    position?: 'top' | 'bottom';
    fontSize?: number;
    backgroundColor?: string;
    textColor?: string;
  };
  transitionDuration: number;
  transitionEffect: string;
  activeVideoSources: Record<string, string>;
  lastUpdate: string;
}

interface PresentationSet {
  id: string;
  name: string;
  description: string;
  sceneIds: string[];
  isActive: boolean;
}

interface Scene {
  id: string;
  name: string;
  description: string;
  layout: string;
}

export default function LivePresentation() {
  const [sseConnected, setSSEConnected] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const { data: liveState, isLoading: stateLoading } = useQuery<LiveState>({
    queryKey: ['/api/live/state'],
  });

  const { data: presentationSets } = useQuery<PresentationSet[]>({
    queryKey: ['/api/presentation/sets'],
  });

  const { data: scenes } = useQuery<Scene[]>({
    queryKey: ['/api/presentation/scenes'],
  });

  useEffect(() => {
    const eventSource = new EventSource('/api/live/stream');

    eventSource.onopen = () => {
      setSSEConnected(true);
      addLog('Connected to live stream');
    };

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      addLog(`Event: ${message.type} - ${JSON.stringify(message.data)}`);
      
      if (message.type === 'state-update') {
        queryClient.invalidateQueries({ queryKey: ['/api/live/state'] });
      }
    };

    eventSource.onerror = () => {
      setSSEConnected(false);
      addLog('Connection error - attempting to reconnect...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const addLog = (message: string) => {
    setEventLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 49)]);
  };

  const updateStateMutation = useMutation({
    mutationFn: async (updates: Partial<LiveState>) => {
      const response = await fetch('/api/live/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update state');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live/state'] });
      addLog('State updated successfully');
    },
  });

  const handleLoadSet = (setId: string) => {
    updateStateMutation.mutate({ currentSetId: setId });
  };

  const handleTakeToProgram = () => {
    if (liveState?.previewSceneId) {
      updateStateMutation.mutate({ programSceneId: liveState.previewSceneId });
    }
  };

  const handleSetPreview = (sceneId: string) => {
    updateStateMutation.mutate({ previewSceneId: sceneId });
  };

  const handleToggleTicker = () => {
    updateStateMutation.mutate({ tickerOn: !liveState?.tickerOn });
  };

  const activeSet = presentationSets?.find(s => s.id === liveState?.currentSetId);
  const programScene = scenes?.find(s => s.id === liveState?.programSceneId);
  const previewScene = scenes?.find(s => s.id === liveState?.previewSceneId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-league-spartan font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-wide text-foreground">
                Live Presentation System
              </h1>
              <p className="font-libre-franklin text-sm sm:text-base text-muted-foreground">
                Broadcast-quality control with camera integration and scene management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={sseConnected ? "default" : "destructive"} className="gap-2">
                <Radio className={`w-3 h-3 ${sseConnected ? 'animate-pulse' : ''}`} />
                {sseConnected ? 'Live' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="control" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="control" className="flex items-center gap-2" data-testid="tab-control">
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">Control</span>
            </TabsTrigger>
            <TabsTrigger value="scenes" className="flex items-center gap-2" data-testid="tab-scenes">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Scenes</span>
            </TabsTrigger>
            <TabsTrigger value="sets" className="flex items-center gap-2" data-testid="tab-sets">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Sets</span>
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2" data-testid="tab-sources">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Sources</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-6">
            {stateLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Loading live state...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tv className="w-5 h-5" />
                        Program Output
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-black rounded-md border-2 border-primary overflow-hidden">
                        <VideoCompositor 
                          sceneId={liveState?.programSceneId || null}
                          className="w-full h-full"
                        />
                      </div>
                      {programScene && (
                        <div className="text-center">
                          <h3 className="font-bold text-sm">{programScene.name}</h3>
                          <Badge variant="outline" className="mt-1">{programScene.layout}</Badge>
                        </div>
                      )}
                      
                      {liveState?.tickerOn && (
                        <div className="bg-primary/20 border border-primary rounded p-2">
                          <p className="text-xs font-mono">Ticker: Active</p>
                        </div>
                      )}
                      
                      {liveState?.bannerOn && (
                        <div className="bg-accent/20 border border-accent rounded p-2">
                          <p className="text-xs font-mono">Banner: {liveState.bannerText}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-black rounded-md border-2 border-accent overflow-hidden">
                        <VideoCompositor 
                          sceneId={liveState?.previewSceneId || null}
                          className="w-full h-full"
                        />
                      </div>
                      {previewScene && (
                        <div className="text-center mt-2">
                          <h3 className="font-bold text-sm">{previewScene.name}</h3>
                          <Badge variant="outline" className="mt-1">{previewScene.layout}</Badge>
                        </div>
                      )}
                      
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={handleTakeToProgram}
                          disabled={!liveState?.previewSceneId || updateStateMutation.isPending}
                          className="flex-1"
                          data-testid="button-take-to-program"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Take to Program
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleToggleTicker}
                          disabled={updateStateMutation.isPending}
                          data-testid="button-toggle-ticker"
                        >
                          {liveState?.tickerOn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Presentation Sets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {presentationSets && presentationSets.length > 0 ? (
                        presentationSets.map(set => (
                          <Button
                            key={set.id}
                            variant={set.id === liveState?.currentSetId ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleLoadSet(set.id)}
                            disabled={updateStateMutation.isPending}
                            data-testid={`button-set-${set.id}`}
                          >
                            <div className="flex-1 text-left">
                              <div className="font-bold">{set.name}</div>
                              <div className="text-xs text-muted-foreground">{set.sceneIds.length} scenes</div>
                            </div>
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No presentation sets available
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Scenes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                      {activeSet && scenes ? (
                        scenes
                          .filter(s => activeSet.sceneIds.includes(s.id))
                          .map(scene => (
                            <Button
                              key={scene.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => handleSetPreview(scene.id)}
                              disabled={updateStateMutation.isPending}
                              data-testid={`button-scene-${scene.id}`}
                            >
                              <div className="flex-1 text-left">
                                <div className="font-bold text-sm">{scene.name}</div>
                                <div className="text-xs text-muted-foreground">{scene.layout}</div>
                              </div>
                              {scene.id === liveState?.previewSceneId && (
                                <Badge variant="secondary">Preview</Badge>
                              )}
                              {scene.id === liveState?.programSceneId && (
                                <Badge>Live</Badge>
                              )}
                            </Button>
                          ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Load a presentation set to view scenes
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Event Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-sidebar rounded p-2 max-h-48 overflow-y-auto">
                        {eventLog.length > 0 ? (
                          <div className="font-mono text-xs space-y-1">
                            {eventLog.map((log, i) => (
                              <div key={i} className="text-muted-foreground">{log}</div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No events yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scenes">
            <SceneManager />
          </TabsContent>

          <TabsContent value="sets">
            <PresentationSetManager />
          </TabsContent>

          <TabsContent value="sources">
            <VideoSourceManager />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Live Presentation Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">Transition Effect</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Current: {liveState?.transitionEffect || 'cut'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStateMutation.mutate({ transitionEffect: 'cut' })}
                      >
                        Cut
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStateMutation.mutate({ transitionEffect: 'fade' })}
                      >
                        Fade
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStateMutation.mutate({ transitionEffect: 'dissolve' })}
                      >
                        Dissolve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStateMutation.mutate({ transitionEffect: 'slide' })}
                      >
                        Slide
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Transition Duration</h3>
                    <p className="text-sm text-muted-foreground">
                      Current: {liveState?.transitionDuration || 500}ms
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Banner Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Position: {liveState?.bannerConfig?.position || 'bottom'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
