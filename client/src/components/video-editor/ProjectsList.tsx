import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, Trash2, Clock, Video } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VideoProject } from "@shared/schema";

interface ProjectsListProps {
  onOpenProject: (project: VideoProject) => void;
}

export default function ProjectsList({ onOpenProject }: ProjectsListProps) {
  const { toast } = useToast();
  const { data: projects, isLoading } = useQuery<VideoProject[]>({
    queryKey: ['/api/video-projects']
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest('DELETE', `/api/video-projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects'] });
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      'draft': { variant: 'secondary', label: 'Draft' },
      'processing': { variant: 'default', label: 'Processing' },
      'completed': { variant: 'default', label: 'Completed' },
      'failed': { variant: 'destructive', label: 'Failed' }
    };
    
    const config = variants[status] || variants['draft'];
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Video className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
        <p className="text-sm text-muted-foreground">
          Create a project from a recording to start editing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {projects.map((project) => (
        <Card key={project.id} className="hover-elevate" data-testid={`card-project-${project.id}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg" data-testid={`text-name-${project.id}`}>
              {project.name}
            </CardTitle>
            {getStatusBadge(project.status)}
          </CardHeader>
          <CardContent className="space-y-2">
            {project.description && (
              <p className="text-sm text-muted-foreground" data-testid={`text-description-${project.id}`}>
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span data-testid={`text-date-${project.id}`}>
                Created {formatDate(project.createdAt)}
              </span>
            </div>
            {project.duration && (
              <div className="text-sm text-muted-foreground">
                Duration: {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              onClick={() => onOpenProject(project)}
              data-testid={`button-open-${project.id}`}
            >
              Open Project
            </Button>
            <Button 
              variant="destructive" 
              size="icon"
              onClick={() => deleteMutation.mutate(project.id)}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-${project.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
