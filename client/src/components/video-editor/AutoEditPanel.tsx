import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, Scissors, Layout } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AutoEditPanelProps {
  projectId: string;
}

export default function AutoEditPanel({ projectId }: AutoEditPanelProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const autoCutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/video-projects/${projectId}/analyze`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects', projectId, 'clips'] });
      toast({
        title: "Success",
        description: "Video analyzed and clips created automatically"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze video",
        variant: "destructive"
      });
    }
  });

  return (
    <Card data-testid="auto-edit-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Automated Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Auto-Cut Video</label>
          <p className="text-xs text-muted-foreground mb-2">
            Automatically detect scenes and create optimized clips
          </p>
          <Button 
            className="w-full" 
            onClick={() => autoCutMutation.mutate()}
            disabled={autoCutMutation.isPending}
            data-testid="button-auto-cut"
          >
            <Scissors className="w-4 h-4 mr-2" />
            {autoCutMutation.isPending ? 'Analyzing...' : 'Auto-Cut Video'}
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Apply Template</label>
          <p className="text-xs text-muted-foreground mb-2">
            Apply a pre-designed intro/outro template
          </p>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger data-testid="select-template">
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="liverpool_fc">Liverpool FC Branded</SelectItem>
              <SelectItem value="professional">Clean Professional</SelectItem>
              <SelectItem value="highlight">Highlight Reel</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="w-full" 
            variant="outline"
            disabled={!selectedTemplate}
            data-testid="button-apply-template"
          >
            <Layout className="w-4 h-4 mr-2" />
            Apply Template
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Optimize Pacing</label>
          <p className="text-xs text-muted-foreground mb-2">
            Automatically adjust clip durations for maximum engagement
          </p>
          <Button 
            className="w-full" 
            variant="outline"
            data-testid="button-optimize-pacing"
          >
            Optimize Pacing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
