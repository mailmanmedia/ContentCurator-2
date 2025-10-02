import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Image, FileText, LayoutDashboard, Type, List, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

interface LibraryItemPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: LibraryItem) => void;
  typeFilter?: string;
  title?: string;
}

export default function LibraryItemPicker({ 
  open, 
  onOpenChange, 
  onSelect,
  typeFilter: initialTypeFilter,
  title = "Select Library Item"
}: LibraryItemPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(initialTypeFilter || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const { data: libraryItems, isLoading } = useQuery<LibraryItem[]>({
    queryKey: ['/api/library-items'],
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'template': return <FileText className="w-4 h-4" />;
      case 'dashboard': return <LayoutDashboard className="w-4 h-4" />;
      case 'lower_third': return <Type className="w-4 h-4" />;
      case 'ticker_item': return <List className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredItems = libraryItems?.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory && item.isActive;
  }) || [];

  const categories = Array.from(new Set(libraryItems?.map(item => item.category) || []));

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onOpenChange(false);
      setSelectedItem(null);
      setSearchTerm('');
    }
  };

  const handleItemClick = (item: LibraryItem) => {
    setSelectedItem(item);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-picker-search"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-picker-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="dashboard">Dashboards</SelectItem>
                <SelectItem value="lower_third">Lower Thirds</SelectItem>
                <SelectItem value="ticker_item">Ticker Items</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-picker-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Loading library items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Image className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-bold mb-2">No Library Items Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Add items to your library first'}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-md p-3 space-y-2 hover-elevate cursor-pointer ${
                      selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                    data-testid={`picker-item-${item.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getTypeIcon(item.type)}
                        <span className="text-sm font-medium truncate">
                          {item.name}
                        </span>
                      </div>
                      {item.isStarred && (
                        <Star className="w-4 h-4 fill-primary text-primary flex-shrink-0" />
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
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          {getTypeIcon(item.type)}
                          <span className="text-xs">No preview</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedItem(null);
              setSearchTerm('');
            }}
            data-testid="button-picker-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedItem}
            data-testid="button-picker-select"
          >
            Select Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
