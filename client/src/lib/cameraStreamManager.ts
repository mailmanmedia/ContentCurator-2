type CameraStream = {
  stream: MediaStream;
  deviceId: string;
  sourceId: number;
  refCount: number;
};

type CameraStreamListener = (sourceId: number, stream: MediaStream | null) => void;

class CameraStreamManager {
  private streams: Map<number, CameraStream> = new Map();
  private listeners: Set<CameraStreamListener> = new Set();

  async getOrCreateStream(sourceId: number, deviceId: string): Promise<MediaStream | null> {
    const existing = this.streams.get(sourceId);
    
    if (existing) {
      if (existing.deviceId === deviceId && existing.stream.active) {
        existing.refCount++;
        return existing.stream;
      } else {
        this.stopStream(sourceId);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false
      });

      this.streams.set(sourceId, {
        stream,
        deviceId,
        sourceId,
        refCount: 1
      });

      this.notifyListeners(sourceId, stream);
      return stream;
    } catch (error) {
      console.error(`Failed to get camera stream for source ${sourceId}:`, error);
      return null;
    }
  }

  getStream(sourceId: number): MediaStream | null {
    return this.streams.get(sourceId)?.stream || null;
  }

  releaseStream(sourceId: number): void {
    const existing = this.streams.get(sourceId);
    if (!existing) return;

    existing.refCount--;
    
    if (existing.refCount <= 0) {
      this.stopStream(sourceId);
    }
  }

  stopStream(sourceId: number): void {
    const existing = this.streams.get(sourceId);
    if (!existing) return;

    existing.stream.getTracks().forEach(track => track.stop());
    this.streams.delete(sourceId);
    this.notifyListeners(sourceId, null);
  }

  stopAllStreams(): void {
    this.streams.forEach((_, sourceId) => {
      this.stopStream(sourceId);
    });
  }

  addListener(listener: CameraStreamListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(sourceId: number, stream: MediaStream | null): void {
    this.listeners.forEach(listener => listener(sourceId, stream));
  }

  isStreamActive(sourceId: number): boolean {
    const stream = this.streams.get(sourceId);
    return stream?.stream.active || false;
  }

  getAllActiveStreams(): Map<number, MediaStream> {
    const active = new Map<number, MediaStream>();
    this.streams.forEach((streamData, sourceId) => {
      if (streamData.stream.active) {
        active.set(sourceId, streamData.stream);
      }
    });
    return active;
  }
}

export const cameraStreamManager = new CameraStreamManager();
