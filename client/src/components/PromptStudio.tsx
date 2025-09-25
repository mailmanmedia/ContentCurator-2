import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Wand2, 
  Upload, 
  Search, 
  BarChart3, 
  Image, 
  Type, 
  Lightbulb,
  Zap,
  Target,
  Trophy,
  Users,
  TrendingUp,
  Eye,
  Edit,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PromptData {
  text: string;
  images: string[];
  stats: string[];
  ideas: string[];
  outputType: string;
  style: string;
  priority: 'low' | 'medium' | 'high';
}

interface OutputVariation {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'generating' | 'ready' | 'editing';
  thumbnail?: string;
  confidence: number;
}

export default function PromptStudio() {
  const [promptData, setPromptData] = useState<PromptData>({
    text: "",
    images: [],
    stats: [],
    ideas: [],
    outputType: "",
    style: "",
    priority: "medium"
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputVariations, setOutputVariations] = useState<OutputVariation[]>([]);
  const [activeTab, setActiveTab] = useState("input");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const outputTypes = [
    { value: "infographic", label: "Infographic", icon: BarChart3 },
    { value: "title", label: "Title Card", icon: Type },
    { value: "thumbnail", label: "YouTube Thumbnail", icon: Image },
    { value: "chart", label: "Data Chart", icon: TrendingUp },
    { value: "heatmap", label: "Performance Heatmap", icon: Target },
    { value: "formation", label: "Formation Analysis", icon: Users },
    { value: "tactical", label: "Tactical Map", icon: Trophy }
  ];

  const styleOptions = [
    "Mailman Monday - Contrarian",
    "Data Dive Wednesday - Analytical", 
    "Future Focus Friday - Predictive",
    "Breaking News - Urgent",
    "Match Preview - Tactical",
    "Player Spotlight - Personal"
  ];

  const handleInputChange = (field: keyof PromptData, value: any) => {
    setPromptData(prev => ({ ...prev, [field]: value }));
  };

  const addToList = (field: 'images' | 'stats' | 'ideas', value: string) => {
    if (value.trim()) {
      setPromptData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeFromList = (field: 'images' | 'stats' | 'ideas', index: number) => {
    setPromptData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const generateSuggestions = async () => {
    try {
      const response = await apiRequest(
        'POST',
        '/api/ai/suggestions',
        { 
          prompt: promptData.text,
          context: "Liverpool FC YouTube content"
        }
      );
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast({
        title: "Suggestions Generated",
        description: `Found ${data.suggestions?.length || 0} AI-powered suggestions`
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive"
      });
    }
  };

  const generateVariations = async () => {
    if (!promptData.text || !promptData.outputType) {
      toast({
        title: "Missing Information",
        description: "Please provide text content and select an output type",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setActiveTab("output");

    try {
      const response = await apiRequest(
        'POST',
        '/api/ai/generate-variations',
        promptData
      );

      const data = await response.json();
      const variations: OutputVariation[] = data.variations.map((v: any, index: number) => ({
        id: `var-${Date.now()}-${index}`,
        type: v.type,
        title: v.title,
        description: v.description,
        status: 'ready' as const,
        confidence: v.confidence || Math.random() * 30 + 70,
        thumbnail: v.thumbnail
      }));

      setOutputVariations(variations);
      
      toast({
        title: "Variations Generated",
        description: `Created ${variations.length} variations for your content`
      });
    } catch (error) {
      console.error('Error generating variations:', error);
      toast({
        title: "Error", 
        description: "Failed to generate variations",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditVariation = (variationId: string) => {
    setOutputVariations(prev => prev.map(v => 
      v.id === variationId ? { ...v, status: 'editing' as const } : v
    ));
    toast({
      title: "Edit Mode",
      description: "Variation ready for editing"
    });
  };

  const handleBuildFinal = (variationId: string) => {
    const variation = outputVariations.find(v => v.id === variationId);
    if (variation) {
      toast({
        title: "Building Final Product",
        description: `Creating production-ready ${variation.type}`
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="font-league-spartan font-bold text-xl uppercase tracking-wide text-card-foreground flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            AI Content Studio
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="input" data-testid="tab-prompt-input">
                Input & Prompt
              </TabsTrigger>
              <TabsTrigger value="output" data-testid="tab-output-variations">
                Variations & Output
              </TabsTrigger>
            </TabsList>

            {/* Input Tab */}
            <TabsContent value="input" className="space-y-6">
              {/* Main Prompt */}
              <div className="space-y-3">
                <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
                  Content Prompt
                </label>
                <Textarea
                  placeholder="Describe your Liverpool FC content idea. For example: 'Analyze Arne Slot's tactical impact on Liverpool's pressing game this season compared to Klopp's final year, focusing on defensive transitions and goal prevention statistics...'"
                  value={promptData.text}
                  onChange={(e) => handleInputChange('text', e.target.value)}
                  className="min-h-[120px] font-libre-franklin"
                  data-testid="textarea-prompt"
                />
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={generateSuggestions}
                    data-testid="button-generate-suggestions"
                  >
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Get AI Suggestions
                  </Button>
                  {suggestions.length > 0 && (
                    <Badge variant="secondary">{suggestions.length} suggestions</Badge>
                  )}
                </div>
              </div>

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <Card className="bg-accent/5 border-accent/20">
                  <CardHeader className="pb-3">
                    <h4 className="font-league-spartan font-bold text-sm uppercase text-accent">
                      AI Suggestions
                    </h4>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-card rounded border cursor-pointer hover-elevate"
                        onClick={() => handleInputChange('text', suggestion)}
                      >
                        <p className="font-libre-franklin text-sm text-card-foreground">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Content Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Images */}
                <div className="space-y-3">
                  <label className="font-libre-franklin font-semibold text-sm text-card-foreground flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Images & Media
                  </label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Image description or upload"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList('images', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      data-testid="input-images"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Upload className="w-4 h-4 mr-1" />
                        Upload
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Search className="w-4 h-4 mr-1" />
                        Find Online
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {promptData.images.map((image, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="cursor-pointer mr-1 mb-1"
                          onClick={() => removeFromList('images', index)}
                        >
                          {image} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <label className="font-libre-franklin font-semibold text-sm text-card-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Statistics & Data
                  </label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add stat or data point"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList('stats', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      data-testid="input-stats"
                    />
                    <div className="space-y-1">
                      {promptData.stats.map((stat, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="cursor-pointer mr-1 mb-1"
                          onClick={() => removeFromList('stats', index)}
                        >
                          {stat} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ideas */}
                <div className="space-y-3">
                  <label className="font-libre-franklin font-semibold text-sm text-card-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Ideas & Concepts
                  </label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add creative idea"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList('ideas', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      data-testid="input-ideas"
                    />
                    <div className="space-y-1">
                      {promptData.ideas.map((idea, index) => (
                        <Badge 
                          key={index}
                          variant="default" 
                          className="cursor-pointer mr-1 mb-1"
                          onClick={() => removeFromList('ideas', index)}
                        >
                          {idea} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Output Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
                    Output Type
                  </label>
                  <Select value={promptData.outputType} onValueChange={(value) => handleInputChange('outputType', value)}>
                    <SelectTrigger data-testid="select-output-type">
                      <SelectValue placeholder="Select output type" />
                    </SelectTrigger>
                    <SelectContent>
                      {outputTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
                    Content Style
                  </label>
                  <Select value={promptData.style} onValueChange={(value) => handleInputChange('style', value)}>
                    <SelectTrigger data-testid="select-style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
                    Priority Level
                  </label>
                  <Select value={promptData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('priority', value)}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={generateVariations}
                  disabled={isGenerating || !promptData.text || !promptData.outputType}
                  className="font-league-spartan font-bold uppercase tracking-wide"
                  data-testid="button-generate-variations"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Variations'}
                </Button>
              </div>
            </TabsContent>

            {/* Output Tab */}
            <TabsContent value="output" className="space-y-6">
              {isGenerating ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="font-league-spartan font-bold text-lg uppercase text-foreground mb-2">
                    Generating Variations
                  </h3>
                  <p className="font-libre-franklin text-muted-foreground">
                    AI is creating multiple options for your content...
                  </p>
                </div>
              ) : outputVariations.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-league-spartan font-bold text-lg uppercase text-foreground">
                      Generated Variations
                    </h3>
                    <Badge className="bg-primary text-primary-foreground">
                      {outputVariations.length} Options
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outputVariations.map((variation) => (
                      <Card key={variation.id} className="hover-elevate bg-card border-card-border">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {variation.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(variation.confidence)}% confidence
                            </Badge>
                          </div>
                          <CardTitle className="font-league-spartan font-bold text-sm text-card-foreground">
                            {variation.title}
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <p className="font-libre-franklin text-sm text-muted-foreground">
                            {variation.description}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditVariation(variation.id)}
                              data-testid={`button-edit-${variation.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit & Iterate
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleBuildFinal(variation.id)}
                              data-testid={`button-build-${variation.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Build Final
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-league-spartan font-bold text-lg uppercase text-foreground mb-2">
                    No Variations Yet
                  </h3>
                  <p className="font-libre-franklin text-muted-foreground">
                    Generate variations from the Input tab to see them here
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}