import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Image, Target, Calendar, BarChart3, Download } from "lucide-react";
import PromptStudio from "./PromptStudio";
import ImageManager from "./ImageManager";
import TacticalAnalysis from "./TacticalAnalysis";
import TemplateCard from "./TemplateCard";
import DataChart from "./DataChart";
import ExportPanel from "./ExportPanel";

interface ContentTabsProps {
  defaultTab?: string;
}

export default function ContentTabs({ defaultTab = "studio" }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

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

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'templates': return <Calendar className="w-4 h-4" />;
      case 'analytics': return <Target className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
      {/* Mobile: Scrollable horizontal tabs */}
      <div className="lg:hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="flex w-max min-w-full bg-card border-card-border">
            <TabsTrigger 
              value="studio" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2 text-xs px-3"
              data-testid="tab-studio"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">AI Studio</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger 
              value="images" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2 text-xs px-3"
              data-testid="tab-images"
            >
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger 
              value="tactical" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2 text-xs px-3"
              data-testid="tab-tactical"
            >
              <Target className="w-4 h-4" />
              Tactical
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2 text-xs px-3"
              data-testid="tab-templates"
            >
              {getTabIcon('templates')}
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Temps</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2 text-xs px-3"
              data-testid="tab-analytics"
            >
              {getTabIcon('analytics')}
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="font-league-spartan font-bold uppercase tracking-wide flex items-center gap-2 text-xs px-3"
              data-testid="tab-export"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Desktop: Standard tabs */}
      <div className="hidden lg:block">
        <TabsList className="bg-card border-card-border">
          <TabsTrigger 
            value="studio" 
            className="font-league-spartan font-bold uppercase tracking-wide"
            data-testid="tab-studio"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            AI Studio
          </TabsTrigger>
          <TabsTrigger 
            value="images" 
            className="font-league-spartan font-bold uppercase tracking-wide"
            data-testid="tab-images"
          >
            <Image className="w-4 h-4 mr-2" />
            Images
          </TabsTrigger>
          <TabsTrigger 
            value="tactical" 
            className="font-league-spartan font-bold uppercase tracking-wide"
            data-testid="tab-tactical"
          >
            <Target className="w-4 h-4 mr-2" />
            Tactical Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="templates" 
            className="font-league-spartan font-bold uppercase tracking-wide"
            data-testid="tab-templates"
          >
            {getTabIcon('templates')}
            <span className="ml-2">Templates</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="font-league-spartan font-bold uppercase tracking-wide"
            data-testid="tab-analytics"
          >
            {getTabIcon('analytics')}
            <span className="ml-2">Analytics</span>
          </TabsTrigger>
          <TabsTrigger 
            value="export" 
            className="font-league-spartan font-bold uppercase tracking-wide"
            data-testid="tab-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab Content */}
      <TabsContent value="studio" className="space-y-6">
        <PromptStudio />
      </TabsContent>

      <TabsContent value="images" className="space-y-6">
        <ImageManager />
      </TabsContent>

      <TabsContent value="tactical" className="space-y-6">
        <TacticalAnalysis />
      </TabsContent>

      <TabsContent value="templates" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {mockTemplates.map((template, idx) => (
            <TemplateCard key={idx} {...template} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DataChart 
            title="Player Performance"
            data={mockChartData.playerStats}
            type="bar"
          />
          <DataChart 
            title="Squad Metrics"
            data={mockChartData.squadMetrics}
            type="stat"
          />
          <DataChart 
            title="Key Statistics"
            data={mockChartData.keyStats}
            type="bar"
          />
        </div>
      </TabsContent>

      <TabsContent value="export" className="space-y-6">
        <ExportPanel />
      </TabsContent>
    </Tabs>
  );
}
