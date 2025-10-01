import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, Trash2, Film, GripVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PresentationSet {
  id: string;
  name: string;
  description: string;
  sceneIds: string[];
  defaultTickerId: string | null;
  defaultTransition: string;
  isActive: boolean;
  tags: string[];
}

interface Scene {
  id: string;
  name: string;
  description: string;
  layout: string;
}

function SortableSceneItem({ scene, onRemove }: { scene: Scene; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 rounded hover-elevate bg-card border"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{scene.name}</div>
        <div className="text-xs text-muted-foreground">{scene.layout} layout</div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        data-testid={`button-remove-scene-${scene.id}`}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default function PresentationSetManager() {
  const [selectedSet, setSelectedSet] = useState<PresentationSet | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultTransition: 'fade',
    sceneIds: [] as string[],
  });
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: presentationSets, isLoading } = useQuery<PresentationSet[]>({
    queryKey: ['/api/presentation/sets'],
  });

  const { data: scenes } = useQuery<Scene[]>({
    queryKey: ['/api/presentation/scenes'],
  });

  const createSetMutation = useMutation({
    mutationFn: async (setData: any) => {
      const response = await apiRequest('POST', '/api/presentation/sets', setData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/sets'] });
      toast({ title: 'Presentation set created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to create set', variant: 'destructive' });
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/presentation/sets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/sets'] });
      toast({ title: 'Presentation set updated successfully' });
      setIsDialogOpen(false);
      setSelectedSet(null);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to update set', variant: 'destructive' });
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/presentation/sets/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/sets'] });
      toast({ title: 'Presentation set deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete set', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      defaultTransition: 'fade',
      sceneIds: [],
    });
  };

  const handleCreateSet = () => {
    const setData = {
      ...formData,
      defaultTickerId: null,
      isActive: true,
      tags: [],
    };
    createSetMutation.mutate(setData);
  };

  const handleUpdateSet = () => {
    if (!selectedSet) return;
    updateSetMutation.mutate({
      id: selectedSet.id,
      data: formData,
    });
  };

  const handleEditSet = (set: PresentationSet) => {
    setSelectedSet(set);
    setFormData({
      name: set.name,
      description: set.description || '',
      defaultTransition: set.defaultTransition,
      sceneIds: set.sceneIds,
    });
    setIsDialogOpen(true);
  };

  const handleOpenNewDialog = () => {
    setSelectedSet(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleToggleScene = (sceneId: string) => {
    setFormData(prev => ({
      ...prev,
      sceneIds: prev.sceneIds.includes(sceneId)
        ? prev.sceneIds.filter(id => id !== sceneId)
        : [...prev.sceneIds, sceneId],
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.sceneIds.indexOf(active.id as string);
        const newIndex = prev.sceneIds.indexOf(over.id as string);
        return {
          ...prev,
          sceneIds: arrayMove(prev.sceneIds, oldIndex, newIndex),
        };
      });
    }
  };

  const handleRemoveSceneFromSet = (sceneId: string) => {
    setFormData(prev => ({
      ...prev,
      sceneIds: prev.sceneIds.filter(id => id !== sceneId),
    }));
  };

  const selectedScenes = scenes?.filter(s => formData.sceneIds.includes(s.id)) || [];
  const availableScenes = scenes?.filter(s => !formData.sceneIds.includes(s.id)) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-league-spartan font-bold text-xl uppercase tracking-wide">
          Presentation Sets
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-set">
              <Plus className="w-4 h-4 mr-2" />
              Create Set
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedSet ? 'Edit Presentation Set' : 'Create New Presentation Set'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Set Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Match Day Show"
                  data-testid="input-set-name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Complete presentation set for match day coverage"
                  rows={2}
                  data-testid="input-set-description"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Add Scenes (Click to add)</Label>
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                    {availableScenes.length > 0 ? (
                      availableScenes.map((scene) => (
                        <Button
                          key={scene.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleToggleScene(scene.id)}
                          data-testid={`button-add-scene-${scene.id}`}
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          <div className="flex-1 text-left">
                            <div className="font-medium text-xs">{scene.name}</div>
                          </div>
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        {scenes && scenes.length > 0 ? 'All scenes added' : 'No scenes available'}
                      </p>
                    )}
                  </div>
                </div>

                {formData.sceneIds.length > 0 && (
                  <div>
                    <Label>Scene Order (Drag to reorder)</Label>
                    <div className="border rounded-md p-2 space-y-1">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={formData.sceneIds}
                          strategy={verticalListSortingStrategy}
                        >
                          {selectedScenes.map((scene) => (
                            <SortableSceneItem
                              key={scene.id}
                              scene={scene}
                              onRemove={() => handleRemoveSceneFromSet(scene.id)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.sceneIds.length} scene{formData.sceneIds.length !== 1 ? 's' : ''} in set
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedSet(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={selectedSet ? handleUpdateSet : handleCreateSet}
                disabled={!formData.name || formData.sceneIds.length === 0 || createSetMutation.isPending || updateSetMutation.isPending}
                data-testid="button-save-set"
              >
                {selectedSet ? 'Update' : 'Create'} Set
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading presentation sets...</p>
          </CardContent>
        </Card>
      ) : presentationSets && presentationSets.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {presentationSets.map((set) => (
            <Card key={set.id} className="hover-elevate">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    <CardTitle className="text-base">{set.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditSet(set)}
                      data-testid={`button-edit-set-${set.id}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSetMutation.mutate(set.id)}
                      disabled={deleteSetMutation.isPending}
                      data-testid={`button-delete-set-${set.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {set.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {set.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GripVertical className="w-3 h-3" />
                      <span>{set.sceneIds.length} scenes</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {set.defaultTransition}
                    </Badge>
                    {set.isActive && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                  {scenes && set.sceneIds.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-2">Scenes in Set:</p>
                      <div className="space-y-1">
                        {set.sceneIds.slice(0, 3).map((sceneId, index) => {
                          const scene = scenes.find(s => s.id === sceneId);
                          return scene ? (
                            <div key={sceneId} className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="font-mono">{index + 1}.</span>
                              <span>{scene.name}</span>
                            </div>
                          ) : null;
                        })}
                        {set.sceneIds.length > 3 && (
                          <div className="text-xs text-muted-foreground italic">
                            +{set.sceneIds.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold mb-2">No Presentation Sets</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a set to organize your scenes for broadcast
            </p>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-first-set">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Set
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
