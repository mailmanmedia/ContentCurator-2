# Mailman Media - The Production Post

## Overview
The Production Post is Mailman Media's content creation platform for in-depth Liverpool FC YouTube channel analysis and visual content generation. It provides AI-powered tools and branded templates to produce YouTube-ready assets like thumbnails, infographics, statistical charts, and analytical dashboards. The platform combines data-driven insights with professional visual design to support soccer analytics, transfer analysis, and story visualization. Its ambition is to revolutionize sports content creation by enabling data-rich, visually appealing narratives for a global audience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is a React-based Single Page Application (SPA) using TypeScript and Vite. It leverages shadcn/ui components (built on Radix UI) with a dark-first, Liverpool FC-inspired color palette. Tailwind CSS provides styling, complemented by Google Fonts (League Spartan, Libre Franklin, JetBrains Mono). React Query manages server state and API interactions. The UI includes components like `VisualAssistant`, `LivePresentation`, `PromptStudio`, `TemplateCard`, and `DataChart`, with global navigation managed by `Header` and `ContentTabs`.

### Backend Architecture
An Express.js server in TypeScript provides RESTful API endpoints, incorporating middleware for logging, JSON parsing, and error handling.

### Database Integration
Drizzle ORM is used with a PostgreSQL database (Neon Database). The schema includes user management, and Zod handles validation. Drizzle Kit is used for database migrations. Persistent storage for football fixtures has been implemented to reduce API dependencies. The RSS system requires migration from in-memory storage to database-backed storage for persistence.

### System Design Choices

#### Live Presentation System
A professional broadcast control system for multi-camera live productions, featuring real-time scene composition, graphics overlays, and a program/preview workflow. It uses Server-Sent Events (SSE) for state synchronization, canvas-based rendering for video composition, and supports camera integration via MediaStream API. Key components include `VideoSourceManager`, `QuickSourceControls`, `QuickLibraryControls`, `LibraryItemPicker`, `ContentLibraryBrowser`, and `SceneLayerEditor`. It includes an OBS-style production studio with a visual drag-and-drop scene editor, RSS news ticker layer, and OBS Browser Source endpoints. Scene templates (e.g., Pre-Match Analysis, Live Commentary) are Liverpool FC branded and emoji-free.

**Content Upload System (Oct 2025)**: Comprehensive library upload dialog supporting 4 content types - images (with automatic thumbnail generation), HTML artifacts (Claude artifacts/templates), code snippets, and external links. Features smart category management with preset dropdowns (General, Graphics, Overlays, Templates, Artifacts, Lower Thirds, Tickers, Backgrounds) plus "Other (Custom)" option for user-defined categories. Includes tag deduplication (case-insensitive), optional descriptions/thumbnails, and automatic cache invalidation. Content stored in flexible JSON structure (metaJson) for HTML/code, with proper URL handling for images/links.

#### Navigation System
A global header provides consistent, responsive navigation across all pages.

#### Real-Time Statistics
The homepage displays live database counts for various content types, fetched from a `/api/statistics` endpoint.

#### Football Data Integration
The system integrates 2025-26 season football data, including team rosters and Champions League participants, for accurate content creation. Database-first fetching is implemented for upcoming and head-to-head fixtures to enhance resilience against API rate limits.

**Liverpool FC Official Calendar Integration (Oct 2025)**: The platform now fetches live fixture data from Liverpool FC's official iCalendar feed (https://ics.fixtur.es/v2/liverpool.ics) using the node-ical library. The iCalService parses 600+ fixtures across all competitions, implements 10-minute caching to reduce external requests, and provides robust error handling (returns 503 when data unavailable instead of empty arrays). Currently displays 37 upcoming fixtures including Liverpool vs Manchester United (Oct 19, 2025). The integration automatically updates with official schedule changes and prevents "TBD" values in the UI.

**Team Badge System (Oct 2025)**: Comprehensive team badge integration with 100+ team mappings and robust name normalization. The system strips scores "(2-1)", competition tags "[CL]", and club suffixes "FC" to ensure accurate matching. Multi-tier lookup strategy: static mapping → database fallback → graceful degradation. Covers Premier League (20 teams), Champions League (50+ European teams), and Championship/cup opponents (30+ teams). All team badges display correctly with proper IDs and logo URLs, handling variations like "Liverpool [CL]", "Brentford FC", "Man United".

#### Team Matchup Studio
This feature offers a comprehensive team analysis system for YouTube content creation, including performance statistics dashboards, interactive performance charts (using Recharts with Liverpool FC palette), squad roster analysis, and AI-powered tactical analysis (using OpenAI's GPT-4o-mini).

#### Advanced Visual Presentation System (Claude Artifact Pattern)
This system generates broadcast-quality visual content following Claude's artifact creation pattern. It features a 5-tab navigation system, metric cards with glassmorphism effects, progress bars, and a CSS Grid-based football pitch visualization. Styling strictly adheres to Liverpool FC brand colors and uses pure Tailwind CSS. Security architecture includes event delegation, class-based styling, content sanitization, and CSP headers for XSS protection and iframe compatibility.

#### Creative Visual Enhancement System (Oct 2025)
A comprehensive animation and visual effects system integrated across the platform for modern, engaging user experiences while maintaining professional broadcast standards. All animations use GPU-accelerated CSS transforms for optimal performance.

**Animation Utilities (index.css)**:
- **Shimmer Effect**: Gradient sweep animation for loading states with Liverpool red branding (`animate-shimmer`)
- **Pulse Glow**: Breathing scale + opacity effect for live indicators (`animate-pulse-glow`)
- **Broadcast Pulse**: Box-shadow glow animation for ON AIR badges (`animate-broadcast`)
- **3D Card Transform**: Perspective tilt effect on hover for feature cards (`card-3d`)
- **Spring Animations**: Bounce entrance effects with cubic-bezier easing (`animate-spring`)
- **Slide Animations**: Fade + slide entrance effects (`animate-slide-up`)
- **Stagger Delays**: Coordinated animation timing (`.stagger-1` through `.stagger-6`)
- **Glassmorphism**: Enhanced backdrop blur effects (`.glass-strong`)

**Component Enhancements**:
- **Homepage (VisualAssistant)**: 3D tilt cards, static stat displays (accessibility-first, no value flash)
- **Live Presentation**: Pulsing live badge with Radio icon, animated ON AIR broadcast badge with dot indicator
- **Team Matchup Studio**: Smooth bar chart animations (1.2s duration, ease-out easing) via Recharts
- **Loading States**: Shimmer skeleton with Liverpool red gradient wave effect

**Performance & Accessibility**:
- All animations use GPU-accelerated transforms (translate, scale, opacity)
- No layout thrashing or reflow-inducing properties
- Reduced-motion support available in utility hooks
- Professional subtlety maintained across all effects

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