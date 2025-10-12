import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Maximize2
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import VideoCompositor, { type VideoCompositorRef } from "@/components/VideoCompositor";
import { useCameraStreams, ScreenShareError, ScreenShareErrorType } from "@/contexts/CameraStreamContext";
import UpcomingFixturesOverlay from "@/components/overlays/UpcomingFixturesOverlay";
import PlayerComparisonOverlay from "@/components/overlays/PlayerComparisonOverlay";
import RssTickerEnhancedOverlay from "@/components/overlays/RssTickerEnhancedOverlay";
import FormGuideOverlay from "@/components/overlays/FormGuideOverlay";
import H2HMatchCardOverlay from "@/components/overlays/H2HMatchCardOverlay";
import LeagueTableOverlay from "@/components/overlays/LeagueTableOverlay";
import LeaguePositionOverlay from "@/components/overlays/LeaguePositionOverlay";
import PlayerStatsOverlay from "@/components/overlays/PlayerStatsOverlay";
import RssSentimentOverlay from "@/components/overlays/RssSentimentOverlay";
import { usePiP } from "@/contexts/PictureInPictureContext";
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

// OverlayErrorBoundary component (assuming it's defined elsewhere or needs to be added)
// For the purpose of this diff, we'll assume it exists.
// import OverlayErrorBoundary from "@/components/OverlayErrorBoundary";

// Placeholder for OverlayErrorBoundary if it's not imported elsewhere
const OverlayErrorBoundary = ({ children, overlayId }: { children: React.ReactNode; overlayId: string }) => {
  return <>{children}</>;
};


type SourceHealthStatus = 'connected' | 'disconnected' | 'error' | 'reconnecting';

interface ActiveSource {
  id: string;
  name: string;
  type: 'camera' | 'screen';
  deviceId?: string;
  deviceLabel?: string;
  stream?: MediaStream;
  resolution?: string;
  customWidth?: number;
  customHeight?: number;
  healthStatus?: SourceHealthStatus;
  lastError?: string;
  reconnectAttempts?: number;
}

const RESOLUTION_PRESETS = {
  '4K': { width: 3840, height: 2160, label: '4K (3840×2160)' },
  '1080p': { width: 1920, height: 1080, label: '1080p (1920×1080)' },
  '720p': { width: 1280, height: 720, label: '720p (1280×720)' },
  '480p': { width: 640, height: 480, label: '480p (640×480)' },
  'custom': { width: 0, height: 0, label: 'Custom' },
} as const;

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
  colorPalette?: 'classic' | 'navy' | 'cream' | 'dark';
  // Form Guide sizing
  formTitleSize?: number;
  formCircleSize?: number;
  formLabelSize?: number;

  // Advanced Typography
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textShadow?: string;

  // Advanced Background
  backgroundType?: 'solid' | 'linear-gradient' | 'radial-gradient';
  gradientAngle?: number;
  gradientColor1?: string;
  gradientColor2?: string;

  // Border Customization
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';

  // Shadow/Glow
  boxShadow?: string;
  glowEffect?: boolean;
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
    fontSize: 36,
    height: 90,
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
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  'live-updates': {
    name: 'Live Updates',
    backgroundColor: '#002147',
    textColor: '#F6EB61',
    fontSize: 36,
    height: 90,
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
    borderWidth: 3,
    borderColor: '#F6EB61',
  },
  'match-info': {
    name: 'Match Info',
    backgroundColor: '#F6EB61',
    textColor: '#002147',
    fontSize: 36,
    height: 90,
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
    borderWidth: 3,
    borderColor: '#002147',
  },
  'rss-ticker': {
    name: 'RSS News Ticker',
    backgroundColor: '#C8102E',
    textColor: '#FFFFFF',
    fontSize: 36,
    height: 90,
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
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  'mailman-red': {
    name: 'Mailman Red',
    backgroundColor: '#C8102E',
    textColor: '#FFFFFF',
    fontSize: 36,
    height: 90,
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
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  'mailman-gold': {
    name: 'Mailman Gold',
    backgroundColor: '#F7C54E',
    textColor: '#002147',
    fontSize: 36,
    height: 90,
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
    borderWidth: 3,
    borderColor: '#002147',
  },
  'mailman-dark': {
    name: 'Mailman Dark',
    backgroundColor: '#002147',
    textColor: '#F7C54E',
    fontSize: 36,
    height: 90,
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
    borderWidth: 3,
    borderColor: '#F7C54E',
  },
};

function SortableActiveSource({
  source,
  onRemove,
  sourceFitModes,
  globalFitMode,
  onFitModeChange,
  onChangeResolution,
  onRetry
}: {
  source: ActiveSource;
  onRemove: (id: string) => void;
  sourceFitModes: Record<string, 'contain' | 'cover' | 'fill'>;
  globalFitMode: 'contain' | 'cover' | 'fill';
  onFitModeChange: (sourceId: string, fitMode: 'contain' | 'cover' | 'fill' | 'auto') => void;
  onChangeResolution?: (sourceId: string, resolution: string, customWidth?: number, customHeight?: number) => void;
  onRetry?: (sourceId: string) => void;
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

  const healthStatus = source.healthStatus || 'connected';
  const getHealthBadge = () => {
    switch (healthStatus) {
      case 'connected':
        return {
          icon: CheckCircle2,
          variant: 'default' as const,
          text: 'Connected',
          className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          variant: 'outline' as const,
          text: `Reconnecting${source.reconnectAttempts ? ` (${source.reconnectAttempts})` : ''}`,
          className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 animate-pulse'
        };
      case 'error':
        return {
          icon: XCircle,
          variant: 'destructive' as const,
          text: 'Error',
          className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          variant: 'outline' as const,
          text: 'Disconnected',
          className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
        };
    }
  };

  const healthBadge = getHealthBadge();
  const HealthIcon = healthBadge.icon;

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

      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={healthBadge.variant}
            className={`gap-1.5 text-xs ${healthBadge.className}`}
            data-testid={`badge-source-status-${source.id}`}
          >
            <HealthIcon className="w-3 h-3" />
            {healthBadge.text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent data-testid={`tooltip-source-status-${source.id}`}>
          <div className="space-y-1">
            <p className="font-semibold">{source.name}</p>
            <p className="text-xs">Status: {healthStatus}</p>
            {source.lastError && (
              <p className="text-xs text-red-400">Error: {source.lastError}</p>
            )}
            {source.stream && (
              <p className="text-xs text-green-400">
                Stream active: {source.stream.active ? 'Yes' : 'No'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {(healthStatus === 'error' || healthStatus === 'disconnected') && onRetry && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => onRetry(source.id)}
          data-testid={`button-retry-source-${source.id}`}
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}

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

      {(source.type === 'camera' && onChangeResolution) && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`button-resolution-${source.id}`}
            >
              <Monitor className="w-3 h-3 text-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Resolution</h4>
              <Select
                value={source.resolution || '1080p'}
                onValueChange={(value) => onChangeResolution(source.id, value, source.customWidth, source.customHeight)}
              >
                <SelectTrigger data-testid={`select-source-resolution-${source.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4k">4K (3840x2160)</SelectItem>
                  <SelectItem value="1080p">Full HD (1920x1080)</SelectItem>
                  <SelectItem value="720p">HD (1280x720)</SelectItem>
                  <SelectItem value="480p">SD (854x480)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current: {RESOLUTION_PRESETS[source.resolution as keyof typeof RESOLUTION_PRESETS]?.label || source.resolution || '1080p'}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      )}

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

type SSEConnectionStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export default function LivePresentation() {
  const [activeSources, setActiveSources] = useState<ActiveSource[]>([]);
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [needsPermission, setNeedsPermission] = useState(false);
  const [sseStatus, setSSEStatus] = useState<SSEConnectionStatus>('disconnected');
  const [sseError, setSSEError] = useState<string | null>(null);
  const [sseReconnectAttempts, setSSEReconnectAttempts] = useState(0);
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
  const [sourceSettings, setSourceSettings] = useState<Record<string, { resolution?: string; customWidth?: number; customHeight?: number }>>({});
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
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false);
  const [overlayBorderWidth, setOverlayBorderWidth] = useState(0);
  const [overlayBorderColor, setOverlayBorderColor] = useState('#000000');
  const [gridScale, setGridScale] = useState(1);
  const [overlayHeight, setOverlayHeight] = useState(70);
  const [overlayAnimationType, setOverlayAnimationType] = useState<'scroll' | 'fade' | 'static'>('scroll');
  const [overlayColorPalette, setOverlayColorPalette] = useState<'classic' | 'navy' | 'cream' | 'dark'>('classic');
  const [formTitleSize, setFormTitleSize] = useState(20);
  const [formCircleSize, setFormCircleSize] = useState(60);
  const [formLabelSize, setFormLabelSize] = useState(14);

  // Advanced overlay filter state variables
  const [overlayCompetitionId, setOverlayCompetitionId] = useState<number | null>(null);
  const [overlaySeasonFilter, setOverlaySeasonFilter] = useState<number | null>(null);
  const [overlayMatchLimit, setOverlayMatchLimit] = useState<3 | 5 | 10 | 20>(5);
  const [overlayVenueFilter, setOverlayVenueFilter] = useState<'all' | 'home' | 'away'>('all');
  const [overlayTeamCount, setOverlayTeamCount] = useState<5 | 10 | 20 | 'full'>(10);
  const [overlayShowCompBadges, setOverlayShowCompBadges] = useState(false);

  // Advanced styling state variables
  const [overlayFontWeight, setOverlayFontWeight] = useState(400);
  const [overlayLetterSpacing, setOverlayLetterSpacing] = useState(0);
  const [overlayLineHeight, setOverlayLineHeight] = useState(1.5);
  const [overlayTextTransform, setOverlayTextTransform] = useState<'none' | 'uppercase' | 'lowercase' | 'capitalize'>('none');
  const [overlayTextShadow, setOverlayTextShadow] = useState('');
  const [overlayBackgroundType, setOverlayBackgroundType] = useState<'solid' | 'linear-gradient' | 'radial-gradient'>('solid');
  const [overlayGradientAngle, setOverlayGradientAngle] = useState(90);
  const [overlayGradientColor1, setOverlayGradientColor1] = useState('#C8102E');
  const [overlayGradientColor2, setOverlayGradientColor2] = useState('#002147');
  const [overlayBorderRadius, setOverlayBorderRadius] = useState(8);
  const [overlayBorderStyle, setOverlayBorderStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [overlayBoxShadow, setOverlayBoxShadow] = useState('');
  const [overlayGlowEffect, setOverlayGlowEffect] = useState(false);

  // New overlay state variables for upcoming-fixtures and player-comparison
  const [overlayFixtureCount, setOverlayFixtureCount] = useState<3 | 5 | 7>(5);
  const [overlayShowCountdown, setOverlayShowCountdown] = useState(true);
  const [overlayShowOpponentForm, setOverlayShowOpponentForm] = useState(true);
  const [overlayPlayer1Id, setOverlayPlayer1Id] = useState<number | null>(null);
  const [overlayPlayer2Id, setOverlayPlayer2Id] = useState<number | null>(null);
  const [overlayViewMode, setOverlayViewMode] = useState<'sideBySide' | 'radar' | 'bars'>('sideBySide');
  const [overlayStatCategories, setOverlayStatCategories] = useState<string[]>(['goals', 'assists', 'shots']);

  // RSS Ticker Enhanced state variables
  const [overlayShowSentiment, setOverlayShowSentiment] = useState(true);
  const [overlayShowTopics, setOverlayShowTopics] = useState(true);
  const [overlayShowKeywords, setOverlayShowKeywords] = useState(false);
  const [overlayShowCredibility, setOverlayShowCredibility] = useState(true);
  const [overlaySentimentMin, setOverlaySentimentMin] = useState(-1);
  const [overlaySentimentMax, setOverlaySentimentMax] = useState(1);

  const { toast } = useToast();
  const { acquireStream, acquireScreenShare, isScreenShareSupported } = useCameraStreams();
  const { isPiPActive, startPiP, stopPiP, restorePiP, updateCanvasStream } = usePiP();

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

  const { data: liveStateData } = useQuery({
    queryKey: ['/api/live-state'],
    select: (response: any) => response?.liveState || null,
  });

  const { data: libraryImages, isLoading: isLoadingImages } = useQuery({
    queryKey: ['/api/images'],
    enabled: isLibraryPickerOpen,
    select: (response: any) => (response?.images || []) as LibraryImage[],
  });

  const { data: rssSources, isLoading: isLoadingRssSources } = useQuery({
    queryKey: ['/api/rss-sources'],
    enabled: isOverlayDialogOpen, // Load RSS sources when dialog opens, regardless of type
    select: (response: any) => (response?.sources || []) as RssSource[],
  });

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/cached-stats/teams', selectedLeagueFilter],
    queryFn: async () => {
      const url = selectedLeagueFilter
        ? `/api/cached-stats/teams?leagueId=${selectedLeagueFilter}`
        : '/api/cached-stats/teams';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: overlayType === 'metric' && isOverlayDialogOpen,
    select: (response: any) => response?.teams || [],
  });

  const { data: competitionsData } = useQuery<{ competitions: any[] }>({
    queryKey: ['/api/football/competitions/active'],
    enabled: overlayType === 'metric' && isOverlayDialogOpen,
  });
  const competitions = competitionsData?.competitions || [];

  const { data: broadcastRecordings = [], refetch: refetchRecordings } = useQuery<any[]>({
    queryKey: ['/api/recordings'],
  });

  const checkPositionConflict = (position: 'top' | 'bottom', excludeId?: string): boolean => {
    return overlays.some(overlay =>
      overlay.position === position &&
      overlay.id !== excludeId
    );
  };

  const togglePictureInPicture = async () => {
    if (!canvasRef.current) {
      toast({
        title: 'PiP Not Available',
        description: 'Broadcast canvas not ready',
        variant: 'destructive',
      });
      return;
    }

    if (isPiPActive) {
      await stopPiP();
    } else {
      await startPiP(canvasRef.current);
    }
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

          // Auto-request permissions on page load for better UX
          if (cameraPermissionStatus === 'unknown') {
            // Small delay to ensure UI is ready
            setTimeout(() => {
              requestCameraPermissions();
            }, 1000);
          }
          return;
        }

        // Check if we have devices but no labels (means we need permissions)
        if (videoDevices.length > 0 && !videoDevices[0].label) {
          setNeedsPermission(true);
          setCameraPermissionStatus('prompt');
          setCameras(videoDevices);

          // Auto-request permissions if not yet determined
          if (cameraPermissionStatus === 'unknown') {
            setTimeout(() => {
              requestCameraPermissions();
            }, 1000);
          }
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

  // Reconnect PiP to canvas when page loads and PiP is active
  useEffect(() => {
    const reconnectPiP = async () => {
      if (isPiPActive && canvasRef.current) {
        console.log('Reconnecting PiP to canvas on page load');
        await restorePiP(canvasRef.current);
      }
    };

    // Small delay to ensure canvas is fully initialized
    const timer = setTimeout(reconnectPiP, 500);
    return () => clearTimeout(timer);
  }, [isPiPActive, restorePiP]);

  // Update PiP stream when canvas or overlays change
  useEffect(() => {
    if (isPiPActive && canvasRef.current) {
      updateCanvasStream(canvasRef.current);
    }
  }, [overlays, activeSources, isPiPActive, updateCanvasStream]);

  const requestCameraPermissions = useCallback(async () => {
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
  }, [toast]);

  const handleUpdateOverlay = useCallback((overlayId: string, updates: Partial<OverlayConfig>) => {
    setOverlays(prev => prev.map(overlay =>
      overlay.id === overlayId ? normalizeOverlay({ ...overlay, ...updates }) : overlay
    ));
  }, []);

  const handleSelectOverlay = useCallback((overlayId: string | null) => {
    console.log('Selected overlay:', overlayId);
  }, []);

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
      // Handle both JSON objects and strings properly
      if (state.activeSources) {
        const sources = typeof state.activeSources === 'string' ? JSON.parse(state.activeSources) : state.activeSources;
        setActiveSources(Array.isArray(sources) ? sources : []);
      }
      if (state.overlays) {
        const overlayData = typeof state.overlays === 'string' ? JSON.parse(state.overlays) : state.overlays;
        setOverlays(Array.isArray(overlayData) ? overlayData : []);
      }
      if (state.outputResolution) {
        setOutputResolution(typeof state.outputResolution === 'string' ? JSON.parse(state.outputResolution) : state.outputResolution);
      }
      if (state.globalFitMode) {
        setGlobalFitMode(state.globalFitMode as any);
      }
      if (state.sourceFitModes) {
        setSourceFitModes(typeof state.sourceFitModes === 'string' ? JSON.parse(state.sourceFitModes) : state.sourceFitModes);
      }
      if (state.sourceSettings) {
        setSourceSettings(typeof state.sourceSettings === 'string' ? JSON.parse(state.sourceSettings) : state.sourceSettings);
      }
      if (state.isBroadcasting !== undefined) {
        setIsBroadcasting(state.isBroadcasting);
      }
    }
  }, [liveStateData]);

  const lastSavedStateRef = useRef<string>('');

  useEffect(() => {
    const currentState = JSON.stringify({
      activeSources,
      overlays,
      outputResolution,
      globalFitMode,
      sourceFitModes,
      sourceSettings,
      isBroadcasting,
    });

    if (currentState === lastSavedStateRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (currentState === lastSavedStateRef.current) {
        return;
      }

      lastSavedStateRef.current = currentState;

      // Send data as JSON objects, not stringified - backend expects JSONB columns
      apiRequest('PATCH', '/api/live-state', {
        activeSources: activeSources.map(source => ({
          id: source.id,
          name: source.name,
          type: source.type,
          deviceId: source.deviceId,
          deviceLabel: source.deviceLabel,
          resolution: source.resolution,
          customWidth: source.customWidth,
          customHeight: source.customHeight,
          healthStatus: source.healthStatus,
          lastError: source.lastError,
          reconnectAttempts: source.reconnectAttempts
        })),
        overlays: overlays,
        outputResolution: outputResolution,
        globalFitMode,
        sourceFitModes: sourceFitModes,
        sourceSettings: sourceSettings,
        isBroadcasting,
      }).then(() => {
        console.log('Live state saved successfully');
      }).catch(err => console.error('Failed to save live state:', err));
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [activeSources, overlays, outputResolution, globalFitMode, sourceFitModes, sourceSettings, isBroadcasting]);

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

  // Monitor stream health
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSources(prevSources =>
        prevSources.map(source => {
          if (source.stream) {
            const isActive = source.stream.active;
            const tracks = source.stream.getTracks();
            const hasActiveTracks = tracks.some(track => track.readyState === 'live');

            if (!isActive || !hasActiveTracks) {
              return {
                ...source,
                healthStatus: 'disconnected' as SourceHealthStatus,
                lastError: 'Stream became inactive'
              };
            }

            return {
              ...source,
              healthStatus: 'connected' as SourceHealthStatus,
              lastError: undefined
            };
          }
          return source;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Retry/reconnect source handler
  const handleRetrySource = useCallback(async (sourceId: string) => {
    const source = activeSources.find(s => s.id === sourceId);
    if (!source) return;

    // Update status to reconnecting
    setActiveSources(prev => prev.map(s =>
      s.id === sourceId
        ? { ...s, healthStatus: 'reconnecting' as SourceHealthStatus, reconnectAttempts: (s.reconnectAttempts || 0) + 1 }
        : s
    ));

    toast({
      title: 'Reconnecting source',
      description: `Attempting to reconnect ${source.name}...`
    });

    try {
      if (source.type === 'camera' && source.deviceId) {
        // Stop old stream if exists
        if (source.stream) {
          source.stream.getTracks().forEach(track => track.stop());
        }

        const settings = sourceSettings[source.deviceId] || { resolution: '1080p' };
        let resolutionConstraints = undefined;
        if (settings.resolution && settings.resolution !== 'custom' && RESOLUTION_PRESETS[settings.resolution as keyof typeof RESOLUTION_PRESETS]) {
          const preset = RESOLUTION_PRESETS[settings.resolution as keyof typeof RESOLUTION_PRESETS];
          resolutionConstraints = { width: preset.width, height: preset.height };
        }

        const newStream = await acquireStream(sourceId, source.deviceId, resolutionConstraints);

        setActiveSources(prev => prev.map(s =>
          s.id === sourceId
            ? {
                ...s,
                stream: newStream,
                healthStatus: 'connected' as SourceHealthStatus,
                lastError: undefined,
                reconnectAttempts: 0
              }
            : s
        ));

        toast({
          title: 'Source reconnected',
          description: `${source.name} is now connected`
        });
      } else if (source.type === 'screen') {
        // Stop old stream if exists
        if (source.stream) {
          source.stream.getTracks().forEach(track => track.stop());
        }

        const newStream = await acquireScreenShare(sourceId);

        setActiveSources(prev => prev.map(s =>
          s.id === sourceId
            ? {
                ...s,
                stream: newStream,
                healthStatus: 'connected' as SourceHealthStatus,
                lastError: undefined,
                reconnectAttempts: 0
              }
            : s
        ));

        toast({
          title: 'Screen share reconnected',
          description: 'Screen sharing is active again'
        });
      }
    } catch (err: any) {
      console.error('Failed to retry source:', err);

      setActiveSources(prev => prev.map(s =>
        s.id === sourceId
          ? {
              ...s,
              healthStatus: 'error' as SourceHealthStatus,
              lastError: err.message || 'Reconnection failed'
            }
          : s
      ));

      toast({
        title: 'Reconnection failed',
        description: err.message || 'Could not reconnect source. Please try again.',
        variant: 'destructive'
      });
    }
  }, [activeSources, sourceSettings, acquireStream, acquireScreenShare, toast]);

  const createMockMediaStream = (type: 'test-camera' | 'demo-source'): MediaStream => {
    // Create a canvas to generate a test pattern
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create animated test pattern
      let frame = 0;
      const animate = () => {
        frame++;

        // Fill background with gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (type === 'test-camera') {
          gradient.addColorStop(0, '#C8102E');
          gradient.addColorStop(0.5, '#002147');
          gradient.addColorStop(1, '#F6EB61');
        } else {
          gradient.addColorStop(0, '#002147');
          gradient.addColorStop(0.5, '#F6EB61');
          gradient.addColorStop(1, '#C8102E');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add test pattern text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 72px League Spartan';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = type === 'test-camera' ? 'TEST CAMERA' : 'DEMO DISPLAY';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 100);

        // Add frame counter
        ctx.font = '48px League Spartan';
        ctx.fillText(`Frame: ${frame}`, canvas.width / 2, canvas.height / 2);

        // Add Liverpool FC branding
        ctx.font = '36px League Spartan';
        ctx.fillText('MAILMAN MEDIA • LIVERPOOL FC', canvas.width / 2, canvas.height / 2 + 100);

        // Add animated elements
        const time = Date.now() / 1000;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2 + Math.sin(time) * 200,
          canvas.height / 2 + 200,
          50,
          0,
          Math.PI * 2
        );
        ctx.stroke();

        requestAnimationFrame(animate);
      };

      animate();
    }

    // Create a media stream from the canvas
    const stream = canvas.captureStream(30); // 30 FPS

    // Add a mock audio track (silence)
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = 0; // Silent
    const dest = audioContext.createMediaStreamDestination();
    oscillator.connect(dest);
    oscillator.start();
    stream.addTrack(dest.stream.getAudioTracks()[0]);

    return stream;
  };

  const handleSourceSelection = async (value: string) => {
    setSelectedValue('');

    if (value === 'test-camera') {
      // Handle test camera
      const sourceId = `test-camera-${Date.now()}`;
      const mockStream = createMockMediaStream('test-camera');

      const newSource: ActiveSource = {
        id: sourceId,
        name: 'Test Camera (Demo)',
        type: 'camera',
        stream: mockStream,
        healthStatus: 'connected' as SourceHealthStatus,
        resolution: '1080p',
      };

      setActiveSources(prev => [...prev, newSource]);
      toast({
        title: 'Test Camera Added',
        description: 'A demo test camera has been added to your sources',
      });
    } else if (value === 'demo-source') {
      // Handle demo display source
      const sourceId = `demo-source-${Date.now()}`;
      const mockStream = createMockMediaStream('demo-source');

      const newSource: ActiveSource = {
        id: sourceId,
        name: 'Demo Display',
        type: 'screen',
        stream: mockStream,
        healthStatus: 'connected' as SourceHealthStatus,
        resolution: '1080p',
      };

      setActiveSources(prev => [...prev, newSource]);
      toast({
        title: 'Demo Display Added',
        description: 'A demo display source has been added to your sources',
      });
    } else if (value === 'screen-share') {
      await handleAddScreenShare();
    } else if (value === 'branded-overlay') {
      setEditingOverlayId(null);
      setOverlayText('MAILMAN MEDIA • LIVERPOOL FC ANALYSIS');
      setSelectedPreset('mailman-red');
      setOverlayPosition('bottom');
      setOverlayFontFamily('League Spartan');
      setOverlayFontSize(36);
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
      if (!camera) {
        toast({
          title: 'Camera not found',
          description: 'The selected camera is not available',
          variant: 'destructive'
        });
        return;
      }

      const sourceId = `camera-${Date.now()}`;

      const settings = sourceSettings[deviceId] || { resolution: '1080p' };
      const resolution = settings.resolution || '1080p';

      let resolutionConstraints = undefined;
      if (resolution && resolution !== 'custom' && RESOLUTION_PRESETS[resolution as keyof typeof RESOLUTION_PRESETS]) {
        const preset = RESOLUTION_PRESETS[resolution as keyof typeof RESOLUTION_PRESETS];
        resolutionConstraints = { width: preset.width, height: preset.height };
      } else if (resolution === 'custom' && settings.customWidth && settings.customHeight) {
        resolutionConstraints = { width: settings.customWidth, height: settings.customHeight };
      }

      const stream = await acquireStream(sourceId, deviceId, resolutionConstraints);

      const newSource: ActiveSource = {
        id: sourceId,
        name: camera.label || 'Camera',
        type: 'camera',
        deviceId,
        deviceLabel: camera.label,
        stream,
        resolution,
        customWidth: settings.customWidth,
        customHeight: settings.customHeight,
        healthStatus: 'connected' as SourceHealthStatus,
      };

      setActiveSources(prev => [...prev, newSource]);
      toast({
        title: 'Camera added',
        description: camera.label || 'Camera connected successfully'
      });
    } catch (err: any) {
      console.error('Failed to add camera:', err);

      const errorMessage = err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permissions in your browser settings.'
        : err.name === 'NotFoundError'
          ? 'Camera not found. Please check your camera connection.'
          : err.name === 'NotReadableError'
            ? 'Camera is already in use by another application.'
            : err.message || 'Failed to connect to camera';

      toast({
        title: 'Failed to add camera',
        description: errorMessage,
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
        healthStatus: 'connected' as SourceHealthStatus,
      };

      setActiveSources(prev => [...prev, newSource]);
      toast({
        title: 'Screen mirroring active',
        description: 'Your screen is now visible in the broadcast feed. Mark images and annotations will appear live!'
      });
    } catch (err) {
      console.error('Failed to add screen share:', err);

      // Provide specific error messages based on error type
      if (err instanceof ScreenShareError) {
        switch (err.type) {
          case ScreenShareErrorType.NOT_SUPPORTED:
            toast({
              title: 'Screen sharing not supported',
              description: 'Please use Chrome, Edge, Safari 13+, or Firefox for screen sharing.',
              variant: 'destructive'
            });
            break;

          case ScreenShareErrorType.USER_CANCELLED:
            toast({
              title: 'Screen sharing cancelled',
              description: 'You need to select a screen, window, or tab to share. Try again and click "Share".',
              variant: 'destructive'
            });
            break;

          case ScreenShareErrorType.PERMISSION_DENIED:
            toast({
              title: 'Permission denied',
              description: 'Screen sharing permission was denied. Check your browser settings to allow screen sharing.',
              variant: 'destructive'
            });
            break;

          default:
            toast({
              title: 'Screen sharing failed',
              description: err.message || 'An unknown error occurred. Please try again.',
              variant: 'destructive'
            });
        }
      } else {
        toast({
          title: 'Screen sharing failed',
          description: 'On iPad: Select "Entire Screen" or "Safari" to mirror your display',
          variant: 'destructive'
        });
      }
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
          competitionFilter: overlayCompetitionId,
          venueFilter: overlayVenueFilter,
          seasonFilter: overlaySeasonFilter,
        };
      } else if (overlayMetricType === 'form-guide') {
        metricDataToSave = {
          teamId: overlayTeamId,
          competitionId: overlayCompetitionId,
          seasonFilter: overlaySeasonFilter,
          matchLimit: overlayMatchLimit,
          showCompetitionBadges: overlayShowCompBadges,
        };
      } else if (overlayMetricType === 'league-table') {
        metricDataToSave = {
          leagueId: overlayCompetitionId || 39,
          season: overlaySeasonFilter || new Date().getFullYear(),
          teamCount: overlayTeamCount,
        };
      } else if (overlayMetricType === 'upcoming-fixtures') {
        metricDataToSave = {
          fixtureCount: overlayFixtureCount,
          showCountdown: overlayShowCountdown,
          showOpponentForm: overlayShowOpponentForm,
          competitionFilter: overlayCompetitionId ? [overlayCompetitionId] : undefined,
        };
      } else if (overlayMetricType === 'player-comparison') {
        metricDataToSave = {
          player1Id: overlayPlayer1Id,
          player2Id: overlayPlayer2Id,
          viewMode: overlayViewMode,
          statCategories: overlayStatCategories,
          season: overlaySeasonFilter,
          competition: overlayCompetitionId,
        };
      } else if (overlayMetricType === 'rss-ticker-enhanced') {
        metricDataToSave = {
          rssSourceIds: selectedRssSourceIds,
          maxArticles: rssMaxArticles,
          showSentiment: overlayShowSentiment,
          showTopics: overlayShowTopics,
          showKeywords: overlayShowKeywords,
          showCredibility: overlayShowCredibility,
          sentimentFilter: {
            min: overlaySentimentMin,
            max: overlaySentimentMax
          }
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
              colorPalette: overlayColorPalette,
              formTitleSize: overlayType === 'metric' && overlayMetricType === 'form-guide' ? formTitleSize : undefined,
              formCircleSize: overlayType === 'metric' && overlayMetricType === 'form-guide' ? formCircleSize : undefined,
              formLabelSize: overlayType === 'metric' && overlayMetricType === 'form-guide' ? formLabelSize : undefined,
              fontWeight: overlayFontWeight,
              letterSpacing: overlayLetterSpacing,
              lineHeight: overlayLineHeight,
              textTransform: overlayTextTransform,
              textShadow: overlayTextShadow || undefined,
              backgroundType: overlayBackgroundType,
              gradientAngle: overlayGradientAngle,
              gradientColor1: overlayGradientColor1,
              gradientColor2: overlayGradientColor2,
              borderRadius: overlayBorderRadius,
              borderStyle: overlayBorderStyle,
              boxShadow: overlayBoxShadow || undefined,
              glowEffect: overlayGlowEffect,
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
        colorPalette: overlayColorPalette,
        formTitleSize: overlayType === 'metric' && overlayMetricType === 'form-guide' ? formTitleSize : undefined,
        formCircleSize: overlayType === 'metric' && overlayMetricType === 'form-guide' ? formCircleSize : undefined,
        formLabelSize: overlayType === 'metric' && overlayMetricType === 'form-guide' ? formLabelSize : undefined,
        fontWeight: overlayFontWeight,
        letterSpacing: overlayLetterSpacing,
        lineHeight: overlayLineHeight,
        textTransform: overlayTextTransform,
        textShadow: overlayTextShadow || undefined,
        backgroundType: overlayBackgroundType,
        gradientAngle: overlayGradientAngle,
        gradientColor1: overlayGradientColor1,
        gradientColor2: overlayGradientColor2,
        borderRadius: overlayBorderRadius,
        borderStyle: overlayBorderStyle,
        boxShadow: overlayBoxShadow || undefined,
        glowEffect: overlayGlowEffect,
      };

      if (overlayType === 'rss') {
        newOverlay.rssSourceIds = selectedRssSourceIds;
        newOverlay.rssMaxArticles = rssMaxArticles;
        newOverlay.rssShowSource = rssShowSource;
      }

      setOverlays(prev => [...prev, normalizeOverlay(newOverlay)]);
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

  const handleChangeResolution = async (sourceId: string, resolution: string, customWidth?: number, customHeight?: number) => {
    try {
      const source = activeSources.find(s => s.id === sourceId);
      if (!source || source.type !== 'camera' || !source.deviceId) return;

      const deviceId = source.deviceId;

      setSourceSettings(prev => ({
        ...prev,
        [deviceId]: { resolution, customWidth, customHeight }
      }));

      if (source.stream) {
        source.stream.getTracks().forEach(track => track.stop());
      }

      let resolutionConstraints = undefined;
      if (resolution && resolution !== 'custom' && RESOLUTION_PRESETS[resolution as keyof typeof RESOLUTION_PRESETS]) {
        const preset = RESOLUTION_PRESETS[resolution as keyof typeof RESOLUTION_PRESETS];
        resolutionConstraints = { width: preset.width, height: preset.height };
      } else if (resolution === 'custom' && customWidth && customHeight) {
        resolutionConstraints = { width: customWidth, height: customHeight };
      }

      const newStream = await acquireStream(sourceId, deviceId, resolutionConstraints);

      setActiveSources(prev => prev.map(s =>
        s.id === sourceId
          ? { ...s, stream: newStream, resolution, customWidth, customHeight }
          : s
      ));

      toast({
        title: 'Resolution changed',
        description: resolution === 'custom' ? `${customWidth}x${customHeight}` : RESOLUTION_PRESETS[resolution as keyof typeof RESOLUTION_PRESETS]?.label || resolution
      });
    } catch (err) {
      console.error('Failed to change resolution:', err);
      toast({
        title: 'Failed to change resolution',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveOverlay = (overlayId: string) => {
    try {
      const overlay = overlays.find(o => o.id === overlayId);
      if (!overlay) {
        toast({
          title: 'Overlay not found',
          description: 'The overlay may have already been removed',
          variant: 'destructive'
        });
        return;
      }

      setOverlays(prev => prev.filter(o => o.id !== overlayId));
      toast({
        title: 'Overlay removed',
        description: `Removed ${overlay.overlayType} overlay`
      });
    } catch (err: any) {
      console.error('Failed to remove overlay:', err);
      toast({
        title: 'Failed to remove overlay',
        description: err.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleToggleOverlayVisibility = (overlayId: string) => {
    try {
      const overlay = overlays.find(o => o.id === overlayId);
      if (!overlay) {
        toast({
          title: 'Overlay not found',
          description: 'Cannot toggle visibility',
          variant: 'destructive'
        });
        return;
      }

      setOverlays(prev => prev.map(o =>
        o.id === overlayId
          ? { ...o, visible: !o.visible }
          : o
      ));

      toast({
        title: overlay.visible ? 'Overlay hidden' : 'Overlay shown',
        description: `${overlay.overlayType} overlay is now ${overlay.visible ? 'hidden' : 'visible'}`
      });
    } catch (err: any) {
      console.error('Failed to toggle overlay:', err);
      toast({
        title: 'Failed to toggle overlay',
        description: err.message || 'An error occurred',
        variant: 'destructive'
      });
    }
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

    setOverlayFontWeight(overlay.fontWeight || 400);
    setOverlayLetterSpacing(overlay.letterSpacing || 0);
    setOverlayLineHeight(overlay.lineHeight || 1.5);
    setOverlayTextTransform(overlay.textTransform || 'none');
    setOverlayTextShadow(overlay.textShadow || '');
    setOverlayBackgroundType(overlay.backgroundType || 'solid');
    setOverlayGradientAngle(overlay.gradientAngle || 90);
    setOverlayGradientColor1(overlay.gradientColor1 || '#C8102E');
    setOverlayGradientColor2(overlay.gradientColor2 || '#002147');
    setOverlayBorderRadius(overlay.borderRadius || 8);
    setOverlayBorderStyle(overlay.borderStyle || 'solid');
    setOverlayBoxShadow(overlay.boxShadow || '');
    setOverlayGlowEffect(overlay.glowEffect || false);

    if (overlay.overlayType === 'rss') {
      setSelectedRssSourceIds(overlay.rssSourceIds || []);
      setRssMaxArticles(overlay.rssMaxArticles || 10);
      setRssShowSource(overlay.rssShowSource !== undefined ? overlay.rssShowSource : true);
    }

    if (overlay.overlayType === 'metric' && overlay.metricData) {
      if (overlay.metricType === 'h2h-card') {
        setOverlayHomeTeamId(overlay.metricData.homeTeamId || null);
        setOverlayAwayTeamId(overlay.metricData.awayTeamId || null);
        setOverlayCompetitionId(overlay.metricData.competitionFilter || null);
        setOverlayVenueFilter(overlay.metricData.venueFilter || 'all');
        setOverlaySeasonFilter(overlay.metricData.seasonFilter || null);
      } else if (overlay.metricType === 'form-guide') {
        setOverlayTeamId(overlay.metricData.teamId || null);
        setOverlayCompetitionId(overlay.metricData.competitionId || null);
        setOverlaySeasonFilter(overlay.metricData.seasonFilter || null);
        setOverlayMatchLimit(overlay.metricData.matchLimit || 5);
        setOverlayShowCompBadges(overlay.metricData.showCompetitionBadges || false);
        setFormTitleSize(overlay.formTitleSize || 20);
        setFormCircleSize(overlay.formCircleSize || 60);
        setFormLabelSize(overlay.formLabelSize || 14);
      } else if (overlay.metricType === 'league-table') {
        setOverlayCompetitionId(overlay.metricData.leagueId || null);
        setOverlaySeasonFilter(overlay.metricData.season || null);
        setOverlayTeamCount(overlay.metricData.teamCount || 10);
      } else if (overlay.metricType === 'upcoming-fixtures') {
        setOverlayFixtureCount(overlay.metricData.fixtureCount || 5);
        setOverlayShowCountdown(overlay.metricData.showCountdown !== false);
        setOverlayShowOpponentForm(overlay.metricData.showOpponentForm !== false);
      } else if (overlay.metricType === 'player-comparison') {
        setOverlayPlayer1Id(overlay.metricData.player1Id || null);
        setOverlayPlayer2Id(overlay.metricData.player2Id || null);
        setOverlayViewMode(overlay.metricData.viewMode || 'sideBySide');
        setOverlayStatCategories(overlay.metricData.statCategories || ['goals', 'assists', 'shots']);
      } else if (overlay.metricType === 'rss-ticker-enhanced') {
        setSelectedRssSourceIds(overlay.metricData.rssSourceIds || []);
        setRssMaxArticles(overlay.metricData.maxArticles || 10);
        setOverlayShowSentiment(overlay.metricData.showSentiment !== false);
        setOverlayShowTopics(overlay.metricData.showTopics !== false);
        setOverlayShowKeywords(overlay.metricData.showKeywords || false);
        setOverlayShowCredibility(overlay.metricData.showCredibility !== false);
        setOverlaySentimentMin(overlay.metricData.sentimentFilter?.min || -1);
        setOverlaySentimentMax(overlay.metricData.sentimentFilter?.max || 1);
      }
    }

    if (overlay.colorPalette) {
      setOverlayColorPalette(overlay.colorPalette);
    }

    const presetKey = Object.entries(TEMPLATE_PRESETS).find(([_, preset]) =>
      preset.backgroundColor === overlay.backgroundColor &&
      preset.textColor === overlay.textColor
    )?.[0] as keyof typeof TEMPLATE_PRESETS || 'breaking-news';

    setSelectedPreset(presetKey);
    setIsOverlayDialogOpen(true);
  };

  // Normalize overlay to ensure all required dimension fields have valid defaults
  const normalizeOverlay = (overlay: any): OverlayConfig => {
    const defaults = {
      width: 30,
      height: 200,
      x: 100,
      y: 100,
      opacity: 0.9,
      visible: true,
      position: 'bottom' as const,
    };

    const validPositions = ['top', 'bottom'];

    return {
      ...overlay,
      width: Number.isFinite(overlay.width) ? overlay.width : defaults.width,
      height: Number.isFinite(overlay.height) ? overlay.height : defaults.height,
      x: Number.isFinite(overlay.x) ? overlay.x : defaults.x,
      y: Number.isFinite(overlay.y) ? overlay.y : defaults.y,
      opacity: Number.isFinite(overlay.opacity) ? Math.max(0, Math.min(1, overlay.opacity)) : defaults.opacity,
      visible: typeof overlay.visible === 'boolean' ? overlay.visible : defaults.visible,
      position: validPositions.includes(overlay.position) ? overlay.position : defaults.position,
    };
  };

  const handleLoadDefaultOverlays = async () => {
    try {
      const response = await fetch('/api/overlays/default-templates');
      if (!response.ok) throw new Error('Failed to fetch default templates');

      const templates = await response.json();
      console.log('[handleLoadDefaultOverlays] Templates from API:', templates);

      const newOverlays: OverlayConfig[] = Object.values(templates).map((template: any) => {
        console.log(`[handleLoadDefaultOverlays] Processing template ${template.id}:`, {
          width: template.width,
          height: template.height,
          x: template.x,
          y: template.y,
          position: template.position,
          opacity: template.opacity,
          visible: template.visible
        });

        const baseOverlay = {
          ...template,
          text: template.metricType || '',
          animationType: 'static' as const,
          templateStyle: 'corner' as const,
          backgroundColor: '#F6EB61',
          textColor: '#002147',
          fontSize: 18,
          fontFamily: 'League Spartan',
          scrollSpeed: 50,
          scrollDirection: 'left' as const,
          isBold: true,
          isItalic: false,
          overlayType: 'metric' as const,
          zIndex: 100,
          category: 'metrics',
          // Preserve critical positioning and dimension properties from template
          width: template.width,
          height: template.height,
          x: template.x,
          y: template.y,
          position: template.position,
          opacity: template.opacity,
          visible: template.visible,
        };

        return normalizeOverlay(baseOverlay);
      });

      console.log('[handleLoadDefaultOverlays] Final overlays created:', newOverlays);
      setOverlays(prev => [...prev, ...newOverlays]);

      toast({
        title: 'Default Overlays Loaded',
        description: `Added ${newOverlays.length} Liverpool FC metric overlays`,
      });
    } catch (error) {
      console.error('Error loading default overlays:', error);
      toast({
        title: 'Failed to load default overlays',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleStartBroadcast = () => {
    try {
      // Check if we have any sources before broadcasting
      if (activeSources.length === 0) {
        toast({
          title: 'Cannot start broadcast',
          description: 'Add at least one video source before starting the broadcast',
          variant: 'destructive',
        });
        return;
      }

      // Check if all sources are healthy
      const unhealthySources = activeSources.filter(s => s.healthStatus !== 'connected');
      if (unhealthySources.length > 0) {
        toast({
          title: 'Warning: Unhealthy sources detected',
          description: `${unhealthySources.length} source(s) are not connected. Broadcasting anyway...`,
        });
      }

      setIsBroadcasting(true);
      toast({
        title: 'Broadcast Started',
        description: 'Your program feed is now live!',
      });
    } catch (err: any) {
      console.error('Failed to start broadcast:', err);
      toast({
        title: 'Failed to start broadcast',
        description: err.message || 'An error occurred while starting the broadcast',
        variant: 'destructive',
      });
    }
  };

  const handleStopBroadcast = () => {
    try {
      setIsBroadcasting(false);
      toast({
        title: 'Broadcast Stopped',
        description: 'Program output has been stopped',
      });
    } catch (err: any) {
      console.error('Failed to stop broadcast:', err);
      toast({
        title: 'Failed to stop broadcast',
        description: err.message || 'An error occurred while stopping the broadcast',
        variant: 'destructive',
      });
    }
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

  const snapToGrid = (value: number, gridSize: number = 20, min: number = 0, max?: number): number => {
    const snapped = Math.round(value / gridSize) * gridSize;
    if (max !== undefined) {
      return Math.max(min, Math.min(snapped, max));
    }
    return Math.max(min, snapped);
  };

  const constrainOverlayPosition = (x: number, y: number, width: number, height: number) => {
    // Calculate overlay dimensions in pixels
    const overlayWidthPx = (width / 100) * outputResolution.width;
    const overlayHeightPx = height;

    // Calculate maximum allowed positions to keep overlay within bounds
    const maxX = outputResolution.width - overlayWidthPx;
    const maxY = outputResolution.height - overlayHeightPx;

    // Constrain and snap to grid
    const constrainedX = snapToGrid(x, 20, 0, maxX);
    const constrainedY = snapToGrid(y, 20, 0, maxY);

    return { x: constrainedX, y: constrainedY };
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

    // Use constrained positioning to keep overlay within bounds
    const { x: constrainedX, y: constrainedY } = constrainOverlayPosition(
      rawX,
      rawY,
      overlayWidth,
      overlayHeight
    );

    setOverlayX(constrainedX);
    setOverlayY(constrainedY);
  };

  const handleUpdatePosition = () => {
    if (!editingPositionOverlayId) return;

    // Get overlay dimensions to calculate max boundaries
    const editingOverlay = overlays.find(o => o.id === editingPositionOverlayId);
    if (!editingOverlay) return;

    // Use constrained positioning to keep overlay within bounds
    const { x: constrainedX, y: constrainedY } = constrainOverlayPosition(
      overlayX,
      overlayY,
      editingOverlay.width,
      editingOverlay.height
    );

    setOverlays(prev => prev.map(overlay =>
      overlay.id === editingPositionOverlayId
        ? { ...overlay, x: constrainedX, y: constrainedY }
        : overlay
    ));

    toast({
      title: 'Position updated',
      description: `Overlay positioned at (${constrainedX}, ${constrainedY})`
    });

    setIsPositionEditorOpen(false);
    setEditingPositionOverlayId(null);
  };

  const handlePositionInputChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;

    // Get current overlay being edited to check dimensions
    const editingOverlay = overlays.find(o => o.id === editingPositionOverlayId);
    if (!editingOverlay) return;

    const overlayWidthPx = (editingOverlay.width / 100) * outputResolution.width;
    const overlayHeightPx = editingOverlay.height;

    const maxX = outputResolution.width - overlayWidthPx;
    const maxY = outputResolution.height - overlayHeightPx;

    if (axis === 'x') {
      const clampedValue = Math.max(0, Math.min(numValue, maxX));
      setOverlayX(clampedValue);
    } else {
      const clampedValue = Math.max(0, Math.min(numValue, maxY));
      setOverlayY(clampedValue);
    }
  };

  // Helper function to map overlay types to components
  const getOverlayComponent = (overlayType: string, metricType?: string) => {
    // For metric overlays, use metricType to determine component
    if (overlayType === 'metric' && metricType) {
      switch (metricType) {
        case 'form-guide':
          return FormGuideOverlay;
        case 'h2h-card':
          return H2HMatchCardOverlay;
        case 'league-table':
          return LeagueTableOverlay;
        case 'league-position':
          return LeaguePositionOverlay;
        case 'player-stats':
          return PlayerStatsOverlay;
        case 'player-comparison':
          return PlayerComparisonOverlay;
        case 'upcoming-fixtures':
          return UpcomingFixturesOverlay;
        case 'rss-ticker-enhanced':
          return RssTickerEnhancedOverlay;
        case 'rss-sentiment':
          return RssSentimentOverlay;
        default:
          return null;
      }
    }
    
    // For non-metric overlays
    switch (overlayType) {
      case 'rss':
        return RssTickerEnhancedOverlay;
      default:
        return null;
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={sseStatus === 'connected' ? 'default' : 'destructive'}
                    className={`gap-1.5 ${
                      sseStatus === 'connected'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                        : sseStatus === 'connecting'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 animate-pulse'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    }`}
                    data-testid="badge-sse-status"
                  >
                    {sseStatus === 'connected' && <Wifi className="w-3 h-3" />}
                    {sseStatus === 'connecting' && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {(sseStatus === 'disconnected' || sseStatus === 'error') && <WifiOff className="w-3 h-3" />}
                    {sseStatus === 'connected' ? 'Live' : sseStatus === 'connecting' ? 'Connecting' : 'Offline'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent data-testid="tooltip-sse-status">
                  <div className="space-y-1">
                    <p className="font-semibold">Live State Connection</p>
                    <p className="text-xs">
                      {sseStatus === 'connected' && 'Connected to live updates'}
                      {sseStatus === 'connecting' && 'Connecting to server...'}
                      {sseStatus === 'disconnected' && 'Not connected to live updates'}
                      {sseStatus === 'error' && `Connection error${sseError ? `: ${sseError}` : ''}`}
                    </p>
                    {sseReconnectAttempts > 0 && (
                      <p className="text-xs text-yellow-400">
                        Reconnect attempts: {sseReconnectAttempts}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

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

            <Card data-testid="card-broadcast-recordings">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-lg">Broadcast Recordings</CardTitle>
                  <Button
                    onClick={() => refetchRecordings()}
                    variant="outline"
                    size="sm"
                    data-testid="button-refresh-recordings"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {broadcastRecordings.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No recordings yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start a recording to capture your broadcast
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {broadcastRecordings.slice(0, 5).map((recording: any) => (
                      <div
                        key={recording.id}
                        className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                        data-testid={`recording-item-${recording.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {recording.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {recording.duration || 0}s · {(recording.size / 1024 / 1024).toFixed(1)}MB · {new Date(recording.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              window.open(`/api/recordings/${recording.id}/video`, '_blank');
                            }}
                            variant="outline"
                            size="sm"
                            data-testid={`button-view-${recording.id}`}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={async () => {
                              const a = document.createElement('a');
                              a.href = `/api/recordings/${recording.id}/video`;
                              a.download = recording.filename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            variant="outline"
                            size="sm"
                            data-testid={`button-download-${recording.id}`}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {broadcastRecordings.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        Showing 5 of {broadcastRecordings.length} recordings
                      </p>
                    )}
                  </div>
                )}
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
                    <Button
                      onClick={togglePictureInPicture}
                      disabled={activeSources.length === 0}
                      variant={isPiPActive ? "default" : "outline"}
                      size="sm"
                      data-testid="button-toggle-pip"
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      {isPiPActive ? 'Exit PiP' : 'Picture-in-Picture'}
                    </Button>
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
                    onUpdateOverlay={handleUpdateOverlay}
                    onSelectOverlay={handleSelectOverlay}
                    className="w-full h-full"
                  />

                  {/* Render overlays directly or via components */}
                  {overlays
                    .filter(overlay => overlay.visible)
                    .map((overlay) => {
                      const OverlayComponent = getOverlayComponent(overlay.overlayType, overlay.metricType);

                      if (!OverlayComponent) {
                        // Render non-component overlays (text, images)
                        if (overlay.overlayType === 'text') {
                          return (
                            <div
                              key={overlay.id}
                              data-overlay-id={overlay.id}
                              style={{
                                position: 'absolute',
                                left: `${overlay.x}%`,
                                top: `${overlay.y}px`,
                                width: `${overlay.width}%`,
                                height: `${overlay.height}px`,
                                zIndex: overlay.zIndex,
                                opacity: overlay.opacity,
                                pointerEvents: 'none',
                              }}
                            >
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: overlay.backgroundColor,
                                  color: overlay.textColor,
                                  fontSize: `${overlay.fontSize}px`,
                                  fontFamily: overlay.fontFamily,
                                  fontWeight: overlay.isBold ? 'bold' : 'normal',
                                  fontStyle: overlay.isItalic ? 'italic' : 'normal',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  border: overlay.borderWidth ? `${overlay.borderWidth}px solid ${overlay.borderColor}` : 'none',
                                }}
                              >
                                {overlay.text}
                              </div>
                            </div>
                          );
                        }

                        if (overlay.overlayType === 'image' && overlay.imageUrl) {
                          return (
                            <div
                              key={overlay.id}
                              data-overlay-id={overlay.id}
                              style={{
                                position: 'absolute',
                                left: `${overlay.x}%`,
                                top: `${overlay.y}px`,
                                width: `${overlay.width}%`,
                                height: `${overlay.height}px`,
                                zIndex: overlay.zIndex,
                                opacity: overlay.opacity,
                                pointerEvents: 'none',
                              }}
                            >
                              <img
                                src={overlay.imageUrl}
                                alt={overlay.text || 'Overlay image'}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                            </div>
                          );
                        }

                        return null;
                      }

                      const overlayStyle: React.CSSProperties = {
                        position: 'absolute',
                        left: `${overlay.x}%`,
                        top: `${overlay.y}px`,
                        width: `${overlay.width}%`,
                        height: `${overlay.height}px`,
                        zIndex: overlay.zIndex,
                        opacity: overlay.opacity,
                        pointerEvents: 'none',
                      };

                      return (
                        <div
                          key={overlay.id}
                          data-overlay-id={overlay.id}
                          style={overlayStyle}
                        >
                          <OverlayErrorBoundary overlayId={overlay.id}>
                            <OverlayComponent
                              width={Math.round((overlay.width / 100) * outputResolution.width)}
                              height={overlay.height}
                              opacity={overlay.opacity}
                              teamId={overlay.metricData?.teamId}
                              homeTeamId={overlay.metricData?.homeTeamId}
                              awayTeamId={overlay.metricData?.awayTeamId}
                              player1Id={overlay.metricData?.player1Id}
                              player2Id={overlay.metricData?.player2Id}
                              colorPalette={overlay.colorPalette}
                              titleSize={overlay.formTitleSize}
                              circleSize={overlay.formCircleSize}
                              labelSize={overlay.formLabelSize}
                              matchLimit={overlay.metricData?.matchLimit}
                              fixtureCount={overlay.metricData?.fixtureCount}
                              showCountdown={overlay.metricData?.showCountdown}
                              showOpponentForm={overlay.metricData?.showOpponentForm}
                              viewMode={overlay.metricData?.viewMode}
                              statCategories={overlay.metricData?.statCategories}
                              showSentiment={overlay.metricData?.showSentiment}
                              showTopics={overlay.metricData?.showTopics}
                              showKeywords={overlay.metricData?.showKeywords}
                              showCredibility={overlay.metricData?.showCredibility}
                              sentimentMin={overlay.metricData?.sentimentFilter?.min}
                              sentimentMax={overlay.metricData?.sentimentFilter?.max}
                              rssSourceIds={overlay.rssSourceIds || overlay.metricData?.rssSourceIds}
                              rssMaxArticles={overlay.rssMaxArticles || overlay.metricData?.maxArticles}
                              rssShowSource={overlay.rssShowSource}
                            />
                          </OverlayErrorBoundary>
                        </div>
                      );
                    })}
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
                    <SelectGroup>
                      <SelectLabel>Test Sources</SelectLabel>
                      <SelectItem value="test-camera" data-testid="select-test-camera">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Test Camera (Demo)
                        </div>
                      </SelectItem>
                      <SelectItem value="demo-source" data-testid="select-demo-source">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Demo Display
                        </div>
                      </SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
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
                    {isScreenShareSupported ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <SelectGroup>
                          <SelectLabel>Screen Mirroring</SelectLabel>
                          <div className="px-2 py-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">Screen sharing not supported</span>
                                <span className="text-xs">
                                  Please use Chrome, Edge, Safari 13+, or Firefox to enable screen mirroring.
                                </span>
                              </div>
                            </div>
                          </div>
                        </SelectGroup>
                        <SelectSeparator />
                      </>
                    )}
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

                <Button
                  onClick={handleLoadDefaultOverlays}
                  className="w-full mt-2"
                  variant="default"
                  data-testid="button-load-default-overlays"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Load Liverpool FC Overlays
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
                                              <span> • {teamsData?.find((t: any) => t.teamId === overlay.metricData.homeTeamId)?.teamName || `Team ${overlay.metricData.homeTeamId}`} vs {teamsData?.find((t: any) => t.teamId === overlay.metricData.awayTeamId)?.teamName || `Team ${overlay.metricData.awayTeamId}`}</span>
                                            )}
                                            {overlay.metricType === 'form-guide' && overlay.metricData.teamId && (
                                              <span> • {teamsData?.find((t: any) => t.teamId === overlay.metricData.teamId)?.teamName || `Team ${overlay.metricData.teamId}`}</span>
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
                            onChangeResolution={handleChangeResolution}
                            onRetry={handleRetrySource}
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
                  <div className="flex items-center justify-between mb-2">
                    <Label>Select RSS Sources</Label>
                    {rssSources && rssSources.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {selectedRssSourceIds.length} of {rssSources.length} selected
                      </Badge>
                    )}
                  </div>
                  {isLoadingRssSources ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Loading RSS sources...</p>
                    </div>
                  ) : rssSources && rssSources.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto p-3 border rounded-md" data-testid="checklist-rss-sources">
                      {['official', 'media', 'fan_site', 'podcast'].map((category) => {
                        const categorySources = rssSources.filter(s => s.category === category);
                        if (categorySources.length === 0) return null;

                        const categoryLabel = category === 'fan_site' ? 'Fan Sites' :
                                            category.charAt(0).toUpperCase() + category.slice(1);
                        const allCategorySelected = categorySources.every(s => selectedRssSourceIds.includes(s.id));
                        const someCategorySelected = categorySources.some(s => selectedRssSourceIds.includes(s.id));

                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Checkbox
                                id={`category-${category}`}
                                checked={allCategorySelected}
                                ref={(el) => {
                                  if (el) {
                                    (el as any).indeterminate = someCategorySelected && !allCategorySelected;
                                  }
                                }}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedRssSourceIds(prev => {
                                      const newIds = categorySources.map(s => s.id).filter(id => !prev.includes(id));
                                      return [...prev, ...newIds];
                                    });
                                  } else {
                                    setSelectedRssSourceIds(prev =>
                                      prev.filter(id => !categorySources.some(s => s.id === id))
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor={`category-${category}`} className="font-semibold text-xs uppercase text-muted-foreground cursor-pointer">
                                {categoryLabel} ({categorySources.length})
                              </Label>
                            </div>
                            <div className="ml-6 space-y-1">
                              {categorySources.map((source) => (
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
                                    className="flex items-center gap-2 font-normal cursor-pointer flex-1 text-sm"
                                  >
                                    <span className="flex-1">{source.name}</span>
                                    {source.isActive && (
                                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                        Active
                                      </Badge>
                                    )}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Alert data-testid="alert-no-rss-sources">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No RSS sources available. Go to RSS Intelligence to add sources.
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
                          <SelectItem value="rss-ticker-enhanced">RSS Ticker (Enhanced)</SelectItem>
                          <SelectItem value="upcoming-fixtures">Upcoming Fixtures</SelectItem>
                          <SelectItem value="player-comparison">Player Comparison</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose the type of metric overlay to display
                      </p>
                    </div>

                    {overlayMetricType === 'h2h-card' && (
                      <>
                        <div>
                          <Label htmlFor="league-filter">League Filter</Label>
                          <Select
                            value={selectedLeagueFilter ? String(selectedLeagueFilter) : 'all'}
                            onValueChange={(v) => {
                              setSelectedLeagueFilter(v === 'all' ? null : parseInt(v));
                              setOverlayHomeTeamId(null);
                              setOverlayAwayTeamId(null);
                            }}
                          >
                            <SelectTrigger id="league-filter" data-testid="select-league-filter">
                              <SelectValue placeholder="All Leagues" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4" />
                                  <span>All Leagues</span>
                                </div>
                              </SelectItem>
                              <SelectSeparator />
                              <SelectItem value="39">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-purple-600" />
                                  <span>Premier League</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="2">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-blue-600" />
                                  <span>Champions League</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="45">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-red-600" />
                                  <span>FA Cup</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="48">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-green-600" />
                                  <span>EFL Cup</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="3">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-orange-600" />
                                  <span>Europa League</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Filter teams by competition (or select all leagues)
                          </p>
                        </div>

                        {isLoadingTeams ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Loading teams...</p>
                          </div>
                        ) : teamsData && Array.isArray(teamsData) && teamsData.length > 0 ? (
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
                                  {teamsData.map((team: any) => (
                                    <SelectItem key={team.teamId} value={String(team.teamId)}>
                                      <div className="flex items-center justify-between gap-2 w-full">
                                        <span>{team.teamName}</span>
                                        {team.leagueName && (
                                          <Badge variant="outline" className="text-xs">
                                            {team.leagueName}
                                          </Badge>
                                        )}
                                      </div>
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
                                  {teamsData.map((team: any) => (
                                    <SelectItem key={team.teamId} value={String(team.teamId)}>
                                      <div className="flex items-center justify-between gap-2 w-full">
                                        <span>{team.teamName}</span>
                                        {team.leagueName && (
                                          <Badge variant="outline" className="text-xs">
                                            {team.leagueName}
                                          </Badge>
                                        )}
                                      </div>
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
                        ) : teamsData && Array.isArray(teamsData) && teamsData.length > 0 ? (
                          <>
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
                                  {teamsData.map((team: any) => (
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

                            <div>
                              <Label htmlFor="color-palette">Color Palette</Label>
                              <Select
                                value={overlayColorPalette}
                                onValueChange={(v) => setOverlayColorPalette(v as 'classic' | 'navy' | 'cream' | 'dark')}
                              >
                                <SelectTrigger id="color-palette" data-testid="select-color-palette">
                                  <SelectValue placeholder="Select color palette" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="classic">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C8102E' }} />
                                      Classic LFC
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="navy">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#002147' }} />
                                      Navy Professional
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="cream">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F5F1E9' }} />
                                      Cream Elegant
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="dark">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0A0A0A' }} />
                                      Dark Mode
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                Mailman Media branded color scheme
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="form-title-size">Title Size: {formTitleSize}px</Label>
                              <Slider
                                id="form-title-size"
                                min={12}
                                max={36}
                                step={1}
                                value={[formTitleSize]}
                                onValueChange={(vals) => setFormTitleSize(vals[0])}
                                data-testid="slider-form-title-size"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Size of "RECENT FORM" title text
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="form-circle-size">Circle Size: {formCircleSize}px</Label>
                              <Slider
                                id="form-circle-size"
                                min={30}
                                max={100}
                                step={5}
                                value={[formCircleSize]}
                                onValueChange={(vals) => setFormCircleSize(vals[0])}
                                data-testid="slider-form-circle-size"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Size of W/L/D result circles
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="form-label-size">Label Size: {formLabelSize}px</Label>
                              <Slider
                                id="form-label-size"
                                min={8}
                                max={20}
                                step={1}
                                value={[formLabelSize]}
                                onValueChange={(vals) => setFormLabelSize(vals[0])}
                                data-testid="slider-form-label-size"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Size of WIN/LOSS/DRAW labels
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

                    {(overlayMetricType === 'league-table' || overlayMetricType === 'rss-sentiment') && (
                      <Alert>
                        <AlertDescription>
                          {overlayMetricType === 'league-table'
                            ? 'League Table shows all teams automatically - no team selection needed.'
                            : 'RSS Sentiment displays aggregated news sentiment - no team selection needed.'}
                        </AlertDescription>
                      </Alert>
                    )}

                    {overlayMetricType === 'upcoming-fixtures' && (
                      <div className="space-y-3">
                        <div>
                          <Label>Number of Fixtures</Label>
                          <RadioGroup value={overlayFixtureCount.toString()}
                                      onValueChange={(v) => setOverlayFixtureCount(parseInt(v) as 3 | 5 | 7)}>
                            <div className="flex gap-4">
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="3" id="fixtures-3" />
                                <Label htmlFor="fixtures-3">3</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="5" id="fixtures-5" />
                                <Label htmlFor="fixtures-5">5</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="7" id="fixtures-7" />
                                <Label htmlFor="fixtures-7">7</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={overlayShowCountdown}
                                     onCheckedChange={setOverlayShowCountdown} />
                          <Label>Show Countdown Timer</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={overlayShowOpponentForm}
                                     onCheckedChange={setOverlayShowOpponentForm} />
                          <Label>Show Opponent Form</Label>
                        </div>
                      </div>
                    )}

                    {overlayMetricType === 'player-comparison' && (
                      <div className="space-y-3">
                        <div>
                          <Label>Player 1 ID</Label>
                          <Input type="number" value={overlayPlayer1Id || ''}
                                 onChange={(e) => setOverlayPlayer1Id(parseInt(e.target.value) || null)}
                                 placeholder="Enter player ID" />
                        </div>
                        <div>
                          <Label>Player 2 ID</Label>
                          <Input type="number" value={overlayPlayer2Id || ''}
                                 onChange={(e) => setOverlayPlayer2Id(parseInt(e.target.value) || null)}
                                 placeholder="Enter player ID" />
                        </div>
                        <div>
                          <Label>View Mode</Label>
                          <Select value={overlayViewMode} onValueChange={setOverlayViewMode}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sideBySide">Side by Side</SelectItem>
                              <SelectItem value="radar">Radar Chart</SelectItem>
                              <SelectItem value="bars">Comparison Bars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {overlayMetricType === 'rss-ticker-enhanced' && (
                      <div className="space-y-3">
                        <div>
                          <Label>RSS Sources</Label>
                          {isLoadingRssSources ? (
                            <div className="text-center py-2">
                              <p className="text-sm text-muted-foreground">Loading RSS sources...</p>
                            </div>
                          ) : rssSources && rssSources.length > 0 ? (
                            <div className="space-y-2">
                              {rssSources.map((source) => (
                                <div key={source.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`rss-enhanced-${source.id}`}
                                    checked={selectedRssSourceIds.includes(source.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedRssSourceIds([...selectedRssSourceIds, source.id]);
                                      } else {
                                        setSelectedRssSourceIds(selectedRssSourceIds.filter(id => id !== source.id));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`rss-enhanced-${source.id}`} className="font-normal cursor-pointer">
                                    {source.name}
                                  </Label>
                                </div>
                              ))}
                              <div className="text-sm text-muted-foreground mt-2">
                                {selectedRssSourceIds.length} source(s) selected
                              </div>
                            </div>
                          ) : (
                            <Alert data-testid="alert-no-rss-sources-enhanced">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                No RSS sources available. Go to RSS Intelligence to add sources.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div>
                          <Label>Max Articles</Label>
                          <Input type="number" value={rssMaxArticles}
                                 onChange={(e) => setRssMaxArticles(parseInt(e.target.value) || 10)}
                                 min={1} max={50} />
                        </div>

                        <div className="space-y-2">
                          <Label>Display Options</Label>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={overlayShowSentiment}
                                     onCheckedChange={(checked) => setOverlayShowSentiment(checked === true)} />
                            <Label>Show Sentiment Colors</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={overlayShowTopics}
                                     onCheckedChange={(checked) => setOverlayShowTopics(checked === true)} />
                            <Label>Show Topics</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={overlayShowKeywords}
                                     onCheckedChange={(checked) => setOverlayShowKeywords(checked === true)} />
                            <Label>Show Keywords</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={overlayShowCredibility}
                                     onCheckedChange={(checked) => setOverlayShowCredibility(checked === true)} />
                            <Label>Show Source Tier</Label>
                          </div>
                        </div>

                        <div>
                          <Label>Sentiment Filter Range</Label>
                          <div className="flex gap-2 items-center">
                            <Input type="number" value={overlaySentimentMin}
                                   onChange={(e) => setOverlaySentimentMin(parseFloat(e.target.value) || -1)}
                                   min={-1} max={1} step={0.1} className="w-20" />
                            <span>to</span>
                            <Input type="number" value={overlaySentimentMax}
                                   onChange={(e) => setOverlaySentimentMax(parseFloat(e.target.value) || 1)}
                                   min={-1} max={1} step={0.1} className="w-20" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Filters Section */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-sm">Data Filters</h3>

                  {/* Competition Selector */}
                  <div>
                    <Label>Competition</Label>
                    <Select
                      value={overlayCompetitionId?.toString() || 'all'}
                      onValueChange={(v) => setOverlayCompetitionId(v === 'all' ? null : parseInt(v))}
                    >
                      <SelectTrigger data-testid="select-competition">
                        <SelectValue placeholder="All Competitions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Competitions</SelectItem>
                        {competitions.map((comp: any) => (
                          <SelectItem key={comp.id} value={comp.id.toString()}>{comp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Season Selector */}
                  <div>
                    <Label>Season</Label>
                    <Select
                      value={overlaySeasonFilter?.toString() || 'current'}
                      onValueChange={(v) => setOverlaySeasonFilter(v === 'current' ? null : parseInt(v))}
                    >
                      <SelectTrigger data-testid="select-season">
                        <SelectValue placeholder="Current Season" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current Season</SelectItem>
                        <SelectItem value="2025">2024/25</SelectItem>
                        <SelectItem value="2024">2023/24</SelectItem>
                        <SelectItem value="2023">2022/23</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Form Guide specific: Match Limit */}
                  {overlayMetricType === 'form-guide' && (
                    <div>
                      <Label>Match Limit</Label>
                      <RadioGroup
                        value={overlayMatchLimit.toString()}
                        onValueChange={(v) => setOverlayMatchLimit(parseInt(v) as 3 | 5 | 10 | 20)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="3" id="limit-3" />
                            <Label htmlFor="limit-3">3</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="5" id="limit-5" />
                            <Label htmlFor="limit-5">5</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="10" id="limit-10" />
                            <Label htmlFor="limit-10">10</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="20" id="limit-20" />
                            <Label htmlFor="limit-20">20</Label>
                          </div>
                        </div>
                      </RadioGroup>
                      <div className="mt-2">
                        <Label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={overlayShowCompBadges}
                            onCheckedChange={(checked) => setOverlayShowCompBadges(checked === true)}
                          />
                          Show Competition Badges
                        </Label>
                      </div>
                    </div>
                  )}

                  {/* H2H specific: Venue Filter */}
                  {overlayMetricType === 'h2h-card' && (
                    <div>
                      <Label>Venue Filter</Label>
                      <RadioGroup
                        value={overlayVenueFilter}
                        onValueChange={(v) => setOverlayVenueFilter(v as 'all' | 'home' | 'away')}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="all" id="venue-all" />
                            <Label htmlFor="venue-all">All</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="home" id="venue-home" />
                            <Label htmlFor="venue-home">Home</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="away" id="venue-away" />
                            <Label htmlFor="venue-away">Away</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* League Table specific: Team Count */}
                  {overlayMetricType === 'league-table' && (
                    <div>
                      <Label>Teams to Display</Label>
                      <RadioGroup
                        value={overlayTeamCount.toString()}
                        onValueChange={(v) => setOverlayTeamCount(v === 'full' ? 'full' : parseInt(v) as 5 | 10 | 20)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="5" id="count-5" />
                            <Label htmlFor="count-5">Top 5</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="10" id="count-10" />
                            <Label htmlFor="count-10">Top 10</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="20" id="count-20" />
                            <Label htmlFor="count-20">Top 20</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="full" id="count-full" />
                            <Label htmlFor="count-full">Full Table</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
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

            {(overlayType === 'text' || overlayType === 'rss') && (
              <>
                <div>
                  <Label htmlFor="ticker-color-palette">Color Palette</Label>
                  <Select value={overlayColorPalette} onValueChange={(v) => setOverlayColorPalette(v as 'classic' | 'navy' | 'cream' | 'dark')}>
                    <SelectTrigger id="ticker-color-palette" data-testid="select-ticker-color-palette">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C8102E' }} />
                          Classic LFC
                        </div>
                      </SelectItem>
                      <SelectItem value="navy">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#002147' }} />
                          Navy Professional
                        </div>
                      </SelectItem>
                      <SelectItem value="cream">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F5F1E9' }} />
                          Cream Elegant
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0A0A0A' }} />
                          Dark Mode
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mailman Media branded color scheme
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

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" data-testid="button-advanced-styling">
                      Advanced Styling
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Typography</h4>

                      <div>
                        <Label>Font Weight: {overlayFontWeight}</Label>
                        <Slider
                          value={[overlayFontWeight]}
                          onValueChange={(v) => setOverlayFontWeight(v[0])}
                          min={300}
                          max={900}
                          step={100}
                          data-testid="slider-font-weight"
                        />
                      </div>

                      <div>
                        <Label>Letter Spacing: {overlayLetterSpacing.toFixed(2)}em</Label>
                        <Slider
                          value={[overlayLetterSpacing]}
                          onValueChange={(v) => setOverlayLetterSpacing(v[0])}
                          min={-0.1}
                          max={0.2}
                          step={0.01}
                          data-testid="slider-letter-spacing"
                        />
                      </div>

                      <div>
                        <Label>Line Height: {overlayLineHeight.toFixed(1)}</Label>
                        <Slider
                          value={[overlayLineHeight]}
                          onValueChange={(v) => setOverlayLineHeight(v[0])}
                          min={0.8}
                          max={2.0}
                          step={0.1}
                          data-testid="slider-line-height"
                        />
                      </div>

                      <div>
                        <Label>Text Transform</Label>
                        <Select value={overlayTextTransform} onValueChange={setOverlayTextTransform}>
                          <SelectTrigger data-testid="select-text-transform">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="uppercase">UPPERCASE</SelectItem>
                            <SelectItem value="lowercase">lowercase</SelectItem>
                            <SelectItem value="capitalize">Capitalize</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Background</h4>

                      <div>
                        <Label>Background Type</Label>
                        <Select value={overlayBackgroundType} onValueChange={setOverlayBackgroundType}>
                          <SelectTrigger data-testid="select-background-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid Color</SelectItem>
                            <SelectItem value="linear-gradient">Linear Gradient</SelectItem>
                            <SelectItem value="radial-gradient">Radial Gradient</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {overlayBackgroundType !== 'solid' && (
                        <>
                          <div>
                            <Label>Gradient Color 1</Label>
                            <Input
                              type="color"
                              value={overlayGradientColor1}
                              onChange={(e) => setOverlayGradientColor1(e.target.value)}
                              data-testid="input-gradient-color1"
                            />
                          </div>
                          <div>
                            <Label>Gradient Color 2</Label>
                            <Input
                              type="color"
                              value={overlayGradientColor2}
                              onChange={(e) => setOverlayGradientColor2(e.target.value)}
                              data-testid="input-gradient-color2"
                            />
                          </div>
                          {overlayBackgroundType === 'linear-gradient' && (
                            <div>
                              <Label>Gradient Angle: {overlayGradientAngle}°</Label>
                              <Slider
                                value={[overlayGradientAngle]}
                                onValueChange={(v) => setOverlayGradientAngle(v[0])}
                                min={0}
                                max={360}
                                step={15}
                                data-testid="slider-gradient-angle"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Border & Effects</h4>

                      <div>
                        <Label>Border Radius: {overlayBorderRadius}px</Label>
                        <Slider
                          value={[overlayBorderRadius]}
                          onValueChange={(v) => setOverlayBorderRadius(v[0])}
                          min={0}
                          max={24}
                          step={2}
                          data-testid="slider-border-radius"
                        />
                      </div>

                      <div>
                        <Label>Border Style</Label>
                        <Select value={overlayBorderStyle} onValueChange={setOverlayBorderStyle}>
                          <SelectTrigger data-testid="select-border-style">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="dashed">Dashed</SelectItem>
                            <SelectItem value="dotted">Dotted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={overlayGlowEffect}
                            onCheckedChange={setOverlayGlowEffect}
                            data-testid="checkbox-glow-effect"
                          />
                          Glow Effect
                        </Label>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

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
              {/* Render active overlays */}
              {overlays.map((overlay) => {
                const OverlayComponent = getOverlayComponent(overlay.overlayType); // Use overlayType here
                if (!OverlayComponent) {
                  // Render non-component overlays (text, images)
                  if (overlay.overlayType === 'text') {
                    return (
                      <div
                        key={overlay.id}
                        data-overlay-id={overlay.id}
                        className={`absolute rounded pointer-events-none ${
                          overlay.id === editingPositionOverlayId
                            ? 'bg-primary/30 border-2 border-primary z-10'
                            : 'bg-white/10 border border-white/30'
                        }`}
                        style={{
                          left: `${overlay.id === editingPositionOverlayId ? overlayX : overlay.x}%`,
                          top: `${overlay.id === editingPositionOverlayId ? overlayY : overlay.y}px`,
                          width: `${overlay.width}%`,
                          height: `${overlay.height}px`,
                          zIndex: overlay.zIndex,
                          opacity: overlay.opacity,
                        }}
                      >
                        {overlay.id === editingPositionOverlayId && (
                          <div className="absolute -top-6 left-0 text-xs text-primary font-mono bg-black/70 px-1 rounded whitespace-nowrap">
                            ({snapToGrid(overlay.id === editingPositionOverlayId ? overlayX : overlay.x)}, {snapToGrid(overlay.id === editingPositionOverlayId ? overlayY : overlay.y)}) - {overlay.width}% × {overlay.height}px
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (overlay.overlayType === 'image' && overlay.imageUrl) {
                    return (
                      <div
                        key={overlay.id}
                        data-overlay-id={overlay.id}
                        className={`absolute rounded pointer-events-none ${
                          overlay.id === editingPositionOverlayId
                            ? 'bg-primary/30 border-2 border-primary z-10'
                            : 'bg-white/10 border border-white/30'
                        }`}
                        style={{
                          left: `${overlay.id === editingPositionOverlayId ? overlayX : overlay.x}%`,
                          top: `${overlay.id === editingPositionOverlayId ? overlayY : overlay.y}px`,
                          width: `${overlay.width}%`,
                          height: `${overlay.height}px`,
                          zIndex: overlay.zIndex,
                          opacity: overlay.opacity,
                        }}
                      >
                        {overlay.id === editingPositionOverlayId && (
                          <div className="absolute -top-6 left-0 text-xs text-primary font-mono bg-black/70 px-1 rounded whitespace-nowrap">
                            ({snapToGrid(overlay.id === editingPositionOverlayId ? overlayX : overlay.x)}, {snapToGrid(overlay.id === editingPositionOverlayId ? overlayY : overlay.y)}) - {overlay.width}% × {overlay.height}px
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }

                // Render component-based overlays
                const isEditing = overlay.id === editingPositionOverlayId;
                const x = isEditing ? overlayX : overlay.x;
                const y = isEditing ? overlayY : overlay.y;

                return (
                  <OverlayErrorBoundary key={overlay.id} overlayId={overlay.id}>
                    <div
                      className={`absolute rounded pointer-events-none ${
                        isEditing
                          ? 'bg-primary/30 border-2 border-primary z-10'
                          : 'bg-white/10 border border-white/30'
                      }`}
                      style={{
                        left: `${(x / outputResolution.width) * 100}%`,
                        top: `${(y / outputResolution.height) * 100}%`,
                        width: `${overlay.width}%`,
                        height: `${overlay.height}px`,
                        zIndex: overlay.zIndex,
                        opacity: overlay.opacity,
                      }}
                    >
                      {isEditing && (
                        <div className="absolute -top-6 left-0 text-xs text-primary font-mono bg-black/70 px-1 rounded whitespace-nowrap">
                          ({snapToGrid(x)}, {snapToGrid(y)}) - {overlay.width}% × {overlay.height}px
                        </div>
                      )}
                    </div>
                  </OverlayErrorBoundary>
                );
              })}
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