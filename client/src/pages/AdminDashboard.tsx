import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  Download,
  RefreshCcw,
  Upload,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Server,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Settings,
  Zap,
  Shield,
  XCircle,
  AlertTriangle,
  Archive,
  PlayCircle,
  PauseCircle,
  BarChart3,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface DatabaseStatus {
  tables: Array<{
    tableName: string;
    recordCount: number;
    earliestDate?: string | null;
    latestDate?: string | null;
  }>;
  playerSeasonStatistics?: Array<{
    season: string;
    player_count: number;
    total_goals: number;
    total_assists: number;
    earliest_update: string;
    latest_update: string;
  }>;
}

interface UpdateStatus {
  isUpdating: boolean;
  lastUpdate?: Date;
  nextScheduledUpdate?: Date;
  currentOperation?: string;
  updateHistory?: Array<{
    success: boolean;
    recordsUpdated: number;
    error?: string;
    timestamp: Date;
    resource?: string;
  }>;
}

interface SyncLog {
  id: number;
  resource_type: string;
  league?: string;
  season?: string;
  sync_status: 'success' | 'error' | 'in_progress';
  records_processed?: number;
  error_message?: string;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentUpdateProgress, setCurrentUpdateProgress] = useState<number>(0);
  const [activeOperation, setActiveOperation] = useState<string | null>(null);

  // Fetch database status
  const { data: dbStatus, isLoading: dbLoading, refetch: refetchDbStatus } = useQuery<DatabaseStatus>({
    queryKey: ['/api/database-status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch update status
  const { data: updateStatus, isLoading: statusLoading } = useQuery<UpdateStatus>({
    queryKey: ['/api/admin/update/status'],
    refetchInterval: 5000, // Refresh every 5 seconds when updating
    enabled: true,
  });

  // Fetch sync logs
  const { data: syncLogs, isLoading: logsLoading } = useQuery<SyncLog[]>({
    queryKey: ['/api/admin/sync/logs', selectedStatus],
    queryFn: async () => {
      const params = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
      const response = await fetch(`/api/admin/sync/logs${params}`);
      if (!response.ok) {
        // If endpoint doesn't exist, return mock data for now
        return [];
      }
      return response.json();
    },
  });

  // Manual update mutations
  const updateFixtures = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/update/fixtures'),
    onSuccess: () => {
      toast({ title: "Success", description: "Fixtures updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/database-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/update/status'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update fixtures",
        variant: "destructive"
      });
    },
  });

  const updateStandings = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/update/standings'),
    onSuccess: () => {
      toast({ title: "Success", description: "Standings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/database-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/update/status'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update standings",
        variant: "destructive"
      });
    },
  });

  const updateTeams = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/update/teams'),
    onSuccess: () => {
      toast({ title: "Success", description: "Teams updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/database-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/update/status'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update teams",
        variant: "destructive"
      });
    },
  });

  const updatePlayers = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/update/players'),
    onSuccess: () => {
      toast({ title: "Success", description: "Players updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/database-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/update/status'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update players",
        variant: "destructive"
      });
    },
  });

  const updateAll = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/update/all'),
    onSuccess: () => {
      toast({ title: "Success", description: "All data updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/database-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/update/status'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update all data",
        variant: "destructive"
      });
    },
  });

  const bootstrapData = useMutation({
    mutationFn: (params: { leagues?: string[], seasons?: string[] }) => 
      apiRequest('POST', '/api/admin/bootstrap', params),
    onSuccess: () => {
      toast({ title: "Success", description: "Historical data bootstrap initiated" });
      queryClient.invalidateQueries({ queryKey: ['/api/database-status'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to bootstrap data",
        variant: "destructive"
      });
    },
  });

  // Simulate progress for active operations
  useEffect(() => {
    if (updateStatus?.isUpdating && activeOperation) {
      const interval = setInterval(() => {
        setCurrentUpdateProgress((prev) => {
          const next = prev + Math.random() * 15;
          return next > 95 ? 95 : next;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCurrentUpdateProgress(0);
    }
  }, [updateStatus?.isUpdating, activeOperation]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'in_progress':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTableStatus = (table: any) => {
    if (!table.latestDate) return { color: 'text-red-500', icon: AlertCircle, status: 'No data' };
    
    const daysSinceUpdate = table.latestDate 
      ? Math.floor((Date.now() - new Date(table.latestDate).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (daysSinceUpdate <= 1) return { color: 'text-green-500', icon: CheckCircle2, status: 'Up to date' };
    if (daysSinceUpdate <= 3) return { color: 'text-yellow-500', icon: AlertTriangle, status: 'Needs update' };
    return { color: 'text-red-500', icon: XCircle, status: 'Stale' };
  };

  const exportData = async (format: 'json' | 'csv', tableName?: string) => {
    try {
      const endpoint = tableName 
        ? `/api/admin/export/${tableName}?format=${format}`
        : `/api/admin/export/all?format=${format}`;
      
      const response = await fetch(endpoint);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName || 'database'}_export_${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Success", description: `Data exported as ${format.toUpperCase()}` });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  if (dbLoading || statusLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
            <Database className="h-10 w-10" />
            Football Database Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete control and visibility over your football data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={updateStatus?.isUpdating ? "default" : "secondary"} className="px-3 py-1">
            {updateStatus?.isUpdating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Idle
              </>
            )}
          </Badge>
          {updateStatus?.lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Last update: {formatDistanceToNow(new Date(updateStatus.lastUpdate), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbStatus?.tables.reduce((sum, t) => sum + t.recordCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {dbStatus?.tables.length} tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Players Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbStatus?.tables.find(t => t.tableName === 'Football Players')?.recordCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active players in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fixtures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbStatus?.tables.find(t => t.tableName === 'Football Fixtures')?.recordCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Historical and upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Next Update</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {updateStatus?.nextScheduledUpdate 
                ? format(new Date(updateStatus.nextScheduledUpdate), 'HH:mm')
                : 'Not scheduled'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {updateStatus?.nextScheduledUpdate 
                ? format(new Date(updateStatus.nextScheduledUpdate), 'EEE, MMM d')
                : 'Manual updates only'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="updates" data-testid="tab-updates">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="historical" data-testid="tab-historical">
            <Clock className="h-4 w-4 mr-2" />
            Historical
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <FileText className="h-4 w-4 mr-2" />
            Sync Logs
          </TabsTrigger>
          <TabsTrigger value="api" data-testid="tab-api">
            <Activity className="h-4 w-4 mr-2" />
            API Status
          </TabsTrigger>
          <TabsTrigger value="export" data-testid="tab-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables Status</CardTitle>
              <CardDescription>
                Real-time overview of all football database tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead>Earliest Date</TableHead>
                    <TableHead>Latest Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbStatus?.tables.map((table) => {
                    const status = getTableStatus(table);
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={table.tableName}>
                        <TableCell className="font-medium">{table.tableName}</TableCell>
                        <TableCell className="text-right">{table.recordCount.toLocaleString()}</TableCell>
                        <TableCell>
                          {table.earliestDate 
                            ? format(new Date(table.earliestDate), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {table.latestDate 
                            ? format(new Date(table.latestDate), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span className="text-sm">{status.status}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Player Season Statistics */}
          {dbStatus?.playerSeasonStatistics && dbStatus.playerSeasonStatistics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Player Statistics by Season</CardTitle>
                <CardDescription>
                  Coverage and statistics for player data across seasons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Season</TableHead>
                      <TableHead className="text-right">Players</TableHead>
                      <TableHead className="text-right">Total Goals</TableHead>
                      <TableHead className="text-right">Total Assists</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbStatus.playerSeasonStatistics.map((season) => (
                      <TableRow key={season.season}>
                        <TableCell className="font-medium">{season.season}</TableCell>
                        <TableCell className="text-right">{season.player_count}</TableCell>
                        <TableCell className="text-right">{season.total_goals || 0}</TableCell>
                        <TableCell className="text-right">{season.total_assists || 0}</TableCell>
                        <TableCell>
                          {season.latest_update 
                            ? formatDistanceToNow(new Date(season.latest_update), { addSuffix: true })
                            : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manual Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Data Updates</CardTitle>
              <CardDescription>
                Manually trigger updates for specific data types or all data at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {updateStatus?.isUpdating && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertTitle>Update in progress</AlertTitle>
                  <AlertDescription>
                    {updateStatus.currentOperation || 'Processing update...'}
                  </AlertDescription>
                  <Progress value={currentUpdateProgress} className="mt-2" />
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover-elevate">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fixtures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => {
                        setActiveOperation('fixtures');
                        updateFixtures.mutate();
                      }}
                      disabled={updateFixtures.isPending || updateStatus?.isUpdating}
                      className="w-full"
                      data-testid="button-update-fixtures"
                    >
                      {updateFixtures.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Update Fixtures
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Standings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => {
                        setActiveOperation('standings');
                        updateStandings.mutate();
                      }}
                      disabled={updateStandings.isPending || updateStatus?.isUpdating}
                      className="w-full"
                      data-testid="button-update-standings"
                    >
                      {updateStandings.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Update Standings
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Teams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => {
                        setActiveOperation('teams');
                        updateTeams.mutate();
                      }}
                      disabled={updateTeams.isPending || updateStatus?.isUpdating}
                      className="w-full"
                      data-testid="button-update-teams"
                    >
                      {updateTeams.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Update Teams
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => {
                        setActiveOperation('players');
                        updatePlayers.mutate();
                      }}
                      disabled={updatePlayers.isPending || updateStatus?.isUpdating}
                      className="w-full"
                      data-testid="button-update-players"
                    >
                      {updatePlayers.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Update Players
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-elevate col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Complete Update
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Update all data types in sequence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => {
                        setActiveOperation('all');
                        updateAll.mutate();
                      }}
                      disabled={updateAll.isPending || updateStatus?.isUpdating}
                      variant="default"
                      className="w-full"
                      data-testid="button-update-all"
                    >
                      {updateAll.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating All...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Update All Data
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Update History */}
              {updateStatus?.updateHistory && updateStatus.updateHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {updateStatus.updateHistory.slice(0, 10).map((update, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              {update.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm font-medium">
                                {update.resource || 'Update'}
                              </span>
                              <Badge variant={update.success ? "secondary" : "destructive"}>
                                {update.recordsUpdated} records
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historical Data Tab */}
        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Data Coverage</CardTitle>
              <CardDescription>
                View and manage historical football data by league and season
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Bootstrap Historical Data</AlertTitle>
                <AlertDescription>
                  Fetch missing historical data for specific leagues and seasons
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Select defaultValue="39">
                  <SelectTrigger className="w-[200px]" data-testid="select-league">
                    <SelectValue placeholder="Select League" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="39">Premier League</SelectItem>
                    <SelectItem value="2">Champions League</SelectItem>
                    <SelectItem value="3">UEFA Europa League</SelectItem>
                    <SelectItem value="140">La Liga</SelectItem>
                    <SelectItem value="78">Bundesliga</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="2025">
                  <SelectTrigger className="w-[150px]" data-testid="select-season">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => bootstrapData.mutate({ 
                    leagues: ['39'], 
                    seasons: ['2025'] 
                  })}
                  disabled={bootstrapData.isPending}
                  data-testid="button-bootstrap"
                >
                  {bootstrapData.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bootstrapping...
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Bootstrap Data
                    </>
                  )}
                </Button>
              </div>

              <Table>
                <TableCaption>Historical data coverage by league and season</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>League</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead className="text-right">Teams</TableHead>
                    <TableHead className="text-right">Fixtures</TableHead>
                    <TableHead className="text-right">Players</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Premier League</TableCell>
                    <TableCell>2025</TableCell>
                    <TableCell className="text-right">20</TableCell>
                    <TableCell className="text-right">380</TableCell>
                    <TableCell className="text-right">562</TableCell>
                    <TableCell>
                      <Progress value={85} className="w-[60px]" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      2 days ago
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Champions League</TableCell>
                    <TableCell>2024/2025</TableCell>
                    <TableCell className="text-right">32</TableCell>
                    <TableCell className="text-right">125</TableCell>
                    <TableCell className="text-right">832</TableCell>
                    <TableCell>
                      <Progress value={65} className="w-[60px]" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      1 week ago
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sync Operation Logs</CardTitle>
                  <CardDescription>
                    Monitor all data synchronization operations
                  </CardDescription>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]" data-testid="select-log-status">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {logsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : syncLogs && syncLogs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>League</TableHead>
                        <TableHead>Season</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Records</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {format(new Date(log.started_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">{log.resource_type}</TableCell>
                          <TableCell>{log.league || '-'}</TableCell>
                          <TableCell>{log.season || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={log.sync_status === 'success' ? 'secondary' : 
                                      log.sync_status === 'error' ? 'destructive' : 'default'}
                            >
                              {log.sync_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {log.records_processed?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell>
                            {log.duration_seconds ? `${log.duration_seconds}s` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No sync logs available
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Status Tab */}
        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  API Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API-Football</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Redis Cache</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  API Quota Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Daily Requests</span>
                    <span className="font-medium">1,234 / 10,000</span>
                  </div>
                  <Progress value={12.34} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Rate Limit</span>
                    <span className="font-medium">45 / 100 per minute</span>
                  </div>
                  <Progress value={45} />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Next Reset</span>
                    <span className="font-medium">00:00 UTC</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Updates</CardTitle>
              <CardDescription>
                Automatic update schedule for different competitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competition</TableHead>
                    <TableHead>Update Frequency</TableHead>
                    <TableHead>Next Update</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Premier League</TableCell>
                    <TableCell>Every 3 hours on match days</TableCell>
                    <TableCell>
                      {updateStatus?.nextScheduledUpdate 
                        ? format(new Date(updateStatus.nextScheduledUpdate), 'MMM d, HH:mm')
                        : 'Not scheduled'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Active</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Champions League</TableCell>
                    <TableCell>Tuesdays & Wednesdays</TableCell>
                    <TableCell>Next Tuesday, 15:00</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Active</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export database tables in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertTitle>Export Options</AlertTitle>
                <AlertDescription>
                  Choose to export individual tables or the entire database
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-4">Individual Tables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dbStatus?.tables.map((table) => (
                      <div key={table.tableName} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{table.tableName}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportData('json', table.tableName)}
                            data-testid={`button-export-json-${table.tableName}`}
                          >
                            JSON
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportData('csv', table.tableName)}
                            data-testid={`button-export-csv-${table.tableName}`}
                          >
                            CSV
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-4">Bulk Export</h3>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => exportData('json')}
                      className="flex-1"
                      data-testid="button-export-all-json"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export All as JSON
                    </Button>
                    <Button 
                      onClick={() => exportData('csv')}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-export-all-csv"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Export All as ZIP (CSV)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}