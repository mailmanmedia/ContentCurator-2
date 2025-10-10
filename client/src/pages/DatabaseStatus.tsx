
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import { Database, Calendar, AlertCircle, CheckCircle, Clock, Users, Trophy, Shield, Wand2, ExternalLink, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TableStats {
  tableName: string;
  recordCount: number;
  earliestDate: string | null;
  latestDate: string | null;
}

interface PlayerSeasonStats {
  season: number;
  playerCount: number;
  totalGoals: number;
  totalAssists: number;
  earliestUpdate: string;
  latestUpdate: string;
}

interface Team {
  id: number;
  name: string;
}

interface League {
  id: number;
  name: string;
}

interface DatabaseStatusData {
  tables: TableStats[];
  playerSeasons: PlayerSeasonStats[];
  allTeams: Team[];
  allSeasons: { season: number }[];
  allLeagues: League[];
  lastApiUpdate: string | null;
  dataSource: 'api' | 'historical';
}

interface DataAuditSummary {
  totalPlayers: number;
  totalPlayerStats: number;
  duplicatePlayersCount: number;
  missingPlayerIdCount: number;
  missingPhotosCount: number;
  orphanedStatsCount: number;
}

interface DataAuditResponse {
  summary: DataAuditSummary;
}

export default function DatabaseStatus() {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [selectedLeague, setSelectedLeague] = useState<string>("all");

  const { data, isLoading } = useQuery<DatabaseStatusData>({
    queryKey: ['/api/database-status']
  });

  const { data: auditData } = useQuery<DataAuditResponse>({
    queryKey: ['/api/admin/data-audit'],
    refetchOnWindowFocus: false
  });

  const { data: playersData } = useQuery({
    queryKey: ['/api/database/players', selectedTeam, selectedSeason, selectedLeague],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTeam !== "all") params.append("teamId", selectedTeam);
      if (selectedSeason !== "all") params.append("season", selectedSeason);
      if (selectedLeague !== "all") params.append("leagueId", selectedLeague);
      
      const res = await fetch(`/api/database/players?${params}`);
      return res.json();
    },
    enabled: !!data
  });

  const cleanPlayerIdsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/clean-player-ids');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/data-audit'] });
      queryClient.invalidateQueries({ queryKey: ['/api/database-status'] });
      toast({
        title: "Data cleaning started",
        description: "Refresh to see results.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Starting Player ID Cleaning",
        description: error.message || "Failed to start player ID cleaning",
        variant: "destructive"
      });
    }
  });

  const getBadgeVariant = (count: number) => {
    if (count === 0) return 'default';
    if (count <= 10) return 'secondary';
    return 'destructive';
  };

  const getBadgeColor = (count: number) => {
    if (count === 0) return 'text-green-600 dark:text-green-400';
    if (count <= 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Database Status</h1>
            <p className="text-muted-foreground">View data availability and update information</p>
          </div>
        </div>

        {/* Data Source Alert */}
        <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <strong>Data Source:</strong> {data?.dataSource === 'api' ? 'Live API updates enabled' : 'Using authentic historical data (2020-2025) due to API rate limits. Live updates will resume when API access is restored.'}
            <br />
            <strong>Last Updated:</strong> {data?.lastApiUpdate ? formatDistanceToNow(new Date(data.lastApiUpdate), { addSuffix: true }) : 'Never'}
          </AlertDescription>
        </Alert>

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Database Filters
            </CardTitle>
            <CardDescription>Filter teams, players, leagues, and seasons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Team Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams ({data?.allTeams?.length || 0})</SelectItem>
                    {data?.allTeams && data.allTeams.length > 0 ? (
                      data.allTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No teams available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Season Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Season</label>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons ({data?.allSeasons?.length || 0})</SelectItem>
                    {data?.allSeasons && data.allSeasons.length > 0 ? (
                      data.allSeasons.map((s) => (
                        <SelectItem key={s.season} value={s.season.toString()}>
                          {s.season}/{(s.season + 1).toString().slice(-2)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No seasons available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* League Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">League</label>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues ({data?.allLeagues?.length || 0})</SelectItem>
                    {data?.allLeagues && data.allLeagues.length > 0 ? (
                      data.allLeagues.map((league) => (
                        <SelectItem key={league.id} value={league.id.toString()}>
                          {league.name || `League ${league.id}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No leagues available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Players Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Players</label>
                <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {playersData?.players?.length || 0} total
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Quality Section */}
        <Card className="mb-6" data-testid="card-data-quality">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Data Quality
            </CardTitle>
            <CardDescription>
              Monitor database integrity and data issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Duplicate Players */}
              <div 
                className="flex flex-col gap-2 p-4 rounded-lg border bg-card"
                data-testid="metric-duplicate-players"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Duplicate Players</span>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" data-testid="count-duplicate-players">
                    {auditData?.summary.duplicatePlayersCount ?? 0}
                  </span>
                  <Badge 
                    variant={getBadgeVariant(auditData?.summary.duplicatePlayersCount ?? 0)}
                    className={getBadgeColor(auditData?.summary.duplicatePlayersCount ?? 0)}
                    data-testid="badge-duplicate-players"
                  >
                    {(auditData?.summary.duplicatePlayersCount ?? 0) === 0 ? 'Clear' : 'Issues'}
                  </Badge>
                </div>
              </div>

              {/* Missing Player IDs */}
              <div 
                className="flex flex-col gap-2 p-4 rounded-lg border bg-card"
                data-testid="metric-missing-player-ids"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Missing Player IDs</span>
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" data-testid="count-missing-player-ids">
                    {auditData?.summary.missingPlayerIdCount ?? 0}
                  </span>
                  <Badge 
                    variant={getBadgeVariant(auditData?.summary.missingPlayerIdCount ?? 0)}
                    className={getBadgeColor(auditData?.summary.missingPlayerIdCount ?? 0)}
                    data-testid="badge-missing-player-ids"
                  >
                    {(auditData?.summary.missingPlayerIdCount ?? 0) === 0 ? 'Clear' : 'Issues'}
                  </Badge>
                </div>
              </div>

              {/* Missing Photos */}
              <div 
                className="flex flex-col gap-2 p-4 rounded-lg border bg-card"
                data-testid="metric-missing-photos"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Missing Photos</span>
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" data-testid="count-missing-photos">
                    {auditData?.summary.missingPhotosCount ?? 0}
                  </span>
                  <Badge 
                    variant={getBadgeVariant(auditData?.summary.missingPhotosCount ?? 0)}
                    className={getBadgeColor(auditData?.summary.missingPhotosCount ?? 0)}
                    data-testid="badge-missing-photos"
                  >
                    {(auditData?.summary.missingPhotosCount ?? 0) === 0 ? 'Clear' : 'Issues'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/data-audit">
                <Button variant="outline" data-testid="button-view-full-audit">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Audit
                </Button>
              </Link>
              <Button
                variant="default"
                onClick={() => cleanPlayerIdsMutation.mutate()}
                disabled={cleanPlayerIdsMutation.isPending || (auditData?.summary.missingPlayerIdCount ?? 0) === 0}
                data-testid="button-quick-clean"
              >
                {cleanPlayerIdsMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Quick Clean
                  </>
                )}
              </Button>
            </div>

            {/* Last Check Timestamp */}
            {data?.lastApiUpdate && (
              <div className="text-sm text-muted-foreground" data-testid="text-last-check">
                Last quality check: {formatDistanceToNow(new Date(data.lastApiUpdate), { addSuffix: true })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtered Players List */}
        {playersData?.players && playersData.players.length > 0 && (selectedTeam !== "all" || selectedSeason !== "all" || selectedLeague !== "all") && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Filtered Players ({playersData.players.length})
              </CardTitle>
              <CardDescription>
                {selectedTeam !== "all" && data?.allTeams.find(t => t.id.toString() === selectedTeam)?.name}
                {selectedTeam !== "all" && selectedSeason !== "all" && " • "}
                {selectedSeason !== "all" && `${parseInt(selectedSeason) - 1}/${selectedSeason.slice(-2)} Season`}
                {(selectedTeam !== "all" || selectedSeason !== "all") && selectedLeague !== "all" && " • "}
                {selectedLeague !== "all" && data?.allLeagues.find(l => l.id.toString() === selectedLeague)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {playersData.players.map((player: any) => (
                  <div 
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
                    data-testid={`player-row-${player.id}`}
                  >
                    <img 
                      src={player.photo || '/placeholder-player.png'} 
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-player.png';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {player.position && <span>{player.position}</span>}
                        {player.nationality && <span>• {player.nationality}</span>}
                      </div>
                      {(player.goals !== undefined || player.assists !== undefined || player.appearances !== undefined) && (
                        <div className="flex gap-3 mt-1 text-xs">
                          {player.goals !== undefined && <span className="text-green-600 dark:text-green-400">{player.goals}G</span>}
                          {player.assists !== undefined && <span className="text-blue-600 dark:text-blue-400">{player.assists}A</span>}
                          {player.appearances !== undefined && <span className="text-muted-foreground">{player.appearances} apps</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Season Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Liverpool FC Player Statistics
            </CardTitle>
            <CardDescription>
              Historical season data with goals, assists, and appearances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.playerSeasons.map((season) => (
                <div 
                  key={season.season}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
                  data-testid={`season-${season.season}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={season.season >= 2024 ? "default" : "secondary"}>
                        {season.season - 1}/{season.season.toString().slice(-2)} Season
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {season.playerCount} players
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span data-testid={`goals-${season.season}`}>
                        <strong className="text-foreground">{season.totalGoals}</strong> goals
                      </span>
                      <span data-testid={`assists-${season.season}`}>
                        <strong className="text-foreground">{season.totalAssists}</strong> assists
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Updated {formatDistanceToNow(new Date(season.latestUpdate), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!data?.playerSeasons || data.playerSeasons.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No player statistics available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Other Database Tables
            </CardTitle>
            <CardDescription>
              Content, fixtures, and production data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {data?.tables.map((table) => (
                <div 
                  key={table.tableName}
                  className="p-4 rounded-lg border bg-card"
                  data-testid={`table-${table.tableName.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{table.tableName}</h3>
                    <Badge variant="outline" data-testid={`count-${table.tableName.toLowerCase().replace(/\s+/g, '-')}`}>
                      {table.recordCount.toLocaleString()} records
                    </Badge>
                  </div>
                  
                  {table.earliestDate && table.latestDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(table.earliestDate).toLocaleDateString()} - {new Date(table.latestDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {table.recordCount === 0 && (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-6 border-amber-500/50 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Data Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>Player Statistics:</strong> Authentic historical data covering Liverpool FC seasons 2020-2025. Data includes goals, assists, appearances, and minutes for the squad's top performers each season.
            </p>
            <p>
              <strong>Teams & Leagues:</strong> {data?.allTeams.length || 0} teams across {data?.allLeagues.length || 0} leagues with {data?.allSeasons.length || 0} seasons of data.
            </p>
            <p>
              <strong>RSS Articles:</strong> Live feed monitoring from Liverpool FC official sources, fan sites, and media outlets with sentiment analysis.
            </p>
            <p>
              <strong>Update Frequency:</strong> Database automatically updates after every Liverpool FC match when API access is available. Historical data is used as fallback during rate limit periods.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
