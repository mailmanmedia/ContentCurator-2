# Mailman Media - The Production Post

## Overview
The Production Post is Mailman Media's content creation platform designed for in-depth Liverpool FC YouTube channel analysis and visual content generation. It offers AI-powered tools and branded templates to produce YouTube-ready assets such as thumbnails, infographics, statistical charts, and analytical dashboards. The platform combines data-driven insights with professional visual design to revolutionize sports content creation, focusing on data-rich, visually appealing narratives for a global audience interested in soccer analytics, transfer analysis, and story visualization.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The application is a React-based Single Page Application (SPA) using TypeScript and Vite. It leverages `shadcn/ui` components (built on Radix UI) with a dark-first, Liverpool FC-inspired color palette, styled using Tailwind CSS and Google Fonts. React Query is used for server state management.

### Backend
An Express.js server, written in TypeScript, provides RESTful API endpoints with middleware for logging, JSON parsing, and error handling.

### Database
Drizzle ORM is used with a PostgreSQL database (Neon Database) and Zod for validation. Drizzle Kit handles database migrations. Persistent storage for football fixtures and RSS feeds is implemented.

### System Design Choices

#### Live Presentation System
A professional broadcast control system for multi-camera live productions with real-time scene composition, graphics overlays, and a program/preview workflow. It uses Server-Sent Events (SSE) for state synchronization and canvas-based rendering. Key features include:
- **Content Management**: Supports various media types with smart categorization and caching.
- **Branded Graphics**: Professional news-show style banners and lower thirds with customizable Liverpool FC-branded templates.
- **RSS Ticker**: Comprehensive RSS feed management with customizable ticker settings and live preview.
- **Professional Overlay System**: Advanced broadcast-quality overlay layer system supporting text, image, and RSS feed tickers with dynamic controls and conflict detection.
- **Mailman Media Color Palettes**: Four branded color schemes (Classic LFC red/white, Navy Professional blue/white, Cream Elegant beige/brown, Dark Mode black/white) for consistent branding.
- **Smart Positioning Grid**: Enhanced position editor with snap-to-grid functionality and boundary constraints.
- **Video Recording & Export**: Professional recording capabilities using MediaRecorder API with codec fallback, controls, and WebM export. All recordings are saved to PostgreSQL and accessible across Live Presentation, Content Library, and Video Editor.

#### AI-Powered Video Editing System
A comprehensive video editing platform for transforming broadcast recordings into polished YouTube-ready content.
- **Core Infrastructure**: FFmpeg for video processing (scene/silence detection, metadata, thumbnails), Redis-backed Bull Queue for async background rendering, and PostgreSQL for metadata storage.
- **Automated Editing**: Auto-cut system combining scene/silence detection with pacing rules, an engagement-based pacing optimizer, and pre-configured intro/outro templates.
- **Timeline Editor UI**: Visual timeline with playback controls, clip visualization, trim, drag-and-drop reordering, split operations, and synchronized video preview.
- **Professional Enhancement Tools**: Color grading system with LUT library and manual adjustments, and an audio enhancement pipeline.
- **Render Queue & Export**: Background rendering via Bull Queue with real-time progress tracking, quality presets, and MP4/WebM export.

#### Football Data Integration
Integrates football data from multiple live sources with **dynamic season handling** that automatically includes current and future seasons without code changes.

**Dynamic Season Management:**
- **Auto-Season Detection**: System automatically detects and includes seasons from 2020 to current year
- **Smart Season Calculation**: Football calendar-aware (Aug-May), uses July 1st cutoff for preseason/qualifiers
- **Automatic Updates**: Historical bootstrap recalculates season range on each run to handle year rollovers
- **API Integration**: Fetches available seasons from API Football `/leagues/seasons` endpoint with fallback logic
- **No Hardcoded Years**: All season ranges calculated dynamically - works for 2025, 2026, and beyond

**Data Sources:**
- **Liverpool FC Official Calendar**: Fetches and parses live fixture data from the official iCalendar feed with caching and error handling.
- **Team Badge System**: Integrates 100+ team badges with robust name normalization and a multi-tier lookup strategy.
- **Automatic Statistics Update**: Production-ready cron scheduler (Wed/Sat at 3 AM) for twice-weekly updates of Liverpool FC statistics.
- **The Fishy Integration**: Real-time Premier League table scraping from thefishy.co.uk providing current standings, form (last 6 games), points, and league positions.
- **FBRef Integration**: Comprehensive statistics from fbref.com including detailed player stats (goals, assists, minutes, cards), team statistics, and advanced analytics.
- **Multi-Source Data Enrichment**: Combined endpoints merge data from The Fishy and FBRef for most accurate and complete football statistics.
- **Team Matchup Studio**: Comprehensive team analysis from a historical Head-to-Head database (2020-present).
- **Centralized Data Management**: Production-ready data integration layer with centralized `footballDataService.ts` providing **authenticated 4-source fallback chain** (API Football Pro Plan → The Fishy → FBRef → localStorage cache). **NO AI-generated or synthetic data**—all statistics are authentic from verified API endpoints only. All overlay components use unified React hooks (`useFootballData.ts`) with runtime Zod validation, automatic error recovery, and consistent UI states. Features React error boundaries, loading/error/empty state components, source attribution badges showing data origin and freshness timestamps, and localStorage caching for offline resilience. If all 4 sources fail, overlays display error states instead of fallback data.

**Data Freshness & Accuracy:**
- **Timestamp Tracking**: All data fetches record last_updated timestamps in database
- **Admin Dashboard**: Displays "Latest data from: [timestamp]" showing most recent data across all tables
- **Real-time Status**: Tables show earliest/latest dates with color-coded freshness indicators (green=up to date, yellow=needs update, red=stale)
- **Manual Refresh**: Admin dashboard provides manual update buttons for immediate data refresh
- **Scheduled Updates**: Automatic twice-weekly updates (Wednesday and Saturday at 3 AM) for all football data

#### RSS Intelligence System
A comprehensive RSS feed management and analysis platform for monitoring Liverpool FC news and media coverage. Features a PostgreSQL database schema, automated fetching with sentiment analysis, advanced filtering, and dashboard analytics. Integrated with Live Presentation for RSS ticker overlays.

#### Advanced Visual Presentation System
Generates broadcast-quality visual content following Claude's artifact creation pattern, featuring 5-tab navigation, metric cards with glassmorphism effects, progress bars, and a CSS Grid-based football pitch visualization, adhering to Liverpool FC brand colors using pure Tailwind CSS.

#### Creative Visual Enhancement System
Integrates animation and visual effects using GPU-accelerated CSS transforms for engaging user experiences while maintaining broadcast standards.

#### AI-Powered Framework System
A comprehensive framework management system for creating and executing analytical content templates with integrated AI capabilities.
- **Document-to-Framework Adaptation**: AI (Claude or OpenAI) converts PDF/Word documents into structured frameworks.
- **API Capabilities Configuration**: Frameworks can access PostgreSQL, Perplexity API, Claude API, OpenAI API, and Football APIs.
- **Framework Executor Service**: Runtime execution engine provides secure API access during framework execution.
- **Storage Architecture**: Document processing and AI adaptation occur on Replit; frameworks are stored in the database.
- **Version Management**: Complete version control system for frameworks with changelog tracking.
- **UI Integration**: Features AI-powered document upload with provider selection and real-time processing status.

#### Overlay Customization Enhancements
- **Advanced Data Filtering System**: Competition, season, match limit, and venue filtering for metric overlays. Enhanced team and match selection with date range filters.
- **Advanced Styling System**: Extensive typography controls (font weight, letter spacing, line height, text transform), linear and radial gradient systems, and border/shadow/glow effects.
- **New Overlay Types**: Upcoming Fixtures (iCal integration, countdowns), Player Comparison (Side-by-Side, Radar Chart, Comparison Bars with dynamic player/stat selection), Enhanced RSS Ticker (sentiment-based color coding, topic/keyword filters, credibility tiers).
- **RSS Intelligence & Analytics**: Backend sentiment analysis and a dedicated RSS Sentiment Dashboard Overlay (circular score badge, breakdown visualization, trending topics, keywords cloud).

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

### Content Creation Tools
- **React Hook Form**: Form state management.
- **date-fns**: Date manipulation.
- **class-variance-authority**: Dynamic styling system.
- **pdf-parse**: PDF document text extraction.
- **officeparser**: Word document text extraction.

### Video Processing & Job Queue
- **FFmpeg**: Video and audio processing.
- **fluent-ffmpeg**: Node.js wrapper for FFmpeg.
- **Bull**: Redis-based job queue.
- **ioredis**: Redis client for Bull Queue.