import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// LocalStorage keys for persisting PiP state
const PIP_STATE_KEY = 'pip_state';
const PIP_CONFIG_KEY = 'pip_config';

interface PiPState {
  isActive: boolean;
  lastActivated: number;
  canvasConfig?: {
    width: number;
    height: number;
  };
}

interface PiPContextType {
  isPiPActive: boolean;
  startPiP: (canvas: HTMLCanvasElement) => Promise<void>;
  stopPiP: () => Promise<void>;
  updateCanvasStream: (canvas: HTMLCanvasElement) => void;
  restorePiP: (canvas: HTMLCanvasElement) => Promise<void>;
}

const PiPContext = createContext<PiPContextType | null>(null);

export function PiPProvider({ children }: { children: ReactNode }) {
  const [isPiPActive, setIsPiPActive] = useState(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(PIP_STATE_KEY);
      if (stored) {
        const state: PiPState = JSON.parse(stored);
        // Check if PiP was active recently (within 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return state.isActive && state.lastActivated > fiveMinutesAgo;
      }
    } catch (error) {
      console.error('Error loading PiP state:', error);
    }
    return false;
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const restorationAttempted = useRef(false);
  const { toast } = useToast();

  // Initialize video element
  useEffect(() => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.style.position = 'fixed';
    video.style.bottom = '-200px'; // Position off-screen
    video.style.right = '-200px';
    video.style.width = '1px'; // Tiny size
    video.style.height = '1px';
    video.style.opacity = '0'; // Invisible
    video.style.zIndex = '-1'; // Behind everything
    video.style.pointerEvents = 'none'; // No interaction
    videoRef.current = video;
    document.body.appendChild(video);

    return () => {
      if (videoRef.current) {
        document.body.removeChild(videoRef.current);
      }
    };
  }, []);

  // Save PiP state to localStorage
  const savePiPState = useCallback((isActive: boolean, canvas?: HTMLCanvasElement) => {
    try {
      const state: PiPState = {
        isActive,
        lastActivated: Date.now(),
        canvasConfig: canvas ? {
          width: canvas.width,
          height: canvas.height
        } : undefined
      };
      localStorage.setItem(PIP_STATE_KEY, JSON.stringify(state));
      
      // Also save config for restoration
      if (isActive && canvas) {
        const config = {
          width: canvas.width,
          height: canvas.height,
          timestamp: Date.now()
        };
        localStorage.setItem(PIP_CONFIG_KEY, JSON.stringify(config));
      }
    } catch (error) {
      console.error('Error saving PiP state:', error);
    }
  }, []);

  const captureCanvasToStream = useCallback(() => {
    if (!canvasRef.current || !streamRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The canvas already has content from VideoCompositor
    // We just need to capture it as a stream
    const stream = canvas.captureStream(30);
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    }
  }, []);

  const startPiP = useCallback(async (canvas: HTMLCanvasElement) => {
    try {
      if (!videoRef.current) {
        throw new Error('Video element not initialized');
      }

      // Check if PiP is supported
      if (!document.pictureInPictureEnabled) {
        throw new Error('Picture-in-Picture is not supported in your browser');
      }

      // Store canvas reference
      canvasRef.current = canvas;

      // Capture canvas stream
      const stream = canvas.captureStream(30); // 30 fps
      streamRef.current = stream;
      
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      // Small delay to ensure stream is rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Request PiP
      await videoRef.current.requestPictureInPicture();
      setIsPiPActive(true);
      
      // Save state for persistence
      savePiPState(true, canvas);
      
      toast({
        title: 'Picture-in-Picture Active',
        description: 'Broadcast is now floating. Navigate anywhere while it stays on screen.',
      });
    } catch (error) {
      console.error('PiP error:', error);
      toast({
        title: 'PiP Error',
        description: error instanceof Error ? error.message : 'Failed to start Picture-in-Picture',
        variant: 'destructive',
      });
      setIsPiPActive(false);
      savePiPState(false);
    }
  }, [toast, savePiPState]);

  const stopPiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      canvasRef.current = null;
      setIsPiPActive(false);
      
      // Clear localStorage state
      savePiPState(false);
      localStorage.removeItem(PIP_CONFIG_KEY);
    } catch (error) {
      console.error('Error stopping PiP:', error);
    }
  }, [savePiPState]);

  const updateCanvasStream = useCallback((canvas: HTMLCanvasElement) => {
    if (isPiPActive) {
      canvasRef.current = canvas;
      captureCanvasToStream();
    }
  }, [isPiPActive, captureCanvasToStream]);

  // Restore PiP if it was previously active
  const restorePiP = useCallback(async (canvas: HTMLCanvasElement) => {
    if (restorationAttempted.current) return;
    restorationAttempted.current = true;

    try {
      const stored = localStorage.getItem(PIP_STATE_KEY);
      if (!stored) return;

      const state: PiPState = JSON.parse(stored);
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      
      if (state.isActive && state.lastActivated > fiveMinutesAgo) {
        console.log('Attempting to restore PiP session...');
        await startPiP(canvas);
        
        toast({
          title: 'PiP Restored',
          description: 'Your floating broadcast has been restored.',
        });
      }
    } catch (error) {
      console.error('Error restoring PiP:', error);
      savePiPState(false);
    }
  }, [startPiP, toast, savePiPState]);

  // Handle PiP events
  useEffect(() => {
    const handleLeavePiP = () => {
      setIsPiPActive(false);
      savePiPState(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      canvasRef.current = null;
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('leavepictureinpicture', handleLeavePiP);
      return () => {
        video.removeEventListener('leavepictureinpicture', handleLeavePiP);
      };
    }
  }, [savePiPState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPiPActive && document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(console.error);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isPiPActive]);

  return (
    <PiPContext.Provider value={{ isPiPActive, startPiP, stopPiP, updateCanvasStream, restorePiP }}>
      {children}
    </PiPContext.Provider>
  );
}

export function usePiP() {
  const context = useContext(PiPContext);
  if (!context) {
    throw new Error('usePiP must be used within PiPProvider');
  }
  return context;
}
