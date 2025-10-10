import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from "@/components/Header";
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  XCircle,
  Wand2
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DuplicatePlayer {
  name: string;
  count: number;
  records: {
    id: number;
    name: string;
    player_id: number | null;
    photo: string | null;
    position: string | null;
    nationality: string | null;
  }[];
}

interface PlayerRecord {
  id: number;
  name: string;
  player_id?: number | null;
  photo: string | null;
  position: string | null;
  nationality: string | null;
}

interface OrphanedStat {
  id: number;
  player_id: number;
  team_id: number | null;
  league_id: number | null;
  season: number | null;
  goals: number | null;
  assists: number | null;
  appearances: number | null;
}

interface DataAuditResponse {
  summary: {
    totalPlayers: number;
    totalPlayerStats: number;
    duplicatePlayersCount: number;
    missingPlayerIdCount: number;
    missingPhotosCount: number;
    orphanedStatsCount: number;
  };
  duplicatePlayers: DuplicatePlayer[];
  missingPlayerIds: {
    count: number;
    records: PlayerRecord[];
  };
  missingPhotos: {
    count: number;
    records: PlayerRecord[];
  };
  orphanedStats: {
    count: number;
    records: OrphanedStat[];
  };
}

export default function DataAudit() {
  const { toast } = useToast();
  
  const { data, isLoading, refetch, isFetching } = useQuery<DataAuditResponse>({
    queryKey: ['/api/admin/data-audit'],
    refetchOnWindowFocus: false
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/data-audit'] });
    refetch();
  };

  // Mutation for cleaning player IDs
  const cleanPlayerIdsMutation = useMutation({
    mutationFn: async (season?: number) => {
      const url = season 
        ? `/api/admin/clean-player-ids?season=${season}` 
        : '/api/admin/clean-player-ids';
      const res = await apiRequest('POST', url);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Processing Started",
        description: `Cleaning ${data.totalPlayers || 0} players in progress. Refresh page to see updates.`,
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

  // Mutation for fixing photos
  const fixPhotosMutation = useMutation({
    mutationFn: async (season?: number) => {
      const url = season 
        ? `/api/admin/fix-photos?season=${season}` 
        : '/api/admin/fix-photos';
      const res = await apiRequest('POST', url);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Processing Started",
        description: `Fixing photos for ${data.totalPlayers || 0} players in progress. Refresh page to see updates.`,
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Starting Photo Fixing",
        description: error.message || "Failed to start photo fixing",
        variant: "destructive"
      });
    }
  });

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

  const hasIssues = (
    (data?.summary.duplicatePlayersCount || 0) > 0 ||
    (data?.summary.missingPlayerIdCount || 0) > 0 ||
    (data?.summary.missingPhotosCount || 0) > 0 ||
    (data?.summary.orphanedStatsCount || 0) > 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="heading-data-audit">Data Audit</h1>
              <p className="text-muted-foreground">Diagnose football database issues</p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isFetching}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Alert */}
        <Alert className={`mb-6 ${hasIssues ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
          {hasIssues ? (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <AlertTitle data-testid="text-summary-title">
            {hasIssues ? 'Issues Found' : 'All Clear'}
          </AlertTitle>
          <AlertDescription className="text-sm" data-testid="text-summary-description">
            <strong>Total Players:</strong> {data?.summary.totalPlayers || 0} | 
            <strong className="ml-2">Total Player Stats:</strong> {data?.summary.totalPlayerStats || 0}
            {hasIssues && (
              <>
                <br />
                <strong className="text-yellow-600 dark:text-yellow-400">Issues:</strong>{' '}
                {data?.summary.duplicatePlayersCount || 0} duplicates, {' '}
                {data?.summary.missingPlayerIdCount || 0} missing IDs, {' '}
                {data?.summary.missingPhotosCount || 0} missing photos, {' '}
                {data?.summary.orphanedStatsCount || 0} orphaned stats
              </>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Duplicate Players Card */}
          <Card data-testid="card-duplicate-players">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Duplicate Players
                <Badge variant={data?.summary.duplicatePlayersCount ? 'destructive' : 'secondary'} data-testid="badge-duplicates-count">
                  {data?.summary.duplicatePlayersCount || 0}
                </Badge>
              </CardTitle>
              <CardDescription>Players with identical names</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.duplicatePlayers && data.duplicatePlayers.length > 0 ? (
                <div className="space-y-4">
                  {data.duplicatePlayers.slice(0, 10).map((dup, idx) => (
                    <div key={idx} className="border rounded-lg p-3" data-testid={`duplicate-group-${idx}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold" data-testid={`duplicate-name-${idx}`}>{dup.name}</h4>
                        <Badge variant="outline" data-testid={`duplicate-count-${idx}`}>{dup.count} records</Badge>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Player ID</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Photo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dup.records.map((record) => (
                            <TableRow key={record.id} data-testid={`duplicate-record-${record.id}`}>
                              <TableCell data-testid={`duplicate-id-${record.id}`}>{record.id}</TableCell>
                              <TableCell data-testid={`duplicate-player-id-${record.id}`}>
                                {record.player_id || <Badge variant="outline">NULL</Badge>}
                              </TableCell>
                              <TableCell>{record.position || '-'}</TableCell>
                              <TableCell>
                                {record.photo ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                  {data.duplicatePlayers.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Showing 10 of {data.duplicatePlayers.length} duplicate groups
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-duplicates">
                  No duplicate players found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Missing Player IDs Card */}
          <Card data-testid="card-missing-player-ids">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Missing Player IDs
                  <Badge variant={data?.missingPlayerIds.count ? 'destructive' : 'secondary'} data-testid="badge-missing-ids-count">
                    {data?.missingPlayerIds.count || 0}
                  </Badge>
                </CardTitle>
                <CardDescription>Players without external player_id</CardDescription>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => cleanPlayerIdsMutation.mutate(undefined)}
                disabled={!data?.missingPlayerIds.count || cleanPlayerIdsMutation.isPending}
                data-testid="button-clean-player-ids"
              >
                {cleanPlayerIdsMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Clean Player IDs
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {data?.missingPlayerIds.records && data.missingPlayerIds.records.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Nationality</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.missingPlayerIds.records.map((player) => (
                        <TableRow key={player.id} data-testid={`missing-id-record-${player.id}`}>
                          <TableCell data-testid={`missing-id-${player.id}`}>{player.id}</TableCell>
                          <TableCell data-testid={`missing-id-name-${player.id}`}>{player.name}</TableCell>
                          <TableCell>{player.position || '-'}</TableCell>
                          <TableCell>{player.nationality || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.missingPlayerIds.count > data.missingPlayerIds.records.length && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Showing {data.missingPlayerIds.records.length} of {data.missingPlayerIds.count}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-missing-ids">
                  All players have player IDs
                </p>
              )}
            </CardContent>
          </Card>

          {/* Missing Photos Card */}
          <Card data-testid="card-missing-photos">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Missing Photos
                  <Badge variant={data?.missingPhotos.count ? 'destructive' : 'secondary'} data-testid="badge-missing-photos-count">
                    {data?.missingPhotos.count || 0}
                  </Badge>
                </CardTitle>
                <CardDescription>Players with NULL or empty photo URLs</CardDescription>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => fixPhotosMutation.mutate(undefined)}
                disabled={!data?.missingPhotos.count || fixPhotosMutation.isPending}
                data-testid="button-fix-photos"
              >
                {fixPhotosMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Fix Photos
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {data?.missingPhotos.records && data.missingPhotos.records.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Player ID</TableHead>
                        <TableHead>Photo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.missingPhotos.records.map((player) => (
                        <TableRow key={player.id} data-testid={`missing-photo-record-${player.id}`}>
                          <TableCell data-testid={`missing-photo-id-${player.id}`}>{player.id}</TableCell>
                          <TableCell data-testid={`missing-photo-name-${player.id}`}>{player.name}</TableCell>
                          <TableCell>{player.player_id || <Badge variant="outline">NULL</Badge>}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" data-testid={`missing-photo-status-${player.id}`}>
                              {player.photo === null ? 'NULL' : 'EMPTY'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.missingPhotos.count > data.missingPhotos.records.length && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Showing {data.missingPhotos.records.length} of {data.missingPhotos.count}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-missing-photos">
                  All players have photo URLs
                </p>
              )}
            </CardContent>
          </Card>

          {/* Orphaned Stats Card */}
          <Card data-testid="card-orphaned-stats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Orphaned Statistics
                <Badge variant={data?.orphanedStats.count ? 'destructive' : 'secondary'} data-testid="badge-orphaned-stats-count">
                  {data?.orphanedStats.count || 0}
                </Badge>
              </CardTitle>
              <CardDescription>Stats with player_id not in football_players</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.orphanedStats.records && data.orphanedStats.records.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stat ID</TableHead>
                        <TableHead>Player ID</TableHead>
                        <TableHead>Season</TableHead>
                        <TableHead>Goals</TableHead>
                        <TableHead>Assists</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orphanedStats.records.map((stat) => (
                        <TableRow key={stat.id} data-testid={`orphaned-stat-record-${stat.id}`}>
                          <TableCell data-testid={`orphaned-stat-id-${stat.id}`}>{stat.id}</TableCell>
                          <TableCell data-testid={`orphaned-stat-player-id-${stat.id}`}>
                            <Badge variant="destructive">{stat.player_id}</Badge>
                          </TableCell>
                          <TableCell>{stat.season || '-'}</TableCell>
                          <TableCell>{stat.goals ?? '-'}</TableCell>
                          <TableCell>{stat.assists ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.orphanedStats.count > data.orphanedStats.records.length && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Showing {data.orphanedStats.records.length} of {data.orphanedStats.count}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-orphaned-stats">
                  No orphaned statistics found
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
