import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Download, Star, Tag, Filter, X, Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Framework, FrameworkCategory } from "@shared/schema";
import Header from "@/components/Header";

export default function FrameworkDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch framework categories
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/framework-categories'],
    select: (response: any) => response.categories as FrameworkCategory[]
  });

  // Fetch frameworks with filtering
  const { data: frameworksData, isLoading } = useQuery({
    queryKey: ['/api/frameworks', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const url = `/api/frameworks${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch frameworks');
      }
      return await response.json();
    },
    select: (response: any) => response.frameworks as Framework[]
  });

  const handleDownload = async (frameworkId: string, versionId?: string) => {
    try {
      const response = await fetch(`/api/frameworks/${frameworkId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
      
      if (!response.ok) throw new Error('Download tracking failed');
      
      toast({
        title: "Download Tracked",
        description: "Framework download has been recorded"
      });
    } catch (error) {
      console.error('Download tracking failed:', error);
    }
  };

  const handleViewDetails = (framework: Framework) => {
    console.log('View details for framework:', framework.id);
    setSelectedFramework(framework);
  };

  const handleStar = async (frameworkId: string, isStarred: boolean) => {
    try {
      const response = await fetch(`/api/frameworks/${frameworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !isStarred })
      });
      
      if (!response.ok) throw new Error('Star toggle failed');
      
      toast({
        title: isStarred ? "Removed from Favorites" : "Added to Favorites",
        description: `Framework ${isStarred ? 'removed from' : 'added to'} your favorites`
      });
    } catch (error) {
      console.error('Star toggle failed:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    }
  };

  const getCategoryById = (categoryId: string) => {
    return categoriesData?.find(cat => cat.id === categoryId);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedFramework) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or Word document (.pdf, .docx, .doc)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadedFileName(file.name);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', file);

      // Simulate progress (since XMLHttpRequest is more complex with fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/frameworks/${selectedFramework.id}/upload-document`, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      // Handle different response statuses
      if (response.status === 422) {
        // Extraction failed but file was uploaded
        toast({
          title: "Document Uploaded (Extraction Failed)",
          description: result.extractionError || "Could not extract text from document",
          variant: "destructive"
        });
      } else if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      } else if (result.processingStatus === 'completed') {
        // Successful extraction
        toast({
          title: "Document Uploaded Successfully",
          description: `Extracted ${result.extractedTextLength} characters from ${file.name}`,
        });
      }

      // Invalidate framework versions query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['/api/frameworks'] });
      
      // Reset upload state
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadedFileName("");
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
      setUploadedFileName("");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="heading-framework-directory">
            Framework Directory
          </h1>
          <p className="text-muted-foreground">
            Discover and manage content frameworks for Liverpool FC analysis
          </p>
        </div>
        
        <Link href="/frameworks/create">
          <Button data-testid="button-create-framework">
            <Plus className="w-4 h-4 mr-2" />
            Create Framework
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search frameworks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-frameworks"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoriesData?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Stats */}
      {categoriesData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {categoriesData.map((category) => (
            <Card 
              key={category.id} 
              className={`hover-elevate cursor-pointer transition-all ${
                selectedCategory === category.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
              data-testid={`card-category-${category.id}`}
            >
              <CardContent className="p-4 text-center">
                <div 
                  className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color }}
                >
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {frameworksData?.filter(f => f.category_id === category.id).length || 0} frameworks
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Framework Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : frameworksData?.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2">No frameworks found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Be the first to create a framework for your team'
            }
          </p>
          <Link href="/frameworks/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Framework
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworksData?.map((framework) => {
            const category = getCategoryById(framework.category_id);
            return (
              <Card key={framework.id} className="hover-elevate" data-testid={`card-framework-${framework.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{framework.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {framework.description}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStar(framework.id, framework.isStarred)}
                      data-testid={`button-star-${framework.id}`}
                    >
                      <Star 
                        className={`w-4 h-4 ${framework.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                      />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {category && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {category.name}
                      </Badge>
                    )}
                    {framework.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {framework.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{framework.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                    <span>{framework.totalDownloads} downloads</span>
                    <span>{new Date(framework.updated_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDetails(framework)}
                      data-testid={`button-view-${framework.id}`}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownload(framework.id)}
                      data-testid={`button-download-${framework.id}`}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Framework Details Modal */}
      <Dialog open={!!selectedFramework} onOpenChange={() => setSelectedFramework(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedFramework?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedFramework && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-foreground">
                  {selectedFramework.description}
                </p>
              </div>

              {/* Document Upload Section */}
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                  Upload Document
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1"
                      data-testid="button-browse-files"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Browse Files
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {uploadedFileName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{uploadedFileName}</span>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {uploadProgress < 100 ? 'Uploading and processing...' : 'Complete!'}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Upload PDF or Word documents to automatically extract and add content to this framework
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                  Category & Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const category = getCategoryById(selectedFramework.category_id);
                    return category ? (
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {category.name}
                      </Badge>
                    ) : null;
                  })()}
                  {selectedFramework.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-1">
                    Downloads
                  </h3>
                  <p className="text-lg font-bold text-foreground">
                    {selectedFramework.totalDownloads}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-1">
                    Last Updated
                  </h3>
                  <p className="text-lg font-bold text-foreground">
                    {new Date(selectedFramework.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleDownload(selectedFramework.id)}
                  className="flex-1"
                  data-testid={`modal-download-${selectedFramework.id}`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Use Framework
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleStar(selectedFramework.id, selectedFramework.isStarred)}
                  data-testid={`modal-star-${selectedFramework.id}`}
                >
                  <Star 
                    className={`w-4 h-4 ${selectedFramework.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                  />
                  {selectedFramework.isStarred ? 'Unfavorite' : 'Favorite'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}