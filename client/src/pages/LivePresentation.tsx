import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Radio, 
  Video, 
  Monitor, 
  Film, 
  Wifi, 
  WifiOff, 
  Play, 
  Square,
  GripVertical,
  Youtube,
  CheckCircle2
} from "lucide-react";
import Header from "@/components/Header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import VideoCompositor from "@/components/VideoCompositor";
import { useCameraStreams } from "@/contexts/CameraStreamContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VideoSource {
  id: string;
  name: string;
  description: string;
  sourceType: 'camera' | 'screen' | 'media' | 'rtmp' | 'webrtc' | 'youtube';
  deviceId?: string;
  deviceLabel?: string;
  streamUrl?: string;
  mediaFileId?: string;
  configJson: Record<string, any>;
  isActive: boolean;
  isConnected: boolean;
  lastConnectedAt?: string;
  tags: string[];
}

const sourceTypeIcons = {
  camera: Video,
  screen: Monitor,
  media: Film,
  rtmp: Radio,
  webrtc: Wifi,
  youtube: Youtube,
};

const sourceTypeLabels = {
  camera: 'Camera',
  screen: 'Screen',
  media: 'Media',
  rtmp: 'RTMP',
  webrtc: 'WebRTC',
  youtube: 'YouTube',
};

function SortableActiveSource({ source }: { source: VideoSource }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: source.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = sourceTypeIcons[source.sourceType];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-card rounded-md border hover-elevate"
      data-testid={`sortable-active-source-${source.id}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-sm flex-1 truncate">{source.name}</span>
      <Badge variant="outline" className="text-xs">
        {source.isConnected ? 'Connected' : 'Inactive'}
      </Badge>
    </div>
  );
}

export default function LivePresentation() {
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const { toast } = useToast();
  const { acquireStream, acquireScreenShare, releaseStream } = useCameraStreams();

  const { data: videoSourcesData, isLoading } = useQuery<{ videoSources: VideoSource[] }>({
    queryKey: ['/api/video-sources'],
  });

  const videoSources = videoSourcesData?.videoSources || [];

  useEffect(() => {
    if (videoSources.length > 0 && activeSources.length === 0) {
      const activeIds = videoSources
        .filter(s => s.isActive)
        .map(s => s.id);
      setActiveSources(activeIds);
    }
  }, [videoSources]);

  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VideoSource> }) => {
      const response = await apiRequest('PUT', `/api/video-sources/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-sources'] });
    },
  });

  const connectSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/video-sources/${id}/connect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-sources'] });
      toast({ title: 'Source connected' });
    },
  });

  const disconnectSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/video-sources/${id}/disconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-sources'] });
      toast({ title: 'Source disconnected' });
    },
  });

  const handleToggleSource = (sourceId: string, checked: boolean) => {
    if (checked) {
      setActiveSources(prev => [...prev, sourceId]);
    } else {
      setActiveSources(prev => prev.filter(id => id !== sourceId));
    }

    updateSourceMutation.mutate({
      id: sourceId,
      data: { isActive: checked }
    });
  };

  const handleToggleAllSources = (checked: boolean) => {
    if (checked) {
      const allIds = videoSources.map(s => s.id);
      setActiveSources(allIds);
      videoSources.forEach(source => {
        updateSourceMutation.mutate({
          id: source.id,
          data: { isActive: true }
        });
      });
    } else {
      setActiveSources([]);
      videoSources.forEach(source => {
        updateSourceMutation.mutate({
          id: source.id,
          data: { isActive: false }
        });
      });
    }
  };

  const handleConnect = (sourceId: string) => {
    connectSourceMutation.mutate(sourceId);
  };

  const handleDisconnect = (sourceId: string) => {
    disconnectSourceMutation.mutate(sourceId);
  };

  const handleStartBroadcast = () => {
    setIsBroadcasting(true);
    toast({
      title: 'Broadcast Started',
      description: 'Your program feed is now live!',
    });
  };

  const handleStopBroadcast = () => {
    setIsBroadcasting(false);
    toast({
      title: 'Broadcast Stopped',
      description: 'Program output has been stopped',
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActiveSources((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const activeSourceObjects = activeSources
    .map(id => videoSources.find(s => s.id === id))
    .filter(Boolean) as VideoSource[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-[1600px]">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-league-spartan font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-wide text-foreground">
                Live Presentation
              </h1>
              <p className="font-libre-franklin text-sm sm:text-base text-muted-foreground">
                Manage video sources and broadcast program output
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isBroadcasting && (
                <Badge 
                  variant="default" 
                  className="gap-2 animate-broadcast bg-primary text-primary-foreground"
                  data-testid="badge-on-air"
                >
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse-glow" />
                  ON AIR
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <Card data-testid="card-program-output">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-primary" />
                    <CardTitle>Program Output</CardTitle>
                    <Badge variant="outline" data-testid="badge-active-count">
                      {activeSources.length} Active {activeSources.length === 1 ? 'Source' : 'Sources'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isBroadcasting ? (
                      <Button
                        onClick={handleStartBroadcast}
                        disabled={activeSources.length === 0}
                        className="bg-primary hover:bg-primary/90"
                        data-testid="button-start-broadcast"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Broadcast
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopBroadcast}
                        variant="destructive"
                        data-testid="button-stop-broadcast"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop Feed
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black rounded-md overflow-hidden aspect-video">
                  <VideoCompositor
                    activeSources={activeSources}
                    className="w-full h-full"
                  />
                </div>
                {activeSources.length === 0 && (
                  <p className="text-center text-muted-foreground mt-4 text-sm">
                    Select sources below to add them to the program output
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-source-grid">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Video Sources</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="toggle-all"
                        checked={activeSources.length === videoSources.length && videoSources.length > 0}
                        onCheckedChange={handleToggleAllSources}
                        data-testid="checkbox-toggle-all"
                      />
                      <label 
                        htmlFor="toggle-all" 
                        className="text-sm font-medium cursor-pointer"
                      >
                        Toggle All
                      </label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-32 bg-muted rounded-md mb-3" />
                          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : videoSources.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No video sources configured</p>
                    <p className="text-sm text-muted-foreground">
                      Add video sources from the Sources tab to get started
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videoSources.map((source) => {
                      const Icon = sourceTypeIcons[source.sourceType];
                      const isActive = activeSources.includes(source.id);
                      
                      return (
                        <Card 
                          key={source.id} 
                          className={`transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}
                          data-testid={`card-source-${source.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="relative bg-black rounded-md mb-3 aspect-video overflow-hidden">
                              <SourcePreview 
                                source={source} 
                                isActive={isActive}
                              />
                              
                              <div className="absolute top-2 right-2 flex gap-1">
                                {source.isConnected ? (
                                  <Badge 
                                    variant="default" 
                                    className="text-xs bg-green-600 hover:bg-green-700"
                                    data-testid={`badge-connected-${source.id}`}
                                  >
                                    <Wifi className="w-3 h-3 mr-1" />
                                    Connected
                                  </Badge>
                                ) : (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs"
                                    data-testid={`badge-disconnected-${source.id}`}
                                  >
                                    <WifiOff className="w-3 h-3 mr-1" />
                                    Disconnected
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Checkbox
                                      id={`source-${source.id}`}
                                      checked={isActive}
                                      onCheckedChange={(checked) => 
                                        handleToggleSource(source.id, checked as boolean)
                                      }
                                      data-testid={`checkbox-source-${source.id}`}
                                    />
                                    <label 
                                      htmlFor={`source-${source.id}`} 
                                      className="text-sm font-semibold truncate cursor-pointer"
                                    >
                                      {source.name}
                                    </label>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate ml-6">
                                    {source.description || 'No description'}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  <Icon className="w-3 h-3 mr-1" />
                                  {sourceTypeLabels[source.sourceType]}
                                </Badge>
                              </div>

                              {(source.sourceType === 'camera' || source.sourceType === 'screen') && (
                                <div className="flex gap-2">
                                  {!source.isConnected ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs"
                                      onClick={() => handleConnect(source.id)}
                                      data-testid={`button-connect-${source.id}`}
                                    >
                                      <Wifi className="w-3 h-3 mr-1" />
                                      Connect
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs"
                                      onClick={() => handleDisconnect(source.id)}
                                      data-testid={`button-disconnect-${source.id}`}
                                    >
                                      <WifiOff className="w-3 h-3 mr-1" />
                                      Disconnect
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1">
            <Card className="sticky top-4" data-testid="card-active-sources">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Active Sources
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Drag to reorder layering (top = front)
                </p>
              </CardHeader>
              <CardContent>
                {activeSourceObjects.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No active sources
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check sources below to activate them
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={activeSources}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {activeSourceObjects.map((source) => (
                          <SortableActiveSource key={source.id} source={source} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {activeSourceObjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        <strong>Layering:</strong> Sources at the top appear in front
                      </p>
                      <p>
                        <strong>Compositing:</strong> All active sources are combined in the program output
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function SourcePreview({ source, isActive }: { source: VideoSource; isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>();
  const { acquireStream, acquireScreenShare, releaseStream } = useCameraStreams();

  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    const initPreview = async () => {
      if (!isActive || !source.isConnected) {
        return;
      }

      try {
        if (source.sourceType === 'camera' && source.deviceId) {
          stream = await acquireStream(source.id, source.deviceId);
        } else if (source.sourceType === 'screen') {
          stream = await acquireScreenShare(source.id);
        }

        if (stream && mounted) {
          if (!videoRef.current) {
            videoRef.current = document.createElement('video');
            videoRef.current.autoplay = true;
            videoRef.current.muted = true;
            videoRef.current.playsInline = true;
          }
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Preview init error:', err);
      }
    };

    initPreview();

    return () => {
      mounted = false;
      if (stream) {
        releaseStream(source.id);
      }
    };
  }, [source, isActive, acquireStream, acquireScreenShare, releaseStream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isActive) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Inactive', canvas.width / 2, canvas.height / 2);
      } else if (!source.isConnected) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Not Connected', canvas.width / 2, canvas.height / 2);
      } else if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [source, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      className="w-full h-full object-cover"
      data-testid={`canvas-preview-${source.id}`}
    />
  );
}
