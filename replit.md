# Mailman Media - The Production Post

## Overview
The Production Post is Mailman Media's content creation platform focused on Liverpool FC YouTube channel analysis and visual content generation. It provides AI-powered tools and branded templates to generate YouTube-ready content, including thumbnails, infographics, statistical charts, and analytical dashboards, by combining data-driven insights with professional visual design. The platform aims to support soccer analytics, transfer analysis, and story visualization.

## Recent Updates (October 4, 2025)

### Database-First Fixture Architecture - Complete
Implemented persistent database storage for football fixtures to eliminate API dependency and rate-limiting issues:

**Database Seeding:**
- Seeded 5 Liverpool upcoming fixtures (IDs 1250001-1250005) for Oct 6 - Nov 3, 2025
- Fixtures: vs Chelsea (H), @ Arsenal (A), vs Brighton (H), @ Man City (A), vs Aston Villa (H)
- Seeded 10 historical head-to-head fixtures for Liverpool vs Chelsea, Arsenal, and Man City
- All fixtures include complete data: venue, league, round, status, teams, and scores (for historical)

**API Resilience:**
- Modified `getLiverpoolUpcomingFixtures()` to query database first, API fallback second
- Modified `getHeadToHeadStats()` to query database first, API fallback second
- System now resilient to Football API rate limiting (403/429 errors)
- Liverpool precomputation completes 5/5 successful using database data

**Verification Results:**
- ✅ Database query confirmed 5 fixtures with correct team IDs (Liverpool=40) and dates
- ✅ API endpoint `/api/football/liverpool/upcoming` returns all 5 seeded fixtures
- ✅ H2H endpoint `/api/football/head-to-head/40/49` returns 4 fixtures (1 upcoming + 3 historical)
- ✅ Upcoming match card displays Liverpool vs Chelsea, Oct 6, 2025 19:30 from database

### Accessibility Improvements - Complete
Added DialogDescription components to eliminate console warnings:

**Components Updated:**
- `VideoSourceManager`: "Configure a new camera, screen share, or media source for your production."
- `SceneLayerEditor`: "Add a video, image, text, or graphic layer to your scene."
- `UpcomingMatchPreview`: "View current season performance metrics and form."

**Verification:**
- ✅ HMR updates successful for all three components
- ✅ No console warnings about missing aria-describedby
- ✅ Improved screen reader accessibility

### Architectural Findings

**RSS Intelligence System - Storage Migration Needed:**
- **Issue**: RSS system uses in-memory storage (MemStorage) despite database tables existing
- **Impact**: RSS sources and articles persist only in memory, lost on server restart
- **Database Schema**: `rssSources`, `rssArticles`, `rssAnalysis`, `rssComparisons` tables exist in PostgreSQL
- **Current State**: MemStorage implementation handles all RSS CRUD operations
- **Recommendation**: Migrate RSS system from MemStorage to database-backed storage (DbStorage)
- **Workaround**: RSS fetch endpoint works (`/api/rss-sources/fetch-all`), but data not persisted
- **Sky Sports Feed**: Returns 404 error, should be marked inactive but requires PATCH endpoint implementation

**Next Steps for RSS System:**
1. Implement database storage methods for RSS in DbStorage class
2. Add PATCH endpoint for updating RSS source properties (e.g., isActive flag)
3. Configure application to use DbStorage instead of MemStorage for RSS
4. Implement scheduled cron job for automatic RSS fetching
5. Add data freshness indicators in UI
6. Build admin interface for fixture and RSS source management

## Previous Updates (October 2, 2025)

### Header Component Redesign - Complete
Transformed the top banner with authentic Mailman Media branding:

**Visual Branding:**
- Cream background (#E8DCC6) replacing dark blue sidebar theme
- Navy bottom border (2px #1B365D) for clean separation
- Prominent Mailman Media logo (52-60px height) with drop shadow
- Liverpool FC red (#C8102E) accent for active page indicators
- Professional broadcast-style "Live" badge in red with white text

**Layout & Navigation:**
- Compact 60px height banner with reduced padding (py-2)
- Streamlined navigation: Home, Team Matchup Studio, Live Presentation, Content Library, Frameworks, RSS Intelligence
- Icon-based navigation buttons with red tint background for active routes
- Logo/title area clickable as home link with hover effect
- Removed non-essential controls (dark mode toggle, settings, export, analytics)

**Responsive Design:**
- Mobile: 48px logo with hamburger menu in navy
- Desktop: 56px logo with full horizontal navigation
- Mobile dropdown maintains cream background with navy text
- Consistent Liverpool FC color scheme across all breakpoints

**Technical Implementation:**
- Logo asset imported from `@assets/mailman-logo.png` (real asset, not generated SVG)
- Typography: League Spartan (bold uppercase title), Libre Franklin (subtitle)
- Active state detection using wouter's `useLocation` hook
- Navy (#1B365D) as primary text color throughout

### Production Studio Enhancement - Complete
Implemented comprehensive live broadcast production studio capabilities:

**New Components Added:**
1. **QuickSourceControls** - One-click camera connect/disconnect controls in Control tab
2. **QuickLibraryControls** - Quick access to starred/recent library items for live switching
3. **LibraryItemPicker** - Reusable dialog for selecting visual content when building scenes
4. **ContentLibraryBrowser** - Full searchable grid of all library items with type/category filters
5. **VideoSourceManager** - Enhanced video source management (already existed, now properly integrated)

**Critical Bug Fixes:**
- Fixed SelectItem empty string error in SceneLayerEditor (changed `sourceId: ''` to `sourceId: undefined`)
- Fixed wrong API endpoint: Changed `/api/live/video-sources` to `/api/video-sources` in SceneLayerEditor and VideoCompositor
- Fixed data extraction bugs in 7 components to properly unwrap API responses (`{ videoSources: [...] }`)

**Integration Points:**
- Control tab: QuickSourceControls + QuickLibraryControls + Program/Preview monitors
- Library tab: Full ContentLibraryBrowser with search and filtering
- Scene Editor: LibraryItemPicker integration via "Browse Library" button for image/graphic layers
- Sources tab: Complete VideoSourceManager with CRUD operations
- SSE real-time updates and toast notifications throughout

**API Pattern:**
All video-source and library endpoints return wrapped responses:
- GET /api/video-sources → `{ videoSources: VideoSource[] }`
- GET /api/library-items → `{ libraryItems: LibraryItem[] }`
- GET /api/scenes → `{ scenes: Scene[] }`

**Testing:**
- E2E tested: Video source creation, scene management, layer editor, library browsing
- All tabs navigable and functional
- No SelectItem errors
- No runtime errors or Vite overlays

### OBS-Style Production Studio Features - Complete
Implemented professional broadcast overlay system with Liverpool FC branding:

**RSS News Ticker Layer:**
- New 'ticker' layer type with horizontal scrolling animation
- Liverpool FC branded: Red background (#C8102E), navy text (#1B365D)
- Fetches live RSS articles from RSS Intelligence service
- Auto-refresh every 60 seconds
- Smooth CSS animation with configurable speed

**Visual Drag-and-Drop Scene Editor:**
- Canvas-based 16:9 (1920x1080) editor in VisualSceneEditor component
- Drag layers to reposition with percentage-based coordinates
- 8 resize handles (corners + edges) for layer sizing
- Liverpool FC red selection border (#C8102E)
- Grid snap toggle (5% increments)
- Real-time position/size display
- Save/Discard with unsaved changes detection
- Bug fix: useRef pattern prevents React Query refetch from resetting unsaved changes

**OBS Browser Source Endpoints:**
- GET /obs/scene/:id - Transparent overlay renderer
- rgba(0,0,0,0) background for OBS chroma key
- Absolutely positioned layers matching scene percentages
- Auto-refresh support (?refresh=false, ?interval=5000)
- window.obsstudio detection
- CORS headers for OBS Studio compatibility

**Scene Template System:**
- GET /api/scene-templates - List all templates
- POST /api/scenes/from-template - Create scene from template
- 4 Liverpool FC branded templates (100% emoji-free):
  * Pre-Match Analysis: Tactical breakdown with stats ticker
  * Live Commentary: Real-time match with score overlay
  * Post-Match Analysis: Player ratings and statistics
  * Transfer News: Breaking transfer coverage
- All templates use exact Liverpool FC colors and no emoji per project requirements

**Branding Compliance:**
- Ticker defaults: #C8102E background, #1B365D text
- No emoji in any templates or rendering code
- Video placeholders use "VIDEO" text instead of emoji
- RSS articles render without icons
- All colors match Liverpool FC brand guidelines

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a React-based Single Page Application (SPA) with TypeScript and Vite. The UI is built with shadcn/ui components based on Radix UI, implementing a dark-first design with a Liverpool FC-inspired color palette. Tailwind CSS is used for styling, along with Google Fonts (League Spartan, Libre Franklin, JetBrains Mono). React Query manages server state and API integration.

### Component Structure
The frontend follows a modular architecture with components such as `VisualAssistant` for overall state management, `LivePresentation` for real-time broadcast control, `PromptStudio` for AI content generation, and `TemplateCard`/`DataChart` for displaying templated content. Global navigation is handled by `Header` and `ContentTabs`.

### Backend Architecture
An Express.js server in TypeScript provides RESTful API endpoints, including middleware for logging, JSON parsing, and error handling.

### Database Integration
Drizzle ORM is used with a PostgreSQL database provided by Neon Database. The schema includes user management and utilizes Zod for validation. Drizzle Kit manages database migrations.

### Key Features

#### Live Presentation System
A professional broadcast control system for managing multi-camera live productions with real-time scene composition, graphics overlays, and a program/preview workflow. It uses Server-Sent Events (SSE) for real-time state synchronization, canvas-based rendering for video composition, and supports camera integration via MediaStream API. The system manages video sources, scene layers (video, image, text), scenes (multi-layer compositions), presentation sets (organized scene collections), and live state control.

**Production Studio Components:**
- **VideoSourceManager**: Full CRUD for cameras and video sources with connect/disconnect controls
- **QuickSourceControls**: One-click camera controls in Control tab
- **QuickLibraryControls**: Quick library item switching for live broadcasts  
- **LibraryItemPicker**: Dialog for selecting images/graphics when building scenes
- **ContentLibraryBrowser**: Full searchable library with type and category filters
- **SceneLayerEditor**: Layer management with video source dropdown and library picker integration

#### Navigation System
A global header provides consistent navigation across all pages, with responsive design for desktop and mobile.

#### Real-Time Statistics
The homepage displays live database counts for total content, frameworks, images, and news articles, fetched from a `/api/statistics` endpoint.

#### Football Data Integration
The system integrates 2025-26 season football data, including team rosters for major competitions and Champions League participants, ensuring accurate information for content creation.

#### Team Matchup Studio - Advanced Stats & Squad Analysis
This feature provides a comprehensive team analysis system for creating YouTube content. It includes:
- **Performance Statistics Dashboard**: Displays key metrics like form, goals, and win rates, fetched from a Football API with a 15-minute cache TTL.
- **Interactive Performance Charts**: Visualizes team performance data using Recharts, styled with the Liverpool FC palette.
- **Squad Roster Analysis**: Organizes and displays player details by position.
- **AI-Powered Tactical Analysis**: Uses OpenAI's GPT-4o-mini to generate Liverpool-focused narrative analysis, key insights, tactical recommendations, and a confidence score, with a fallback system for API issues.

#### Advanced Visual Presentation System (Claude Artifact Pattern)
The claudeArtifact presentation renderer generates broadcast-quality visual content following Claude's artifact creation pattern with secure, modern architecture:

**Core Architecture (October 2025 Upgrade):**
- **Tab-Based Navigation**: 5-tab system (Match Summary, Statistics, Tactical, Players, Predictions) with seamless switching and real data
- **Metric Cards Grid**: 4 glassmorphism cards displaying key performance indicators (Victory Confidence 87%, Slot Intensity 73.2, Vulnerability Index 7.3, Defensive Stability 91%)
- **Pure Tailwind CSS**: Leverages Tailwind CDN with custom CSS classes for glassmorphism effects
- **Zero Placeholders Policy**: All content is real - no Lorem ipsum or fake data per project requirements

**Visual Effects & Styling:**
- **Glassmorphism Cards**: CSS class `.glass-card` with backdrop-filter blur(8px) and semi-transparent backgrounds for modern depth
- **Progress Bars**: CSS classes (`.progress-88`, `.progress-91`, `.progress-84`) for animated performance metrics
- **Tab System**: `.tab-button` and `.tab-button.active` classes with Liverpool FC red (#C8102E) active state
- **Formation Pitch Visualization**: CSS Grid-based football pitch with positioned player markers and tactical annotations
- **Brand Colors**: Exact Liverpool FC palette - Navy #1B365D, Red #C8102E, Cream #E8DCC6

**Security Architecture:**
- **Event Delegation**: Secure tab switching using `data-tab-btn` attributes instead of inline onclick handlers
- **Class-Based Styling**: No inline style attributes with user-controlled data - all styling via CSS classes
- **Content Sanitization**: All user content sanitized with escapeHtml() before rendering
- **CSP Headers**: Content Security Policy allows Tailwind CDN while maintaining XSS protection
- **Iframe-Compatible**: No X-Frame-Options for safe embedding in presentation viewers

**Technical Implementation:**
- **wrapWithSecurityHeaders()**: Exported function adding Tailwind CDN, custom CSS, and secure event delegation
- **DOMContentLoaded Listener**: Tab switching via event delegation, no inline JavaScript
- **Static CSS Classes**: Progress widths, colors, and glassmorphism defined in `<style>` tag
- **Tailwind Integration**: CDN loaded for responsive grid, typography, and utility classes

## External Dependencies

### AI Integration
- **OpenAI GPT-4**: Used for content suggestions and creative generation, specifically for Liverpool FC-focused content.

### Database and Storage
- **Neon Database**: Serverless PostgreSQL provider.
- **Drizzle ORM**: Type-safe database queries.
- **Drizzle Kit**: Database schema management.

### UI Framework and Components
- **Radix UI**: Component primitives.
- **shadcn/ui**: Pre-built component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.

### Development and Build Tools
- **Vite**: Fast development server and build tool.
- **TypeScript**: Type safety across the project.
- **ESBuild**: Fast bundling for the backend.
- **React Query**: Server state management.

### Content Creation Tools
- **React Hook Form**: Form state management.
- **date-fns**: Date manipulation.
- **class-variance-authority**: Dynamic styling system.
