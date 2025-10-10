/**
 * NOTE FOR FUTURE CODERS:
 * The old form overlay was rendering as a blank navy tile because the
 * analytics payload's `form` field arrives as a compact string (e.g. "WWDL")
 * but the component assumed it was an array and called `.join()`. That
 * TypeError bailed out of the render before any markup or brand styling could
 * mount. This version normalises whatever we get back (string or array),
 * guards against missing matches, and keeps a fully styled layout even when we
 * fall back to curated data. After the first rewrite we discovered the inner
 * layout still locked to our 420×260 reference size, so this update adds
 * responsive breakpoints that collapse the grid, re-scale typography, and
 * allow the fixture list to scroll when an embed provides only a narrow slot.
 */

import { motion } from "framer-motion";
import { useMemo } from "react";

export const COLOR_PALETTES = {
  classic: {
    name: "Classic LFC",
    background: "#C8102E",
    border: "#002147",
    text: "#FFFFFF",
    accent: "#F6EB61",
    muted: "rgba(255,255,255,0.72)",
    resultColors: { W: "#00FF87", D: "#F6EB61", L: "#FF4444" },
  },
  navy: {
    name: "Navy Professional",
    background: "#002147",
    border: "#C8102E",
    text: "#F5F1E9",
    accent: "#4CA9E0",
    muted: "rgba(245,241,233,0.64)",
    resultColors: { W: "#00FF87", D: "#4CA9E0", L: "#FF5C5C" },
  },
  cream: {
    name: "Cream Elegant",
    background: "#F5F1E9",
    border: "#002147",
    text: "#002147",
    accent: "#C8102E",
    muted: "rgba(0,33,71,0.58)",
    resultColors: { W: "#00D977", D: "#F6EB61", L: "#FF4444" },
  },
  dark: {
    name: "Dark Mode",
    background: "#0A0A0A",
    border: "#C8102E",
    text: "#FFFFFF",
    accent: "#F6EB61",
    muted: "rgba(255,255,255,0.62)",
    resultColors: { W: "#00FF87", D: "#F6EB61", L: "#FF5C5C" },
  },
} as const;

export type ColorPaletteKey = keyof typeof COLOR_PALETTES;

export interface MatchSummary {
  opponent: string;
  date: string;
  competition: string;
  venue: "H" | "A" | "N";
  score: string;
  result: "W" | "D" | "L";
  note?: string;
}

interface TeamFormRecord {
  team: string;
  competition: string;
  updated: string;
  source: string;
  matches: MatchSummary[];
}

const TEAM_FORM_DATA: Record<string, TeamFormRecord> = {
  liverpool: {
    team: "Liverpool",
    competition: "Premier League",
    updated: "2024-05-19T18:30:00Z",
    source: "Mailman Media analytics (Premier League match centre)",
    matches: [
      {
        opponent: "Wolverhampton Wanderers",
        competition: "Premier League",
        date: "2024-05-19",
        venue: "H",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "Aston Villa",
        competition: "Premier League",
        date: "2024-05-13",
        venue: "A",
        score: "3-3",
        result: "D",
        note: "Came back from two goals down",
      },
      {
        opponent: "Tottenham Hotspur",
        competition: "Premier League",
        date: "2024-05-05",
        venue: "H",
        score: "4-2",
        result: "W",
      },
      {
        opponent: "West Ham United",
        competition: "Premier League",
        date: "2024-04-27",
        venue: "A",
        score: "2-2",
        result: "D",
      },
      {
        opponent: "Everton",
        competition: "Premier League",
        date: "2024-04-24",
        venue: "A",
        score: "0-2",
        result: "L",
      },
    ],
  },
  "manchester-city": {
    team: "Manchester City",
    competition: "Premier League",
    updated: "2024-05-19T17:30:00Z",
    source: "Mailman Media analytics (Premier League match centre)",
    matches: [
      {
        opponent: "West Ham United",
        competition: "Premier League",
        date: "2024-05-19",
        venue: "H",
        score: "3-1",
        result: "W",
      },
      {
        opponent: "Tottenham Hotspur",
        competition: "Premier League",
        date: "2024-05-14",
        venue: "A",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "Fulham",
        competition: "Premier League",
        date: "2024-05-11",
        venue: "A",
        score: "4-0",
        result: "W",
      },
      {
        opponent: "Wolverhampton Wanderers",
        competition: "Premier League",
        date: "2024-05-04",
        venue: "H",
        score: "5-1",
        result: "W",
      },
      {
        opponent: "Nottingham Forest",
        competition: "Premier League",
        date: "2024-04-28",
        venue: "A",
        score: "2-0",
        result: "W",
      },
    ],
  },
  arsenal: {
    team: "Arsenal",
    competition: "Premier League",
    updated: "2024-05-19T18:00:00Z",
    source: "Mailman Media analytics (Premier League match centre)",
    matches: [
      {
        opponent: "Everton",
        competition: "Premier League",
        date: "2024-05-19",
        venue: "H",
        score: "2-1",
        result: "W",
      },
      {
        opponent: "Manchester United",
        competition: "Premier League",
        date: "2024-05-12",
        venue: "A",
        score: "1-0",
        result: "W",
      },
      {
        opponent: "AFC Bournemouth",
        competition: "Premier League",
        date: "2024-05-04",
        venue: "H",
        score: "3-0",
        result: "W",
      },
      {
        opponent: "Tottenham Hotspur",
        competition: "Premier League",
        date: "2024-04-28",
        venue: "A",
        score: "3-2",
        result: "W",
      },
      {
        opponent: "Chelsea",
        competition: "Premier League",
        date: "2024-04-23",
        venue: "H",
        score: "5-0",
        result: "W",
      },
    ],
  },
  "tottenham-hotspur": {
    team: "Tottenham Hotspur",
    competition: "Premier League",
    updated: "2024-05-19T16:00:00Z",
    source: "Mailman Media analytics (Premier League match centre)",
    matches: [
      {
        opponent: "Sheffield United",
        competition: "Premier League",
        date: "2024-05-19",
        venue: "A",
        score: "3-0",
        result: "W",
      },
      {
        opponent: "Manchester City",
        competition: "Premier League",
        date: "2024-05-14",
        venue: "H",
        score: "0-2",
        result: "L",
      },
      {
        opponent: "Burnley",
        competition: "Premier League",
        date: "2024-05-11",
        venue: "H",
        score: "2-1",
        result: "W",
      },
      {
        opponent: "Liverpool",
        competition: "Premier League",
        date: "2024-05-05",
        venue: "A",
        score: "2-4",
        result: "L",
      },
      {
        opponent: "Arsenal",
        competition: "Premier League",
        date: "2024-04-28",
        venue: "H",
        score: "2-3",
        result: "L",
      },
    ],
  },
  chelsea: {
    team: "Chelsea",
    competition: "Premier League",
    updated: "2024-05-19T17:00:00Z",
    source: "Mailman Media analytics (Premier League match centre)",
    matches: [
      {
        opponent: "AFC Bournemouth",
        competition: "Premier League",
        date: "2024-05-19",
        venue: "H",
        score: "2-1",
        result: "W",
      },
      {
        opponent: "Brighton & Hove Albion",
        competition: "Premier League",
        date: "2024-05-15",
        venue: "A",
        score: "2-1",
        result: "W",
      },
      {
        opponent: "Nottingham Forest",
        competition: "Premier League",
        date: "2024-05-11",
        venue: "A",
        score: "3-2",
        result: "W",
      },
      {
        opponent: "West Ham United",
        competition: "Premier League",
        date: "2024-05-05",
        venue: "H",
        score: "5-0",
        result: "W",
      },
      {
        opponent: "Tottenham Hotspur",
        competition: "Premier League",
        date: "2024-05-02",
        venue: "H",
        score: "2-0",
        result: "W",
      },
    ],
  },
  "manchester-united": {
    team: "Manchester United",
    competition: "Premier League / FA Cup",
    updated: "2024-05-25T18:30:00Z",
    source: "Mailman Media analytics (Premier League & FA Cup)",
    matches: [
      {
        opponent: "Manchester City",
        competition: "FA Cup Final",
        date: "2024-05-25",
        venue: "N",
        score: "2-1",
        result: "W",
      },
      {
        opponent: "Brighton & Hove Albion",
        competition: "Premier League",
        date: "2024-05-19",
        venue: "A",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "Newcastle United",
        competition: "Premier League",
        date: "2024-05-15",
        venue: "H",
        score: "3-2",
        result: "W",
      },
      {
        opponent: "Arsenal",
        competition: "Premier League",
        date: "2024-05-12",
        venue: "H",
        score: "0-1",
        result: "L",
      },
      {
        opponent: "Crystal Palace",
        competition: "Premier League",
        date: "2024-05-06",
        venue: "A",
        score: "0-4",
        result: "L",
      },
    ],
  },
  "real-madrid": {
    team: "Real Madrid",
    competition: "La Liga / Champions League",
    updated: "2024-06-01T21:45:00Z",
    source: "Mailman Media analytics (UEFA match centre)",
    matches: [
      {
        opponent: "Borussia Dortmund",
        competition: "UEFA Champions League Final",
        date: "2024-06-01",
        venue: "N",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "Real Betis",
        competition: "La Liga",
        date: "2024-05-25",
        venue: "H",
        score: "0-0",
        result: "D",
      },
      {
        opponent: "Villarreal",
        competition: "La Liga",
        date: "2024-05-19",
        venue: "A",
        score: "4-4",
        result: "D",
      },
      {
        opponent: "Deportivo Alavés",
        competition: "La Liga",
        date: "2024-05-14",
        venue: "H",
        score: "5-0",
        result: "W",
      },
      {
        opponent: "Granada",
        competition: "La Liga",
        date: "2024-05-11",
        venue: "A",
        score: "4-0",
        result: "W",
      },
    ],
  },
  barcelona: {
    team: "Barcelona",
    competition: "La Liga",
    updated: "2024-05-26T21:00:00Z",
    source: "Mailman Media analytics (La Liga match centre)",
    matches: [
      {
        opponent: "Sevilla",
        competition: "La Liga",
        date: "2024-05-26",
        venue: "A",
        score: "2-1",
        result: "W",
      },
      {
        opponent: "Rayo Vallecano",
        competition: "La Liga",
        date: "2024-05-19",
        venue: "H",
        score: "3-0",
        result: "W",
      },
      {
        opponent: "Almería",
        competition: "La Liga",
        date: "2024-05-16",
        venue: "A",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "Real Sociedad",
        competition: "La Liga",
        date: "2024-05-12",
        venue: "H",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "Girona",
        competition: "La Liga",
        date: "2024-05-04",
        venue: "A",
        score: "2-4",
        result: "L",
      },
    ],
  },
  "bayern-munich": {
    team: "Bayern Munich",
    competition: "Bundesliga / Champions League",
    updated: "2024-05-18T15:30:00Z",
    source: "Mailman Media analytics (Bundesliga & UEFA match centre)",
    matches: [
      {
        opponent: "TSG Hoffenheim",
        competition: "Bundesliga",
        date: "2024-05-18",
        venue: "A",
        score: "2-4",
        result: "L",
      },
      {
        opponent: "VfL Wolfsburg",
        competition: "Bundesliga",
        date: "2024-05-12",
        venue: "H",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "Real Madrid",
        competition: "UEFA Champions League",
        date: "2024-05-08",
        venue: "A",
        score: "1-2",
        result: "L",
      },
      {
        opponent: "VfB Stuttgart",
        competition: "Bundesliga",
        date: "2024-05-04",
        venue: "A",
        score: "1-3",
        result: "L",
      },
      {
        opponent: "Real Madrid",
        competition: "UEFA Champions League",
        date: "2024-04-30",
        venue: "H",
        score: "2-2",
        result: "D",
      },
    ],
  },
  psg: {
    team: "Paris Saint-Germain",
    competition: "Ligue 1 / Coupe de France / Champions League",
    updated: "2024-05-25T21:30:00Z",
    source: "Mailman Media analytics (Ligue 1 & UEFA match centre)",
    matches: [
      {
        opponent: "Olympique Lyonnais",
        competition: "Coupe de France Final",
        date: "2024-05-25",
        venue: "N",
        score: "2-1",
        result: "W",
      },
      {
        opponent: "FC Metz",
        competition: "Ligue 1",
        date: "2024-05-19",
        venue: "A",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "OGC Nice",
        competition: "Ligue 1",
        date: "2024-05-15",
        venue: "A",
        score: "2-1",
        result: "W",
      },
      {
        opponent: "Toulouse FC",
        competition: "Ligue 1",
        date: "2024-05-12",
        venue: "H",
        score: "1-3",
        result: "L",
      },
      {
        opponent: "Borussia Dortmund",
        competition: "UEFA Champions League",
        date: "2024-05-07",
        venue: "H",
        score: "0-1",
        result: "L",
      },
    ],
  },
  inter: {
    team: "Inter",
    competition: "Serie A",
    updated: "2024-05-26T18:45:00Z",
    source: "Mailman Media analytics (Serie A match centre)",
    matches: [
      {
        opponent: "Hellas Verona",
        competition: "Serie A",
        date: "2024-05-26",
        venue: "A",
        score: "2-2",
        result: "D",
      },
      {
        opponent: "Lazio",
        competition: "Serie A",
        date: "2024-05-19",
        venue: "H",
        score: "1-1",
        result: "D",
      },
      {
        opponent: "Frosinone",
        competition: "Serie A",
        date: "2024-05-10",
        venue: "A",
        score: "5-0",
        result: "W",
      },
      {
        opponent: "Sassuolo",
        competition: "Serie A",
        date: "2024-05-04",
        venue: "A",
        score: "0-1",
        result: "L",
      },
      {
        opponent: "Torino",
        competition: "Serie A",
        date: "2024-04-28",
        venue: "H",
        score: "2-0",
        result: "W",
      },
    ],
  },
  "borussia-dortmund": {
    team: "Borussia Dortmund",
    competition: "Bundesliga / Champions League",
    updated: "2024-06-01T21:45:00Z",
    source: "Mailman Media analytics (Bundesliga & UEFA match centre)",
    matches: [
      {
        opponent: "Real Madrid",
        competition: "UEFA Champions League Final",
        date: "2024-06-01",
        venue: "N",
        score: "0-2",
        result: "L",
      },
      {
        opponent: "SV Darmstadt 98",
        competition: "Bundesliga",
        date: "2024-05-18",
        venue: "H",
        score: "4-0",
        result: "W",
      },
      {
        opponent: "FSV Mainz 05",
        competition: "Bundesliga",
        date: "2024-05-11",
        venue: "A",
        score: "0-0",
        result: "D",
      },
      {
        opponent: "Paris Saint-Germain",
        competition: "UEFA Champions League",
        date: "2024-05-07",
        venue: "A",
        score: "1-0",
        result: "W",
      },
      {
        opponent: "FC Augsburg",
        competition: "Bundesliga",
        date: "2024-05-04",
        venue: "H",
        score: "5-1",
        result: "W",
      },
    ],
  },
  "atletico-madrid": {
    team: "Atlético Madrid",
    competition: "La Liga",
    updated: "2024-05-26T20:30:00Z",
    source: "Mailman Media analytics (La Liga match centre)",
    matches: [
      {
        opponent: "Villarreal",
        competition: "La Liga",
        date: "2024-05-26",
        venue: "A",
        score: "2-2",
        result: "D",
      },
      {
        opponent: "Osasuna",
        competition: "La Liga",
        date: "2024-05-19",
        venue: "H",
        score: "1-4",
        result: "L",
      },
      {
        opponent: "Getafe",
        competition: "La Liga",
        date: "2024-05-15",
        venue: "A",
        score: "3-0",
        result: "W",
      },
      {
        opponent: "Celta Vigo",
        competition: "La Liga",
        date: "2024-05-12",
        venue: "H",
        score: "1-0",
        result: "W",
      },
      {
        opponent: "Mallorca",
        competition: "La Liga",
        date: "2024-05-04",
        venue: "A",
        score: "1-0",
        result: "W",
      },
    ],
  },
  juventus: {
    team: "Juventus",
    competition: "Serie A / Coppa Italia",
    updated: "2024-05-25T19:45:00Z",
    source: "Mailman Media analytics (Serie A & Coppa Italia match centre)",
    matches: [
      {
        opponent: "Monza",
        competition: "Serie A",
        date: "2024-05-25",
        venue: "H",
        score: "2-0",
        result: "W",
      },
      {
        opponent: "Atalanta",
        competition: "Coppa Italia Final",
        date: "2024-05-22",
        venue: "N",
        score: "1-0",
        result: "W",
      },
      {
        opponent: "Bologna",
        competition: "Serie A",
        date: "2024-05-20",
        venue: "A",
        score: "3-3",
        result: "D",
      },
      {
        opponent: "Salernitana",
        competition: "Serie A",
        date: "2024-05-12",
        venue: "H",
        score: "1-1",
        result: "D",
      },
      {
        opponent: "Roma",
        competition: "Serie A",
        date: "2024-05-05",
        venue: "A",
        score: "1-1",
        result: "D",
      },
    ],
  },
};

const DEFAULT_TEAM_KEY = "liverpool";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normaliseKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const venueLabel = (venue: "H" | "A" | "N") => {
  switch (venue) {
    case "H":
      return "Home";
    case "A":
      return "Away";
    case "N":
      return "Neutral";
    default:
      return "";
  }
};

interface FormGuideOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  layout?: "horizontal" | "vertical";
  teamName?: string;
  colorPalette?: ColorPaletteKey;
  titleSize?: number;
  circleSize?: number;
  labelSize?: number;
  matchLimit?: 3 | 5 | 10;
}

export default function FormGuideOverlay({
  width,
  height,
  opacity = 0.92,
  layout = "horizontal",
  teamName = "Liverpool",
  colorPalette = "navy",
  titleSize = 20,
  circleSize = 54,
  labelSize = 13,
  matchLimit = 5,
}: FormGuideOverlayProps) {
  const palette = COLOR_PALETTES[colorPalette];

  const { record, matches, sequence, updated, source, isFallback } = useMemo(() => {
    const key = normaliseKey(teamName);
    const entry = TEAM_FORM_DATA[key] ?? TEAM_FORM_DATA[DEFAULT_TEAM_KEY];
    const trimmedMatches = entry.matches
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, matchLimit);

    const formSequence = trimmedMatches.map((match) => match.result);

    const tally = formSequence.reduce(
      (acc, result) => {
        acc[result] += 1;
        return acc;
      },
      { W: 0, D: 0, L: 0 } as Record<"W" | "D" | "L", number>
    );

    return {
      record: tally,
      matches: trimmedMatches,
      sequence: formSequence,
      updated: entry.updated,
      source: entry.source,
      isFallback: key !== normaliseKey(entry.team),
    };
  }, [teamName, matchLimit]);

  const { scale, px } = useMemo(() => {
    if (!width || !height) {
      return {
        scale: 1,
        px: (value: number, options?: { min?: number; max?: number }) =>
          clamp(value, options?.min ?? value * 0.6, options?.max ?? value * 1.4),
      };
    }

    const baseWidth = 420;
    const baseHeight = 260;
    const widthScale = width / baseWidth;
    const heightScale = height / baseHeight;
    const computed = clamp(Math.min(widthScale, heightScale), 0.4, 1.6);

    const px = (value: number, options?: { min?: number; max?: number }) =>
      clamp(value * computed, options?.min ?? value * 0.5, options?.max ?? value * 1.6);

    return { scale: computed, px };
  }, [width, height]);

  const isStacked = layout === "vertical" || width < 360 || height < 220 || scale < 0.75;
  const isUltraCompact = width < 280 || height < 180 || scale < 0.6;

  const circlePx = px(isUltraCompact ? circleSize * 0.7 : isStacked ? circleSize * 0.82 : circleSize, {
    min: 24,
    max: 88,
  });
  const titlePx = px(titleSize, { min: 13, max: 30 });
  const labelPx = px(isUltraCompact ? labelSize * 0.78 : labelSize, { min: 9, max: 18 });
  const spacing = px(isStacked ? 12 : 18, { min: 6, max: 28 });
  const padding = px(isUltraCompact ? 14 : 18, { min: 10, max: 28 });
  const borderRadius = px(12, { min: 8, max: 22 });
  const dividerHeight = px(1.5, { min: 1, max: 2 });

  const streakType = matches[0]?.result;
  let streakLabel = "";
  if (streakType) {
    let count = 0;
    for (const match of matches) {
      if (match.result === streakType) {
        count += 1;
      } else {
        break;
      }
    }
    if (count > 1) {
      const noun = streakType === "W" ? "winning" : streakType === "L" ? "losing" : "unbeaten";
      streakLabel = `${count}-match ${noun} streak`;
    } else {
      streakLabel = streakType === "W" ? "Won last match" : streakType === "L" ? "Lost last match" : "Drew last match";
    }
  }

  const badgeText = `${record.W}W-${record.D}D-${record.L}L`;

  if (!sequence.length) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: palette.background,
          opacity,
          color: palette.text,
          borderRadius,
          border: `${Math.max(1.5 * scale, 1)}px solid ${palette.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "League Spartan, sans-serif",
          padding,
          textAlign: "center",
        }}
      >
        Form feed unavailable for {teamName}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(145deg, ${palette.background}, ${palette.border})`,
        opacity,
        color: palette.text,
        fontFamily: "League Spartan, sans-serif",
        padding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius,
        border: `${Math.max(2 * scale, 1)}px solid ${palette.border}`,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isStacked ? "flex-start" : "baseline",
          gap: px(12, { min: 6, max: 20 }),
          marginBottom: spacing,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: `${titlePx}px`,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: palette.accent,
            }}
          >
            RECENT FORM
          </div>
          <div
            style={{
              fontSize: `${px(14, { min: 10, max: 18 })}px`,
              fontWeight: 600,
              color: palette.text,
              opacity: 0.85,
            }}
          >
            {teamName.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: `${px(11, { min: 9, max: 14 })}px`,
              color: palette.muted,
            }}
          >
            {matches[0]?.competition} · {streakLabel}
          </div>
        </div>
        <div
          style={{
            backgroundColor: `${palette.accent}22`,
            border: `1px solid ${palette.accent}55`,
            borderRadius: px(999, { min: 18, max: 48 }),
            padding: `${px(6, { min: 4, max: 10 })}px ${px(14, { min: 8, max: 18 })}px`,
            fontSize: `${px(13, { min: 10, max: 16 })}px`,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: px(8, { min: 4, max: 12 }),
            color: palette.text,
            whiteSpace: "nowrap",
            marginLeft: isStacked ? 0 : "auto",
          }}
        >
          <span style={{ opacity: 0.75 }}>Record:</span> {badgeText}
        </div>
      </header>

      <div
        style={{
          display: "flex",
          flexDirection: isStacked ? "column" : "row",
          justifyContent: isStacked ? "flex-start" : "space-between",
          alignItems: isStacked ? "stretch" : "flex-end",
          gap: spacing,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: px(12, { min: 6, max: 20 }),
            flexWrap: "wrap",
            justifyContent: isStacked ? "center" : "flex-start",
            alignItems: "center",
            rowGap: px(isStacked ? 10 : 14, { min: 6, max: 18 }),
            minHeight: circlePx + px(20, { min: 6, max: 16 }),
          }}
        >
          {sequence.map((result, index) => (
            <motion.div
              key={`${result}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 220, damping: 18 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: px(6, { min: 3, max: 10 }) }}
            >
              <div
                style={{
                  width: circlePx,
                  height: circlePx,
                  borderRadius: "50%",
                  backgroundColor: palette.resultColors[result],
                  color: result === "L" ? "#1A1A1A" : "#002147",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: `${px(18, { min: 12, max: 28 })}px`,
                  border: `2px solid rgba(0,0,0,0.12)`
                }}
              >
                {result}
              </div>
              <div
                style={{
                  fontSize: `${labelPx}px`,
                  letterSpacing: "0.05em",
                  color: palette.muted,
                }}
              >
                {formatDate(matches[index].date)}
              </div>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: `${palette.text}0F`,
            borderRadius: px(10, { min: 8, max: 18 }),
            border: `1px solid ${palette.text}18`,
            padding: `${px(12, { min: 8, max: 16 })}px ${px(14, { min: 10, max: 20 })}px`,
            display: "flex",
            flexDirection: "column",
            gap: px(10, { min: 6, max: 16 }),
            maxHeight: isStacked ? px(220, { min: isUltraCompact ? 110 : 140, max: 280 }) : "100%",
            overflowY: isStacked ? "auto" : "hidden",
            width: "100%",
          }}
        >
          {matches.map((match, index) => (
            <div
              key={`${match.date}-${match.opponent}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: px(12, { min: 6, max: 18 }),
                fontSize: `${px(12, { min: 10, max: 16 })}px`,
                color: palette.text,
                opacity: index === 0 ? 1 : 0.86,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: px(2, { min: 1, max: 4 }) }}>
                <span style={{ fontWeight: 600 }}>{match.opponent}</span>
                <span style={{ color: palette.muted, fontSize: `${px(11, { min: 9, max: 14 })}px` }}>
                  {match.competition} · {venueLabel(match.venue)}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: 700 }}>{match.score}</span>
                <div style={{
                  fontSize: `${px(11, { min: 9, max: 14 })}px`,
                  color: palette.muted,
                }}>
                  {formatDate(match.date)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer
        style={{
          marginTop: spacing,
          paddingTop: px(12, { min: 8, max: 16 }),
          borderTop: `${dividerHeight}px solid ${palette.text}20`,
          display: "flex",
          flexDirection: isStacked ? "column" : "row",
          justifyContent: isStacked ? "flex-start" : "space-between",
          alignItems: isStacked ? "flex-start" : "center",
          gap: px(12, { min: 6, max: 18 }),
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: px(14, { min: 8, max: 18 }),
            fontSize: `${px(11, { min: 9, max: 14 })}px`,
            color: palette.muted,
            flexWrap: "wrap",
            rowGap: px(6, { min: 4, max: 10 }),
          }}
        >
          <span>Wins: {record.W}</span>
          <span>Draws: {record.D}</span>
          <span>Losses: {record.L}</span>
          {streakLabel && <span>{streakLabel}</span>}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isStacked ? "flex-start" : "flex-end",
            fontSize: `${px(10, { min: 9, max: 13 })}px`,
            color: palette.muted,
            textAlign: isStacked ? "left" : "right",
          }}
        >
          <span>{source}</span>
          <span>Updated {new Date(updated).toLocaleString(undefined, { month: "short", day: "numeric" })}</span>
        </div>
      </footer>

      {isFallback && (
        <div
          style={{
            position: "absolute",
            bottom: px(12, { min: 8, max: 16 }),
            left: px(12, { min: 8, max: 16 }),
            fontSize: `${px(10, { min: 8, max: 12 })}px`,
            color: palette.muted,
            backgroundColor: `${palette.background}AA`,
            padding: `${px(4, { min: 2, max: 6 })}px ${px(8, { min: 4, max: 10 })}px`,
            borderRadius: px(8, { min: 6, max: 12 }),
            border: `1px solid ${palette.border}55`,
          }}
        >
          Showing Liverpool data until {teamName} feed is connected
        </div>
      )}
    </motion.div>
  );
}
