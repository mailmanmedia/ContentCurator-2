import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Edit2, Trash2, Copy, Video, Layers, Box, Sparkles, ChevronsUpDown, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SceneLayerEditor from "./SceneLayerEditor";
import VisualSceneEditor from "./VisualSceneEditor";
import { cn } from "@/lib/utils";

interface Scene {
  id: string;
  name: string;
  description: string;
  layout: string;
  elements: SceneElement[];
  backgroundConfig: {
    type?: 'color' | 'image' | 'video';
    value?: string;
  };
  transitionConfig: {
    effect?: string;
    duration?: number;
  };
  aspectRatio: string;
  tags: string[];
  isTemplate?: boolean;
}

interface SceneElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'graphic';
  zone: string;
  position: { x: number; y: number; width: number; height: number };
  content?: string;
  sourceId?: string;
  style?: Record<string, any>;
}

const PRESET_SCENE_NAMES = [
  "Pre-Match Analysis",
  "Live Commentary",
  "Post-Match Analysis",
  "Highlights Reel",
  "Tactical Breakdown",
  "Player Interview",
  "Manager Interview",
  "Stats Dashboard",
  "Line-Up Display",
  "Goal Replay",
  "Match Preview",
  "Transfer News",
  "Training Ground",
  "Fan Reactions",
  "Press Conference",
];

export default function SceneManager() {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [visualEditorSceneId, setVisualEditorSceneId] = useState<string | null>(null);
  const [nameComboboxOpen, setNameComboboxOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    layout: 'single',
    aspectRatio: '16:9',
    elements: [] as SceneElement[],
  });
  const { toast } = useToast();

  const { data: scenes, isLoading } = useQuery<Scene[]>({
    queryKey: ['/api/presentation/scenes'],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<Scene[]>({
    queryKey: ['/api/presentation/scenes/templates'],
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest('POST', `/api/presentation/scenes/${templateId}/duplicate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/scenes'] });
      toast({ title: 'Scene created from template' });
    },
    onError: () => {
      toast({ title: 'Failed to create scene from template', variant: 'destructive' });
    },
  });

  const createSceneMutation = useMutation({
    mutationFn: async (sceneData: any) => {
      const response = await apiRequest('POST', '/api/presentation/scenes', sceneData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/scenes'] });
      toast({ title: 'Scene created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to create scene', variant: 'destructive' });
    },
  });

  const updateSceneMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/presentation/scenes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/scenes'] });
      toast({ title: 'Scene updated successfully' });
      setIsDialogOpen(false);
      setSelectedScene(null);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to update scene', variant: 'destructive' });
    },
  });

  const deleteSceneMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/presentation/scenes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/scenes'] });
      toast({ title: 'Scene deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete scene', variant: 'destructive' });
    },
  });

  const duplicateSceneMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/presentation/scenes/${id}/duplicate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/scenes'] });
      toast({ title: 'Scene duplicated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to duplicate scene', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      layout: 'single',
      aspectRatio: '16:9',
      elements: [],
    });
  };

  const handleCreateScene = () => {
    const sceneData = {
      ...formData,
      backgroundConfig: { type: 'color', value: '#1a1a1a' },
      transitionConfig: { effect: 'fade', duration: 500 },
      tags: [],
    };
    createSceneMutation.mutate(sceneData);
  };

  const handleUpdateScene = () => {
    if (!selectedScene) return;
    updateSceneMutation.mutate({
      id: selectedScene.id,
      data: {
        ...formData,
        backgroundConfig: selectedScene.backgroundConfig,
        transitionConfig: selectedScene.transitionConfig,
      },
    });
  };

  const handleEditScene = (scene: Scene) => {
    setSelectedScene(scene);
    setFormData({
      name: scene.name,
      description: scene.description || '',
      layout: scene.layout,
      aspectRatio: scene.aspectRatio,
      elements: scene.elements || [],
    });
    setIsDialogOpen(true);
  };

  const handleOpenNewDialog = () => {
    setSelectedScene(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'single': return <Video className="w-4 h-4" />;
      case 'split': return <Layers className="w-4 h-4" />;
      case 'grid': return <Layers className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {visualEditorSceneId ? (
        <VisualSceneEditor 
          sceneId={visualEditorSceneId} 
          onClose={() => setVisualEditorSceneId(null)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-league-spartan font-bold text-xl uppercase tracking-wide">
              Scene Manager
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-scene">
              <Plus className="w-4 h-4 mr-2" />
              Create Scene
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedScene ? 'Edit Scene' : 'Create New Scene'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Scene Name</Label>
                <Popover open={nameComboboxOpen} onOpenChange={setNameComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={nameComboboxOpen}
                      className="w-full justify-between"
                      data-testid="button-scene-name-combobox"
                    >
                      {formData.name || "Select or type scene name..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type name..." 
                        value={formData.name}
                        onValueChange={(value) => setFormData({ ...formData, name: value })}
                        data-testid="input-scene-name"
                      />
                      <CommandList>
                        <CommandEmpty>Press Enter to use "{formData.name}"</CommandEmpty>
                        <CommandGroup heading="Preset Scene Names">
                          {PRESET_SCENE_NAMES.map((name) => (
                            <CommandItem
                              key={name}
                              value={name}
                              onSelect={() => {
                                setFormData({ ...formData, name });
                                setNameComboboxOpen(false);
                              }}
                              data-testid={`option-scene-name-${name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.name === name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Primary camera with lower third graphics"
                  rows={3}
                  data-testid="input-scene-description"
                />
              </div>
              <div>
                <Label htmlFor="layout">Layout Type</Label>
                <Select
                  value={formData.layout}
                  onValueChange={(value) => setFormData({ ...formData, layout: value })}
                >
                  <SelectTrigger id="layout" data-testid="select-layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single - Full Frame</SelectItem>
                    <SelectItem value="split">Split - Side by Side</SelectItem>
                    <SelectItem value="grid">Grid - Multi-View</SelectItem>
                    <SelectItem value="stack">Stack - Layered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select
                  value={formData.aspectRatio}
                  onValueChange={(value) => setFormData({ ...formData, aspectRatio: value })}
                >
                  <SelectTrigger id="aspectRatio" data-testid="select-aspect-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 - Widescreen</SelectItem>
                    <SelectItem value="9:16">9:16 - Vertical</SelectItem>
                    <SelectItem value="1:1">1:1 - Square</SelectItem>
                    <SelectItem value="4:3">4:3 - Classic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <SceneLayerEditor
                  elements={formData.elements}
                  onChange={(elements) => setFormData({ ...formData, elements })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedScene(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={selectedScene ? handleUpdateScene : handleCreateScene}
                disabled={!formData.name || createSceneMutation.isPending || updateSceneMutation.isPending}
                data-testid="button-save-scene"
              >
                {selectedScene ? 'Update' : 'Create'} Scene
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates && templates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-league-spartan font-bold text-lg uppercase tracking-wide">
              Broadcast Templates
            </h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover-elevate border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded border border-primary/30 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Badge variant="outline" className="mb-2 border-primary/50">
                          {template.layout}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {template.aspectRatio}
                        </p>
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Layers className="w-3 h-3" />
                        <span>{template.elements?.length || 0} layers</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => createFromTemplateMutation.mutate(template.id)}
                        disabled={createFromTemplateMutation.isPending}
                        data-testid={`button-use-template-${template.id}`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Use Template
                      </Button>
                    </div>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading scenes...</p>
          </CardContent>
        </Card>
      ) : scenes && scenes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene) => (
            <Card key={scene.id} className="hover-elevate">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon(scene.layout)}
                    <CardTitle className="text-base">{scene.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setVisualEditorSceneId(scene.id)}
                      data-testid={`button-visual-editor-${scene.id}`}
                      title="Visual Editor"
                    >
                      <Box className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditScene(scene)}
                      data-testid={`button-edit-scene-${scene.id}`}
                      title="Edit Scene"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => duplicateSceneMutation.mutate(scene.id)}
                      disabled={duplicateSceneMutation.isPending}
                      data-testid={`button-duplicate-scene-${scene.id}`}
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSceneMutation.mutate(scene.id)}
                      disabled={deleteSceneMutation.isPending}
                      data-testid={`button-delete-scene-${scene.id}`}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="aspect-video bg-sidebar rounded border flex items-center justify-center">
                    <div className="text-center p-4">
                      <Badge variant="outline" className="mb-2">
                        {scene.layout}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {scene.aspectRatio}
                      </p>
                    </div>
                  </div>
                  {scene.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {scene.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Layers className="w-3 h-3" />
                    <span>{scene.elements?.length || 0} layers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold mb-2">No Scenes Created</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first scene to start building presentations
            </p>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-first-scene">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Scene
            </Button>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}
