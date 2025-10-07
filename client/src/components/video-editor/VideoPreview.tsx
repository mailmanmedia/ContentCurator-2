import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

interface VideoPreviewProps {
  videoUrl?: string;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
}

export default function VideoPreview({ 
  videoUrl, 
  currentTime, 
  isPlaying,
  onTimeUpdate 
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime * 1000 - currentTime) > 100) {
      videoRef.current.currentTime = currentTime / 1000;
    }
  }, [currentTime]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime * 1000);
    }
  };

  return (
    <Card data-testid="video-preview">
      <CardContent className="p-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              data-testid="video-player"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Video className="w-16 h-16 mx-auto mb-2" />
                <p className="text-sm">No video loaded</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
