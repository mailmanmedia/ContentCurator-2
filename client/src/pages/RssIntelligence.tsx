import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Rss, TrendingUp, Eye, RefreshCw, Play, BarChart3, Clock, Globe, X, RotateCcw, CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RssSource, RssArticle } from "@shared/schema";
import Header from "@/components/Header";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

export default function RssIntelligence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [articleKeyword, setArticleKeyword] = useState("");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch RSS dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/rss-dashboard'],
    select: (response: any) => response.dashboard
  });

  // Fetch RSS sources
  const { data: sourcesData, isLoading: sourcesLoading } = useQuery({
    queryKey: ['/api/rss-sources'],
    select: (response: any) => response.sources as RssSource[]
  });

  // Fetch recent articles
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['/api/rss-articles', { 
      limit: 100,
      keyword: articleKeyword || undefined,
      sourceIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    }],
    select: (response: any) => response.articles as RssArticle[]
  });

  // Fetch specific source
  const fetchSourceMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const response = await apiRequest('POST', `/api/rss-sources/${sourceId}/fetch`);
      return await response.json();
    },
    onSuccess: (data, sourceId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rss-articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rss-dashboard'] });
      const source = sourcesData?.find(s => s.id === Number(sourceId));
      toast({
        title: "Feed Updated",
        description: `${source?.name}: ${data.articlesAdded} new articles fetched`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fetch Failed",
        description: error.message || "Failed to fetch RSS feed",
        variant: "destructive"
      });
    }
  });

  // Fetch all sources
  const fetchAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/rss-sources/fetch-all');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rss-articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rss-dashboard'] });
      const totalArticles = data.results.reduce((sum: number, r: any) => sum + r.result.articlesAdded, 0);
      toast({
        title: "All Feeds Updated",
        description: `${totalArticles} new articles fetched from all sources`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fetch Failed",
        description: "Failed to fetch from all sources",
        variant: "destructive"
      });
    }
  });

  const filteredSources = sourcesData?.filter(source => {
    const matchesSearch = searchQuery === "" || 
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (source.description && source.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || source.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = ["all", "official", "fan_site", "media", "podcast"];

  const formatTimeAgo = (date: string | null) => {
    if (!date) return "Never";
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      official: "bg-red-500",
      fan_site: "bg-blue-500", 
      media: "bg-green-500",
      podcast: "bg-purple-500"
    };
    return colors[category as keyof typeof colors] || "bg-gray-500";
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      official: "Official",
      fan_site: "Fan Site",
      media: "Media",
      podcast: "Podcast"
    };
    return labels[category as keyof typeof labels] || category;
  };

  // Filter articles based on all criteria
  const filteredArticles = articlesData?.filter(article => {
    // Keyword filter
    const matchesKeyword = !articleKeyword || 
      article.title.toLowerCase().includes(articleKeyword.toLowerCase()) ||
      article.description?.toLowerCase().includes(articleKeyword.toLowerCase()) ||
      article.keywords?.some(k => k.toLowerCase().includes(articleKeyword.toLowerCase()));
    
    // Source filter
    const matchesSource = selectedSourceIds.length === 0 || 
      (article.source_id !== null && selectedSourceIds.includes(article.source_id.toString()));
    
    // Date range filter
    const articleDate = article.published_at ? new Date(article.published_at) : null;
    const matchesDateRange = 
      (!startDate || !articleDate || isAfter(articleDate, startOfDay(startDate)) || articleDate.getTime() === startOfDay(startDate).getTime()) &&
      (!endDate || !articleDate || isBefore(articleDate, endOfDay(endDate)) || articleDate.getTime() === endOfDay(endDate).getTime());
    
    return matchesKeyword && matchesSource && matchesDateRange;
  }) || [];

  // Check if any filters are active
  const hasActiveFilters = articleKeyword !== "" || selectedSourceIds.length > 0 || startDate !== undefined || endDate !== undefined;
  
  // Count active filters
  const activeFilterCount = 
    (articleKeyword !== "" ? 1 : 0) + 
    (selectedSourceIds.length > 0 ? 1 : 0) + 
    (startDate || endDate ? 1 : 0);

  // Clear all filters
  const clearAllFilters = () => {
    setArticleKeyword("");
    setSelectedSourceIds([]);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Get source name by ID
  const getSourceName = (sourceId: string | number) => {
    const id = typeof sourceId === 'string' ? Number(sourceId) : sourceId;
    return sourcesData?.find(s => s.id === id)?.name || "Unknown Source";
  };

  // Toggle source selection
  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  if (dashboardLoading || sourcesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading RSS Intelligence...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" data-testid="heading-rss-intelligence">
            <Rss className="w-8 h-8 text-primary" />
            RSS Intelligence
          </h1>
          <p className="text-muted-foreground mt-2">
            Liverpool FC news aggregation and analysis system
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => fetchAllMutation.mutate()}
            disabled={fetchAllMutation.isPending}
            data-testid="button-fetch-all"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${fetchAllMutation.isPending ? 'animate-spin' : ''}`} />
            Fetch All Feeds
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sources" data-testid="tab-sources">Sources</TabsTrigger>
          <TabsTrigger value="articles" data-testid="tab-articles">Articles</TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.totalSources || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.activeSources || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.totalArticles || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.articlesThisWeek || 0}</div>
                <p className="text-xs text-muted-foreground">
                  New articles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feed Health</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All sources online
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Articles */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Articles</CardTitle>
              <CardDescription>Latest Liverpool FC news from all sources</CardDescription>
            </CardHeader>
            <CardContent>
              {articlesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-muted h-10 w-10"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData?.recentArticles?.slice(0, 8).map((article: RssArticle) => (
                    <div key={article.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-2 mb-1">
                          {article.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatTimeAgo(article.published_at ? article.published_at.toString() : null)}</span>
                          {article.author && <span>By {article.author}</span>}
                        </div>
                      </div>
                      {article.sentiment_score !== null && (
                        <Badge variant={
                          article.sentiment_score > 0.3 ? 'default' : 
                          article.sentiment_score < -0.3 ? 'destructive' : 'secondary'
                        }>
                          {article.sentiment_score > 0.3 ? 'positive' : article.sentiment_score < -0.3 ? 'negative' : 'neutral'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-sources"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-source-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSources.map((source) => (
              <Card key={source.id} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(source.category || '')}`}></div>
                        {source.name}
                        {source.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {source.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">{formatTimeAgo(source.last_fetched_at ? source.last_fetched_at.toString() : null)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{source.category || 'Uncategorized'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => fetchSourceMutation.mutate(source.id.toString())}
                        disabled={fetchSourceMutation.isPending}
                        data-testid={`button-fetch-${source.id}`}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Fetch
                      </Button>
                      
                      <Badge variant="outline">
                        {getCategoryLabel(source.category || '')}
                      </Badge>
                      
                      {!source.is_active && (
                        <Badge variant="destructive">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSources.length === 0 && !sourcesLoading && (
            <div className="text-center py-12">
              <Rss className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No sources found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters"
                  : "No RSS sources configured"
                }
              </p>
            </div>
          )}
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          {/* Filter Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Article Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Filter Controls */}
                <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
                  {/* Article Keyword Input */}
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="Search articles by keyword..."
                      value={articleKeyword}
                      onChange={(e) => setArticleKeyword(e.target.value)}
                      data-testid="input-article-keyword"
                    />
                  </div>

                  {/* Source Multi-Select */}
                  <div className="w-full lg:w-64">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between"
                          data-testid="select-article-sources"
                        >
                          {selectedSourceIds.length === 0 
                            ? "All Sources" 
                            : `${selectedSourceIds.length} source${selectedSourceIds.length > 1 ? 's' : ''} selected`}
                          <Filter className="ml-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 max-h-80 overflow-auto">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm mb-3">Filter by Source</h4>
                          {sourcesData?.filter(s => s.is_active).map((source) => (
                            <div key={source.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`source-${source.id}`}
                                checked={selectedSourceIds.includes(source.id.toString())}
                                onCheckedChange={() => toggleSourceSelection(source.id.toString())}
                              />
                              <label
                                htmlFor={`source-${source.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {source.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Start Date Picker */}
                  <div className="w-full lg:w-48">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          data-testid="datepicker-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "MMM d, yyyy") : "From: Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date Picker */}
                  <div className="w-full lg:w-48">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          data-testid="datepicker-end"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "MMM d, yyyy") : "To: Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={clearAllFilters}
                      data-testid="button-clear-filters"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Filter Status Indicators */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active:
                    </span>
                    
                    {articleKeyword && (
                      <Badge 
                        variant="secondary" 
                        className="gap-1"
                        data-testid="badge-filter-keyword"
                      >
                        Keyword: {articleKeyword}
                        <X 
                          className="w-3 h-3 cursor-pointer hover-elevate" 
                          onClick={() => setArticleKeyword("")}
                        />
                      </Badge>
                    )}
                    
                    {selectedSourceIds.length > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="gap-1"
                        data-testid="badge-filter-sources"
                      >
                        {selectedSourceIds.length} source{selectedSourceIds.length > 1 ? 's' : ''}
                        <X 
                          className="w-3 h-3 cursor-pointer hover-elevate" 
                          onClick={() => setSelectedSourceIds([])}
                        />
                      </Badge>
                    )}
                    
                    {(startDate || endDate) && (
                      <Badge 
                        variant="secondary" 
                        className="gap-1"
                        data-testid="badge-filter-dates"
                      >
                        {startDate && format(startDate, "MMM d")} - {endDate ? format(endDate, "MMM d") : "Now"}
                        <X 
                          className="w-3 h-3 cursor-pointer hover-elevate" 
                          onClick={() => {
                            setStartDate(undefined);
                            setEndDate(undefined);
                          }}
                        />
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <Card>
            <CardHeader>
              <CardTitle>Article Feed</CardTitle>
              <CardDescription>
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {articlesLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No articles found matching your filters</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filter criteria to see more results
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearAllFilters} variant="outline">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredArticles.map((article) => (
                    <article 
                      key={article.id} 
                      className="border-b border-border pb-6 last:border-0"
                      data-testid={`card-article-${article.id}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg font-semibold line-clamp-2 flex-1">
                            <a 
                              href={article.link || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors"
                            >
                              {article.title}
                            </a>
                          </h3>
                          {article.sentiment_score !== null && (
                            <Badge variant={
                              article.sentiment_score > 0.3 ? 'default' : 
                              article.sentiment_score < -0.3 ? 'destructive' : 'secondary'
                            }>
                              {article.sentiment_score > 0.3 ? 'positive' : article.sentiment_score < -0.3 ? 'negative' : 'neutral'}
                            </Badge>
                          )}
                        </div>
                        
                        {article.description && (
                          <p className="text-muted-foreground line-clamp-3">
                            {article.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span className="font-medium">{getSourceName(article.source_id || '')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.published_at 
                              ? format(new Date(article.published_at), "MMM d, yyyy 'at' h:mm a")
                              : "No date"
                            }
                          </div>
                          {article.author && (
                            <span>By {article.author}</span>
                          )}
                        </div>
                        
                        {/* Keywords from article */}
                        {article.keywords && article.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {article.keywords.slice(0, 5).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Categories from article */}
                        {article.categories && article.categories.length > 0 && !article.keywords && (
                          <div className="flex flex-wrap gap-1">
                            {article.categories.slice(0, 4).map((category: string) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feed Analysis</CardTitle>
              <CardDescription>AI-powered insights and comparative analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analysis Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced AI analysis and comparison features will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}