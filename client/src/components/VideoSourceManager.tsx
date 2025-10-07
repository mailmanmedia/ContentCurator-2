import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Video, Monitor, Film, Radio, Wifi, Play, Square, FileDown, Save } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VideoSource {
  id: string;
  name: string;
  description: string;
  sourceType: 'camera' | 'screen' | 'media' | 'rtmp' | 'webrtc' | 'youtube';
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

interface SourceTemplate {
  id: string;
  name: string;
  description: string;
  sourceType: 'camera' | 'screen' | 'media' | 'rtmp' | 'webrtc' | 'youtube';
  configJson: Record<string, any>;
  isDefault: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function VideoSourceManager() {
  const [selectedSource, setSelectedSource] = useState<VideoSource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceType: 'camera' as 'camera' | 'screen' | 'media' | 'rtmp' | 'webrtc' | 'youtube',
    deviceId: undefined as string | undefined,
    streamUrl: '',
    youtubeUrl: '',
  });
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ videoSources: VideoSource[] }>({
    queryKey: ['/api/video-sources'],
  });

  const { data: templatesData, isLoading: templatesLoading } = useQuery<{ sourceTemplates: SourceTemplate[] }>({
    queryKey: ['/api/source-templates'],
  });

  const videoSources = data?.videoSources;
  const sourceTemplates = templatesData?.sourceTemplates || [];

  useEffect(() => {
    if (formData.sourceType === 'camera') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          return navigator.mediaDevices.enumerateDevices();
        })
        .then(deviceList => {
          const cameras = deviceList.filter(d => d.kind === 'videoinput');
          setDevices(cameras);
        })
        .catch((err) => {
          console.error('Camera permission error:', err);
          toast({ 
            title: 'Camera permission required', 
            description: 'Please allow camera access to select a device',
            variant: 'destructive' 
          });
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

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/source-templates', templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/source-templates'] });
      toast({ title: 'Template saved successfully' });
      setIsSaveTemplateDialogOpen(false);
      setTemplateFormData({ name: '', description: '' });
    },
    onError: () => {
      toast({ title: 'Failed to save template', variant: 'destructive' });
    },
  });

  const parseYouTubeUrl = (url: string): { videoId: string; isValid: boolean } => {
    if (!url) return { videoId: '', isValid: false };
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return { videoId: match[1], isValid: true };
      }
    }
    
    return { videoId: '', isValid: false };
  };

  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sourceType: 'camera',
      deviceId: undefined,
      streamUrl: '',
      youtubeUrl: '',
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
    
    let sourceData: any = {
      name: formData.name,
      description: formData.description,
      sourceType: formData.sourceType,
      configJson: {},
      isActive: true,
      tags: [],
    };

    if (formData.sourceType === 'camera') {
      sourceData.deviceId = formData.deviceId;
      sourceData.deviceLabel = selectedDevice?.label || '';
      sourceData.isConnected = true;
    } else if (formData.sourceType === 'youtube') {
      const { videoId, isValid } = parseYouTubeUrl(formData.youtubeUrl);
      if (!isValid) {
        toast({ title: 'Invalid YouTube URL', variant: 'destructive' });
        return;
      }
      sourceData.configJson = {
        youtubeUrl: formData.youtubeUrl,
        videoId: videoId,
      };
      sourceData.isConnected = false;
    } else if (formData.sourceType === 'rtmp' || formData.sourceType === 'webrtc') {
      sourceData.streamUrl = formData.streamUrl;
      sourceData.isConnected = true;
    } else {
      sourceData.isConnected = true;
    }

    createSourceMutation.mutate(sourceData);
  };

  const handleUpdateSource = () => {
    if (!selectedSource) return;
    const selectedDevice = devices.find(d => d.deviceId === formData.deviceId);
    
    let updateData: any = {
      name: formData.name,
      description: formData.description,
      sourceType: formData.sourceType,
    };

    if (formData.sourceType === 'camera') {
      updateData.deviceId = formData.deviceId;
      updateData.deviceLabel = selectedDevice?.label || selectedSource.deviceLabel;
    } else if (formData.sourceType === 'youtube') {
      const { videoId, isValid } = parseYouTubeUrl(formData.youtubeUrl);
      if (!isValid) {
        toast({ title: 'Invalid YouTube URL', variant: 'destructive' });
        return;
      }
      updateData.configJson = {
        youtubeUrl: formData.youtubeUrl,
        videoId: videoId,
      };
    } else if (formData.sourceType === 'rtmp' || formData.sourceType === 'webrtc') {
      updateData.streamUrl = formData.streamUrl;
    }

    updateSourceMutation.mutate({
      id: selectedSource.id,
      data: updateData,
    });
  };

  const handleEditSource = (source: VideoSource) => {
    setSelectedSource(source);
    setFormData({
      name: source.name,
      description: source.description || '',
      sourceType: source.sourceType,
      deviceId: source.deviceId || undefined,
      streamUrl: source.streamUrl || '',
      youtubeUrl: source.configJson?.youtubeUrl || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenNewDialog = () => {
    setSelectedSource(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleLoadTemplate = (template: SourceTemplate) => {
    setFormData({
      name: '',
      description: template.description || '',
      sourceType: template.sourceType,
      deviceId: undefined,
      streamUrl: template.configJson?.streamUrl || '',
      youtubeUrl: template.configJson?.youtubeUrl || '',
    });
    setIsTemplateDialogOpen(false);
    toast({ title: `Template "${template.name}" loaded` });
  };

  const handleSaveAsTemplate = () => {
    if (!templateFormData.name.trim()) {
      toast({ title: 'Template name is required', variant: 'destructive' });
      return;
    }

    let configToSave: Record<string, any> = {};

    if (formData.sourceType === 'youtube') {
      const { videoId } = parseYouTubeUrl(formData.youtubeUrl);
      configToSave = {
        youtubeUrl: formData.youtubeUrl,
        videoId: videoId,
      };
    } else if (formData.sourceType === 'rtmp' || formData.sourceType === 'webrtc') {
      configToSave = {
        streamUrl: formData.streamUrl,
      };
    }

    const templateData = {
      name: templateFormData.name,
      description: templateFormData.description || '',
      sourceType: formData.sourceType,
      configJson: configToSave,
      isDefault: false,
      tags: [],
    };

    createTemplateMutation.mutate(templateData);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'camera': return <Video className="w-4 h-4" />;
      case 'screen': return <Monitor className="w-4 h-4" />;
      case 'media': return <Film className="w-4 h-4" />;
      case 'rtmp': return <Radio className="w-4 h-4" />;
      case 'webrtc': return <Wifi className="w-4 h-4" />;
      case 'youtube': return <SiYoutube className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getSourceTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'camera': return 'default';
      case 'screen': return 'secondary';
      case 'youtube': return 'destructive';
      default: return 'outline';
    }
  };

  const youtubePreview = formData.sourceType === 'youtube' ? parseYouTubeUrl(formData.youtubeUrl) : { videoId: '', isValid: false };

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
              <DialogDescription>
                {selectedSource ? 'Update the video source configuration and settings.' : 'Configure a new camera, screen share, YouTube video, or streaming source for your production.'}
              </DialogDescription>
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
                    <SelectItem value="youtube">YouTube Video</SelectItem>
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
                  placeholder={formData.sourceType === 'youtube' ? 'Match Highlights' : 'DJI Osmo Pocket 3'}
                  data-testid="input-source-name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={formData.sourceType === 'youtube' ? 'Tactical analysis highlights' : 'Primary camera for live broadcasts'}
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
                      {devices
                        .filter(device => device.deviceId && device.deviceId.trim() !== '')
                        .map((device) => (
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

              {formData.sourceType === 'youtube' && (
                <div>
                  <Label htmlFor="youtubeUrl">YouTube URL</Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    data-testid="input-youtube-url"
                  />
                  {youtubePreview.isValid && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <SiYoutube className="w-4 h-4 text-red-500" />
                        <span>Video ID: <code className="bg-sidebar px-1 rounded" data-testid="text-youtube-video-id">{youtubePreview.videoId}</code></span>
                      </div>
                      <div className="border rounded-md overflow-hidden" data-testid="preview-youtube-thumbnail">
                        <img 
                          src={getYouTubeThumbnail(youtubePreview.videoId)} 
                          alt="YouTube thumbnail"
                          className="w-full aspect-video object-cover"
                        />
                      </div>
                    </div>
                  )}
                  {formData.youtubeUrl && !youtubePreview.isValid && (
                    <p className="mt-2 text-sm text-destructive" data-testid="error-invalid-youtube-url">
                      Invalid YouTube URL format. Please use a valid YouTube link.
                    </p>
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
            <DialogFooter className="gap-2">
              <div className="flex gap-2 flex-1">
                <Button
                  variant="outline"
                  onClick={() => setIsTemplateDialogOpen(true)}
                  data-testid="button-load-template"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Load from Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSaveTemplateDialogOpen(true)}
                  disabled={!formData.sourceType}
                  data-testid="button-save-as-template"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Template
                </Button>
              </div>
              <div className="flex gap-2">
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
              </div>
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
          {videoSources.map((source) => {
            const isYouTube = source.sourceType === 'youtube';
            const videoId = isYouTube ? source.configJson?.videoId : null;
            
            return (
              <Card key={source.id} className="hover-elevate" data-testid={`card-source-${source.id}`}>
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
                    <div className="aspect-video bg-sidebar rounded border flex items-center justify-center overflow-hidden">
                      {isYouTube && videoId ? (
                        <img 
                          src={getYouTubeThumbnail(videoId)} 
                          alt={source.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-youtube-thumbnail-${source.id}`}
                        />
                      ) : (
                        getSourceIcon(source.sourceType)
                      )}
                    </div>
                    {source.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {source.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {!isYouTube && (
                          <Badge 
                            variant={source.isConnected ? "default" : "outline"} 
                            className="text-xs"
                            data-testid={`badge-connection-${source.id}`}
                          >
                            {source.isConnected ? 'Connected' : 'Offline'}
                          </Badge>
                        )}
                        <Badge 
                          variant={getSourceTypeBadgeVariant(source.sourceType)} 
                          className="text-xs capitalize"
                          data-testid={`badge-type-${source.id}`}
                        >
                          {source.sourceType === 'youtube' && <SiYoutube className="w-3 h-3 mr-1" />}
                          {source.sourceType}
                        </Badge>
                      </div>
                      {!isYouTube && (
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
                      )}
                    </div>
                    {isYouTube && videoId ? (
                      <p className="text-xs text-muted-foreground font-mono truncate" data-testid={`text-video-id-${source.id}`}>
                        ID: {videoId}
                      </p>
                    ) : source.deviceLabel ? (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {source.deviceLabel}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold mb-2">No Video Sources</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add camera feeds, screen captures, YouTube videos, or streaming sources
            </p>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-first-source">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Source
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load from Template</DialogTitle>
            <DialogDescription>
              Select a template to populate the source configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {templatesLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading templates...
              </div>
            ) : sourceTemplates.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No templates available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Save your first template to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {sourceTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => handleLoadTemplate(template)}
                    data-testid={`template-card-${template.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getSourceIcon(template.sourceType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm" data-testid={`template-name-${template.id}`}>
                              {template.name}
                            </h4>
                            {template.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={getSourceTypeBadgeVariant(template.sourceType)} className="text-xs">
                                {template.sourceType}
                              </Badge>
                              {template.isDefault && (
                                <Badge variant="outline" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(false)}
              data-testid="button-close-template-dialog"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save the current source configuration as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                placeholder="e.g., Main Camera Setup"
                data-testid="input-template-name"
              />
            </div>
            <div>
              <Label htmlFor="templateDescription">Description (Optional)</Label>
              <Textarea
                id="templateDescription"
                value={templateFormData.description}
                onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                placeholder="Describe this template configuration"
                rows={3}
                data-testid="input-template-description"
              />
            </div>
            <div className="rounded-md bg-sidebar p-3 space-y-2">
              <p className="text-sm font-medium">Template will save:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Source Type: <span className="font-mono">{formData.sourceType}</span></li>
                {formData.sourceType === 'youtube' && formData.youtubeUrl && (
                  <li>• YouTube URL configuration</li>
                )}
                {(formData.sourceType === 'rtmp' || formData.sourceType === 'webrtc') && formData.streamUrl && (
                  <li>• Stream URL: <span className="font-mono text-xs truncate">{formData.streamUrl}</span></li>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveTemplateDialogOpen(false);
                setTemplateFormData({ name: '', description: '' });
              }}
              data-testid="button-cancel-save-template"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={!templateFormData.name.trim() || createTemplateMutation.isPending}
              data-testid="button-confirm-save-template"
            >
              {createTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
