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
Includes an advanced data filtering system for metric overlays (competition, season, match limits, venue), an advanced styling system (typography, gradients, borders, shadows), and new overlay types such as Upcoming Fixtures, Player Comparison, and an Enhanced RSS Ticker with sentiment analysis.

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