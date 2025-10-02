import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Video, Monitor, Film, Radio, Wifi, Play, Square } from "lucide-react";
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

export default function VideoSourceManager() {
  const [selectedSource, setSelectedSource] = useState<VideoSource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceType: 'camera' as 'camera' | 'screen' | 'media' | 'rtmp' | 'webrtc',
    deviceId: '',
    streamUrl: '',
  });
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ videoSources: VideoSource[] }>({
    queryKey: ['/api/video-sources'],
  });

  const videoSources = data?.videoSources;

  useEffect(() => {
    if (formData.sourceType === 'camera') {
      navigator.mediaDevices.enumerateDevices()
        .then(deviceList => {
          const cameras = deviceList.filter(d => d.kind === 'videoinput');
          setDevices(cameras);
        })
        .catch(() => {
          toast({ title: 'Could not access camera devices', variant: 'destructive' });
        });
    }
  }, [formData.sourceType, toast]);

  const createSourceMutation = useMutation({
    mutationFn: async (sourceData: any) => {
      const response = await apiRequest('POST', '/api/video-sources', sourceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-sources'] });
      toast({ title: 'Video source created successfully' });
      setIsDialogOpen(false);
      resetForm();
      stopPreview();
    },
    onError: () => {
      toast({ title: 'Failed to create video source', variant: 'destructive' });
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/video-sources/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-sources'] });
      toast({ title: 'Video source updated successfully' });
      setIsDialogOpen(false);
      setSelectedSource(null);
      resetForm();
      stopPreview();
    },
    onError: () => {
      toast({ title: 'Failed to update video source', variant: 'destructive' });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/video-sources/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-sources'] });
      toast({ title: 'Video source deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete video source', variant: 'destructive' });
    },
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
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sourceType: 'camera',
      deviceId: '',
      streamUrl: '',
    });
  };

  const stopPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
  };

  const startCameraPreview = async () => {
    if (!formData.deviceId) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: formData.deviceId },
        audio: false,
      });
      setPreviewStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({ title: 'Could not access camera', variant: 'destructive' });
    }
  };

  const handleCreateSource = () => {
    const selectedDevice = devices.find(d => d.deviceId === formData.deviceId);
    const sourceData = {
      ...formData,
      deviceLabel: selectedDevice?.label || '',
      configJson: {},
      isActive: true,
      isConnected: false,
      tags: [],
    };
    createSourceMutation.mutate(sourceData);
  };

  const handleUpdateSource = () => {
    if (!selectedSource) return;
    const selectedDevice = devices.find(d => d.deviceId === formData.deviceId);
    updateSourceMutation.mutate({
      id: selectedSource.id,
      data: {
        ...formData,
        deviceLabel: selectedDevice?.label || selectedSource.deviceLabel,
      },
    });
  };

  const handleEditSource = (source: VideoSource) => {
    setSelectedSource(source);
    setFormData({
      name: source.name,
      description: source.description || '',
      sourceType: source.sourceType,
      deviceId: source.deviceId || '',
      streamUrl: source.streamUrl || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenNewDialog = () => {
    setSelectedSource(null);
    resetForm();
    setIsDialogOpen(true);
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-league-spartan font-bold text-xl uppercase tracking-wide">
          Video Sources
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            stopPreview();
            setSelectedSource(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-source">
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedSource ? 'Edit Video Source' : 'Add New Video Source'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sourceType">Source Type</Label>
                <Select
                  value={formData.sourceType}
                  onValueChange={(value: any) => setFormData({ ...formData, sourceType: value })}
                >
                  <SelectTrigger id="sourceType" data-testid="select-source-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">Camera - USB/Webcam</SelectItem>
                    <SelectItem value="screen">Screen Capture</SelectItem>
                    <SelectItem value="media">Media File</SelectItem>
                    <SelectItem value="rtmp">RTMP Stream</SelectItem>
                    <SelectItem value="webrtc">WebRTC Feed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Source Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="DJI Osmo Pocket 3"
                  data-testid="input-source-name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Primary camera for live broadcasts"
                  rows={2}
                  data-testid="input-source-description"
                />
              </div>

              {formData.sourceType === 'camera' && (
                <div>
                  <Label htmlFor="deviceId">Camera Device</Label>
                  <Select
                    value={formData.deviceId}
                    onValueChange={(value) => setFormData({ ...formData, deviceId: value })}
                  >
                    <SelectTrigger id="deviceId" data-testid="select-device">
                      <SelectValue placeholder="Select a camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.deviceId && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={previewStream ? stopPreview : startCameraPreview}
                        data-testid="button-preview-camera"
                      >
                        {previewStream ? <Square className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                        {previewStream ? 'Stop' : 'Test'} Preview
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {(formData.sourceType === 'rtmp' || formData.sourceType === 'webrtc') && (
                <div>
                  <Label htmlFor="streamUrl">Stream URL</Label>
                  <Input
                    id="streamUrl"
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    placeholder="rtmp://example.com/live/stream"
                    data-testid="input-stream-url"
                  />
                </div>
              )}

              {previewStream && (
                <div className="border rounded-md overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full aspect-video bg-sidebar"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedSource(null);
                  resetForm();
                  stopPreview();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={selectedSource ? handleUpdateSource : handleCreateSource}
                disabled={!formData.name || createSourceMutation.isPending || updateSourceMutation.isPending}
                data-testid="button-save-source"
              >
                {selectedSource ? 'Update' : 'Add'} Source
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading video sources...</p>
          </CardContent>
        </Card>
      ) : videoSources && videoSources.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoSources.map((source) => (
            <Card key={source.id} className="hover-elevate">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(source.sourceType)}
                    <CardTitle className="text-base">{source.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditSource(source)}
                      data-testid={`button-edit-source-${source.id}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSourceMutation.mutate(source.id)}
                      disabled={deleteSourceMutation.isPending}
                      data-testid={`button-delete-source-${source.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="aspect-video bg-sidebar rounded border flex items-center justify-center">
                    {getSourceIcon(source.sourceType)}
                  </div>
                  {source.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {source.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={source.isConnected ? "default" : "outline"} className="text-xs">
                        {source.isConnected ? 'Connected' : 'Offline'}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {source.sourceType}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const typedSource: VideoSource = source;
                        return typedSource.isConnected 
                          ? disconnectSourceMutation.mutate(typedSource.id)
                          : connectSourceMutation.mutate(typedSource.id);
                      }}
                      data-testid={`button-toggle-connection-${source.id}`}
                    >
                      {source.isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                  {source.deviceLabel && (
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {source.deviceLabel}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold mb-2">No Video Sources</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add camera feeds, screen captures, or streaming sources
            </p>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-first-source">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Source
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
