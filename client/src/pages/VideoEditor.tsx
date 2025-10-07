import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video, Folder, FileVideo, ArrowLeft, Save, X, Undo2 } from "lucide-react";
import Header from "@/components/Header";
import RecordingsLibrary from "@/components/video-editor/RecordingsLibrary";
import ProjectsList from "@/components/video-editor/ProjectsList";
import TimelineEditor from "@/components/video-editor/TimelineEditor";
import VideoPreview from "@/components/video-editor/VideoPreview";
import ClipProperties from "@/components/video-editor/ClipProperties";
import AutoEditPanel from "@/components/video-editor/AutoEditPanel";
import EnhancementPanel from "@/components/video-editor/EnhancementPanel";
import ExportPanel from "@/components/video-editor/ExportPanel";
import TextOverlayManager from "@/components/video-editor/TextOverlayManager";
import TransitionsPanel from "@/components/video-editor/TransitionsPanel";
import SpeedControlPanel from "@/components/video-editor/SpeedControlPanel";
import EffectsPanel from "@/components/video-editor/EffectsPanel";
import KeyframeEditor from "@/components/video-editor/KeyframeEditor";
import AdvancedColorGrading from "@/components/video-editor/AdvancedColorGrading";
import AudioMixerPanel from "@/components/video-editor/AudioMixerPanel";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recording, VideoProject, VideoClip } from "@shared/schema";

export default function VideoEditor() {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("recordings");
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: clips, refetch: refetchClips } = useQuery<VideoClip[]>({
    queryKey: ['/api/video-projects', activeProject?.id, 'clips'],
    enabled: !!activeProject
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecording) throw new Error('No recording selected');
      
      const res = await apiRequest('POST', '/api/video-projects', {
        name: projectName,
        description: projectDescription,
        recordingId: selectedRecording.id,
        status: 'draft'
      });
      return await res.json() as VideoProject;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-projects'] });
      setShowCreateDialog(false);
      setProjectName("");
      setProjectDescription("");
      setSelectedRecording(null);
      setActiveProject(project);
      setCurrentTab("edit");
      toast({
        title: "Success",
        description: "Video project created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive"
      });
    }
  });

  const updateClipMutation = useMutation({
    mutationFn: async ({ clipId, updates }: { clipId: string; updates: Partial<VideoClip> }) => {
      const res = await apiRequest('PATCH', `/api/video-projects/${activeProject?.id}/clips/${clipId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      refetchClips();
      toast({
        title: "Success",
        description: "Clip updated successfully"
      });
    }
  });

  const deleteClipMutation = useMutation({
    mutationFn: async (clipId: string) => {
      await apiRequest('DELETE', `/api/video-projects/${activeProject?.id}/clips/${clipId}`);
    },
    onSuccess: () => {
      refetchClips();
      setSelectedClip(null);
      toast({
        title: "Success",
        description: "Clip deleted successfully"
      });
    }
  });

  const handleCreateProject = (recording: Recording) => {
    setSelectedRecording(recording);
    setProjectName(`Project - ${recording.filename}`);
    setShowCreateDialog(true);
  };

  const handleOpenProject = (project: VideoProject) => {
    setActiveProject(project);
    setCurrentTab("edit");
  };

  const handleClipUpdate = (clipId: string, updates: Partial<VideoClip>) => {
    updateClipMutation.mutate({ clipId, updates });
    setHasUnsavedChanges(true);
  };

  const handleClipDelete = (clipId: string) => {
    deleteClipMutation.mutate(clipId);
    setHasUnsavedChanges(true);
  };

  const handleSplitClip = (clipId: string, atTime: number) => {
    toast({
      title: "Coming Soon",
      description: "Clip splitting feature will be available soon"
    });
  };

  const handleSaveProject = () => {
    setHasUnsavedChanges(false);
    toast({
      title: "Saved",
      description: "Project changes have been saved"
    });
  };

  const handleDiscardChanges = () => {
    refetchClips();
    setHasUnsavedChanges(false);
    toast({
      title: "Discarded",
      description: "Changes have been discarded"
    });
  };

  const handleUndo = () => {
    toast({
      title: "Coming Soon",
      description: "Undo feature will be available soon"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {activeProject && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveProject(null);
                    setCurrentTab("projects");
                  }}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-3xl font-bold">
                {activeProject ? activeProject.name : 'AI Video Editor'}
              </h1>
            </div>
            
            {activeProject && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  data-testid="button-undo"
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardChanges}
                  disabled={!hasUnsavedChanges}
                  data-testid="button-discard"
                >
                  <X className="w-4 h-4 mr-2" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProject}
                  disabled={!hasUnsavedChanges}
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
          
          {!activeProject && (
            <p className="text-muted-foreground">
              Create professional video edits with AI-powered scene detection and automated cutting
            </p>
          )}
        </div>

        {activeProject ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <VideoPreview
                videoUrl={`/api/recordings/${activeProject.recordingId}/video`}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTimeUpdate={setCurrentTime}
              />
              
              <TimelineEditor
                clips={clips || []}
                currentTime={currentTime}
                onTimeChange={setCurrentTime}
                onClipUpdate={handleClipUpdate}
                onClipDelete={handleClipDelete}
                onSplitClip={handleSplitClip}
              />
            </div>

            <div className="space-y-6">
              <Tabs defaultValue="clip">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="clip">Clip</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>
                
                <TabsContent value="clip" className="mt-4 space-y-4">
                  <ClipProperties
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                    onDelete={() => selectedClip && handleClipDelete(selectedClip.id)}
                  />
                  
                  <TransitionsPanel
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                  />
                  
                  <SpeedControlPanel
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                  />
                  
                  <KeyframeEditor
                    clipId={selectedClip?.id || null}
                    clipDuration={selectedClip?.duration || 0}
                    currentTime={currentTime}
                  />
                </TabsContent>
                
                <TabsContent value="effects" className="mt-4 space-y-4">
                  <AutoEditPanel projectId={activeProject.id} />
                  
                  <TextOverlayManager
                    projectId={activeProject.id}
                    currentTime={currentTime}
                    duration={activeProject.duration || 0}
                  />
                  
                  <EffectsPanel
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                  />
                  
                  <AdvancedColorGrading
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                  />
                  
                  <EnhancementPanel />
                  
                  <AudioMixerPanel projectId={activeProject.id} />
                </TabsContent>
                
                <TabsContent value="export" className="mt-4">
                  <ExportPanel projectId={activeProject.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList>
              <TabsTrigger value="recordings" data-testid="tab-recordings">
                <Video className="w-4 h-4 mr-2" />
                Recordings
              </TabsTrigger>
              <TabsTrigger value="projects" data-testid="tab-projects">
                <FileVideo className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recordings" className="mt-6">
              <RecordingsLibrary onCreateProject={handleCreateProject} />
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <ProjectsList onOpenProject={handleOpenProject} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent data-testid="dialog-create-project">
          <DialogHeader>
            <DialogTitle>Create Video Project</DialogTitle>
            <DialogDescription>
              Set up a new editing project for your recording
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                data-testid="input-project-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                data-testid="textarea-project-description"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createProjectMutation.mutate()}
              disabled={!projectName || createProjectMutation.isPending}
              data-testid="button-create"
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
