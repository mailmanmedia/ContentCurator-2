import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Monitor, Film, Radio, Wifi, Plug, PlugZap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VideoSource {
  id: string;
  name: string;
  description: string;
  sourceType: 'camera' | 'screen' | 'media' | 'rtmp' | 'webrtc';
  deviceId?: string;
  deviceLabel?: string;
  streamUrl?: string;
  mediaFileId?: string;
  configJson: Record<string, any>;
  isActive: boolean;
  isConnected: boolean;
  lastConnectedAt?: string;
  tags: string[];
}

export default function QuickSourceControls() {
  const { toast } = useToast();

  const { data: videoSources, isLoading } = useQuery<VideoSource[]>({
    queryKey: ['/api/video-sources'],
  });

  const connectSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/video-sources/${id}/connect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-sources'] });
      toast({ title: 'Source connected' });
    },
    onError: () => {
      toast({ title: 'Failed to connect source', variant: 'destructive' });
    },
  });

  const disconnectSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/video-sources/${id}/disconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-sources'] });
      toast({ title: 'Source disconnected' });
    },
    onError: () => {
      toast({ title: 'Failed to disconnect source', variant: 'destructive' });
    },
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'camera': return <Video className="w-4 h-4" />;
      case 'screen': return <Monitor className="w-4 h-4" />;
      case 'media': return <Film className="w-4 h-4" />;
      case 'rtmp': return <Radio className="w-4 h-4" />;
      case 'webrtc': return <Wifi className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const handleToggleConnection = (source: VideoSource) => {
    if (source.isConnected) {
      disconnectSourceMutation.mutate(source.id);
    } else {
      connectSourceMutation.mutate(source.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Camera & Source Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading sources...</p>
        </CardContent>
      </Card>
    );
  }

  if (!videoSources || videoSources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Camera & Source Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No video sources configured. Go to the Sources tab to add cameras.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Camera & Source Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {videoSources.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between gap-3 p-2 rounded-md border hover-elevate"
            data-testid={`quick-source-${source.id}`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getSourceIcon(source.sourceType)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{source.name}</div>
                {source.deviceLabel && (
                  <div className="text-xs text-muted-foreground truncate">
                    {source.deviceLabel}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={source.isConnected ? "default" : "outline"}
                className="text-xs"
              >
                {source.isConnected ? 'Live' : 'Off'}
              </Badge>
              <Button
                size="sm"
                variant={source.isConnected ? "destructive" : "default"}
                onClick={() => handleToggleConnection(source)}
                disabled={connectSourceMutation.isPending || disconnectSourceMutation.isPending}
                data-testid={`button-toggle-source-${source.id}`}
              >
                {source.isConnected ? (
                  <>
                    <Plug className="w-3 h-3 mr-1" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <PlugZap className="w-3 h-3 mr-1" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
