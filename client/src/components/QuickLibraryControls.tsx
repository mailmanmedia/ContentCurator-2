import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image, Star, ExternalLink, Upload } from "lucide-react";
import LibraryItemPicker from "./LibraryItemPicker";
import UploadLibraryItemDialog from "./UploadLibraryItemDialog";

interface LibraryItem {
  id: string;
  type: string;
  name: string;
  description: string;
  metaJson: Record<string, any>;
  tags: string[];
  category: string;
  isStarred: boolean;
  isActive: boolean;
  thumbnailUrl?: string;
  contentUrl?: string;
  fileSize?: string;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuickLibraryControlsProps {
  onItemSelect?: (item: LibraryItem) => void;
}

export default function QuickLibraryControls({ onItemSelect }: QuickLibraryControlsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data, isLoading } = useQuery<{ libraryItems: LibraryItem[] }>({
    queryKey: ['/api/library-items'],
  });

  const libraryItems = data?.libraryItems || [];

  const starredItems = libraryItems
    .filter(item => item.isStarred && item.isActive)
    .slice(0, 4);

  const recentItems = libraryItems
    .filter(item => item.isActive && !item.isStarred)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 2);

  const quickAccessItems = [...starredItems, ...recentItems].slice(0, 4);

  const handleItemSelect = (item: LibraryItem) => {
    onItemSelect?.(item);
    setIsPickerOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Quick Library Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading library...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Quick Library Access
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => setIsUploadOpen(true)}
                data-testid="button-upload-content"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPickerOpen(true)}
                data-testid="button-browse-library"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Browse
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {quickAccessItems.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                No library items available
              </p>
              <Button
                size="sm"
                variant="default"
                onClick={() => setIsUploadOpen(true)}
                data-testid="button-add-first-library-item"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload Content
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {quickAccessItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-md p-2 space-y-2 hover-elevate cursor-pointer"
                  onClick={() => handleItemSelect(item)}
                  data-testid={`quick-library-${item.id}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium truncate">
                      {item.name}
                    </span>
                    {item.isStarred && (
                      <Star className="w-3 h-3 fill-primary text-primary flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="aspect-video bg-sidebar rounded border flex items-center justify-center overflow-hidden">
                    {item.thumbnailUrl || item.contentUrl ? (
                      <img
                        src={item.thumbnailUrl || item.contentUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <Badge variant="outline" className="text-xs w-full justify-center">
                    {item.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LibraryItemPicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onSelect={handleItemSelect}
        title="Browse Library Items"
      />
      
      <UploadLibraryItemDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
    </>
  );
}
