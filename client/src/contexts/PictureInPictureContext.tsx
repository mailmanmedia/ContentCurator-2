import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PiPContextType {
  isPiPActive: boolean;
  startPiP: (canvas: HTMLCanvasElement) => Promise<void>;
  stopPiP: () => Promise<void>;
  updateCanvasStream: (canvas: HTMLCanvasElement) => void;
}

const PiPContext = createContext<PiPContextType | null>(null);

export function PiPProvider({ children }: { children: ReactNode }) {
  const [isPiPActive, setIsPiPActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
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
    }
  }, [toast]);

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
    } catch (error) {
      console.error('Error stopping PiP:', error);
    }
  }, []);

  const updateCanvasStream = useCallback((canvas: HTMLCanvasElement) => {
    if (isPiPActive) {
      canvasRef.current = canvas;
      captureCanvasToStream();
    }
  }, [isPiPActive, captureCanvasToStream]);

  // Handle PiP events
  useEffect(() => {
    const handleLeavePiP = () => {
      setIsPiPActive(false);
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
  }, []);

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
    <PiPContext.Provider value={{ isPiPActive, startPiP, stopPiP, updateCanvasStream }}>
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
