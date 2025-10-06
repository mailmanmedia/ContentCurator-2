import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

interface UseVideoRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedBlob: Blob | null;
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  downloadRecording: (filename?: string) => void;
  clearRecording: () => void;
  isMediaRecorderSupported: boolean;
  error: string | null;
}

export function useVideoRecorder(
  canvasRef: React.RefObject<HTMLCanvasElement>
): UseVideoRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isMediaRecorderSupported = typeof MediaRecorder !== 'undefined';

  // Update duration timer
  const updateDuration = useCallback(() => {
    if (recordingState === 'recording') {
      const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
      setDuration(elapsed);
    }
  }, [recordingState]);

  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(updateDuration, 1000);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [recordingState, updateDuration]);

  const startRecording = useCallback(async () => {
    if (!canvasRef.current) {
      setError('Canvas not available');
      return;
    }

    if (!isMediaRecorderSupported) {
      setError('MediaRecorder is not supported in this browser');
      return;
    }

    try {
      // Capture canvas stream at 30 fps
      const stream = canvasRef.current.captureStream(30);
      streamRef.current = stream;

      // Determine best codec
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm;codecs=h264',
        'video/webm',
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        setError('No supported video format found');
        return;
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps for good quality
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        setRecordedBlob(blob);
        setRecordingState('stopped');
        
        // Stop all tracks in the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        setRecordingState('idle');
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setDuration(0);
      setRecordingState('recording');
      setError(null);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError(err.message || 'Failed to start recording');
      setRecordingState('idle');
    }
  }, [canvasRef, isMediaRecorderSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState !== 'idle' && recordingState !== 'stopped') {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recordingState]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      setRecordingState('paused');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recordingState]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      setRecordingState('recording');
    }
  }, [recordingState]);

  const downloadRecording = useCallback((filename?: string) => {
    if (!recordedBlob) {
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `broadcast-recording-${timestamp}.webm`;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedBlob]);

  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingState('idle');
    setDuration(0);
    setError(null);
    chunksRef.current = [];
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    isRecording: recordingState === 'recording',
    isPaused: recordingState === 'paused',
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
    error,
  };
}
