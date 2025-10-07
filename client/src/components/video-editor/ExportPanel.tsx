import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RenderJob } from "@shared/schema";

interface ExportPanelProps {
  projectId: string;
}

export default function ExportPanel({ projectId }: ExportPanelProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");
  const [qualityPreset, setQualityPreset] = useState("youtube_1080p");
  const [customWidth, setCustomWidth] = useState("1920");
  const [customHeight, setCustomHeight] = useState("1080");
  const [customBitrate, setCustomBitrate] = useState("8M");

  const { data: renderJobs } = useQuery<RenderJob[]>({
    queryKey: ['/api/render-jobs'],
    refetchInterval: 3000
  });

  const projectRenderJobs = renderJobs?.filter(job => job.projectId === projectId) || [];

  const startRenderMutation = useMutation({
    mutationFn: async () => {
      const presets: Record<string, any> = {
        youtube_1080p: { width: 1920, height: 1080, bitrate: '8M' },
        youtube_4k: { width: 3840, height: 2160, bitrate: '40M' },
        shorts: { width: 1080, height: 1920, bitrate: '6M' },
        instagram_feed: { width: 1080, height: 1080, bitrate: '5M' },
        instagram_story: { width: 1080, height: 1920, bitrate: '5M' },
        instagram_reels: { width: 1080, height: 1920, bitrate: '6M' },
        tiktok: { width: 1080, height: 1920, bitrate: '6M' },
        twitter: { width: 1280, height: 720, bitrate: '4M' },
        facebook: { width: 1280, height: 720, bitrate: '4M' },
        linkedin: { width: 1920, height: 1080, bitrate: '5M' },
        custom: { 
          width: parseInt(customWidth), 
          height: parseInt(customHeight), 
          bitrate: customBitrate 
        }
      };

      const settings = {
        format,
        resolution: presets[qualityPreset],
        fps: 30
      };

      return apiRequest('POST', `/api/video-projects/${projectId}/render`, { settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/render-jobs'] });
      toast({
        title: "Success",
        description: "Render job started successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start render",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; variant: any; label: string }> = {
      'pending': { icon: Loader2, variant: 'secondary', label: 'Pending' },
      'processing': { icon: Loader2, variant: 'default', label: 'Processing' },
      'completed': { icon: CheckCircle, variant: 'default', label: 'Completed' },
      'failed': { icon: XCircle, variant: 'destructive', label: 'Failed' }
    };
    
    const config = variants[status] || variants['pending'];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card data-testid="export-settings">
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "mp4" | "webm")}>
              <SelectTrigger data-testid="select-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quality Preset</Label>
            <Select value={qualityPreset} onValueChange={setQualityPreset}>
              <SelectTrigger data-testid="select-quality-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube_1080p">YouTube 1080p (1920×1080)</SelectItem>
                <SelectItem value="youtube_4k">YouTube 4K (3840×2160)</SelectItem>
                <SelectItem value="shorts">YouTube Shorts (1080×1920)</SelectItem>
                <SelectItem value="instagram_feed">Instagram Feed (1080×1080)</SelectItem>
                <SelectItem value="instagram_story">Instagram Story (1080×1920)</SelectItem>
                <SelectItem value="instagram_reels">Instagram Reels (1080×1920)</SelectItem>
                <SelectItem value="tiktok">TikTok (1080×1920)</SelectItem>
                <SelectItem value="twitter">Twitter/X (1280×720)</SelectItem>
                <SelectItem value="facebook">Facebook (1280×720)</SelectItem>
                <SelectItem value="linkedin">LinkedIn (1920×1080)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {qualityPreset === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  data-testid="input-width"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  data-testid="input-height"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="bitrate">Bitrate</Label>
                <Input
                  id="bitrate"
                  value={customBitrate}
                  onChange={(e) => setCustomBitrate(e.target.value)}
                  placeholder="e.g., 8M"
                  data-testid="input-bitrate"
                />
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={() => startRenderMutation.mutate()}
            disabled={startRenderMutation.isPending}
            data-testid="button-start-render"
          >
            Start Render
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="render-queue">
        <CardHeader>
          <CardTitle>Render Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projectRenderJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No render jobs yet</p>
          ) : (
            projectRenderJobs.map((job) => (
              <div key={job.id} className="space-y-2 p-3 border rounded" data-testid={`job-${job.id}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Render Job</span>
                  {getStatusBadge(job.status)}
                </div>
                
                {job.status === 'processing' && (
                  <div className="space-y-1">
                    <Progress value={job.progress} data-testid={`progress-${job.id}`} />
                    <p className="text-xs text-muted-foreground">{job.progress}% complete</p>
                  </div>
                )}

                {job.status === 'completed' && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(`/api/render-jobs/${job.id}/download`, '_blank')}
                    data-testid={`button-download-${job.id}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}

                {job.status === 'failed' && job.errorMessage && (
                  <p className="text-xs text-destructive">{job.errorMessage}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
