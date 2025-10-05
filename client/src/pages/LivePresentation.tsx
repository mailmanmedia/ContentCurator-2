import { useState, useEffect } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Layers,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Settings,
  RectangleHorizontal
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
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
  type: 'camera' | 'screen';
  deviceId?: string;
  deviceLabel?: string;
  stream?: MediaStream;
}

interface OverlayConfig {
  id: string;
  text: string;
  animationType: 'scroll' | 'fade' | 'static';
  templateStyle: 'ticker' | 'banner' | 'corner';
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  position: 'top' | 'bottom';
  height: number;
  visible: boolean;
  fontFamily: string;
  scrollSpeed: number;
  scrollDirection: 'left' | 'right' | 'up' | 'down';
}

const sourceTypeIcons = {
  camera: Video,
  screen: Monitor,
};

const TEMPLATE_PRESETS = {
  'breaking-news': {
    name: 'Breaking News',
    backgroundColor: '#C8102E',
    textColor: '#FFFFFF',
    fontSize: 28,
    height: 70,
    animationType: 'scroll' as const,
    position: 'bottom' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
  },
  'live-updates': {
    name: 'Live Updates',
    backgroundColor: '#002147',
    textColor: '#F6EB61',
    fontSize: 28,
    height: 70,
    animationType: 'scroll' as const,
    position: 'bottom' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
  },
  'match-info': {
    name: 'Match Info',
    backgroundColor: '#F6EB61',
    textColor: '#002147',
    fontSize: 32,
    height: 80,
    animationType: 'fade' as const,
    position: 'top' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
  },
};

function SortableActiveSource({ 
  source, 
  onRemove,
  sourceFitModes,
  globalFitMode,
  onFitModeChange
}: { 
  source: ActiveSource;
  onRemove: (id: string) => void;
  sourceFitModes: Record<string, 'contain' | 'cover' | 'fill'>;
  globalFitMode: 'contain' | 'cover' | 'fill';
  onFitModeChange: (sourceId: string, fitMode: 'contain' | 'cover' | 'fill' | 'auto') => void;
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
  const hasCustomFitMode = sourceFitModes[source.id] !== undefined;
  const currentFitMode = sourceFitModes[source.id] || globalFitMode;

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
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`button-fitmode-${source.id}`}
          >
            <RectangleHorizontal className={`w-3 h-3 ${hasCustomFitMode ? 'text-primary' : ''}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Fit Mode</h4>
            <Select
              value={hasCustomFitMode ? currentFitMode : 'auto'}
              onValueChange={(value) => onFitModeChange(source.id, value as 'contain' | 'cover' | 'fill' | 'auto')}
            >
              <SelectTrigger data-testid={`select-source-fitmode-${source.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (use global: {globalFitMode})</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {hasCustomFitMode ? `Using ${currentFitMode} mode` : `Using global ${globalFitMode} mode`}
            </p>
          </div>
        </PopoverContent>
      </Popover>

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
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof TEMPLATE_PRESETS>('breaking-news');
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'bottom'>('bottom');
  const [overlayFontFamily, setOverlayFontFamily] = useState('League Spartan');
  const [overlayScrollSpeed, setOverlayScrollSpeed] = useState(50);
  const [overlayScrollDirection, setOverlayScrollDirection] = useState<'left' | 'right' | 'up' | 'down'>('left');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [outputResolution, setOutputResolution] = useState({ width: 1920, height: 1080 });
  const [globalFitMode, setGlobalFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [sourceFitModes, setSourceFitModes] = useState<Record<string, 'contain' | 'cover' | 'fill'>>({});
  
  const { toast } = useToast();
  const { acquireStream, acquireScreenShare } = useCameraStreams();

  useEffect(() => {
    const detectCameras = async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        tempStream.getTracks().forEach(track => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
      } catch (err) {
        console.error('Camera detection error:', err);
        toast({
          title: "Camera Access Required",
          description: "Please allow camera access to see available cameras.",
          variant: "destructive"
        });
      }
    };

    detectCameras();

    navigator.mediaDevices.addEventListener('devicechange', detectCameras);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', detectCameras);
    };
  }, [toast]);

  const handleSourceSelection = async (value: string) => {
    setSelectedValue('');
    
    if (value === 'screen-share') {
      await handleAddScreenShare();
    } else if (value === 'branded-overlay') {
      setEditingOverlayId(null);
      setOverlayText('');
      setSelectedPreset('breaking-news');
      setOverlayPosition('bottom');
      setOverlayFontFamily('League Spartan');
      setOverlayScrollSpeed(50);
      setOverlayScrollDirection('left');
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

  const handleAddOverlay = () => {
    if (!overlayText.trim()) {
      toast({ 
        title: 'Enter overlay text', 
        variant: 'destructive' 
      });
      return;
    }

    const preset = TEMPLATE_PRESETS[selectedPreset];
    
    if (editingOverlayId) {
      setOverlays(prev => prev.map(overlay => 
        overlay.id === editingOverlayId
          ? {
              ...overlay,
              text: overlayText,
              backgroundColor: preset.backgroundColor,
              textColor: preset.textColor,
              fontSize: preset.fontSize,
              height: preset.height,
              animationType: preset.animationType,
              position: overlayPosition,
              fontFamily: overlayFontFamily,
              scrollSpeed: overlayScrollSpeed,
              scrollDirection: overlayScrollDirection,
            }
          : overlay
      ));
      toast({ title: 'Overlay updated' });
    } else {
      const newOverlay: OverlayConfig = {
        id: `overlay-${Date.now()}`,
        text: overlayText,
        animationType: preset.animationType,
        templateStyle: 'ticker',
        backgroundColor: preset.backgroundColor,
        textColor: preset.textColor,
        fontSize: preset.fontSize,
        position: overlayPosition,
        height: preset.height,
        visible: true,
        fontFamily: overlayFontFamily,
        scrollSpeed: overlayScrollSpeed,
        scrollDirection: overlayScrollDirection,
      };

      setOverlays(prev => [...prev, newOverlay]);
      toast({ title: 'Overlay added', description: preset.name });
    }
    
    setIsOverlayDialogOpen(false);
    setOverlayText('');
    setEditingOverlayId(null);
  };

  const handleRemoveSource = (sourceId: string) => {
    setActiveSources(prev => prev.filter(s => s.id !== sourceId));
    toast({ title: 'Source removed' });
  };

  const handleRemoveOverlay = (overlayId: string) => {
    setOverlays(prev => prev.filter(o => o.id !== overlayId));
    toast({ title: 'Overlay removed' });
  };

  const handleToggleOverlayVisibility = (overlayId: string) => {
    setOverlays(prev => prev.map(overlay =>
      overlay.id === overlayId
        ? { ...overlay, visible: !overlay.visible }
        : overlay
    ));
  };

  const handleEditOverlay = (overlay: OverlayConfig) => {
    setEditingOverlayId(overlay.id);
    setOverlayText(overlay.text);
    setOverlayPosition(overlay.position);
    setOverlayFontFamily(overlay.fontFamily);
    setOverlayScrollSpeed(overlay.scrollSpeed);
    setOverlayScrollDirection(overlay.scrollDirection);
    
    const presetKey = Object.entries(TEMPLATE_PRESETS).find(([_, preset]) => 
      preset.backgroundColor === overlay.backgroundColor &&
      preset.textColor === overlay.textColor
    )?.[0] as keyof typeof TEMPLATE_PRESETS || 'breaking-news';
    
    setSelectedPreset(presetKey);
    setIsOverlayDialogOpen(true);
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

  const handleSourceFitModeChange = (sourceId: string, fitMode: 'contain' | 'cover' | 'fill' | 'auto') => {
    if (fitMode === 'auto') {
      setSourceFitModes(prev => {
        const updated = { ...prev };
        delete updated[sourceId];
        return updated;
      });
      toast({ 
        title: 'Fit mode reset', 
        description: `Using global ${globalFitMode} mode` 
      });
    } else {
      setSourceFitModes(prev => ({
        ...prev,
        [sourceId]: fitMode
      }));
      toast({ 
        title: 'Fit mode updated', 
        description: `Source using ${fitMode} mode` 
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
                      {activeSources.length} {activeSources.length === 1 ? 'Source' : 'Sources'}
                    </Badge>
                    {overlays.length > 0 && (
                      <Badge variant="outline" className="bg-primary/10">
                        {overlays.length} {overlays.length === 1 ? 'Overlay' : 'Overlays'}
                      </Badge>
                    )}
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
                    outputResolution={outputResolution}
                    globalFitMode={globalFitMode}
                    sourceFitModes={sourceFitModes}
                    overlays={overlays}
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

            <Card data-testid="card-output-settings">
              <Collapsible defaultOpen>
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full group hover-elevate rounded-md -mx-2 px-2 py-1">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      <CardTitle>Output Settings</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {outputResolution.width} × {outputResolution.height}
                    </Badge>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="output-resolution">Output Resolution</Label>
                      <Select 
                        value={`${outputResolution.width}x${outputResolution.height}`}
                        onValueChange={(value) => {
                          const [width, height] = value.split('x').map(Number);
                          setOutputResolution({ width, height });
                          toast({ 
                            title: 'Resolution updated', 
                            description: `${width} × ${height}` 
                          });
                        }}
                      >
                        <SelectTrigger id="output-resolution" data-testid="select-output-resolution">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1920x1080">1920×1080 (Full HD 16:9)</SelectItem>
                          <SelectItem value="1280x720">1280×720 (HD 16:9)</SelectItem>
                          <SelectItem value="1080x1080">1080×1080 (Square 1:1)</SelectItem>
                          <SelectItem value="2560x1440">2560×1440 (2K 16:9)</SelectItem>
                          <SelectItem value="3840x2160">3840×2160 (4K 16:9)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Current: {outputResolution.width} × {outputResolution.height}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fit-mode">Fit Mode</Label>
                      <Select 
                        value={globalFitMode}
                        onValueChange={(value: 'contain' | 'cover' | 'fill') => {
                          setGlobalFitMode(value);
                          toast({ 
                            title: 'Fit mode updated', 
                            description: value.charAt(0).toUpperCase() + value.slice(1)
                          });
                        }}
                      >
                        <SelectTrigger id="fit-mode" data-testid="select-fit-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contain">
                            <div className="space-y-1">
                              <div className="font-medium">Contain</div>
                              <div className="text-xs text-muted-foreground">Fit entire video, may have letterboxing</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="cover">
                            <div className="space-y-1">
                              <div className="font-medium">Cover</div>
                              <div className="text-xs text-muted-foreground">Fill entire space, may crop edges</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="fill">
                            <div className="space-y-1">
                              <div className="font-medium">Fill</div>
                              <div className="text-xs text-muted-foreground">Stretch to fill (may distort)</div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {globalFitMode === 'contain' && 'Fit entire video with letterboxing if needed'}
                        {globalFitMode === 'cover' && 'Fill space completely, may crop edges'}
                        {globalFitMode === 'fill' && 'Stretch video to fill (may distort aspect ratio)'}
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
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

            {overlays.length > 0 && (
              <Card data-testid="card-active-overlays">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Active Overlays
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Manage your broadcast overlays
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        className="flex items-center gap-3 p-3 bg-card rounded-md border hover-elevate group"
                        data-testid={`overlay-item-${overlay.id}`}
                      >
                        <div 
                          className="w-12 h-8 rounded flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: overlay.backgroundColor,
                            color: overlay.textColor,
                          }}
                        >
                          {overlay.position === 'top' ? 'TOP' : 'BOT'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{overlay.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {overlay.animationType} • {overlay.position}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleToggleOverlayVisibility(overlay.id)}
                            data-testid={`button-toggle-overlay-${overlay.id}`}
                          >
                            {overlay.visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditOverlay(overlay)}
                            data-testid={`button-edit-overlay-${overlay.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleRemoveOverlay(overlay.id)}
                            data-testid={`button-remove-overlay-${overlay.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                            sourceFitModes={sourceFitModes}
                            globalFitMode={globalFitMode}
                            onFitModeChange={handleSourceFitModeChange}
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
            <DialogTitle>
              {editingOverlayId ? 'Edit Overlay' : 'Create Branded Overlay'}
            </DialogTitle>
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
              <Label htmlFor="template-preset">Template Preset</Label>
              <Select value={selectedPreset} onValueChange={(v) => setSelectedPreset(v as keyof typeof TEMPLATE_PRESETS)}>
                <SelectTrigger id="template-preset" data-testid="select-template-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breaking-news">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C8102E' }} />
                      Breaking News (Red)
                    </div>
                  </SelectItem>
                  <SelectItem value="live-updates">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#002147' }} />
                      Live Updates (Navy)
                    </div>
                  </SelectItem>
                  <SelectItem value="match-info">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F6EB61' }} />
                      Match Info (Gold)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {TEMPLATE_PRESETS[selectedPreset].name} - {TEMPLATE_PRESETS[selectedPreset].animationType}
              </p>
            </div>

            <div>
              <Label>Position</Label>
              <RadioGroup value={overlayPosition} onValueChange={(v) => setOverlayPosition(v as 'top' | 'bottom')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top" id="position-top" data-testid="radio-position-top" />
                  <Label htmlFor="position-top" className="font-normal cursor-pointer">
                    Top of screen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom" id="position-bottom" data-testid="radio-position-bottom" />
                  <Label htmlFor="position-bottom" className="font-normal cursor-pointer">
                    Bottom of screen (Ticker style)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="font-family">Font Family</Label>
              <Select value={overlayFontFamily} onValueChange={setOverlayFontFamily}>
                <SelectTrigger id="font-family" data-testid="select-overlay-font">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="League Spartan">League Spartan (Bold)</SelectItem>
                  <SelectItem value="Libre Franklin">Libre Franklin</SelectItem>
                  <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scroll-speed">Scroll Speed: {overlayScrollSpeed}</Label>
              <Slider
                id="scroll-speed"
                min={1}
                max={100}
                step={1}
                value={[overlayScrollSpeed]}
                onValueChange={(vals) => setOverlayScrollSpeed(vals[0])}
                data-testid="slider-scroll-speed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                1 = Very Slow, 50 = Medium, 100 = Very Fast
              </p>
            </div>

            <div>
              <Label>Scroll Direction</Label>
              <RadioGroup 
                value={overlayScrollDirection} 
                onValueChange={(v) => setOverlayScrollDirection(v as 'left' | 'right' | 'up' | 'down')}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="dir-left" data-testid="radio-direction-left" />
                  <Label htmlFor="dir-left" className="font-normal cursor-pointer">← Left</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="dir-right" data-testid="radio-direction-right" />
                  <Label htmlFor="dir-right" className="font-normal cursor-pointer">Right →</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="up" id="dir-up" data-testid="radio-direction-up" />
                  <Label htmlFor="dir-up" className="font-normal cursor-pointer">↑ Up</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="down" id="dir-down" data-testid="radio-direction-down" />
                  <Label htmlFor="dir-down" className="font-normal cursor-pointer">Down ↓</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div 
                className="w-full rounded flex items-center justify-center py-2 px-4 text-sm font-bold"
                style={{
                  backgroundColor: TEMPLATE_PRESETS[selectedPreset].backgroundColor,
                  color: TEMPLATE_PRESETS[selectedPreset].textColor,
                  height: `${Math.min(TEMPLATE_PRESETS[selectedPreset].height / 2, 40)}px`,
                }}
              >
                {overlayText || 'Your text will appear here'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOverlayDialogOpen(false);
                setEditingOverlayId(null);
                setOverlayText('');
              }}
              data-testid="button-cancel-overlay"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddOverlay}
              data-testid="button-add-overlay"
            >
              {editingOverlayId ? 'Update Overlay' : 'Add Overlay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
