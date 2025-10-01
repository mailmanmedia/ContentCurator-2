import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Video, Image, Type, Move } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SceneElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'graphic';
  zone: string;
  position: { x: number; y: number; width: number; height: number };
  content?: string;
  sourceId?: string;
  style?: Record<string, any>;
}

interface VideoSource {
  id: string;
  name: string;
  sourceType: string;
  isConnected: boolean;
}

interface SceneLayerEditorProps {
  elements: SceneElement[];
  onChange: (elements: SceneElement[]) => void;
}

export default function SceneLayerEditor({ elements, onChange }: SceneLayerEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<SceneElement | null>(null);
  const [newElement, setNewElement] = useState({
    type: 'video' as 'video' | 'image' | 'text' | 'graphic',
    zone: 'main',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    content: '',
    sourceId: '',
  });

  const { data: videoSources } = useQuery<VideoSource[]>({
    queryKey: ['/api/video-sources'],
  });

  const handleAddElement = () => {
    const element: SceneElement = {
      id: `layer-${Date.now()}`,
      type: newElement.type,
      zone: newElement.zone,
      position: {
        x: newElement.x,
        y: newElement.y,
        width: newElement.width,
        height: newElement.height,
      },
      content: newElement.content,
      sourceId: newElement.sourceId || undefined,
      style: {},
    };
    onChange([...elements, element]);
    setIsAddDialogOpen(false);
    resetNewElement();
  };

  const handleUpdateElement = () => {
    if (!editingElement) return;
    const updated = elements.map(el => 
      el.id === editingElement.id 
        ? {
            ...editingElement,
            type: newElement.type,
            zone: newElement.zone,
            position: {
              x: newElement.x,
              y: newElement.y,
              width: newElement.width,
              height: newElement.height,
            },
            content: newElement.content,
            sourceId: newElement.sourceId || undefined,
          }
        : el
    );
    onChange(updated);
    setEditingElement(null);
    setIsAddDialogOpen(false);
    resetNewElement();
  };

  const handleRemoveElement = (id: string) => {
    onChange(elements.filter(el => el.id !== id));
  };

  const handleEditElement = (element: SceneElement) => {
    setEditingElement(element);
    setNewElement({
      type: element.type,
      zone: element.zone,
      x: element.position.x,
      y: element.position.y,
      width: element.position.width,
      height: element.position.height,
      content: element.content || '',
      sourceId: element.sourceId || '',
    });
    setIsAddDialogOpen(true);
  };

  const resetNewElement = () => {
    setNewElement({
      type: 'video',
      zone: 'main',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      content: '',
      sourceId: '',
    });
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      default: return <Move className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Scene Layers</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingElement(null);
            resetNewElement();
          }
        }}>
          <Button
            size="sm"
            onClick={() => {
              setEditingElement(null);
              resetNewElement();
              setIsAddDialogOpen(true);
            }}
            data-testid="button-add-layer"
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Layer
          </Button>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingElement ? 'Edit Layer' : 'Add New Layer'}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Layer Type</Label>
                  <Select
                    value={newElement.type}
                    onValueChange={(value: any) => setNewElement({ ...newElement, type: value })}
                  >
                    <SelectTrigger data-testid="select-layer-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Source</SelectItem>
                      <SelectItem value="image">Image/Graphic</SelectItem>
                      <SelectItem value="text">Text Overlay</SelectItem>
                      <SelectItem value="graphic">Custom Graphic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Zone Name</Label>
                  <Input
                    value={newElement.zone}
                    onChange={(e) => setNewElement({ ...newElement, zone: e.target.value })}
                    placeholder="main, lower-third, pip"
                    data-testid="input-zone-name"
                  />
                </div>

                {newElement.type === 'video' && (
                  <div>
                    <Label>Video Source</Label>
                    <Select
                      value={newElement.sourceId}
                      onValueChange={(value) => setNewElement({ ...newElement, sourceId: value })}
                    >
                      <SelectTrigger data-testid="select-video-source">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {videoSources?.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name} ({source.sourceType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newElement.type === 'text' && (
                  <div>
                    <Label>Text Content</Label>
                    <Input
                      value={newElement.content}
                      onChange={(e) => setNewElement({ ...newElement, content: e.target.value })}
                      placeholder="Enter text content"
                      data-testid="input-text-content"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>X Position (%): {newElement.x}</Label>
                  <Slider
                    value={[newElement.x]}
                    onValueChange={([x]) => setNewElement({ ...newElement, x })}
                    max={100}
                    step={1}
                    data-testid="slider-x-position"
                  />
                </div>

                <div>
                  <Label>Y Position (%): {newElement.y}</Label>
                  <Slider
                    value={[newElement.y]}
                    onValueChange={([y]) => setNewElement({ ...newElement, y })}
                    max={100}
                    step={1}
                    data-testid="slider-y-position"
                  />
                </div>

                <div>
                  <Label>Width (%): {newElement.width}</Label>
                  <Slider
                    value={[newElement.width]}
                    onValueChange={([width]) => setNewElement({ ...newElement, width })}
                    max={100}
                    step={1}
                    data-testid="slider-width"
                  />
                </div>

                <div>
                  <Label>Height (%): {newElement.height}</Label>
                  <Slider
                    value={[newElement.height]}
                    onValueChange={([height]) => setNewElement({ ...newElement, height })}
                    max={100}
                    step={1}
                    data-testid="slider-height"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded p-4 bg-sidebar">
              <p className="text-xs text-muted-foreground mb-2">Preview Position:</p>
              <div className="relative w-full aspect-video bg-background border rounded overflow-hidden">
                <div
                  className="absolute bg-primary/30 border-2 border-primary flex items-center justify-center"
                  style={{
                    left: `${newElement.x}%`,
                    top: `${newElement.y}%`,
                    width: `${newElement.width}%`,
                    height: `${newElement.height}%`,
                  }}
                >
                  {getElementIcon(newElement.type)}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingElement(null);
                  resetNewElement();
                }}
                data-testid="button-cancel-layer"
              >
                Cancel
              </Button>
              <Button
                onClick={editingElement ? handleUpdateElement : handleAddElement}
                data-testid="button-save-layer"
              >
                {editingElement ? 'Update' : 'Add'} Layer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {elements.length > 0 ? (
        <div className="space-y-2">
          {elements.map((element, index) => (
            <Card key={element.id} className="hover-elevate">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getElementIcon(element.type)}
                    <div className="flex-1">
                      <div className="font-medium text-sm capitalize">{element.type}</div>
                      <div className="text-xs text-muted-foreground">
                        Zone: {element.zone} • Position: {element.position.x}%, {element.position.y}%
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditElement(element)}
                      data-testid={`button-edit-layer-${index}`}
                    >
                      <Move className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveElement(element.id)}
                      data-testid={`button-remove-layer-${index}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No layers added. Click "Add Layer" to start compositing your scene.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
