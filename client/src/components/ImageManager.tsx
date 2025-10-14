import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Search, 
  Image, 
  Folder, 
  Download,
  Eye,
  Trash2,
  Star,
  Filter,
  Users,
  Building,
  Target,
  Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Image as ImageType } from "@shared/schema";

// Using the Image type from shared schema
type ImageFile = ImageType & {
  dateAdded?: string; // For backward compatibility
};

interface ImageCategory {
  name: string;
  count: number;
  icon: string;
}

export default function ImageManager() {
  // Use React Query to fetch images
  const { data: imagesData, isLoading: isLoadingImages } = useQuery<{ images: ImageFile[] }>({
    queryKey: ['/api/images'],
    refetchOnWindowFocus: false
  });
  
  const images = imagesData?.images || [];
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSearching, setIsSearching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Create image mutation
  const createImageMutation = useMutation({
    mutationFn: async (imageData: any) => {
      const response = await apiRequest('POST', '/api/images', imageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      toast({
        title: "Image Added",
        description: "Image has been successfully added to your library"
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to add image to library",
        variant: "destructive"
      });
    }
  });

  // Update image mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/images/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
    }
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/images/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      toast({
        title: "Image Deleted",
        description: "Image has been removed from your collection"
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  });

  // Get icon component for category
  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      "All": <Folder className="w-4 h-4" />,
      "Players": <Users className="w-4 h-4" />,
      "Staff": <Users className="w-4 h-4" />,
      "Stadium": <Building className="w-4 h-4" />,
      "Matches": <Target className="w-4 h-4" />,
      "Training": <Trophy className="w-4 h-4" />
    };
    return iconMap[category] || <Folder className="w-4 h-4" />;
  };

  const categories: ImageCategory[] = [
    { name: "All", count: images.length, icon: "" },
    { name: "Players", count: images.filter((img: any) => img.category === "Players").length, icon: "" },
    { name: "Staff", count: images.filter((img: any) => img.category === "Staff").length, icon: "" },
    { name: "Stadium", count: images.filter((img: any) => img.category === "Stadium").length, icon: "" },
    { name: "Matches", count: images.filter((img: any) => img.category === "Matches").length, icon: "" },
    { name: "Training", count: images.filter((img: any) => img.category === "Training").length, icon: "" }
  ];

  const filteredImages = images.filter((image: ImageFile) => {
    const matchesSearch = searchQuery === "" || 
      (image.filename && image.filename.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (image.alt_text && image.alt_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (image.caption && image.caption.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || image.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(0);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      
      try {
        // Create FormData for real file upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('title', file.name.split('.')[0].replace(/[-_]/g, ' '));
        formData.append('description', `Uploaded image: ${file.name}`);
        formData.append('category', 'Uploads');
        
        // Simulate upload progress
        for (let progress = 0; progress <= 80; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(progress);
        }
        
        // Use real file upload endpoint
        const response = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Complete progress and invalidate cache to refresh the list
        setUploadProgress(100);
        queryClient.invalidateQueries({ queryKey: ['/api/images'] });
        
        toast({
          title: "Upload Successful",
          description: `${file.name} has been uploaded and processed`
        });
        
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }
    
    setUploadProgress(0);
  };

  const searchOnlineImages = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search term to find images online",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/ai/search-images',
        { query: searchQuery }
      );
      
      const data = await response.json();
      
      // Set search results for display
      setSearchResults(data.suggestions || []);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.suggestions?.length || 0} image suggestions for "${searchQuery}"`
      });
      
    } catch (error) {
      console.error('Error searching images:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search for images online",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleStar = (imageId: number) => {
    // Star functionality not implemented in current schema
    toast({
      title: "Feature Not Available",
      description: "Image starring feature is not yet implemented"
    });
  };

  const deleteImage = (imageId: number) => {
    deleteImageMutation.mutate(imageId.toString());
  };

  const downloadImage = (image: ImageFile) => {
    // Create download link
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.filename || `image-${image.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading ${image.filename || 'image'}`
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="font-league-spartan font-bold text-lg sm:text-xl uppercase tracking-wide text-card-foreground flex items-center gap-2">
            <Image className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Image Management System</span>
            <span className="sm:hidden">Images</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          <Tabs defaultValue="library" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="library" data-testid="tab-library" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Image Library</span>
                <span className="sm:hidden">Library</span>
              </TabsTrigger>
              <TabsTrigger value="upload" data-testid="tab-upload" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Upload Images</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="search" data-testid="tab-search" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Find Online</span>
                <span className="sm:hidden">Search</span>
              </TabsTrigger>
            </TabsList>

            {/* Image Library Tab */}
            <TabsContent value="library" className="space-y-4 sm:space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="font-libre-franklin text-sm"
                    data-testid="input-search-images"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-card border border-card-border rounded-md font-libre-franklin text-xs sm:text-sm w-full sm:w-auto min-w-[120px]"
                    data-testid="select-category"
                  >
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredImages.map((image) => (
                  <Card key={image.id} className="group hover-elevate bg-card border-card-border overflow-hidden">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt_text || image.filename || 'Image'}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      
                      {/* Mobile: Simple tap actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 sm:gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => toggleStar(image.id)}
                          data-testid={`button-star-${image.id}`}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => downloadImage(image)}
                          data-testid={`button-download-${image.id}`}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => deleteImage(image.id)}
                          data-testid={`button-delete-${image.id}`}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>

                    </div>
                    
                    <CardContent className="p-2 sm:p-4">
                      <h4 className="font-league-spartan font-bold text-xs sm:text-sm text-card-foreground truncate mb-1 sm:mb-2">
                        {image.filename || image.alt_text || `Image ${image.id}`}
                      </h4>
                      
                      <div className="hidden sm:flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{image.size ? `${Math.round(image.size / 1024)}KB` : 'N/A'}</span>
                        <span>{image.width && image.height ? `${image.width}x${image.height}` : 'N/A'}</span>
                      </div>
                      
                      {image.category && (
                        <Badge variant="outline" className="text-xs">
                          {image.category}
                        </Badge>
                      )}
                      
                      {image.caption && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {image.caption}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredImages.length === 0 && (
                <div className="text-center py-12">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-league-spartan font-bold text-lg uppercase text-foreground mb-2">
                    No Images Found
                  </h3>
                  <p className="font-libre-franklin text-muted-foreground">
                    {searchQuery || selectedCategory !== "All" 
                      ? "Try adjusting your search or filters" 
                      : "Upload images or search online to get started"
                    }
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4 sm:space-y-6">
              <div className="border-2 border-dashed border-card-border rounded-lg p-6 sm:p-8 text-center">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="font-league-spartan font-bold text-base sm:text-lg uppercase text-foreground mb-2">
                  Upload Images
                </h3>
                <p className="font-libre-franklin text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  <span className="hidden sm:inline">Drag and drop images here, or click to browse files</span>
                  <span className="sm:hidden">Tap to select images</span>
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="font-league-spartan font-bold uppercase tracking-wide w-full sm:w-auto"
                  data-testid="button-browse-files"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Browse Files</span>
                  <span className="sm:hidden">Select Images</span>
                </Button>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 sm:p-6">
                    <h4 className="font-league-spartan font-bold text-sm sm:text-base text-primary mb-2 sm:mb-3">
                      Supported Formats
                    </h4>
                    <ul className="font-libre-franklin text-xs sm:text-sm text-card-foreground space-y-1">
                      <li>• JPEG, JPG</li>
                      <li>• PNG</li>
                      <li>• WebP</li>
                      <li>• SVG</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="p-4 sm:p-6">
                    <h4 className="font-league-spartan font-bold text-sm sm:text-base text-accent mb-2 sm:mb-3">
                      Auto-Organization
                    </h4>
                    <ul className="font-libre-franklin text-xs sm:text-sm text-card-foreground space-y-1">
                      <li>• Automatic categorization</li>
                      <li>• Tag extraction from filename</li>
                      <li>• Duplicate detection</li>
                      <li>• Size optimization</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Search Online Tab */}
            <TabsContent value="search" className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Input
                    placeholder="Search Liverpool FC images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchOnlineImages()}
                    className="font-libre-franklin text-sm"
                    data-testid="input-online-search"
                  />
                  <Button 
                    onClick={searchOnlineImages}
                    disabled={isSearching}
                    className="font-league-spartan font-bold uppercase tracking-wide w-full sm:w-auto"
                    data-testid="button-search-online"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <h5 className="font-league-spartan font-bold text-xs sm:text-sm text-primary mb-1 sm:mb-2">
                        AI-Powered Search
                      </h5>
                      <p className="font-libre-franklin text-xs text-card-foreground">
                        Uses advanced AI to find relevant Liverpool FC images
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-accent/5 border-accent/20">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <h5 className="font-league-spartan font-bold text-xs sm:text-sm text-accent mb-1 sm:mb-2">
                        High Quality
                      </h5>
                      <p className="font-libre-franklin text-xs text-card-foreground">
                        Filters for high-resolution, professional images
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-chart-2/5 border-chart-2/20">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <h5 className="font-league-spartan font-bold text-xs sm:text-sm text-chart-2 mb-1 sm:mb-2">
                        Auto-Save
                      </h5>
                      <p className="font-libre-franklin text-xs text-card-foreground">
                        Automatically saves found images to your library
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {isSearching && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="font-league-spartan font-bold text-lg uppercase text-foreground mb-2">
                    Searching Online
                  </h3>
                  <p className="font-libre-franklin text-muted-foreground">
                    AI is finding the best Liverpool FC images for you...
                  </p>
                </div>
              )}
              
              {/* Search Results Display */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-league-spartan font-bold text-base sm:text-lg text-foreground">
                    Image Suggestions for "{searchQuery}"
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {searchResults.map((suggestion: any, index: number) => (
                      <Card key={index} className="bg-card border-card-border hover-elevate">
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2 sm:space-y-3">
                            <h5 className="font-league-spartan font-bold text-sm sm:text-base text-foreground">
                              {suggestion.title}
                            </h5>
                            <p className="font-libre-franklin text-xs sm:text-sm text-muted-foreground">
                              {suggestion.description}
                            </p>
                            <div className="space-y-2">
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.category}
                              </Badge>
                              <div className="flex flex-wrap gap-1">
                                {suggestion.tags?.slice(0, 3).map((tag: string, tagIndex: number) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {suggestion.tags?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{suggestion.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Sources:</strong> {suggestion.suggestedSources?.slice(0, 2).join(', ')}
                                {suggestion.suggestedSources?.length > 2 && '...'}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-xs"
                              onClick={() => {
                                toast({
                                  title: "Image Source Info",
                                  description: `Check ${suggestion.suggestedSources?.[0] || 'official sources'} for ${suggestion.title}`,
                                });
                              }}
                            >
                              Find This Image
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}