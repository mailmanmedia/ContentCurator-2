import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Image, FileText, LayoutDashboard, Type, List, Star } from "lucide-react";

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

interface ContentLibraryBrowserProps {
  onSelectItem?: (item: LibraryItem) => void;
  selectedItemId?: string;
  compact?: boolean;
}

export default function ContentLibraryBrowser({ 
  onSelectItem, 
  selectedItemId,
  compact = false 
}: ContentLibraryBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading library items...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Content Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-library-search"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
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
                <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
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
          </CardContent>
        </Card>
      )}

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold mb-2">No Library Items Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Add images, templates, and graphics to your library'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid ${compact ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-4`}>
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`hover-elevate cursor-pointer ${
                selectedItemId === item.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectItem?.(item)}
              data-testid={`library-item-${item.id}`}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-sm truncate">
                      {item.name}
                    </CardTitle>
                  </div>
                  {item.isStarred && (
                    <Star className="w-4 h-4 fill-primary text-primary flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                <div className="aspect-video bg-sidebar rounded border flex items-center justify-center overflow-hidden">
                  {item.thumbnailUrl || item.contentUrl ? (
                    <img
                      src={item.thumbnailUrl || item.contentUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {getTypeIcon(item.type)}
                      <span className="text-xs">No preview</span>
                    </div>
                  )}
                </div>
                
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.type.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
                
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
