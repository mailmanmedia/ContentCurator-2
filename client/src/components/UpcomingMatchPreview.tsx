import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Shield } from "lucide-react";

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

export default function UpcomingMatchPreview() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { data: fixturesData, isLoading } = useQuery<{ fixtures: UpcomingFixture[] }>({
    queryKey: ['/api/football/liverpool/upcoming?limit=1'],
    refetchInterval: 60000, // Refetch every minute
  });

  const nextMatch = fixturesData?.fixtures?.[0];

  // Calculate countdown
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card className="border-4 border-[#1B365D] bg-white/90">
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
    <div className="space-y-4">
      {/* Current Date/Time Clock */}
      <Card className="border-4 border-[#C8102E] bg-[#1B365D]" data-testid="card-current-datetime">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 text-[#E8DCC6]">
            <Calendar className="w-6 h-6" />
            <div className="font-mono text-xl sm:text-2xl font-bold" data-testid="text-current-date">
              {formatDate(currentTime)}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-[#E8DCC6] mt-2">
            <Clock className="w-6 h-6" />
            <div className="font-mono text-3xl sm:text-4xl font-bold tracking-wider" data-testid="text-current-time">
              {formatTime(currentTime)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Match Preview */}
      <Card className="border-4 border-[#1B365D] bg-white/90" data-testid="card-next-match">
        <CardHeader className="pb-3">
          <CardTitle className="font-league-spartan text-2xl uppercase tracking-wide text-[#1B365D] text-center">
            Next Match
          </CardTitle>
          <div className="flex items-center justify-center gap-2 text-[#C8102E] text-sm font-semibold">
            <Shield className="w-4 h-4" />
            <span className="font-league-spartan uppercase tracking-wide">{nextMatch.league.name}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Teams */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Home Team */}
            <div className="text-center">
              <img 
                src={nextMatch.homeTeam.logo} 
                alt={nextMatch.homeTeam.name}
                className="w-20 h-20 mx-auto mb-2"
                data-testid={`img-team-${nextMatch.homeTeam.id}`}
              />
              <p className="font-league-spartan font-bold text-lg text-[#1B365D]" data-testid={`text-team-name-${nextMatch.homeTeam.id}`}>
                {nextMatch.homeTeam.name}
              </p>
            </div>

            {/* VS Separator */}
            <div className="text-center">
              <p className="font-league-spartan font-black text-3xl text-[#C8102E]">VS</p>
            </div>

            {/* Away Team */}
            <div className="text-center">
              <img 
                src={nextMatch.awayTeam.logo} 
                alt={nextMatch.awayTeam.name}
                className="w-20 h-20 mx-auto mb-2"
                data-testid={`img-team-${nextMatch.awayTeam.id}`}
              />
              <p className="font-league-spartan font-bold text-lg text-[#1B365D]" data-testid={`text-team-name-${nextMatch.awayTeam.id}`}>
                {nextMatch.awayTeam.name}
              </p>
            </div>
          </div>

          {/* Match Details */}
          <div className="border-t-2 border-[#C8102E] pt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-[#1B365D]">
              <Calendar className="w-4 h-4" />
              <span className="font-libre-franklin text-base" data-testid="text-match-date">
                {formatDate(new Date(nextMatch.date))}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[#1B365D]">
              <Clock className="w-4 h-4" />
              <span className="font-libre-franklin text-base" data-testid="text-match-time">
                {new Date(nextMatch.date).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[#1B365D]">
              <MapPin className="w-4 h-4" />
              <span className="font-libre-franklin text-base" data-testid="text-match-venue">
                {nextMatch.venue.name}, {nextMatch.venue.city}
              </span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="bg-[#1B365D] rounded-lg p-4">
            <p className="font-league-spartan text-sm uppercase tracking-wide text-[#E8DCC6] text-center mb-3">
              Kickoff In
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="font-mono font-bold text-2xl sm:text-3xl text-[#C8102E]" data-testid="countdown-days">
                  {countdown.days}
                </div>
                <div className="font-league-spartan text-xs text-[#E8DCC6] uppercase mt-1">Days</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-bold text-2xl sm:text-3xl text-[#C8102E]" data-testid="countdown-hours">
                  {countdown.hours}
                </div>
                <div className="font-league-spartan text-xs text-[#E8DCC6] uppercase mt-1">Hours</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-bold text-2xl sm:text-3xl text-[#C8102E]" data-testid="countdown-minutes">
                  {countdown.minutes}
                </div>
                <div className="font-league-spartan text-xs text-[#E8DCC6] uppercase mt-1">Mins</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-bold text-2xl sm:text-3xl text-[#C8102E]" data-testid="countdown-seconds">
                  {countdown.seconds}
                </div>
                <div className="font-league-spartan text-xs text-[#E8DCC6] uppercase mt-1">Secs</div>
              </div>
            </div>
          </div>

          {/* Competition Round */}
          <div className="text-center">
            <p className="font-libre-franklin text-sm text-[#1B365D]/70" data-testid="text-match-round">
              {nextMatch.league.round}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
