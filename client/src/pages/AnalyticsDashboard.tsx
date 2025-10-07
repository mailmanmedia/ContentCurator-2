import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  Shield,
  Zap,
  Trophy,
  Calendar,
  Users,
  Activity,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import Header from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardData {
  overview: {
    position: number;
    points: number;
    played: number;
    form: string;
    goalDifference: number;
  };
  keyMetrics: {
    formIndex: { value: number; interpretation: string };
    expectedPoints: { value: number; interpretation: string };
    goalEfficiency: { value: number; interpretation: string };
    defensiveSolidityIndex: { value: number; interpretation: string };
    slotIntensityIndex: { value: number; interpretation: string };
  };
  performance: {
    goalsScored: number;
    goalsConceded: number;
    cleanSheets: number;
    avgPossession: number;
    wins: number;
    draws: number;
    losses: number;
  };
  topPlayers: Array<{
    name: string;
    goals: number;
    assists: number;
    appearances: number;
  }>;
  upcomingFixtures: Array<{
    opponent: string;
    date: string;
    venue: string;
  }>;
  lastUpdated: string;
}

interface SeasonProgressionData {
  ppgTrajectory: Array<{
    matchNumber: number;
    date: string;
    opponent: string;
    result: string;
    score: string;
    points: number;
    cumulativePoints: number;
    ppg: number;
    goalDifference: number;
  }>;
  projections: {
    titleRaceIndex: { value: number; interpretation: string };
    top4Probability: { value: number; interpretation: string };
  };
}

interface TacticalAnalysisData {
  pressing: {
    successRate: { value: number; interpretation: string };
  };
  possession: {
    efficiency: { value: number; interpretation: string };
  };
  counterAttacks: {
    effectiveness: { value: number; interpretation: string };
  };
  setPieces: {
    threatIndex: { value: number; interpretation: string };
  };
}

interface RssMetricsData {
  sentiment: {
    aggregatedScore: { value: number; interpretation: string };
    sampleSize: number;
  };
  trending: {
    topicScore: { value: number; interpretation: string };
  };
  coverage: {
    intensity: { value: number; interpretation: string };
    diversity: { value: number; interpretation: string };
  };
  recentArticles: number;
}

interface ComparativeData {
  vsLeagueAverage: {
    goalsFor: { value: number; interpretation: string };
    goalsAgainst: { value: number; interpretation: string };
    xG: { value: number; interpretation: string };
  };
  strengthOfSchedule: {
    adjustment: { value: number; interpretation: string };
  };
  leagueStandings: Array<{
    position: number;
    name: string;
    points: number;
    played: number;
    goalDifference: number;
    form: string;
  }>;
}

export default function AnalyticsDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    value: number;
    interpretation: string;
  } | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "tactical" | "comparison">("overview");

  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: seasonData, isLoading: seasonLoading } = useQuery<SeasonProgressionData>({
    queryKey: ["/api/analytics/season-progression"],
  });

  const { data: tacticalData, isLoading: tacticalLoading } = useQuery<TacticalAnalysisData>({
    queryKey: ["/api/analytics/tactical-analysis"],
  });

  const { data: rssData, isLoading: rssLoading } = useQuery<RssMetricsData>({
    queryKey: ["/api/analytics/rss-metrics"],
  });

  const { data: comparativeData, isLoading: comparativeLoading } = useQuery<ComparativeData>({
    queryKey: ["/api/analytics/comparative-metrics"],
  });

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchDashboard();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetchDashboard]);

  const getTrendIcon = (interpretation: string) => {
    if (interpretation.includes("Excellent") || interpretation.includes("Strong") || interpretation.includes("Dominant")) {
      return <TrendingUp className="w-4 h-4 text-[#00B140]" data-testid="icon-trend-up" />;
    }
    if (interpretation.includes("Poor") || interpretation.includes("Weak") || interpretation.includes("Concerning")) {
      return <TrendingDown className="w-4 h-4 text-[#C8102E]" data-testid="icon-trend-down" />;
    }
    return <Minus className="w-4 h-4 text-[#FDB913]" data-testid="icon-trend-neutral" />;
  };

  const getMetricColor = (interpretation: string) => {
    if (interpretation.includes("Excellent") || interpretation.includes("Strong") || interpretation.includes("Dominant")) {
      return "text-[#00B140]";
    }
    if (interpretation.includes("Poor") || interpretation.includes("Weak") || interpretation.includes("Concerning")) {
      return "text-[#C8102E]";
    }
    return "text-[#FDB913]";
  };

  const getMetricBgColor = (interpretation: string) => {
    if (interpretation.includes("Excellent") || interpretation.includes("Strong") || interpretation.includes("Dominant")) {
      return "bg-[#00B140]/10";
    }
    if (interpretation.includes("Poor") || interpretation.includes("Weak") || interpretation.includes("Concerning")) {
      return "bg-[#C8102E]/10";
    }
    return "bg-[#FDB913]/10";
  };

  const handleExportDashboard = () => {
    console.log("Export dashboard functionality would be implemented here");
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-league-spartan font-black text-foreground" data-testid="text-page-title">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground font-libre-franklin">
              Liverpool FC Performance Intelligence
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="button-toggle-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDashboard}
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="tactical" data-testid="tab-tactical">Tactical</TabsTrigger>
            <TabsTrigger value="comparison" data-testid="tab-comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedMetric({
                  title: "Slot Intensity Index (SII)",
                  value: dashboardData?.keyMetrics?.slotIntensityIndex?.value ?? 0,
                  interpretation: dashboardData?.keyMetrics?.slotIntensityIndex?.interpretation ?? ""
                })}
                data-testid="card-metric-sii"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Slot Intensity Index</CardTitle>
                  <Zap className="w-5 h-5 text-[#C8102E]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {(dashboardData?.keyMetrics?.slotIntensityIndex?.value ?? 0).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getTrendIcon(dashboardData?.keyMetrics?.slotIntensityIndex?.interpretation ?? "")}
                    <p className={`text-xs ${getMetricColor(dashboardData?.keyMetrics?.slotIntensityIndex?.interpretation ?? "")}`}>
                      {dashboardData?.keyMetrics?.slotIntensityIndex?.interpretation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedMetric({
                  title: "Form Index",
                  value: dashboardData?.keyMetrics?.formIndex?.value ?? 0,
                  interpretation: dashboardData?.keyMetrics?.formIndex?.interpretation ?? ""
                })}
                data-testid="card-metric-form"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Form Index</CardTitle>
                  <Activity className="w-5 h-5 text-[#C8102E]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {(dashboardData?.keyMetrics?.formIndex?.value ?? 0).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getTrendIcon(dashboardData?.keyMetrics?.formIndex?.interpretation ?? "")}
                    <p className={`text-xs ${getMetricColor(dashboardData?.keyMetrics?.formIndex?.interpretation ?? "")}`}>
                      {dashboardData?.keyMetrics?.formIndex?.interpretation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedMetric({
                  title: "Expected Points (xPTS)",
                  value: dashboardData?.keyMetrics?.expectedPoints?.value ?? 0,
                  interpretation: dashboardData?.keyMetrics?.expectedPoints?.interpretation ?? ""
                })}
                data-testid="card-metric-xpts"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expected Points</CardTitle>
                  <Target className="w-5 h-5 text-[#C8102E]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {(dashboardData?.keyMetrics?.expectedPoints?.value ?? 0).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getTrendIcon(dashboardData?.keyMetrics?.expectedPoints?.interpretation ?? "")}
                    <p className={`text-xs ${getMetricColor(dashboardData?.keyMetrics?.expectedPoints?.interpretation ?? "")}`}>
                      {dashboardData?.keyMetrics?.expectedPoints?.interpretation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedMetric({
                  title: "Goal Efficiency",
                  value: dashboardData?.keyMetrics?.goalEfficiency?.value ?? 0,
                  interpretation: dashboardData?.keyMetrics?.goalEfficiency?.interpretation ?? ""
                })}
                data-testid="card-metric-goal-efficiency"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Goal Efficiency</CardTitle>
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(dashboardData?.keyMetrics?.goalEfficiency?.value ?? 0).toFixed(2)}</div>
                  <p className={`text-xs ${getMetricColor(dashboardData?.keyMetrics?.goalEfficiency?.interpretation ?? "")}`}>
                    {dashboardData?.keyMetrics?.goalEfficiency?.interpretation}
                  </p>
                  <Progress value={(dashboardData?.keyMetrics?.goalEfficiency?.value ?? 0) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedMetric({
                  title: "Defensive Solidity Index (DSI)",
                  value: dashboardData?.keyMetrics?.defensiveSolidityIndex?.value ?? 0,
                  interpretation: dashboardData?.keyMetrics?.defensiveSolidityIndex?.interpretation ?? ""
                })}
                data-testid="card-metric-dsi"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Defensive Solidity</CardTitle>
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(dashboardData?.keyMetrics?.defensiveSolidityIndex?.value ?? 0).toFixed(2)}</div>
                  <p className={`text-xs ${getMetricColor(dashboardData?.keyMetrics?.defensiveSolidityIndex?.interpretation ?? "")}`}>
                    {dashboardData?.keyMetrics?.defensiveSolidityIndex?.interpretation}
                  </p>
                  <Progress value={(dashboardData?.keyMetrics?.defensiveSolidityIndex?.value ?? 0) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card data-testid="card-team-stats">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">League Position</CardTitle>
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">#{dashboardData?.overview?.position ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.overview?.points ?? 0} points from {dashboardData?.overview?.played ?? 0} matches
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {(dashboardData?.overview?.form?.split('') || []).map((result, i) => (
                      <Badge
                        key={i}
                        className={
                          result === 'W' ? 'bg-[#00B140] text-white' :
                          result === 'D' ? 'bg-[#FDB913] text-white' :
                          'bg-[#C8102E] text-white'
                        }
                      >
                        {result}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-ppg-trajectory">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Season PPG Trajectory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seasonLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : seasonData?.ppgTrajectory ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={seasonData.ppgTrajectory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC6" />
                        <XAxis
                          dataKey="matchNumber"
                          stroke="#1B365D"
                          tick={{ fill: '#1B365D' }}
                        />
                        <YAxis stroke="#1B365D" tick={{ fill: '#1B365D' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#E8DCC6',
                            border: '1px solid #1B365D',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ppg"
                          stroke="#C8102E"
                          strokeWidth={2}
                          name="Points Per Game"
                          dot={{ fill: '#C8102E' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No trajectory data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-goal-difference">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Goal Difference Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seasonLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : seasonData?.ppgTrajectory ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={seasonData.ppgTrajectory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC6" />
                        <XAxis
                          dataKey="matchNumber"
                          stroke="#1B365D"
                          tick={{ fill: '#1B365D' }}
                        />
                        <YAxis stroke="#1B365D" tick={{ fill: '#1B365D' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#E8DCC6',
                            border: '1px solid #1B365D',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="goalDifference"
                          stroke="#00B140"
                          fill="#00B140"
                          fillOpacity={0.3}
                          name="Goal Difference"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-top-players">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(dashboardData?.topPlayers || []).map((player, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-card hover-elevate"
                        data-testid={`player-${i}`}
                      >
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-muted-foreground">{player.appearances} apps</p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-foreground">{player.goals}</div>
                            <div className="text-xs text-muted-foreground">Goals</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-foreground">{player.assists}</div>
                            <div className="text-xs text-muted-foreground">Assists</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-rss-sentiment">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    RSS Sentiment Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rssLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={`p-3 rounded-lg ${getMetricBgColor(rssData?.sentiment?.aggregatedScore?.interpretation ?? "")}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Sentiment Score</span>
                          <span className={`text-2xl font-bold ${getMetricColor(rssData?.sentiment?.aggregatedScore?.interpretation ?? "")}`}>
                            {(rssData?.sentiment?.aggregatedScore?.value ?? 0).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on {rssData?.sentiment?.sampleSize ?? 0} articles
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg ${getMetricBgColor(rssData?.trending?.topicScore?.interpretation ?? "")}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Topic Trending</span>
                          <span className={`text-2xl font-bold ${getMetricColor(rssData?.trending?.topicScore?.interpretation ?? "")}`}>
                            {(rssData?.trending?.topicScore?.value ?? 0).toFixed(2)}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${getMetricColor(rssData?.trending?.topicScore?.interpretation ?? "")}`}>
                          {rssData?.trending?.topicScore?.interpretation}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded-lg bg-card">
                          <div className="text-xs text-muted-foreground">Coverage Intensity</div>
                          <div className="text-lg font-bold">{(rssData?.coverage?.intensity?.value ?? 0).toFixed(2)}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-card">
                          <div className="text-xs text-muted-foreground">Source Diversity</div>
                          <div className="text-lg font-bold">{(rssData?.coverage?.diversity?.value ?? 0).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {seasonData?.projections && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-title-race">
                  <CardHeader>
                    <CardTitle>Title Race Index</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{(seasonData?.projections?.titleRaceIndex?.value ?? 0).toFixed(2)}</div>
                    <p className={`text-sm ${getMetricColor(seasonData?.projections?.titleRaceIndex?.interpretation ?? "")}`}>
                      {seasonData?.projections?.titleRaceIndex?.interpretation}
                    </p>
                    <Progress value={(seasonData?.projections?.titleRaceIndex?.value ?? 0) * 100} className="mt-3" />
                  </CardContent>
                </Card>

                <Card data-testid="card-top4-prob">
                  <CardHeader>
                    <CardTitle>Top 4 Probability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{((seasonData?.projections?.top4Probability?.value ?? 0) * 100).toFixed(1)}%</div>
                    <p className={`text-sm ${getMetricColor(seasonData?.projections?.top4Probability?.interpretation ?? "")}`}>
                      {seasonData?.projections?.top4Probability?.interpretation}
                    </p>
                    <Progress value={(seasonData?.projections?.top4Probability?.value ?? 0) * 100} className="mt-3" />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tactical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="card-pressing">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Pressing Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tacticalLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <>
                      <div className="text-4xl font-bold mb-2">
                        {((tacticalData?.pressing?.successRate?.value ?? 0) * 100).toFixed(1)}%
                      </div>
                      <p className={`text-sm mb-4 ${getMetricColor(tacticalData?.pressing?.successRate?.interpretation ?? "")}`}>
                        {tacticalData?.pressing?.successRate?.interpretation}
                      </p>
                      <Progress value={(tacticalData?.pressing?.successRate?.value ?? 0) * 100} className="h-3" />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-possession">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Possession Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tacticalLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <>
                      <div className="text-4xl font-bold mb-2">
                        {(tacticalData?.possession?.efficiency?.value ?? 0).toFixed(2)}
                      </div>
                      <p className={`text-sm mb-4 ${getMetricColor(tacticalData?.possession?.efficiency?.interpretation ?? "")}`}>
                        {tacticalData?.possession?.efficiency?.interpretation}
                      </p>
                      <Progress value={(tacticalData?.possession?.efficiency?.value ?? 0) * 50} className="h-3" />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-counter-attacks">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUp className="w-5 h-5" />
                    Counter-Attack Effectiveness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tacticalLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <>
                      <div className="text-4xl font-bold mb-2">
                        {((tacticalData?.counterAttacks?.effectiveness?.value ?? 0) * 100).toFixed(1)}%
                      </div>
                      <p className={`text-sm mb-4 ${getMetricColor(tacticalData?.counterAttacks?.effectiveness?.interpretation ?? "")}`}>
                        {tacticalData?.counterAttacks?.effectiveness?.interpretation}
                      </p>
                      <Progress value={(tacticalData?.counterAttacks?.effectiveness?.value ?? 0) * 100} className="h-3" />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-set-pieces">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Set Piece Threat Index
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tacticalLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <>
                      <div className="text-4xl font-bold mb-2">
                        {(tacticalData?.setPieces?.threatIndex?.value ?? 0).toFixed(2)}
                      </div>
                      <p className={`text-sm mb-4 ${getMetricColor(tacticalData?.setPieces?.threatIndex?.interpretation ?? "")}`}>
                        {tacticalData?.setPieces?.threatIndex?.interpretation}
                      </p>
                      <Progress value={(tacticalData?.setPieces?.threatIndex?.value ?? 0) * 50} className="h-3" />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-tactical-comparison">
              <CardHeader>
                <CardTitle>Tactical Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {tacticalLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Pressing',
                          value: (tacticalData?.pressing?.successRate?.value ?? 0) * 100,
                        },
                        {
                          name: 'Possession',
                          value: (tacticalData?.possession?.efficiency?.value ?? 0) * 50,
                        },
                        {
                          name: 'Counter-Attack',
                          value: (tacticalData?.counterAttacks?.effectiveness?.value ?? 0) * 100,
                        },
                        {
                          name: 'Set Pieces',
                          value: (tacticalData?.setPieces?.threatIndex?.value ?? 0) * 50,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC6" />
                      <XAxis dataKey="name" stroke="#1B365D" tick={{ fill: '#1B365D' }} />
                      <YAxis stroke="#1B365D" tick={{ fill: '#1B365D' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#E8DCC6',
                          border: '1px solid #1B365D',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#C8102E" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card data-testid="card-goals-for-comparison">
                <CardHeader>
                  <CardTitle className="text-sm">Goals For vs League Avg</CardTitle>
                </CardHeader>
                <CardContent>
                  {comparativeLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        {(comparativeData?.vsLeagueAverage?.goalsFor?.value ?? 0).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        {(comparativeData?.vsLeagueAverage?.goalsFor?.value ?? 0) > 1 ? (
                          <ArrowUp className="w-4 h-4 text-[#00B140]" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-[#C8102E]" />
                        )}
                        <p className={`text-xs ${getMetricColor(comparativeData?.vsLeagueAverage?.goalsFor?.interpretation ?? "")}`}>
                          {comparativeData?.vsLeagueAverage?.goalsFor?.interpretation}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-goals-against-comparison">
                <CardHeader>
                  <CardTitle className="text-sm">Goals Against vs League Avg</CardTitle>
                </CardHeader>
                <CardContent>
                  {comparativeLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        {(comparativeData?.vsLeagueAverage?.goalsAgainst?.value ?? 0).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        {(comparativeData?.vsLeagueAverage?.goalsAgainst?.value ?? 0) < 1 ? (
                          <ArrowUp className="w-4 h-4 text-[#00B140]" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-[#C8102E]" />
                        )}
                        <p className={`text-xs ${getMetricColor(comparativeData?.vsLeagueAverage?.goalsAgainst?.interpretation ?? "")}`}>
                          {comparativeData?.vsLeagueAverage?.goalsAgainst?.interpretation}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-xg-comparison">
                <CardHeader>
                  <CardTitle className="text-sm">xG vs League Avg</CardTitle>
                </CardHeader>
                <CardContent>
                  {comparativeLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        {(comparativeData?.vsLeagueAverage?.xG?.value ?? 0).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        {(comparativeData?.vsLeagueAverage?.xG?.value ?? 0) > 1 ? (
                          <ArrowUp className="w-4 h-4 text-[#00B140]" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-[#C8102E]" />
                        )}
                        <p className={`text-xs ${getMetricColor(comparativeData?.vsLeagueAverage?.xG?.interpretation ?? "")}`}>
                          {comparativeData?.vsLeagueAverage?.xG?.interpretation}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-league-table">
              <CardHeader>
                <CardTitle>League Standings (Top 6)</CardTitle>
              </CardHeader>
              <CardContent>
                {comparativeLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(comparativeData?.leagueStandings || []).map((team) => (
                      <div
                        key={team.position}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          team.name === 'Liverpool' ? 'bg-[#C8102E]/10 border-2 border-[#C8102E]' : 'bg-card'
                        }`}
                        data-testid={`team-${team.position}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-lg w-6">{team.position}</div>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Played: {team.played} | GD: {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-1">
                            {(team.form?.split('') || []).map((result, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  result === 'W' ? 'bg-[#00B140]' :
                                  result === 'D' ? 'bg-[#FDB913]' :
                                  'bg-[#C8102E]'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="font-bold text-xl w-12 text-right">{team.points}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
        <DialogContent data-testid="dialog-metric-detail">
          <DialogHeader>
            <DialogTitle>{selectedMetric?.title}</DialogTitle>
            <DialogDescription>Detailed metric information and interpretation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${getMetricBgColor(selectedMetric?.interpretation ?? "")}`}>
              <div className="text-4xl font-bold mb-2">{(selectedMetric?.value ?? 0).toFixed(2)}</div>
              <p className={`text-sm ${getMetricColor(selectedMetric?.interpretation ?? "")}`}>
                {selectedMetric?.interpretation}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This metric is calculated based on Liverpool's recent performance data and provides insights into team dynamics and effectiveness.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
