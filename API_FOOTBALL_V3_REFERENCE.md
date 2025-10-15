# API-Football v3 Complete Endpoint Reference

## Base Information
- **Base URL**: `https://v3.football.api-sports.io/`
- **Header Required**: `x-rapidapi-key: YOUR_API_KEY`

---

## 1. TIMEZONE ENDPOINTS

### GET /timezone
Returns all available timezones

**Parameters**: None

**Response Fields**:
- `timezone` - Timezone name (e.g., "Europe/London")

---

## 2. COUNTRIES ENDPOINTS

### GET /countries
Returns all available countries

**Parameters**:
- `name` - Country name
- `code` - Country code (ISO 3166-1 alpha-2)
- `search` - Search by country name

**Response Fields**:
- `name` - Country name
- `code` - Country code
- `flag` - Country flag URL

---

## 3. LEAGUES & CUPS ENDPOINTS

### GET /leagues
Returns all available leagues and cups

**Parameters**:
- `id` - League ID
- `name` - League name
- `country` - Country name
- `code` - Country code
- `season` - Season year (YYYY)
- `team` - Team ID
- `type` - League type (league or cup)
- `current` - Current season (true/false)
- `search` - Search by league name
- `last` - Last leagues (integer)

**Response Fields**:
- **league**:
  - `id` - League ID
  - `name` - League name
  - `type` - Type (League/Cup)
  - `logo` - League logo URL
- **country**:
  - `name` - Country name
  - `code` - Country code
  - `flag` - Flag URL
- **seasons**:
  - `year` - Season year
  - `start` - Start date
  - `end` - End date
  - `current` - Boolean
  - **coverage**:
    - `fixtures` - Coverage object
    - `standings` - Boolean
    - `players` - Boolean
    - `top_scorers` - Boolean
    - `top_assists` - Boolean
    - `top_cards` - Boolean
    - `injuries` - Boolean
    - `predictions` - Boolean
    - `odds` - Boolean

### GET /leagues/seasons
Returns all available seasons

**Parameters**: None

**Response Fields**:
- Season years (array of integers)

---

## 4. TEAMS ENDPOINTS

### GET /teams
Returns all available teams

**Parameters**:
- `id` - Team ID
- `name` - Team name
- `league` - League ID
- `season` - Season year
- `country` - Country name
- `code` - Country code
- `venue` - Venue ID
- `search` - Search by team name

**Response Fields**:
- **team**:
  - `id` - Team ID
  - `name` - Team name
  - `code` - Team code (3 letters)
  - `country` - Country name
  - `founded` - Foundation year
  - `national` - Boolean
  - `logo` - Logo URL
- **venue**:
  - `id` - Venue ID
  - `name` - Venue name
  - `address` - Address
  - `city` - City
  - `capacity` - Capacity (integer)
  - `surface` - Surface type
  - `image` - Image URL

### GET /teams/statistics
Returns team statistics for a given fixture or season

**Parameters**:
- `league` - League ID (required)
- `season` - Season year (required)
- `team` - Team ID (required)
- `date` - Date (YYYY-MM-DD)

**Response Fields**:
- **fixtures**:
  - `played` - Total played
  - `wins` - Total wins
  - `draws` - Total draws
  - `loses` - Total losses
- **goals**:
  - `for` - Goals scored
  - `against` - Goals conceded
- **biggest**:
  - `streak` - Biggest streak
  - `wins` - Biggest win
  - `loses` - Biggest loss
  - `goals` - Biggest goals scored/conceded
- **clean_sheet** - Clean sheets statistics
- **failed_to_score** - Failed to score statistics
- **penalty** - Penalty statistics
- **lineups** - Most used lineups
- **cards** - Cards statistics

### GET /teams/seasons
Returns all available seasons for a team

**Parameters**:
- `team` - Team ID (required)

**Response Fields**:
- Season years (array)

### GET /teams/countries
Returns countries available for teams endpoint

**Parameters**: None

---

## 5. VENUES ENDPOINTS

### GET /venues
Returns all available venues

**Parameters**:
- `id` - Venue ID
- `name` - Venue name
- `city` - City name
- `country` - Country name
- `search` - Search by venue name

**Response Fields**:
- `id` - Venue ID
- `name` - Venue name
- `address` - Address
- `city` - City
- `country` - Country
- `capacity` - Capacity
- `surface` - Surface type
- `image` - Image URL

---

## 6. STANDINGS ENDPOINTS

### GET /standings
Returns standings for a league or team

**Parameters**:
- `season` - Season year (required)
- `league` - League ID
- `team` - Team ID

**Response Fields**:
- **league**:
  - `id` - League ID
  - `name` - League name
  - `country` - Country
  - `logo` - Logo URL
  - `flag` - Flag URL
  - `season` - Season year
  - **standings** (array of groups):
    - `rank` - Current rank
    - `team` - Team object
    - `points` - Total points
    - `goalsDiff` - Goal difference
    - `group` - Group name
    - `form` - Last 5 form
    - `status` - Status description
    - `description` - Rank description
    - `all` - All games statistics
    - `home` - Home games statistics
    - `away` - Away games statistics
    - `update` - Last update date

---

## 7. FIXTURES ENDPOINTS

### GET /fixtures
Returns fixtures by different parameters

**Parameters**:
- `id` - Fixture ID
- `ids` - Multiple fixture IDs (comma-separated)
- `live` - Live fixtures (all or league-id)
- `date` - Date (YYYY-MM-DD)
- `league` - League ID
- `season` - Season year
- `team` - Team ID
- `last` - Last X fixtures
- `next` - Next X fixtures
- `from` - Date from (YYYY-MM-DD)
- `to` - Date to (YYYY-MM-DD)
- `round` - Round name
- `status` - Fixture status (short code)
- `venue` - Venue ID
- `timezone` - Timezone

**Response Fields**:
- **fixture**:
  - `id` - Fixture ID
  - `referee` - Referee name
  - `timezone` - Timezone
  - `date` - Date ISO
  - `timestamp` - Unix timestamp
  - **periods**:
    - `first` - First half timestamp
    - `second` - Second half timestamp
  - **venue**:
    - `id` - Venue ID
    - `name` - Venue name
    - `city` - City
  - **status**:
    - `long` - Status long
    - `short` - Status short
    - `elapsed` - Minutes elapsed
    - `extra` - Extra time minutes
- **league**:
  - `id` - League ID
  - `name` - League name
  - `country` - Country
  - `logo` - Logo URL
  - `flag` - Flag URL
  - `season` - Season year
  - `round` - Round name
- **teams**:
  - **home**:
    - `id` - Team ID
    - `name` - Team name
    - `logo` - Logo URL
    - `winner` - Boolean or null
  - **away**: (same structure as home)
- **goals**:
  - `home` - Home goals
  - `away` - Away goals
- **score**:
  - **halftime**:
    - `home` - Home score
    - `away` - Away score
  - **fulltime**: (same structure)
  - **extratime**: (same structure)
  - **penalty**: (same structure)

### GET /fixtures/rounds
Returns rounds for a league and season

**Parameters**:
- `league` - League ID (required)
- `season` - Season year (required)
- `current` - Current round (true/false)

**Response Fields**:
- Round names (array)

### GET /fixtures/headtohead
Returns head to head fixtures

**Parameters**:
- `h2h` - Team IDs (format: "id-id") (required)
- `date` - Date (YYYY-MM-DD)
- `league` - League ID
- `season` - Season year
- `last` - Last X fixtures
- `next` - Next X fixtures
- `from` - Date from
- `to` - Date to
- `status` - Fixture status
- `venue` - Venue ID
- `timezone` - Timezone

**Response Fields**:
Same as `/fixtures` endpoint

### GET /fixtures/statistics
Returns statistics for one fixture

**Parameters**:
- `fixture` - Fixture ID (required)
- `team` - Team ID
- `type` - Statistic type

**Response Fields**:
- **team**: Team object
- **statistics** (array):
  - `type` - Statistic type
  - `value` - Statistic value

**Statistic Types**:
- Shots on Goal
- Shots off Goal
- Total Shots
- Blocked Shots
- Shots insidebox
- Shots outsidebox
- Fouls
- Corner Kicks
- Offsides
- Ball Possession
- Yellow Cards
- Red Cards
- Goalkeeper Saves
- Total passes
- Passes accurate
- Passes %

### GET /fixtures/events
Returns events for one fixture

**Parameters**:
- `fixture` - Fixture ID (required)
- `team` - Team ID
- `player` - Player ID
- `type` - Event type

**Response Fields**:
- **time**:
  - `elapsed` - Minutes elapsed
  - `extra` - Extra time
- **team**: Team object
- **player**: Player object
- **assist**: Player object
- **type** - Event type (Goal, Card, subst, Var)
- `detail` - Event detail
- `comments` - Comments

### GET /fixtures/lineups
Returns lineups for one fixture

**Parameters**:
- `fixture` - Fixture ID (required)
- `team` - Team ID
- `player` - Player ID
- `type` - Player type (all, starting, substitute)

**Response Fields**:
- **team**: Team object
- `formation` - Formation
- **startXI** (array):
  - **player**:
    - `id` - Player ID
    - `name` - Player name
    - `number` - Jersey number
    - `pos` - Position
    - `grid` - Grid position
- **substitutes**: (same structure as startXI)
- **coach**: Coach object

### GET /fixtures/players
Returns players statistics for one fixture

**Parameters**:
- `fixture` - Fixture ID (required)
- `team` - Team ID

**Response Fields**:
- **team**: Team object
- **players** (array):
  - **player**:
    - `id` - Player ID
    - `name` - Player name
    - `photo` - Photo URL
  - **statistics** (array):
    - `games` - Games statistics
    - `offsides` - Offsides
    - `shots` - Shots statistics
    - `goals` - Goals statistics
    - `passes` - Passes statistics
    - `tackles` - Tackles statistics
    - `duels` - Duels statistics
    - `dribbles` - Dribbles statistics
    - `fouls` - Fouls statistics
    - `cards` - Cards statistics
    - `penalty` - Penalty statistics

---

## 8. INJURIES ENDPOINTS

### GET /injuries
Returns injuries by league, team, fixture, player, or date

**Parameters**:
- `league` - League ID
- `season` - Season year
- `fixture` - Fixture ID
- `team` - Team ID
- `player` - Player ID
- `date` - Date (YYYY-MM-DD)
- `timezone` - Timezone

**Response Fields**:
- **player**: Player object
- **team**: Team object
- **fixture**: Fixture object
- `league` - League object
- `type` - Injury type
- `reason` - Injury reason

---

## 9. PREDICTIONS ENDPOINTS

### GET /predictions
Returns predictions for a fixture

**Parameters**:
- `fixture` - Fixture ID (required)

**Response Fields**:
- **predictions**:
  - `winner` - Winner prediction
  - `win_or_draw` - Win or draw
  - `under_over` - Under/over
  - `goals` - Goals prediction
  - `advice` - Betting advice
  - `percent` - Win percentages
- **league**: League object
- **teams**: Teams objects
- **comparison**: Head to head comparison
- **h2h**: Head to head fixtures

---

## 10. COACHS ENDPOINTS

### GET /coachs
Returns coachs by id, team, or search

**Parameters**:
- `id` - Coach ID
- `team` - Team ID
- `search` - Search by name

**Response Fields**:
- `id` - Coach ID
- `name` - Coach name
- `firstname` - First name
- `lastname` - Last name
- `age` - Age
- `birth` - Birth information
- `nationality` - Nationality
- `height` - Height
- `weight` - Weight
- `photo` - Photo URL
- **team**: Team object
- **career** (array):
  - **team**: Team object
  - `start` - Start date
  - `end` - End date

---

## 11. PLAYERS ENDPOINTS

### GET /players
Returns players by id, team, league, or search

**Parameters**:
- `id` - Player ID
- `team` - Team ID
- `league` - League ID
- `season` - Season year (required with league/team)
- `search` - Search by name (min 4 characters)
- `page` - Page number

**Response Fields**:
- **player**:
  - `id` - Player ID
  - `name` - Player name
  - `firstname` - First name
  - `lastname` - Last name
  - `age` - Age
  - `birth` - Birth information
  - `nationality` - Nationality
  - `height` - Height
  - `weight` - Weight
  - `injured` - Boolean
  - `photo` - Photo URL
- **statistics** (array):
  - **team**: Team object
  - **league**: League object
  - **games**: Games statistics
  - **substitutes**: Substitute statistics
  - **shots**: Shots statistics
  - **goals**: Goals statistics
  - **passes**: Passes statistics
  - **tackles**: Tackles statistics
  - **duels**: Duels statistics
  - **dribbles**: Dribbles statistics
  - **fouls**: Fouls statistics
  - **cards**: Cards statistics
  - **penalty**: Penalty statistics

### GET /players/seasons
Returns all available seasons for players endpoint

**Parameters**: None

### GET /players/squads
Returns players for a team

**Parameters**:
- `team` - Team ID (required)

**Response Fields**:
- **team**: Team object
- **players** (array):
  - `id` - Player ID
  - `name` - Player name
  - `age` - Age
  - `number` - Jersey number
  - `position` - Position
  - `photo` - Photo URL

### GET /players/topscorers
Returns top scorers for a league and season

**Parameters**:
- `league` - League ID (required)
- `season` - Season year (required)

### GET /players/topassists
Returns top assists for a league and season

**Parameters**:
- `league` - League ID (required)
- `season` - Season year (required)

### GET /players/topyellowcards
Returns top yellow cards for a league and season

**Parameters**:
- `league` - League ID (required)
- `season` - Season year (required)

### GET /players/topredcards
Returns top red cards for a league and season

**Parameters**:
- `league` - League ID (required)
- `season` - Season year (required)

---

## 12. TRANSFERS ENDPOINTS

### GET /transfers
Returns transfers by player or team

**Parameters**:
- `player` - Player ID
- `team` - Team ID

**Response Fields**:
- **player**: Player object
- **update** - Last update
- **transfers** (array):
  - `date` - Transfer date
  - `type` - Transfer type (loan, free, etc.)
  - **teams**:
    - **in**: Team object (destination)
    - **out**: Team object (origin)

---

## 13. TROPHIES ENDPOINTS

### GET /trophies
Returns trophies by player or coach

**Parameters**:
- `player` - Player ID
- `coach` - Coach ID

**Response Fields**:
- `league` - Trophy/League name
- `country` - Country
- `season` - Season
- `place` - Place/Position

---

## 14. SIDELINED ENDPOINTS

### GET /sidelined
Returns sidelined players

**Parameters**:
- `player` - Player ID
- `coach` - Coach ID

**Response Fields**:
- `type` - Type (Injury, Suspension, etc.)
- `start` - Start date
- `end` - End date

---

## 15. ODDS ENDPOINTS

### GET /odds
Returns odds for fixtures

**Parameters**:
- `fixture` - Fixture ID
- `league` - League ID
- `season` - Season year
- `date` - Date (YYYY-MM-DD)
- `timezone` - Timezone
- `page` - Page number
- `bookmaker` - Bookmaker ID
- `bet` - Bet ID

**Response Fields**:
- **league**: League object
- **fixture**: Fixture object
- **update** - Last update
- **bookmakers** (array):
  - `id` - Bookmaker ID
  - `name` - Bookmaker name
  - **bets** (array):
    - `id` - Bet ID
    - `name` - Bet name
    - **values** (array):
      - `value` - Odd value
      - `odd` - Odd number

### GET /odds/bookmakers
Returns all available bookmakers

**Parameters**:
- `id` - Bookmaker ID
- `search` - Search by name

**Response Fields**:
- `id` - Bookmaker ID
- `name` - Bookmaker name

### GET /odds/bets
Returns all available bets

**Parameters**:
- `id` - Bet ID
- `search` - Search by name

**Response Fields**:
- `id` - Bet ID
- `name` - Bet name

### GET /odds/mapping
Returns odds mapping

**Parameters**:
- `page` - Page number

**Response Fields**:
- **fixture**: Fixture object
- **league**: League object
- **update** - Last update
- **bookmakers** (array): Bookmaker mapping data

### GET /odds/live
Returns live odds

**Parameters**:
- `fixture` - Fixture ID
- `league` - League ID
- `bet` - Bet ID

---

## RESPONSE STATUS CODES

- **200** - OK
- **204** - No Content
- **400** - Bad Request
- **404** - Not Found
- **429** - Too Many Requests
- **499** - Token required
- **500** - Internal Server Error
- **503** - Service Temporarily Unavailable

---

## FIXTURE STATUS SHORT CODES

- **TBD** - Time To Be Defined
- **NS** - Not Started
- **1H** - First Half, Kick Off
- **HT** - Halftime
- **2H** - Second Half, 2nd Half Started
- **ET** - Extra Time
- **BT** - Break Time (Extra Time)
- **P** - Penalty In Progress
- **SUSP** - Match Suspended
- **INT** - Match Interrupted
- **FT** - Match Finished
- **AET** - Match Finished After Extra Time
- **PEN** - Match Finished After Penalty
- **PST** - Match Postponed
- **CANC** - Match Cancelled
- **ABD** - Match Abandoned
- **AWD** - Technical Loss
- **WO** - WalkOver
- **LIVE** - In Progress

---

## COMMON POSITION CODES

### Players
- **G** - Goalkeeper
- **D** - Defender
- **M** - Midfielder
- **F** - Forward

### Detailed Positions
- **GK** - Goalkeeper
- **CB** - Center Back
- **RB** - Right Back
- **LB** - Left Back
- **RWB** - Right Wing Back
- **LWB** - Left Wing Back
- **CDM** - Central Defensive Midfielder
- **CM** - Central Midfielder
- **CAM** - Central Attacking Midfielder
- **RM** - Right Midfielder
- **LM** - Left Midfielder
- **RW** - Right Winger
- **LW** - Left Winger
- **CF** - Center Forward
- **ST** - Striker

---

## RATE LIMITS

Rate limits depend on your subscription plan. Free plans typically allow:
- **100 requests/day**
- **10 requests/minute**

Check your dashboard for specific limits.

---

## NOTES

1. All dates use **ISO 8601** format
2. All timestamps are **Unix epoch** in seconds
3. The `timezone` parameter affects date/time responses
4. Some endpoints require a **season** parameter with league/team
5. Use **pagination** for endpoints that return large datasets
6. The API uses **lazy loading** - only requested data is returned

---

## EXAMPLE USAGE

```javascript
// Get fixtures for a specific date
GET /fixtures?date=2024-10-15&timezone=America/New_York

// Get live fixtures for a specific league
GET /fixtures?live=39

// Get team statistics
GET /teams/statistics?league=39&season=2024&team=33

// Get player information
GET /players?id=276&season=2024

// Get standings for a league
GET /standings?season=2024&league=39
```

---

*Last Updated: October 2025*
*API Version: v3*
*Documentation based on api-football.com official API*
