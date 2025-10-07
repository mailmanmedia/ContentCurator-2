import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search,
  Filter,
  Star,
  Calendar,
  Tag,
  FileText,
  Image,
  Presentation,
  Newspaper,
  Target,
  BarChart3,
  Video,
  Settings,
  Download,
  Edit,
  Trash2,
  Eye,
  Clock,
  TrendingUp,
  Grid3X3,
  List,
  SortAsc,
  Archive,
  ExternalLink
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ContentItem {
  id: string;
  title: string;
  type: 'report' | 'image' | 'framework' | 'recording' | 'rss_article' | 'rss_analysis' | 'presentation_set' | 'scene' | 'library_item' | 'ticker_playlist';
  description?: string;
  thumbnail?: string;
  url?: string;
  tags: string[];
  category?: string;
  isStarred?: boolean;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  metadata?: any;
}

const contentTypeConfig = {
  report: {
    label: "Reports",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    description: "AI-generated content and analysis"
  },
  image: {
    label: "Images",
    icon: Image,
    color: "bg-green-500/10 text-green-600 border-green-200",
    description: "Visual assets and media files"
  },
  framework: {
    label: "Frameworks",
    icon: Settings,
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
    description: "Content creation templates"
  },
  recording: {
    label: "Recordings",
    icon: Video,
    color: "bg-violet-500/10 text-violet-600 border-violet-200",
    description: "Broadcast recordings and video content"
  },
  rss_article: {
    label: "News Articles",
    icon: Newspaper,
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
    description: "RSS feed articles and news"
  },
  rss_analysis: {
    label: "News Analysis",
    icon: BarChart3,
    color: "bg-red-500/10 text-red-600 border-red-200",
    description: "AI analysis of news content"
  },
  presentation_set: {
    label: "Presentation Sets",
    icon: Presentation,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    description: "Live presentation collections"
  },
  scene: {
    label: "Scenes",
    icon: Video,
    color: "bg-pink-500/10 text-pink-600 border-pink-200",
    description: "Individual presentation scenes"
  },
  library_item: {
    label: "Library Items",
    icon: Archive,
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
    description: "Live presentation assets"
  },
  ticker_playlist: {
    label: "Ticker Playlists",
    icon: TrendingUp,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    description: "News ticker content"
  }
};

export default function ContentLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const { toast } = useToast();

  // Fetch content types conditionally based on filter
  const { data: reportsData } = useQuery({
    queryKey: ['/api/reports'],
    select: (response: any) => response.reports || [],
    enabled: selectedType === 'all' || selectedType === 'report'
  });

  const { data: imagesData } = useQuery({
    queryKey: ['/api/images'],
    select: (response: any) => response.images || [],
    enabled: selectedType === 'all' || selectedType === 'image'
  });

  const { data: frameworksData } = useQuery({
    queryKey: ['/api/frameworks'],
    select: (response: any) => response.frameworks || [],
    enabled: selectedType === 'all' || selectedType === 'framework'
  });

  const { data: rssArticlesData } = useQuery({
    queryKey: ['/api/rss-articles'],
    select: (response: any) => response.articles || [],
    enabled: selectedType === 'all' || selectedType === 'rss_article'
  });

  const { data: presentationSetsData } = useQuery({
    queryKey: ['/api/presentation-sets'],
    select: (response: any) => response.presentationSets || [],
    enabled: selectedType === 'all' || selectedType === 'presentation_set'
  });

  const { data: scenesData } = useQuery({
    queryKey: ['/api/scenes'],
    select: (response: any) => response.scenes || [],
    enabled: selectedType === 'all' || selectedType === 'scene'
  });

  const { data: libraryItemsData } = useQuery({
    queryKey: ['/api/library-items'],
    select: (response: any) => response.libraryItems || [],
    enabled: selectedType === 'all' || selectedType === 'library_item'
  });

  const { data: tickerPlaylistsData } = useQuery({
    queryKey: ['/api/ticker-playlists'],
    select: (response: any) => response.tickerPlaylists || [],
    enabled: selectedType === 'all' || selectedType === 'ticker_playlist'
  });

  const { data: recordingsData } = useQuery<any[]>({
    queryKey: ['/api/recordings'],
    enabled: selectedType === 'all' || selectedType === 'recording'
  });

  // Combine all content into unified format
  const allContent: ContentItem[] = [
    ...(reportsData || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      type: 'report' as const,
      description: item.status,
      tags: [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      status: item.status,
      metadata: { bodyJson: item.bodyJson, contextJson: item.contextJson }
    })),
    ...(imagesData || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      type: 'image' as const,
      description: item.description,
      thumbnail: item.thumbnail,
      url: item.url,
      tags: item.tags || [],
      category: item.category,
      isStarred: item.isStarred,
      createdAt: item.createdAt,
      metadata: { size: item.size, type: item.type, mimeType: item.mimeType }
    })),
    ...(frameworksData || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      type: 'framework' as const,
      description: item.description,
      tags: item.tags || [],
      isStarred: item.isStarred,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      metadata: { totalDownloads: item.totalDownloads, categoryId: item.categoryId }
    })),
    ...(rssArticlesData || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      type: 'rss_article' as const,
      description: item.description,
      thumbnail: item.imageUrl,
      url: item.link,
      tags: item.keywords || [],
      category: item.categories?.[0],
      createdAt: item.createdAt,
      metadata: { author: item.author, publishedAt: item.publishedAt, sentiment: item.sentiment }
    })),
    ...(presentationSetsData || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      type: 'presentation_set' as const,
      description: item.description,
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      metadata: { sceneIds: item.sceneIds, isActive: item.isActive }
    })),
    ...(scenesData || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      type: 'scene' as const,
      description: item.description,
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      metadata: { layout: item.layout, aspectRatio: item.aspectRatio, isTemplate: item.isTemplate }
    })),
    ...(libraryItemsData || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      type: 'library_item' as const,
      description: item.description,
      thumbnail: item.thumbnailUrl,
      url: item.contentUrl,
      tags: item.tags || [],
      category: item.category,
      isStarred: item.isStarred,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      metadata: { type: item.type, mimeType: item.mimeType, fileSize: item.fileSize }
    })),
    ...(tickerPlaylistsData || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      type: 'ticker_playlist' as const,
      description: item.description,
      tags: [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      metadata: { mode: item.mode, speed: item.speed, isActive: item.isActive }
    })),
    ...(recordingsData || []).map((item: any) => ({
      id: item.id,
      title: item.filename,
      type: 'recording' as const,
      description: `${item.duration || 0}s · ${(item.size / 1024 / 1024).toFixed(1)}MB`,
      thumbnail: item.thumbnailPath,
      url: `/api/recordings/${item.id}/video`,
      tags: item.resolution ? [item.resolution] : [],
      createdAt: item.createdAt,
      metadata: { 
        duration: item.duration, 
        size: item.size, 
        resolution: item.resolution,
        format: item.format,
        codec: item.codec,
        filepath: item.filepath
      }
    }))
  ];

  // Filter content
  const filteredContent = allContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === "all" || item.type === selectedType;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesStarred = !showStarredOnly || item.isStarred;
    
    return matchesSearch && matchesType && matchesCategory && matchesStarred;
  });

  // Sort content
  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "name":
        return a.title.localeCompare(b.title);
      case "type":
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  // Get unique categories
  const categories = Array.from(new Set(allContent.map(item => item.category).filter(Boolean))) as string[];

  // Content type stats
  const contentStats = Object.keys(contentTypeConfig).map(type => ({
    type,
    count: allContent.filter(item => item.type === type).length,
    ...contentTypeConfig[type as keyof typeof contentTypeConfig]
  }));

  const totalItems = allContent.length;
  const starredItems = allContent.filter(item => item.isStarred).length;
  const recentItems = allContent.filter(item => 
    new Date(item.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  const starMutation = useMutation({
    mutationFn: async ({ type, id, isStarred }: { type: string; id: string; isStarred: boolean }) => {
      let endpoint = '';
      switch (type) {
        case 'image':
          endpoint = `/api/images/${id}`;
          break;
        case 'framework':
          endpoint = `/api/frameworks/${id}`;
          break;
        case 'library_item':
          endpoint = `/api/library-items/${id}`;
          break;
        default:
          throw new Error(`Starring not supported for type: ${type}`);
      }
      return apiRequest('PUT', endpoint, { isStarred: !isStarred });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      queryClient.invalidateQueries({ queryKey: ['/api/frameworks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/library-items'] });
      toast({
        title: "Success",
        description: variables.isStarred ? "Removed from starred" : "Added to starred"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update starred status",
        variant: "destructive"
      });
    }
  });

  const handleViewContent = (item: ContentItem) => {
    setSelectedContent(item);
    setViewDialogOpen(true);
  };

  const handleEditContent = (item: ContentItem) => {
    toast({
      title: "Coming Soon",
      description: "Content editing will be available in a future update"
    });
  };

  const handleDeleteContent = (item: ContentItem) => {
    toast({
      title: "Coming Soon",
      description: "Content deletion will be available in a future update"
    });
  };

  const handleStarContent = (item: ContentItem) => {
    if (['image', 'framework', 'library_item'].includes(item.type)) {
      starMutation.mutate({
        type: item.type,
        id: item.id,
        isStarred: item.isStarred || false
      });
    } else {
      toast({
        title: "Not Supported",
        description: `Starring is not yet supported for ${contentTypeConfig[item.type].label}`
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="font-league-spartan font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-wide text-foreground mb-2">
                Content Library
              </h1>
              <p className="font-libre-franklin text-sm sm:text-base lg:text-lg text-muted-foreground">
                Browse and manage all your created content across platforms
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="font-mono font-bold text-xl sm:text-2xl text-primary mb-1">{totalItems}</div>
                <div className="font-libre-franklin text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Total Items</div>
              </CardContent>
            </Card>
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="font-mono font-bold text-xl sm:text-2xl text-accent mb-1">{starredItems}</div>
                <div className="font-libre-franklin text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Starred</div>
              </CardContent>
            </Card>
            <Card className="bg-chart-2/10 border-chart-2/20">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="font-mono font-bold text-xl sm:text-2xl text-chart-2 mb-1">{recentItems}</div>
                <div className="font-libre-franklin text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">This Week</div>
              </CardContent>
            </Card>
            <Card className="bg-chart-5/10 border-chart-5/20">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="font-mono font-bold text-xl sm:text-2xl text-chart-5 mb-1">{Object.keys(contentTypeConfig).length}</div>
                <div className="font-libre-franklin text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Content Types</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-content"
                    />
                  </div>
                </div>

                {/* Content Type Filter */}
                <div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger data-testid="select-content-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(contentTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort and View Options */}
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="flex-1" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showStarredOnly ? "default" : "outline"}
                    size="icon"
                    onClick={() => setShowStarredOnly(!showStarredOnly)}
                    data-testid="button-toggle-starred"
                  >
                    <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-current' : ''}`} />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    data-testid="button-toggle-view"
                  >
                    {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content ({sortedContent.length})</TabsTrigger>
            <TabsTrigger value="types">By Type</TabsTrigger>
          </TabsList>

          {/* Content List */}
          <TabsContent value="content" className="space-y-4">
            {sortedContent.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-league-spartan font-bold text-lg text-foreground mb-2">
                    No Content Found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedType !== "all" || selectedCategory !== "all" || showStarredOnly
                      ? "Try adjusting your filters to see more content"
                      : "Start creating content to see it here"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "space-y-3"
              }>
                {sortedContent.map((item) => {
                  const TypeIcon = contentTypeConfig[item.type].icon;
                  
                  return viewMode === "grid" ? (
                    <Card key={item.id} className="hover-elevate">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge className={contentTypeConfig[item.type].color} variant="outline">
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {contentTypeConfig[item.type].label}
                          </Badge>
                          {item.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        </div>
                        <CardTitle className="text-sm line-clamp-2">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {item.thumbnail && (
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <img 
                              src={item.thumbnail} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
                          {item.category && <span>{item.category}</span>}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewContent(item)}
                            className="flex-1"
                            data-testid={`button-view-${item.id}`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditContent(item)}
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStarContent(item);
                            }}
                            disabled={starMutation.isPending}
                            data-testid={`button-star-${item.id}`}
                          >
                            <Star className={`w-3 h-3 ${item.isStarred ? 'fill-current text-yellow-500' : ''}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={item.id} className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {item.thumbnail ? (
                            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={item.thumbnail} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              <TypeIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={contentTypeConfig[item.type].color} variant="outline">
                                  {contentTypeConfig[item.type].label}
                                </Badge>
                                {item.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleViewContent(item)}
                                  data-testid={`button-view-list-${item.id}`}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleEditContent(item)}
                                  data-testid={`button-edit-list-${item.id}`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStarContent(item);
                                  }}
                                  disabled={starMutation.isPending}
                                  data-testid={`button-star-list-${item.id}`}
                                >
                                  <Star className={`w-3 h-3 ${item.isStarred ? 'fill-current text-yellow-500' : ''}`} />
                                </Button>
                              </div>
                            </div>
                            
                            <h3 className="font-semibold text-sm mb-1 truncate">{item.title}</h3>
                            
                            {item.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
                              {item.category && <span>{item.category}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Content Types Overview */}
          <TabsContent value="types" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentStats.map((stat) => (
                <Card 
                  key={stat.type} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => setSelectedType(stat.type)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <stat.icon className="w-5 h-5" />
                        <CardTitle className="text-base">{stat.label}</CardTitle>
                      </div>
                      <Badge variant="secondary">{stat.count}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {stat.description}
                    </p>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${totalItems > 0 ? (stat.count / totalItems) * 100 : 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* View Content Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]" data-testid="dialog-view-content">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContent && (
                <>
                  {(() => {
                    const TypeIcon = contentTypeConfig[selectedContent.type].icon;
                    return <TypeIcon className="w-5 h-5" />;
                  })()}
                  {selectedContent.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedContent && contentTypeConfig[selectedContent.type].label}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            {selectedContent && (
              <div className="space-y-4">
                {selectedContent.thumbnail && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={selectedContent.thumbnail} 
                      alt={selectedContent.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {selectedContent.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedContent.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Created</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedContent.createdAt), "PPpp")}
                    </p>
                  </div>
                  
                  {selectedContent.updatedAt && (
                    <div>
                      <h4 className="font-semibold mb-2">Updated</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedContent.updatedAt), "PPpp")}
                      </p>
                    </div>
                  )}
                  
                  {selectedContent.category && (
                    <div>
                      <h4 className="font-semibold mb-2">Category</h4>
                      <Badge variant="secondary">{selectedContent.category}</Badge>
                    </div>
                  )}
                  
                  {selectedContent.status && (
                    <div>
                      <h4 className="font-semibold mb-2">Status</h4>
                      <Badge variant="outline">{selectedContent.status}</Badge>
                    </div>
                  )}
                </div>
                
                {selectedContent.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedContent.url && (
                  <div>
                    <h4 className="font-semibold mb-2">URL</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={selectedContent.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Link
                      </a>
                    </Button>
                  </div>
                )}
                
                {selectedContent.metadata && Object.keys(selectedContent.metadata).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Additional Details</h4>
                    <div className="text-xs bg-muted p-3 rounded-lg font-mono">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(selectedContent.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}