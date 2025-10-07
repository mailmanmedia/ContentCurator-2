import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Clock, HardDrive } from "lucide-react";
import type { Recording } from "@shared/schema";

interface RecordingsLibraryProps {
  onCreateProject: (recording: Recording) => void;
}

export default function RecordingsLibrary({ onCreateProject }: RecordingsLibraryProps) {
  const { data: recordings, isLoading } = useQuery<Recording[]>({
    queryKey: ['/api/recordings']
  });

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatRecordingLabel = (createdAt: Date | string) => {
    const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} at ${timeStr}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-32 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!recordings || recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Video className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Recordings Yet</h3>
        <p className="text-sm text-muted-foreground">
          Record some videos from the Live Presentation page to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {recordings.map((recording) => (
        <Card key={recording.id} className="hover-elevate" data-testid={`card-recording-${recording.id}`}>
          <CardHeader>
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-2">
              {recording.thumbnailPath ? (
                <img 
                  src={recording.thumbnailPath} 
                  alt={recording.filename}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <Video className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <CardTitle className="text-base" data-testid={`text-recording-label-${recording.id}`}>
              {formatRecordingLabel(recording.createdAt)}
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate mt-1" data-testid={`text-filename-${recording.id}`}>
              {recording.filename}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span data-testid={`text-duration-${recording.id}`}>
                {formatDuration(recording.duration)}
              </span>
            </div>
            {recording.resolution && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="w-4 h-4" />
                <span data-testid={`text-resolution-${recording.id}`}>
                  {recording.resolution}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span data-testid={`text-size-${recording.id}`}>
                {formatFileSize(recording.size)}
              </span>
            </div>
            {recording.format && (
              <Badge variant="secondary" data-testid={`badge-format-${recording.id}`}>
                {recording.format.toUpperCase()}
              </Badge>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => onCreateProject(recording)}
              data-testid={`button-create-project-${recording.id}`}
            >
              Create Project
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
