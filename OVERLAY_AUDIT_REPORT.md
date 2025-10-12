
# Overlay System Audit Report

## Status: In Progress
**Started:** 2025-10-12
**Last Updated:** 2025-10-12

---

## Phase 1: Discovery & Documentation

### Overlay Inventory

| Overlay | File | Status | API Endpoint(s) | Issues |
|---------|------|--------|-----------------|--------|
| H2H Match Card | FormGuideOverlay.tsx | 🔍 Analyzing | /api/database/head-to-head/{id}/{id} | TBD |
| Form Guide | FormGuideOverlay.tsx | 🔍 Analyzing | /api/database/teams/{id}/statistics | TBD |
| League Table | LeagueTableOverlay.tsx | 🔍 Analyzing | /api/database/standings | TBD |
| League Position | LeaguePositionOverlay.tsx | 🔍 Analyzing | /api/database/standings | TBD |
| Player Stats | PlayerStatsOverlay.tsx | 🔍 Analyzing | /api/database/players/top-scorers | TBD |
| Player Comparison | PlayerComparisonOverlay.tsx | 🔍 Analyzing | TBD | TBD |
| RSS Sentiment | RssSentimentOverlay.tsx | 🔍 Analyzing | /api/rss/sentiment-summary | TBD |
| RSS Ticker | RssTickerEnhancedOverlay.tsx | 🔍 Analyzing | /api/rss-articles | TBD |
| Upcoming Fixtures | UpcomingFixturesOverlay.tsx | 🔍 Analyzing | /api/database/fixtures/upcoming | TBD |

---

## Phase 2: API Endpoint Testing

### Test Commands
```bash
# H2H Data
curl -s http://0.0.0.0:5000/api/database/head-to-head/40/47 | jq

# Team Statistics
curl -s http://0.0.0.0:5000/api/database/teams/40/statistics?leagueId=39 | jq

# All Teams
curl -s http://0.0.0.0:5000/api/database/teams/all | jq

# Standings
curl -s http://0.0.0.0:5000/api/database/standings?leagueId=39&season=2025 | jq

# Top Scorers
curl -s http://0.0.0.0:5000/api/database/players/top-scorers?teamId=40&leagueId=39&season=2025 | jq

# Upcoming Fixtures
curl -s http://0.0.0.0:5000/api/database/fixtures/upcoming?teamId=40 | jq

# RSS Sentiment
curl -s http://0.0.0.0:5000/api/rss/sentiment-summary | jq

# RSS Articles
curl -s http://0.0.0.0:5000/api/rss-articles?limit=10 | jq
```

### API Response Documentation

#### /api/database/head-to-head/{homeId}/{awayId}
**Expected Structure:**
```json
{
  "data": {
    "fixtures": [
      {
        "id": number,
        "date": string,
        "homeTeam": string,
        "awayTeam": string,
        "homeScore": number,
        "awayScore": number,
        "competition": string
      }
    ]
  },
  "lastUpdated": string,
  "source": "database"
}
```

---

## Phase 3: Refactoring Progress

### Standardization Files
- [x] useOverlayData.ts - Custom hook created
- [x] overlayScaling.ts - Scaling utilities created
- [x] OverlayStates.tsx - Enhanced with detailed errors
- [x] OverlayTestPage.tsx - Testing dashboard created

### Overlay Refactoring Checklist
- [ ] H2HMatchCardOverlay.tsx
- [ ] FormGuideOverlay.tsx
- [ ] LeagueTableOverlay.tsx
- [ ] LeaguePositionOverlay.tsx
- [ ] PlayerComparisonOverlay.tsx
- [ ] PlayerStatsOverlay.tsx
- [ ] RssSentimentOverlay.tsx
- [ ] RssTickerEnhancedOverlay.tsx
- [ ] UpcomingFixturesOverlay.tsx

---

## Issues Found

### Critical Issues
- TBD

### Warning Issues
- TBD

### Minor Issues
- TBD

---

## Next Steps

1. ✅ Create standardization files
2. ⏳ Test API endpoints manually
3. ⏳ Refactor H2HMatchCardOverlay as template
4. ⏳ Apply pattern to remaining overlays
5. ⏳ Visual testing at all breakpoints
6. ⏳ Final validation
