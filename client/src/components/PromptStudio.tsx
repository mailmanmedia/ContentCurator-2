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
  CheckCircle,
  FileText,
  Presentation,
  Save,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PresentationViewer from "./PresentationViewer";
import type { PresentationStyle, Report } from "@shared/schema";

interface PromptData {
  text: string;
  images: string[];
  stats: string[];
  ideas: string[];
  outputType: string;
  style: string;
  priority: 'low' | 'medium' | 'high';
  // Professional editorial brief fields
  opponent?: string;
  competition?: string;
  venue?: 'home' | 'away' | 'neutral';
  matchTiming?: string[];  // Changed to array for multiple selection
  hookFormula?: string;
  targetAudience?: string[];  // Changed to array for multiple selection
  contentGoal?: string[];  // Changed to array for multiple selection
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

interface PresentationState {
  selectedReportId: string | null;
  selectedStyle: string;
  isCreating: boolean;
}

export default function PromptStudio() {
  const [promptData, setPromptData] = useState<PromptData>({
    text: "",
    images: [],
    stats: [],
    ideas: [],
    outputType: "",
    style: "",
    priority: "medium",
    opponent: "",
    competition: "",
    venue: undefined,
    matchTiming: [],
    hookFormula: "",
    targetAudience: [],
    contentGoal: []
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputVariations, setOutputVariations] = useState<OutputVariation[]>([]);
  const [activeTab, setActiveTab] = useState("input");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [presentationState, setPresentationState] = useState<PresentationState>({
    selectedReportId: null,
    selectedStyle: "claudeArtifact",
    isCreating: false
  });
  const [buildingVariation, setBuildingVariation] = useState<OutputVariation | null>(null);
  const { toast } = useToast();

  // Fetch available presentation styles
  const { data: stylesData } = useQuery({
    queryKey: ['/api/presentation/styles'],
    select: (response: any) => response.styles as PresentationStyle[]
  });

  // Fetch existing reports
  const { data: reportsData } = useQuery({
    queryKey: ['/api/reports'],
    select: (response: any) => response.reports as Report[]
  });

  // Fetch teams for selected competition
  const competitionId = promptData.competition === "Premier League" ? 39 
    : promptData.competition === "Champions League" ? 2
    : promptData.competition === "Europa League" ? 3
    : promptData.competition === "FA Cup" ? 45
    : promptData.competition === "Carabao Cup" ? 48
    : null;

  const { data: teamsData } = useQuery({
    queryKey: ['/api/football/competitions', competitionId, 'teams'],
    enabled: !!competitionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (response: any) => response.teams || []
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (reportData: { title: string; bodyJson: any; contextJson?: any }) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });
      if (!response.ok) {
        throw new Error('Failed to create report');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setPresentationState(prev => ({ ...prev, selectedReportId: data.report.id }));
      setActiveTab("presentations");
      toast({
        title: "Report Created",
        description: "Your content has been saved as a report and is ready for presentation"
      });
    }
  });

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

  // Options for dropdown fields
  const targetAudienceOptions = [
    "Casual fans",
    "Tactical enthusiasts", 
    "Liverpool FC supporters",
    "General football fans",
    "New viewers",
    "Fantasy football players",
    "Data analysts",
    "Young fans",
    "International audience"
  ];

  const contentGoalOptions = [
    "Drive engagement",
    "Increase watch time",
    "Build subscriber base",
    "Educate viewers",
    "Entertain audience",
    "Generate discussion",
    "Provide analysis",
    "Create viral content",
    "Support team narrative",
    "Challenge opinions"
  ];

  const metricsOptions = [
    // Attacking Metrics
    "Goals",
    "Assists",
    "Shots",
    "Shots on Target",
    "xG (Expected Goals)",
    "xA (Expected Assists)",
    "Conversion Rate",
    "Big Chances Created",
    "Big Chances Missed",
    "Goals per 90",
    // Passing Metrics
    "Pass Completion %",
    "Progressive Passes",
    "Key Passes",
    "Crosses",
    "Long Balls",
    "Through Balls",
    "Passes into Final Third",
    "Passes into Penalty Area",
    // Defensive Metrics
    "Tackles",
    "Interceptions",
    "Clearances",
    "Blocks",
    "Clean Sheets",
    "Goals Conceded",
    "Tackles Won %",
    "Aerial Duels Won",
    "Defensive Actions",
    // Physical Metrics
    "Distance Covered (km)",
    "Sprints",
    "Top Speed (km/h)",
    "Pressing Actions",
    "Duels Won",
    "Duels Won %",
    "Ground Duels Won",
    "Recovery Runs",
    // Team/Possession Metrics
    "Possession %",
    "Pass Accuracy %",
    "xG For",
    "xG Against",
    "PPDA (Passes Allowed Per Defensive Action)",
    "Pressing Success Rate",
    "Counter-Pressing Recoveries",
    "High Turnovers",
    "Touches in Opposition Box",
    "Final Third Entries",
    // Advanced Metrics
    "xGBuildup",
    "xGChain",
    "Progressive Carries",
    "Shot-Creating Actions",
    "Goal-Creating Actions",
    "Successful Take-Ons",
    "Carries into Penalty Area",
    "Progressive Passing Distance"
  ];

  const matchTimingOptions = [
    "Pre-match",
    "Live match",
    "Post-match",
    "Week buildup",
    "Transfer window",
    "International break",
    "Season review",
    "Historical analysis"
  ];

  // Comprehensive template system for professional content creation
  const getTemplatePrompts = (outputType: string, style: string) => {
    const templates: { [key: string]: { [key: string]: string[] } } = {
      "infographic": {
        "Mailman Monday - Contrarian": [
          "Challenge the popular opinion about Liverpool's transfer strategy with data-backed analysis",
          "Compare Arne Slot's unconventional tactics against traditional Liverpool approaches",
          "Analyze why Liverpool's 'controversial' decisions actually make sense using performance metrics"
        ],
        "Data Dive Wednesday - Analytical": [
          "Break down Liverpool's defensive statistics compared to Premier League averages with key metrics",
          "Analyze player performance data across different match situations and opponents",
          "Compare Liverpool's pressing intensity data with top European clubs using heat maps"
        ],
        "Future Focus Friday - Predictive": [
          "Project Liverpool's title chances based on current form, fixtures, and historical data",
          "Predict which academy players will break into the first team using development metrics",
          "Forecast how Arne Slot's tactical system will evolve over the next two seasons"
        ],
        "Breaking News - Urgent": [
          "Create urgent infographic about Liverpool's latest transfer with fee breakdown and impact analysis",
          "Design breaking injury update showing player importance and replacement options",
          "Visualize match-changing moment with tactical implications and statistical context"
        ],
        "Match Preview - Tactical": [
          "Design tactical infographic showing formation matchup and key battle zones",
          "Create pre-match statistical comparison with tactical context and player roles",
          "Build comprehensive match preview with opposition analysis and Liverpool advantages"
        ],
        "Player Spotlight - Personal": [
          "Create player career journey infographic with key achievements and statistics",
          "Design personal story infographic combining background, milestones, and impact data",
          "Build player comparison infographic highlighting unique contributions and development"
        ]
      },
      "thumbnail": {
        "Breaking News - Urgent": [
          "Create breaking news thumbnail for Liverpool transfer announcement with dramatic text overlay",
          "Design urgent match reaction thumbnail with score, key moment, and emotional hook",
          "Make breaking analysis thumbnail about controversial VAR decision with visual elements"
        ],
        "Match Preview - Tactical": [
          "Design tactical preview thumbnail showing Liverpool's expected formation vs specific opponent",
          "Create player duel thumbnail highlighting key individual battles and matchups",
          "Show managerial tactical comparison with formation graphics and key strategies"
        ],
        "Player Spotlight - Personal": [
          "Design player feature thumbnail with action shot and key statistics overlay",
          "Create personal story thumbnail combining portrait and career milestone graphics",
          "Show player development journey with before/after comparison and achievement highlights"
        ]
      },
      "title": {
        "Mailman Monday - Contrarian": [
          "Craft contrarian title challenging popular Liverpool narrative with surprising angle",
          "Create provocative headline questioning conventional wisdom about recent Liverpool decision",
          "Write debate-starting title presenting unpopular but data-supported Liverpool opinion"
        ],
        "Data Dive Wednesday - Analytical": [
          "Create analytical title focusing on specific Liverpool performance metric or trend",
          "Write data-driven headline comparing Liverpool statistics to Premier League standards",
          "Craft investigative title exploring hidden patterns in Liverpool's tactical approach"
        ],
        "Future Focus Friday - Predictive": [
          "Write predictive title forecasting Liverpool's prospects for upcoming fixtures",
          "Create forward-looking headline about emerging Liverpool talent or tactical evolution",
          "Craft speculative title exploring potential Liverpool scenarios and their implications"
        ],
        "Breaking News - Urgent": [
          "Create urgent title announcing Liverpool breaking news with immediate impact angle",
          "Write breaking headline about Liverpool development with dramatic but accurate tone",
          "Craft urgent title focusing on Liverpool news implications and fan reactions"
        ],
        "Match Preview - Tactical": [
          "Write tactical preview title highlighting key battles and strategic elements",
          "Create preview headline focusing on formation matchup and tactical intrigue",
          "Craft match buildup title emphasizing tactical storylines and player matchups"
        ],
        "Player Spotlight - Personal": [
          "Write compelling player feature title highlighting personal journey and achievements",
          "Create character-driven headline exploring player's impact beyond statistics",
          "Craft personal story title connecting player background to current Liverpool success"
        ]
      },
      "chart": {
        "Data Dive Wednesday - Analytical": [
          "Create comprehensive chart comparing Liverpool's key performance indicators across seasons",
          "Design statistical comparison showing Liverpool vs top-6 rivals in specific metrics",
          "Build tactical effectiveness chart measuring formation success rates in different scenarios"
        ],
        "Match Preview - Tactical": [
          "Design opponent comparison chart highlighting tactical strengths and weaknesses",
          "Create head-to-head statistics chart for upcoming fixture with historical context",
          "Build player performance chart comparing key performers from both teams"
        ],
        "Breaking News - Urgent": [
          "Create immediate impact chart showing breaking news statistical implications",
          "Design urgent comparison chart highlighting sudden change in team dynamics",
          "Build breaking analysis chart showing before/after statistical comparison"
        ],
        "Player Spotlight - Personal": [
          "Design career progression chart showing player development and key milestones",
          "Create performance evolution chart tracking player improvement across seasons",
          "Build achievement comparison chart highlighting player accomplishments and records"
        ]
      },
      "heatmap": {
        "Data Dive Wednesday - Analytical": [
          "Create player positioning heatmap showing movement patterns during specific match phases",
          "Design tactical heatmap comparing Liverpool's formation density in attack vs defense",
          "Build performance heatmap showing player effectiveness across different pitch zones"
        ],
        "Match Preview - Tactical": [
          "Generate opponent threat analysis heatmap for defensive preparation",
          "Create attacking zones heatmap showing Liverpool's goal-scoring patterns",
          "Design pressing intensity heatmap comparing home vs away performances"
        ],
        "Breaking News - Urgent": [
          "Create urgent heatmap showing immediate impact of breaking team news on positioning",
          "Design breaking analysis heatmap highlighting sudden tactical changes or player movements",
          "Build immediate effect heatmap showing how breaking news affects team dynamics"
        ],
        "Player Spotlight - Personal": [
          "Design player influence heatmap showing impact across different pitch zones",
          "Create performance heatmap tracking player effectiveness in various positions",
          "Build contribution heatmap highlighting player's unique tactical role and positioning"
        ]
      },
      "formation": {
        "Match Preview - Tactical": [
          "Analyze Liverpool's formation setup to counter specific opponent tactical approach",
          "Compare formation options Slot might deploy based on opponent weaknesses",
          "Show tactical flexibility between Liverpool's 4-3-3 and 4-2-3-1 with player roles"
        ],
        "Data Dive Wednesday - Analytical": [
          "Break down positional heat maps and player movement patterns within formation structure",
          "Analyze formation effectiveness across different game states and score situations",
          "Compare formation success rates in home vs away matches with statistical backing"
        ],
        "Breaking News - Urgent": [
          "Analyze immediate formation impact of breaking team news or injury updates",
          "Show urgent formation adjustments needed due to unexpected player availability",
          "Compare formation options in light of breaking tactical developments"
        ],
        "Mailman Monday - Contrarian": [
          "Challenge popular formation opinions with alternative tactical setups and reasoning",
          "Present contrarian view on Liverpool's formation choices with tactical justification",
          "Analyze unconventional formation benefits that contradict mainstream tactical opinion"
        ],
        "Future Focus Friday - Predictive": [
          "Predict formation evolution under Arne Slot's tactical philosophy and system development",
          "Forecast tactical adaptations Liverpool might make for upcoming fixture challenges",
          "Project formation flexibility options for different competitions and opponent types"
        ],
        "Player Spotlight - Personal": [
          "Analyze how specific player's attributes influence Liverpool's formation and tactical approach",
          "Show formation adaptations built around featured player's strengths and positioning",
          "Examine tactical role evolution and formation impact of spotlighted player"
        ]
      },
      "tactical": {
        "Match Preview - Tactical": [
          "Design tactical map showing Liverpool's attacking patterns against specific defensive setup",
          "Create defensive shape analysis with pressing triggers and coverage responsibilities",
          "Map out set-piece tactical approach highlighting Liverpool's strengths and opponent vulnerabilities"
        ],
        "Breaking News - Urgent": [
          "Create urgent tactical analysis map explaining immediate impact of player change or injury",
          "Design tactical breakdown of match-changing substitution or formation switch",
          "Map out tactical implications of breaking team news or lineup revelation"
        ],
        "Mailman Monday - Contrarian": [
          "Create tactical map challenging conventional wisdom about Liverpool's approach",
          "Design contrarian tactical analysis questioning popular formation opinions",
          "Map out unconventional tactical advantages that others might miss"
        ],
        "Data Dive Wednesday - Analytical": [
          "Design comprehensive tactical analysis map with statistical backing and zone effectiveness",
          "Create detailed tactical breakdown showing data-driven insights and performance metrics",
          "Map out tactical patterns with analytical depth and measurable outcomes"
        ],
        "Future Focus Friday - Predictive": [
          "Create predictive tactical map showing evolution of Liverpool's system under Slot",
          "Design forward-looking tactical analysis predicting formation adaptations",
          "Map out potential tactical developments and their strategic implications"
        ],
        "Player Spotlight - Personal": [
          "Design tactical map highlighting individual player's unique role and contributions",
          "Create player-focused tactical analysis showing positional impact and movement patterns",
          "Map out personal tactical story showing player development and tactical intelligence"
        ]
      }
    };

    return templates[outputType]?.[style] || [];
  };

  // Domain-aware professional content improvement engine
  const getSmartSuggestions = (text: string, outputType: string, style: string, data?: PromptData) => {
    const suggestions: string[] = [];
    
    // Domain knowledge rules for Liverpool FC content
    const isMatchContent = text.includes("match") || text.includes("game") || text.includes("fixture");
    const isPlayerContent = text.includes("player") || text.includes("performance") || text.includes("stats");
    const hasTacticalTerms = text.includes("formation") || text.includes("tactical") || text.includes("pressing");
    
    // Output-specific professional guidance
    if (outputType === "infographic") {
      if (!text.includes("statistic") && !text.includes("data") && !text.includes("metric")) {
        suggestions.push("Include specific Liverpool statistics, performance data, or comparative metrics");
      }
      if (style.includes("Analytical") && !text.includes("source") && !text.includes("comparison")) {
        suggestions.push("Reference data sources and provide comparative analysis against benchmarks");
      }
    }
    
    if (outputType === "thumbnail") {
      if (!text.includes("visual") && !text.includes("text overlay") && !text.includes("composition")) {
        suggestions.push("Describe visual composition, text overlay placement, and graphic elements");
      }
      if (style.includes("Breaking News") && !text.includes("dramatic") && !text.includes("urgent")) {
        suggestions.push("Emphasize dramatic visual elements and urgent design cues for breaking news");
      }
    }
    
    if (outputType === "title") {
      if (style.includes("Contrarian") && !text.includes("challenge") && !text.includes("controversial")) {
        suggestions.push("Include contrarian angle that challenges popular Liverpool narratives");
      }
      if (!text.includes("hook") && !text.includes("click") && !text.includes("compelling")) {
        suggestions.push("Add compelling hook or attention-grabbing element for better engagement");
      }
    }
    
    if (outputType === "formation" || outputType === "tactical") {
      if (!text.includes("player") && !text.includes("position") && !text.includes("role")) {
        suggestions.push("Specify player names, positions, and tactical roles for accuracy");
      }
      if (!text.includes("opponent") && data?.opponent) {
        suggestions.push(`Include ${data.opponent} tactical setup and defensive/offensive patterns`);
      }
    }
    
    // Editorial brief validation
    if (isMatchContent && data?.opponent === "") {
      suggestions.push("Specify opponent name for more targeted match-specific content");
    }
    
    if (isMatchContent && data?.competition === "") {
      suggestions.push("Add competition context (Premier League, Champions League, FA Cup, Carabao Cup)");
    }
    
    if (isMatchContent && data?.venue === undefined) {
      suggestions.push("Specify venue (home/away) for location-specific tactical analysis");
    }
    
    // Style-specific professional guidance
    if (style === "Breaking News - Urgent") {
      if (!text.includes("immediate") && !text.includes("just") && !text.includes("breaking")) {
        suggestions.push("Emphasize immediacy and breaking nature with time-sensitive language");
      }
    }
    
    if (style === "Data Dive Wednesday - Analytical") {
      if (!text.includes("metric") && !text.includes("statistical") && !text.includes("analysis")) {
        suggestions.push("Include specific analytical focus with measurable metrics and statistical depth");
      }
    }
    
    if (style === "Match Preview - Tactical") {
      if (!text.includes("formation") && !text.includes("tactical") && !text.includes("system")) {
        suggestions.push("Add tactical system analysis and formation matchup considerations");
      }
    }
    
    if (style === "Player Spotlight - Personal") {
      if (!text.includes("journey") && !text.includes("story") && !text.includes("background")) {
        suggestions.push("Include personal story elements and player development journey");
      }
    }
    
    // Liverpool FC brand and context rules
    if (!text.includes("Liverpool") && !text.includes("LFC") && !text.includes("Reds") && !text.includes("Anfield")) {
      suggestions.push("Add Liverpool FC brand context (LFC, Reds, Anfield) for channel alignment");
    }
    
    // Competition-specific context rules
    if (isMatchContent) {
      const competitions = ["Premier League", "Champions League", "Europa League", "FA Cup", "Carabao Cup"];
      const hasCompetition = competitions.some(comp => text.includes(comp));
      if (!hasCompetition && data?.competition === "") {
        suggestions.push("Specify competition for proper context and tactical importance");
      }
    }
    
    // Tactical content rules for Liverpool-specific analysis
    if (hasTacticalTerms) {
      if (!text.includes("Slot") && !text.includes("system") && !text.includes("philosophy")) {
        suggestions.push("Reference Arne Slot's tactical philosophy and system implementation");
      }
      if (!text.includes("press") && !text.includes("intensity") && text.includes("tactical")) {
        suggestions.push("Consider Liverpool's signature pressing intensity and high-line tactics");
      }
    }
    
    // Content depth and engagement rules
    if (text.length < 40) {
      suggestions.push("Expand prompt with more specific details for higher-quality AI generation");
    }
    
    if (text.length > 200 && !text.includes("specific") && !text.includes("focus")) {
      suggestions.push("Consider focusing on specific aspects to avoid overwhelming the AI prompt");
    }
    
    // Audience and platform optimization
    if ((!data?.targetAudience || data.targetAudience.length === 0) && (style.includes("Personal") || outputType === "title")) {
      suggestions.push("Define target audience (casual fans, tactical enthusiasts, general viewers)");
    }
    
    return suggestions;
  };

  const handleInputChange = (field: keyof PromptData, value: any) => {
    setPromptData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function for multi-select fields
  const handleMultiSelectChange = (field: 'targetAudience' | 'contentGoal' | 'matchTiming', value: string) => {
    setPromptData(prev => {
      const currentValues = prev[field] || [];
      const isSelected = currentValues.includes(value);
      
      return {
        ...prev,
        [field]: isSelected 
          ? currentValues.filter(item => item !== value)
          : [...currentValues, value]
      };
    });
  };

  const removeMultiSelectItem = (field: 'targetAudience' | 'contentGoal' | 'matchTiming', value: string) => {
    setPromptData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(item => item !== value)
    }));
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
      // Enhanced prompt context based on selected output type and style
      const enhancedContext = {
        prompt: promptData.text,
        context: "Liverpool FC YouTube content",
        outputType: promptData.outputType,
        style: promptData.style,
        priority: promptData.priority,
        existingData: {
          images: promptData.images,
          stats: promptData.stats,
          ideas: promptData.ideas
        }
      };

      const response = await apiRequest(
        'POST',
        '/api/ai/suggestions',
        enhancedContext
      );
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast({
        title: "Enhanced Suggestions Generated",
        description: `Found ${data.suggestions?.length || 0} contextual AI suggestions for ${promptData.outputType || 'your content'}`
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
      console.log('Clicked Build Final for variation', variationId.replace(/^var-/, ''));
      setBuildingVariation(variation);
      setActiveTab("presentations");
      toast({
        title: "Building Final Product",
        description: `Opening build workspace for ${variation.type}`
      });
    }
  };

  // Handler functions for presentation functionality
  const handleCreatePresentation = (variation: OutputVariation) => {
    const reportData = {
      title: variation.title,
      bodyJson: {
        content: variation.description,
        type: variation.type,
        confidence: variation.confidence
      },
      contextJson: {
        sourceType: 'variation',
        variationId: variation.id
      }
    };
    
    createReportMutation.mutate(reportData);
  };

  const handleCreatePresentationFromPrompt = () => {
    const titleInput = document.getElementById('report-title') as HTMLInputElement;
    const title = titleInput?.value || `Report - ${new Date().toLocaleDateString()}`;
    
    const reportData = {
      title,
      bodyJson: {
        content: promptData.text,
        images: promptData.images,
        stats: promptData.stats,
        ideas: promptData.ideas,
        outputType: promptData.outputType,
        style: promptData.style,
        priority: promptData.priority
      },
      contextJson: {
        sourceType: 'prompt',
        ...promptData
      }
    };
    
    createReportMutation.mutate(reportData);
  };

  const handleSelectExistingReport = (reportId: string) => {
    setPresentationState(prev => ({ ...prev, selectedReportId: reportId }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="font-league-spartan font-bold text-lg sm:text-xl uppercase tracking-wide text-card-foreground flex items-center gap-2">
            <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">AI Content Studio</span>
            <span className="sm:hidden">Content Studio</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="input" data-testid="tab-prompt-input" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Input & Prompt</span>
                <span className="sm:hidden">Input</span>
              </TabsTrigger>
              <TabsTrigger value="output" data-testid="tab-output-variations" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Variations & Output</span>
                <span className="sm:hidden">Output</span>
              </TabsTrigger>
              <TabsTrigger value="presentations" data-testid="tab-presentations" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Presentations</span>
                <span className="sm:hidden">Present</span>
              </TabsTrigger>
            </TabsList>

            {/* Input Tab */}
            <TabsContent value="input" className="space-y-4 sm:space-y-6">
              {/* Main Prompt */}
              <div className="space-y-3">
                <label className="font-libre-franklin font-semibold text-xs sm:text-sm text-card-foreground">
                  Content Prompt
                </label>
                <Textarea
                  placeholder="Describe your Liverpool FC content idea..."
                  value={promptData.text}
                  onChange={(e) => handleInputChange('text', e.target.value)}
                  className="min-h-[100px] sm:min-h-[120px] font-libre-franklin text-sm"
                  data-testid="textarea-prompt"
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={generateSuggestions}
                    data-testid="button-generate-suggestions"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Get AI Suggestions</span>
                    <span className="sm:hidden">AI Suggestions</span>
                  </Button>
                  {suggestions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{suggestions.length} suggestions</Badge>
                  )}
                </div>
                
                {/* Smart Suggestions */}
                {promptData.text && promptData.outputType && (
                  <div className="space-y-2">
                    {getSmartSuggestions(promptData.text, promptData.outputType, promptData.style, promptData).map((suggestion, index) => (
                      <div key={index} className="text-xs text-muted-foreground bg-accent/10 rounded p-2 flex items-start gap-2">
                        <Lightbulb className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Template Prompts */}
              {promptData.outputType && promptData.style && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2 sm:pb-3">
                    <h4 className="font-league-spartan font-bold text-xs sm:text-sm uppercase text-primary flex items-center gap-2">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                      Template Ideas for {promptData.outputType}
                    </h4>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {getTemplatePrompts(promptData.outputType, promptData.style).map((template, index) => (
                      <div 
                        key={index}
                        className="p-2 sm:p-3 bg-card rounded border cursor-pointer hover-elevate touch-manipulation"
                        onClick={() => handleInputChange('text', template)}
                      >
                        <p className="font-libre-franklin text-xs sm:text-sm text-card-foreground">
                          {template}
                        </p>
                      </div>
                    ))}
                    {getTemplatePrompts(promptData.outputType, promptData.style).length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Template prompts will appear when you select both output type and content style.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Enhanced AI Suggestions */}
              {suggestions.length > 0 && (
                <Card className="bg-accent/5 border-accent/20">
                  <CardHeader className="pb-2 sm:pb-3">
                    <h4 className="font-league-spartan font-bold text-xs sm:text-sm uppercase text-accent flex items-center gap-2">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                      AI-Enhanced Suggestions
                    </h4>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-2 sm:p-3 bg-card rounded border cursor-pointer hover-elevate touch-manipulation"
                        onClick={() => handleInputChange('text', suggestion)}
                      >
                        <p className="font-libre-franklin text-xs sm:text-sm text-card-foreground">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Editorial Brief */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    Editorial Brief
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Professional content context and requirements</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Opponent */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Opponent</label>
                      <Select value={promptData.opponent || ""} onValueChange={(value) => handleInputChange("opponent", value)}>
                        <SelectTrigger className="w-full h-9" data-testid="select-opponent">
                          <SelectValue placeholder="Select opponent team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamsData && teamsData.length > 0 ? (
                            teamsData.map((team: any) => (
                              <SelectItem key={team.id} value={team.name}>
                                {team.name}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Manchester City">Manchester City</SelectItem>
                              <SelectItem value="Arsenal">Arsenal</SelectItem>
                              <SelectItem value="Chelsea">Chelsea</SelectItem>
                              <SelectItem value="Manchester United">Manchester United</SelectItem>
                              <SelectItem value="Tottenham">Tottenham</SelectItem>
                              <SelectItem value="Newcastle United">Newcastle United</SelectItem>
                              <SelectItem value="Brighton">Brighton</SelectItem>
                              <SelectItem value="Aston Villa">Aston Villa</SelectItem>
                              <SelectItem value="West Ham">West Ham</SelectItem>
                              <SelectItem value="Everton">Everton</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Competition */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Competition</label>
                      <Select value={promptData.competition || ""} onValueChange={(value) => handleInputChange("competition", value)}>
                        <SelectTrigger className="w-full h-9" data-testid="select-competition">
                          <SelectValue placeholder="Select competition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Premier League">Premier League</SelectItem>
                          <SelectItem value="Champions League">Champions League</SelectItem>
                          <SelectItem value="Europa League">Europa League</SelectItem>
                          <SelectItem value="FA Cup">FA Cup</SelectItem>
                          <SelectItem value="Carabao Cup">Carabao Cup</SelectItem>
                          <SelectItem value="International">International</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Venue */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Venue</label>
                      <Select value={promptData.venue || ""} onValueChange={(value) => handleInputChange("venue", value as "home" | "away" | "neutral")}>
                        <SelectTrigger className="w-full h-9" data-testid="select-venue">
                          <SelectValue placeholder="Select venue" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Home (Anfield)</SelectItem>
                          <SelectItem value="away">Away</SelectItem>
                          <SelectItem value="neutral">Neutral Venue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Target Audience - Multi-select */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Target Audience</label>
                      <Select onValueChange={(value) => handleMultiSelectChange("targetAudience", value)}>
                        <SelectTrigger className="w-full h-9" data-testid="select-target-audience">
                          <SelectValue placeholder="Select target audiences" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetAudienceOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {promptData.targetAudience && promptData.targetAudience.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {promptData.targetAudience.map((audience) => (
                            <Badge 
                              key={audience}
                              variant="secondary" 
                              className="cursor-pointer text-xs"
                              onClick={() => removeMultiSelectItem("targetAudience", audience)}
                            >
                              {audience} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Content Goal - Multi-select */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Content Goal</label>
                      <Select onValueChange={(value) => handleMultiSelectChange("contentGoal", value)}>
                        <SelectTrigger className="w-full h-9" data-testid="select-content-goal">
                          <SelectValue placeholder="Select content goals" />
                        </SelectTrigger>
                        <SelectContent>
                          {contentGoalOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {promptData.contentGoal && promptData.contentGoal.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {promptData.contentGoal.map((goal) => (
                            <Badge 
                              key={goal}
                              variant="secondary" 
                              className="cursor-pointer text-xs"
                              onClick={() => removeMultiSelectItem("contentGoal", goal)}
                            >
                              {goal} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Match Timing - Multi-select */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Match Timing</label>
                      <Select onValueChange={(value) => handleMultiSelectChange("matchTiming", value)}>
                        <SelectTrigger className="w-full h-9" data-testid="select-match-timing">
                          <SelectValue placeholder="Select match timing" />
                        </SelectTrigger>
                        <SelectContent>
                          {matchTimingOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {promptData.matchTiming && promptData.matchTiming.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {promptData.matchTiming.map((timing) => (
                            <Badge 
                              key={timing}
                              variant="secondary" 
                              className="cursor-pointer text-xs"
                              onClick={() => removeMultiSelectItem("matchTiming", timing)}
                            >
                              {timing} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Images */}
                <div className="space-y-3">
                  <label className="font-libre-franklin font-semibold text-xs sm:text-sm text-card-foreground flex items-center gap-2">
                    <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Images & Media</span>
                    <span className="sm:hidden">Images</span>
                  </label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Image description..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList('images', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      data-testid="input-images"
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Upload
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Find Online</span>
                        <span className="sm:hidden">Find</span>
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {promptData.images.map((image, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="cursor-pointer mr-1 mb-1 text-xs"
                          onClick={() => removeFromList('images', index)}
                        >
                          {image.length > 20 ? `${image.substring(0, 20)}...` : image} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <label className="font-libre-franklin font-semibold text-xs sm:text-sm text-card-foreground flex items-center gap-2">
                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Statistics & Data</span>
                    <span className="sm:hidden">Stats</span>
                  </label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add stat or data..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList('stats', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      data-testid="input-stats"
                      className="text-sm"
                    />
                    <div className="space-y-1">
                      {promptData.stats.map((stat, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="cursor-pointer mr-1 mb-1 text-xs"
                          onClick={() => removeFromList('stats', index)}
                        >
                          {stat.length > 20 ? `${stat.substring(0, 20)}...` : stat} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ideas */}
                <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                  <label className="font-libre-franklin font-semibold text-xs sm:text-sm text-card-foreground flex items-center gap-2">
                    <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Ideas & Concepts</span>
                    <span className="sm:hidden">Ideas</span>
                  </label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add creative idea..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList('ideas', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      data-testid="input-ideas"
                      className="text-sm"
                    />
                    <div className="space-y-1">
                      {promptData.ideas.map((idea, index) => (
                        <Badge 
                          key={index}
                          variant="default" 
                          className="cursor-pointer mr-1 mb-1 text-xs"
                          onClick={() => removeFromList('ideas', index)}
                        >
                          {idea.length > 20 ? `${idea.substring(0, 20)}...` : idea} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Output Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="font-libre-franklin font-semibold text-xs sm:text-sm text-card-foreground">
                    Output Type
                  </label>
                  <Select value={promptData.outputType} onValueChange={(value) => handleInputChange('outputType', value)}>
                    <SelectTrigger data-testid="select-output-type" className="text-sm">
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
                  <label className="font-libre-franklin font-semibold text-xs sm:text-sm text-card-foreground">
                    Content Style
                  </label>
                  <Select value={promptData.style} onValueChange={(value) => handleInputChange('style', value)}>
                    <SelectTrigger data-testid="select-style" className="text-sm">
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

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <label className="font-libre-franklin font-semibold text-xs sm:text-sm text-card-foreground">
                    Priority Level
                  </label>
                  <Select value={promptData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('priority', value)}>
                    <SelectTrigger data-testid="select-priority" className="text-sm">
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
                  className="font-league-spartan font-bold uppercase tracking-wide w-full sm:w-auto"
                  data-testid="button-generate-variations"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Variations'}
                </Button>
              </div>
            </TabsContent>

            {/* Output Tab */}
            <TabsContent value="output" className="space-y-4 sm:space-y-6">
              {isGenerating ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="font-league-spartan font-bold text-base sm:text-lg uppercase text-foreground mb-2">
                    Generating Variations
                  </h3>
                  <p className="font-libre-franklin text-sm sm:text-base text-muted-foreground">
                    AI is creating multiple options for your content...
                  </p>
                </div>
              ) : outputVariations.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h3 className="font-league-spartan font-bold text-base sm:text-lg uppercase text-foreground">
                      Generated Variations
                    </h3>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {outputVariations.length} Options
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {outputVariations.map((variation) => (
                      <Card key={variation.id} className="hover-elevate bg-card border-card-border">
                        <CardHeader className="pb-2 sm:pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {variation.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(variation.confidence)}% confidence
                            </Badge>
                          </div>
                          <CardTitle className="font-league-spartan font-bold text-sm sm:text-base text-card-foreground">
                            {variation.title}
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="space-y-3 sm:space-y-4">
                          <p className="font-libre-franklin text-xs sm:text-sm text-muted-foreground">
                            {variation.description}
                          </p>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditVariation(variation.id)}
                              data-testid={`button-edit-${variation.id}`}
                              className="w-full sm:w-auto text-xs"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Edit & Iterate</span>
                              <span className="sm:hidden">Edit</span>
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleBuildFinal(variation.id)}
                              data-testid={`button-build-${variation.id}`}
                              className="w-full sm:w-auto text-xs"
                            >
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Build Final</span>
                              <span className="sm:hidden">Build</span>
                            </Button>
                            <Button 
                              size="sm"
                              variant="secondary"
                              onClick={() => handleCreatePresentation(variation)}
                              data-testid={`button-present-${variation.id}`}
                              className="w-full sm:w-auto text-xs"
                            >
                              <Presentation className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Create Presentation</span>
                              <span className="sm:hidden">Present</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Eye className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-league-spartan font-bold text-base sm:text-lg uppercase text-foreground mb-2">
                    No Variations Yet
                  </h3>
                  <p className="font-libre-franklin text-sm sm:text-base text-muted-foreground">
                    Generate variations from the Input tab to see them here
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Presentations Tab */}
            <TabsContent value="presentations" className="space-y-4 sm:space-y-6">
              <div className="space-y-6">
                {/* Quick Create from Current Prompt */}
                {promptData.text && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="font-league-spartan font-bold text-lg text-primary flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        Create Presentation from Current Prompt
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Save your current prompt as a report and create an interactive presentation
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          placeholder="Report title..."
                          className="flex-1"
                          id="report-title"
                          data-testid="input-report-title"
                        />
                        <Select value={presentationState.selectedStyle} onValueChange={(value) => setPresentationState(prev => ({ ...prev, selectedStyle: value }))}>
                          <SelectTrigger className="w-full sm:w-48" data-testid="select-presentation-style-create">
                            <SelectValue placeholder="Presentation style" />
                          </SelectTrigger>
                          <SelectContent>
                            {stylesData?.map((style) => (
                              <SelectItem key={style.key} value={style.key}>
                                {style.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleCreatePresentationFromPrompt}
                          disabled={createReportMutation.isPending}
                          data-testid="button-create-presentation-from-prompt"
                          className="w-full sm:w-auto"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Create Presentation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Existing Reports */}
                {reportsData && reportsData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-league-spartan font-bold text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Existing Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {reportsData.slice(0, 5).map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{report.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                Created {new Date(report.createdAt).toLocaleDateString()} • Status: {report.status}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectExistingReport(report.id)}
                              data-testid={`button-select-report-${report.id}`}
                            >
                              <Presentation className="w-4 h-4 mr-2" />
                              View Presentation
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Presentation Viewer */}
                {presentationState.selectedReportId && (
                  <PresentationViewer 
                    reportId={presentationState.selectedReportId}
                    defaultStyle={presentationState.selectedStyle}
                    showControls={true}
                  />
                )}

                {/* Empty State */}
                {!presentationState.selectedReportId && (!reportsData || reportsData.length === 0) && (
                  <div className="text-center py-12">
                    <Presentation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-league-spartan font-bold text-lg uppercase text-foreground mb-2">
                      No Presentations Yet
                    </h3>
                    <p className="font-libre-franklin text-base text-muted-foreground mb-4">
                      Create your first presentation by saving content as a report
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add content in the Input tab, then create a presentation here
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}