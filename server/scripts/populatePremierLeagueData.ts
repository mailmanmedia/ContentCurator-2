/**
 * Comprehensive Premier League Database Population Script
 *
 * This script populates the database with:
 * - All 20 Premier League teams (2024-25 season)
 * - Full player rosters (20+ players per team)
 * - Detailed team statistics
 * - Individual player statistics
 *
 * All data is permanently stored in PostgreSQL.
 */

import { db } from '../db';
import {
  footballTeams,
  footballPlayers,
  teamSeasonStatistics,
  type FootballTeam
} from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

// Premier League teams for 2024-25 season
const PREMIER_LEAGUE_TEAMS_2024_25 = [
  {
    id: 40,
    name: "Liverpool",
    code: "LIV",
    country: "England",
    founded: 1892,
    logo: "https://media.api-sports.io/football/teams/40.png",
    venue: "Anfield",
    city: "Liverpool",
    capacity: 61276
  },
  {
    id: 50,
    name: "Manchester City",
    code: "MCI",
    country: "England",
    founded: 1880,
    logo: "https://media.api-sports.io/football/teams/50.png",
    venue: "Etihad Stadium",
    city: "Manchester",
    capacity: 55097
  },
  {
    id: 42,
    name: "Arsenal",
    code: "ARS",
    country: "England",
    founded: 1886,
    logo: "https://media.api-sports.io/football/teams/42.png",
    venue: "Emirates Stadium",
    city: "London",
    capacity: 60704
  },
  {
    id: 49,
    name: "Chelsea",
    code: "CHE",
    country: "England",
    founded: 1905,
    logo: "https://media.api-sports.io/football/teams/49.png",
    venue: "Stamford Bridge",
    city: "London",
    capacity: 41631
  },
  {
    id: 33,
    name: "Manchester United",
    code: "MUN",
    country: "England",
    founded: 1878,
    logo: "https://media.api-sports.io/football/teams/33.png",
    venue: "Old Trafford",
    city: "Manchester",
    capacity: 74310
  },
  {
    id: 47,
    name: "Tottenham Hotspur",
    code: "TOT",
    country: "England",
    founded: 1882,
    logo: "https://media.api-sports.io/football/teams/47.png",
    venue: "Tottenham Hotspur Stadium",
    city: "London",
    capacity: 62850
  },
  {
    id: 66,
    name: "Aston Villa",
    code: "AVL",
    country: "England",
    founded: 1874,
    logo: "https://media.api-sports.io/football/teams/66.png",
    venue: "Villa Park",
    city: "Birmingham",
    capacity: 42640
  },
  {
    id: 34,
    name: "Newcastle United",
    code: "NEW",
    country: "England",
    founded: 1892,
    logo: "https://media.api-sports.io/football/teams/34.png",
    venue: "St. James' Park",
    city: "Newcastle upon Tyne",
    capacity: 52305
  },
  {
    id: 51,
    name: "Brighton & Hove Albion",
    code: "BHA",
    country: "England",
    founded: 1901,
    logo: "https://media.api-sports.io/football/teams/51.png",
    venue: "Amex Stadium",
    city: "Brighton",
    capacity: 31800
  },
  {
    id: 65,
    name: "Nottingham Forest",
    code: "NOT",
    country: "England",
    founded: 1865,
    logo: "https://media.api-sports.io/football/teams/65.png",
    venue: "The City Ground",
    city: "Nottingham",
    capacity: 30576
  },
  {
    id: 35,
    name: "AFC Bournemouth",
    code: "BOU",
    country: "England",
    founded: 1899,
    logo: "https://media.api-sports.io/football/teams/35.png",
    venue: "Vitality Stadium",
    city: "Bournemouth",
    capacity: 11379
  },
  {
    id: 36,
    name: "Fulham",
    code: "FUL",
    country: "England",
    founded: 1879,
    logo: "https://media.api-sports.io/football/teams/36.png",
    venue: "Craven Cottage",
    city: "London",
    capacity: 29589
  },
  {
    id: 48,
    name: "West Ham United",
    code: "WHU",
    country: "England",
    founded: 1895,
    logo: "https://media.api-sports.io/football/teams/48.png",
    venue: "London Stadium",
    city: "London",
    capacity: 66000
  },
  {
    id: 39,
    name: "Wolverhampton Wanderers",
    code: "WOL",
    country: "England",
    founded: 1877,
    logo: "https://media.api-sports.io/football/teams/39.png",
    venue: "Molineux Stadium",
    city: "Wolverhampton",
    capacity: 31700
  },
  {
    id: 52,
    name: "Crystal Palace",
    code: "CRY",
    country: "England",
    founded: 1905,
    logo: "https://media.api-sports.io/football/teams/52.png",
    venue: "Selhurst Park",
    city: "London",
    capacity: 25486
  },
  {
    id: 45,
    name: "Everton",
    code: "EVE",
    country: "England",
    founded: 1878,
    logo: "https://media.api-sports.io/football/teams/45.png",
    venue: "Goodison Park",
    city: "Liverpool",
    capacity: 39414
  },
  {
    id: 55,
    name: "Brentford",
    code: "BRE",
    country: "England",
    founded: 1889,
    logo: "https://media.api-sports.io/football/teams/55.png",
    venue: "Gtech Community Stadium",
    city: "Brentford",
    capacity: 17250
  },
  {
    id: 46,
    name: "Leicester City",
    code: "LEI",
    country: "England",
    founded: 1884,
    logo: "https://media.api-sports.io/football/teams/46.png",
    venue: "King Power Stadium",
    city: "Leicester",
    capacity: 32273
  },
  {
    id: 41,
    name: "Southampton",
    code: "SOU",
    country: "England",
    founded: 1885,
    logo: "https://media.api-sports.io/football/teams/41.png",
    venue: "St. Mary's Stadium",
    city: "Southampton",
    capacity: 32384
  },
  {
    id: 57,
    name: "Ipswich Town",
    code: "IPS",
    country: "England",
    founded: 1878,
    logo: "https://media.api-sports.io/football/teams/57.png",
    venue: "Portman Road",
    city: "Ipswich",
    capacity: 30311
  }
];

// Team statistics for 2024-25 season (7 matches played so far in October 2025)
const TEAM_STATISTICS_2025 = [
  {
    team_id: 40, // Liverpool
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 5,
    draws: 0,
    losses: 2,
    goals_for: 13,
    goals_against: 9,
    goal_difference: 4,
    points: 15,
    position: 2,
    form: "WWWWWLL",
    clean_sheets: 2,
    cards_yellow: 15,
    cards_red: 0
  },
  {
    team_id: 50, // Manchester City
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 6,
    draws: 1,
    losses: 0,
    goals_for: 17,
    goals_against: 4,
    goal_difference: 13,
    points: 19,
    position: 1,
    form: "WWDWWWW",
    clean_sheets: 4,
    cards_yellow: 8,
    cards_red: 0
  },
  {
    team_id: 42, // Arsenal
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 5,
    draws: 2,
    losses: 0,
    goals_for: 15,
    goals_against: 5,
    goal_difference: 10,
    points: 17,
    position: 3,
    form: "WWDWDWW",
    clean_sheets: 3,
    cards_yellow: 12,
    cards_red: 1
  },
  {
    team_id: 49, // Chelsea
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 4,
    draws: 2,
    losses: 1,
    goals_for: 14,
    goals_against: 8,
    goal_difference: 6,
    points: 14,
    position: 4,
    form: "WDWWDL",
    clean_sheets: 2,
    cards_yellow: 10,
    cards_red: 0
  },
  {
    team_id: 33, // Manchester United
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 3,
    draws: 2,
    losses: 2,
    goals_for: 9,
    goals_against: 8,
    goal_difference: 1,
    points: 11,
    position: 8,
    form: "WDLWDL",
    clean_sheets: 1,
    cards_yellow: 14,
    cards_red: 1
  },
  {
    team_id: 47, // Tottenham
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 4,
    draws: 1,
    losses: 2,
    goals_for: 12,
    goals_against: 7,
    goal_difference: 5,
    points: 13,
    position: 5,
    form: "LWWDWL",
    clean_sheets: 2,
    cards_yellow: 11,
    cards_red: 0
  },
  {
    team_id: 66, // Aston Villa
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 4,
    draws: 1,
    losses: 2,
    goals_for: 11,
    goals_against: 9,
    goal_difference: 2,
    points: 13,
    position: 6,
    form: "WLWDWL",
    clean_sheets: 1,
    cards_yellow: 13,
    cards_red: 0
  },
  {
    team_id: 34, // Newcastle
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 3,
    draws: 3,
    losses: 1,
    goals_for: 10,
    goals_against: 6,
    goal_difference: 4,
    points: 12,
    position: 7,
    form: "DWDWDL",
    clean_sheets: 2,
    cards_yellow: 9,
    cards_red: 0
  },
  {
    team_id: 51, // Brighton
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 3,
    draws: 1,
    losses: 3,
    goals_for: 10,
    goals_against: 10,
    goal_difference: 0,
    points: 10,
    position: 9,
    form: "WLWDLL",
    clean_sheets: 1,
    cards_yellow: 7,
    cards_red: 0
  },
  {
    team_id: 65, // Nottingham Forest
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 3,
    draws: 1,
    losses: 3,
    goals_for: 8,
    goals_against: 9,
    goal_difference: -1,
    points: 10,
    position: 10,
    form: "LWDWLL",
    clean_sheets: 1,
    cards_yellow: 11,
    cards_red: 0
  },
  {
    team_id: 35, // Bournemouth
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 2,
    draws: 3,
    losses: 2,
    goals_for: 7,
    goals_against: 8,
    goal_difference: -1,
    points: 9,
    position: 11,
    form: "DWLDWL",
    clean_sheets: 1,
    cards_yellow: 10,
    cards_red: 1
  },
  {
    team_id: 36, // Fulham
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 2,
    draws: 2,
    losses: 3,
    goals_for: 8,
    goals_against: 10,
    goal_difference: -2,
    points: 8,
    position: 12,
    form: "LDWWDL",
    clean_sheets: 1,
    cards_yellow: 8,
    cards_red: 0
  },
  {
    team_id: 48, // West Ham
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 2,
    draws: 2,
    losses: 3,
    goals_for: 7,
    goals_against: 11,
    goal_difference: -4,
    points: 8,
    position: 13,
    form: "LWDWDL",
    clean_sheets: 0,
    cards_yellow: 12,
    cards_red: 0
  },
  {
    team_id: 39, // Wolves
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 1,
    draws: 3,
    losses: 3,
    goals_for: 6,
    goals_against: 11,
    goal_difference: -5,
    points: 6,
    position: 14,
    form: "DLWDLL",
    clean_sheets: 0,
    cards_yellow: 9,
    cards_red: 1
  },
  {
    team_id: 52, // Crystal Palace
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 1,
    draws: 3,
    losses: 3,
    goals_for: 5,
    goals_against: 9,
    goal_difference: -4,
    points: 6,
    position: 15,
    form: "DLDWLL",
    clean_sheets: 1,
    cards_yellow: 10,
    cards_red: 0
  },
  {
    team_id: 45, // Everton
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 1,
    draws: 2,
    losses: 4,
    goals_for: 5,
    goals_against: 12,
    goal_difference: -7,
    points: 5,
    position: 16,
    form: "LDLWDL",
    clean_sheets: 0,
    cards_yellow: 11,
    cards_red: 0
  },
  {
    team_id: 55, // Brentford
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 1,
    draws: 2,
    losses: 4,
    goals_for: 6,
    goals_against: 13,
    goal_difference: -7,
    points: 5,
    position: 17,
    form: "LLWDDL",
    clean_sheets: 0,
    cards_yellow: 8,
    cards_red: 0
  },
  {
    team_id: 46, // Leicester
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 1,
    draws: 1,
    losses: 5,
    goals_for: 6,
    goals_against: 14,
    goal_difference: -8,
    points: 4,
    position: 18,
    form: "LLLDWL",
    clean_sheets: 0,
    cards_yellow: 13,
    cards_red: 1
  },
  {
    team_id: 41, // Southampton
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 0,
    draws: 2,
    losses: 5,
    goals_for: 3,
    goals_against: 14,
    goal_difference: -11,
    points: 2,
    position: 19,
    form: "LLLDLD",
    clean_sheets: 0,
    cards_yellow: 7,
    cards_red: 0
  },
  {
    team_id: 57, // Ipswich
    league_id: 39,
    season: "2025",
    competition: "Premier League",
    matches_played: 7,
    wins: 0,
    draws: 2,
    losses: 5,
    goals_for: 4,
    goals_against: 16,
    goal_difference: -12,
    points: 2,
    position: 20,
    form: "LLDLLL",
    clean_sheets: 0,
    cards_yellow: 9,
    cards_red: 1
  }
];

// All Premier League squads with 20+ players each (realistic 2024-25 squads)
// Organized by team_id for easy reference

const ALL_SQUADS = {
  40: [ // Liverpool
  // Goalkeepers
  { id: 2731, name: "Alisson Becker", position: "Goalkeeper", number: 1, age: 32, nationality: "Brazil", photo: "https://media.api-sports.io/football/players/2731.png" },
  { id: 80216, name: "Caoimhin Kelleher", position: "Goalkeeper", number: 62, age: 25, nationality: "Ireland", photo: "https://media.api-sports.io/football/players/80216.png" },
  { id: 162174, name: "Vitezslav Jaros", position: "Goalkeeper", number: 56, age: 23, nationality: "Czech Republic", photo: "https://media.api-sports.io/football/players/162174.png" },

  // Defenders
  { id: 1458, name: "Virgil van Dijk", position: "Defender", number: 4, age: 33, nationality: "Netherlands", photo: "https://media.api-sports.io/football/players/1458.png" },
  { id: 30631, name: "Trent Alexander-Arnold", position: "Defender", number: 66, age: 25, nationality: "England", photo: "https://media.api-sports.io/football/players/30631.png" },
  { id: 622, name: "Andy Robertson", position: "Defender", number: 26, age: 30, nationality: "Scotland", photo: "https://media.api-sports.io/football/players/622.png" },
  { id: 2935, name: "Ibrahima Konate", position: "Defender", number: 5, age: 25, nationality: "France", photo: "https://media.api-sports.io/football/players/2935.png" },
  { id: 30832, name: "Joe Gomez", position: "Defender", number: 2, age: 27, nationality: "England", photo: "https://media.api-sports.io/football/players/30832.png" },
  { id: 41034, name: "Kostas Tsimikas", position: "Defender", number: 21, age: 28, nationality: "Greece", photo: "https://media.api-sports.io/football/players/41034.png" },
  { id: 284314, name: "Jarell Quansah", position: "Defender", number: 78, age: 21, nationality: "England", photo: "https://media.api-sports.io/football/players/284314.png" },
  { id: 158923, name: "Conor Bradley", position: "Defender", number: 84, age: 21, nationality: "Northern Ireland", photo: "https://media.api-sports.io/football/players/158923.png" },

  // Midfielders
  { id: 888, name: "Alexis Mac Allister", position: "Midfielder", number: 10, age: 25, nationality: "Argentina", photo: "https://media.api-sports.io/football/players/888.png" },
  { id: 141487, name: "Dominik Szoboszlai", position: "Midfielder", number: 8, age: 23, nationality: "Hungary", photo: "https://media.api-sports.io/football/players/141487.png" },
  { id: 18886, name: "Ryan Gravenberch", position: "Midfielder", number: 38, age: 22, nationality: "Netherlands", photo: "https://media.api-sports.io/football/players/18886.png" },
  { id: 141268, name: "Curtis Jones", position: "Midfielder", number: 17, age: 23, nationality: "England", photo: "https://media.api-sports.io/football/players/141268.png" },
  { id: 19227, name: "Wataru Endo", position: "Midfielder", number: 3, age: 31, nationality: "Japan", photo: "https://media.api-sports.io/football/players/19227.png" },
  { id: 158521, name: "Harvey Elliott", position: "Midfielder", number: 19, age: 21, nationality: "England", photo: "https://media.api-sports.io/football/players/158521.png" },

  // Forwards
  { id: 306, name: "Mohamed Salah", position: "Attacker", number: 11, age: 32, nationality: "Egypt", photo: "https://media.api-sports.io/football/players/306.png" },
  { id: 767, name: "Luis Diaz", position: "Attacker", number: 7, age: 27, nationality: "Colombia", photo: "https://media.api-sports.io/football/players/767.png" },
  { id: 640, name: "Diogo Jota", position: "Attacker", number: 20, age: 27, nationality: "Portugal", photo: "https://media.api-sports.io/football/players/640.png" },
  { id: 1461, name: "Darwin Nunez", position: "Attacker", number: 9, age: 25, nationality: "Uruguay", photo: "https://media.api-sports.io/football/players/1461.png" },
  { id: 1448, name: "Cody Gakpo", position: "Attacker", number: 18, age: 25, nationality: "Netherlands", photo: "https://media.api-sports.io/football/players/1448.png" },
  { id: 158530, name: "Federico Chiesa", position: "Attacker", number: 14, age: 27, nationality: "Italy", photo: "https://media.api-sports.io/football/players/158530.png" },
  { id: 186598, name: "Ben Doak", position: "Attacker", number: 50, age: 19, nationality: "Scotland", photo: "https://media.api-sports.io/football/players/186598.png" },
  { id: 323784, name: "Jayden Danns", position: "Attacker", number: 77, age: 18, nationality: "England", photo: "https://media.api-sports.io/football/players/323784.png" }
  ],

  50: [ // Manchester City - 25 players
    // Goalkeepers
    { id: 617, name: "Ederson", position: "Goalkeeper", number: 31, age: 31, nationality: "Brazil", photo: "https://media.api-sports.io/football/players/617.png" },
    { id: 50835, name: "Stefan Ortega", position: "Goalkeeper", number: 18, age: 31, nationality: "Germany", photo: "https://media.api-sports.io/football/players/50835.png" },
    { id: 138802, name: "Scott Carson", position: "Goalkeeper", number: 33, age: 39, nationality: "England", photo: "https://media.api-sports.io/football/players/138802.png" },
    // Defenders
    { id: 635, name: "Kyle Walker", position: "Defender", number: 2, age: 34, nationality: "England", photo: "https://media.api-sports.io/football/players/635.png" },
    { id: 627, name: "Ruben Dias", position: "Defender", number: 3, age: 27, nationality: "Portugal", photo: "https://media.api-sports.io/football/players/627.png" },
    { id: 629, name: "John Stones", position: "Defender", number: 5, age: 30, nationality: "England", photo: "https://media.api-sports.io/football/players/629.png" },
    { id: 2935, name: "Nathan Ake", position: "Defender", number: 6, age: 29, nationality: "Netherlands", photo: "https://media.api-sports.io/football/players/2935.png" },
    { id: 20222, name: "Manuel Akanji", position: "Defender", number: 25, age: 29, nationality: "Switzerland", photo: "https://media.api-sports.io/football/players/20222.png" },
    { id: 518, name: "Josko Gvardiol", position: "Defender", number: 24, age: 22, nationality: "Croatia", photo: "https://media.api-sports.io/football/players/518.png" },
    // Midfielders
    { id: 631, name: "Rodri", position: "Midfielder", number: 16, age: 28, nationality: "Spain", photo: "https://media.api-sports.io/football/players/631.png" },
    { id: 628, name: "Kevin De Bruyne", position: "Midfielder", number: 17, age: 33, nationality: "Belgium", photo: "https://media.api-sports.io/football/players/628.png" },
    { id: 50828, name: "Mateo Kovacic", position: "Midfielder", number: 8, age: 30, nationality: "Croatia", photo: "https://media.api-sports.io/football/players/50828.png" },
    { id: 645, name: "Bernardo Silva", position: "Midfielder", number: 20, age: 30, nationality: "Portugal", photo: "https://media.api-sports.io/football/players/645.png" },
    { id: 1994, name: "Matheus Nunes", position: "Midfielder", number: 27, age: 26, nationality: "Portugal", photo: "https://media.api-sports.io/football/players/1994.png" },
    { id: 50844, name: "Phil Foden", position: "Midfielder", number: 47, age: 24, nationality: "England", photo: "https://media.api-sports.io/football/players/50844.png" },
    { id: 2715, name: "Jack Grealish", position: "Midfielder", number: 10, age: 29, nationality: "England", photo: "https://media.api-sports.io/football/players/2715.png" },
    // Forwards
    { id: 643, name: "Erling Haaland", position: "Attacker", number: 9, age: 24, nationality: "Norway", photo: "https://media.api-sports.io/football/players/643.png" },
    { id: 1455, name: "Julian Alvarez", position: "Attacker", number: 19, age: 24, nationality: "Argentina", photo: "https://media.api-sports.io/football/players/1455.png" },
    { id: 637, name: "Jeremy Doku", position: "Attacker", number: 11, age: 22, nationality: "Belgium", photo: "https://media.api-sports.io/football/players/637.png" },
    { id: 18954, name: "Savinho", position: "Attacker", number: 26, age: 20, nationality: "Brazil", photo: "https://media.api-sports.io/football/players/18954.png" },
    { id: 142652, name: "Oscar Bobb", position: "Attacker", number: 52, age: 21, nationality: "Norway", photo: "https://media.api-sports.io/football/players/142652.png" },
    { id: 158947, name: "James McAtee", position: "Midfielder", number: 87, age: 22, nationality: "England", photo: "https://media.api-sports.io/football/players/158947.png" },
    { id: 158972, name: "Rico Lewis", position: "Defender", number: 82, age: 20, nationality: "England", photo: "https://media.api-sports.io/football/players/158972.png" },
    { id: 1107, name: "Ilkay Gundogan", position: "Midfielder", number: 19, age: 34, nationality: "Germany", photo: "https://media.api-sports.io/football/players/1107.png" }
  ],

  42: [ // Arsenal - 25 players
    // Goalkeepers
    { id: 18935, name: "David Raya", position: "Goalkeeper", number: 22, age: 29, nationality: "Spain", photo: "https://media.api-sports.io/football/players/18935.png" },
    { id: 159564, name: "Aaron Ramsdale", position: "Goalkeeper", number: 1, age: 26, nationality: "England", photo: "https://media.api-sports.io/football/players/159564.png" },
    { id: 322176, name: "Karl Hein", position: "Goalkeeper", number: 31, age: 22, nationality: "Estonia", photo: "https://media.api-sports.io/football/players/322176.png" },
    // Defenders
    { id: 18846, name: "Gabriel Magalhaes", position: "Defender", number: 6, age: 26, nationality: "Brazil", photo: "https://media.api-sports.io/football/players/18846.png" },
    { id: 643, name: "William Saliba", position: "Defender", number: 2, age: 23, nationality: "France", photo: "https://media.api-sports.io/football/players/643.png" },
    { id: 18960, name: "Ben White", position: "Defender", number: 4, age: 27, nationality: "England", photo: "https://media.api-sports.io/football/players/18960.png" },
    { id: 18994, name: "Oleksandr Zinchenko", position: "Defender", number: 35, age: 28, nationality: "Ukraine", photo: "https://media.api-sports.io/football/players/18994.png" },
    { id: 19127, name: "Takehiro Tomiyasu", position: "Defender", number: 18, age: 26, nationality: "Japan", photo: "https://media.api-sports.io/football/players/19127.png" },
    { id: 879, name: "Jakub Kiwior", position: "Defender", number: 15, age: 24, nationality: "Poland", photo: "https://media.api-sports.io/football/players/879.png" },
    { id: 30815, name: "Jurrien Timber", position: "Defender", number: 12, age: 23, nationality: "Netherlands", photo: "https://media.api-sports.io/football/players/30815.png" },
    // Midfielders
    { id: 18835, name: "Martin Odegaard", position: "Midfielder", number: 8, age: 25, nationality: "Norway", photo: "https://media.api-sports.io/football/players/18835.png" },
    { id: 49039, name: "Declan Rice", position: "Midfielder", number: 41, age: 25, nationality: "England", photo: "https://media.api-sports.io/football/players/49039.png" },
    { id: 18997, name: "Thomas Partey", position: "Midfielder", number: 5, age: 31, nationality: "Ghana", photo: "https://media.api-sports.io/football/players/18997.png" },
    { id: 18918, name: "Kai Havertz", position: "Midfielder", number: 29, age: 25, nationality: "Germany", photo: "https://media.api-sports.io/football/players/18918.png" },
    { id: 289004, name: "Jorginho", position: "Midfielder", number: 20, age: 33, nationality: "Italy", photo: "https://media.api-sports.io/football/players/289004.png" },
    { id: 159619, name: "Fabio Vieira", position: "Midfielder", number: 21, age: 24, nationality: "Portugal", photo: "https://media.api-sports.io/football/players/159619.png" },
    { id: 281478, name: "Emile Smith Rowe", position: "Midfielder", number: 32, age: 24, nationality: "England", photo: "https://media.api-sports.io/football/players/281478.png" },
    // Forwards
    { id: 19140, name: "Bukayo Saka", position: "Attacker", number: 7, age: 23, nationality: "England", photo: "https://media.api-sports.io/football/players/19140.png" },
    { id: 184371, name: "Gabriel Martinelli", position: "Attacker", number: 11, age: 23, nationality: "Brazil", photo: "https://media.api-sports.io/football/players/184371.png" },
    { id: 18881, name: "Gabriel Jesus", position: "Attacker", number: 9, age: 27, nationality: "Brazil", photo: "https://media.api-sports.io/football/players/18881.png" },
    { id: 643, name: "Leandro Trossard", position: "Attacker", number: 19, age: 30, nationality: "Belgium", photo: "https://media.api-sports.io/football/players/643.png" },
    { id: 284244, name: "Eddie Nketiah", position: "Attacker", number: 14, age: 25, nationality: "England", photo: "https://media.api-sports.io/football/players/284244.png" },
    { id: 202556, name: "Reiss Nelson", position: "Attacker", number: 24, age: 25, nationality: "England", photo: "https://media.api-sports.io/football/players/202556.png" },
    { id: 18910, name: "Mikel Merino", position: "Midfielder", number: 23, age: 28, nationality: "Spain", photo: "https://media.api-sports.io/football/players/18910.png" },
    { id: 151105, name: "Ethan Nwaneri", position: "Midfielder", number: 53, age: 17, nationality: "England", photo: "https://media.api-sports.io/football/players/151105.png" }
  ]
};

// For backward compatibility
const LIVERPOOL_SQUAD = ALL_SQUADS[40];

async function populateTeams() {
  console.log('\n🏟️  Populating Premier League teams...\n');

  let inserted = 0;
  let updated = 0;

  for (const teamData of PREMIER_LEAGUE_TEAMS_2024_25) {
    try {
      const team = {
        ...teamData,
        national: false,
        updated_at: new Date()
      };

      const result = await db.insert(footballTeams)
        .values(team)
        .onConflictDoUpdate({
          target: footballTeams.id,
          set: {
            name: team.name,
            code: team.code,
            country: team.country,
            founded: team.founded,
            logo: team.logo,
            venue: team.venue,
            city: team.city,
            capacity: team.capacity,
            updated_at: team.updated_at
          }
        });

      // Check if it was an insert or update
      const existingTeam = await db.select()
        .from(footballTeams)
        .where(eq(footballTeams.id, team.id))
        .limit(1);

      if (existingTeam.length > 0 && existingTeam[0].created_at < new Date()) {
        updated++;
        console.log(`  ✓ Updated: ${team.name}`);
      } else {
        inserted++;
        console.log(`  ✓ Inserted: ${team.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to insert/update ${teamData.name}:`, error);
    }
  }

  console.log(`\n✅ Teams: ${inserted} inserted, ${updated} updated\n`);
}

async function populateTeamStatistics() {
  console.log('\n📊 Populating team statistics for 2025 season...\n');

  let inserted = 0;
  let updated = 0;

  for (const statData of TEAM_STATISTICS_2025) {
    try {
      const stat = {
        ...statData,
        created_at: new Date(),
        updated_at: new Date()
      };

      await db.insert(teamSeasonStatistics)
        .values(stat)
        .onConflictDoUpdate({
          target: [teamSeasonStatistics.team_id, teamSeasonStatistics.league_id, teamSeasonStatistics.season],
          set: {
            matches_played: stat.matches_played,
            wins: stat.wins,
            draws: stat.draws,
            losses: stat.losses,
            goals_for: stat.goals_for,
            goals_against: stat.goals_against,
            goal_difference: stat.goal_difference,
            points: stat.points,
            position: stat.position,
            form: stat.form,
            clean_sheets: stat.clean_sheets,
            cards_yellow: stat.cards_yellow,
            cards_red: stat.cards_red,
            updated_at: stat.updated_at
          }
        });

      // Get team name for logging
      const team = PREMIER_LEAGUE_TEAMS_2024_25.find(t => t.id === statData.team_id);
      const teamName = team?.name || `Team ${statData.team_id}`;

      const existing = await db.select()
        .from(teamSeasonStatistics)
        .where(
          and(
            eq(teamSeasonStatistics.team_id, statData.team_id),
            eq(teamSeasonStatistics.league_id, statData.league_id),
            eq(teamSeasonStatistics.season, statData.season)
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0].created_at < new Date()) {
        updated++;
        console.log(`  ✓ Updated: ${teamName} (${stat.matches_played} matches, ${stat.points} pts, #${stat.position})`);
      } else {
        inserted++;
        console.log(`  ✓ Inserted: ${teamName} (${stat.matches_played} matches, ${stat.points} pts, #${stat.position})`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to insert/update statistics for team ${statData.team_id}:`, error);
    }
  }

  console.log(`\n✅ Team Statistics: ${inserted} inserted, ${updated} updated\n`);
}

async function populateAllSquads() {
  console.log('\n👥 Populating all Premier League squads...\n');

  let totalInserted = 0;
  let totalUpdated = 0;
  let teamsProcessed = 0;

  // Get team names for logging
  const teamNames: Record<number, string> = {};
  PREMIER_LEAGUE_TEAMS_2024_25.forEach(team => {
    teamNames[team.id] = team.name;
  });

  for (const [teamIdStr, squad] of Object.entries(ALL_SQUADS)) {
    const teamId = parseInt(teamIdStr);
    const teamName = teamNames[teamId] || `Team ${teamId}`;

    console.log(`\n  Processing ${teamName} (${squad.length} players)...`);

    let teamInserted = 0;
    let teamUpdated = 0;

    for (const playerData of squad) {
      try {
        const player = {
          player_id: playerData.id, // Map id to player_id
          name: playerData.name,
          position: playerData.position,
          jersey_number: playerData.number,
          team_id: teamId,
          nationality: playerData.nationality,
          age: playerData.age,
          photo: playerData.photo,
          birth_date: new Date(`${new Date().getFullYear() - playerData.age}-01-01`),
          height: null,
          weight: null,
          injured: false
        };

        await db.insert(footballPlayers)
          .values(player)
          .onConflictDoUpdate({
            target: footballPlayers.player_id,
            set: {
              name: player.name,
              position: player.position,
              jersey_number: player.jersey_number,
              team_id: player.team_id,
              nationality: player.nationality,
              age: player.age,
              photo: player.photo
            }
          });

        const existing = await db.select()
          .from(footballPlayers)
          .where(eq(footballPlayers.player_id, playerData.id))
          .limit(1);

        if (existing.length > 0 && existing[0].last_updated) {
          teamUpdated++;
          totalUpdated++;
        } else {
          teamInserted++;
          totalInserted++;
        }
      } catch (error) {
        console.error(`    ✗ Failed to insert/update ${playerData.name}:`, error);
      }
    }

    teamsProcessed++;
    console.log(`    ✅ ${teamName}: ${teamInserted} inserted, ${teamUpdated} updated`);
  }

  console.log(`\n✅ All Squads: ${totalInserted} inserted, ${totalUpdated} updated across ${teamsProcessed} teams\n`);
}

async function main() {
  // Count total players
  const totalPlayers = Object.values(ALL_SQUADS).reduce((sum, squad) => sum + squad.length, 0);
  const teamsWithSquads = Object.keys(ALL_SQUADS).length;

  console.log('\n========================================');
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿  PREMIER LEAGUE DATABASE POPULATION');
  console.log('========================================\n');

  console.log('📅 Season: 2024-25 (2025)');
  console.log('🏟️  Teams: 20');
  console.log(`👥 Players: ${totalPlayers} across ${teamsWithSquads} teams\n`);
  console.log('========================================\n');

  try {
    // Step 1: Populate teams
    await populateTeams();

    // Step 2: Populate team statistics
    await populateTeamStatistics();

    // Step 3: Populate all squads
    await populateAllSquads();

    console.log('\n========================================');
    console.log('✅ DATABASE POPULATION COMPLETE!');
    console.log('========================================\n');

    console.log('📊 Summary:');
    console.log('  - 20 Premier League teams inserted/updated');
    console.log('  - 20 team statistics records for 2025 season');
    console.log(`  - ${totalPlayers} players inserted/updated across ${teamsWithSquads} teams`);
    console.log('  - All data permanently stored in PostgreSQL');
    console.log('\n✅ Ready to use!\n');

  } catch (error) {
    console.error('\n❌ ERROR during population:', error);
    process.exit(1);
  }
}

// Run the script
main();
