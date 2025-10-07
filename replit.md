# Mailman Media - The Production Post

## Overview
The Production Post is Mailman Media's content creation platform for in-depth Liverpool FC YouTube channel analysis and visual content generation. It provides AI-powered tools and branded templates to produce YouTube-ready assets like thumbnails, infographics, statistical charts, and analytical dashboards. The platform combines data-driven insights with professional visual design to revolutionize sports content creation with data-rich, visually appealing narratives for a global audience, focusing on soccer analytics, transfer analysis, and story visualization.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The application is a React-based Single Page Application (SPA) using TypeScript and Vite. It utilizes `shadcn/ui` components (built on Radix UI) with a dark-first, Liverpool FC-inspired color palette, styled using Tailwind CSS and Google Fonts. React Query manages server state.

### Backend
An Express.js server, written in TypeScript, provides RESTful API endpoints with middleware for logging, JSON parsing, and error handling.

### Database
Drizzle ORM is used with a PostgreSQL database (Neon Database), featuring a schema for user management and Zod for validation. Drizzle Kit handles database migrations. Persistent storage for football fixtures and RSS feeds is implemented.

### System Design Choices

#### Live Presentation System
A professional broadcast control system for multi-camera live productions with real-time scene composition, graphics overlays, and a program/preview workflow. It uses Server-Sent Events (SSE) for state synchronization and canvas-based rendering. Key features include:
- **Content Management**: Supports various media types (images, HTML, code snippets) with smart categorization and caching.
- **Branded Graphics**: Professional news-show style banners and lower thirds with customizable templates based on Liverpool FC branding.
- **RSS Ticker**: Comprehensive RSS feed management with customizable ticker settings, live preview, and source persistence.
- **Source Selection**: Streamlined camera and screen share source selection with dynamic creation and reordering.
- **Professional Overlay System**: Advanced broadcast-quality overlay layer system supporting text, image, and RSS feed tickers with dynamic controls (font size, scrolling, positioning, presets) and conflict detection.
- **iOS Camera Support**: Enhanced overlay system with iOS device integration via `getUserMedia()`.
- **Output Controls**: Manages resolution (Full HD, 2K, 4K) and global/per-source fit modes.
- **Responsive Output**: Dynamic grid layout calculation for active sources with proper aspect ratio rendering.
- **Video Recording & Export**: Professional recording capabilities using MediaRecorder API with intelligent codec fallback, comprehensive controls (start/stop/pause/resume), real-time timer, and WebM export compatible with editing software.
- **Unified Recording System**: All broadcast recordings are automatically saved to the PostgreSQL database and appear across three integrated locations: Live Presentation (Broadcast Recordings card with last 5 recordings), Content Library (Recordings filter), and Video Editor (Recordings Library). All features use the same `/api/recordings` endpoint for consistent access to recording metadata (filename, duration, size, resolution, format, creation date).

#### AI-Powered Video Editing System
A comprehensive video editing platform for transforming raw broadcast recordings into polished YouTube-ready content.
- **Core Infrastructure**: FFmpeg for video processing (scene/silence detection, metadata, thumbnails), Redis-backed Bull Queue for async background rendering, and PostgreSQL for metadata storage.
- **Video Analysis Engine**: FFmpeg-based scene and silence detection, metadata extraction, and thumbnail generation.
- **Automated Editing**: Auto-cut system combining scene/silence detection with pacing rules, engagement-based pacing optimizer, and pre-configured intro/outro templates with Liverpool FC branding.
- **Timeline Editor UI**: Visual timeline with playback controls, clip visualization, trim controls, drag-and-drop reordering, split operations, and synchronized video preview.
- **Professional Enhancement Tools**: Color grading system with LUT library and manual adjustments, and audio enhancement pipeline (noise reduction, dynamic compression, EQ, loudness normalization).
- **Render Queue & Export**: Background rendering via Bull Queue with real-time progress tracking, quality presets (YouTube 1080p, Shorts, Twitter), MP4/WebM export, and direct download management.

#### Navigation System
A global header provides consistent, responsive navigation.

#### Real-Time Statistics
The homepage displays live database counts for various content types fetched from a dedicated API endpoint.

#### Football Data Integration
Integrates 2025-26 season football data, including team rosters and Champions League participants, prioritizing database-first fetching for fixtures.
- **Liverpool FC Official Calendar**: Fetches and parses live fixture data from the official iCalendar feed with caching and error handling.
- **Team Badge System**: Integrates 100+ team badges with robust name normalization and a multi-tier lookup strategy.
- **Automatic Statistics Update**: Production-ready cron scheduler for daily and post-match updates of Liverpool FC statistics using `teamSeasonStatistics` table and Drizzle ORM's `onConflictDoUpdate`.

#### Team Matchup Studio
Offers comprehensive team analysis for YouTube content, including performance statistics dashboards, interactive charts, squad roster analysis, and AI-powered tactical analysis.
- **Historical Head-to-Head Database**: Database-backed matchup data from 2020-present with intelligent, competition-specific update scheduling and a database-first approach with API fallback.

#### RSS Intelligence System
A comprehensive RSS feed management and analysis platform for monitoring Liverpool FC news and media coverage.
- **Database Schema**: PostgreSQL tables for `rssSources`, `rssArticles`, `rssAnalysis`, and `rssComparisons`.
- **Feed Management**: CRUD operations for RSS sources with category support, update frequency, and status controls.
- **Automated Fetching**: Handles feed parsing, duplicate detection, sentiment analysis, and error tracking with retry logic.
- **Advanced Filtering**: Comprehensive filtering controls by keyword, source, and date range, with visual badges for active filters.
- **Dashboard Analytics**: Real-time statistics on sources and articles, plus source health metrics.
- **Live Presentation Integration**: Provides RSS ticker overlays with configurable source selection and article limits.

#### Advanced Visual Presentation System
Generates broadcast-quality visual content following Claude's artifact creation pattern, featuring 5-tab navigation, metric cards with glassmorphism effects, progress bars, and a CSS Grid-based football pitch visualization, all adhering to Liverpool FC brand colors using pure Tailwind CSS.

#### Creative Visual Enhancement System
Integrated animation and visual effects using GPU-accelerated CSS transforms for engaging user experiences while maintaining broadcast standards. Effects include shimmer, pulse glows, broadcast pulse, 3D card transforms, spring animations, slide animations, and stagger delays, focused on performance and accessibility.

#### AI-Powered Framework System
A comprehensive framework management system for creating and executing analytical content templates with integrated AI capabilities.
- **Document-to-Framework Adaptation**: AI (Claude or OpenAI) converts uploaded PDF/Word documents into structured frameworks, extracting sections, metrics, and analytical queries.
- **API Capabilities Configuration**: Frameworks can access multiple APIs: PostgreSQL database, Perplexity API, Claude API, OpenAI API, and Football APIs.
- **Framework Executor Service**: Runtime execution engine provides secure API access during framework execution.
- **Document Parsing**: Supports PDF and Word document parsing for text extraction and AI structural analysis.
- **Storage Architecture**: Document processing and AI adaptation occur on Replit; frameworks are stored in the database with API configurations and metadata.
- **Version Management**: Complete version control system for frameworks with changelog tracking and download counts.
- **UI Integration**: Features AI-powered document upload with provider selection, category assignment, and real-time processing status.

## External Dependencies

### AI Integration
- **OpenAI GPT-4**: Content suggestions, creative generation, AI-powered tactical analysis.
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
- **FFmpeg**: Video and audio processing, scene detection, color grading, audio enhancement.
- **fluent-ffmpeg**: Node.js wrapper for FFmpeg.
- **Bull**: Redis-based job queue for background rendering and async tasks.
- **ioredis**: Redis client for Bull Queue integration.