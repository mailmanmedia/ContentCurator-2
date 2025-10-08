import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy, Shield, Users } from "lucide-react";

interface Team {
  id: number;
  name: string;
  logo?: string;
  competitions: string[];
}

interface Competition {
  id: number;
  name: string;
  icon?: any;
}

interface TeamSelectorProps {
  value?: number;
  onChange: (teamId: number) => void;
  placeholder?: string;
  showCompetitions?: boolean;
  competitionFilter?: string;
  className?: string;
}

// Complete team lists for all competitions
const ALL_TEAMS: Team[] = [
  // Premier League Teams (2024-25 Season)
  { id: 33, name: "Manchester United", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Europa League"] },
  { id: 34, name: "Newcastle United", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Champions League"] },
  { id: 35, name: "Bournemouth", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 36, name: "Fulham", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 38, name: "Watford", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 39, name: "Wolverhampton", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 40, name: "Liverpool", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Champions League"] },
  { id: 41, name: "Southampton", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 42, name: "Arsenal", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Champions League"] },
  { id: 45, name: "Everton", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 46, name: "Leicester City", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 47, name: "Tottenham Hotspur", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Europa League"] },
  { id: 48, name: "West Ham United", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Europa League"] },
  { id: 49, name: "Chelsea", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Conference League"] },
  { id: 50, name: "Manchester City", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Champions League"] },
  { id: 51, name: "Brighton", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Europa League"] },
  { id: 52, name: "Crystal Palace", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 55, name: "Brentford", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 66, name: "Aston Villa", competitions: ["Premier League", "FA Cup", "Carabao Cup", "Champions League"] },
  { id: 71, name: "Nottingham Forest", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  { id: 1359, name: "Ipswich Town", competitions: ["Premier League", "FA Cup", "Carabao Cup"] },
  
  // Championship & Lower League Teams (FA Cup/Carabao Cup participants)
  { id: 72, name: "Leeds United", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 73, name: "Sheffield United", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 74, name: "Burnley", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 75, name: "Middlesbrough", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 76, name: "Norwich City", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 77, name: "West Bromwich Albion", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 78, name: "Sunderland", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 79, name: "Stoke City", competitions: ["FA Cup", "Carabao Cup"] },
  { id: 80, name: "Swansea City", competitions: ["FA Cup", "Carabao Cup"] },
  
  // European Competition Teams
  { id: 85, name: "Paris Saint-Germain", competitions: ["Champions League"] },
  { id: 86, name: "Real Madrid", competitions: ["Champions League"] },
  { id: 87, name: "Barcelona", competitions: ["Champions League"] },
  { id: 88, name: "Bayern Munich", competitions: ["Champions League"] },
  { id: 89, name: "Juventus", competitions: ["Champions League"] },
  { id: 90, name: "AC Milan", competitions: ["Champions League"] },
  { id: 91, name: "Inter Milan", competitions: ["Champions League"] },
  { id: 92, name: "Atletico Madrid", competitions: ["Champions League"] },
  { id: 93, name: "Borussia Dortmund", competitions: ["Champions League"] },
  { id: 94, name: "RB Leipzig", competitions: ["Champions League"] },
  { id: 95, name: "Benfica", competitions: ["Champions League"] },
  { id: 96, name: "Porto", competitions: ["Champions League"] },
  { id: 97, name: "Ajax", competitions: ["Europa League"] },
  { id: 98, name: "Roma", competitions: ["Europa League"] },
  { id: 99, name: "Sevilla", competitions: ["Europa League"] },
];

const COMPETITIONS: Competition[] = [
  { id: 39, name: "Premier League", icon: Trophy },
  { id: 2, name: "Champions League", icon: Trophy },
  { id: 3, name: "Europa League", icon: Shield },
  { id: 45, name: "FA Cup", icon: Trophy },
  { id: 48, name: "Carabao Cup", icon: Trophy },
  { id: 537, name: "Conference League", icon: Shield },
];

export default function TeamSelector({
  value,
  onChange,
  placeholder = "Select a team",
  showCompetitions = true,
  competitionFilter,
  className = "",
}: TeamSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTeams, setFilteredTeams] = useState<Team[]>(ALL_TEAMS);

  useEffect(() => {
    let teams = ALL_TEAMS;
    
    // Filter by competition if specified
    if (competitionFilter) {
      teams = teams.filter(team => 
        team.competitions.includes(competitionFilter)
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      teams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort alphabetically
    teams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    
    setFilteredTeams(teams);
  }, [searchTerm, competitionFilter]);

  const selectedTeam = ALL_TEAMS.find(t => t.id === value);

  const getCompetitionColor = (comp: string) => {
    switch (comp) {
      case "Champions League":
        return "bg-blue-500 text-white";
      case "Europa League":
        return "bg-orange-500 text-white";
      case "Conference League":
        return "bg-green-500 text-white";
      case "Premier League":
        return "bg-purple-500 text-white";
      case "FA Cup":
        return "bg-red-500 text-white";
      case "Carabao Cup":
        return "bg-cyan-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Group teams by competition
  const groupedTeams = competitionFilter ? { [competitionFilter]: filteredTeams } : 
    COMPETITIONS.reduce((acc, comp) => {
      const teamsInComp = filteredTeams.filter(team =>
        team.competitions.includes(comp.name)
      );
      if (teamsInComp.length > 0) {
        acc[comp.name] = teamsInComp;
      }
      return acc;
    }, {} as Record<string, Team[]>);

  return (
    <Select value={value?.toString()} onValueChange={(val) => onChange(parseInt(val))}>
      <SelectTrigger className={`w-full ${className}`} data-testid="select-team">
        <SelectValue placeholder={placeholder}>
          {selectedTeam && (
            <div className="flex items-center gap-2">
              <span>{selectedTeam.name}</span>
              {showCompetitions && selectedTeam.competitions.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {selectedTeam.competitions.length} comps
                </Badge>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        <div className="sticky top-0 p-2 bg-background border-b">
          <input
            type="text"
            placeholder="Search teams..."
            className="w-full px-3 py-2 text-sm border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            data-testid="input-team-search"
          />
        </div>
        
        {Object.entries(groupedTeams).map(([competition, teams]) => (
          <SelectGroup key={competition}>
            <SelectLabel className="flex items-center gap-2 font-bold">
              <Trophy className="w-4 h-4" />
              {competition} ({teams.length})
            </SelectLabel>
            {teams.map((team) => (
              <SelectItem 
                key={team.id} 
                value={team.id.toString()}
                data-testid={`option-team-${team.id}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{team.name}</span>
                  {showCompetitions && team.competitions.length > 0 && (
                    <div className="flex gap-1 ml-2">
                      {team.competitions.slice(0, 2).map((comp) => (
                        <Badge 
                          key={comp} 
                          variant="secondary" 
                          className={`text-xs ${getCompetitionColor(comp)}`}
                        >
                          {comp.slice(0, 3).toUpperCase()}
                        </Badge>
                      ))}
                      {team.competitions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{team.competitions.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        
        {filteredTeams.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No teams found
          </div>
        )}
      </SelectContent>
    </Select>
  );
}