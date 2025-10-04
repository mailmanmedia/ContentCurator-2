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

#### Navigation System
A global header provides consistent, responsive navigation across all pages.

#### Real-Time Statistics
The homepage displays live database counts for various content types, fetched from a `/api/statistics` endpoint.

#### Football Data Integration
The system integrates 2025-26 season football data, including team rosters and Champions League participants, for accurate content creation. Database-first fetching is implemented for upcoming and head-to-head fixtures to enhance resilience against API rate limits.

#### Team Matchup Studio
This feature offers a comprehensive team analysis system for YouTube content creation, including performance statistics dashboards, interactive performance charts (using Recharts with Liverpool FC palette), squad roster analysis, and AI-powered tactical analysis (using OpenAI's GPT-4o-mini).

#### Advanced Visual Presentation System (Claude Artifact Pattern)
This system generates broadcast-quality visual content following Claude's artifact creation pattern. It features a 5-tab navigation system, metric cards with glassmorphism effects, progress bars, and a CSS Grid-based football pitch visualization. Styling strictly adheres to Liverpool FC brand colors and uses pure Tailwind CSS. Security architecture includes event delegation, class-based styling, content sanitization, and CSP headers for XSS protection and iframe compatibility.

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