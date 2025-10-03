import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Shield, TrendingUp, Target, Award, Zap, Globe } from "lucide-react";

interface UpcomingFixture {
  id: number;
  date: Date;
  timestamp: number;
  venue: {
    id: number;
    name: string;
    city: string;
  };
  status: {
    long: string;
    short: string;
    elapsed: number;
  };
  league: {
    id: number;
    name: string;
    logo: string;
    round: string;
  };
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  isLiverpool: boolean;
}

interface TeamStats {
  form: string;
  goals: { for: number; against: number };
  winRate: number;
  cleanSheets: number;
}

type Timezone = 'CST' | 'BST';

export default function UpcomingMatchPreview() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState<{ id: number; name: string; logo: string } | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);
  const [timezone, setTimezone] = useState<Timezone>('BST');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { data: fixturesData, isLoading } = useQuery<{ fixtures: UpcomingFixture[] }>({
    queryKey: ['/api/football/liverpool/upcoming?limit=1'],
    staleTime: 300000,
    refetchInterval: 300000,
  });

  const { data: teamStatsData } = useQuery<TeamStats>({
    queryKey: ['/api/team-stats', selectedTeam?.id],
    enabled: !!selectedTeam,
    staleTime: 300000,
  });

  const nextMatch = fixturesData?.fixtures?.[0];

  const getCountdown = () => {
    if (!nextMatch) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const matchDate = new Date(nextMatch.date);
    const now = currentTime.getTime();
    const diff = matchDate.getTime() - now;

    if (diff < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const countdown = getCountdown();

  const timezoneInfo = useMemo(() => {
    if (timezone === 'BST') {
      return { name: 'Europe/London', label: 'BST' };
    } else {
      return { name: 'America/Chicago', label: 'CST' };
    }
  }, [timezone]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezoneInfo.name,
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezoneInfo.name,
    }).format(date);
  };

  const handleTeamClick = (team: { id: number; name: string; logo: string }) => {
    setSelectedTeam(team);
  };

  if (isLoading) {
    return (
      <Card className="border-4 border-[#1B365D] bg-white/90 animate-pulse">
        <CardHeader>
          <CardTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D]">
            Loading Match Info...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!nextMatch) {
    return (
      <Card className="border-4 border-[#1B365D] bg-white/90">
        <CardHeader>
          <CardTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D]">
            No Upcoming Matches
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Current Date/Time Clock with Pulse Animation */}
        <div 
          className="border-4 border-[#C8102E] rounded-lg bg-gradient-to-br from-[#1B365D] to-[#152849] shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] overflow-hidden" 
          data-testid="card-current-datetime"
        >
          <div className="pt-6 pb-4">
            <div className="flex items-center justify-center gap-3 text-[#E8DCC6]">
              <Calendar className="w-6 h-6 animate-pulse" />
              <div className="font-mono text-xl sm:text-2xl font-bold" data-testid="text-current-date">
                {formatDate(currentTime)}
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-[#E8DCC6] mt-2 mb-4">
              <Clock className="w-6 h-6" />
              <div className="font-mono text-3xl sm:text-4xl font-bold tracking-wider transition-all duration-300" data-testid="text-current-time">
                {formatTime(currentTime)}
              </div>
            </div>
            
            {/* Timezone Toggle */}
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-4 h-4 text-[#E8DCC6]" />
              <div className="flex gap-1 bg-[#152849]/50 rounded-md p-1">
                <Button
                  size="sm"
                  variant={timezone === 'BST' ? 'default' : 'ghost'}
                  onClick={() => setTimezone('BST')}
                  className={`
                    font-mono text-xs transition-all duration-300
                    ${timezone === 'BST' 
                      ? 'bg-[#C8102E] text-white hover:bg-[#A00D24]' 
                      : 'text-[#E8DCC6] hover:bg-[#1B365D]'
                    }
                  `}
                  data-testid="button-timezone-bst"
                >
                  BST
                </Button>
                <Button
                  size="sm"
                  variant={timezone === 'CST' ? 'default' : 'ghost'}
                  onClick={() => setTimezone('CST')}
                  className={`
                    font-mono text-xs transition-all duration-300
                    ${timezone === 'CST' 
                      ? 'bg-[#C8102E] text-white hover:bg-[#A00D24]' 
                      : 'text-[#E8DCC6] hover:bg-[#1B365D]'
                    }
                  `}
                  data-testid="button-timezone-cst"
                >
                  CST
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Next Match Preview with Enhanced Interactions */}
        <Card 
          className="border-4 border-[#1B365D] bg-gradient-to-b from-white/95 to-white/90 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl" 
          data-testid="card-next-match"
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D] text-center">
              Next Match
            </CardTitle>
            <div className="flex items-center justify-center gap-2 text-[#C8102E] text-sm font-semibold">
              <Shield className="w-4 h-4 animate-pulse" />
              <span className="font-league-spartan uppercase tracking-wide">{nextMatch.league.name}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Teams with Interactive Badges */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Home Team - Interactive */}
              <div className="text-center">
                <div 
                  className={`
                    relative w-24 h-24 mx-auto mb-3 cursor-pointer
                    transition-all duration-300 ease-out
                    ${hoveredTeam === nextMatch.homeTeam.id ? 'scale-110 drop-shadow-2xl' : 'scale-100'}
                  `}
                  onMouseEnter={() => setHoveredTeam(nextMatch.homeTeam.id)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onClick={() => handleTeamClick(nextMatch.homeTeam)}
                  data-testid={`button-team-${nextMatch.homeTeam.id}`}
                >
                  {/* Glow Effect on Hover */}
                  {hoveredTeam === nextMatch.homeTeam.id && (
                    <div className="absolute inset-0 bg-[#C8102E] opacity-20 rounded-full blur-xl animate-pulse" />
                  )}
                  
                  {/* Badge Container with aspect ratio preservation */}
                  <div className="relative w-full h-full flex items-center justify-center p-2">
                    <img 
                      src={nextMatch.homeTeam.logo} 
                      alt={nextMatch.homeTeam.name}
                      className="max-w-full max-h-full object-contain transition-all duration-300"
                      data-testid={`img-team-${nextMatch.homeTeam.id}`}
                    />
                  </div>
                  
                  {/* Click Hint */}
                  {hoveredTeam === nextMatch.homeTeam.id && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1B365D] text-[#E8DCC6] text-xs px-2 py-1 rounded whitespace-nowrap animate-fade-in">
                      View Stats
                    </div>
                  )}
                </div>
                <p 
                  className="font-league-spartan font-bold text-lg text-[#1B365D] transition-colors duration-300"
                  data-testid={`text-team-name-${nextMatch.homeTeam.id}`}
                >
                  {nextMatch.homeTeam.name}
                </p>
              </div>

              {/* VS Separator with Animation */}
              <div className="text-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#C8102E]/10 rounded-full blur-xl animate-pulse" />
                </div>
                <p className="font-league-spartan font-black text-4xl text-[#C8102E] relative z-10 animate-pulse">
                  VS
                </p>
              </div>

              {/* Away Team - Interactive */}
              <div className="text-center">
                <div 
                  className={`
                    relative w-24 h-24 mx-auto mb-3 cursor-pointer
                    transition-all duration-300 ease-out
                    ${hoveredTeam === nextMatch.awayTeam.id ? 'scale-110 drop-shadow-2xl' : 'scale-100'}
                  `}
                  onMouseEnter={() => setHoveredTeam(nextMatch.awayTeam.id)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onClick={() => handleTeamClick(nextMatch.awayTeam)}
                  data-testid={`button-team-${nextMatch.awayTeam.id}`}
                >
                  {hoveredTeam === nextMatch.awayTeam.id && (
                    <div className="absolute inset-0 bg-[#C8102E] opacity-20 rounded-full blur-xl animate-pulse" />
                  )}
                  
                  <div className="relative w-full h-full flex items-center justify-center p-2">
                    <img 
                      src={nextMatch.awayTeam.logo} 
                      alt={nextMatch.awayTeam.name}
                      className="max-w-full max-h-full object-contain transition-all duration-300"
                      data-testid={`img-team-${nextMatch.awayTeam.id}`}
                    />
                  </div>
                  
                  {hoveredTeam === nextMatch.awayTeam.id && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1B365D] text-[#E8DCC6] text-xs px-2 py-1 rounded whitespace-nowrap animate-fade-in">
                      View Stats
                    </div>
                  )}
                </div>
                <p 
                  className="font-league-spartan font-bold text-lg text-[#1B365D] transition-colors duration-300"
                  data-testid={`text-team-name-${nextMatch.awayTeam.id}`}
                >
                  {nextMatch.awayTeam.name}
                </p>
              </div>
            </div>

            {/* Match Details with Icons */}
            <div className="border-t-2 border-[#C8102E] pt-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-[#1B365D] hover:text-[#C8102E] transition-colors duration-300">
                <Calendar className="w-5 h-5" />
                <span className="font-libre-franklin text-base font-medium" data-testid="text-match-date">
                  {formatDate(new Date(nextMatch.date))}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[#1B365D] hover:text-[#C8102E] transition-colors duration-300">
                <Clock className="w-5 h-5" />
                <span className="font-libre-franklin text-base font-medium" data-testid="text-match-time">
                  {new Date(nextMatch.date).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: timezoneInfo.name
                  })} {timezoneInfo.label}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[#1B365D] hover:text-[#C8102E] transition-colors duration-300">
                <MapPin className="w-5 h-5" />
                <span className="font-libre-franklin text-base font-medium" data-testid="text-match-venue">
                  {nextMatch.venue.name}, {nextMatch.venue.city}
                </span>
              </div>
            </div>

            {/* Countdown Timer with Pulse Animations */}
            <div className="bg-gradient-to-br from-[#1B365D] to-[#152849] rounded-xl p-5 shadow-lg">
              <p className="font-league-spartan text-sm uppercase tracking-wide text-[#E8DCC6] text-center mb-4">
                Kickoff In
              </p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: countdown.days, label: 'Days', testid: 'countdown-days' },
                  { value: countdown.hours, label: 'Hours', testid: 'countdown-hours' },
                  { value: countdown.minutes, label: 'Mins', testid: 'countdown-minutes' },
                  { value: countdown.seconds, label: 'Secs', testid: 'countdown-seconds' }
                ].map((item, idx) => (
                  <div 
                    key={item.label}
                    className="text-center bg-white/5 rounded-lg p-3 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div 
                      className="font-mono font-bold text-2xl sm:text-3xl text-[#C8102E] transition-all duration-300"
                      data-testid={item.testid}
                    >
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div className="font-league-spartan text-xs text-[#E8DCC6] uppercase mt-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competition Round */}
            <div className="text-center pt-2">
              <p className="font-libre-franklin text-sm text-[#1B365D]/70 font-medium" data-testid="text-match-round">
                {nextMatch.league.round}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Statistics Modal */}
      <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
        <DialogContent className="bg-gradient-to-br from-white to-[#E8DCC6]/30 border-4 border-[#1B365D] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D] flex items-center gap-3">
              {selectedTeam && (
                <>
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img 
                      src={selectedTeam.logo} 
                      alt={selectedTeam.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span>{selectedTeam.name}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {teamStatsData ? (
              <>
                {/* Form */}
                <div className="bg-white/80 rounded-lg p-4 border-2 border-[#1B365D]/20 hover:border-[#C8102E]/50 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-[#C8102E]" />
                    <h3 className="font-league-spartan font-bold text-sm uppercase text-[#1B365D]">Recent Form</h3>
                  </div>
                  <div className="flex gap-1">
                    {teamStatsData.form.split('').map((result, idx) => (
                      <div 
                        key={idx}
                        className={`
                          w-8 h-8 flex items-center justify-center rounded font-bold text-sm
                          ${result === 'W' ? 'bg-green-500 text-white' : ''}
                          ${result === 'D' ? 'bg-yellow-500 text-white' : ''}
                          ${result === 'L' ? 'bg-red-500 text-white' : ''}
                          transition-transform duration-300 hover:scale-110
                        `}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div className="bg-white/80 rounded-lg p-4 border-2 border-[#1B365D]/20 hover:border-[#C8102E]/50 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-[#C8102E]" />
                    <h3 className="font-league-spartan font-bold text-sm uppercase text-[#1B365D]">Goals</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#C8102E]">{teamStatsData.goals.for}</div>
                      <div className="text-xs text-[#1B365D]/70 font-league-spartan uppercase">Scored</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#1B365D]">{teamStatsData.goals.against}</div>
                      <div className="text-xs text-[#1B365D]/70 font-league-spartan uppercase">Conceded</div>
                    </div>
                  </div>
                </div>

                {/* Win Rate & Clean Sheets */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/80 rounded-lg p-4 border-2 border-[#1B365D]/20 hover:border-[#C8102E]/50 transition-colors duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-[#C8102E]" />
                      <h3 className="font-league-spartan font-bold text-xs uppercase text-[#1B365D]">Win Rate</h3>
                    </div>
                    <div className="text-2xl font-bold text-[#C8102E]">{teamStatsData.winRate}%</div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4 border-2 border-[#1B365D]/20 hover:border-[#C8102E]/50 transition-colors duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#C8102E]" />
                      <h3 className="font-league-spartan font-bold text-xs uppercase text-[#1B365D]">Clean Sheets</h3>
                    </div>
                    <div className="text-2xl font-bold text-[#1B365D]">{teamStatsData.cleanSheets}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-[#C8102E] border-t-transparent rounded-full mx-auto mb-3" />
                <p className="font-libre-franklin text-[#1B365D]/70">Loading statistics...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
