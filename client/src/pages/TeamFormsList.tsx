
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function TeamFormsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['all-teams-forms'],
    queryFn: async () => {
      const response = await fetch('/api/football/teams/all-forms?season=2025&leagueId=39');
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">Error loading teams: {error.message}</div>
      </div>
    );
  }

  const getFormColor = (result: string) => {
    if (result === 'W') return 'bg-green-500';
    if (result === 'D') return 'bg-yellow-500';
    if (result === 'L') return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">All Teams Current Form</h1>
      <p className="text-muted-foreground mb-4">
        Showing {data?.count || 0} teams from Season {data?.season} (League ID: {data?.leagueId})
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.teams?.map((team: any) => (
          <Card key={team.teamId}>
            <CardHeader>
              <CardTitle className="text-lg">{team.teamName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Form:</span>
                  {team.form ? (
                    <div className="flex gap-1">
                      {team.form.split('').map((result: string, idx: number) => (
                        <div
                          key={idx}
                          className={`w-6 h-6 rounded-full ${getFormColor(result)} flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No form data</span>
                  )}
                </div>

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matches Played:</span>
                    <span className="font-medium">{team.matchesPlayed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Record:</span>
                    <span className="font-medium">
                      {team.wins}W - {team.draws}D - {team.losses}L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Goals:</span>
                    <span className="font-medium">
                      {team.goalsFor} - {team.goalsAgainst}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="text-xs">
                      {team.lastUpdated ? new Date(team.lastUpdated).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!data?.teams?.length && (
        <div className="text-center py-12 text-muted-foreground">
          No teams found in the database for this season
        </div>
      )}
    </div>
  );
}
