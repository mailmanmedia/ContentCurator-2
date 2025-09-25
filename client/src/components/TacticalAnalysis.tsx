import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  Users, 
  TrendingUp, 
  RotateCcw, 
  Play, 
  Settings,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  x: number;
  y: number;
  stats: {
    pace: number;
    defending: number;
    attacking: number;
    passing: number;
  };
}

interface Formation {
  name: string;
  players: Player[];
  style: string;
  defensiveRating: number;
  attackingRating: number;
  possessionRating: number;
}

interface TacticalStats {
  expectedGoals: number;
  possessionPercent: number;
  pressureIntensity: number;
  defensiveCompactness: number;
  attackingWidth: number;
}

export default function TacticalAnalysis() {
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [currentStats, setCurrentStats] = useState<TacticalStats>({
    expectedGoals: 2.3,
    possessionPercent: 68,
    pressureIntensity: 85,
    defensiveCompactness: 72,
    attackingWidth: 78
  });
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const formations: { [key: string]: Formation } = {
    "4-3-3": {
      name: "4-3-3 High Press",
      style: "Attacking",
      defensiveRating: 78,
      attackingRating: 92,
      possessionRating: 85,
      players: [
        { id: "alisson", name: "Alisson", position: "GK", rating: 89, x: 8, y: 50, stats: { pace: 60, defending: 95, attacking: 25, passing: 88 } },
        { id: "taa", name: "Alexander-Arnold", position: "RB", rating: 87, x: 25, y: 85, stats: { pace: 76, defending: 78, attacking: 89, passing: 93 } },
        { id: "vvd", name: "van Dijk", position: "CB", rating: 90, x: 25, y: 65, stats: { pace: 77, defending: 96, attacking: 65, passing: 91 } },
        { id: "konate", name: "Konaté", position: "CB", rating: 84, x: 25, y: 35, stats: { pace: 82, defending: 88, attacking: 45, passing: 78 } },
        { id: "robbo", name: "Robertson", position: "LB", rating: 86, x: 25, y: 15, stats: { pace: 85, defending: 82, attacking: 84, passing: 86 } },
        { id: "fab", name: "Fabinho", position: "CDM", rating: 85, x: 45, y: 50, stats: { pace: 65, defending: 89, attacking: 72, passing: 88 } },
        { id: "mac", name: "Mac Allister", position: "CM", rating: 84, x: 60, y: 35, stats: { pace: 73, defending: 75, attacking: 82, passing: 89 } },
        { id: "szob", name: "Szoboszlai", position: "CM", rating: 83, x: 60, y: 65, stats: { pace: 78, defending: 68, attacking: 86, passing: 85 } },
        { id: "salah", name: "Salah", position: "RW", rating: 90, x: 85, y: 80, stats: { pace: 93, defending: 45, attacking: 95, passing: 81 } },
        { id: "nunez", name: "Núñez", position: "ST", rating: 82, x: 85, y: 50, stats: { pace: 91, defending: 35, attacking: 88, passing: 75 } },
        { id: "diaz", name: "Luis Díaz", position: "LW", rating: 84, x: 85, y: 20, stats: { pace: 94, defending: 40, attacking: 87, passing: 78 } }
      ]
    },
    "4-2-3-1": {
      name: "4-2-3-1 Control",
      style: "Balanced",
      defensiveRating: 85,
      attackingRating: 83,
      possessionRating: 91,
      players: [
        { id: "alisson", name: "Alisson", position: "GK", rating: 89, x: 8, y: 50, stats: { pace: 60, defending: 95, attacking: 25, passing: 88 } },
        { id: "taa", name: "Alexander-Arnold", position: "RB", rating: 87, x: 25, y: 85, stats: { pace: 76, defending: 78, attacking: 89, passing: 93 } },
        { id: "vvd", name: "van Dijk", position: "CB", rating: 90, x: 25, y: 65, stats: { pace: 77, defending: 96, attacking: 65, passing: 91 } },
        { id: "konate", name: "Konaté", position: "CB", rating: 84, x: 25, y: 35, stats: { pace: 82, defending: 88, attacking: 45, passing: 78 } },
        { id: "robbo", name: "Robertson", position: "LB", rating: 86, x: 25, y: 15, stats: { pace: 85, defending: 82, attacking: 84, passing: 86 } },
        { id: "fab", name: "Fabinho", position: "CDM", rating: 85, x: 40, y: 60, stats: { pace: 65, defending: 89, attacking: 72, passing: 88 } },
        { id: "mac", name: "Mac Allister", position: "CDM", rating: 84, x: 40, y: 40, stats: { pace: 73, defending: 75, attacking: 82, passing: 89 } },
        { id: "szob", name: "Szoboszlai", position: "CAM", rating: 83, x: 65, y: 50, stats: { pace: 78, defending: 68, attacking: 86, passing: 85 } },
        { id: "salah", name: "Salah", position: "RW", rating: 90, x: 75, y: 75, stats: { pace: 93, defending: 45, attacking: 95, passing: 81 } },
        { id: "diaz", name: "Luis Díaz", position: "LW", rating: 84, x: 75, y: 25, stats: { pace: 94, defending: 40, attacking: 87, passing: 78 } },
        { id: "nunez", name: "Núñez", position: "ST", rating: 82, x: 85, y: 50, stats: { pace: 91, defending: 35, attacking: 88, passing: 75 } }
      ]
    }
  };

  const calculateFormationStats = useCallback((formation: Formation): TacticalStats => {
    const players = formation.players.filter(p => p.position !== 'GK');
    
    const attackingPlayers = players.filter(p => p.x > 60);
    const avgAttackingRating = attackingPlayers.reduce((sum, p) => sum + p.stats.attacking, 0) / attackingPlayers.length;
    const expectedGoals = (avgAttackingRating / 100) * 3.5;
    
    const avgPassing = players.reduce((sum, p) => sum + p.stats.passing, 0) / players.length;
    const possessionPercent = Math.min(95, Math.max(45, avgPassing * 0.8 + 20));
    
    const defensivePlayers = players.filter(p => p.x < 50);
    const avgDefending = defensivePlayers.reduce((sum, p) => sum + p.stats.defending, 0) / defensivePlayers.length;
    const pressureIntensity = Math.min(100, avgDefending * 1.1);
    
    const yPositions = players.map(p => p.y);
    const ySpread = Math.max(...yPositions) - Math.min(...yPositions);
    const defensiveCompactness = Math.max(50, 100 - ySpread * 0.8);
    const attackingWidth = ySpread * 0.9;
    
    return {
      expectedGoals: Number(expectedGoals.toFixed(1)),
      possessionPercent: Math.round(possessionPercent),
      pressureIntensity: Math.round(pressureIntensity),
      defensiveCompactness: Math.round(defensiveCompactness),
      attackingWidth: Math.round(attackingWidth)
    };
  }, []);

  const handleFormationChange = (formationKey: string) => {
    setSelectedFormation(formationKey);
    const newStats = calculateFormationStats(formations[formationKey]);
    setCurrentStats(newStats);
  };

  const simulateMatch = async () => {
    setIsSimulating(true);
    
    const iterations = 50;
    const baseStats = currentStats;
    
    for (let i = 0; i <= iterations; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const variance = (Math.random() - 0.5) * 10;
      
      setCurrentStats({
        expectedGoals: Math.max(0, baseStats.expectedGoals + variance * 0.1),
        possessionPercent: Math.max(30, Math.min(80, baseStats.possessionPercent + variance)),
        pressureIntensity: Math.max(50, Math.min(100, baseStats.pressureIntensity + variance)),
        defensiveCompactness: Math.max(40, Math.min(95, baseStats.defensiveCompactness + variance)),
        attackingWidth: Math.max(40, Math.min(90, baseStats.attackingWidth + variance))
      });
    }
    
    setIsSimulating(false);
  };

  const resetFormation = () => {
    const originalFormation = formations[selectedFormation];
    const newStats = calculateFormationStats(originalFormation);
    setCurrentStats(newStats);
  };

  const currentFormation = formations[selectedFormation];
  
  const getStatTrend = (current: number, base: number) => {
    if (current > base + 2) return { icon: ArrowUp, color: "text-green-500" };
    if (current < base - 2) return { icon: ArrowDown, color: "text-red-500" };
    return { icon: Minus, color: "text-muted-foreground" };
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="font-league-spartan font-bold text-xl uppercase tracking-wide text-card-foreground flex items-center gap-2">
            <Target className="w-5 h-5" />
            Interactive Tactical Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="formation" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="formation" data-testid="tab-formation">
                Formation Setup
              </TabsTrigger>
              <TabsTrigger value="analysis" data-testid="tab-analysis">
                Live Analysis
              </TabsTrigger>
              <TabsTrigger value="simulation" data-testid="tab-simulation">
                Match Simulation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
                      Formation
                    </label>
                    <Select value={selectedFormation} onValueChange={handleFormationChange}>
                      <SelectTrigger data-testid="select-formation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(formations).map(([key, formation]) => (
                          <SelectItem key={key} value={key}>
                            {formation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-league-spartan font-bold text-sm uppercase text-card-foreground">
                      Formation Stats
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-libre-franklin">Defensive Rating</span>
                        <Badge variant="outline">{currentFormation.defensiveRating}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-libre-franklin">Attacking Rating</span>
                        <Badge variant="outline">{currentFormation.attackingRating}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-libre-franklin">Possession Rating</span>
                        <Badge variant="outline">{currentFormation.possessionRating}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={resetFormation}
                      data-testid="button-reset-formation"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                    <Button 
                      size="sm"
                      onClick={simulateMatch}
                      disabled={isSimulating}
                      data-testid="button-simulate"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      {isSimulating ? 'Simulating...' : 'Simulate'}
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <Card className="bg-gradient-to-b from-green-600 to-green-700 border-green-500 relative overflow-hidden">
                    <div className="aspect-[3/2] relative">
                      <div className="absolute inset-0">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30"></div>
                        <div className="absolute left-1/2 top-1/2 w-16 h-16 border border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-1/6 border-r border-white/30"></div>
                        <div className="absolute right-0 top-1/4 bottom-1/4 w-1/6 border-l border-white/30"></div>
                        <div className="absolute left-0 top-2/5 bottom-2/5 w-12 border-r border-white/30"></div>
                        <div className="absolute right-0 top-2/5 bottom-2/5 w-12 border-l border-white/30"></div>
                      </div>
                      
                      {currentFormation.players.map((player) => {
                        const isSelected = selectedPlayer === player.id;
                        return (
                          <div
                            key={player.id}
                            className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'bg-yellow-400 text-black ring-4 ring-yellow-300 scale-125 z-10' 
                                : player.position === 'GK' 
                                  ? 'bg-red-600 text-white hover:bg-red-500' 
                                  : 'bg-primary text-primary-foreground hover:bg-primary/80'
                            }`}
                            style={{
                              left: `${player.x}%`,
                              top: `${player.y}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onClick={() => setSelectedPlayer(isSelected ? null : player.id)}
                            data-testid={`player-${player.id}`}
                          >
                            {player.rating}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                  
                  {selectedPlayer && (() => {
                    const player = currentFormation.players.find(p => p.id === selectedPlayer);
                    if (!player) return null;
                    
                    return (
                      <Card className="mt-4 bg-accent/10 border-accent/20">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-league-spartan font-bold text-accent">{player.name}</h4>
                              <Badge variant="outline">{player.position}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Pace</span>
                                  <span className="text-sm font-mono">{player.stats.pace}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Defending</span>
                                  <span className="text-sm font-mono">{player.stats.defending}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Attacking</span>
                                  <span className="text-sm font-mono">{player.stats.attacking}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Passing</span>
                                  <span className="text-sm font-mono">{player.stats.passing}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Expected Goals', value: currentStats.expectedGoals, suffix: '', max: 5 },
                  { label: 'Possession %', value: currentStats.possessionPercent, suffix: '%', max: 100 },
                  { label: 'Pressure Intensity', value: currentStats.pressureIntensity, suffix: '', max: 100 },
                  { label: 'Defensive Compactness', value: currentStats.defensiveCompactness, suffix: '', max: 100 },
                  { label: 'Attacking Width', value: currentStats.attackingWidth, suffix: '', max: 100 }
                ].map((stat, index) => {
                  const TrendIcon = getStatTrend(stat.value, stat.max * 0.7).icon;
                  const trendColor = getStatTrend(stat.value, stat.max * 0.7).color;
                  
                  return (
                    <Card key={index} className="bg-card border-card-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-league-spartan font-bold text-sm uppercase text-card-foreground">
                            {stat.label}
                          </h4>
                          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="font-mono font-bold text-2xl text-primary">
                            {typeof stat.value === 'number' ? stat.value.toFixed(stat.suffix === '' && stat.max === 5 ? 1 : 0) : stat.value}
                          </span>
                          <span className="text-muted-foreground font-libre-franklin text-sm mb-1">
                            {stat.suffix}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2 transition-all duration-300"
                              style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="simulation" className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Settings className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-league-spartan font-bold text-lg uppercase text-foreground mb-2">
                  Match Simulation Engine
                </h3>
                <p className="font-libre-franklin text-muted-foreground mb-6">
                  Advanced simulation coming soon. This will include opponent analysis,
                  weather conditions, player fitness, and predictive match outcomes.
                </p>
                <Button 
                  size="lg"
                  onClick={simulateMatch}
                  disabled={isSimulating}
                  className="font-league-spartan font-bold uppercase tracking-wide"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isSimulating ? 'Running Simulation...' : 'Run Quick Simulation'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}