import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Camera, Image as ImageIcon, Type, Box, Radio, Save, X, Grid3x3 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SceneElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'graphic' | 'ticker';
  zone: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  sourceId?: string;
}

interface Scene {
  id: string;
  name: string;
  description: string;
  layout: string;
  elements: SceneElement[];
  backgroundConfig: any;
  transitionConfig: any;
  aspectRatio: string;
  tags: string[];
}

interface VisualSceneEditorProps {
  sceneId: string;
  onClose?: () => void;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | null;

export default function VisualSceneEditor({ sceneId, onClose }: VisualSceneEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [gridSnap, setGridSnap] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [workingElements, setWorkingElements] = useState<SceneElement[]>([]);
  const initializedRef = useRef(false);
  const { toast} = useToast();

  const { data: scene, isLoading } = useQuery<{ scene: Scene }>({
    queryKey: ['/api/presentation/scenes', sceneId],
    enabled: !!sceneId,
  });

  useEffect(() => {
    // Reset initialization when scene changes
    initializedRef.current = false;
    setHasUnsavedChanges(false);
  }, [sceneId]);

  useEffect(() => {
    if (scene?.scene?.elements) {
      // Only update on initial load or when explicitly discarding changes
      if (!initializedRef.current || !hasUnsavedChanges) {
        setWorkingElements(scene.scene.elements);
        initializedRef.current = true;
      }
    }
  }, [scene?.scene?.elements, hasUnsavedChanges]);

  const updateSceneMutation = useMutation({
    mutationFn: async (elements: SceneElement[]) => {
      const response = await apiRequest('PUT', `/api/presentation/scenes/${sceneId}`, {
        elements,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/scenes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/presentation/scenes', sceneId] });
      toast({ title: 'Scene saved successfully' });
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast({ title: 'Failed to save scene', variant: 'destructive' });
    },
  });

  const snapToGrid = (value: number): number => {
    if (!gridSnap) return value;
    const gridSize = 5;
    return Math.round(value / gridSize) * gridSize;
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1920 / rect.width;
    const scaleY = 1080 / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const pixelsToPercent = (pixels: number, dimension: 'x' | 'y'): number => {
    const base = dimension === 'x' ? 1920 : 1080;
    return (pixels / base) * 100;
  };

  const percentToPixels = (percent: number, dimension: 'x' | 'y'): number => {
    const base = dimension === 'x' ? 1920 : 1080;
    return (percent / 100) * base;
  };

  const getResizeHandle = (element: SceneElement, mouseX: number, mouseY: number): ResizeHandle => {
    const x = percentToPixels(element.position.x, 'x');
    const y = percentToPixels(element.position.y, 'y');
    const width = percentToPixels(element.position.width, 'x');
    const height = percentToPixels(element.position.height, 'y');
    const handleSize = 16;

    if (Math.abs(mouseX - x) < handleSize && Math.abs(mouseY - y) < handleSize) return 'nw';
    if (Math.abs(mouseX - (x + width)) < handleSize && Math.abs(mouseY - y) < handleSize) return 'ne';
    if (Math.abs(mouseX - x) < handleSize && Math.abs(mouseY - (y + height)) < handleSize) return 'sw';
    if (Math.abs(mouseX - (x + width)) < handleSize && Math.abs(mouseY - (y + height)) < handleSize) return 'se';
    if (Math.abs(mouseX - x) < handleSize && mouseY >= y && mouseY <= y + height) return 'w';
    if (Math.abs(mouseX - (x + width)) < handleSize && mouseY >= y && mouseY <= y + height) return 'e';
    if (Math.abs(mouseY - y) < handleSize && mouseX >= x && mouseX <= x + width) return 'n';
    if (Math.abs(mouseY - (y + height)) < handleSize && mouseX >= x && mouseX <= x + width) return 's';

    return null;
  };

  const isPointInElement = (element: SceneElement, mouseX: number, mouseY: number): boolean => {
    const x = percentToPixels(element.position.x, 'x');
    const y = percentToPixels(element.position.y, 'y');
    const width = percentToPixels(element.position.width, 'x');
    const height = percentToPixels(element.position.height, 'y');

    return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: mouseX, y: mouseY } = getCanvasCoordinates(e.clientX, e.clientY);

    // Check if clicking on a resize handle of selected element
    if (selectedElementId) {
      const element = workingElements.find(el => el.id === selectedElementId);
      if (element) {
        const handle = getResizeHandle(element, mouseX, mouseY);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStart({ x: mouseX, y: mouseY });
          return;
        }
      }
    }

    // Check if clicking on an element (reverse order for top-most)
    for (let i = workingElements.length - 1; i >= 0; i--) {
      const element = workingElements[i];
      if (isPointInElement(element, mouseX, mouseY)) {
        setSelectedElementId(element.id);
        setIsDragging(true);
        const elX = percentToPixels(element.position.x, 'x');
        const elY = percentToPixels(element.position.y, 'y');
        setDragStart({ x: mouseX - elX, y: mouseY - elY });
        return;
      }
    }

    // Clicked on empty space - deselect
    setSelectedElementId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: mouseX, y: mouseY } = getCanvasCoordinates(e.clientX, e.clientY);

    if (isDragging && selectedElementId) {
      const element = workingElements.find(el => el.id === selectedElementId);
      if (element) {
        const newX = snapToGrid(pixelsToPercent(mouseX - dragStart.x, 'x'));
        const newY = snapToGrid(pixelsToPercent(mouseY - dragStart.y, 'y'));

        const updated = workingElements.map(el =>
          el.id === selectedElementId
            ? {
                ...el,
                position: {
                  ...el.position,
                  x: Math.max(0, Math.min(100 - el.position.width, newX)),
                  y: Math.max(0, Math.min(100 - el.position.height, newY)),
                },
              }
            : el
        );
        setWorkingElements(updated);
        setHasUnsavedChanges(true);
      }
    } else if (isResizing && selectedElementId && resizeHandle) {
      const element = workingElements.find(el => el.id === selectedElementId);
      if (element) {
        const deltaX = pixelsToPercent(mouseX - dragStart.x, 'x');
        const deltaY = pixelsToPercent(mouseY - dragStart.y, 'y');

        let newPos = { ...element.position };

        switch (resizeHandle) {
          case 'se':
            newPos.width = snapToGrid(Math.max(5, element.position.width + deltaX));
            newPos.height = snapToGrid(Math.max(5, element.position.height + deltaY));
            break;
          case 'sw':
            newPos.x = snapToGrid(element.position.x + deltaX);
            newPos.width = snapToGrid(Math.max(5, element.position.width - deltaX));
            newPos.height = snapToGrid(Math.max(5, element.position.height + deltaY));
            break;
          case 'ne':
            newPos.y = snapToGrid(element.position.y + deltaY);
            newPos.width = snapToGrid(Math.max(5, element.position.width + deltaX));
            newPos.height = snapToGrid(Math.max(5, element.position.height - deltaY));
            break;
          case 'nw':
            newPos.x = snapToGrid(element.position.x + deltaX);
            newPos.y = snapToGrid(element.position.y + deltaY);
            newPos.width = snapToGrid(Math.max(5, element.position.width - deltaX));
            newPos.height = snapToGrid(Math.max(5, element.position.height - deltaY));
            break;
          case 'e':
            newPos.width = snapToGrid(Math.max(5, element.position.width + deltaX));
            break;
          case 'w':
            newPos.x = snapToGrid(element.position.x + deltaX);
            newPos.width = snapToGrid(Math.max(5, element.position.width - deltaX));
            break;
          case 's':
            newPos.height = snapToGrid(Math.max(5, element.position.height + deltaY));
            break;
          case 'n':
            newPos.y = snapToGrid(element.position.y + deltaY);
            newPos.height = snapToGrid(Math.max(5, element.position.height - deltaY));
            break;
        }

        // Ensure within bounds
        newPos.x = Math.max(0, Math.min(100 - newPos.width, newPos.x));
        newPos.y = Math.max(0, Math.min(100 - newPos.height, newPos.y));
        newPos.width = Math.min(100 - newPos.x, newPos.width);
        newPos.height = Math.min(100 - newPos.y, newPos.height);

        const updated = workingElements.map(el =>
          el.id === selectedElementId ? { ...el, position: newPos } : el
        );
        setWorkingElements(updated);
        setHasUnsavedChanges(true);
        setDragStart({ x: mouseX, y: mouseY });
      }
    } else {
      // Update hover state
      let found = false;
      for (let i = workingElements.length - 1; i >= 0; i--) {
        const element = workingElements[i];
        if (isPointInElement(element, mouseX, mouseY)) {
          setHoveredElementId(element.id);
          found = true;
          break;
        }
      }
      if (!found) {
        setHoveredElementId(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1920, 1080);

    // Draw grid if enabled
    if (gridSnap) {
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 20; i++) {
        const x = (i * 1920) / 20;
        const y = (i * 1080) / 20;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1080);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1920, y);
        ctx.stroke();
      }
    }

    // Draw all elements
    workingElements.forEach(element => {
      const x = percentToPixels(element.position.x, 'x');
      const y = percentToPixels(element.position.y, 'y');
      const width = percentToPixels(element.position.width, 'x');
      const height = percentToPixels(element.position.height, 'y');

      const isSelected = element.id === selectedElementId;
      const isHovered = element.id === hoveredElementId;

      // Draw element background based on type
      switch (element.type) {
        case 'video':
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(x, y, width, height);
          break;
        case 'image':
          ctx.fillStyle = '#10b981';
          ctx.fillRect(x, y, width, height);
          break;
        case 'text':
          ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
          ctx.fillRect(x, y, width, height);
          break;
        case 'graphic':
          ctx.fillStyle = '#8b5cf6';
          ctx.fillRect(x, y, width, height);
          break;
        case 'ticker':
          ctx.fillStyle = '#C8102E';
          ctx.fillRect(x, y, width, height);
          break;
      }

      // Draw border
      ctx.strokeStyle = isSelected ? '#C8102E' : isHovered ? '#1B365D' : '#4b5563';
      ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 2;
      ctx.strokeRect(x, y, width, height);

      // Draw icon and label
      const iconSize = Math.min(width, height, 80);
      const fontSize = Math.min(iconSize * 0.4, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let label = '';
      switch (element.type) {
        case 'video':
          label = 'VIDEO';
          break;
        case 'image':
          label = 'IMAGE';
          break;
        case 'text':
          label = element.content || 'TEXT';
          break;
        case 'graphic':
          label = 'GRAPHIC';
          break;
        case 'ticker':
          label = 'NEWS TICKER';
          break;
      }

      ctx.fillText(label, x + width / 2, y + height / 2);

      // Draw zone name
      if (isHovered || isSelected) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y - 24, width, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${element.zone} (${element.type})`, x + 8, y - 12);
      }

      // Draw resize handles if selected
      if (isSelected) {
        const handleSize = 12;
        ctx.fillStyle = '#C8102E';
        
        // Corner handles
        ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + width - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + width - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);
        
        // Edge handles
        ctx.fillRect(x - handleSize / 2, y + height / 2 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + width - handleSize / 2, y + height / 2 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + width / 2 - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(x + width / 2 - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);
      }
    });

    // Draw position info for selected element
    if (selectedElementId) {
      const element = workingElements.find(el => el.id === selectedElementId);
      if (element) {
        const info = `X: ${element.position.x.toFixed(1)}% Y: ${element.position.y.toFixed(1)}% W: ${element.position.width.toFixed(1)}% H: ${element.position.height.toFixed(1)}%`;
        ctx.fillStyle = 'rgba(200, 16, 46, 0.9)';
        ctx.fillRect(10, 10, 480, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(info, 20, 20);
      }
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [workingElements, selectedElementId, hoveredElementId, gridSnap]);

  const handleSave = () => {
    updateSceneMutation.mutate(workingElements);
  };

  const handleDiscard = () => {
    if (scene?.scene?.elements) {
      setWorkingElements(scene.scene.elements);
      setHasUnsavedChanges(false);
      toast({ title: 'Changes discarded' });
    }
  };

  const selectedElement = workingElements.find(el => el.id === selectedElementId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading scene...</p>
        </CardContent>
      </Card>
    );
  }

  if (!scene?.scene) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Scene not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Visual Scene Editor
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {scene.scene.name} - Drag layers to reposition, resize with handles
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="destructive">Unsaved Changes</Badge>
              )}
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-editor">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="grid-snap"
                  checked={gridSnap}
                  onCheckedChange={setGridSnap}
                  data-testid="switch-grid-snap"
                />
                <Label htmlFor="grid-snap" className="flex items-center gap-2 cursor-pointer">
                  <Grid3x3 className="w-4 h-4" />
                  Grid Snap (5%)
                </Label>
              </div>
              
              {selectedElement && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedElement.zone} ({selectedElement.type})
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {selectedElement.position.x.toFixed(1)}%, {selectedElement.position.y.toFixed(1)}% • 
                    {selectedElement.position.width.toFixed(1)}% × {selectedElement.position.height.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDiscard}
                disabled={!hasUnsavedChanges || updateSceneMutation.isPending}
                data-testid="button-discard-changes"
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || updateSceneMutation.isPending}
                data-testid="button-save-scene"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateSceneMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative bg-black rounded-md border-2 border-border overflow-hidden"
            style={{ aspectRatio: '16/9' }}
          >
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              data-testid="canvas-visual-editor"
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-gray-700 rounded border border-gray-600"></div>
              <span className="text-muted-foreground">Video</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
              <span className="text-muted-foreground">Image</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-blue-500/50 rounded border border-blue-600"></div>
              <span className="text-muted-foreground">Text</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-purple-500 rounded border border-purple-600"></div>
              <span className="text-muted-foreground">Graphic</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: '#C8102E' }}></div>
              <span className="text-muted-foreground">Ticker</span>
            </div>
          </div>

          {workingElements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No layers in this scene. Add layers using the Scene Manager.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
