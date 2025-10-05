import { createContext, useContext, useRef, useCallback, useMemo, ReactNode } from 'react';

interface CameraStreamContextType {
  acquireStream: (sourceId: string, deviceId: string) => Promise<MediaStream>;
  acquireScreenShare: (sourceId: string) => Promise<MediaStream>;
  releaseStream: (sourceId: string) => void;
  releaseAllStreams: () => void;
  hasStream: (sourceId: string) => boolean;
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
      throw error;
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
  }), [acquireStream, acquireScreenShare, releaseStream, releaseAllStreams, hasStream]);

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
