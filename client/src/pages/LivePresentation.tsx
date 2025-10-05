import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Radio, 
  Video, 
  Monitor, 
  Play, 
  Square,
  GripVertical,
  Plus,
  X,
  Sparkles,
  Layers
} from "lucide-react";
import Header from "@/components/Header";
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

const sourceTypeIcons = {
  camera: Video,
  screen: Monitor,
  overlay: Sparkles,
};

function SortableActiveSource({ 
  source, 
  onRemove 
}: { 
  source: ActiveSource;
  onRemove: (id: string) => void;
}) {
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

  const Icon = sourceTypeIcons[source.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-card rounded-md border hover-elevate group"
      data-testid={`sortable-active-source-${source.id}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-sm flex-1 truncate">{source.name}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(source.id)}
        data-testid={`button-remove-source-${source.id}`}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default function LivePresentation() {
  const [activeSources, setActiveSources] = useState<ActiveSource[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [overlayAnimation, setOverlayAnimation] = useState<'scroll' | 'fade' | 'pulse'>('scroll');
  const [overlayTemplate, setOverlayTemplate] = useState<'ticker' | 'banner' | 'corner'>('ticker');
  const [selectedValue, setSelectedValue] = useState<string>('');
  
  const { toast } = useToast();
  const { acquireStream, acquireScreenShare } = useCameraStreams();
  const overlayCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const overlayAnimationCleanup = useRef<Map<string, () => void>>(new Map());

  // Detect cameras
  useEffect(() => {
    const detectCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
      } catch (err) {
        console.error('Camera detection error:', err);
      }
    };

    detectCameras();

    navigator.mediaDevices.addEventListener('devicechange', detectCameras);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', detectCameras);
    };
  }, []);

  const handleSourceSelection = async (value: string) => {
    setSelectedValue('');
    
    if (value === 'screen-share') {
      await handleAddScreenShare();
    } else if (value === 'branded-overlay') {
      setIsOverlayDialogOpen(true);
    } else if (value.startsWith('camera-')) {
      const deviceId = value.replace('camera-', '');
      await handleAddCamera(deviceId);
    }
  };

  const handleAddCamera = async (deviceId: string) => {
    try {
      const camera = cameras.find(c => c.deviceId === deviceId);
      if (!camera) return;

      const sourceId = `camera-${Date.now()}`;
      const stream = await acquireStream(sourceId, deviceId);

      const newSource: ActiveSource = {
        id: sourceId,
        name: camera.label || 'Camera',
        type: 'camera',
        deviceId,
        deviceLabel: camera.label,
        stream,
      };

      setActiveSources(prev => [...prev, newSource]);
      toast({ title: 'Camera added', description: camera.label });
    } catch (err) {
      console.error('Failed to add camera:', err);
      toast({ 
        title: 'Failed to add camera', 
        description: 'Please check camera permissions',
        variant: 'destructive' 
      });
    }
  };

  const handleAddScreenShare = async () => {
    try {
      const sourceId = `screen-${Date.now()}`;
      const stream = await acquireScreenShare(sourceId);

      const newSource: ActiveSource = {
        id: sourceId,
        name: 'Screen Share',
        type: 'screen',
        stream,
      };

      setActiveSources(prev => [...prev, newSource]);
      toast({ title: 'Screen share added' });
    } catch (err) {
      console.error('Failed to add screen share:', err);
      toast({ 
        title: 'Failed to add screen share', 
        description: 'Screen share was cancelled or not permitted',
        variant: 'destructive' 
      });
    }
  };

  const createOverlayCanvas = (sourceId: string, config: ActiveSource['overlayConfig']): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !config) return canvas;

    const colors = {
      primary: '#C8102E',
      navy: '#002147', 
      cream: '#F5F1E9',
      blue: '#4CA9E0'
    };

    let animationFrame: number;
    let scrollPosition = 0;
    let opacity = 1;
    let scale = 1;

    const cleanup = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (config.template === 'ticker') {
        const tickerHeight = 100;
        const y = canvas.height - tickerHeight;
        
        ctx.fillStyle = colors.primary;
        ctx.fillRect(0, y, canvas.width, tickerHeight);
        
        ctx.fillStyle = colors.cream;
        ctx.font = 'bold 48px Arial';
        ctx.textBaseline = 'middle';

        if (config.animation === 'scroll') {
          scrollPosition -= 3;
          const textWidth = ctx.measureText(config.text).width;
          if (scrollPosition < -textWidth - 100) {
            scrollPosition = canvas.width;
          }
          ctx.fillText(config.text, scrollPosition, y + tickerHeight / 2);
        } else if (config.animation === 'fade') {
          opacity = (Math.sin(Date.now() / 1000) + 1) / 2;
          ctx.globalAlpha = opacity;
          ctx.fillText(config.text, 50, y + tickerHeight / 2);
          ctx.globalAlpha = 1;
        } else if (config.animation === 'pulse') {
          scale = 1 + Math.sin(Date.now() / 500) * 0.1;
          ctx.save();
          ctx.translate(canvas.width / 2, y + tickerHeight / 2);
          ctx.scale(scale, scale);
          ctx.textAlign = 'center';
          ctx.fillText(config.text, 0, 0);
          ctx.restore();
        }
      } else if (config.template === 'banner') {
        const bannerHeight = 150;
        
        ctx.fillStyle = colors.navy;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(0, 0, canvas.width, bannerHeight);
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = colors.cream;
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (config.animation === 'fade') {
          opacity = (Math.sin(Date.now() / 1000) + 1) / 2;
          ctx.globalAlpha = opacity;
        } else if (config.animation === 'pulse') {
          scale = 1 + Math.sin(Date.now() / 500) * 0.1;
          ctx.save();
          ctx.translate(canvas.width / 2, bannerHeight / 2);
          ctx.scale(scale, scale);
          ctx.fillText(config.text, 0, 0);
          ctx.restore();
          ctx.globalAlpha = 1;
          animationFrame = requestAnimationFrame(animate);
          return;
        }
        
        ctx.fillText(config.text, canvas.width / 2, bannerHeight / 2);
        ctx.globalAlpha = 1;
      } else if (config.template === 'corner') {
        const cornerSize = 400;
        
        ctx.fillStyle = colors.primary;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(cornerSize, 0);
        ctx.lineTo(0, cornerSize);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = colors.cream;
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        ctx.save();
        ctx.translate(20, 20);
        ctx.rotate(-0.785398);
        
        if (config.animation === 'pulse') {
          scale = 1 + Math.sin(Date.now() / 500) * 0.15;
          ctx.scale(scale, scale);
        }
        
        ctx.fillText(config.text, 0, 0);
        ctx.restore();
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    overlayAnimationCleanup.current.set(sourceId, cleanup);

    return canvas;
  };

  const handleAddOverlay = () => {
    if (!overlayText.trim()) {
      toast({ 
        title: 'Enter overlay text', 
        variant: 'destructive' 
      });
      return;
    }

    const sourceId = `overlay-${Date.now()}`;
    const config = {
      text: overlayText,
      animation: overlayAnimation,
      template: overlayTemplate,
    };

    const canvas = createOverlayCanvas(sourceId, config);
    overlayCanvasRefs.current.set(sourceId, canvas);

    const stream = canvas.captureStream(30);

    const newSource: ActiveSource = {
      id: sourceId,
      name: `${overlayTemplate.charAt(0).toUpperCase() + overlayTemplate.slice(1)} Overlay`,
      type: 'overlay',
      stream,
      overlayConfig: config,
    };

    setActiveSources(prev => [...prev, newSource]);
    setIsOverlayDialogOpen(false);
    setOverlayText('');
    toast({ title: 'Overlay added' });
  };

  const handleRemoveSource = (sourceId: string) => {
    const source = activeSources.find(s => s.id === sourceId);
    if (source?.type === 'overlay') {
      const cleanup = overlayAnimationCleanup.current.get(sourceId);
      if (cleanup) {
        cleanup();
        overlayAnimationCleanup.current.delete(sourceId);
      }
      overlayCanvasRefs.current.delete(sourceId);
    }
    
    setActiveSources(prev => prev.filter(s => s.id !== sourceId));
    toast({ title: 'Source removed' });
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
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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
                Add sources and broadcast program output
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
                    Use the dropdown below to add sources to the program output
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-source-selector">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Add Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedValue} onValueChange={handleSourceSelection}>
                  <SelectTrigger className="w-full" data-testid="select-add-source">
                    <SelectValue placeholder="Select a source to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.length > 0 && (
                      <>
                        <SelectGroup>
                          <SelectLabel>Cameras</SelectLabel>
                          {cameras.map((camera) => (
                            <SelectItem 
                              key={camera.deviceId} 
                              value={`camera-${camera.deviceId}`}
                              data-testid={`select-camera-${camera.deviceId}`}
                            >
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                {camera.label || 'Camera'}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                      </>
                    )}
                    <SelectItem value="screen-share" data-testid="select-screen-share">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Screen Share
                      </div>
                    </SelectItem>
                    <SelectSeparator />
                    <SelectItem value="branded-overlay" data-testid="select-branded-overlay">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Mailman Media Overlay
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1">
            <Card className="sticky top-4" data-testid="card-active-sources">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Active Sources
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Drag to reorder layering (top = front)
                </p>
              </CardHeader>
              <CardContent>
                {activeSources.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No active sources
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add sources from the dropdown
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={activeSources.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {activeSources.map((source) => (
                          <SortableActiveSource 
                            key={source.id} 
                            source={source}
                            onRemove={handleRemoveSource}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {activeSources.length > 0 && (
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

      <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
        <DialogContent data-testid="dialog-overlay-config">
          <DialogHeader>
            <DialogTitle>Create Branded Overlay</DialogTitle>
            <DialogDescription>
              Customize your Mailman Media overlay with Liverpool FC branding
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="overlay-text">Overlay Text</Label>
              <Input
                id="overlay-text"
                placeholder="Enter your text..."
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                data-testid="input-overlay-text"
              />
            </div>

            <div>
              <Label htmlFor="animation-type">Animation Type</Label>
              <Select value={overlayAnimation} onValueChange={(v) => setOverlayAnimation(v as any)}>
                <SelectTrigger id="animation-type" data-testid="select-animation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scroll">Scrolling Text</SelectItem>
                  <SelectItem value="fade">Fade In/Out</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-style">Template Style</Label>
              <Select value={overlayTemplate} onValueChange={(v) => setOverlayTemplate(v as any)}>
                <SelectTrigger id="template-style" data-testid="select-template-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticker">Bottom Ticker</SelectItem>
                  <SelectItem value="banner">Top Banner</SelectItem>
                  <SelectItem value="corner">Corner Logo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOverlayDialogOpen(false)}
              data-testid="button-cancel-overlay"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddOverlay}
              data-testid="button-add-overlay"
            >
              Add Overlay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
