# Mailman Media - The Production Post

## Overview
The Production Post is Mailman Media's AI-powered content creation platform for in-depth Liverpool FC YouTube channel analysis and visual content generation. It provides tools and branded templates to produce YouTube-ready assets like thumbnails, infographics, statistical charts, and analytical dashboards. The platform aims to revolutionize sports content creation by combining data-driven insights with professional visual design, focusing on rich, visually appealing narratives for a global audience interested in soccer analytics, transfer analysis, and story visualization.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a React-based SPA using `shadcn/ui` (Radix UI) with a dark-first, Liverpool FC-inspired color palette, styled with Tailwind CSS and Google Fonts.

### Technical Implementations

#### Live Presentation System
A broadcast control system for multi-camera live productions with real-time scene composition and graphics overlays. It uses Server-Sent Events (SSE) for state synchronization and canvas-based rendering. Key features include content management, branded graphics (news-show style banners, lower thirds), an RSS ticker with customizable settings, a professional overlay system with conflict detection, Mailman Media color palettes, a smart positioning grid, and video recording/export capabilities.

#### AI-Powered Video Editing System
A platform for transforming broadcast recordings into polished YouTube content. It utilizes FFmpeg for video processing (scene/silence detection, metadata), a Redis-backed Bull Queue for asynchronous background rendering, and PostgreSQL for metadata. Features include automated editing with an auto-cut system, an engagement-based pacing optimizer, a visual timeline editor UI, professional enhancement tools (color grading, audio), and a render queue with MP4/WebM export.

#### Football Data Integration
Integrates football data from multiple live sources with dynamic season handling (2020-present) that automatically detects and includes current and future seasons. Data sources include the Liverpool FC Official Calendar (iCal), API Football, The Fishy (Premier League table scraping), and FBRef (player/team statistics). A centralized `footballDataService.ts` provides an authenticated 4-source fallback chain (API Football Pro Plan → The Fishy → FBRef → localStorage cache) ensuring authentic, verified statistics with Zod validation, error recovery, and consistent UI states. Includes automatic twice-weekly updates, timestamp tracking, and a comprehensive database status page for monitoring data freshness and quality.

**Date/Time Validation System**: A comprehensive validation system (`server/utils/dateValidator.ts`) ensures the API always knows the accurate current date and uses correct season calculations. Features:
- Real-time date/time awareness with timezone tracking
- Intelligent season detection based on football calendar (August-May active, June-July off-season)
- Separate season logic for historical stats (completed season) vs fixtures (current/upcoming season)
- Critical off-season handling: June-July correctly returns upcoming season for fixtures (e.g., July 2025 → 2025/26)
- Comprehensive logging on every API call showing current date/time, current season, and requested season
- Server startup validation banner confirming date accuracy
- Season phase detection (pre-season, active-season, off-season)

#### Data Quality & Validation System
A 5-pillar solution for ensuring authentic, deduplicated football data. It includes schema enhancements (unique `player_id`), an admin diagnostics page (`/data-audit`) for detecting duplicates and missing data, automated data cleaning services, import safeguards with idempotent operations, and monitoring tools integrated into the database status dashboard.

#### RSS Intelligence System
Manages and analyzes RSS feeds for Liverpool FC news, featuring automated fetching with sentiment analysis, advanced filtering, and dashboard analytics. Integrated with the Live Presentation system for RSS ticker overlays.

#### Advanced Visual Presentation System
Generates broadcast-quality visual content with a 5-tab navigation, glassmorphism metric cards, progress bars, and a CSS Grid-based football pitch visualization, all adhering to Liverpool FC brand colors using Tailwind CSS.

#### Creative Visual Enhancement System
Integrates GPU-accelerated CSS transforms for animations and visual effects.

#### AI-Powered Framework System
A system for creating and executing analytical content templates with integrated AI. It uses AI (Claude/OpenAI) to convert documents into structured frameworks, which can then access various APIs (PostgreSQL, Perplexity, Claude, OpenAI, Football APIs) via a secure executor service. Features include version control and an AI-powered document upload UI.

#### Overlay Customization Enhancements
Includes an advanced data filtering system for metric overlays (competition, season, match limits, venue), an advanced styling system (typography, gradients, borders, shadows), and new overlay types such as Upcoming Fixtures (database-connected, fully functional), Player Comparison, and an Enhanced RSS Ticker with sentiment analysis.

**Upcoming Fixtures Overlay** (✅ Fully Operational):
- **Database Endpoint**: `GET /api/database/fixtures/upcoming` - Uses raw SQL query for reliable data fetching from `football_fixtures` table with team name joins
- **Template**: Registered in `overlayTemplates.ts` as 'upcoming-fixtures' (match category, 35% width × 280px height)
- **Features**: Displays next 3-7 Liverpool matches with dates, venues, countdown timers, home/away indicators, and opponent information
- **Data Source**: Purple "Database" badge indicates PostgreSQL backend with real-time fixture data
- **Integration**: Fully wired through VideoCompositor → LivePresentation → UpcomingFixturesOverlay component chain

## External Dependencies

### AI Integration
- **OpenAI GPT-4**: Content suggestions, creative generation, tactical analysis.
- **Claude (Anthropic)**: Advanced reasoning, document analysis, framework adaptation.
- **Perplexity API**: Real-time web search and current information retrieval.

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
- **TypeScript**: Type safety.
- **ESBuild**: Fast backend bundling.
- **React Query**: Server state management.

### Video Processing & Job Queue
- **FFmpeg**: Video and audio processing.
- **fluent-ffmpeg**: Node.js wrapper for FFmpeg.
- **Bull**: Redis-based job queue.
- **ioredis**: Redis client for Bull Queue.

### File Processing & Data Management
- **xlsx**: Excel file parsing and generation for import/export.
- **pdf-parse**: PDF text extraction (dynamic import to avoid startup issues).
- **officeparser**: DOCX and office document parsing.
- **sharp**: Image metadata extraction and processing.
- **multer**: Multipart form data handling for file uploads.

## Data Import/Export System
A comprehensive file management system for importing and exporting database content in multiple formats. Accessible at `/data-admin` with full admin capabilities for data management.

**Supported File Formats:**
- **Import**: JSON, CSV, XLSX, PDF, DOCX, HTML, JPEG, PNG, .web
- **Export**: JSON, CSV, XLSX

**Key Features:**
- **Drag & Drop Upload**: Intuitive file upload interface with visual feedback
- **Multi-Format Parsing**: Intelligent parsing service supporting structured data, documents, and images
- **Database Tracking**: Complete audit trail in `data_imports` table
- **Export Capability**: Download data from any table (football_players, rss_articles, library_items, scenes) in JSON/CSV/XLSX
- **Import History**: Real-time status tracking with color-coded badges (pending, processing, completed, failed)
- **Admin UI**: Full-featured management interface at `/data-admin`

**Technical Architecture:**
- **File Parser Service** (`server/admin/fileParserService.ts`):
  * JSON/CSV/XLSX parsers for structured data
  * PDF/DOCX/HTML text extraction
  * Image metadata extraction with Sharp
  * Dynamic pdf-parse import prevents startup errors
- **API Routes**:
  * `POST /api/admin/import` - Upload and parse files (FormData with multer)
  * `GET /api/admin/imports` - Fetch import/export history
  * `POST /api/admin/export/:format?table=X` - Export data in JSON/CSV/XLSX
  * `GET /api/admin/import/:id` - Get single import record details
- **Database Tracking** (`data_imports` table):
  * Fields: filename, file_type, operation, target_table, status, records_affected, error_message
  * Timestamp tracking (created_at) for audit
  * File size tracking in bytes
- **Frontend UI** (`client/src/pages/DataImportExport.tsx`):
  * File upload with drag-and-drop (50MB limit)
  * Table and format selection for exports
  * Import history table with sortable columns
  * Real-time refresh with React Query cache invalidation
  * Toast notifications for success/error feedback

**Security & Validation:**
- Files processed in memory only (no disk storage)
- Multer middleware with 50MB size limit
- Extension-based format validation
- Comprehensive error handling with user-friendly messages
- POST method enforcement for data mutations

## FBref HTML Import System
A specialized data import system for extracting comprehensive Liverpool FC player statistics from FBref.com HTML files and storing them in the database for overlay consumption.

**Multi-Table HTML Parser** (`server/admin/fileParserService.ts`):
- Extracts ALL 11 FBref statistics tables per team:
  1. stats_standard_combined (games, goals, assists)
  2. stats_shooting_combined (shots, accuracy)
  3. stats_passing_combined (passes, key passes)
  4. stats_defense_combined (tackles, blocks, interceptions)
  5. stats_possession_combined (touches, dribbles, carries)
  6. stats_misc_combined (fouls, aerials)
  7. stats_playing_time_combined (substitutes)
  8. stats_gca_combined (goal/shot creation)
  9. stats_passing_types_combined
  10. stats_keeper_combined (goalkeeper stats)
  11. stats_keeper_adv_combined (advanced GK)
- Merges 160+ fields by player name for complete statistics
- Handles both string fields (position: "FW", "MF") and numeric fields (goals, assists, xG)

**Intelligent Field Mapping** (`server/admin/footballDataImporter.ts`):
- Maps 28 database columns from 160 FBref fields
- Type-aware parsing: STRING_FIELDS set identifies text vs numeric columns
- Calculated derived fields:
  * duels_won = challenges - challenges_lost
  * penalty_missed = pens_att - pens_made
- Decimal preservation for accuracy metrics (passes_pct, xG stats)
- Comprehensive mapping:
  * Games: appearances, lineups, minutes, position, substitutes
  * Shooting: shots_total, shots_on
  * Passing: passes_total, passes_key, passes_accuracy
  * Defensive: tackles, blocks, interceptions
  * Duels: duels_total, duels_won
  * Dribbles: dribbles_attempts, dribbles_success
  * Fouls: fouls_drawn, fouls_committed
  * Cards: yellow, yellowred, red
  * Penalties: penalty_won, penalty_committed, penalty_scored, penalty_missed

**Database Integration:**
- API Endpoint: `POST /api/admin/import-to-database`
- Accepts: { data, teamName, season, leagueName }
- Returns: { success, imported, updated, errors, total }
- Upsert logic: Updates existing stats, creates new records
- Automatically creates teams/leagues as needed

**Unified Database Query Endpoints:**
- `GET /api/database/players?teamId=40&season=2024` - Get all players
- `GET /api/database/stats?playerId=X&season=Y&competition=Z` - Player statistics with filters
- `GET /api/database/table?leagueId=39&season=2024` - League standings
- `GET /api/database/fixtures/upcoming?teamId=40&limit=5` - Upcoming matches

**Current Status:**
- ✅ Code complete and production-ready
- ✅ Multi-table parser working (160 fields extracted)
- ✅ Field mapping complete (28/42 schema columns populated)
- ✅ API endpoints created
- ⚠️ Database schema sync required (ID columns missing auto-increment defaults)