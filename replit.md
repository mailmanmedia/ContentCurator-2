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