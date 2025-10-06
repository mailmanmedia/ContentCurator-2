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
  RectangleHorizontal,
  Upload,
  Images,
  AlertTriangle,
  Rss,
  BarChart3,
  Users,
  Target,
  Move,
  Trophy,
  ChevronDown,
  Circle,
  Pause,
  Download
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import VideoCompositor, { type VideoCompositorRef } from "@/components/VideoCompositor";
import { useCameraStreams } from "@/contexts/CameraStreamContext";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LiveState } from "@shared/schema";
import { overlayTemplates, getAllTemplateCategories, getTemplatesByCategory, type OverlayTemplate } from "@/lib/overlayTemplates";
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

interface LibraryImage {
  id: number;
  filename: string;
  filepath: string;
  url: string;
  thumbnail: string;
}

interface RssSource {
  id: string;
  name: string;
  feedUrl: string;
  isActive: boolean;
  category: string;
  description: string;
}

interface TeamWithStats {
  teamId: number;
  teamName: string;
  leagueId: number;
  season: number;
  lastUpdated: Date | null;
  matchesPlayed: number | null;
  form: string | null;
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
  isBold: boolean;
  isItalic: boolean;
  overlayType: 'text' | 'image' | 'rss' | 'video' | 'metric';
  imageUrl?: string;
  imageData?: string;
  rssSourceIds?: string[];
  rssMaxArticles?: number;
  rssShowSource?: boolean;
  width: number;
  zIndex: number;
  opacity: number;
  videoUrl?: string;
  metricType?: string;
  metricData?: any;
  x: number;
  y: number;
  category: string;
  borderWidth?: number;
  borderColor?: string;
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
    width: 100,
    zIndex: 100,
    opacity: 0.95,
    animationType: 'scroll' as const,
    position: 'bottom' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
    isBold: true,
    isItalic: false,
    overlayType: 'text' as const,
    borderWidth: 0,
    borderColor: '#000000',
  },
  'live-updates': {
    name: 'Live Updates',
    backgroundColor: '#002147',
    textColor: '#F6EB61',
    fontSize: 28,
    height: 70,
    width: 100,
    zIndex: 100,
    opacity: 0.9,
    animationType: 'scroll' as const,
    position: 'bottom' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
    isBold: true,
    isItalic: false,
    overlayType: 'text' as const,
    borderWidth: 0,
    borderColor: '#000000',
  },
  'match-info': {
    name: 'Match Info',
    backgroundColor: '#F6EB61',
    textColor: '#002147',
    fontSize: 32,
    height: 80,
    width: 100,
    zIndex: 150,
    opacity: 0.92,
    animationType: 'fade' as const,
    position: 'top' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
    isBold: true,
    isItalic: false,
    overlayType: 'text' as const,
    borderWidth: 0,
    borderColor: '#000000',
  },
  'rss-ticker': {
    name: 'RSS News Ticker',
    backgroundColor: '#C8102E',
    textColor: '#FFFFFF',
    fontSize: 24,
    height: 60,
    width: 100,
    zIndex: 200,
    opacity: 0.85,
    animationType: 'scroll' as const,
    position: 'bottom' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 40,
    scrollDirection: 'left' as const,
    isBold: true,
    isItalic: false,
    overlayType: 'rss' as const,
    rssMaxArticles: 10,
    rssShowSource: true,
    borderWidth: 0,
    borderColor: '#000000',
  },
  'mailman-red': {
    name: 'Mailman Red',
    backgroundColor: '#C8102E',
    textColor: '#FFFFFF',
    fontSize: 28,
    height: 70,
    width: 100,
    zIndex: 100,
    opacity: 0.95,
    animationType: 'scroll' as const,
    position: 'bottom' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
    isBold: true,
    isItalic: false,
    overlayType: 'text' as const,
    borderWidth: 0,
    borderColor: '#000000',
  },
  'mailman-gold': {
    name: 'Mailman Gold',
    backgroundColor: '#F7C54E',
    textColor: '#002147',
    fontSize: 28,
    height: 70,
    width: 100,
    zIndex: 100,
    opacity: 0.95,
    animationType: 'scroll' as const,
    position: 'bottom' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
    isBold: true,
    isItalic: false,
    overlayType: 'text' as const,
    borderWidth: 0,
    borderColor: '#000000',
  },
  'mailman-dark': {
    name: 'Mailman Dark',
    backgroundColor: '#002147',
    textColor: '#F6EB61',
    fontSize: 28,
    height: 70,
    width: 100,
    zIndex: 100,
    opacity: 0.95,
    animationType: 'scroll' as const,
    position: 'bottom' as const,
    fontFamily: 'League Spartan',
    scrollSpeed: 50,
    scrollDirection: 'left' as const,
    isBold: true,
    isItalic: false,
    overlayType: 'text' as const,
    borderWidth: 0,
    borderColor: '#000000',
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
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [needsPermission, setNeedsPermission] = useState(false);
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof TEMPLATE_PRESETS>('breaking-news');
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'bottom'>('bottom');
  const [overlayFontFamily, setOverlayFontFamily] = useState('League Spartan');
  const [overlayFontSize, setOverlayFontSize] = useState(28);
  const [overlayIsBold, setOverlayIsBold] = useState(true);
  const [overlayIsItalic, setOverlayIsItalic] = useState(false);
  const [overlayScrollSpeed, setOverlayScrollSpeed] = useState(50);
  const [overlayScrollDirection, setOverlayScrollDirection] = useState<'left' | 'right' | 'up' | 'down'>('left');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [outputResolution, setOutputResolution] = useState({ width: 3840, height: 2160 });
  const [globalFitMode, setGlobalFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [sourceFitModes, setSourceFitModes] = useState<Record<string, 'contain' | 'cover' | 'fill'>>({});
  const [overlayImageUrl, setOverlayImageUrl] = useState('');
  const [overlayImageData, setOverlayImageData] = useState('');
  const [overlayType, setOverlayType] = useState<'text' | 'image' | 'rss' | 'video' | 'metric'>('text');
  const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false);
  const [positionConflict, setPositionConflict] = useState(false);
  const [selectedRssSourceIds, setSelectedRssSourceIds] = useState<string[]>([]);
  const [rssMaxArticles, setRssMaxArticles] = useState(10);
  const [rssShowSource, setRssShowSource] = useState(true);
  const [overlayWidth, setOverlayWidth] = useState(100);
  const [overlayZIndex, setOverlayZIndex] = useState(100);
  const [overlayOpacity, setOverlayOpacity] = useState(0.95);
  const [overlayVideoUrl, setOverlayVideoUrl] = useState('');
  const [overlayMetricType, setOverlayMetricType] = useState('');
  const [overlayMetricData, setOverlayMetricData] = useState<any>(null);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('all');
  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
  const [editingPositionOverlayId, setEditingPositionOverlayId] = useState<string | null>(null);
  const [overlayX, setOverlayX] = useState(0);
  const [overlayY, setOverlayY] = useState(0);
  const [overlayHomeTeamId, setOverlayHomeTeamId] = useState<number | null>(null);
  const [overlayAwayTeamId, setOverlayAwayTeamId] = useState<number | null>(null);
  const [overlayTeamId, setOverlayTeamId] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false);
  const [overlayBorderWidth, setOverlayBorderWidth] = useState(0);
  const [overlayBorderColor, setOverlayBorderColor] = useState('#000000');
  const [gridScale, setGridScale] = useState(1);
  const [overlayHeight, setOverlayHeight] = useState(70);
  const [overlayAnimationType, setOverlayAnimationType] = useState<'scroll' | 'fade' | 'static'>('scroll');
  
  const { toast } = useToast();
  const { acquireStream, acquireScreenShare } = useCameraStreams();
  
  const compositorRef = useRef<VideoCompositorRef>(null);
  const canvasRef = compositorRef.current?.canvasRef || { current: null };
  const gridPreviewRef = useRef<HTMLDivElement>(null);
  
  const {
    isRecording,
    isPaused,
    duration,
    recordedBlob,
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    clearRecording,
    isMediaRecorderSupported,
    error: recordingError,
  } = useVideoRecorder(canvasRef);

  const { data: liveStateData } = useQuery<{ liveState: LiveState | null }>({
    queryKey: ['/api/live-state'],
  });

  const { data: libraryImages, isLoading: isLoadingImages } = useQuery<LibraryImage[]>({
    queryKey: ['/api/images'],
    enabled: isLibraryPickerOpen,
  });

  const { data: rssSources, isLoading: isLoadingRssSources } = useQuery<RssSource[]>({
    queryKey: ['/api/rss-sources'],
    enabled: overlayType === 'rss' && isOverlayDialogOpen,
  });

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery<{ teams: TeamWithStats[] }>({
    queryKey: ['/api/cached-stats/teams'],
    enabled: overlayType === 'metric' && isOverlayDialogOpen,
  });

  const checkPositionConflict = (position: 'top' | 'bottom', excludeId?: string): boolean => {
    return overlays.some(overlay => 
      overlay.position === position && 
      overlay.id !== excludeId
    );
  };

  const getDefaultCoordinatesAndCategory = (position: 'top' | 'bottom', overlayType: string, metricType?: string): { x: number; y: number; category: string } => {
    const defaultY = position === 'top' ? 0 : 1000;
    const defaultX = 0;
    
    let category = 'graphics';
    if (overlayType === 'rss') {
      category = 'news';
    } else if (overlayType === 'metric') {
      if (metricType?.includes('match') || metricType?.includes('score')) {
        category = 'match-stats';
      } else if (metricType?.includes('team')) {
        category = 'team-info';
      } else if (metricType?.includes('player')) {
        category = 'player-stats';
      } else {
        category = 'match-stats';
      }
    }
    
    return { x: defaultX, y: defaultY, category };
  };

  const groupOverlaysByCategory = () => {
    const categories = {
      'match-stats': [] as OverlayConfig[],
      'team-info': [] as OverlayConfig[],
      'player-stats': [] as OverlayConfig[],
      'news': [] as OverlayConfig[],
      'graphics': [] as OverlayConfig[],
    };

    overlays.forEach(overlay => {
      const category = overlay.category || 'graphics';
      if (categories[category as keyof typeof categories]) {
        categories[category as keyof typeof categories].push(overlay);
      } else {
        categories['graphics'].push(overlay);
      }
    });

    return categories;
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      'match-stats': { icon: BarChart3, label: 'Match Statistics' },
      'team-info': { icon: Trophy, label: 'Team Information' },
      'player-stats': { icon: Users, label: 'Player Statistics' },
      'news': { icon: Rss, label: 'News & Updates' },
      'graphics': { icon: Layers, label: 'Graphics & Overlays' },
    };
    return categoryMap[category as keyof typeof categoryMap] || { icon: Layers, label: 'Other' };
  };

  useEffect(() => {
    const detectCameras = async () => {
      try {
        // First, try to enumerate without requesting permissions
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        // iOS returns empty array before permissions - treat as needing permission
        if (videoDevices.length === 0) {
          setNeedsPermission(true);
          setCameraPermissionStatus('prompt');
          setCameras([]);
          return;
        }
        
        // Check if we have devices but no labels (means we need permissions)
        if (videoDevices.length > 0 && !videoDevices[0].label) {
          setNeedsPermission(true);
          setCameraPermissionStatus('prompt');
          setCameras(videoDevices);
          return;
        }
        
        // If we have labels, permissions are already granted
        if (videoDevices.length > 0 && videoDevices[0].label) {
          setCameraPermissionStatus('granted');
          setNeedsPermission(false);
          setCameras(videoDevices);
          return;
        }
      } catch (err) {
        console.error('Camera detection error:', err);
        setNeedsPermission(true);
        setCameraPermissionStatus('prompt');
      }
    };

    detectCameras();
    navigator.mediaDevices.addEventListener('devicechange', detectCameras);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', detectCameras);
    };
  }, []);

  const requestCameraPermissions = async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop());
      
      // Re-enumerate to get device labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
      setCameraPermissionStatus('granted');
      setNeedsPermission(false);
      
      toast({
        title: "Camera Access Granted",
        description: `Found ${videoDevices.length} camera(s)`,
      });
    } catch (err: any) {
      console.error('Permission request error:', err);
      setCameraPermissionStatus('denied');
      toast({
        title: "Camera Access Denied",
        description: err.message || "Please enable camera access in your browser settings.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isOverlayDialogOpen) {
      const conflict = checkPositionConflict(
        overlayPosition, 
        editingOverlayId || undefined
      );
      setPositionConflict(conflict);
    }
  }, [overlayPosition, overlays, isOverlayDialogOpen, editingOverlayId]);

  useEffect(() => {
    if (overlayType === 'rss' && rssSources && rssSources.length > 0 && !editingOverlayId) {
      const activeSourceIds = rssSources
        .filter(source => source.isActive)
        .map(source => source.id);
      
      if (activeSourceIds.length > 0 && selectedRssSourceIds.length === 0) {
        setSelectedRssSourceIds(activeSourceIds);
      }
    }
  }, [overlayType, rssSources, editingOverlayId, selectedRssSourceIds.length]);

  useEffect(() => {
    if (liveStateData?.liveState) {
      const state = liveStateData.liveState;
      if (state.activeSources) setActiveSources(JSON.parse(state.activeSources as any));
      if (state.overlays) setOverlays(JSON.parse(state.overlays as any));
      if (state.outputResolution) setOutputResolution(JSON.parse(state.outputResolution as any));
      if (state.globalFitMode) setGlobalFitMode(state.globalFitMode as any);
      if (state.sourceFitModes) setSourceFitModes(JSON.parse(state.sourceFitModes as any));
      if (state.isBroadcasting !== undefined) setIsBroadcasting(state.isBroadcasting);
    }
  }, [liveStateData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      apiRequest('PATCH', '/api/live-state', {
        activeSources: JSON.stringify(activeSources),
        overlays: JSON.stringify(overlays),
        outputResolution: JSON.stringify(outputResolution),
        globalFitMode,
        sourceFitModes: JSON.stringify(sourceFitModes),
        isBroadcasting,
      }).catch(err => console.error('Failed to save live state:', err));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [activeSources, overlays, outputResolution, globalFitMode, sourceFitModes, isBroadcasting]);

  useEffect(() => {
    if (!gridPreviewRef.current || !isPositionEditorOpen) return;
    
    const updateGridScale = () => {
      const rect = gridPreviewRef.current?.getBoundingClientRect();
      if (rect) {
        const scale = rect.width / outputResolution.width;
        setGridScale(scale);
      }
    };
    
    updateGridScale();
    
    const resizeObserver = new ResizeObserver(updateGridScale);
    if (gridPreviewRef.current) {
      resizeObserver.observe(gridPreviewRef.current);
    }
    
    window.addEventListener('resize', updateGridScale);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateGridScale);
    };
  }, [outputResolution.width, isPositionEditorOpen]);

  useEffect(() => {
    // Only apply preset defaults when creating new overlays, not when editing
    if (selectedPreset && TEMPLATE_PRESETS[selectedPreset] && !editingOverlayId) {
      const preset = TEMPLATE_PRESETS[selectedPreset];
      setOverlayHeight(preset.height || 80);
      setOverlayAnimationType(preset.animationType || 'scroll');
    }
  }, [selectedPreset, editingOverlayId]);

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
      setOverlayFontSize(28);
      setOverlayIsBold(true);
      setOverlayIsItalic(false);
      setOverlayScrollSpeed(50);
      setOverlayScrollDirection('left');
      setOverlayImageUrl('');
      setOverlayImageData('');
      setOverlayType('text');
      setSelectedRssSourceIds([]);
      setRssMaxArticles(10);
      setRssShowSource(true);
      setIsOverlayDialogOpen(true);
    } else if (value === 'rss-ticker') {
      setEditingOverlayId(null);
      setOverlayText('');
      setSelectedPreset('rss-ticker');
      setOverlayPosition('bottom');
      setOverlayFontFamily('League Spartan');
      setOverlayFontSize(24);
      setOverlayIsBold(true);
      setOverlayIsItalic(false);
      setOverlayScrollSpeed(40);
      setOverlayScrollDirection('left');
      setOverlayImageUrl('');
      setOverlayImageData('');
      setOverlayType('rss');
      setSelectedRssSourceIds([]);
      setRssMaxArticles(10);
      setRssShowSource(true);
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
      toast({ 
        title: 'Screen mirroring active', 
        description: 'Your screen is now visible in the broadcast feed. Mark images and annotations will appear live!' 
      });
    } catch (err) {
      console.error('Failed to add screen share:', err);
      toast({ 
        title: 'Screen sharing cancelled', 
        description: 'On iPad: Select "Entire Screen" or "Safari" to mirror your display',
        variant: 'destructive' 
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG, JPEG, GIF, or WEBP image',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setOverlayImageData(base64);
      setOverlayType('image');
      setOverlayImageUrl('');
      toast({
        title: 'Image uploaded',
        description: file.name
      });
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  };

  const handleLibraryImageSelect = (imageUrl: string) => {
    setOverlayImageUrl(imageUrl);
    setOverlayType('image');
    setOverlayImageData('');
    setIsLibraryPickerOpen(false);
    toast({
      title: 'Library image selected'
    });
  };

  const handleRemoveImage = () => {
    setOverlayImageUrl('');
    setOverlayImageData('');
    setOverlayType('text');
    toast({
      title: 'Image removed'
    });
  };

  const handleAddOverlay = () => {
    if (!overlayText.trim() && overlayType === 'text') {
      toast({ 
        title: 'Enter overlay text', 
        variant: 'destructive' 
      });
      return;
    }

    if (overlayType === 'rss' && selectedRssSourceIds.length === 0) {
      toast({ 
        title: 'Select at least one RSS source', 
        variant: 'destructive' 
      });
      return;
    }

    if (overlayType === 'metric') {
      if (overlayMetricType === 'h2h-card' && (!overlayHomeTeamId || !overlayAwayTeamId)) {
        toast({ 
          title: 'Select both teams', 
          description: 'Please select both home and away teams for the H2H card.',
          variant: 'destructive' 
        });
        return;
      }
      if (overlayMetricType === 'form-guide' && !overlayTeamId) {
        toast({ 
          title: 'Select a team', 
          description: 'Please select a team for the form guide.',
          variant: 'destructive' 
        });
        return;
      }
    }

    if (!editingOverlayId && checkPositionConflict(overlayPosition)) {
      toast({ 
        title: `An overlay already exists at ${overlayPosition} position.`,
        description: 'Please remove it first or choose a different position.',
        variant: 'destructive' 
      });
      return;
    }

    if (editingOverlayId && checkPositionConflict(overlayPosition, editingOverlayId)) {
      toast({ 
        title: `An overlay already exists at ${overlayPosition} position.`,
        description: 'Please remove it first or choose a different position.',
        variant: 'destructive' 
      });
      return;
    }

    const preset = TEMPLATE_PRESETS[selectedPreset];
    const { x: defaultX, y: defaultY, category: defaultCategory } = getDefaultCoordinatesAndCategory(
      overlayPosition, 
      overlayType, 
      overlayMetricType
    );
    
    let metricDataToSave: any = null;
    if (overlayType === 'metric') {
      if (overlayMetricType === 'h2h-card') {
        metricDataToSave = {
          homeTeamId: overlayHomeTeamId,
          awayTeamId: overlayAwayTeamId,
        };
      } else if (overlayMetricType === 'form-guide') {
        metricDataToSave = {
          teamId: overlayTeamId,
        };
      }
    }
    
    if (editingOverlayId) {
      setOverlays(prev => prev.map(overlay => 
        overlay.id === editingOverlayId
          ? {
              ...overlay,
              text: overlayText,
              backgroundColor: preset.backgroundColor,
              textColor: preset.textColor,
              fontSize: overlayFontSize,
              height: overlayHeight,
              animationType: overlayAnimationType,
              position: overlayPosition,
              fontFamily: overlayFontFamily,
              scrollSpeed: overlayScrollSpeed,
              scrollDirection: overlayScrollDirection,
              isBold: overlayIsBold,
              isItalic: overlayIsItalic,
              overlayType: overlayType,
              imageUrl: overlayImageUrl || undefined,
              imageData: overlayImageData || undefined,
              rssSourceIds: overlayType === 'rss' ? selectedRssSourceIds : undefined,
              rssMaxArticles: overlayType === 'rss' ? rssMaxArticles : undefined,
              rssShowSource: overlayType === 'rss' ? rssShowSource : undefined,
              width: overlayWidth,
              zIndex: overlayZIndex,
              opacity: overlayOpacity,
              videoUrl: overlayVideoUrl || undefined,
              metricType: overlayMetricType || undefined,
              metricData: metricDataToSave,
              x: overlay.position !== overlayPosition ? defaultX : overlay.x,
              y: overlay.position !== overlayPosition ? defaultY : overlay.y,
              category: defaultCategory,
              borderWidth: overlayBorderWidth,
              borderColor: overlayBorderColor,
            }
          : overlay
      ));
      toast({ title: 'Overlay updated' });
    } else {
      const newOverlay: OverlayConfig = {
        id: `overlay-${Date.now()}`,
        text: overlayText,
        animationType: overlayAnimationType,
        templateStyle: 'ticker',
        backgroundColor: preset.backgroundColor,
        textColor: preset.textColor,
        fontSize: overlayFontSize,
        position: overlayPosition,
        height: overlayHeight,
        visible: true,
        fontFamily: overlayFontFamily,
        scrollSpeed: overlayScrollSpeed,
        scrollDirection: overlayScrollDirection,
        isBold: overlayIsBold,
        isItalic: overlayIsItalic,
        overlayType: overlayType,
        imageUrl: overlayImageUrl || undefined,
        imageData: overlayImageData || undefined,
        width: overlayWidth,
        zIndex: overlayZIndex,
        opacity: overlayOpacity,
        videoUrl: overlayVideoUrl || undefined,
        metricType: overlayMetricType || undefined,
        metricData: metricDataToSave,
        x: defaultX,
        y: defaultY,
        category: defaultCategory,
        borderWidth: overlayBorderWidth,
        borderColor: overlayBorderColor,
      };

      if (overlayType === 'rss') {
        newOverlay.rssSourceIds = selectedRssSourceIds;
        newOverlay.rssMaxArticles = rssMaxArticles;
        newOverlay.rssShowSource = rssShowSource;
      }

      setOverlays(prev => [...prev, newOverlay]);
      toast({ title: 'Overlay added', description: preset.name });
    }
    
    setIsOverlayDialogOpen(false);
    setOverlayText('');
    setOverlayImageUrl('');
    setOverlayImageData('');
    setOverlayType('text');
    setSelectedRssSourceIds([]);
    setRssMaxArticles(10);
    setRssShowSource(true);
    setOverlayHomeTeamId(null);
    setOverlayAwayTeamId(null);
    setOverlayTeamId(null);
    setOverlayMetricType('');
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
    setOverlayFontSize(overlay.fontSize);
    setOverlayIsBold(overlay.isBold);
    setOverlayIsItalic(overlay.isItalic);
    setOverlayScrollSpeed(overlay.scrollSpeed);
    setOverlayScrollDirection(overlay.scrollDirection);
    setOverlayType(overlay.overlayType);
    setOverlayImageUrl(overlay.imageUrl || '');
    setOverlayImageData(overlay.imageData || '');
    setOverlayWidth(overlay.width || 100);
    setOverlayZIndex(overlay.zIndex || 100);
    setOverlayOpacity(overlay.opacity !== undefined ? overlay.opacity : 0.95);
    setOverlayVideoUrl(overlay.videoUrl || '');
    setOverlayMetricType(overlay.metricType || '');
    setOverlayMetricData(overlay.metricData || null);
    setOverlayBorderWidth(overlay.borderWidth || 0);
    setOverlayBorderColor(overlay.borderColor || '#000000');
    setOverlayHeight(overlay.height || 70);
    setOverlayAnimationType(overlay.animationType || 'scroll');
    
    if (overlay.overlayType === 'rss') {
      setSelectedRssSourceIds(overlay.rssSourceIds || []);
      setRssMaxArticles(overlay.rssMaxArticles || 10);
      setRssShowSource(overlay.rssShowSource !== undefined ? overlay.rssShowSource : true);
    }
    
    if (overlay.overlayType === 'metric' && overlay.metricData) {
      if (overlay.metricType === 'h2h-card') {
        setOverlayHomeTeamId(overlay.metricData.homeTeamId || null);
        setOverlayAwayTeamId(overlay.metricData.awayTeamId || null);
      } else if (overlay.metricType === 'form-guide') {
        setOverlayTeamId(overlay.metricData.teamId || null);
      }
    }
    
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

  const snapToGrid = (value: number, gridSize: number = 20): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  const handleOpenPositionEditor = (overlayId: string) => {
    const overlay = overlays.find(o => o.id === overlayId);
    if (overlay) {
      setEditingPositionOverlayId(overlayId);
      setOverlayX(overlay.x);
      setOverlayY(overlay.y);
      setIsPositionEditorOpen(true);
    }
  };

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = outputResolution.width / rect.width;
    const scaleY = outputResolution.height / rect.height;
    
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;
    
    const snappedX = snapToGrid(rawX);
    const snappedY = snapToGrid(rawY);
    
    setOverlayX(snappedX);
    setOverlayY(snappedY);
  };

  const handleUpdatePosition = () => {
    if (!editingPositionOverlayId) return;
    
    const snappedX = snapToGrid(overlayX);
    const snappedY = snapToGrid(overlayY);
    
    setOverlays(prev => prev.map(overlay =>
      overlay.id === editingPositionOverlayId
        ? { ...overlay, x: snappedX, y: snappedY }
        : overlay
    ));
    
    toast({
      title: 'Position updated',
      description: `Overlay positioned at (${snappedX}, ${snappedY})`
    });
    
    setIsPositionEditorOpen(false);
    setEditingPositionOverlayId(null);
  };

  const handlePositionInputChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(numValue, axis === 'x' ? outputResolution.width : outputResolution.height));
    
    if (axis === 'x') {
      setOverlayX(clampedValue);
    } else {
      setOverlayY(clampedValue);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast({
        title: "Recording Started",
        description: "Your broadcast is now being recorded",
      });
    } catch (err: any) {
      toast({
        title: "Recording Failed",
        description: err.message || "Failed to start recording",
        variant: "destructive"
      });
    }
  };

  const handleClearRecording = () => {
    if (recordedBlob) {
      setShowClearConfirmDialog(true);
    } else {
      clearRecording();
    }
  };

  const confirmClearRecording = () => {
    clearRecording();
    setShowClearConfirmDialog(false);
    toast({
      title: "Recording Cleared",
      description: "Ready to start a new recording",
    });
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
            {!isMediaRecorderSupported && (
              <Alert variant="destructive" data-testid="alert-no-media-recorder">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Video recording is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.
                </AlertDescription>
              </Alert>
            )}

            {recordingError && (
              <Alert variant="destructive" data-testid="alert-recording-error">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {recordingError}
                </AlertDescription>
              </Alert>
            )}

            <Card data-testid="card-recording-controls">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Recording Controls</CardTitle>
                    {isRecording && (
                      <Badge 
                        className="gap-2 bg-[#C8102E] text-white hover:bg-[#C8102E] animate-pulse"
                        data-testid="badge-recording"
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                        RECORDING
                      </Badge>
                    )}
                    {isPaused && (
                      <Badge variant="outline" data-testid="badge-paused">
                        PAUSED
                      </Badge>
                    )}
                    {recordingState === 'stopped' && recordedBlob && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400" data-testid="badge-ready">
                        READY TO DOWNLOAD
                      </Badge>
                    )}
                  </div>
                  
                  {(isRecording || isPaused) && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <span 
                        className="text-lg font-mono font-bold"
                        data-testid="text-duration"
                      >
                        {formatDuration(duration)}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {recordingState === 'idle' && (
                    <Button
                      onClick={handleStartRecording}
                      disabled={!isMediaRecorderSupported}
                      className="bg-[#C8102E] hover:bg-[#A00E26]"
                      data-testid="button-start-recording"
                    >
                      <Circle className="w-4 h-4 mr-2 fill-current" />
                      Start Recording
                    </Button>
                  )}
                  
                  {isRecording && (
                    <>
                      <Button
                        onClick={stopRecording}
                        variant="outline"
                        data-testid="button-stop-recording"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                      <Button
                        onClick={pauseRecording}
                        variant="outline"
                        data-testid="button-pause-recording"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    </>
                  )}
                  
                  {isPaused && (
                    <>
                      <Button
                        onClick={resumeRecording}
                        className="bg-[#C8102E] hover:bg-[#A00E26]"
                        data-testid="button-resume-recording"
                      >
                        <Circle className="w-4 h-4 mr-2 fill-current" />
                        Resume
                      </Button>
                      <Button
                        onClick={stopRecording}
                        variant="outline"
                        data-testid="button-stop-recording"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                  
                  {recordingState === 'stopped' && recordedBlob && (
                    <>
                      <Button
                        onClick={() => downloadRecording()}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-download-recording"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Recording
                      </Button>
                      <Button
                        onClick={handleClearRecording}
                        variant="outline"
                        data-testid="button-clear-recording"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </>
                  )}
                  
                  {(isRecording || isPaused) && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Recording at {outputResolution.width}×{outputResolution.height}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

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
                    ref={compositorRef}
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
                    {needsPermission && (
                      <div className="p-2">
                        <Button 
                          onClick={requestCameraPermissions} 
                          className="w-full"
                          size="sm"
                          data-testid="button-request-camera-permission"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Enable Camera Access
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {cameras.length === 0 
                            ? "Camera devices will appear after granting access" 
                            : "Click to allow camera access (required for iOS devices)"}
                        </p>
                      </div>
                    )}
                    {needsPermission && <SelectSeparator />}
                    {cameras.length > 0 && !needsPermission && (
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
                    <SelectGroup>
                      <SelectLabel>Screen Mirroring</SelectLabel>
                      <SelectItem value="screen-share" data-testid="select-screen-share">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            <span className="font-medium">Mirror Your Screen</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-6">
                            Works on iPad, iPhone, desktop (Safari/Chrome)
                          </span>
                        </div>
                      </SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectItem value="branded-overlay" data-testid="select-branded-overlay">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Mailman Media Overlay
                      </div>
                    </SelectItem>
                    <SelectItem value="rss-ticker" data-testid="select-rss-ticker">
                      <div className="flex items-center gap-2">
                        <Rss className="w-4 h-4" />
                        RSS Feed Ticker
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setIsTemplatePickerOpen(true)}
                  className="w-full mt-4"
                  variant="outline"
                  data-testid="button-browse-overlay-templates"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Browse Overlay Templates
                </Button>
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
                    Manage your broadcast overlays by category
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(groupOverlaysByCategory()).map(([category, categoryOverlays]) => {
                      if (categoryOverlays.length === 0) return null;
                      
                      const categoryInfo = getCategoryInfo(category);
                      const CategoryIcon = categoryInfo.icon;
                      const isCollapsed = collapsedCategories[category];
                      
                      return (
                        <Collapsible
                          key={category}
                          open={!isCollapsed}
                          onOpenChange={() => toggleCategory(category)}
                        >
                          <div className="border rounded-md">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-between p-3 h-auto hover-elevate"
                                data-testid={`button-toggle-category-${category}`}
                              >
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="w-4 h-4 text-primary" />
                                  <span className="font-medium">{categoryInfo.label}</span>
                                  <Badge variant="outline" className="bg-primary/10">
                                    {categoryOverlays.length}
                                  </Badge>
                                </div>
                                <ChevronDown 
                                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                                    isCollapsed ? '-rotate-90' : ''
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="space-y-2 p-3 pt-0">
                                {categoryOverlays.map((overlay) => (
                                  <div
                                    key={overlay.id}
                                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border hover-elevate group"
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
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {overlay.overlayType === 'rss' ? (
                                          <>
                                            <Rss className="w-4 h-4 text-primary" />
                                            <p className="text-sm font-medium">RSS Feed Ticker</p>
                                          </>
                                        ) : overlay.overlayType === 'metric' ? (
                                          <>
                                            <BarChart3 className="w-4 h-4 text-primary" />
                                            <p className="text-sm font-medium">
                                              {overlay.metricType === 'h2h-card' ? 'H2H Match Card' :
                                               overlay.metricType === 'form-guide' ? 'Form Guide' :
                                               overlay.metricType === 'league-table' ? 'League Table' :
                                               overlay.metricType === 'rss-sentiment' ? 'RSS Sentiment' :
                                               'Metric Overlay'}
                                            </p>
                                          </>
                                        ) : (
                                          <p className="text-sm font-medium truncate">{overlay.text}</p>
                                        )}
                                        <Badge 
                                          variant="outline"
                                          className="bg-primary/10"
                                          data-testid={`badge-coordinates-${overlay.id}`}
                                        >
                                          ({overlay.x}, {overlay.y})
                                        </Badge>
                                        {overlay.overlayType === 'rss' && overlay.rssSourceIds && (
                                          <Badge variant="outline" className="bg-primary/10">
                                            {overlay.rssSourceIds.length} {overlay.rssSourceIds.length === 1 ? 'source' : 'sources'}
                                          </Badge>
                                        )}
                                        {overlay.overlayType === 'rss' && overlay.rssMaxArticles && (
                                          <Badge variant="outline" className="bg-primary/10">
                                            Max: {overlay.rssMaxArticles} articles
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {overlay.animationType}
                                        {overlay.overlayType === 'rss' && overlay.rssShowSource && ' • Shows source names'}
                                        {overlay.overlayType === 'metric' && overlay.metricData && (
                                          <>
                                            {overlay.metricType === 'h2h-card' && overlay.metricData.homeTeamId && overlay.metricData.awayTeamId && (
                                              <span> • {teamsData?.teams.find(t => t.teamId === overlay.metricData.homeTeamId)?.teamName || `Team ${overlay.metricData.homeTeamId}`} vs {teamsData?.teams.find(t => t.teamId === overlay.metricData.awayTeamId)?.teamName || `Team ${overlay.metricData.awayTeamId}`}</span>
                                            )}
                                            {overlay.metricType === 'form-guide' && overlay.metricData.teamId && (
                                              <span> • {teamsData?.teams.find(t => t.teamId === overlay.metricData.teamId)?.teamName || `Team ${overlay.metricData.teamId}`}</span>
                                            )}
                                          </>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => handleOpenPositionEditor(overlay.id)}
                                        data-testid={`button-reposition-overlay-${overlay.id}`}
                                      >
                                        <Move className="w-4 h-4" />
                                      </Button>
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
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
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
        <DialogContent data-testid="dialog-overlay-config" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOverlayId 
                ? 'Edit Overlay' 
                : overlayType === 'rss' 
                  ? 'Add RSS Feed Ticker'
                  : overlayType === 'image'
                    ? 'Add Image Overlay'
                    : 'Add Text Overlay'}
            </DialogTitle>
            <DialogDescription>
              {overlayType === 'rss' 
                ? 'Configure your RSS news ticker with live headlines'
                : 'Customize your Mailman Media overlay with Liverpool FC branding'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {overlayType === 'text' && (
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
            )}

            {overlayType === 'rss' && (
              <>
                <div>
                  <Label>Select RSS Sources</Label>
                  {isLoadingRssSources ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Loading RSS sources...</p>
                    </div>
                  ) : rssSources && rssSources.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto p-3 border rounded-md" data-testid="checklist-rss-sources">
                      {rssSources.map((source) => (
                        <div key={source.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rss-source-${source.id}`}
                            checked={selectedRssSourceIds.includes(source.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRssSourceIds(prev => [...prev, source.id]);
                              } else {
                                setSelectedRssSourceIds(prev => prev.filter(id => id !== source.id));
                              }
                            }}
                            data-testid={`checkbox-rss-source-${source.id}`}
                          />
                          <Label
                            htmlFor={`rss-source-${source.id}`}
                            className="flex items-center gap-2 font-normal cursor-pointer flex-1"
                          >
                            <span className="flex-1">{source.name}</span>
                            <Badge 
                              variant={source.isActive ? "default" : "secondary"}
                              className={source.isActive ? "bg-green-500 text-white" : ""}
                            >
                              {source.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert data-testid="alert-no-rss-sources">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No RSS sources available. Please add RSS sources first.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <Label htmlFor="rss-max-articles">Max Headlines: {rssMaxArticles}</Label>
                  <Slider
                    id="rss-max-articles"
                    min={1}
                    max={20}
                    step={1}
                    value={[rssMaxArticles]}
                    onValueChange={(vals) => setRssMaxArticles(vals[0])}
                    data-testid="slider-rss-max-articles"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of headlines to display in the ticker
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rss-show-source"
                    checked={rssShowSource}
                    onCheckedChange={(checked) => setRssShowSource(checked === true)}
                    data-testid="checkbox-rss-show-source"
                  />
                  <Label htmlFor="rss-show-source" className="font-normal cursor-pointer">
                    Show Source Names
                  </Label>
                </div>
              </>
            )}

            {overlayType === 'metric' && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3">Content Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="metric-type">Metric Type</Label>
                      <Select 
                        value={overlayMetricType} 
                        onValueChange={setOverlayMetricType}
                      >
                        <SelectTrigger id="metric-type" data-testid="select-metric-type">
                          <SelectValue placeholder="Select metric type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="h2h-card">Head-to-Head Card</SelectItem>
                          <SelectItem value="form-guide">Form Guide</SelectItem>
                          <SelectItem value="league-table">League Table</SelectItem>
                          <SelectItem value="rss-sentiment">RSS Sentiment</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose the type of metric overlay to display
                      </p>
                    </div>

                    {overlayMetricType === 'h2h-card' && (
                      <>
                        {isLoadingTeams ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Loading teams...</p>
                          </div>
                        ) : teamsData && teamsData.teams && teamsData.teams.length > 0 ? (
                          <>
                            <div>
                              <Label htmlFor="home-team">Home Team</Label>
                              <Select 
                                value={overlayHomeTeamId ? String(overlayHomeTeamId) : undefined} 
                                onValueChange={(v) => setOverlayHomeTeamId(parseInt(v))}
                              >
                                <SelectTrigger id="home-team" data-testid="select-home-team">
                                  <SelectValue placeholder="Select home team" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teamsData.teams.map((team) => (
                                    <SelectItem key={team.teamId} value={String(team.teamId)}>
                                      {team.teamName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                The home team in the matchup
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="away-team">Away Team</Label>
                              <Select 
                                value={overlayAwayTeamId ? String(overlayAwayTeamId) : undefined} 
                                onValueChange={(v) => setOverlayAwayTeamId(parseInt(v))}
                              >
                                <SelectTrigger id="away-team" data-testid="select-away-team">
                                  <SelectValue placeholder="Select away team" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teamsData.teams.map((team) => (
                                    <SelectItem key={team.teamId} value={String(team.teamId)}>
                                      {team.teamName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                The away team in the matchup
                              </p>
                            </div>
                          </>
                        ) : (
                          <Alert data-testid="alert-no-teams">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              No teams available. Please ensure teams have cached statistics.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}

                    {overlayMetricType === 'form-guide' && (
                      <>
                        {isLoadingTeams ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Loading teams...</p>
                          </div>
                        ) : teamsData && teamsData.teams && teamsData.teams.length > 0 ? (
                          <div>
                            <Label htmlFor="team">Team</Label>
                            <Select 
                              value={overlayTeamId ? String(overlayTeamId) : undefined} 
                              onValueChange={(v) => setOverlayTeamId(parseInt(v))}
                            >
                              <SelectTrigger id="team" data-testid="select-team">
                                <SelectValue placeholder="Select team" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamsData.teams.map((team) => (
                                  <SelectItem key={team.teamId} value={String(team.teamId)}>
                                    {team.teamName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              The team whose form guide will be displayed
                            </p>
                          </div>
                        ) : (
                          <Alert data-testid="alert-no-teams">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              No teams available. Please ensure teams have cached statistics.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}

                    {(overlayMetricType === 'league-table' || overlayMetricType === 'rss-sentiment') && (
                      <Alert>
                        <AlertDescription>
                          {overlayMetricType === 'league-table' 
                            ? 'League Table shows all teams automatically - no team selection needed.'
                            : 'RSS Sentiment displays aggregated news sentiment - no team selection needed.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="template-preset">Template Preset</Label>
              <Select value={selectedPreset} onValueChange={(v) => setSelectedPreset(v as keyof typeof TEMPLATE_PRESETS)}>
                <SelectTrigger id="template-preset" data-testid="select-template-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {overlayType === 'text' && (
                    <>
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
                      <SelectSeparator />
                      <SelectItem value="mailman-red">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C8102E' }} />
                          Mailman Red
                        </div>
                      </SelectItem>
                      <SelectItem value="mailman-gold">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F7C54E' }} />
                          Mailman Gold
                        </div>
                      </SelectItem>
                      <SelectItem value="mailman-dark">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#002147' }} />
                          Mailman Dark
                        </div>
                      </SelectItem>
                    </>
                  )}
                  {overlayType === 'rss' && (
                    <SelectItem value="rss-ticker">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C8102E' }} />
                        RSS News Ticker (Red)
                      </div>
                    </SelectItem>
                  )}
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
              
              {positionConflict && (
                <Alert variant="destructive" className="mt-3" data-testid="alert-position-conflict">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ Position conflict: An overlay already exists at this position
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Label htmlFor="overlay-width">Width: {overlayWidth}%</Label>
              <Slider
                id="overlay-width"
                min={10}
                max={100}
                step={5}
                value={[overlayWidth]}
                onValueChange={(vals) => setOverlayWidth(vals[0])}
                data-testid="slider-overlay-width"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Overlay width as percentage of screen (10% - 100%)
              </p>
            </div>

            <div>
              <Label htmlFor="overlay-height">Height: {overlayHeight}px</Label>
              <Slider
                id="overlay-height"
                min={30}
                max={300}
                step={10}
                value={[overlayHeight]}
                onValueChange={(vals) => setOverlayHeight(vals[0])}
                data-testid="slider-overlay-height"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Overlay height in pixels (30px - 300px)
              </p>
            </div>

            <div>
              <Label htmlFor="animation-type">Animation Type</Label>
              <Select value={overlayAnimationType} onValueChange={(v) => setOverlayAnimationType(v as 'scroll' | 'fade' | 'static')}>
                <SelectTrigger id="animation-type" data-testid="select-animation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scroll">Scrolling</SelectItem>
                  <SelectItem value="fade">Fade In/Out</SelectItem>
                  <SelectItem value="static">Static (No Animation)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                How the overlay appears and behaves
              </p>
            </div>

            <div>
              <Label htmlFor="overlay-zindex">Z-Index (Layer Order): {overlayZIndex}</Label>
              <Slider
                id="overlay-zindex"
                min={0}
                max={1000}
                step={10}
                value={[overlayZIndex]}
                onValueChange={(vals) => setOverlayZIndex(vals[0])}
                data-testid="slider-overlay-zindex"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher values appear on top (0-1000)
              </p>
            </div>

            <div>
              <Label htmlFor="overlay-opacity">Opacity: {(overlayOpacity * 100).toFixed(0)}%</Label>
              <Slider
                id="overlay-opacity"
                min={0}
                max={1}
                step={0.05}
                value={[overlayOpacity]}
                onValueChange={(vals) => setOverlayOpacity(vals[0])}
                data-testid="slider-overlay-opacity"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Transparency of overlay (0% = invisible, 100% = opaque)
              </p>
            </div>

            {(overlayType === 'text' || overlayType === 'rss') && (
              <>
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
                  <Label htmlFor="font-size">Font Size: {overlayFontSize}px</Label>
                  <Slider
                    id="font-size"
                    min={12}
                    max={144}
                    step={1}
                    value={[overlayFontSize]}
                    onValueChange={(vals) => setOverlayFontSize(vals[0])}
                    data-testid="slider-overlay-font-size"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Adjust the text size from 12px to 144px
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overlay-bold"
                      checked={overlayIsBold}
                      onCheckedChange={(checked) => setOverlayIsBold(checked === true)}
                      data-testid="checkbox-overlay-bold"
                    />
                    <Label htmlFor="overlay-bold" className="font-normal cursor-pointer">
                      Bold
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overlay-italic"
                      checked={overlayIsItalic}
                      onCheckedChange={(checked) => setOverlayIsItalic(checked === true)}
                      data-testid="checkbox-overlay-italic"
                    />
                    <Label htmlFor="overlay-italic" className="font-normal cursor-pointer">
                      Italics
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="border-width">Border Width: {overlayBorderWidth || 0}px</Label>
                  <Slider
                    id="border-width"
                    min={0}
                    max={10}
                    step={1}
                    value={[overlayBorderWidth || 0]}
                    onValueChange={(vals) => setOverlayBorderWidth(vals[0])}
                    data-testid="slider-overlay-border-width"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add outline/stroke to text (0-10px)
                  </p>
                </div>

                <div>
                  <Label htmlFor="border-color">Border Color</Label>
                  <Input
                    id="border-color"
                    type="color"
                    value={overlayBorderColor || '#000000'}
                    onChange={(e) => setOverlayBorderColor(e.target.value)}
                    data-testid="input-overlay-border-color"
                  />
                </div>
              </>
            )}

            {overlayType === 'image' && (
              <div className="pt-4 border-t space-y-3">
                <Label>Image Overlay (Optional)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => document.getElementById('overlay-image-input')?.click()}
                    data-testid="button-upload-overlay-image"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsLibraryPickerOpen(true)}
                    data-testid="button-library-overlay-image"
                  >
                    <Images className="w-4 h-4 mr-2" />
                    Choose from Library
                  </Button>
                </div>
                <input
                  id="overlay-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {(overlayImageUrl || overlayImageData) && (
                  <div className="p-3 bg-muted rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {overlayImageData ? 'Uploaded image' : 'Library image'}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handleRemoveImage}
                        data-testid="button-remove-overlay-image"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <img
                      src={overlayImageData || overlayImageUrl}
                      alt="Overlay preview"
                      className="w-full h-auto max-h-[100px] object-contain rounded border"
                      data-testid="img-overlay-preview"
                    />
                  </div>
                )}
              </div>
            )}

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
              disabled={
                positionConflict || 
                (!overlayText && overlayType === 'text') ||
                (overlayType === 'rss' && selectedRssSourceIds.length === 0)
              }
              data-testid="button-add-overlay"
            >
              {editingOverlayId ? 'Update Overlay' : 'Add Overlay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLibraryPickerOpen} onOpenChange={setIsLibraryPickerOpen}>
        <DialogContent className="max-w-3xl" data-testid="dialog-library-picker">
          <DialogHeader>
            <DialogTitle>Choose Image from Library</DialogTitle>
            <DialogDescription>
              Select an image from your library to use as an overlay
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoadingImages ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading images...</p>
              </div>
            ) : libraryImages && libraryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {libraryImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleLibraryImageSelect(image.url)}
                    className="group relative aspect-square rounded-md overflow-hidden border hover-elevate active-elevate-2"
                    data-testid={`button-library-image-${image.id}`}
                  >
                    <img
                      src={image.thumbnail || image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-2 text-center break-all">
                        {image.filename}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Images className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No images in library</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload images to use them as overlays
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsLibraryPickerOpen(false)}
              data-testid="button-close-library-picker"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplatePickerOpen} onOpenChange={setIsTemplatePickerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Browse Overlay Templates</DialogTitle>
            <DialogDescription>
              Select a template to add specialized overlays with live analytics and data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedTemplateCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedTemplateCategory('all')}
              >
                All
              </Button>
              {getAllTemplateCategories().map(category => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedTemplateCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedTemplateCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.values(overlayTemplates)
                .filter(template => 
                  selectedTemplateCategory === 'all' || template.category === selectedTemplateCategory
                )
                .map((template: OverlayTemplate) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      const { x: defaultX, y: defaultY, category: defaultCategory } = getDefaultCoordinatesAndCategory(
                        template.position, 
                        template.overlayType, 
                        template.metricType
                      );
                      const newOverlay: OverlayConfig = {
                        id: Date.now().toString(),
                        text: template.name,
                        animationType: template.animationType,
                        templateStyle: template.templateStyle,
                        backgroundColor: template.backgroundColor,
                        textColor: template.textColor,
                        fontSize: template.fontSize,
                        position: template.position,
                        height: template.height,
                        visible: true,
                        fontFamily: template.fontFamily,
                        scrollSpeed: template.scrollSpeed || 50,
                        scrollDirection: template.scrollDirection || 'left',
                        isBold: template.isBold,
                        isItalic: template.isItalic,
                        overlayType: template.overlayType,
                        width: template.width,
                        zIndex: template.zIndex,
                        opacity: template.opacity,
                        metricType: template.metricType,
                        metricData: template.metricType === 'h2h-card' ? { homeTeamId: 40, awayTeamId: 47 } 
                                  : template.metricType === 'player-stats' ? { playerId: 1 }
                                  : {},
                        x: defaultX,
                        y: defaultY,
                        category: defaultCategory,
                      };
                      setOverlays(prev => [...prev, newOverlay]);
                      setIsTemplatePickerOpen(false);
                      toast({
                        title: 'Overlay Added',
                        description: `${template.name} has been added to your broadcast`,
                      });
                    }}
                    className="group relative overflow-hidden rounded-lg border-2 border-border hover-elevate active-elevate-2 transition-all"
                    data-testid={`template-${template.id}`}
                  >
                    <div 
                      className="w-full aspect-video flex items-center justify-center p-4"
                      style={{
                        backgroundColor: template.backgroundColor,
                        color: template.textColor,
                      }}
                    >
                      <div className="text-center">
                        {template.overlayType === 'metric' && template.metricType === 'h2h-card' && (
                          <Target className="w-8 h-8 mx-auto mb-2" />
                        )}
                        {template.overlayType === 'metric' && template.metricType === 'form-guide' && (
                          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                        )}
                        {template.overlayType === 'metric' && template.metricType === 'player-stats' && (
                          <Users className="w-8 h-8 mx-auto mb-2" />
                        )}
                        {template.overlayType === 'metric' && template.metricType === 'league-table' && (
                          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                        )}
                        {template.overlayType === 'metric' && template.metricType === 'rss-sentiment' && (
                          <Rss className="w-8 h-8 mx-auto mb-2" />
                        )}
                        {template.overlayType === 'rss' && (
                          <Rss className="w-8 h-8 mx-auto mb-2" />
                        )}
                        {template.overlayType === 'text' && (
                          <Sparkles className="w-8 h-8 mx-auto mb-2" />
                        )}
                        <div className="text-xs font-bold">{template.name}</div>
                      </div>
                    </div>
                    <div className="p-2 bg-card">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTemplatePickerOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPositionEditorOpen} onOpenChange={setIsPositionEditorOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reposition Overlay</DialogTitle>
            <DialogDescription>
              Click on the grid to set position (snaps to 20px grid) or enter coordinates manually
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div 
              ref={gridPreviewRef}
              className="relative bg-black rounded-md overflow-hidden cursor-crosshair border-2 border-primary/20"
              style={{ 
                aspectRatio: `${outputResolution.width}/${outputResolution.height}`,
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${20 * gridScale - 0.5}px, rgba(255,255,255,0.1) ${20 * gridScale - 0.5}px, rgba(255,255,255,0.1) ${20 * gridScale}px), repeating-linear-gradient(90deg, transparent, transparent ${20 * gridScale - 0.5}px, rgba(255,255,255,0.1) ${20 * gridScale - 0.5}px, rgba(255,255,255,0.1) ${20 * gridScale}px)`,
                backgroundSize: `${20 * gridScale}px ${20 * gridScale}px`
              }}
              onClick={handleGridClick}
              data-testid="grid-preview"
            >
              {editingPositionOverlayId && (() => {
                const editOverlay = overlays.find(o => o.id === editingPositionOverlayId);
                if (!editOverlay) return null;
                
                return (
                  <div
                    className="absolute bg-primary/30 border-2 border-primary rounded pointer-events-none"
                    style={{
                      left: `${(overlayX / outputResolution.width) * 100}%`,
                      top: `${(overlayY / outputResolution.height) * 100}%`,
                      width: `${editOverlay.width || 20}%`,
                      height: `${(editOverlay.height / outputResolution.height) * 100}%`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 text-xs text-primary font-mono bg-black/70 px-1 rounded whitespace-nowrap">
                      ({snapToGrid(overlayX)}, {snapToGrid(overlayY)}) - {editOverlay.width}% × {editOverlay.height}px
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="overlay-x">X Position (px)</Label>
                <Input
                  id="overlay-x"
                  type="number"
                  min="0"
                  max={outputResolution.width}
                  step="20"
                  value={overlayX}
                  onChange={(e) => handlePositionInputChange('x', e.target.value)}
                  onBlur={() => setOverlayX(snapToGrid(overlayX))}
                  data-testid="input-overlay-x"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Snapped: {snapToGrid(overlayX)}px
                </p>
              </div>
              <div>
                <Label htmlFor="overlay-y">Y Position (px)</Label>
                <Input
                  id="overlay-y"
                  type="number"
                  min="0"
                  max={outputResolution.height}
                  step="20"
                  value={overlayY}
                  onChange={(e) => handlePositionInputChange('y', e.target.value)}
                  onBlur={() => setOverlayY(snapToGrid(overlayY))}
                  data-testid="input-overlay-y"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Snapped: {snapToGrid(overlayY)}px
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 bg-primary/30 border border-primary rounded" />
              <span>Preview shows overlay position on {outputResolution.width}×{outputResolution.height} canvas</span>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPositionEditorOpen(false)}
              data-testid="button-cancel-position"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePosition}
              data-testid="button-update-position"
            >
              Update Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearConfirmDialog} onOpenChange={setShowClearConfirmDialog}>
        <DialogContent data-testid="dialog-clear-confirm">
          <DialogHeader>
            <DialogTitle>Clear Recording?</DialogTitle>
            <DialogDescription>
              You have an undownloaded recording. Are you sure you want to clear it? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowClearConfirmDialog(false)}
              data-testid="button-cancel-clear"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmClearRecording}
              data-testid="button-confirm-clear"
            >
              Clear Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
