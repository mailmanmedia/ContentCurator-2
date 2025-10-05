import { db } from "../db";
import { teamSeasonStatistics } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface AIStatsResponse {
  form: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
}

export async function fetchStatsWithAI(
  teamName: string,
  leagueName: string,
  season: number
): Promise<AIStatsResponse | null> {
  try {
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!perplexityApiKey) {
      console.error("PERPLEXITY_API_KEY not found");
      return null;
    }

    const prompt = `What are ${teamName}'s current ${season}-${season + 1} ${leagueName} season statistics? 

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "form": "last 5 match results as single letters (W/D/L), newest first, e.g. WWLWD",
  "matchesPlayed": total_matches_played_this_season,
  "wins": total_wins,
  "draws": total_draws, 
  "losses": total_losses,
  "goalsFor": total_goals_scored,
  "goalsAgainst": total_goals_conceded,
  "cleanSheets": total_clean_sheets
}`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a football statistics expert. Always respond with ONLY a valid JSON object, no additional text, no markdown formatting, no code blocks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        search_recency_filter: "week",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status}`);
      console.error(`Perplexity error details: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("No content in Perplexity response");
      return null;
    }

    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const stats = JSON.parse(jsonContent);

    return {
      form: stats.form || "DDDDD",
      matchesPlayed: stats.matchesPlayed || 0,
      wins: stats.wins || 0,
      draws: stats.draws || 0,
      losses: stats.losses || 0,
      goalsFor: stats.goalsFor || 0,
      goalsAgainst: stats.goalsAgainst || 0,
      cleanSheets: stats.cleanSheets || 0,
    };
  } catch (error) {
    console.error("AI stats fetch error:", error);
    return null;
  }
}

export async function updateLiverpoolStatsWithAI(): Promise<boolean> {
  try {
    const season = new Date().getFullYear();
    const teamId = 40; // Liverpool
    const leagueId = 39; // Premier League

    console.log(`[AI Stats] Fetching Liverpool stats for ${season} season...`);

    const aiStats = await fetchStatsWithAI("Liverpool", "Premier League", season);

    if (!aiStats) {
      console.log("[AI Stats] Failed to fetch stats from AI");
      return false;
    }

    console.log(`[AI Stats] Received: W${aiStats.wins} D${aiStats.draws} L${aiStats.losses}, Form: ${aiStats.form}`);

    await db
      .insert(teamSeasonStatistics)
      .values({
        teamId,
        leagueId,
        season,
        form: aiStats.form,
        matchesPlayed: aiStats.matchesPlayed,
        wins: aiStats.wins,
        draws: aiStats.draws,
        losses: aiStats.losses,
        goalsFor: aiStats.goalsFor,
        goalsAgainst: aiStats.goalsAgainst,
        cleanSheets: aiStats.cleanSheets,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          teamSeasonStatistics.teamId,
          teamSeasonStatistics.leagueId,
          teamSeasonStatistics.season,
        ],
        set: {
          form: aiStats.form,
          matchesPlayed: aiStats.matchesPlayed,
          wins: aiStats.wins,
          draws: aiStats.draws,
          losses: aiStats.losses,
          goalsFor: aiStats.goalsFor,
          goalsAgainst: aiStats.goalsAgainst,
          cleanSheets: aiStats.cleanSheets,
          lastUpdated: new Date(),
        },
      });

    console.log("[AI Stats] Successfully updated Liverpool statistics");
    return true;
  } catch (error) {
    console.error("[AI Stats] Update error:", error);
    return false;
  }
}
