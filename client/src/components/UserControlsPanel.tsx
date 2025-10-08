import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, Trophy, Clock, BarChart, RefreshCw } from "lucide-react";
import TeamSelector from "./TeamSelector";

interface UserControlsPanelProps {
  onCompetitionChange: (competition: string) => void;
  onTimeframeChange: (timeframe: string) => void;
  onDatasetToggle: (dataset: string, enabled: boolean) => void;
  onTeamSelect: (teamId: number) => void;
  onRefreshAll: () => void;
}

export default function UserControlsPanel({
  onCompetitionChange,
  onTimeframeChange,
  onDatasetToggle,
  onTeamSelect,
  onRefreshAll
}: UserControlsPanelProps) {
  const [selectedCompetition, setSelectedCompetition] = useState("Premier League");
  const [selectedTimeframe, setSelectedTimeframe] = useState("last5");
  const [selectedTeam, setSelectedTeam] = useState(40); // Liverpool default
  const [datasets, setDatasets] = useState({
    homeOnly: false,
    awayOnly: false,
    allCompetitions: true,
    includeInternational: false,
    historicalData: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const competitions = [
    { id: "premier-league", name: "Premier League", icon: Trophy },
    { id: "champions-league", name: "Champions League", icon: Trophy },
    { id: "europa-league", name: "Europa League", icon: Trophy },
    { id: "fa-cup", name: "FA Cup", icon: Trophy },
    { id: "carabao-cup", name: "Carabao Cup", icon: Trophy },
    { id: "all", name: "All Competitions", icon: BarChart },
  ];

  const timeframes = [
    { id: "last5", name: "Last 5 Games", icon: Clock },
    { id: "last10", name: "Last 10 Games", icon: Clock },
    { id: "thisMonth", name: "This Month", icon: Calendar },
    { id: "thisSeason", name: "This Season", icon: Calendar },
    { id: "lastSeason", name: "Last Season", icon: Calendar },
    { id: "allTime", name: "All Time", icon: BarChart },
  ];

  const handleCompetitionChange = (value: string) => {
    setSelectedCompetition(value);
    onCompetitionChange(value);
  };

  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
    onTimeframeChange(value);
  };

  const handleDatasetToggle = (dataset: keyof typeof datasets) => {
    const newValue = !datasets[dataset];
    setDatasets(prev => ({
      ...prev,
      [dataset]: newValue
    }));
    onDatasetToggle(dataset, newValue);
  };

  const handleTeamSelect = (teamId: number) => {
    setSelectedTeam(teamId);
    onTeamSelect(teamId);
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshAll();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            User Controls & Dataset Selection
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Team Selection
          </Label>
          <TeamSelector
            value={selectedTeam}
            onChange={handleTeamSelect}
            showCompetitions={true}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Select any team from any competition
          </p>
        </div>

        {/* Competition Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Competition Filter
          </Label>
          <Select value={selectedCompetition} onValueChange={handleCompetitionChange}>
            <SelectTrigger data-testid="select-competition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {competitions.map(comp => (
                <SelectItem key={comp.id} value={comp.name}>
                  <div className="flex items-center gap-2">
                    <comp.icon className="w-4 h-4" />
                    {comp.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Active: {selectedCompetition}
            </Badge>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeframe
          </Label>
          <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger data-testid="select-timeframe">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map(tf => (
                <SelectItem key={tf.id} value={tf.id}>
                  <div className="flex items-center gap-2">
                    <tf.icon className="w-4 h-4" />
                    {tf.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Data will be filtered to: {timeframes.find(t => t.id === selectedTimeframe)?.name}
          </p>
        </div>

        {/* Dataset Toggles */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Dataset Options
          </Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="homeOnly" className="text-sm font-normal">
                Home Games Only
              </Label>
              <Switch
                id="homeOnly"
                checked={datasets.homeOnly}
                onCheckedChange={() => handleDatasetToggle('homeOnly')}
                disabled={datasets.awayOnly}
                data-testid="switch-home-only"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="awayOnly" className="text-sm font-normal">
                Away Games Only
              </Label>
              <Switch
                id="awayOnly"
                checked={datasets.awayOnly}
                onCheckedChange={() => handleDatasetToggle('awayOnly')}
                disabled={datasets.homeOnly}
                data-testid="switch-away-only"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="allCompetitions" className="text-sm font-normal">
                Include All Competitions
              </Label>
              <Switch
                id="allCompetitions"
                checked={datasets.allCompetitions}
                onCheckedChange={() => handleDatasetToggle('allCompetitions')}
                data-testid="switch-all-competitions"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="includeInternational" className="text-sm font-normal">
                Include International Matches
              </Label>
              <Switch
                id="includeInternational"
                checked={datasets.includeInternational}
                onCheckedChange={() => handleDatasetToggle('includeInternational')}
                data-testid="switch-international"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="historicalData" className="text-sm font-normal">
                Show Historical Data
              </Label>
              <Switch
                id="historicalData"
                checked={datasets.historicalData}
                onCheckedChange={() => handleDatasetToggle('historicalData')}
                data-testid="switch-historical"
              />
            </div>
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <Label className="text-sm font-semibold">Current Selection:</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Team: #{selectedTeam}</Badge>
            <Badge variant="outline">{selectedCompetition}</Badge>
            <Badge variant="outline">{timeframes.find(t => t.id === selectedTimeframe)?.name}</Badge>
            {datasets.homeOnly && <Badge variant="secondary">Home Only</Badge>}
            {datasets.awayOnly && <Badge variant="secondary">Away Only</Badge>}
            {datasets.allCompetitions && <Badge variant="secondary">All Comps</Badge>}
            {datasets.includeInternational && <Badge variant="secondary">Int'l</Badge>}
            {datasets.historicalData && <Badge variant="secondary">Historical</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}