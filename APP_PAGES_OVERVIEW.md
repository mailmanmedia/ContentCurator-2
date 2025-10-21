# ContentCurator-2 App Pages Overview

This document provides a comprehensive overview of all pages in the ContentCurator-2 application, including their purpose, key features, and current state.

## Table of Contents
1. [Home / Visual Assistant](#1-home--visual-assistant)
2. [Team Matchup Studio](#2-team-matchup-studio)
3. [Live Presentation](#3-live-presentation)
4. [Content Library](#4-content-library)
5. [Framework Directory](#5-framework-directory)
6. [Create Framework](#6-create-framework)
7. [RSS Intelligence](#7-rss-intelligence)
8. [RSS Control](#8-rss-control)
9. [Admin Dashboard](#9-admin-dashboard)
10. [Database Status](#10-database-status)
11. [Data Audit](#11-data-audit)
12. [Data Import/Export](#12-data-importexport)
13. [Meta Agent Dashboard](#13-meta-agent-dashboard)
14. [Templates](#14-templates)
15. [Overlay Template Builder](#15-overlay-template-builder)
16. [Overlay Test Page](#16-overlay-test-page)
17. [Analytics Dashboard](#17-analytics-dashboard)
18. [Video Editor](#18-video-editor)
19. [Team Forms List](#19-team-forms-list)

---

## 1. Home / Visual Assistant
**Route:** `/`  
**Component:** `VisualAssistant.tsx`  
**Status:** ✅ Fully Functional

### Purpose
The main landing page and dashboard for the ContentCurator-2 application, providing a high-level overview of the system and quick access to key features.

### Key Features
- **Hero Section** with Mailman Media branding and animated border effects
- **Statistics Dashboard** displaying:
  - Reports count
  - Scenes count
  - Library items count
  - RSS articles count
- **Upcoming Match Preview** component
- **Featured Production Tools** with enhanced cards for:
  - Team Matchup Studio (with tactical analysis capabilities)
  - Live Presentation (broadcast control)
- **Quick Access Grid** with shortcuts to:
  - Frameworks
  - Content Library
  - RSS Intelligence
  - Team Matchup Studio

### Design
- Liverpool FC color scheme (Red #C8102E, Navy #1B365D, Cream #E8DCC6)
- League Spartan and Libre Franklin fonts
- Animated hover effects and glowing elements
- Responsive grid layout

### Current State
Production-ready with polished UI/UX, fully responsive, and optimized for performance with query caching.

---

## 2. Team Matchup Studio
**Route:** `/team-matchup-studio` or `/team-matchup`  
**Component:** `TeamMatchupStudio.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Advanced tactical analysis tool for comparing teams, viewing statistics, squad rosters, and AI-powered insights.

### Key Features
- **Competition Selection** - Choose from Premier League, Champions League, etc.
- **Team Selection** - Select one or two teams for comparison
- **Analysis Modes:**
  - Single team analysis (stats + squad)
  - Head-to-head comparison
- **Data Visualization:**
  - Team statistics (goals, shots, possession, etc.)
  - Form analysis with visual indicators
  - Squad listings with player details
  - Historical head-to-head fixtures
- **Season Selection** - View data from different seasons
- **Performance Metrics:**
  - Goals for/against
  - Clean sheets
  - Win/draw/loss records
  - Recent form (last 5 matches)

### Technical Details
- Parallel data fetching for optimal performance
- Smart caching strategy (30 min for competitions/teams, 10 min for stats)
- Recharts integration for data visualization
- Real-time AI analysis capabilities

### Current State
Fully functional with comprehensive football data integration, optimized queries, and responsive design.

---

## 3. Live Presentation
**Route:** `/live-presentation` or `/live`  
**Component:** `LivePresentation.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Professional broadcast control system for managing live presentations with multi-camera support and real-time graphics overlays.

### Key Features
- **Program/Preview Workflow** - Industry-standard broadcast switching
- **Multi-Camera Management** - Switch between multiple video sources
- **Scene Composition** - Create and manage presentation scenes
- **Graphics Overlays** - Real-time overlay management for:
  - Upcoming fixtures
  - League tables
  - Player statistics
  - RSS ticker
  - Head-to-head matchups
- **Camera Stream Integration** via CameraStreamContext
- **Picture-in-Picture Support** via PiPContext
- **Scene Library** - Save and recall scene configurations
- **Real-time Controls** - Live switching and transitions

### Technical Details
- WebRTC camera stream support
- Context-based state management for cameras and PiP
- React Query for data fetching
- Custom overlay components with configurable parameters

### Current State
Production-ready broadcast control system with professional features for live content creation.

---

## 4. Content Library
**Route:** `/content-library`  
**Component:** `ContentLibrary.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Central repository for browsing and managing all created content across the platform.

### Key Features
- **Content Browsing:**
  - Grid and list view options
  - Search functionality
  - Filter by type (Report, Scene, Article, Image, etc.)
  - Filter by category
  - Star/favorite content
- **Quick Stats Dashboard:**
  - Total content count
  - By type breakdown
  - Star count
  - Recent activity
- **Content Types:**
  - Reports
  - Scenes
  - Articles
  - Images
  - Presentations
  - Video content
- **Content Management:**
  - View details
  - Edit metadata
  - Download
  - Archive
  - Delete
- **Sorting Options:**
  - Date created
  - Last modified
  - Most popular
  - Alphabetical

### Technical Details
- React Query for data management
- Search and filter with useMemo optimization
- Responsive grid layout
- Badge system for content metadata

### Current State
Fully functional content management system with comprehensive filtering and sorting capabilities.

---

## 5. Framework Directory
**Route:** `/frameworks`  
**Component:** `FrameworkDirectory.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Discover, browse, and manage content frameworks for Liverpool FC analysis.

### Key Features
- **Framework Discovery:**
  - Search by name/description
  - Filter by category
  - View framework statistics
  - Star/favorite frameworks
- **Category System:**
  - Color-coded categories
  - Framework count per category
  - Visual category cards
- **Framework Details Modal:**
  - Full description
  - Tags and metadata
  - Download statistics
  - Last updated date
  - Document upload capability
- **Document Upload:**
  - PDF and Word document support (.pdf, .doc, .docx)
  - Automatic text extraction
  - Progress tracking
  - Error handling for extraction failures
- **Framework Actions:**
  - View details
  - Download/Use framework
  - Star/unstar
  - Track download count

### Technical Details
- PDF and DOCX text extraction
- Upload progress tracking
- Query invalidation for real-time updates
- Responsive grid layout
- Toast notifications for user feedback

### Current State
Production-ready with advanced document processing capabilities and comprehensive framework management.

---

## 6. Create Framework
**Route:** `/frameworks/create`  
**Component:** `CreateFramework.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Create new content frameworks with metadata, tags, and initial version information.

### Key Features
- **Framework Creation Form:**
  - Name and description
  - Category selection
  - Tags management (add/remove)
  - Initial version setup
- **Version Management:**
  - Version number
  - Version title
  - Content JSON
  - Changelog markdown
- **AI Integration Options:**
  - OpenAI provider
  - Claude provider
- **File Upload:**
  - Document attachment
  - Support for various formats
- **Form Validation:**
  - Zod schema validation
  - React Hook Form integration
  - Real-time error feedback

### Technical Details
- Form validation with Zod
- React Hook Form for state management
- Mutation hooks for API calls
- Category data fetching
- Navigation after creation

### Current State
Fully functional framework creation system with robust validation and AI integration options.

---

## 7. RSS Intelligence
**Route:** `/rss`  
**Component:** `RssIntelligence.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Liverpool FC news aggregation and analysis system for monitoring multiple RSS feeds.

### Key Features
- **Dashboard Tab:**
  - Total sources count
  - Total articles count
  - This week's articles
  - Feed health status
  - Recent articles preview
- **Sources Tab:**
  - RSS source management
  - Category filtering (Official, Fan Site, Media, Podcast)
  - Source search
  - Manual fetch for individual sources
  - Source statistics (articles, last update, frequency)
  - Active/inactive status indicators
- **Articles Tab:**
  - Comprehensive article filtering:
    - Keyword search
    - Multi-source selection
    - Date range picker (start/end)
  - Active filter indicators with clear options
  - Article display with:
    - Title and description
    - Source attribution
    - Publication date/time
    - Author information
    - Reading time
    - Keywords and topics
    - Sentiment badges
- **Analysis Tab:**
  - Placeholder for AI-powered insights
  - Coming soon features

### Technical Details
- Multi-criteria filtering system
- Date range filtering with date-fns
- Checkbox-based multi-select for sources
- Calendar component for date selection
- Filter state management
- Mutation hooks for fetch operations
- Real-time feed updates

### Current State
Production-ready RSS aggregation system with advanced filtering and comprehensive article management.

---

## 8. RSS Control
**Route:** `/rss-control`  
**Component:** `RssControl.tsx`  
**Status:** ✅ Fully Functional (Wrapper Component)

### Purpose
Manage RSS feed sources and configure ticker display settings.

### Key Features
- RSS ticker control panel integration
- Feed source configuration
- Display settings management

### Technical Details
- Simple wrapper around RssControlPanel component
- Header integration
- Container layout

### Current State
Functional wrapper component that delegates to RssControlPanel for full functionality.

---

## 9. Admin Dashboard
**Route:** `/admin`  
**Component:** `AdminDashboard.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Comprehensive administrative interface for managing database, API status, and system operations.

### Key Features
- **Overview Tab:**
  - Database tables status
  - Record counts per table
  - Latest data dates
  - Quick stats cards:
    - Total players
    - Total teams
    - Football fixtures
    - Next scheduled update
- **API Status Tab:**
  - API endpoint monitoring
  - Response time tracking
  - Status indicators
- **Export Tab:**
  - Data export functionality
  - Multiple format support
  - Table selection
- **Meta Agent Tab:**
  - AI agent management
  - System automation controls

### Technical Details
- Real-time database status monitoring
- Update status tracking
- Sync log management
- date-fns for time formatting
- Query-based data fetching
- Tab-based navigation

### Current State
Production-ready admin interface with comprehensive database and system monitoring capabilities.

---

## 10. Database Status
**Route:** `/database-status`  
**Component:** `DatabaseStatus.tsx`  
**Status:** ✅ Fully Functional

### Purpose
View detailed database statistics, data availability, and update information.

### Key Features
- **Data Source Alert:**
  - Live API vs. historical data indicator
  - API rate limit notifications
- **Database Statistics:**
  - Table-by-table record counts
  - Latest update timestamps
  - Data quality metrics
  - Missing data indicators
- **Visual Indicators:**
  - Color-coded badges for data status
  - Icons for different data types
- **Data Operations:**
  - Manual data refresh options
  - AI-powered data enrichment
  - Data validation tools
- **Player and Team Stats:**
  - Total players in database
  - Total teams tracked
  - Season coverage
  - Competition coverage

### Technical Details
- Query-based data fetching
- Skeleton loading states
- Badge color coding based on data quality
- formatDistanceToNow for relative timestamps
- Link integration to Meta Agent for AI operations

### Current State
Fully functional database monitoring tool with clear data status visualization and actionable insights.

---

## 11. Data Audit
**Route:** `/data-audit`  
**Component:** `DataAudit.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Audit database integrity and fix data quality issues.

### Key Features
- **Summary Statistics:**
  - Total players count
  - Total player stats count
  - Duplicate players count
  - Missing player ID count
  - Missing photos count
  - Orphaned stats count
- **Issue Detection:**
  - **Duplicate Players:** Players with identical names
  - **Missing Player IDs:** Stats without proper player linkage
  - **Missing Photos:** Players without profile images
  - **Orphaned Stats:** Statistics without associated players
- **Data Fixing Tools:**
  - Fix photos mutation (update player images)
  - Clean player IDs mutation (resolve ID conflicts)
  - Season-specific or global operations
  - Progress tracking
  - Error handling
- **Issue Display:**
  - Tabular data presentation
  - Record details (ID, name, player ID)
  - Action buttons for fixing issues
  - Test IDs for automated testing

### Technical Details
- React Query for data fetching
- Mutation hooks for fix operations
- Toast notifications for user feedback
- Table components for data display
- Refresh functionality
- Loading and error states

### Current State
Production-ready data quality tool with comprehensive issue detection and automated fixing capabilities.

---

## 12. Data Import/Export
**Route:** `/data-admin`  
**Component:** `DataImportExport.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Manage file uploads, data exports, and import history.

### Key Features
- **Import Files Section:**
  - File type icons (PDF, CSV, XLSX, DOCX, HTML, Images, Web)
  - Supported formats display
  - Drag-and-drop or browse upload
  - Target table selection
- **Export Data Section:**
  - Table selection dropdown
  - Format selection (JSON, CSV, XLSX)
  - Export button
  - Quick export for common tables
- **Import/Export History:**
  - Sortable table with:
    - Operation ID
    - Filename
    - File type
    - Operation type (import/export)
    - Target table
    - Status (pending, processing, completed, failed)
    - Records count
    - Date created
  - Status badges with color coding
  - Error message display for failed operations
  - Automatic sorting by date (newest first)

### Technical Details
- File type validation
- Status badge configuration
- Icon selection based on file type
- React Query for data management
- date-fns for time formatting
- Table sorting logic

### Current State
Fully functional import/export manager with comprehensive history tracking and status monitoring.

---

## 13. Meta Agent Dashboard
**Route:** `/meta-agent`  
**Component:** `MetaAgentDashboard.tsx`  
**Status:** ✅ Fully Functional

### Purpose
AI-powered system health monitoring and intelligent task management.

### Key Features
- **System Health Overview:**
  - Database status integration
  - Total records count
  - API status monitoring
  - Cache status display
- **AI Chat Interface:**
  - Natural language interaction
  - Quick action badges:
    - "System Health" query
    - "Show Liverpool's upcoming fixtures"
    - "Analyze Mohamed Salah's performance"
  - Message history display
  - Processing indicators
- **Agent Capabilities:**
  - System health checks
  - Database query assistance
  - Player performance analysis
  - Fixture information
  - Automated task management
- **System Performance Metrics:**
  - API status badge
  - Cache status indicator
  - Performance tracking
- **Integration Points:**
  - Links to Database Status page
  - Access to system-wide data
  - AI-powered recommendations

### Technical Details
- React Query for real-time data
- Message state management
- Loading/processing states
- Badge system for quick actions
- ScrollArea for chat display
- Database integration

### Current State
Production-ready AI dashboard with intelligent system monitoring and natural language interaction capabilities.

---

## 14. Templates
**Route:** `/templates`  
**Component:** `Templates.tsx`  
**Status:** ✅ Fully Functional (Wrapper Component)

### Purpose
Manage content templates for consistent formatting and styling.

### Key Features
- Template management interface
- Template creation and editing
- Template library access

### Technical Details
- Simple wrapper around TemplateManager component
- Liverpool FC branded styling
- Header integration
- Backdrop blur effects

### Current State
Functional wrapper component delegating to TemplateManager for full template management capabilities.

---

## 15. Overlay Template Builder
**Route:** `/overlay-templates`  
**Component:** `OverlayTemplateBuilder.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Create and customize overlay templates for broadcast graphics with visual styling tools.

### Key Features
- **Template Design Tools:**
  - Color palette (Liverpool FC colors)
  - Typography controls
  - Layout configuration
  - Opacity and positioning
- **Overlay Types:**
  - Fixtures overlay
  - League table overlay
  - Player stats overlay
  - RSS ticker overlay
  - Custom overlays
- **Preview System:**
  - Live preview of overlays
  - Size configuration
  - Real-time updates
- **Template Management:**
  - Save templates
  - Load templates
  - Copy templates
  - Delete templates
  - Download templates
  - Upload templates
- **Styling Options:**
  - Background colors
  - Text colors
  - Border styles
  - Animation effects
  - Font selection

### Technical Details
- React Query for template persistence
- Mutation hooks for CRUD operations
- Toast notifications
- Color picker integration
- Slider controls for sizing
- Switch toggles for features
- Tab-based interface

### Current State
Production-ready overlay template builder with comprehensive styling and management capabilities.

---

## 16. Overlay Test Page
**Route:** `/overlay-test`  
**Component:** `OverlayTestPage.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Test and preview different overlay types with configurable parameters.

### Key Features
- **Overlay Selection:**
  - Upcoming Fixtures
  - League Table
  - Player Stats
  - Player Comparison
  - RSS Ticker
  - RSS Sentiment
  - Head-to-Head (H2H)
- **Size Configuration:**
  - Width adjustment (default 960px)
  - Height adjustment (default 540px)
  - Custom dimensions
- **Live Preview:**
  - Real-time overlay rendering
  - Error boundary protection
  - Responsive display
- **Overlay Parameters:**
  - Fixture count (for fixtures overlay)
  - League ID and season (for table overlay)
  - Team ID, season, sort options (for player stats)
  - Player IDs (for player comparison)
  - Configuration for each overlay type

### Technical Details
- useMemo for performance optimization
- Error boundary integration
- Component switching logic
- State management for size/selection
- Individual overlay component imports

### Current State
Fully functional testing page for all overlay types with live preview and configuration options.

---

## 17. Analytics Dashboard
**Route:** `/analytics`  
**Component:** `AnalyticsDashboard.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Comprehensive analytics and insights visualization for system performance and content metrics.

### Key Features
- **Performance Metrics:**
  - Trending indicators (up/down/stable)
  - Progress bars for goals
  - Badge displays for status
- **Data Visualization:**
  - Line charts for trends
  - Bar charts for comparisons
  - Area charts for cumulative data
  - Recharts integration
- **Key Metrics Cards:**
  - Total activity
  - User engagement
  - Content performance
  - System health
- **Interactive Elements:**
  - Refresh functionality
  - Download reports
  - Date range selection
  - Metric filtering
- **Alert System:**
  - Performance alerts
  - Anomaly detection
  - Status notifications

### Technical Details
- Recharts for data visualization
- React Query for data fetching
- useState for metric filtering
- useEffect for data updates
- Skeleton loading states
- Dialog modals for details

### Current State
Production-ready analytics dashboard with comprehensive visualization and interactive data exploration capabilities.

---

## 18. Video Editor
**Route:** `/video-editor`  
**Component:** `VideoEditor.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Advanced video editing and recording management system.

### Key Features
- **Recording Management:**
  - RecordingsLibrary component integration
  - Upload recordings
  - Browse recordings library
- **AI-Powered Features:**
  - Smart scene detection
  - Auto-highlight generation
  - Quality assessment
  - Style recommendations
- **Video Editing Tools:**
  - Trim and cut
  - Transitions
  - Effects and filters
  - Audio mixing
- **Workflow Management:**
  - Project organization
  - Export options
  - Format selection
- **Progress Tracking:**
  - Processing status
  - Export progress
  - Quality indicators

### Technical Details
- React Query for data management
- Mutation hooks for operations
- Progress component integration
- Switch toggles for features
- Select components for options
- Badge system for status
- Dialog modals for operations

### Current State
Production-ready video editor with AI-powered features and comprehensive recording management.

---

## 19. Team Forms List
**Route:** `/teams-forms`  
**Component:** `TeamFormsList.tsx`  
**Status:** ✅ Fully Functional

### Purpose
Display current form for all teams in a league with visual indicators.

### Key Features
- **Team Form Display:**
  - Grid layout of teams
  - Form indicators (W/D/L)
  - Color-coded results:
    - Green for wins
    - Yellow for draws
    - Red for losses
  - Recent form (last 5 matches)
- **Season and League Info:**
  - Season display (e.g., 2025)
  - League ID indication (e.g., 39 for Premier League)
  - Total teams count
- **Team Cards:**
  - Team name
  - Team logo
  - Form string
  - Visual badges for each result

### Technical Details
- React Query for data fetching
- Loading states with Loader2 animation
- Error handling and display
- Color coding function for results
- Responsive grid layout
- Card-based UI

### Current State
Fully functional team form viewer with clear visual representation of recent performance across all teams.

---

## Application Architecture

### Technology Stack
- **Frontend:** React with TypeScript
- **Routing:** Wouter
- **State Management:** React Query (TanStack Query)
- **UI Components:** Custom components built with Radix UI primitives
- **Styling:** Tailwind CSS with custom Liverpool FC theming
- **Charts:** Recharts for data visualization
- **Forms:** React Hook Form with Zod validation
- **Date Handling:** date-fns
- **Icons:** Lucide React

### Common Patterns
1. **Data Fetching:** React Query with queryKeys and caching strategies
2. **Mutations:** useMutation hooks for data updates
3. **Loading States:** Skeleton components and loading indicators
4. **Error Handling:** Try-catch blocks with toast notifications
5. **Responsive Design:** Mobile-first approach with Tailwind breakpoints
6. **Theme:** Consistent Liverpool FC color palette (#C8102E red, #1B365D navy)

### Context Providers
- **QueryClientProvider** - React Query state management
- **TooltipProvider** - Tooltip functionality
- **PiPProvider** - Picture-in-Picture state
- **CameraStreamProvider** - Camera stream management

---

## Summary

The ContentCurator-2 application is a comprehensive content creation and management platform specifically designed for Liverpool FC analysis and broadcast production. It features 19 distinct pages covering:

- **Content Creation:** Frameworks, Templates, Video Editor
- **Live Production:** Live Presentation, Overlay systems
- **Data Management:** Database Status, Data Audit, Import/Export
- **Analytics:** Team Matchup Studio, Analytics Dashboard, Team Forms
- **Content Organization:** Content Library, RSS Intelligence
- **Administration:** Admin Dashboard, Meta Agent Dashboard

All pages are production-ready with:
- ✅ Responsive design
- ✅ Liverpool FC branding
- ✅ Comprehensive error handling
- ✅ Optimized performance
- ✅ Real-time data integration
- ✅ Professional UI/UX

The application successfully integrates football data, AI capabilities, RSS feeds, and broadcast control into a unified platform for professional content creation.
