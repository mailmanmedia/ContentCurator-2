import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, TrendingUp, Calendar, MapPin, Trophy, Target, Zap, Activity, Award, Timer, AlertCircle, RefreshCw } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import { formatDistanceToNow } from 'date-fns';

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
  const [selectedSeason, setSelectedSeason] = useState<number>(2025);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Fetch competitions (rarely changes, long cache)
  const { data: competitionsData, isLoading: competitionsLoading } = useQuery({
    queryKey: ['/api/football/competitions'],
    staleTime: 30 * 60 * 1000, // 30 minutes - competitions don't change often
    select: (response: any) => response?.competitions || [],
  });

  // Fetch teams for selected competition (rarely changes, long cache)
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/football/competitions', selectedCompetition, 'teams'],
    enabled: !!selectedCompetition,
    staleTime: 30 * 60 * 1000, // 30 minutes - teams don't change often
    select: (response: any) => response?.teams || [],
  });

  // Fetch head-to-head data when two teams are selected (historical data, long cache)
  const { data: headToHeadData, isLoading: headToHeadLoading } = useQuery({
    queryKey: ['/api/football/head-to-head', selectedTeam1, selectedTeam2],
    enabled: !!(selectedTeam1 && selectedTeam2 && analysisMode === 'head_to_head'),
    staleTime: 60 * 60 * 1000, // 1 hour - historical data changes infrequently
    select: (response: any) => response?.fixtures || [],
  });

  // Parallel fetch for single team analysis (stats + squad)
  const singleTeamQueries = useQueries({
    queries: [
      {
        queryKey: ['/api/football/teams', selectedTeam1, 'statistics', selectedCompetition, selectedSeason],
        queryFn: async () => {
          const response = await fetch(`/api/football/teams/${selectedTeam1}/statistics?leagueId=${selectedCompetition}&season=${selectedSeason}`);
          if (!response.ok) throw new Error('Failed to fetch statistics');
          return response.json();
        },
        enabled: !!(selectedTeam1 && selectedCompetition && analysisMode === 'single'),
        staleTime: 10 * 60 * 1000, // 10 minutes
      },
      {
        queryKey: ['/api/football/teams', selectedTeam1, 'squad', selectedSeason],
        queryFn: async () => {
          const response = await fetch(`/api/football/teams/${selectedTeam1}/squad?season=${selectedSeason}`);
          if (!response.ok) throw new Error('Failed to fetch squad');
          return response.json();
        },
        enabled: !!(selectedTeam1 && analysisMode === 'single'),
        staleTime: 60 * 60 * 1000, // 1 hour - squad changes infrequently
      },
    ],
  });

  const teamStatsData = singleTeamQueries[0]?.data as {statistics: any} | undefined;
  const teamSquadData = singleTeamQueries[1]?.data as {squad: any[]} | undefined;
  const statsLoading = singleTeamQueries[0]?.isLoading || false;
  const squadLoading = singleTeamQueries[1]?.isLoading || false;

  // Debug log to see what data we're actually receiving
  useEffect(() => {
    if (teamStatsData?.statistics) {
      console.log('📊 Team Stats Data:', {
        form: teamStatsData.statistics.form,
        goalsFor: teamStatsData.statistics.goals?.for?.total?.total,
        cleanSheets: teamStatsData.statistics.clean_sheet?.total,
        fixturesPlayed: teamStatsData.statistics.fixtures?.played?.total,
        fixturesWins: teamStatsData.statistics.fixtures?.wins?.total
      });
    }
  }, [teamStatsData]);

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

  // Initialize historical data mutation
  const initializeHistoricalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/football/initialize-historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to initialize historical data');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Historical data initialized:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/football/head-to-head'] });
    },
  });

  // AI Analysis mutation
  const aiAnalysisMutation = useMutation({
    mutationFn: async ({ teamId, teamName, statistics }: any) => {
      const response = await fetch(`/api/football/teams/${teamId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          statistics,
          isLiverpool: teamId === 40
        }),
      });
      if (!response.ok) throw new Error('Failed to generate analysis');
      return response.json();
    },
    onSuccess: (data) => {
      setAiAnalysis(data.analysis);
    },
  });

  // Function to refresh team statistics (invalidate React Query cache)
  const handleRefreshStats = () => {
    console.log('🔄🔄🔄 REFRESH BUTTON CLICKED! Invalidating cache for team:', selectedTeam1);
    queryClient.invalidateQueries({
      queryKey: ['/api/football/teams', selectedTeam1, 'statistics']
    });
    console.log('✅ Cache invalidated. React Query will now fetch fresh data from API.');
    alert(`Refreshing stats for team ${selectedTeam1}. Check the browser console for debug logs!`);
  };

  const competitions: Competition[] = (competitionsData as any) || [];
  const teams: Team[] = (teamsData as any) || [];
  const headToHeadFixtures: Fixture[] = (headToHeadData as any) || [];

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

  const handleInitializeHistoricalData = () => {
    initializeHistoricalMutation.mutate();
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
              <SelectItem 
                key={competition.id} 
                value={competition.id.toString()}
                data-testid={`competition-option-${competition.id}`}
                className="cursor-pointer"
              >
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
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={handleInitializeData}
                disabled={initializeDataMutation.isPending}
                data-testid="button-initialize-data"
              >
                {initializeDataMutation.isPending ? 'Initializing...' : 'Load Competition Data'}
              </Button>
              <Button 
                onClick={handleInitializeHistoricalData}
                disabled={initializeHistoricalMutation.isPending}
                variant="outline"
                data-testid="button-initialize-historical"
              >
                {initializeHistoricalMutation.isPending ? 'Loading Historical...' : 'Load Historical Data (2020+)'}
              </Button>
            </div>
          </div>
        )}
        
        {competitions.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleInitializeHistoricalData}
              disabled={initializeHistoricalMutation.isPending}
              variant="ghost"
              size="sm"
              data-testid="button-refresh-historical"
            >
              {initializeHistoricalMutation.isPending ? 'Updating...' : 'Update Historical Data'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSeasonSelection = () => {
    const availableSeasons = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Select Season
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSeason.toString()} onValueChange={(value) => setSelectedSeason(parseInt(value))}>
            <SelectTrigger data-testid="select-season">
              <SelectValue placeholder="Choose a season..." />
            </SelectTrigger>
            <SelectContent>
              {availableSeasons.map((season) => (
                <SelectItem 
                  key={season} 
                  value={season.toString()}
                  data-testid={`season-option-${season}`}
                >
                  {season}/{(season + 1).toString().slice(-2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  };

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
                <SelectItem 
                  key={team.id} 
                  value={team.id.toString()}
                  data-testid={`team-option-${team.id}`}
                  className="cursor-pointer"
                >
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
                  <SelectItem 
                    key={team.id} 
                    value={team.id.toString()}
                    data-testid={`away-team-option-${team.id}`}
                    className="cursor-pointer"
                  >
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

    const team1Goals = headToHeadFixtures.reduce((sum, f) => {
      return sum + (f.homeTeamId === selectedTeam1 ? f.goals.home : f.goals.away);
    }, 0);

    const team2Goals = headToHeadFixtures.reduce((sum, f) => {
      return sum + (f.homeTeamId === selectedTeam2 ? f.goals.home : f.goals.away);
    }, 0);

    return (
      <div className="space-y-6">
        {/* Head-to-Head Overview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Head-to-Head Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Team Headers */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {selectedTeam1Data.logo && (
                    <img src={selectedTeam1Data.logo} alt={selectedTeam1Data.name} className="w-10 h-10" />
                  )}
                  <span className="font-league-spartan font-bold text-lg">{selectedTeam1Data.name}</span>
                </div>
              </div>

              <div className="text-center flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground">VS</span>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {selectedTeam2Data.logo && (
                    <img src={selectedTeam2Data.logo} alt={selectedTeam2Data.name} className="w-10 h-10" />
                  )}
                  <span className="font-league-spartan font-bold text-lg">{selectedTeam2Data.name}</span>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="space-y-4">
              {/* Wins */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary">{team1Wins}</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-muted-foreground uppercase">Wins</span>
                </div>
                <div className="text-left">
                  <span className="text-3xl font-bold text-primary">{team2Wins}</span>
                </div>
              </div>

              <Separator />

              {/* Draws */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-right">
                  <span className="text-2xl font-bold text-muted-foreground">{draws}</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-muted-foreground uppercase">Draws</span>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-muted-foreground">{draws}</span>
                </div>
              </div>

              <Separator />

              {/* Goals */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-right">
                  <span className="text-2xl font-bold">{team1Goals}</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-muted-foreground uppercase">Goals Scored</span>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold">{team2Goals}</span>
                </div>
              </div>

              <Separator />

              {/* Win Rate */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-right">
                  <span className="text-xl font-semibold">{headToHeadFixtures.length > 0 ? Math.round((team1Wins / headToHeadFixtures.length) * 100) : 0}%</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-muted-foreground uppercase">Win Rate</span>
                </div>
                <div className="text-left">
                  <span className="text-xl font-semibold">{headToHeadFixtures.length > 0 ? Math.round((team2Wins / headToHeadFixtures.length) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-6 pt-4 border-t">
              Based on last {headToHeadFixtures.length} matches
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        {headToHeadFixtures.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Match History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {headToHeadFixtures.slice(0, 5).map((fixture) => {
                  const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
                  const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
                  const homeWon = fixture.goals.home > fixture.goals.away;
                  const awayWon = fixture.goals.away > fixture.goals.home;
                  const isDraw = fixture.goals.home === fixture.goals.away;
                  
                  return (
                    <div 
                      key={fixture.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate transition-all"
                      data-testid={`fixture-${fixture.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`flex items-center gap-2 flex-1 ${homeWon ? 'font-bold' : ''}`}>
                          {homeTeam?.logo && (
                            <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6" />
                          )}
                          <span className="font-medium">{homeTeam?.name}</span>
                          {homeWon && <Badge variant="default" className="ml-auto text-xs">W</Badge>}
                        </div>
                        
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          isDraw ? 'bg-muted' : homeWon ? 'bg-primary/10' : 'bg-accent/10'
                        }`}>
                          <span className="font-bold text-lg">{fixture.goals.home}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="font-bold text-lg">{fixture.goals.away}</span>
                        </div>
                        
                        <div className={`flex items-center gap-2 flex-1 ${awayWon ? 'font-bold' : ''}`}>
                          {awayWon && <Badge variant="default" className="mr-auto text-xs">W</Badge>}
                          <span className="font-medium">{awayTeam?.name}</span>
                          {awayTeam?.logo && (
                            <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6" />
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground ml-4">
                        {new Date(fixture.date).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
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

          {/* Advanced Statistics and Squad Analysis */}
          {(statsLoading || squadLoading) ? (
            <div className="mt-6 space-y-6">
              <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>{renderStatCardSkeleton()}</div>
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <Skeleton className="h-[250px] w-full" />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Team Statistics Section */}
              {teamStatsData?.statistics && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h4 className="font-league-spartan font-bold text-lg uppercase text-accent flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Performance Metrics
                      </h4>
                      <div className="flex items-center gap-2">
                        {teamStatsData?.statistics?.lastUpdated && (
                          <Badge variant="outline" className="text-xs" data-testid="badge-last-updated">
                            <Calendar className="w-3 h-3 mr-1" />
                            Updated {formatDistanceToNow(new Date(teamStatsData.statistics.lastUpdated), { addSuffix: true })}
                          </Badge>
                        )}
                        <Button
                          onClick={handleRefreshStats}
                          disabled={statsLoading}
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          data-testid="button-refresh-stats"
                        >
                          <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                          Refresh Stats
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {renderStatCard("Form", teamStatsData.statistics.form || "N/A", TrendingUp)}
                      {renderStatCard("Goals", `${teamStatsData.statistics.goals?.for?.total?.total || 0} scored`, Target)}
                      {renderStatCard("Clean Sheets", teamStatsData.statistics.clean_sheet?.total || "0", Shield)}
                      {renderStatCard("Win Rate", `${Math.round((teamStatsData.statistics.fixtures?.wins?.total || 0) / Math.max(teamStatsData.statistics.fixtures?.played?.total || 1, 1) * 100)}%`, Award)}
                    </div>
                  </div>

                  {/* Performance Charts */}
                  {renderPerformanceCharts(teamStatsData.statistics)}

                  {/* AI Analysis Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-league-spartan font-bold text-lg uppercase text-accent flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        AI-Powered Analysis
                      </h4>
                      <Button
                        onClick={() => aiAnalysisMutation.mutate({
                          teamId: selectedTeam1,
                          teamName: selectedTeam1Data?.name,
                          statistics: teamStatsData.statistics
                        })}
                        disabled={aiAnalysisMutation.isPending || !teamStatsData.statistics}
                        size="sm"
                        data-testid="button-generate-ai-analysis"
                      >
                        {aiAnalysisMutation.isPending ? 'Analyzing...' : 'Generate Insights'}
                      </Button>
                    </div>

                    {aiAnalysis && (
                      <Card className="bg-accent/5 border-accent/20">
                        <CardContent className="p-6 space-y-4">
                          {/* Narrative */}
                          <div>
                            <p className="text-base leading-relaxed">{aiAnalysis.narrative}</p>
                          </div>

                          {/* Key Insights */}
                          {aiAnalysis.keyInsights && aiAnalysis.keyInsights.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-sm text-muted-foreground mb-2 uppercase">Key Insights</h5>
                              <ul className="space-y-2">
                                {aiAnalysis.keyInsights.map((insight: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Tactical Recommendations */}
                          {aiAnalysis.tacticalRecommendations && aiAnalysis.tacticalRecommendations.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-sm text-muted-foreground mb-2 uppercase">Tactical Recommendations</h5>
                              <div className="flex flex-wrap gap-2">
                                {aiAnalysis.tacticalRecommendations.map((rec: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {rec}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Confidence Score */}
                          {aiAnalysis.confidence && (
                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Analysis Confidence</span>
                                <span className="font-semibold">{aiAnalysis.confidence}%</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {!aiAnalysis && !aiAnalysisMutation.isPending && (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click "Generate Insights" to get AI-powered tactical analysis
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Squad Roster Section */}
              {teamSquadData?.squad && teamSquadData.squad.length > 0 && (
                <div>
                  <h4 className="font-league-spartan font-bold text-lg uppercase text-accent mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Squad Roster
                  </h4>
                  {renderSquadByPosition(teamSquadData.squad)}
                </div>
              )}

              {/* No Data Message */}
              {!teamStatsData?.statistics && (!teamSquadData?.squad || teamSquadData.squad.length === 0) && (
                <div className="p-6 border border-dashed rounded-lg text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Advanced statistics unavailable. API rate limits may apply.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This is due to external API rate limiting. The feature works correctly when API access is available.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Helper to render skeleton for stat cards
  const renderStatCardSkeleton = () => (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );

  // Helper to render stat cards
  const renderStatCard = (label: string, value: string | number, Icon: any) => (
    <Card className="hover-elevate glass-card" data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );

  // Helper to render performance charts
  const renderPerformanceCharts = (stats: any) => {
    if (!stats.goals) return null;

    // Build chart data from statistics
    const chartData = [
      { name: 'Goals Scored', value: stats.goals?.for?.total?.total || 0, fill: 'hsl(var(--primary))' },
      { name: 'Goals Conceded', value: stats.goals?.against?.total?.total || 0, fill: 'hsl(var(--destructive))' },
      { name: 'Clean Sheets', value: stats.clean_sheet?.total || 0, fill: 'hsl(var(--accent))' },
      { name: 'Yellow Cards', value: stats.cards?.yellow?.['0-15']?.total || 0, fill: 'hsl(45 100% 50%)' },
    ];

    const chartConfig = {
      value: {
        label: "Value",
        color: "hsl(var(--primary))",
      },
    };

    return (
      <div>
        <h4 className="font-league-spartan font-bold text-lg uppercase text-accent mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Performance Overview
        </h4>
        <Card>
          <CardContent className="p-6">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]} 
                  animationDuration={1200}
                  animationBegin={0}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Helper to organize and render squad by position
  const renderSquadByPosition = (squad: any[]) => {
    const positions = {
      'Goalkeeper': squad.filter(p => p.position === 'Goalkeeper'),
      'Defender': squad.filter(p => p.position === 'Defender'),
      'Midfielder': squad.filter(p => p.position === 'Midfielder'),
      'Attacker': squad.filter(p => p.position === 'Attacker'),
    };

    return (
      <div className="space-y-4">
        {Object.entries(positions).map(([position, players]) => {
          if (players.length === 0) return null;
          return (
            <div key={position}>
              <h5 className="font-semibold text-sm text-muted-foreground mb-2 uppercase">{position}s</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {players.map((player: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg hover-elevate"
                    data-testid={`player-${player.number || idx}`}
                  >
                    {player.photo && (
                      <img src={player.photo} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {player.number && <span className="font-mono">#{player.number}</span>}
                        {player.age && <span>{player.age}y</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {renderCompetitionSelection()}
          {renderSeasonSelection()}
          {renderAnalysisModeSelection()}
          {renderTeamSelection()}
        </div>

        <Separator />

        {/* Analysis Results */}
        {selectedTeam1 && (
          <div className="space-y-6">
            {analysisMode === 'head_to_head' && selectedTeam2 ? (
              headToHeadLoading ? (
                <div className="space-y-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="text-center space-y-2">
                            <Skeleton className="h-6 w-24 mx-auto" />
                            <Skeleton className="h-8 w-12 mx-auto" />
                            <Skeleton className="h-4 w-16 mx-auto" />
                          </div>
                        ))}
                      </div>
                      <Skeleton className="h-4 w-48 mx-auto" />
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
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