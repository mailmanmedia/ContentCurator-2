# ContentCurator-2 Page Architecture

## Application Structure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     HOME / VISUAL ASSISTANT (/)                  │
│                    Main Dashboard & Landing                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Reports    │  │    Scenes    │  │   Library    │  Stats  │
│  │     Count    │  │    Count     │  │    Items     │  Bar    │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────────┐
             │                                                      │
    ┌────────▼────────┐                                   ┌────────▼────────┐
    │  PRODUCTION     │                                   │   CONTENT       │
    │    TOOLS        │                                   │  MANAGEMENT     │
    └────────┬────────┘                                   └────────┬────────┘
             │                                                      │
    ┌────────┴────────┬────────────────┐                  ┌────────┴────────┬────────────┐
    │                 │                │                  │                 │            │
┌───▼────────┐  ┌────▼─────────┐  ┌──▼─────────┐   ┌────▼──────────┐  ┌──▼─────────┐  │
│   TEAM     │  │    LIVE      │  │  OVERLAY   │   │   CONTENT     │  │ FRAMEWORK  │  │
│  MATCHUP   │  │PRESENTATION  │  │  SYSTEMS   │   │   LIBRARY     │  │ DIRECTORY  │  │
│   STUDIO   │  │              │  │            │   │               │  │            │  │
└───┬────────┘  └────┬─────────┘  └──┬─────────┘   └───┬───────────┘  └──┬─────────┘  │
    │                │               │                 │                  │            │
    │                │               │                 │                  │            │
    │           ┌────▼──────┐   ┌───▼──────────┐     │              ┌───▼──────────┐  │
    │           │  OVERLAY  │   │   OVERLAY    │     │              │   CREATE     │  │
    │           │ TEMPLATE  │   │     TEST     │     │              │  FRAMEWORK   │  │
    │           │  BUILDER  │   │     PAGE     │     │              └──────────────┘  │
    │           └───────────┘   └──────────────┘     │                                │
    │                                                 │              ┌─────────────────┤
┌───▼──────────┐                                     │              │   TEMPLATES     │
│ ANALYTICS    │                                     │              └─────────────────┘
│  DASHBOARD   │                                     │
└──────────────┘                                     │
    │                                                 │
┌───▼──────────┐                              ┌──────▼───────┐
│  TEAM FORMS  │                              │VIDEO EDITOR  │
│     LIST     │                              └──────────────┘
└──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    NEWS & INTELLIGENCE                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │       RSS        │        │   RSS CONTROL    │              │
│  │  INTELLIGENCE    │◄──────►│      PANEL       │              │
│  │                  │        │                  │              │
│  │ • Dashboard      │        │ • Source Config  │              │
│  │ • Sources        │        │ • Ticker Setup   │              │
│  │ • Articles       │        └──────────────────┘              │
│  │ • Analysis       │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              ADMINISTRATION & DATA MANAGEMENT                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │    ADMIN     │   │   DATABASE   │   │     DATA     │        │
│  │  DASHBOARD   │◄─►│    STATUS    │◄─►│    AUDIT     │        │
│  │              │   │              │   │              │        │
│  │ • Overview   │   │ • Tables     │   │ • Duplicates │        │
│  │ • API Status │   │ • Records    │   │ • Missing    │        │
│  │ • Export     │   │ • Updates    │   │ • Orphaned   │        │
│  │ • Meta Agent │   └──────────────┘   └──────────────┘        │
│  └──────┬───────┘                                               │
│         │                                                        │
│  ┌──────▼───────┐          ┌──────────────────┐                │
│  │    DATA      │          │   META AGENT     │                │
│  │ IMPORT/EXPORT│          │    DASHBOARD     │                │
│  │              │          │                  │                │
│  │ • Import     │          │ • AI Chat        │                │
│  │ • Export     │          │ • System Health  │                │
│  │ • History    │          │ • Tasks          │                │
│  └──────────────┘          └──────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Page Relationships & Data Flow

### Content Creation Flow
```
Create Framework → Framework Directory → Content Library
        ↓
    Templates → Video Editor → Content Library
```

### Live Production Flow
```
Team Matchup Studio → Data Analysis
        ↓
Overlay Template Builder → Design Overlays
        ↓
Overlay Test Page → Preview & Test
        ↓
Live Presentation → Go Live
        ↓
Analytics Dashboard → Review Performance
```

### Data Management Flow
```
Data Import/Export → Import Data
        ↓
Database Status → Monitor Data
        ↓
Data Audit → Identify Issues
        ↓
Fix Data → Update Database
        ↓
Admin Dashboard → Verify Status
```

### RSS Intelligence Flow
```
RSS Control → Configure Sources
        ↓
RSS Intelligence → Fetch & Aggregate
        ↓
Articles Tab → Filter & Browse
        ↓
Content Library → Archive Articles
```

## Navigation Hierarchy

### Primary Navigation (from Home)
- **Production Tools**
  - Team Matchup Studio (main analysis tool)
  - Live Presentation (broadcast control)
  
- **Quick Access**
  - Frameworks (content frameworks)
  - Library (all content)
  - RSS Intelligence (news)
  - Matchup Studio (duplicate for importance)

### Admin Navigation (from Header/Menu)
- Admin Dashboard (system overview)
  - Links to Database Status
  - Links to Meta Agent
- Database Status (detailed data view)
  - Links to Meta Agent
- Data Audit (fix data issues)
- Data Import/Export (file operations)

### Content Navigation
- Content Library (browse all)
- Framework Directory (discover frameworks)
  - Create Framework (from directory)
- Templates (manage templates)
- Video Editor (edit videos)

### RSS Navigation
- RSS Intelligence (main interface)
  - 4 tabs: Dashboard, Sources, Articles, Analysis
- RSS Control (configuration panel)

## Component Hierarchy

### Layout Components
```
App
├── QueryClientProvider
│   ├── TooltipProvider
│   │   ├── PiPProvider
│   │   │   ├── CameraStreamProvider
│   │   │   │   ├── Toaster
│   │   │   │   └── Router
│   │   │   │       ├── Header (shared across pages)
│   │   │   │       └── Page Components
```

### Page Component Structure
```
Page Component
├── Header (navigation)
├── Page Title & Description
├── Filters/Controls (if applicable)
├── Tabs (if multi-section)
│   ├── Tab 1 Content
│   ├── Tab 2 Content
│   └── Tab N Content
├── Main Content Area
│   ├── Cards/Grid
│   ├── Tables
│   └── Forms
└── Modals/Dialogs (as needed)
```

## Data Architecture

### Query Keys Pattern
```typescript
// Static data (long cache)
['/api/football/competitions'] // 30 min
['/api/framework-categories'] // 30 min

// Dynamic data (short cache)
['/api/football/teams', teamId, 'statistics', leagueId, season] // 10 min
['/api/rss-articles', { filters }] // 5 min

// Real-time data (minimal cache)
['/api/database-status'] // 1 min
['/api/admin/data-audit'] // on-demand
```

### Mutation Pattern
```typescript
// Create operations
useMutation({ mutationFn: apiRequest('POST', '/api/frameworks') })

// Update operations
useMutation({ mutationFn: apiRequest('PUT', `/api/frameworks/${id}`) })

// Delete operations
useMutation({ mutationFn: apiRequest('DELETE', `/api/items/${id}`) })

// Custom operations
useMutation({ mutationFn: apiRequest('POST', `/api/rss-sources/fetch-all`) })
```

## State Management

### Global State (via Context)
- **CameraStreamContext**: Camera feed management
- **PiPContext**: Picture-in-picture state
- **QueryClient**: React Query cache

### Local State (per page)
- Component state with `useState`
- Form state with React Hook Form
- URL state with Wouter

### Server State (React Query)
- Cached API responses
- Optimistic updates
- Background refetching
- Query invalidation

## Integration Points

### External Services
1. **Football Data API**
   - Competitions, teams, fixtures
   - Player statistics
   - League tables
   
2. **RSS Feeds**
   - Multiple Liverpool FC sources
   - Automatic fetching
   - Sentiment analysis

3. **AI Services**
   - OpenAI (GPT)
   - Claude (Anthropic)
   - Text extraction
   - Analysis generation

### Internal Services
1. **Database (via Drizzle ORM)**
   - PostgreSQL/Neon
   - Type-safe queries
   - Migration management

2. **File Storage**
   - Document uploads
   - Image management
   - Video recordings

3. **WebRTC**
   - Camera streams
   - Screen capture
   - Live broadcasting

## Security & Access

### Public Pages
- Home / Visual Assistant
- (Most pages require authentication in production)

### Admin Pages
- Admin Dashboard
- Database Status
- Data Audit
- Data Import/Export
- Meta Agent Dashboard

### User Pages
- All content creation/viewing pages
- Production tools
- Analytics

## Performance Optimization

### Caching Strategy
- **Long cache (30-60 min)**: Static data (competitions, teams, categories)
- **Medium cache (10 min)**: Semi-static data (statistics, squad info)
- **Short cache (1-5 min)**: Dynamic data (articles, live updates)
- **No cache**: Real-time data (database status, audit results)

### Loading Strategies
- Skeleton loaders for better UX
- Parallel queries for related data
- Lazy loading for heavy components
- Optimistic updates for mutations

### Code Splitting
- Route-based code splitting via Vite
- Component lazy loading where beneficial
- Dynamic imports for heavy libraries

## Accessibility

### Features
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader friendly

### Testing
- Test IDs on key elements
- Consistent naming conventions
- E2E test support structure

---

## Summary

The ContentCurator-2 architecture is organized into five main functional areas:

1. **Production Tools** - Live broadcasting and team analysis
2. **Content Management** - Frameworks, library, templates
3. **News Intelligence** - RSS aggregation and analysis
4. **Administration** - System management and data operations
5. **Analytics** - Performance monitoring and insights

All pages share common patterns:
- React Query for data management
- Consistent UI components
- Liverpool FC branding
- Responsive design
- Error handling
- Loading states

The architecture supports both content creation workflows and live production workflows, with clear data flows and navigation patterns.
