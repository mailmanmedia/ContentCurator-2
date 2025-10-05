import { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

interface CameraStreamContextType {
  getStream: (sourceId: string, deviceId: string) => Promise<MediaStream>;
  releaseStream: (sourceId: string) => void;
  releaseAllStreams: () => void;
  hasStream: (sourceId: string) => boolean;
}

const CameraStreamContext = createContext<CameraStreamContextType | null>(null);

interface CameraStreamProviderProps {
  children: ReactNode;
}

export function CameraStreamProvider({ children }: CameraStreamProviderProps) {
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const requestsRef = useRef<Map<string, Promise<MediaStream>>>(new Map());

  const getStream = useCallback(async (sourceId: string, deviceId: string): Promise<MediaStream> => {
    if (streamsRef.current.has(sourceId)) {
      const existingStream = streamsRef.current.get(sourceId)!;
      if (existingStream.active) {
        return existingStream;
      } else {
        streamsRef.current.delete(sourceId);
        requestsRef.current.delete(sourceId);
      }
    }

    if (requestsRef.current.has(sourceId)) {
      return requestsRef.current.get(sourceId)!;
    }

    const streamRequest = navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });

    requestsRef.current.set(sourceId, streamRequest);

    try {
      const stream = await streamRequest;
      streamsRef.current.set(sourceId, stream);
      requestsRef.current.delete(sourceId);
      return stream;
    } catch (error) {
      requestsRef.current.delete(sourceId);
      throw error;
    }
  }, []);

  const releaseStream = useCallback((sourceId: string) => {
    const stream = streamsRef.current.get(sourceId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      streamsRef.current.delete(sourceId);
      requestsRef.current.delete(sourceId);
    }
  }, []);

  const releaseAllStreams = useCallback(() => {
    streamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    streamsRef.current.clear();
    requestsRef.current.clear();
  }, []);

  const hasStream = useCallback((sourceId: string): boolean => {
    return streamsRef.current.has(sourceId);
  }, []);

  const value: CameraStreamContextType = {
    getStream,
    releaseStream,
    releaseAllStreams,
    hasStream,
  };

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
