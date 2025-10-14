# ContentCurator-2 Quick Reference Guide

## Page Routes Quick Reference

| Page Name | Route(s) | Purpose |
|-----------|----------|---------|
| **Home/Visual Assistant** | `/` | Main dashboard and landing page |
| **Team Matchup Studio** | `/team-matchup-studio`, `/team-matchup` | Tactical team analysis and comparison |
| **Live Presentation** | `/live-presentation`, `/live` | Broadcast control with multi-camera support |
| **Content Library** | `/content-library` | Browse and manage all content |
| **Framework Directory** | `/frameworks` | Discover and manage content frameworks |
| **Create Framework** | `/frameworks/create` | Create new frameworks |
| **RSS Intelligence** | `/rss` | News aggregation and analysis |
| **RSS Control** | `/rss-control` | RSS ticker control panel |
| **Admin Dashboard** | `/admin` | System administration interface |
| **Database Status** | `/database-status` | Database statistics and monitoring |
| **Data Audit** | `/data-audit` | Data integrity auditing and fixes |
| **Data Import/Export** | `/data-admin` | File uploads and data exports |
| **Meta Agent Dashboard** | `/meta-agent` | AI-powered system monitoring |
| **Templates** | `/templates` | Content template management |
| **Overlay Template Builder** | `/overlay-templates` | Create broadcast graphics overlays |
| **Overlay Test Page** | `/overlay-test` | Test and preview overlays |
| **Analytics Dashboard** | `/analytics` | System analytics and insights |
| **Video Editor** | `/video-editor` | Video editing and recording management |
| **Team Forms List** | `/teams-forms` | View all team forms |

## Common Navigation Patterns

### From Home Page
- Click "Team Matchup Studio" card → Team analysis
- Click "Live Presentation" card → Broadcast control
- Use Quick Access buttons for:
  - Frameworks
  - Content Library
  - RSS Intelligence
  - Team Matchup Studio

### Admin & Data Management
1. `/admin` - Main admin dashboard with tabs for:
   - Overview (database tables)
   - API Status
   - Export
   - Meta Agent
2. `/database-status` - Detailed database view
3. `/data-audit` - Fix data quality issues
4. `/data-admin` - Import/export operations

### Content Creation Flow
1. `/frameworks/create` - Create framework
2. `/frameworks` - Browse frameworks
3. `/content-library` - View created content
4. `/templates` - Manage templates

### Live Production Flow
1. `/team-matchup-studio` - Analyze teams
2. `/overlay-templates` - Design overlays
3. `/overlay-test` - Test overlays
4. `/live-presentation` - Go live

## Key Features by Category

### 📊 Data & Analytics
- **Team Matchup Studio**: Competition selection, head-to-head, statistics
- **Analytics Dashboard**: Performance metrics, charts, trend analysis
- **Database Status**: Record counts, data quality, update status
- **Team Forms List**: Recent form for all teams

### 📺 Production & Broadcasting
- **Live Presentation**: Multi-camera, program/preview, overlays
- **Overlay Template Builder**: Custom graphics, styling tools
- **Overlay Test Page**: Preview all overlay types
- **Video Editor**: AI-powered editing, recording management

### 📚 Content Management
- **Content Library**: Search, filter, organize all content
- **Framework Directory**: Browse, download, upload frameworks
- **Create Framework**: Build new frameworks with versions
- **Templates**: Manage content templates

### 📰 News & Intelligence
- **RSS Intelligence**: 4 tabs (Dashboard, Sources, Articles, Analysis)
- **RSS Control**: Ticker configuration and source management

### ⚙️ Administration
- **Admin Dashboard**: System overview, API status, exports
- **Data Audit**: Find and fix data issues
- **Data Import/Export**: File operations and history
- **Meta Agent Dashboard**: AI-powered system monitoring

## Filtering & Search Features

### RSS Intelligence - Articles Tab
- **Keyword search**: Search titles, descriptions, keywords
- **Source filter**: Multi-select checkbox list
- **Date range**: Start and end date pickers
- **Clear filters**: One-click reset

### Content Library
- **Search**: Text search across content
- **Type filter**: Report, Scene, Article, Image, etc.
- **Category filter**: By content category
- **Star filter**: Show only favorites
- **Sort**: Date, modified, popular, alphabetical

### Framework Directory
- **Search**: Name and description search
- **Category filter**: Filter by framework category
- **Category cards**: Click to filter by category

## Status Indicators

### Color Coding
- 🟢 **Green**: Active, healthy, successful
- 🟡 **Yellow**: Warning, partial, in progress
- 🔴 **Red**: Error, failed, critical
- 🔵 **Blue**: Info, neutral
- ⚪ **Gray**: Inactive, disabled

### Badge Types
- **Verified** - Verified sources
- **Active/Inactive** - Source status
- **Positive/Negative/Neutral** - Sentiment
- **W/D/L** - Win/Draw/Loss form indicators

## Data Refresh & Updates

### Manual Refresh Options
- **RSS Intelligence**: "Fetch All Feeds" button
- **Admin Dashboard**: Automatic real-time updates
- **Database Status**: Query-based refresh
- **Data Audit**: Manual refresh button

### Automatic Updates
- React Query caching with staleTime:
  - Competitions: 30 minutes
  - Teams: 30 minutes
  - Statistics: 10 minutes
  - Historical data: 60 minutes

## Tech Stack Reference

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State**: React Query (TanStack Query)
- **UI**: Custom components + Radix UI primitives
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Key Libraries
- `@tanstack/react-query` - Data fetching & caching
- `wouter` - Client-side routing
- `lucide-react` - Icon library
- `date-fns` - Date formatting
- `recharts` - Data visualization
- `zod` - Schema validation

### Design System
- **Primary Color**: Liverpool Red (#C8102E)
- **Secondary Color**: Navy Blue (#1B365D)
- **Background**: Cream (#E8DCC6, #F5EFE7)
- **Fonts**: 
  - League Spartan (headings)
  - Libre Franklin (body text)
  - Mono (statistics)

## Common Operations

### Creating New Content
1. Navigate to creation page
2. Fill required fields
3. Add metadata (tags, categories)
4. Submit form
5. View in respective library

### Viewing Data
1. Select filters/options
2. View results in cards/tables
3. Click for details modal
4. Perform actions (download, star, etc.)

### Managing RSS
1. Go to `/rss` (Intelligence) or `/rss-control`
2. View dashboard stats
3. Manage sources in Sources tab
4. Browse articles in Articles tab
5. Use filters to find specific content
6. Fetch feeds manually or wait for auto-update

### Database Operations
1. Check `/database-status` for overview
2. Run `/data-audit` for integrity check
3. Fix issues with action buttons
4. Use `/data-admin` for imports/exports
5. Monitor in `/admin` dashboard

## Troubleshooting

### No Data Showing
- Check `/database-status` for data availability
- Verify API connection in `/admin`
- Check date ranges and filters
- Refresh the page

### Can't Find Content
- Clear all filters
- Check search query spelling
- Verify content was created successfully
- Look in `/content-library` for all content

### Overlay Not Working
- Test in `/overlay-test` first
- Check data availability for overlay type
- Verify parameters (team ID, league ID, etc.)
- Review error messages in console

### RSS Feeds Not Updating
- Check source status in Sources tab
- Try manual fetch with "Fetch" button
- Verify feed URL is accessible
- Check last fetched time

## Best Practices

### Performance
- Use React Query's caching (don't refetch unnecessarily)
- Filter data client-side when possible
- Use skeleton loaders for better UX

### Data Management
- Run data audit regularly (`/data-audit`)
- Monitor database status (`/database-status`)
- Keep RSS feeds updated
- Export important data periodically

### Content Organization
- Use consistent tags and categories
- Star important frameworks/content
- Archive old content
- Maintain clean framework versions

### Production Workflow
1. Prepare data (Team Matchup Studio)
2. Design overlays (Overlay Template Builder)
3. Test overlays (Overlay Test Page)
4. Go live (Live Presentation)
5. Review analytics (Analytics Dashboard)

## Support & Documentation

- **Full Overview**: See `APP_PAGES_OVERVIEW.md`
- **Design Guidelines**: See `design_guidelines.md`
- **Blueprint**: See `CONTENT_CURATOR_BLUEPRINT.md`
- **Overlay Audit**: See `OVERLAY_AUDIT_REPORT.md`

---

*Last Updated: October 2025*
