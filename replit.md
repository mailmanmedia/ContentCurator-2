# Mailman Media Visual Assistant

## Overview
The Mailman Media Visual Assistant is a content creation platform focused on Liverpool FC YouTube channel analysis and visual content generation. It provides AI-powered tools and branded templates to generate YouTube-ready content, including thumbnails, infographics, statistical charts, and analytical dashboards, by combining data-driven insights with professional visual design. The platform aims to support soccer analytics, transfer analysis, and story visualization.

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

#### Advanced Visual Presentation System
The claudeArtifact presentation renderer generates broadcast-quality visual content with sophisticated CSS techniques:
- **CSS Custom Properties System**: Centralized color gradients, glassmorphism effects, and shadow definitions for consistent, professional styling across all components.
- **Glassmorphism Cards**: Backdrop-filter blur effects with semi-transparent backgrounds create modern, layered depth for metric displays and content sections.
- **Neon Countdown Timer**: Live JavaScript-powered countdown with pulsing border animations and real-time updates via setInterval, featuring days/hours/minutes/seconds display.
- **Interactive Storyline Cards**: Hover-activated transform effects on tactical analysis cards with rating badges, confidence scores, and visual metrics.
- **Formation Pitch Visualization**: CSS Grid-based football pitch with 11 positioned player markers, green gradient background, and tactical annotations.
- **Advanced Progress Bars**: Animated width transitions with shimmer effects via CSS keyframes, displaying team performance metrics with Liverpool FC color theming.
- **Security Architecture**: All user content sanitized with escapeHtml() before rendering. CSP headers allow inline scripts/styles for visual features while maintaining protection. Iframe-compatible (no X-Frame-Options) for safe embedding.

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