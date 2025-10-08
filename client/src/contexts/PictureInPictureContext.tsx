import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

const PIP_STATE_KEY = 'pip_state';

interface PiPState {
  isActive: boolean;
  lastActivated: number;
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
  const [isPiPActive, setIsPiPActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const portalRef = useRef<HTMLElement | null>(null);
  const leavePiPHandlerRef = useRef<(() => void) | null>(null);
  const enterPiPHandlerRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();

  // Get the pip-portal element and re-attach listeners to existing PiP
  useEffect(() => {
    const portal = document.getElementById('pip-portal');
    if (!portal) {
      console.error('PiP portal not found in DOM');
      return;
    }
    portalRef.current = portal;

    // Check if there's already a video element in the portal (from previous session)
    const existingVideo = portal.querySelector('video');
    if (existingVideo && document.pictureInPictureElement === existingVideo) {
      // PiP is already active from before - MUST re-attach listeners now
      videoRef.current = existingVideo as HTMLVideoElement;
      setIsPiPActive(true);
      console.log('Found existing PiP session - re-attaching listeners');
      
      // Re-attach fresh listeners immediately via createPersistentVideo
      // This is CRITICAL - without this, old listeners with stale closures remain
      createPersistentVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save PiP state to localStorage
  const savePiPState = useCallback((isActive: boolean) => {
    try {
      const state: PiPState = {
        isActive,
        lastActivated: Date.now(),
      };
      localStorage.setItem(PIP_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving PiP state:', error);
    }
  }, []);

  // Create persistent video element in portal
  const createPersistentVideo = useCallback(() => {
    if (!portalRef.current) {
      console.error('Portal not available');
      return null;
    }

    // Check if video already exists
    let video = portalRef.current.querySelector('video') as HTMLVideoElement | null;
    let isNewVideo = false;
    
    if (!video) {
      // Create new video element in the portal
      video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      portalRef.current.appendChild(video);
      isNewVideo = true;
      console.log('Created new persistent video element in portal');
    }

    // Remove old event listeners if they exist
    if (leavePiPHandlerRef.current) {
      video.removeEventListener('leavepictureinpicture', leavePiPHandlerRef.current);
    }
    if (enterPiPHandlerRef.current) {
      video.removeEventListener('enterpictureinpicture', enterPiPHandlerRef.current);
    }

    // Define NEW event handlers with current closure
    const handleLeavePiP = () => {
      console.log('User closed PiP window - cleaning up');
      setIsPiPActive(false);
      savePiPState(false);
      
      // Stop stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Remove video element from portal
      if (videoRef.current && portalRef.current && portalRef.current.contains(videoRef.current)) {
        portalRef.current.removeChild(videoRef.current);
        videoRef.current = null;
      }
      
      canvasRef.current = null;
      
      // Clear handler refs
      leavePiPHandlerRef.current = null;
      enterPiPHandlerRef.current = null;
    };
    
    const handleEnterPiP = () => {
      console.log('Entered PiP mode');
      setIsPiPActive(true);
      savePiPState(true);
    };

    // Store handler references for future removal
    leavePiPHandlerRef.current = handleLeavePiP;
    enterPiPHandlerRef.current = handleEnterPiP;
    
    // Attach fresh event listeners tied to current provider instance
    video.addEventListener('leavepictureinpicture', handleLeavePiP);
    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    
    console.log(isNewVideo ? 'Attached event listeners to new video' : 'Re-attached event listeners to existing video');

    videoRef.current = video;
    return video;
  }, [savePiPState]);

  // Update the canvas stream
  const updateStream = useCallback((canvas: HTMLCanvasElement) => {
    if (!videoRef.current) return;

    try {
      // Stop old stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Create new stream from canvas
      // captureStream() creates a live MediaStream that continuously captures from the canvas
      const stream = canvas.captureStream(30);
      streamRef.current = stream;
      
      // Update video source
      videoRef.current.srcObject = stream;
      
      console.log('Updated PiP stream from canvas');
    } catch (error) {
      console.error('Error updating stream:', error);
    }
  }, []);

  const startPiP = useCallback(async (canvas: HTMLCanvasElement) => {
    try {
      // Check if PiP is supported
      if (!document.pictureInPictureEnabled) {
        throw new Error('Picture-in-Picture is not supported in your browser');
      }

      // Create or get persistent video element
      const video = createPersistentVideo();
      if (!video) {
        throw new Error('Failed to create video element');
      }

      // Store canvas reference
      canvasRef.current = canvas;

      // Check if already in PiP mode
      if (document.pictureInPictureElement === video) {
        console.log('PiP already active, just updating stream');
        updateStream(canvas);
        setIsPiPActive(true);
        savePiPState(true);
        return;
      }

      // Capture canvas stream
      // captureStream() creates a MediaStream that continuously updates as canvas changes
      const stream = canvas.captureStream(30);
      streamRef.current = stream;
      
      video.srcObject = stream;
      await video.play();
      
      // Small delay to ensure stream is rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Request PiP - only call this once
      await video.requestPictureInPicture();
      setIsPiPActive(true);
      savePiPState(true);
      
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
  }, [createPersistentVideo, updateStream, toast, savePiPState]);

  const stopPiP = useCallback(async () => {
    try {
      // Exit PiP
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
      
      // Stop stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Remove video element from portal
      if (videoRef.current && portalRef.current && portalRef.current.contains(videoRef.current)) {
        portalRef.current.removeChild(videoRef.current);
        videoRef.current = null;
      }

      canvasRef.current = null;
      setIsPiPActive(false);
      savePiPState(false);
      
      console.log('PiP stopped and cleaned up');
    } catch (error) {
      console.error('Error stopping PiP:', error);
    }
  }, [savePiPState]);

  const updateCanvasStream = useCallback((canvas: HTMLCanvasElement) => {
    if (isPiPActive && videoRef.current) {
      canvasRef.current = canvas;
      updateStream(canvas);
    }
  }, [isPiPActive, updateStream]);

  // Restore PiP if it was previously active
  const restorePiP = useCallback(async (canvas: HTMLCanvasElement) => {
    try {
      // Check if PiP video element exists and is in PiP mode
      if (videoRef.current && document.pictureInPictureElement === videoRef.current) {
        console.log('Restoring PiP session with new canvas');
        
        // CRITICAL: Re-attach event listeners with current provider instance
        // This ensures cleanup works if user closes PiP after navigation
        createPersistentVideo();
        
        canvasRef.current = canvas;
        updateStream(canvas);
        setIsPiPActive(true);
        
        toast({
          title: 'PiP Reconnected',
          description: 'Your floating broadcast has been reconnected to the canvas.',
        });
        return;
      }

      // Check localStorage for recent PiP session
      const stored = localStorage.getItem(PIP_STATE_KEY);
      if (stored) {
        const state: PiPState = JSON.parse(stored);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        if (state.isActive && state.lastActivated > fiveMinutesAgo) {
          console.log('Attempting to restore PiP session from localStorage...');
          await startPiP(canvas);
        }
      }
    } catch (error) {
      console.error('Error restoring PiP:', error);
      savePiPState(false);
    }
  }, [updateStream, startPiP, toast, savePiPState, createPersistentVideo]);

  // Event listeners are now attached directly in createPersistentVideo()

  // Cleanup on unmount - but DON'T remove video if PiP is active
  useEffect(() => {
    return () => {
      // CRITICAL: Don't clean up if PiP is active - let it persist
      // The video element and PiP window must survive React unmounting
      console.log('PiP provider cleanup (keeping PiP alive if active)');
    };
  }, []);

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
