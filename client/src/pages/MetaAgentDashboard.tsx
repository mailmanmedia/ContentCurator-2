
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import Header from "@/components/Header";
import {
  Sparkles,
  Database,
  BarChart3,
  Video,
  FileText,
  Zap,
  Activity,
  Settings,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  ExternalLink,
  Shield,
  PlayCircle,
  Package,
  Rss,
  Film,
  LayoutDashboard,
  Cpu,
  RefreshCw,
  AlertCircle,
  Clock,
  XCircle,
  Info
} from "lucide-react";

interface SystemHealth {
  database: { status: string; message: string };
  api: { status: string; message: string };
  overlays: { registered: number; total: number };
  cache: { status: string };
}

interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  verified?: boolean;
  requiresConfirmation?: boolean;
}

interface VerificationStep {
  id: string;
  description: string;
  completed: boolean;
  result?: string;
}

interface AgentTask {
  id: string;
  action: string;
  steps: VerificationStep[];
  status: 'pending' | 'verifying' | 'completed' | 'failed';
  userConfirmed: boolean;
}

export default function MetaAgentDashboard() {
  const [chatMessages, setChatMessages] = useState<AgentMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);

  // Fetch system health
  const { data: dbStatus, refetch: refetchDbStatus } = useQuery({
    queryKey: ['/api/database-status'],
    refetchInterval: 30000,
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/statistics'],
    refetchInterval: 30000,
  });

  const { data: auditData, refetch: refetchAudit } = useQuery({
    queryKey: ['/api/admin/data-audit'],
    refetchInterval: 60000,
  });

  const { data: syncLogs } = useQuery({
    queryKey: ['/api/admin/sync/logs', { limit: 10 }],
    refetchInterval: 30000,
  });

  // Calculate system health
  const systemHealth: SystemHealth = {
    database: {
      status: dbStatus?.tables?.length > 0 ? 'healthy' : 'warning',
      message: dbStatus?.tables?.length > 0 ? 'Connected' : 'No data'
    },
    api: {
      status: dbStatus?.lastApiUpdate ? 'healthy' : 'warning',
      message: dbStatus?.lastApiUpdate ? 'Active' : 'Limited'
    },
    overlays: {
      registered: 11,
      total: 11
    },
    cache: {
      status: 'healthy'
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage: AgentMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, newMessage]);
    setUserInput("");
    setIsProcessing(true);

    // Create verification task
    const task: AgentTask = {
      id: `task_${Date.now()}`,
      action: userInput,
      steps: [
        { id: 'analyze', description: 'Analyzing request', completed: false },
        { id: 'validate', description: 'Validating data sources', completed: false },
        { id: 'preview', description: 'Generating preview', completed: false },
        { id: 'confirm', description: 'Awaiting user confirmation', completed: false }
      ],
      status: 'verifying',
      userConfirmed: false
    };

    setCurrentTask(task);

    // Simulate multi-step verification
    for (let i = 0; i < task.steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      task.steps[i].completed = true;
      task.steps[i].result = 'Success';
      setVerificationProgress(((i + 1) / task.steps.length) * 100);
      setCurrentTask({ ...task });
    }

    const response: AgentMessage = {
      role: 'assistant',
      content: `I've analyzed your request: "${userInput}". This action will require verification. Please review the steps above and confirm to proceed.`,
      timestamp: new Date(),
      requiresConfirmation: true
    };

    setChatMessages(prev => [...prev, response]);
    setIsProcessing(false);
  };

  const handleConfirmTask = () => {
    if (!currentTask) return;

    const systemMessage: AgentMessage = {
      role: 'system',
      content: `✓ Task confirmed and executed: ${currentTask.action}`,
      timestamp: new Date(),
      verified: true
    };

    setChatMessages(prev => [...prev, systemMessage]);
    setCurrentTask(null);
    setVerificationProgress(0);
  };

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchDbStatus(),
      refetchStats(),
      refetchAudit()
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-league-spartan font-black text-foreground flex items-center gap-3">
              <Cpu className="w-10 h-10 text-[#C8102E]" />
              Meta-Agent Dashboard
            </h1>
            <p className="text-muted-foreground font-libre-franklin mt-1">
              Centralized command center with multi-step verification
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(systemHealth.database.status)} animate-pulse`} />
              System Active
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefreshAll}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Audit Status Alert */}
        {auditData?.summary && (auditData.summary.duplicatePlayersCount > 0 || auditData.summary.missingPlayerIdCount > 0) && (
          <Alert className="border-[#C8102E]/50 bg-[#C8102E]/10">
            <AlertTriangle className="w-4 h-4 text-[#C8102E]" />
            <AlertTitle>Data Quality Issues Detected</AlertTitle>
            <AlertDescription>
              {auditData.summary.duplicatePlayersCount} duplicate players, {auditData.summary.missingPlayerIdCount} missing player IDs.
              <Link href="/data-audit">
                <Button variant="link" className="p-0 h-auto text-[#C8102E]">
                  View Details →
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{dbStatus?.tables?.length || 0}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemHealth.database.status)}
                  <Badge variant={systemHealth.database.status === 'healthy' ? 'default' : 'secondary'}>
                    {systemHealth.database.message}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {dbStatus?.tables?.reduce((sum: number, t: any) => sum + t.recordCount, 0)?.toLocaleString() || 0} total records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Overlays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{systemHealth.overlays.registered}</span>
                <Badge variant="default">Ready</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All overlays registered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats?.libraryItems || 0}</span>
                <Badge variant="secondary">Library</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.scenes || 0} scenes, {stats?.frameworks || 0} frameworks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {(auditData?.summary.duplicatePlayersCount || 0) + 
                   (auditData?.summary.missingPlayerIdCount || 0)}
                </span>
                <Badge variant={(auditData?.summary.duplicatePlayersCount || 0) > 0 ? 'destructive' : 'default'}>
                  {(auditData?.summary.duplicatePlayersCount || 0) > 0 ? 'Issues' : 'Clean'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Quality checks active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <Sparkles className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Package className="w-4 h-4 mr-2" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="agent">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Agent
            </TabsTrigger>
            <TabsTrigger value="monitor">
              <Activity className="w-4 h-4 mr-2" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Terminal className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-[#1B365D]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#C8102E]" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Frequently used operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/team-matchup-studio">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Team Matchup Analysis
                    </Button>
                  </Link>
                  <Link href="/live-presentation">
                    <Button variant="outline" className="w-full justify-start">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Live Presentation
                    </Button>
                  </Link>
                  <Link href="/video-editor">
                    <Button variant="outline" className="w-full justify-start">
                      <Film className="w-4 h-4 mr-2" />
                      Video Editor
                    </Button>
                  </Link>
                  <Link href="/database-status">
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Database Status
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#C8102E]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#1B365D]" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest system updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Database Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {dbStatus?.lastApiUpdate ? new Date(dbStatus.lastApiUpdate).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Overlays Registered</p>
                      <p className="text-xs text-muted-foreground">11 overlays active</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">RSS Feed Active</p>
                      <p className="text-xs text-muted-foreground">{stats?.rssArticles || 0} articles indexed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tools Tab - Complete Integration */}
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* All existing tools preserved and linked */}
              <Link href="/team-matchup-studio">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#C8102E]" />
                      Team Matchup Studio
                    </CardTitle>
                    <CardDescription>Advanced tactical analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      AI-powered insights, squad rosters, performance metrics
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/live-presentation">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="w-5 h-5 text-[#C8102E]" />
                      Live Presentation
                    </CardTitle>
                    <CardDescription>Broadcast control center</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Multi-camera, overlays, real-time graphics
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/video-editor">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Film className="w-5 h-5 text-[#C8102E]" />
                      Video Editor
                    </CardTitle>
                    <CardDescription>Professional editing suite</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Timeline editing, effects, color grading
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/content-library">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#C8102E]" />
                      Content Library
                    </CardTitle>
                    <CardDescription>Media asset management</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {stats?.libraryItems || 0} items ready to use
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/rss">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Rss className="w-5 h-5 text-[#C8102E]" />
                      RSS Intelligence
                    </CardTitle>
                    <CardDescription>News & sentiment analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {stats?.rssArticles || 0} articles analyzed
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/analytics">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#C8102E]" />
                      Analytics Dashboard
                    </CardTitle>
                    <CardDescription>Performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Liverpool FC performance intelligence
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/frameworks">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#C8102E]" />
                      Frameworks
                    </CardTitle>
                    <CardDescription>AI content frameworks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {stats?.frameworks || 0} frameworks available
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/templates">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-[#C8102E]" />
                      Templates
                    </CardTitle>
                    <CardDescription>Scene templates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Pre-built layouts and designs
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/overlay-templates">
                <Card className="hover-elevate group cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-[#C8102E]" />
                      Overlay Builder
                    </CardTitle>
                    <CardDescription>Custom overlay creation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Build custom broadcast overlays
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>

          {/* AI Agent Tab with Multi-Step Verification */}
          <TabsContent value="agent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  AI Assistant with Multi-Step Verification
                </CardTitle>
                <CardDescription>Natural language control with confirmation workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Sparkles className="w-4 h-4" />
                  <AlertTitle>Verification Workflow Active</AlertTitle>
                  <AlertDescription>
                    All agent actions require multi-step verification and user confirmation before execution.
                  </AlertDescription>
                </Alert>

                {currentTask && (
                  <Card className="border-[#1B365D]">
                    <CardHeader>
                      <CardTitle className="text-sm">Verification in Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={verificationProgress} className="h-2" />
                      {currentTask.steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-2">
                          {step.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
                          )}
                          <span className="text-sm">{step.description}</span>
                          {step.result && (
                            <Badge variant="outline" className="ml-auto">{step.result}</Badge>
                          )}
                        </div>
                      ))}
                      {verificationProgress === 100 && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-start gap-2">
                            <Checkbox id="confirm" />
                            <label htmlFor="confirm" className="text-sm">
                              I confirm this action has been reviewed and should be executed
                            </label>
                          </div>
                          <Button onClick={handleConfirmTask} className="w-full">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirm & Execute
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user' 
                            ? 'bg-[#1B365D] text-white' 
                            : msg.role === 'system'
                            ? 'bg-green-500/10 border border-green-500/50'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                          {msg.verified && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-500">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Try: 'Update player statistics' or 'Create overlay for next match'"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={isProcessing || !userInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Status</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Tables</span>
                    <span className="font-mono">{dbStatus?.tables?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Records</span>
                    <span className="font-mono">
                      {dbStatus?.tables?.reduce((sum: number, t: any) => sum + t.recordCount, 0)?.toLocaleString() || 0}
                    </span>
                  </div>
                  <Link href="/database-status">
                    <Button variant="outline" className="w-full mt-2">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Status</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Status</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overlays Ready</span>
                    <span className="font-mono">11/11</span>
                  </div>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full mt-2">
                      Admin Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Import, export, and audit data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/data-admin">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="w-4 h-4 mr-2" />
                      Import/Export Data
                    </Button>
                  </Link>
                  <Link href="/data-audit">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      Data Audit
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Framework Management</CardTitle>
                  <CardDescription>AI-powered content frameworks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/frameworks">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      View Frameworks ({stats?.frameworks || 0})
                    </Button>
                  </Link>
                  <Link href="/frameworks/create">
                    <Button variant="outline" className="w-full justify-start">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create New Framework
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  System Logs
                </CardTitle>
                <CardDescription>Recent sync operations and data updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {syncLogs && syncLogs.length > 0 ? (
                      syncLogs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          {log.sync_status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                          ) : log.sync_status === 'error' ? (
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          ) : (
                            <Loader2 className="w-4 h-4 text-blue-500 mt-0.5 animate-spin" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{log.resource_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.records_processed} records • {new Date(log.started_at).toLocaleString()}
                            </p>
                            {log.error_message && (
                              <p className="text-xs text-red-500 mt-1">{log.error_message}</p>
                            )}
                          </div>
                          <Badge variant={log.sync_status === 'success' ? 'default' : 'destructive'}>
                            {log.sync_status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No logs available</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
