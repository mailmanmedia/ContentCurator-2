import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoaderIcon, RefreshCwIcon, ExternalLinkIcon, DownloadIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report, PresentationStyle, ReportRendering } from "@shared/schema";

interface PresentationViewerProps {
  reportId: string;
  defaultStyle?: string;
  showControls?: boolean;
}

interface RenderResponse {
  rendering: ReportRendering;
  report: Report;
  style: PresentationStyle;
}

export function PresentationViewer({ 
  reportId, 
  defaultStyle = "claudeArtifact",
  showControls = true 
}: PresentationViewerProps) {
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle);
  const { toast } = useToast();

  // Fetch available presentation styles
  const { data: stylesData } = useQuery({
    queryKey: ['/api/presentation/styles'],
    select: (response: any) => response.styles as PresentationStyle[]
  });

  // Fetch rendered report
  const { 
    data: renderData, 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['/api/reports', reportId, 'render', selectedStyle],
    queryFn: async (): Promise<RenderResponse> => {
      const url = `/api/reports/${reportId}/render?style=${selectedStyle}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch rendered report');
      }
      return await response.json();
    },
    enabled: !!reportId
  });

  // Re-render mutation
  const reRenderMutation = useMutation({
    mutationFn: async (styleKey: string) => {
      return apiRequest('POST', `/api/reports/${reportId}/render`, { style: styleKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/reports', reportId, 'render', selectedStyle] 
      });
    }
  });

  const handleStyleChange = (styleKey: string) => {
    setSelectedStyle(styleKey);
  };

  const handleReRender = () => {
    reRenderMutation.mutate(selectedStyle);
  };

  const handleExport = async () => {
    console.log('Export clicked'); // Debug log to match test expectations
    
    if (renderData?.rendering.contentHtml) {
      try {
        // Use secure export endpoint with CSP headers
        const exportUrl = `/api/reports/${reportId}/export?style=${selectedStyle}`;
        const a = document.createElement('a');
        a.href = exportUrl;
        a.download = `${renderData.report.title.replace(/[^a-zA-Z0-9]/g, '-')}-${selectedStyle}.html`;
        a.style.display = 'none';
        
        // Add to DOM, click, then remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Show success message
        toast({
          title: "Export Successful",
          description: `Securely downloaded ${renderData.report.title} as HTML file`
        });
      } catch (error) {
        console.error('Export error:', error);
        toast({
          title: "Export Failed",
          description: "There was an error exporting the presentation",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Export Not Available",
        description: "No presentation content to export",
        variant: "destructive"
      });
    }
  };

  const getStyleDescription = (styleKey: string): string => {
    const style = stylesData?.find(s => s.key === styleKey);
    return style?.description || '';
  };

  if (error) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Presentation</h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'An error occurred while loading the presentation'}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="presentation-viewer">
      {/* Controls */}
      {showControls && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Presentation Settings</h3>
              {renderData && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Report: {renderData.report.title}</span>
                  <Badge variant="secondary">{renderData.style.name}</Badge>
                  {(renderData.rendering.metaJson as any)?.estimatedReadTime && (
                    <span>{(renderData.rendering.metaJson as any).estimatedReadTime} min read</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Style Selector */}
              <Select value={selectedStyle} onValueChange={handleStyleChange} data-testid="select-presentation-style">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {stylesData?.map((style) => (
                    <SelectItem key={style.key} value={style.key}>
                      <div className="flex flex-col">
                        <span>{style.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {style.description.substring(0, 60)}...
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReRender}
                disabled={reRenderMutation.isPending}
                data-testid="button-re-render"
              >
                {reRenderMutation.isPending ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="w-4 h-4" />
                )}
                Re-render
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!renderData}
                data-testid="button-export-presentation"
              >
                <DownloadIcon className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Style Description */}
          {selectedStyle && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Style:</strong> {getStyleDescription(selectedStyle)}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Presentation Content */}
      <div className="relative">
        {isLoading && (
          <Card className="p-12 text-center">
            <LoaderIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Generating Presentation</h3>
            <p className="text-muted-foreground">
              Rendering your content in {stylesData?.find(s => s.key === selectedStyle)?.name || selectedStyle} style...
            </p>
          </Card>
        )}

        {renderData && (
          <div className="presentation-content">
            {/* Presentation Container */}
            <div 
              className="w-full min-h-screen bg-background rounded-lg overflow-hidden border shadow-lg"
              data-testid="presentation-content"
            >
              <iframe
                srcDoc={renderData.rendering.contentHtml}
                className="w-full h-screen border-0"
                title="Presentation Preview"
                sandbox="allow-scripts"
              />
            </div>

            {/* Presentation Metadata */}
            <Card className="mt-6 p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>Generated: {new Date(renderData.rendering.createdAt).toLocaleString()}</span>
                {(renderData.rendering.metaJson as any)?.wordCount && (
                  <span>Words: {(renderData.rendering.metaJson as any).wordCount}</span>
                )}
                <span>Style: {renderData.style.name}</span>
                <Badge variant="outline" className="text-xs">
                  {renderData.report.status}
                </Badge>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default PresentationViewer;