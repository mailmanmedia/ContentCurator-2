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
  PlayCircle,
  Sparkles
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

  const reportsCount = stats?.reports ?? 0;
  const scenesCount = stats?.scenes ?? 0;
  const libraryCount = stats?.libraryItems ?? 0;
  const articlesCount = stats?.rssArticles ?? 0;
  const frameworksCount = stats?.frameworks ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8DCC6] via-[#F5EFE7] to-[#E8DCC6]">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Hero Section with Enhanced Styling */}
        <div className="relative mb-6 group">
          {/* Animated Border Frame */}
          <div className="absolute inset-0 border-8 border-[#1B365D] rounded-sm pointer-events-none transition-all duration-300 group-hover:border-[#C8102E]">
            <div className="absolute inset-0 border-4 border-[#C8102E] rounded-sm m-1 transition-all duration-300 group-hover:border-[#1B365D]"></div>
          </div>
          
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1B365D_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
          </div>
          
          <div className="relative py-6 sm:py-8 px-4 sm:px-6">
            {/* Mailman Media Logo with glow effect */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-[#C8102E] opacity-20 animate-pulse-glow"></div>
                <img 
                  src={mailmanLogo} 
                  alt="Mailman Media" 
                  className="relative w-40 h-40 sm:w-48 sm:h-48 drop-shadow-2xl transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
            
            {/* Hero Text */}
            <div className="text-center mb-5">
              <h1 className="font-league-spartan font-black text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wide text-[#1B365D] mb-3 animate-slide-up">
                THE PRODUCTION POST
              </h1>
              <p className="font-libre-franklin text-lg sm:text-xl text-[#1B365D]/80 max-w-3xl mx-auto leading-snug animate-slide-up stagger-1">
                Professional broadcast-quality content creation for Liverpool FC analysis
              </p>
            </div>
            
            {/* Enhanced Stats Bar */}
            <div className="border-t-2 border-b-2 border-[#C8102E] py-4 px-4 bg-gradient-to-r from-transparent via-[#C8102E]/5 to-transparent">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center group/stat">
                  <div className="font-mono font-bold text-3xl text-[#C8102E] transition-all duration-300 group-hover/stat:scale-110 group-hover/stat:text-[#1B365D]" data-testid="stat-total-content">
                    {reportsCount}
                  </div>
                  <div className="font-league-spartan text-sm text-[#1B365D] uppercase tracking-wide mt-1 transition-colors group-hover/stat:text-[#C8102E]">
                    Reports
                  </div>
                </div>
                <div className="text-center group/stat">
                  <div className="font-mono font-bold text-3xl text-[#1B365D] transition-all duration-300 group-hover/stat:scale-110 group-hover/stat:text-[#C8102E]" data-testid="stat-scenes">
                    {scenesCount}
                  </div>
                  <div className="font-league-spartan text-sm text-[#1B365D] uppercase tracking-wide mt-1 transition-colors group-hover/stat:text-[#C8102E]">
                    Scenes
                  </div>
                </div>
                <div className="text-center group/stat">
                  <div className="font-mono font-bold text-3xl text-[#C8102E] transition-all duration-300 group-hover/stat:scale-110 group-hover/stat:text-[#1B365D]" data-testid="stat-library">
                    {libraryCount}
                  </div>
                  <div className="font-league-spartan text-sm text-[#1B365D] uppercase tracking-wide mt-1 transition-colors group-hover/stat:text-[#C8102E]">
                    Library Items
                  </div>
                </div>
                <div className="text-center group/stat">
                  <div className="font-mono font-bold text-3xl text-[#1B365D] transition-all duration-300 group-hover/stat:scale-110 group-hover/stat:text-[#C8102E]" data-testid="stat-articles">
                    {articlesCount}
                  </div>
                  <div className="font-league-spartan text-sm text-[#1B365D] uppercase tracking-wide mt-1 transition-colors group-hover/stat:text-[#C8102E]">
                    RSS Articles
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Match Section */}
        <div className="mb-6 animate-slide-up stagger-2">
          <UpcomingMatchPreview />
        </div>

        {/* Main Features Section with Enhanced Cards */}
        <div className="mb-6 animate-slide-up stagger-3">
          <h2 className="font-league-spartan font-bold text-3xl uppercase tracking-wide text-[#1B365D] text-center mb-5 relative">
            <span className="relative inline-flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#C8102E] animate-pulse-glow" />
              PRODUCTION TOOLS
              <Sparkles className="w-6 h-6 text-[#C8102E] animate-pulse-glow" />
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Team Matchup Studio - Enhanced Card */}
            <div className="group/card relative">
              {/* Animated glow background */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#1B365D] via-[#C8102E] to-[#1B365D] rounded-lg opacity-20 blur-xl group-hover/card:opacity-40 transition-all duration-500 animate-shimmer"></div>
              
              <Card className="relative border-4 border-[#1B365D] bg-gradient-to-br from-white via-white to-[#F5EFE7] overflow-hidden card-3d transition-all duration-300 group-hover/card:border-[#C8102E] group-hover/card:shadow-2xl">
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C8102E]/10 to-transparent rounded-bl-[100px] transition-all duration-300 group-hover/card:w-40 group-hover/card:h-40"></div>
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative p-3 bg-gradient-to-br from-[#C8102E] to-[#8B0A1F] rounded-xl shadow-lg transition-all duration-300 group-hover/card:scale-110 group-hover/card:rotate-3">
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm"></div>
                      <BarChart3 className="relative w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D] transition-colors group-hover/card:text-[#C8102E]">
                      Team Matchup Studio
                    </CardTitle>
                  </div>
                  <CardDescription className="font-libre-franklin text-base text-[#1B365D]/70 leading-snug">
                    Advanced tactical analysis with AI-powered insights, squad rosters, and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2 text-sm text-[#1B365D]/80 transition-all duration-200 hover:translate-x-1">
                    <div className="p-1.5 bg-[#C8102E]/10 rounded-md">
                      <Trophy className="w-4 h-4 text-[#C8102E]" />
                    </div>
                    <span className="font-libre-franklin">Premier League & Champions League data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#1B365D]/80 transition-all duration-200 hover:translate-x-1">
                    <div className="p-1.5 bg-[#C8102E]/10 rounded-md">
                      <TrendingUp className="w-4 h-4 text-[#C8102E]" />
                    </div>
                    <span className="font-libre-franklin">Live statistics & form analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#1B365D]/80 transition-all duration-200 hover:translate-x-1">
                    <div className="p-1.5 bg-[#C8102E]/10 rounded-md">
                      <Zap className="w-4 h-4 text-[#C8102E]" />
                    </div>
                    <span className="font-libre-franklin">AI tactical recommendations</span>
                  </div>
                  <Link href="/team-matchup-studio">
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-[#1B365D] to-[#0F1F3A] text-white font-league-spartan font-bold uppercase tracking-wide shadow-lg transition-all duration-300 hover:shadow-xl hover:from-[#0F1F3A] hover:to-[#1B365D]"
                      data-testid="button-team-matchup"
                    >
                      <span className="flex items-center justify-center gap-2">
                        Open Studio
                        <Sparkles className="w-4 h-4" />
                      </span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Live Presentation - Enhanced Card */}
            <div className="group/card relative">
              {/* Animated glow background */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#C8102E] via-[#1B365D] to-[#C8102E] rounded-lg opacity-20 blur-xl group-hover/card:opacity-40 transition-all duration-500 animate-shimmer"></div>
              
              <Card className="relative border-4 border-[#1B365D] bg-gradient-to-br from-white via-white to-[#F5EFE7] overflow-hidden card-3d transition-all duration-300 group-hover/card:border-[#C8102E] group-hover/card:shadow-2xl">
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#1B365D]/10 to-transparent rounded-bl-[100px] transition-all duration-300 group-hover/card:w-40 group-hover/card:h-40"></div>
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative p-3 bg-gradient-to-br from-[#C8102E] to-[#8B0A1F] rounded-xl shadow-lg transition-all duration-300 group-hover/card:scale-110 group-hover/card:rotate-3">
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm"></div>
                      <Video className="relative w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D] transition-colors group-hover/card:text-[#C8102E]">
                      Live Presentation
                    </CardTitle>
                  </div>
                  <CardDescription className="font-libre-franklin text-base text-[#1B365D]/70 leading-snug">
                    Professional broadcast control with multi-camera management and real-time graphics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2 text-sm text-[#1B365D]/80 transition-all duration-200 hover:translate-x-1">
                    <div className="p-1.5 bg-[#C8102E]/10 rounded-md">
                      <PlayCircle className="w-4 h-4 text-[#C8102E]" />
                    </div>
                    <span className="font-libre-franklin">Program/Preview workflow</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#1B365D]/80 transition-all duration-200 hover:translate-x-1">
                    <div className="p-1.5 bg-[#C8102E]/10 rounded-md">
                      <Video className="w-4 h-4 text-[#C8102E]" />
                    </div>
                    <span className="font-libre-franklin">Multi-camera scene composition</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#1B365D]/80 transition-all duration-200 hover:translate-x-1">
                    <div className="p-1.5 bg-[#C8102E]/10 rounded-md">
                      <FileText className="w-4 h-4 text-[#C8102E]" />
                    </div>
                    <span className="font-libre-franklin">Real-time graphics overlay</span>
                  </div>
                  <Link href="/live-presentation">
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-[#C8102E] to-[#8B0A1F] text-white font-league-spartan font-bold uppercase tracking-wide shadow-lg transition-all duration-300 hover:shadow-xl hover:from-[#8B0A1F] hover:to-[#C8102E]"
                      data-testid="button-live-presentation"
                    >
                      <span className="flex items-center justify-center gap-2">
                        Go Live
                        <PlayCircle className="w-4 h-4" />
                      </span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Access Section */}
        <div className="border-t-4 border-[#1B365D] pt-5 animate-slide-up stagger-4">
          <h3 className="font-league-spartan font-bold text-2xl uppercase tracking-wide text-[#1B365D] text-center mb-5">
            QUICK ACCESS
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/frameworks">
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 border-2 border-[#1B365D] text-[#1B365D] font-league-spartan font-semibold uppercase transition-all duration-300 hover:bg-[#1B365D] hover:text-white hover:scale-105 group/quick"
                data-testid="button-frameworks"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-[#1B365D]/5 rounded-lg transition-all duration-300 group-hover/quick:bg-white/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span>Frameworks</span>
                  <span className="text-xs font-mono opacity-70">({frameworksCount})</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/content-library">
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 border-2 border-[#1B365D] text-[#1B365D] font-league-spartan font-semibold uppercase transition-all duration-300 hover:bg-[#1B365D] hover:text-white hover:scale-105 group/quick"
                data-testid="button-library"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-[#1B365D]/5 rounded-lg transition-all duration-300 group-hover/quick:bg-white/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span>Library</span>
                  <span className="text-xs font-mono opacity-70">({libraryCount})</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/rss">
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 border-2 border-[#1B365D] text-[#1B365D] font-league-spartan font-semibold uppercase transition-all duration-300 hover:bg-[#1B365D] hover:text-white hover:scale-105 group/quick"
                data-testid="button-rss"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-[#1B365D]/5 rounded-lg transition-all duration-300 group-hover/quick:bg-white/20">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span>RSS Intel</span>
                  <span className="text-xs font-mono opacity-70">({articlesCount})</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/team-matchup-studio">
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 border-2 border-[#C8102E] text-[#C8102E] font-league-spartan font-semibold uppercase transition-all duration-300 hover:bg-[#C8102E] hover:text-white hover:scale-105 group/quick"
                data-testid="button-matchup-quick"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-[#C8102E]/5 rounded-lg transition-all duration-300 group-hover/quick:bg-white/20">
                    <BarChart3 className="w-6 h-6" />
                  </div>
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
