import { createContext, useContext, useRef, useCallback, useMemo, ReactNode } from 'react';

export enum ScreenShareErrorType {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  USER_CANCELLED = 'USER_CANCELLED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN'
}

export class ScreenShareError extends Error {
  constructor(
    public type: ScreenShareErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ScreenShareError';
  }
}

export function checkScreenShareSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
}

interface CameraStreamContextType {
  acquireStream: (sourceId: string, deviceId: string) => Promise<MediaStream>;
  acquireScreenShare: (sourceId: string) => Promise<MediaStream>;
  releaseStream: (sourceId: string) => void;
  releaseAllStreams: () => void;
  hasStream: (sourceId: string) => boolean;
  isScreenShareSupported: boolean;
}

const CameraStreamContext = createContext<CameraStreamContextType | null>(null);

interface CameraStreamProviderProps {
  children: ReactNode;
}

interface StreamInfo {
  stream: MediaStream;
  refCount: number;
}

export function CameraStreamProvider({ children }: CameraStreamProviderProps) {
  const streamsRef = useRef<Map<string, StreamInfo>>(new Map());
  const requestsRef = useRef<Map<string, Promise<MediaStream>>>(new Map());
  const isScreenShareSupported = useMemo(() => checkScreenShareSupport(), []);

  const acquireStream = useCallback(async (sourceId: string, deviceId: string): Promise<MediaStream> => {
    const existing = streamsRef.current.get(sourceId);
    if (existing) {
      if (existing.stream.active) {
        existing.refCount++;
        return existing.stream;
      } else {
        streamsRef.current.delete(sourceId);
        requestsRef.current.delete(sourceId);
      }
    }

    if (requestsRef.current.has(sourceId)) {
      const stream = await requestsRef.current.get(sourceId)!;
      const info = streamsRef.current.get(sourceId);
      if (info) {
        info.refCount++;
      }
      return stream;
    }

    const streamRequest = navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });

    requestsRef.current.set(sourceId, streamRequest);

    try {
      const stream = await streamRequest;
      streamsRef.current.set(sourceId, { stream, refCount: 1 });
      requestsRef.current.delete(sourceId);
      return stream;
    } catch (error) {
      requestsRef.current.delete(sourceId);
      throw error;
    }
  }, []);

  const acquireScreenShare = useCallback(async (sourceId: string): Promise<MediaStream> => {
    // Check if screen sharing is supported
    if (!checkScreenShareSupport()) {
      throw new ScreenShareError(
        ScreenShareErrorType.NOT_SUPPORTED,
        'Screen sharing is not supported in this browser. Please use Chrome, Edge, Safari 13+, or Firefox.'
      );
    }

    const existing = streamsRef.current.get(sourceId);
    if (existing) {
      if (existing.stream.active) {
        existing.refCount++;
        return existing.stream;
      } else {
        streamsRef.current.delete(sourceId);
        requestsRef.current.delete(sourceId);
      }
    }

    if (requestsRef.current.has(sourceId)) {
      const stream = await requestsRef.current.get(sourceId)!;
      const info = streamsRef.current.get(sourceId);
      if (info) {
        info.refCount++;
      }
      return stream;
    }

    const streamRequest = navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    requestsRef.current.set(sourceId, streamRequest);

    try {
      const stream = await streamRequest;
      streamsRef.current.set(sourceId, { stream, refCount: 1 });
      requestsRef.current.delete(sourceId);
      return stream;
    } catch (error) {
      requestsRef.current.delete(sourceId);
      
      // Parse error to determine type
      const err = error as Error;
      const errorMessage = err.message?.toLowerCase() || '';
      const errorName = err.name?.toLowerCase() || '';

      // User cancelled the screen share dialog
      if (
        errorName === 'notallowederror' ||
        errorName === 'aborterror' ||
        errorMessage.includes('cancel') ||
        errorMessage.includes('denied by the user')
      ) {
        throw new ScreenShareError(
          ScreenShareErrorType.USER_CANCELLED,
          'Screen sharing was cancelled. Please try again and select a screen/window to share.',
          err
        );
      }

      // Permission denied
      if (
        errorName === 'notallowederror' ||
        errorName === 'permissiondeniederror' ||
        errorMessage.includes('permission') ||
        errorMessage.includes('denied')
      ) {
        throw new ScreenShareError(
          ScreenShareErrorType.PERMISSION_DENIED,
          'Screen sharing permission was denied. Please check your browser settings and allow screen sharing.',
          err
        );
      }

      // Unknown error
      throw new ScreenShareError(
        ScreenShareErrorType.UNKNOWN,
        'Failed to start screen sharing. Please try again.',
        err
      );
    }
  }, []);

  const releaseStream = useCallback((sourceId: string) => {
    const info = streamsRef.current.get(sourceId);
    if (info) {
      info.refCount--;
      if (info.refCount <= 0) {
        info.stream.getTracks().forEach(track => track.stop());
        streamsRef.current.delete(sourceId);
        requestsRef.current.delete(sourceId);
      }
    }
  }, []);

  const releaseAllStreams = useCallback(() => {
    streamsRef.current.forEach(info => {
      info.stream.getTracks().forEach(track => track.stop());
    });
    streamsRef.current.clear();
    requestsRef.current.clear();
  }, []);

  const hasStream = useCallback((sourceId: string): boolean => {
    return streamsRef.current.has(sourceId);
  }, []);

  const value: CameraStreamContextType = useMemo(() => ({
    acquireStream,
    acquireScreenShare,
    releaseStream,
    releaseAllStreams,
    hasStream,
    isScreenShareSupported,
  }), [acquireStream, acquireScreenShare, releaseStream, releaseAllStreams, hasStream, isScreenShareSupported]);

  return (
    <CameraStreamContext.Provider value={value}>
      {children}
    </CameraStreamContext.Provider>
  );
}

export function useCameraStreams() {
  const context = useContext(CameraStreamContext);
  if (!context) {
    throw new Error('useCameraStreams must be used within CameraStreamProvider');
  }
  return context;
}
