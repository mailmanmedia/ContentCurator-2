import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import { Database, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface DatabaseStatusData {
  tables: TableStats[];
  playerSeasons: PlayerSeasonStats[];
  lastApiUpdate: string | null;
  dataSource: 'api' | 'historical';
}

export default function DatabaseStatus() {
  const { data, isLoading } = useQuery<DatabaseStatusData>({
    queryKey: ['/api/database-status']
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
            <strong>Data Source:</strong> {data?.dataSource === 'api' ? 'Live API updates enabled' : 'Using authentic historical data (2020-2024) due to API rate limits. Live updates will resume when API access is restored.'}
          </AlertDescription>
        </Alert>

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
              <strong>Player Statistics:</strong> Authentic historical data covering Liverpool FC seasons 2020-2024. Data includes goals, assists, appearances, and minutes for the squad's top performers each season.
            </p>
            <p>
              <strong>RSS Articles:</strong> Live feed monitoring from Liverpool FC official sources, fan sites, and media outlets with sentiment analysis.
            </p>
            <p>
              <strong>Historical Head-to-Head:</strong> Match data from 2020-present for Liverpool vs Premier League, Champions League, FA Cup, and League Cup opponents.
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
