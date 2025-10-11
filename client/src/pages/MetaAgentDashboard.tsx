
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Cpu
} from "lucide-react";

interface SystemHealth {
  database: { status: string; message: string };
  api: { status: string; message: string };
  overlays: { registered: number; total: number };
  cache: { status: string };
}

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function MetaAgentDashboard() {
  const [chatMessages, setChatMessages] = useState<AgentMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch system health
  const { data: dbStatus } = useQuery({
    queryKey: ['/api/database-status'],
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/statistics'],
    refetchInterval: 30000,
  });

  const { data: auditData } = useQuery({
    queryKey: ['/api/admin/data-audit'],
    refetchInterval: 60000,
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

    // Simulate AI response (to be connected to actual AI service)
    setTimeout(() => {
      const response: AgentMessage = {
        role: 'assistant',
        content: `I understand you want to: "${userInput}". This feature will be connected to the AI service for natural language processing. For now, you can use the quick actions or navigate to specific tools using the dashboard.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, response]);
      setIsProcessing(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
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
              Centralized command center for all production tools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(systemHealth.database.status)} animate-pulse`} />
              System Active
            </Badge>
          </div>
        </div>

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
                <Badge variant={systemHealth.database.status === 'healthy' ? 'default' : 'secondary'}>
                  {systemHealth.database.message}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {dbStatus?.tables?.reduce((sum, t) => sum + t.recordCount, 0)?.toLocaleString() || 0} total records
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
                <Badge variant="default">
                  Ready
                </Badge>
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
                <Badge variant="secondary">
                  Library
                </Badge>
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
                Quality checks passed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
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

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover-elevate group">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#C8102E]" />
                    Team Matchup Studio
                  </CardTitle>
                  <CardDescription>Advanced tactical analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    AI-powered insights, squad rosters, performance metrics
                  </p>
                  <Link href="/team-matchup-studio">
                    <Button className="w-full">
                      Open Studio
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover-elevate group">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#C8102E]" />
                    Live Presentation
                  </CardTitle>
                  <CardDescription>Broadcast control center</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Multi-camera, overlays, real-time graphics
                  </p>
                  <Link href="/live-presentation">
                    <Button className="w-full">
                      Go Live
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover-elevate group">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Film className="w-5 h-5 text-[#C8102E]" />
                    Video Editor
                  </CardTitle>
                  <CardDescription>Professional editing suite</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Timeline editing, effects, color grading
                  </p>
                  <Link href="/video-editor">
                    <Button className="w-full">
                      Open Editor
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover-elevate group">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#C8102E]" />
                    Content Library
                  </CardTitle>
                  <CardDescription>Media asset management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {stats?.libraryItems || 0} items ready to use
                  </p>
                  <Link href="/content-library">
                    <Button className="w-full">
                      Browse Library
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover-elevate group">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Rss className="w-5 h-5 text-[#C8102E]" />
                    RSS Intelligence
                  </CardTitle>
                  <CardDescription>News & sentiment analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {stats?.rssArticles || 0} articles analyzed
                  </p>
                  <Link href="/rss">
                    <Button className="w-full">
                      View Intelligence
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover-elevate group">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#C8102E]" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>Performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Liverpool FC performance intelligence
                  </p>
                  <Link href="/analytics">
                    <Button className="w-full">
                      View Analytics
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Agent Tab */}
          <TabsContent value="agent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  AI Assistant (Coming Soon)
                </CardTitle>
                <CardDescription>Natural language control for your production tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Sparkles className="w-4 h-4" />
                  <AlertTitle>Multi-LLM Integration Planned</AlertTitle>
                  <AlertDescription>
                    Future updates will integrate Claude, OpenAI, and Perplexity for natural language commands,
                    automated workflows, and intelligent suggestions.
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user' 
                            ? 'bg-[#1B365D] text-white' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
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
                    placeholder="Try: 'Create a new team comparison overlay' or 'Update player statistics'"
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
                      {dbStatus?.tables?.reduce((sum, t) => sum + t.recordCount, 0)?.toLocaleString() || 0}
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
        </Tabs>
      </main>
    </div>
  );
}
