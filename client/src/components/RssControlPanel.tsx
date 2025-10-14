import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit2, Trash2, Rss, Settings, RefreshCw, ExternalLink, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { formatDistanceToNow } from "date-fns";

interface TickerConfig {
  id: string;
  name: string;
  speed: number;
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  mode: 'loop' | 'bounce' | 'single';
  autoRefresh: boolean;
  refreshInterval: number;
  activeFeeds: string[];
  isActive: boolean;
}

interface RssSource {
  id: string;
  name: string;
  description: string;
  feedUrl: string;
  category: string;
  updateFrequency: number;
  isActive: boolean;
  isVerified: boolean;
  totalArticles: number;
  lastFetchedAt?: string;
  fetchErrors: number;
}

interface RssArticle {
  id: string;
  sourceId: string;
  title: string;
  description?: string;
  link: string;
  author?: string;
  publishedAt?: string;
  imageUrl?: string;
  sourceName?: string;
}

const tickerConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  speed: z.number().min(1).max(100),
  backgroundColor: z.string().default("#C8102E"),
  textColor: z.string().default("#FFFFFF"),
  fontSize: z.string().default("18px"),
  mode: z.enum(['loop', 'bounce', 'single']),
  autoRefresh: z.boolean().default(true),
  refreshInterval: z.number().min(1).default(5),
  activeFeeds: z.array(z.string()).default([]),
});

type TickerConfigFormData = z.infer<typeof tickerConfigSchema>;

const rssSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().default(""),
  feedUrl: z.string().url("Must be a valid URL").min(1, "Feed URL is required"),
  category: z.string().min(1, "Category is required"),
  updateFrequency: z.number().min(1).default(60),
  isActive: z.boolean().default(true),
});

type RssSourceFormData = z.infer<typeof rssSourceSchema>;

export default function RssControlPanel() {
  const [selectedSource, setSelectedSource] = useState<RssSource | null>(null);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [selectedArticleSource, setSelectedArticleSource] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: tickerConfigData, isLoading: isLoadingConfig } = useQuery<{ config: TickerConfig }>({
    queryKey: ['/api/rss/ticker-config'],
  });

  const { data: sourcesData, isLoading: isLoadingSources } = useQuery<{ sources: RssSource[] }>({
    queryKey: ['/api/rss/sources'],
  });

  const { data: articlesData, isLoading: isLoadingArticles } = useQuery<{ articles: RssArticle[] }>({
    queryKey: ['/api/rss/articles', selectedArticleSource],
  });

  const tickerConfig = tickerConfigData?.config;
  const sources = sourcesData?.sources || [];
  const articles = articlesData?.articles || [];

  const tickerForm = useForm<TickerConfigFormData>({
    resolver: zodResolver(tickerConfigSchema),
    defaultValues: {
      name: tickerConfig?.name || 'Main Ticker',
      speed: tickerConfig?.speed || 50,
      backgroundColor: tickerConfig?.backgroundColor || '#C8102E',
      textColor: tickerConfig?.textColor || '#FFFFFF',
      fontSize: tickerConfig?.fontSize || '18px',
      mode: tickerConfig?.mode || 'loop',
      autoRefresh: tickerConfig?.autoRefresh ?? true,
      refreshInterval: tickerConfig?.refreshInterval || 5,
      activeFeeds: tickerConfig?.activeFeeds || [],
    },
  });

  const sourceForm = useForm<RssSourceFormData>({
    resolver: zodResolver(rssSourceSchema),
    defaultValues: {
      name: '',
      description: '',
      feedUrl: '',
      category: 'official',
      updateFrequency: 60,
      isActive: true,
    },
  });

  const updateTickerConfigMutation = useMutation({
    mutationFn: async (data: TickerConfigFormData) => {
      const response = await apiRequest('PATCH', '/api/rss/ticker-config', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rss/ticker-config'] });
      toast({ title: 'Ticker configuration updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update ticker configuration', variant: 'destructive' });
    },
  });

  const createSourceMutation = useMutation({
    mutationFn: async (data: RssSourceFormData) => {
      const response = await apiRequest('POST', '/api/rss/sources', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rss/sources'] });
      toast({ title: 'RSS source created successfully' });
      setIsSourceDialogOpen(false);
      sourceForm.reset();
    },
    onError: () => {
      toast({ title: 'Failed to create RSS source', variant: 'destructive' });
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RssSourceFormData> }) => {
      const response = await apiRequest('PATCH', `/api/rss/sources/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rss/sources'] });
      toast({ title: 'RSS source updated successfully' });
      setIsSourceDialogOpen(false);
      setSelectedSource(null);
      sourceForm.reset();
    },
    onError: () => {
      toast({ title: 'Failed to update RSS source', variant: 'destructive' });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/rss/sources/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rss/sources'] });
      toast({ title: 'RSS source deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete RSS source', variant: 'destructive' });
    },
  });

  const toggleFeedInTickerMutation = useMutation({
    mutationFn: async ({ feedId, include }: { feedId: string; include: boolean }) => {
      const currentActiveFeeds = tickerForm.getValues('activeFeeds') || [];
      const newActiveFeeds = include
        ? [...currentActiveFeeds, feedId]
        : currentActiveFeeds.filter(id => id !== feedId);
      
      const response = await apiRequest('PATCH', '/api/rss/ticker-config', {
        activeFeeds: newActiveFeeds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rss/ticker-config'] });
      toast({ title: 'Ticker feeds updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update ticker feeds', variant: 'destructive' });
    },
  });

  const handleEditSource = (source: RssSource) => {
    setSelectedSource(source);
    sourceForm.reset({
      name: source.name,
      description: source.description,
      feedUrl: source.feedUrl,
      category: source.category,
      updateFrequency: source.updateFrequency,
      isActive: source.isActive,
    });
    setIsSourceDialogOpen(true);
  };

  const handleOpenNewDialog = () => {
    setSelectedSource(null);
    sourceForm.reset({
      name: '',
      description: '',
      feedUrl: '',
      category: 'official',
      updateFrequency: 60,
      isActive: true,
    });
    setIsSourceDialogOpen(true);
  };

  const onTickerSubmit = (data: TickerConfigFormData) => {
    updateTickerConfigMutation.mutate(data);
  };

  const onSourceSubmit = (data: RssSourceFormData) => {
    if (selectedSource) {
      updateSourceMutation.mutate({ id: selectedSource.id, data });
    } else {
      createSourceMutation.mutate(data);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'official':
        return 'bg-[#C8102E] text-white';
      case 'media':
        return 'bg-[#00B2A9] text-white';
      case 'fan_site':
        return 'bg-[#F6EB61] text-[#1B365D]';
      case 'podcast':
        return 'bg-[#1B365D] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticker Configuration Section */}
      <Card data-testid="card-ticker-config">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Ticker Configuration
              </CardTitle>
              <CardDescription>Configure RSS ticker display settings and behavior</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingConfig ? (
            <div className="text-muted-foreground" data-testid="text-loading-config">Loading configuration...</div>
          ) : (
            <Form {...tickerForm}>
              <form onSubmit={tickerForm.handleSubmit(onTickerSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={tickerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Configuration Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-ticker-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tickerForm.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticker Mode</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ticker-mode">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="loop">Loop</SelectItem>
                            <SelectItem value="bounce">Bounce</SelectItem>
                            <SelectItem value="single">Single Pass</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={tickerForm.control}
                  name="speed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speed: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={100}
                          step={1}
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          data-testid="slider-ticker-speed"
                        />
                      </FormControl>
                      <FormDescription>Adjust ticker scrolling speed</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={tickerForm.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" {...field} className="w-16 h-10 p-1" data-testid="input-ticker-bg-color" />
                            <Input {...field} data-testid="input-ticker-bg-color-hex" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tickerForm.control}
                    name="textColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" {...field} className="w-16 h-10 p-1" data-testid="input-ticker-text-color" />
                            <Input {...field} data-testid="input-ticker-text-color-hex" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tickerForm.control}
                    name="fontSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Size</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="18px" data-testid="input-ticker-font-size" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={tickerForm.control}
                    name="autoRefresh"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-4">
                        <div>
                          <FormLabel>Auto Refresh</FormLabel>
                          <FormDescription>Automatically refresh RSS feeds</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-ticker-auto-refresh"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tickerForm.control}
                    name="refreshInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refresh Interval (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-ticker-refresh-interval"
                          />
                        </FormControl>
                        <FormDescription>How often to check for new articles</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Live Preview */}
                <div className="rounded-md border p-4 space-y-2">
                  <Label>Live Preview</Label>
                  <div 
                    className="w-full overflow-hidden rounded"
                    style={{
                      backgroundColor: tickerForm.watch('backgroundColor'),
                      color: tickerForm.watch('textColor'),
                      fontSize: tickerForm.watch('fontSize'),
                      padding: '12px 16px',
                    }}
                    data-testid="preview-ticker"
                  >
                    <div className="whitespace-nowrap animate-marquee">
                      ⚽ Liverpool FC News • Latest updates from your RSS feeds • Ticker preview mode: {tickerForm.watch('mode')}
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updateTickerConfigMutation.isPending}
                  data-testid="button-save-ticker-config"
                >
                  {updateTickerConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* RSS Sources Section */}
      <Card data-testid="card-rss-sources">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rss className="w-5 h-5" />
                RSS Sources
              </CardTitle>
              <CardDescription>Manage RSS feed sources for the ticker</CardDescription>
            </div>
            <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenNewDialog} data-testid="button-add-source">
                  <Plus className="w-4 h-4 mr-2" />
                  Add RSS Source
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="dialog-rss-source">
                <DialogHeader>
                  <DialogTitle>
                    {selectedSource ? 'Edit RSS Source' : 'Add RSS Source'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...sourceForm}>
                  <form onSubmit={sourceForm.handleSubmit(onSourceSubmit)} className="space-y-4">
                    <FormField
                      control={sourceForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Liverpool FC Official" data-testid="input-source-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sourceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Official news from Liverpool FC" data-testid="textarea-source-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sourceForm.control}
                      name="feedUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feed URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://example.com/rss" data-testid="input-source-feed-url" />
                          </FormControl>
                          <FormDescription>Enter the full RSS feed URL</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sourceForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-source-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="official">Official</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="fan_site">Fan Site</SelectItem>
                                <SelectItem value="podcast">Podcast</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sourceForm.control}
                        name="updateFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Update Frequency (min)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-source-update-frequency"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={sourceForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border p-4">
                          <div>
                            <FormLabel>Active</FormLabel>
                            <FormDescription>Enable this RSS source</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-source-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createSourceMutation.isPending || updateSourceMutation.isPending}
                        data-testid="button-submit-source"
                      >
                        {createSourceMutation.isPending || updateSourceMutation.isPending 
                          ? 'Saving...' 
                          : selectedSource ? 'Update Source' : 'Create Source'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSources ? (
            <div className="text-muted-foreground" data-testid="text-loading-sources">Loading sources...</div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-sources">
              No RSS sources configured. Add your first source to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => {
                const isInTicker = tickerConfig?.activeFeeds?.includes(source.id);
                return (
                  <Card key={source.id} className="hover-elevate" data-testid={`card-source-${source.id}`}>
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">{source.name}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getCategoryBadgeColor(source.category)} data-testid={`badge-category-${source.id}`}>
                              {source.category}
                            </Badge>
                            <Badge variant={source.isActive ? "default" : "secondary"} data-testid={`badge-status-${source.id}`}>
                              {source.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {source.isVerified && (
                              <Badge variant="outline" className="text-xs" data-testid={`badge-verified-${source.id}`}>
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {source.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${source.id}`}>
                          {source.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Articles:</span>
                          <span className="font-medium" data-testid={`text-articles-${source.id}`}>{source.totalArticles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Update:</span>
                          <span className="text-xs" data-testid={`text-frequency-${source.id}`}>{source.updateFrequency}min</span>
                        </div>
                        {source.lastFetchedAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last fetched:</span>
                            <span className="text-xs" data-testid={`text-last-fetched-${source.id}`}>
                              {formatDistanceToNow(new Date(source.lastFetchedAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`ticker-${source.id}`}
                          checked={isInTicker}
                          onCheckedChange={(checked) => 
                            toggleFeedInTickerMutation.mutate({ feedId: source.id, include: !!checked })
                          }
                          data-testid={`checkbox-ticker-${source.id}`}
                        />
                        <label
                          htmlFor={`ticker-${source.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Include in ticker
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditSource(source)}
                          data-testid={`button-edit-${source.id}`}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (confirm(`Delete "${source.name}"?`)) {
                              deleteSourceMutation.mutate(source.id);
                            }
                          }}
                          data-testid={`button-delete-${source.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Articles Preview */}
      <Card data-testid="card-recent-articles">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Articles
              </CardTitle>
              <CardDescription>Latest articles from your RSS sources</CardDescription>
            </div>
            <Select value={selectedArticleSource || 'all'} onValueChange={(value) => setSelectedArticleSource(value === 'all' ? null : value)}>
              <SelectTrigger className="w-[200px]" data-testid="select-article-source">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingArticles ? (
            <div className="text-muted-foreground" data-testid="text-loading-articles">Loading articles...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-articles">
              No articles available yet.
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {articles.map((article) => (
                  <Card key={article.id} className="hover-elevate" data-testid={`card-article-${article.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        {article.imageUrl && (
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-20 h-20 object-cover rounded"
                            data-testid={`img-article-${article.id}`}
                          />
                        )}
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium line-clamp-2" data-testid={`text-title-${article.id}`}>
                            {article.title}
                          </h4>
                          {article.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-desc-${article.id}`}>
                              {article.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {article.sourceName && (
                              <span data-testid={`text-source-${article.id}`}>{article.sourceName}</span>
                            )}
                            {article.author && (
                              <span data-testid={`text-author-${article.id}`}>by {article.author}</span>
                            )}
                            {article.published_at && (
                              <span data-testid={`text-published-${article.id}`}>
                                {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#C8102E] hover:underline inline-flex items-center gap-1"
                            data-testid={`link-article-${article.id}`}
                          >
                            Read article <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
