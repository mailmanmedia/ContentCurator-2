# Mailman Media - The Production Post

## Overview
The Production Post is Mailman Media's content creation platform designed for in-depth Liverpool FC YouTube channel analysis and visual content generation. It provides AI-powered tools and branded templates to produce YouTube-ready assets such as thumbnails, infographics, statistical charts, and analytical dashboards. The platform combines data-driven insights with professional visual design to support soccer analytics, transfer analysis, and story visualization, aiming to revolutionize sports content creation with data-rich, visually appealing narratives for a global audience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The application is a React-based Single Page Application (SPA) using TypeScript and Vite. It leverages `shadcn/ui` components (built on Radix UI) with a dark-first, Liverpool FC-inspired color palette, styled using Tailwind CSS and Google Fonts. React Query manages server state. Key UI components include `VisualAssistant`, `LivePresentation`, `PromptStudio`, `TemplateCard`, and `DataChart`, with global navigation handled by `Header` and `ContentTabs`.

### Backend
An Express.js server, written in TypeScript, provides RESTful API endpoints with middleware for logging, JSON parsing, and error handling.

### Database
Drizzle ORM is used with a PostgreSQL database (Neon Database), featuring a schema for user management and Zod for validation. Drizzle Kit handles database migrations. Persistent storage for football fixtures and RSS feeds is implemented.

### System Design Choices

#### Live Presentation System
A professional broadcast control system for multi-camera live productions, featuring real-time scene composition, graphics overlays, and a program/preview workflow. It utilizes Server-Sent Events (SSE) for state synchronization and canvas-based rendering. Key features include:
- **Content Upload System**: Supports images, HTML artifacts, code snippets, and external links with smart category management, tag deduplication, and automatic cache invalidation.
- **Branded Banner/Lower Third Template System**: Professional news-show style graphics with template management UI, CRUD operations, categories (lower-third, banner, full-screen, ticker), brand variants (e.g., Mailman Monday), and customizable styling based on Liverpool FC colors.
- **RSS Ticker Control Panel**: Comprehensive RSS feed management with ticker settings (speed, colors, font size, mode), live preview, source management, and persistence via API.
- **Dropdown-Based Source Selection**: Streamlined camera and screen share source selection with Mailman Media branding, dynamic source creation, drag-and-drop reordering, and individual source controls.
- **Professional Overlay System (Oct 2025)**: Advanced broadcast-quality overlay layer system supporting three overlay types: text, image, and RSS feed tickers. Features include:
  - **Text Overlays**: Dynamic font size control (12-72px), bold/italic styling, font family selection (League Spartan, Libre Franklin, JetBrains Mono, Arial, Georgia), scroll speed (1-100), directional scrolling (left/right/up/down), Liverpool FC template presets (Breaking News, Live Updates, Match Info).
  - **Image Overlays**: File upload with base64 conversion, library image picker with grid display, auto-sizing with aspect ratio preservation, image caching for performance, support for both uploaded and library images.
  - **RSS Feed Tickers**: Multi-source RSS headline display, configurable article limit (1-20), optional source name display, formatted ticker with bullet separators ("SOURCE: Headline • SOURCE: Headline"), integration with RSS Intelligence filtering.
  - **Position Conflict Detection**: Prevents multiple overlays in same position with warning alerts, position badges (Top/Bottom) in Active Overlays panel, disabled button state when conflicts exist, allows editing existing overlays.
  - **VideoCompositor Rendering**: Type-safe rendering for all overlay types, image auto-sizing with contain mode, RSS ticker with cached queries and formatRssTicker optimization, seamless scrolling animations.
- **iOS Camera Detection & Text Customization (Oct 2025)**: Enhanced overlay system with comprehensive controls and iOS device support via `getUserMedia()` permission flow before device enumeration, enabling iPad Pro, iPhone, and Continuity Camera detection.
- **Output Dimension Controls**: Manages resolution (Full HD, 2K, 4K), global fit modes (Contain, Cover, Fill), and per-source fit mode overrides, with canvas dimensions updating based on selected resolution.
- **Responsive Output System**: Dynamic grid layout calculation in `VideoCompositor` that auto-adapts based on active source count (e.g., 1 source = full canvas, 2 sources = 2x1, 3-4 sources = 2x2), with proper aspect ratio rendering.

#### Navigation System
A global header provides consistent, responsive navigation.

#### Real-Time Statistics
The homepage displays live database counts for various content types fetched from a dedicated API endpoint.

#### Football Data Integration
The system integrates 2025-26 season football data, including team rosters and Champions League participants. It prioritizes database-first fetching for fixtures to mitigate API rate limits.
- **Liverpool FC Official Calendar Integration**: Fetches live fixture data from Liverpool FC's official iCalendar feed, parses over 600 fixtures, includes 10-minute caching, and provides robust error handling.
- **Team Badge System**: Integrates 100+ team badges with robust name normalization and a multi-tier lookup strategy (static mapping → database fallback → graceful degradation) covering various leagues and competitions.
- **Automatic Statistics Update System**: A production-ready cron scheduler updates Liverpool FC statistics daily and post-match, utilizing a `teamSeasonStatistics` database table for idempotent upserts and Drizzle ORM's `onConflictDoUpdate` for atomic updates.

#### Team Matchup Studio
Offers comprehensive team analysis for YouTube content, including performance statistics dashboards, interactive charts (Recharts with Liverpool FC palette), squad roster analysis, and AI-powered tactical analysis.

#### RSS Intelligence System (Oct 2025)
A comprehensive RSS feed management and analysis platform for monitoring Liverpool FC news and media coverage. The system provides:
- **Database Schema**: PostgreSQL tables for `rssSources`, `rssArticles`, `rssAnalysis`, and `rssComparisons` with full Drizzle ORM integration.
- **Feed Management**: CRUD operations for RSS sources with category support (official, fan_site, media, podcast), update frequency configuration, and active/inactive status controls.
- **Automated Fetching**: RssService class handles feed parsing using `rss-parser`, duplicate detection via content hashing and GUIDs, sentiment analysis, and error tracking with retry logic.
- **Advanced Filtering (Oct 2025)**: Enhanced RSS Intelligence page with comprehensive filtering controls:
  - **Keyword Filter**: Search articles by title, description, or keywords with case-insensitive matching
  - **Source Filter**: Multi-select dropdown to filter by specific RSS sources
  - **Date Range Filter**: Start and end date pickers using shadcn Calendar component for temporal filtering
  - **Filter Status**: Visual badges showing active filters with individual remove buttons and clear all functionality
  - **Enhanced Display**: Articles show source names, formatted published dates (using date-fns), keyword badges, and external links
- **Dashboard Analytics**: Real-time statistics showing total sources, active sources, total articles, articles this week, and source health metrics.
- **Live Presentation Integration**: RSS ticker overlays display scrolling headlines with configurable source selection, article limits, and optional source name display.

#### Advanced Visual Presentation System (Claude Artifact Pattern)
Generates broadcast-quality visual content following Claude's artifact creation pattern, featuring a 5-tab navigation, metric cards with glassmorphism effects, progress bars, and a CSS Grid-based football pitch visualization. Styling adheres strictly to Liverpool FC brand colors using pure Tailwind CSS, with a robust security architecture.

#### Creative Visual Enhancement System
Integrated animation and visual effects for engaging user experiences while maintaining broadcast standards. All animations use GPU-accelerated CSS transforms. Key effects include shimmer for loading, pulse glows, broadcast pulse for "ON AIR" badges, 3D card transforms on hover, spring animations, slide animations, and stagger delays. Enhancements are applied across components like the Homepage, Live Presentation, and Team Matchup Studio, with a focus on performance and accessibility.

## External Dependencies

### AI Integration
- **OpenAI GPT-4**: For content suggestions, creative generation, and AI-powered tactical analysis.

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

### Content Creation Tools
- **React Hook Form**: Form state management.
- **date-fns**: Date manipulation.
- **class-variance-authority**: Dynamic styling system.