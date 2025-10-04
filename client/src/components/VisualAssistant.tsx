import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Video, 
  BarChart3, 
  FileText, 
  Zap,
  TrendingUp,
  Trophy,
  PlayCircle
} from "lucide-react";
import Header from "./Header";
import UpcomingMatchPreview from "./UpcomingMatchPreview";
import mailmanLogo from "@assets/mailman-logo.png";

export default function VisualAssistant() {
  const { data: stats } = useQuery<{
    totalContent: number;
    frameworks: number;
    images: number;
    rssArticles: number;
    libraryItems: number;
    scenes: number;
    presentationSets: number;
    tickerPlaylists: number;
    reports: number;
  }>({
    queryKey: ['/api/statistics'],
  });

  // Use static values for reliability (count-up removed for accessibility)
  const reportsCount = stats?.reports ?? 0;
  const scenesCount = stats?.scenes ?? 0;
  const libraryCount = stats?.libraryItems ?? 0;
  const articlesCount = stats?.rssArticles ?? 0;
  const frameworksCount = stats?.frameworks ?? 0;

  return (
    <div className="min-h-screen bg-[#E8DCC6]">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Hero Section with Mailman Media Logo */}
        <div className="relative mb-6">
          {/* Vintage Border Frame */}
          <div className="absolute inset-0 border-8 border-[#1B365D] rounded-sm pointer-events-none">
            <div className="absolute inset-0 border-4 border-[#C8102E] rounded-sm m-1"></div>
          </div>
          
          <div className="relative py-6 sm:py-8 px-4 sm:px-6">
            {/* Mailman Media Logo */}
            <div className="flex justify-center mb-5">
              <img 
                src={mailmanLogo} 
                alt="Mailman Media" 
                className="w-40 h-40 sm:w-48 sm:h-48 drop-shadow-2xl"
              />
            </div>
            
            {/* Hero Text */}
            <div className="text-center mb-5">
              <h1 className="font-league-spartan font-black text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wide text-[#1B365D] mb-3">
                THE PRODUCTION POST
              </h1>
              <p className="font-libre-franklin text-lg sm:text-xl text-[#1B365D]/80 max-w-3xl mx-auto leading-snug">
                Professional broadcast-quality content creation for Liverpool FC analysis
              </p>
            </div>
            
            {/* Stats Bar */}
            <div className="border-t-2 border-b-2 border-[#C8102E] py-3 px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="font-mono font-bold text-3xl text-[#C8102E]" data-testid="stat-total-content">
                    {reportsCount}
                  </div>
                  <div className="font-league-spartan text-sm text-[#1B365D] uppercase tracking-wide mt-1">
                    Reports
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-3xl text-[#1B365D]" data-testid="stat-scenes">
                    {scenesCount}
                  </div>
                  <div className="font-league-spartan text-sm text-[#1B365D] uppercase tracking-wide mt-1">
                    Scenes
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-3xl text-[#C8102E]" data-testid="stat-library">
                    {libraryCount}
                  </div>
                  <div className="font-league-spartan text-sm text-[#1B365D] uppercase tracking-wide mt-1">
                    Library Items
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-3xl text-[#1B365D]" data-testid="stat-articles">
                    {articlesCount}
                  </div>
                  <div className="font-league-spartan text-sm text-[#1B365D] uppercase tracking-wide mt-1">
                    RSS Articles
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Match Section */}
        <div className="mb-6">
          <UpcomingMatchPreview />
        </div>

        {/* Main Features Section */}
        <div className="mb-6">
          <h2 className="font-league-spartan font-bold text-3xl uppercase tracking-wide text-[#1B365D] text-center mb-5">
            PRODUCTION TOOLS
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Team Matchup Studio */}
            <Card className="border-4 border-[#1B365D] bg-white/90 hover-elevate active-elevate-2 transition-all card-3d">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2.5 bg-[#C8102E] rounded-lg">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D]">
                    Team Matchup Studio
                  </CardTitle>
                </div>
                <CardDescription className="font-libre-franklin text-base text-[#1B365D]/70 leading-snug">
                  Advanced tactical analysis with AI-powered insights, squad rosters, and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#1B365D]/80">
                  <Trophy className="w-4 h-4 text-[#C8102E]" />
                  <span className="font-libre-franklin">Premier League & Champions League data</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1B365D]/80">
                  <TrendingUp className="w-4 h-4 text-[#C8102E]" />
                  <span className="font-libre-franklin">Live statistics & form analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1B365D]/80">
                  <Zap className="w-4 h-4 text-[#C8102E]" />
                  <span className="font-libre-franklin">AI tactical recommendations</span>
                </div>
                <Link href="/team-matchup-studio">
                  <Button 
                    className="w-full mt-3 bg-[#1B365D] text-white font-league-spartan font-bold uppercase tracking-wide"
                    data-testid="button-team-matchup"
                  >
                    Open Studio
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Live Presentation */}
            <Card className="border-4 border-[#1B365D] bg-white/90 hover-elevate active-elevate-2 transition-all card-3d">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2.5 bg-[#C8102E] rounded-lg">
                    <Video className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D]">
                    Live Presentation
                  </CardTitle>
                </div>
                <CardDescription className="font-libre-franklin text-base text-[#1B365D]/70 leading-snug">
                  Professional broadcast control with multi-camera management and real-time graphics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#1B365D]/80">
                  <PlayCircle className="w-4 h-4 text-[#C8102E]" />
                  <span className="font-libre-franklin">Program/Preview workflow</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1B365D]/80">
                  <Video className="w-4 h-4 text-[#C8102E]" />
                  <span className="font-libre-franklin">Multi-camera scene composition</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1B365D]/80">
                  <FileText className="w-4 h-4 text-[#C8102E]" />
                  <span className="font-libre-franklin">Real-time graphics overlay</span>
                </div>
                <Link href="/live-presentation">
                  <Button 
                    className="w-full mt-3 bg-[#C8102E] text-white font-league-spartan font-bold uppercase tracking-wide"
                    data-testid="button-live-presentation"
                  >
                    Go Live
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="border-t-4 border-[#1B365D] pt-5">
          <h3 className="font-league-spartan font-bold text-2xl uppercase tracking-wide text-[#1B365D] text-center mb-4">
            QUICK ACCESS
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/frameworks">
              <Button 
                variant="outline" 
                className="w-full h-auto py-3 border-2 border-[#1B365D] text-[#1B365D] font-league-spartan font-semibold uppercase"
                data-testid="button-frameworks"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <FileText className="w-6 h-6" />
                  <span>Frameworks</span>
                  <span className="text-xs font-mono">({frameworksCount})</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/content-library">
              <Button 
                variant="outline" 
                className="w-full h-auto py-3 border-2 border-[#1B365D] text-[#1B365D] font-league-spartan font-semibold uppercase"
                data-testid="button-library"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <FileText className="w-6 h-6" />
                  <span>Library</span>
                  <span className="text-xs font-mono">({libraryCount})</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/rss">
              <Button 
                variant="outline" 
                className="w-full h-auto py-3 border-2 border-[#1B365D] text-[#1B365D] font-league-spartan font-semibold uppercase"
                data-testid="button-rss"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Zap className="w-6 h-6" />
                  <span>RSS Intel</span>
                  <span className="text-xs font-mono">({articlesCount})</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/team-matchup-studio">
              <Button 
                variant="outline" 
                className="w-full h-auto py-3 border-2 border-[#C8102E] text-[#C8102E] font-league-spartan font-semibold uppercase"
                data-testid="button-matchup-quick"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <BarChart3 className="w-6 h-6" />
                  <span>Matchup</span>
                  <span className="text-xs font-mono">Studio</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
