import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Users, TrendingUp, RotateCcw, Play } from "lucide-react";

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

  const formations: { [key: string]: Player[] } = {
    "4-3-3": [
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
    ],
    "4-2-3-1": [
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
  };

  const calculateStats = useCallback((players: Player[]): TacticalStats => {
    const outfieldPlayers = players.filter(p => p.position !== 'GK');
    
    const attackingPlayers = outfieldPlayers.filter(p => p.x > 60);
    const avgAttacking = attackingPlayers.reduce((sum, p) => sum + p.stats.attacking, 0) / attackingPlayers.length;
    const expectedGoals = (avgAttacking / 100) * 3.5;
    
    const avgPassing = outfieldPlayers.reduce((sum, p) => sum + p.stats.passing, 0) / outfieldPlayers.length;
    const possessionPercent = Math.min(95, Math.max(45, avgPassing * 0.8 + 20));
    
    const defensivePlayers = outfieldPlayers.filter(p => p.x < 50);
    const avgDefending = defensivePlayers.reduce((sum, p) => sum + p.stats.defending, 0) / defensivePlayers.length;
    const pressureIntensity = Math.min(100, avgDefending * 1.1);
    
    const yPositions = outfieldPlayers.map(p => p.y);
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
    const newStats = calculateStats(formations[formationKey]);
    setCurrentStats(newStats);
  };

  const simulateMatch = async () => {
    setIsSimulating(true);
    
    for (let i = 0; i <= 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const variance = (Math.random() - 0.5) * 10;
      
      setCurrentStats(prev => ({
        expectedGoals: Math.max(0, prev.expectedGoals + variance * 0.1),
        possessionPercent: Math.max(30, Math.min(80, prev.possessionPercent + variance)),
        pressureIntensity: Math.max(50, Math.min(100, prev.pressureIntensity + variance)),
        defensiveCompactness: Math.max(40, Math.min(95, prev.defensiveCompactness + variance)),
        attackingWidth: Math.max(40, Math.min(90, prev.attackingWidth + variance))
      }));
    }
    
    setIsSimulating(false);
  };

  const currentPlayers = formations[selectedFormation];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="font-league-spartan font-bold text-lg sm:text-xl uppercase tracking-wide text-card-foreground flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Interactive Tactical Analysis</span>
            <span className="sm:hidden">Tactical Analysis</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          <Tabs defaultValue="formation" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="formation" data-testid="tab-formation" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Formation Setup</span>
                <span className="sm:hidden">Formation</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" data-testid="tab-analysis" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Live Analysis</span>
                <span className="sm:hidden">Analysis</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formation" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Mobile-first: Controls on top */}
                <div className="xl:order-1 space-y-4">
                  <div className="space-y-2">
                    <label className="font-libre-franklin font-semibold text-xs sm:text-sm text-card-foreground">
                      Formation
                    </label>
                    <Select value={selectedFormation} onValueChange={handleFormationChange}>
                      <SelectTrigger data-testid="select-formation" className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4-3-3">4-3-3 High Press</SelectItem>
                        <SelectItem value="4-2-3-1">4-2-3-1 Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-league-spartan font-bold text-xs sm:text-sm uppercase text-card-foreground">
                      Real-Time Stats
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-libre-franklin">Expected Goals</span>
                        <Badge variant="outline" className="text-xs">{currentStats.expectedGoals}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-libre-franklin">Possession %</span>
                        <Badge variant="outline" className="text-xs">{currentStats.possessionPercent}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-libre-franklin">Pressure</span>
                        <Badge variant="outline" className="text-xs">{currentStats.pressureIntensity}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm"
                    onClick={simulateMatch}
                    disabled={isSimulating}
                    data-testid="button-simulate"
                    className="w-full text-xs sm:text-sm"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {isSimulating ? 'Simulating...' : 'Run Simulation'}
                  </Button>
                </div>

                {/* Tactical field spans 2 columns on xl, full width on smaller screens */}
                <div className="xl:order-2 xl:col-span-2">
                  <Card className="bg-gradient-to-b from-green-600 to-green-700 border-green-500 relative overflow-hidden">
                    <div className="aspect-[3/2] sm:aspect-[3/2] relative">
                      <div className="absolute inset-0">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30"></div>
                        <div className="absolute left-1/2 top-1/2 w-12 h-12 sm:w-16 sm:h-16 border border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-1/6 border-r border-white/30"></div>
                        <div className="absolute right-0 top-1/4 bottom-1/4 w-1/6 border-l border-white/30"></div>
                      </div>
                      
                      {currentPlayers.map((player) => {
                        const isSelected = selectedPlayer === player.id;
                        return (
                          <div
                            key={player.id}
                            className={`absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 touch-manipulation ${
                              isSelected 
                                ? 'bg-yellow-400 text-black ring-2 sm:ring-4 ring-yellow-300 scale-125 z-10' 
                                : player.position === 'GK' 
                                  ? 'bg-red-600 text-white hover:bg-red-500 active:bg-red-500' 
                                  : 'bg-primary text-primary-foreground hover:bg-primary/80 active:bg-primary/80'
                            }`}
                            style={{
                              left: `${player.x}%`,
                              top: `${player.y}%`,
                              transform: 'translate(-50%, -50%)',
                              fontSize: window.innerWidth < 640 ? '10px' : '12px'
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
                    const player = currentPlayers.find(p => p.id === selectedPlayer);
                    if (!player) return null;
                    
                    return (
                      <Card className="mt-4 bg-accent/10 border-accent/20">
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-league-spartan font-bold text-sm sm:text-base text-accent">{player.name}</h4>
                              <Badge variant="outline" className="text-xs">{player.position}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1 sm:space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm">Pace</span>
                                  <span className="text-xs sm:text-sm font-mono">{player.stats.pace}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm">Defending</span>
                                  <span className="text-xs sm:text-sm font-mono">{player.stats.defending}</span>
                                </div>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm">Attacking</span>
                                  <span className="text-xs sm:text-sm font-mono">{player.stats.attacking}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm">Passing</span>
                                  <span className="text-xs sm:text-sm font-mono">{player.stats.passing}</span>
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

            <TabsContent value="analysis" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: 'Expected Goals', value: currentStats.expectedGoals, max: 5 },
                  { label: 'Possession %', value: currentStats.possessionPercent, max: 100 },
                  { label: 'Pressure Intensity', value: currentStats.pressureIntensity, max: 100 },
                  { label: 'Defensive Compactness', value: currentStats.defensiveCompactness, max: 100 },
                  { label: 'Attacking Width', value: currentStats.attackingWidth, max: 100 }
                ].map((stat, index) => (
                  <Card key={index} className="bg-card border-card-border">
                    <CardContent className="p-3 sm:p-4">
                      <h4 className="font-league-spartan font-bold text-xs sm:text-sm uppercase text-card-foreground mb-1 sm:mb-2">
                        {stat.label}
                      </h4>
                      <div className="flex items-end gap-2 mb-1 sm:mb-2">
                        <span className="font-mono font-bold text-lg sm:text-2xl text-primary">
                          {typeof stat.value === 'number' ? stat.value.toFixed(stat.max === 5 ? 1 : 0) : stat.value}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-primary rounded-full h-1.5 sm:h-2 transition-all duration-300"
                          style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}