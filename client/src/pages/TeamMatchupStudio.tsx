import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, TrendingUp, Calendar, MapPin, Trophy, Target, Zap } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";

interface Competition {
  id: number;
  name: string;
  type: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
}

interface Team {
  id: number;
  name: string;
  code: string;
  country: string;
  founded: number;
  logo: string;
  venue: any;
}

interface Fixture {
  id: number;
  date: string;
  homeTeamId: number;
  awayTeamId: number;
  goals: {
    home: number;
    away: number;
  };
  score: any;
  status: any;
  venue: any;
}

type AnalysisMode = 'single' | 'head_to_head';

export default function TeamMatchupStudio() {
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);
  const [selectedTeam1, setSelectedTeam1] = useState<number | null>(null);
  const [selectedTeam2, setSelectedTeam2] = useState<number | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('single');

  // Fetch competitions
  const { data: competitionsData, isLoading: competitionsLoading } = useQuery({
    queryKey: ['/api/football/competitions'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch teams for selected competition
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/football/competitions', selectedCompetition, 'teams'],
    enabled: !!selectedCompetition,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch head-to-head data when two teams are selected
  const { data: headToHeadData, isLoading: headToHeadLoading } = useQuery({
    queryKey: ['/api/football/head-to-head', selectedTeam1, selectedTeam2],
    enabled: !!(selectedTeam1 && selectedTeam2 && analysisMode === 'head_to_head'),
    staleTime: 10 * 60 * 1000,
  });

  // Initialize football data mutation
  const initializeDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/football/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to initialize data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/football/competitions'] });
    },
  });

  const competitions: Competition[] = (competitionsData as any)?.competitions || [];
  const teams: Team[] = (teamsData as any)?.teams || [];
  const headToHeadFixtures: Fixture[] = (headToHeadData as any)?.fixtures || [];

  const selectedTeam1Data = teams.find(t => t.id === selectedTeam1);
  const selectedTeam2Data = teams.find(t => t.id === selectedTeam2);

  // Reset team selections when competition changes
  useEffect(() => {
    setSelectedTeam1(null);
    setSelectedTeam2(null);
  }, [selectedCompetition]);

  // Reset second team when switching to single mode
  useEffect(() => {
    if (analysisMode === 'single') {
      setSelectedTeam2(null);
    }
  }, [analysisMode]);

  const handleInitializeData = () => {
    initializeDataMutation.mutate();
  };

  const renderCompetitionSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Select Competition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedCompetition?.toString() || ""} onValueChange={(value) => setSelectedCompetition(parseInt(value))}>
          <SelectTrigger data-testid="select-competition">
            <SelectValue placeholder="Choose a competition..." />
          </SelectTrigger>
          <SelectContent>
            {competitions.map((competition) => (
              <SelectItem key={competition.id} value={competition.id.toString()}>
                <div className="flex items-center gap-2">
                  {competition.logo && (
                    <img 
                      src={competition.logo} 
                      alt={competition.name}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span>{competition.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {competition.season}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {competitions.length === 0 && !competitionsLoading && (
          <div className="mt-4 p-4 border border-dashed rounded-lg text-center">
            <p className="text-muted-foreground mb-2">No competition data available</p>
            <Button 
              onClick={handleInitializeData}
              disabled={initializeDataMutation.isPending}
              data-testid="button-initialize-data"
            >
              {initializeDataMutation.isPending ? 'Initializing...' : 'Load Competition Data'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAnalysisModeSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Analysis Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={analysisMode} onValueChange={(value) => setAnalysisMode(value as AnalysisMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" data-testid="tab-single-team">
              <Shield className="w-4 h-4 mr-2" />
              Team Analysis
            </TabsTrigger>
            <TabsTrigger value="head_to_head" data-testid="tab-head-to-head">
              <Users className="w-4 h-4 mr-2" />
              Head-to-Head
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );

  const renderTeamSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Select Team{analysisMode === 'head_to_head' ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First Team Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {analysisMode === 'head_to_head' ? 'Home Team' : 'Team'}
          </label>
          <Select 
            value={selectedTeam1?.toString() || ""} 
            onValueChange={(value) => setSelectedTeam1(parseInt(value))}
            disabled={!selectedCompetition || teamsLoading}
          >
            <SelectTrigger data-testid="select-team-1">
              <SelectValue placeholder={!selectedCompetition ? "Select competition first..." : "Choose a team..."} />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  <div className="flex items-center gap-2">
                    {team.logo && (
                      <img 
                        src={team.logo} 
                        alt={team.name}
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span>{team.name}</span>
                    {team.code && (
                      <Badge variant="outline" className="text-xs">
                        {team.code}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Second Team Selection (only for head-to-head) */}
        {analysisMode === 'head_to_head' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Away Team</label>
            <Select 
              value={selectedTeam2?.toString() || ""} 
              onValueChange={(value) => setSelectedTeam2(parseInt(value))}
              disabled={!selectedCompetition || teamsLoading || !selectedTeam1}
            >
              <SelectTrigger data-testid="select-team-2">
                <SelectValue placeholder={!selectedTeam1 ? "Select home team first..." : "Choose away team..."} />
              </SelectTrigger>
              <SelectContent>
                {teams.filter(team => team.id !== selectedTeam1).map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    <div className="flex items-center gap-2">
                      {team.logo && (
                        <img 
                          src={team.logo} 
                          alt={team.name}
                          className="w-4 h-4 object-contain"
                        />
                      )}
                      <span>{team.name}</span>
                      {team.code && (
                        <Badge variant="outline" className="text-xs">
                          {team.code}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderHeadToHeadAnalysis = () => {
    if (!selectedTeam1Data || !selectedTeam2Data) return null;

    const team1Wins = headToHeadFixtures.filter(f => 
      (f.homeTeamId === selectedTeam1 && f.goals.home > f.goals.away) ||
      (f.awayTeamId === selectedTeam1 && f.goals.away > f.goals.home)
    ).length;

    const team2Wins = headToHeadFixtures.filter(f => 
      (f.homeTeamId === selectedTeam2 && f.goals.home > f.goals.away) ||
      (f.awayTeamId === selectedTeam2 && f.goals.away > f.goals.home)
    ).length;

    const draws = headToHeadFixtures.filter(f => f.goals.home === f.goals.away).length;

    return (
      <div className="space-y-6">
        {/* Head-to-Head Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Head-to-Head Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {selectedTeam1Data.logo && (
                    <img src={selectedTeam1Data.logo} alt={selectedTeam1Data.name} className="w-6 h-6" />
                  )}
                  <span className="font-medium">{selectedTeam1Data.name}</span>
                </div>
                <div className="text-2xl font-bold text-primary">{team1Wins}</div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>

              <div className="text-center">
                <div className="mb-2">
                  <span className="font-medium">Draws</span>
                </div>
                <div className="text-2xl font-bold text-muted-foreground">{draws}</div>
                <div className="text-sm text-muted-foreground">-</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {selectedTeam2Data.logo && (
                    <img src={selectedTeam2Data.logo} alt={selectedTeam2Data.name} className="w-6 h-6" />
                  )}
                  <span className="font-medium">{selectedTeam2Data.name}</span>
                </div>
                <div className="text-2xl font-bold text-primary">{team2Wins}</div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Based on last {headToHeadFixtures.length} matches
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        {headToHeadFixtures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {headToHeadFixtures.slice(0, 5).map((fixture) => {
                  const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
                  const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
                  
                  return (
                    <div key={fixture.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {homeTeam?.logo && (
                            <img src={homeTeam.logo} alt={homeTeam.name} className="w-5 h-5" />
                          )}
                          <span className="font-medium">{homeTeam?.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded">
                          <span className="font-bold">{fixture.goals.home}</span>
                          <span>-</span>
                          <span className="font-bold">{fixture.goals.away}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {awayTeam?.logo && (
                            <img src={awayTeam.logo} alt={awayTeam.name} className="w-5 h-5" />
                          )}
                          <span className="font-medium">{awayTeam?.name}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {new Date(fixture.date).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderSingleTeamAnalysis = () => {
    if (!selectedTeam1Data) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Team Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            {selectedTeam1Data.logo && (
              <img 
                src={selectedTeam1Data.logo} 
                alt={selectedTeam1Data.name}
                className="w-16 h-16 object-contain"
              />
            )}
            <div>
              <h3 className="text-2xl font-bold">{selectedTeam1Data.name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{selectedTeam1Data.country}</span>
                {selectedTeam1Data.founded && (
                  <>
                    <span>•</span>
                    <span>Founded {selectedTeam1Data.founded}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {selectedTeam1Data.venue && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Home Venue</div>
                <div className="font-medium">{selectedTeam1Data.venue.name}</div>
                <div className="text-sm text-muted-foreground">{selectedTeam1Data.venue.city}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Capacity</div>
                <div className="font-medium">{selectedTeam1Data.venue.capacity?.toLocaleString() || 'N/A'}</div>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 border border-dashed rounded-lg text-center">
            <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Advanced statistics and squad analysis coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Team Matchup Studio</h1>
          <p className="text-muted-foreground">
            Professional football analysis with accurate team data and head-to-head comparisons
          </p>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderCompetitionSelection()}
          {renderAnalysisModeSelection()}
          {renderTeamSelection()}
        </div>

        <Separator />

        {/* Analysis Results */}
        {selectedTeam1 && (
          <div className="space-y-6">
            {analysisMode === 'head_to_head' && selectedTeam2 ? (
              headToHeadLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-pulse">Loading head-to-head analysis...</div>
                  </CardContent>
                </Card>
              ) : (
                renderHeadToHeadAnalysis()
              )
            ) : analysisMode === 'single' ? (
              renderSingleTeamAnalysis()
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {analysisMode === 'head_to_head' 
                      ? 'Select both teams to view head-to-head analysis'
                      : 'Select a team to view detailed analysis'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}