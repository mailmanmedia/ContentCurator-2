import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Sparkles, Target, Calendar, Wand2, Image } from "lucide-react";
import Header from "./Header";
import SearchBar from "./SearchBar";
import TemplateCard from "./TemplateCard";
import DataChart from "./DataChart";
import ExportPanel from "./ExportPanel";
import PromptStudio from "./PromptStudio";
import ImageManager from "./ImageManager";
import TacticalAnalysis from "./TacticalAnalysis";

export default function VisualAssistant() {
  const [activeTab, setActiveTab] = useState("studio");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // todo: remove mock functionality
  const mockTemplates = [
    {
      title: "Contrarian Take",
      category: "Mailman Monday" as const,
      description: "Challenge conventional narratives with data-driven insights and bold predictions",
      thumbnail: "/placeholder.jpg",
      dimensions: "1920x1080",
      lastUsed: "2 days ago"
    },
    {
      title: "Squad Depth Analysis",
      category: "Data Dive Wednesday" as const,
      description: "Deep dive into tactical formations, rotation impact, and player statistics",
      thumbnail: "/placeholder.jpg",
      dimensions: "1280x720"
    },
    {
      title: "Transfer Window Prediction",
      category: "Future Focus Friday" as const,
      description: "Predictive analysis with confidence meters, risk factors, and transfer domino effects",
      thumbnail: "/placeholder.jpg",
      dimensions: "1920x1080",
      lastUsed: "1 week ago"
    },
    {
      title: "Fixture Congestion Impact",
      category: "Data Dive Wednesday" as const,
      description: "Analyze squad vulnerability during busy periods and rotation strategies",
      thumbnail: "/placeholder.jpg",
      dimensions: "1920x1080"
    },
    {
      title: "Player Integration Score",
      category: "Mailman Monday" as const,
      description: "Track new signings' adaptation and squad chemistry development",
      thumbnail: "/placeholder.jpg",
      dimensions: "1280x720",
      lastUsed: "3 days ago"
    },
    {
      title: "Tactical Shift Prediction",
      category: "Future Focus Friday" as const,
      description: "Forecast formation changes based on opponent analysis and injury reports",
      thumbnail: "/placeholder.jpg",
      dimensions: "1920x1080"
    }
  ];

  const mockChartData = {
    playerStats: [
      { label: 'Salah', value: 28, trend: 'up' as const },
      { label: 'Núñez', value: 18, trend: 'up' as const },
      { label: 'Gakpo', value: 14, trend: 'neutral' as const },
      { label: 'Jota', value: 12, trend: 'down' as const }
    ],
    squadMetrics: [
      { label: 'Squad Depth', value: 87 },
      { label: 'Injury Impact', value: 23 },
      { label: 'Form Rating', value: 92 }
    ],
    keyStats: [
      { label: 'Goals', value: 89, trend: 'up' as const },
      { label: 'Clean Sheets', value: 16, trend: 'up' as const },
      { label: 'Assists', value: 52, trend: 'neutral' as const },
      { label: 'Possession %', value: 68, trend: 'down' as const }
    ]
  };

  const searchFilters = [
    'Players', 'Matches', 'Statistics', 'Transfers', 'Injuries', 'Tactics',
    'Premier League', 'Champions League', 'Current Season', 'Historical Data'
  ];

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  const handleFilterChange = (filters: string[]) => {
    setSelectedFilters(filters);
    console.log('Active filters:', filters);
  };

  const handleCreateNew = () => {
    console.log('Create new visual');
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'templates': return <Calendar className="w-4 h-4" />;
      case 'analytics': return <Target className="w-4 h-4" />;
      case 'export': return <Sparkles className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-league-spartan font-black text-4xl uppercase tracking-wide text-foreground mb-2">
                Visual Content Studio
              </h1>
              <p className="font-libre-franklin text-lg text-muted-foreground">
                Create compelling YouTube visuals with Liverpool FC data and AI-powered insights
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handleCreateNew}
              data-testid="button-create-new"
              className="font-league-spartan font-bold uppercase tracking-wide"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New
            </Button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="font-mono font-bold text-2xl text-primary mb-1">47</div>
                <div className="font-libre-franklin text-sm text-muted-foreground uppercase tracking-wide">Visuals Created</div>
              </CardContent>
            </Card>
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="p-4 text-center">
                <div className="font-mono font-bold text-2xl text-accent mb-1">12</div>
                <div className="font-libre-franklin text-sm text-muted-foreground uppercase tracking-wide">Active Templates</div>
              </CardContent>
            </Card>
            <Card className="bg-chart-2/10 border-chart-2/20">
              <CardContent className="p-4 text-center">
                <div className="font-mono font-bold text-2xl text-chart-2 mb-1">94%</div>
                <div className="font-libre-franklin text-sm text-muted-foreground uppercase tracking-wide">Data Accuracy</div>
              </CardContent>
            </Card>
            <Card className="bg-chart-5/10 border-chart-5/20">
              <CardContent className="p-4 text-center">
                <div className="font-mono font-bold text-2xl text-chart-5 mb-1">Live</div>
                <div className="font-libre-franklin text-sm text-muted-foreground uppercase tracking-wide">Data Status</div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <SearchBar 
            filters={searchFilters}
            selectedFilters={selectedFilters}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card border-card-border">
            <TabsTrigger 
              value="studio" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2"
              data-testid="tab-studio"
            >
              <Wand2 className="w-4 h-4" />
              AI Studio
            </TabsTrigger>
            <TabsTrigger 
              value="images" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2"
              data-testid="tab-images"
            >
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger 
              value="tactical" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2"
              data-testid="tab-tactical"
            >
              <Target className="w-4 h-4" />
              Tactical
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2"
              data-testid="tab-templates"
            >
              {getTabIcon('templates')}
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2"
              data-testid="tab-analytics"
            >
              {getTabIcon('analytics')}
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2"
              data-testid="tab-export"
            >
              {getTabIcon('export')}
              Export
            </TabsTrigger>
          </TabsList>

          {/* AI Studio Tab */}
          <TabsContent value="studio" className="space-y-6">
            <PromptStudio />
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <ImageManager />
          </TabsContent>

          {/* Tactical Analysis Tab */}
          <TabsContent value="tactical" className="space-y-6">
            <TacticalAnalysis />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-league-spartan font-bold text-2xl uppercase tracking-wide text-foreground">
                Template Library
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">6 Templates</Badge>
                <Badge className="bg-primary text-primary-foreground">YouTube Optimized</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTemplates.map((template, index) => (
                <TemplateCard key={index} {...template} />
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="font-league-spartan font-bold text-2xl uppercase tracking-wide text-foreground mb-6">
              Liverpool FC Analytics
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DataChart 
                title="Top Scorers" 
                subtitle="Premier League 2024/25"
                data={mockChartData.playerStats}
                type="bar"
                color="primary"
              />
              <DataChart 
                title="Squad Health" 
                subtitle="Current season metrics"
                data={mockChartData.squadMetrics}
                type="progress"
                color="chart-2"
              />
            </div>
            
            <DataChart 
              title="Key Statistics" 
              subtitle="Season performance indicators"
              data={mockChartData.keyStats}
              type="stat"
              color="chart-3"
            />
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <h2 className="font-league-spartan font-bold text-2xl uppercase tracking-wide text-foreground mb-6">
              Export Studio
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ExportPanel />
              
              <Card className="bg-card border-card-border">
                <CardHeader>
                  <CardTitle className="font-league-spartan font-bold text-lg uppercase tracking-wide text-card-foreground">
                    Preview Canvas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gradient-to-br from-sidebar to-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="text-center z-10">
                      <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-primary-foreground font-league-spartan font-black text-2xl">M</span>
                      </div>
                      <h3 className="font-league-spartan font-bold text-xl uppercase tracking-wide text-white mb-2">
                        Mailman Media
                      </h3>
                      <p className="font-libre-franklin text-white/80">
                        Your visual will appear here
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="font-libre-franklin text-sm text-muted-foreground">
                      Select a template or create new content to preview
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}