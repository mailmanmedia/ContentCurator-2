import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import type { VideoCompositorRef } from '@/components/VideoCompositor';

export interface ActiveSource {
  id: string;
  name: string;
  type: 'camera' | 'screen';
  deviceId?: string;
  deviceLabel?: string;
  stream?: MediaStream;
  resolution?: string;
  customWidth?: number;
  customHeight?: number;
  healthStatus?: 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastError?: string;
  reconnectAttempts?: number;
}

export interface OverlayConfig {
  id: string;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  height?: number;
  isBold?: boolean;
  isItalic?: boolean;
  animationType?: 'scroll' | 'fade' | 'static';
  scrollSpeed?: number;
  scrollDirection?: 'left' | 'right' | 'up' | 'down';
  position: 'top' | 'bottom';
  overlayType: 'text' | 'image' | 'rss' | 'video' | 'metric';
  imageUrl?: string;
  imageData?: string;
  visible?: boolean;
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

interface LivePresentationState {
  // Sources
  activeSources: ActiveSource[];
  setActiveSources: (sources: ActiveSource[] | ((prev: ActiveSource[]) => ActiveSource[])) => void;
  
  // Overlays
  overlays: OverlayConfig[];
  setOverlays: (overlays: OverlayConfig[] | ((prev: OverlayConfig[]) => OverlayConfig[])) => void;
  
  // Broadcasting
  isBroadcasting: boolean;
  setIsBroadcasting: (value: boolean) => void;
  
  // Output settings
  outputResolution: { width: number; height: number };
  setOutputResolution: (res: { width: number; height: number }) => void;
  globalFitMode: 'contain' | 'cover' | 'fill';
  setGlobalFitMode: (mode: 'contain' | 'cover' | 'fill') => void;
  sourceFitModes: Record<string, 'contain' | 'cover' | 'fill'>;
  setSourceFitModes: (modes: Record<string, 'contain' | 'cover' | 'fill'>) => void;
  sourceSettings: Record<string, { resolution?: string; customWidth?: number; customHeight?: number }>;
  setSourceSettings: (settings: Record<string, { resolution?: string; customWidth?: number; customHeight?: number }>) => void;
  
  // Cameras
  cameras: MediaDeviceInfo[];
  setCameras: (cameras: MediaDeviceInfo[]) => void;
  cameraPermissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';
  setCameraPermissionStatus: (status: 'unknown' | 'granted' | 'denied' | 'prompt') => void;
  needsPermission: boolean;
  setNeedsPermission: (value: boolean) => void;
  
  // SSE Status
  sseStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  setSSEStatus: (status: 'connected' | 'disconnected' | 'error' | 'connecting') => void;
  sseError: string | null;
  setSSEError: (error: string | null) => void;
  sseReconnectAttempts: number;
  setSSEReconnectAttempts: (attempts: number) => void;
  
  // Compositor ref
  compositorRef: React.RefObject<VideoCompositorRef>;
}

const LivePresentationContext = createContext<LivePresentationState | null>(null);

export function useLivePresentationContext() {
  const context = useContext(LivePresentationContext);
  if (!context) {
    throw new Error('useLivePresentationContext must be used within LivePresentationProvider');
  }
  return context;
}

export function LivePresentationProvider({ children }: { children: ReactNode }) {
  const [activeSources, setActiveSources] = useState<ActiveSource[]>([]);
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [needsPermission, setNeedsPermission] = useState(false);
  const [sseStatus, setSSEStatus] = useState<'connected' | 'disconnected' | 'error' | 'connecting'>('disconnected');
  const [sseError, setSSEError] = useState<string | null>(null);
  const [sseReconnectAttempts, setSSEReconnectAttempts] = useState(0);
  const [outputResolution, setOutputResolution] = useState({ width: 3840, height: 2160 });
  const [globalFitMode, setGlobalFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [sourceFitModes, setSourceFitModes] = useState<Record<string, 'contain' | 'cover' | 'fill'>>({});
  const [sourceSettings, setSourceSettings] = useState<Record<string, { resolution?: string; customWidth?: number; customHeight?: number }>>({});
  
  const compositorRef = useRef<VideoCompositorRef>(null);

  const value: LivePresentationState = {
    activeSources,
    setActiveSources,
    overlays,
    setOverlays,
    isBroadcasting,
    setIsBroadcasting,
    outputResolution,
    setOutputResolution,
    globalFitMode,
    setGlobalFitMode,
    sourceFitModes,
    setSourceFitModes,
    sourceSettings,
    setSourceSettings,
    cameras,
    setCameras,
    cameraPermissionStatus,
    setCameraPermissionStatus,
    needsPermission,
    setNeedsPermission,
    sseStatus,
    setSSEStatus,
    sseError,
    setSSEError,
    sseReconnectAttempts,
    setSSEReconnectAttempts,
    compositorRef,
  };

  return (
    <LivePresentationContext.Provider value={value}>
      {children}
    </LivePresentationContext.Provider>
  );
}
