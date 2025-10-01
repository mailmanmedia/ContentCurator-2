# Mailman Media Visual Assistant

## Overview

The Mailman Media Visual Assistant is a specialized content creation platform designed for Liverpool FC YouTube channel analysis and visual content generation. The application enables soccer analytics, transfer analysis, and story visualization through AI-powered tools and branded template systems. It combines data-driven insights with professional visual design to produce YouTube-ready content including thumbnails, infographics, statistical charts, and analytical dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a React-based Single Page Application (SPA) architecture with TypeScript and Vite as the build tool. The UI is built with shadcn/ui components providing a consistent design system based on Radix UI primitives. The application implements a dark-first design approach with custom CSS variables for theming, featuring a Liverpool FC-inspired color palette (Navy #002147, Red #C8102E, Cream #F5F1E9, Accent Blue #4CA9E0).

### Component Structure
The frontend follows a modular component architecture with specialized components for different content types:
- **VisualAssistant**: Main orchestration component managing the overall application state and navigation
- **LivePresentation**: Real-time broadcast control system for managing live presentations with Server-Sent Events
- **PromptStudio**: AI-powered content generation interface for creating visual content from text prompts
- **TemplateCard/DataChart**: Reusable components for displaying and managing template-based content
- **ImageManager**: Asset management system for organizing and categorizing visual resources
- **ExportPanel**: Output configuration and file generation management
- **Header**: Global navigation component providing consistent access to all major features across pages
- **ContentTabs**: Shared navigation tabs component for AI Studio, Images, Tactical Analysis, Templates, Analytics, and Export features

### Styling and Design System
The application uses Tailwind CSS with custom configuration extending the base design system. Typography is managed through Google Fonts integration (League Spartan for headlines, Libre Franklin for body text, JetBrains Mono for code/data displays). The design follows the "New York" shadcn/ui style variant with custom border radius and spacing modifications.

### State Management
The application uses React Query (@tanstack/react-query) for server state management and API integration. Local component state is managed through React hooks with centralized query configuration for consistent error handling and caching strategies.

### Backend Architecture
Express.js server implementation with TypeScript providing RESTful API endpoints. The server includes middleware for request logging, JSON parsing, and error handling. The architecture supports both development (with Vite middleware) and production deployment configurations.

### Database Integration
Drizzle ORM with PostgreSQL database configuration, using Neon Database as the serverless PostgreSQL provider. The schema includes user management tables with UUID primary keys and includes Zod validation schemas for type safety. Database migrations are managed through Drizzle Kit.

## Key Features

### Live Presentation System
Real-time broadcast control interface for managing live presentations:
- **Server-Sent Events (SSE)**: Real-time updates via /api/live/stream endpoint
- **Program & Preview Management**: Dual-display system for controlling live output and preparing next scenes
- **Presentation Sets**: Organized collections of scenes for different broadcast types
- **Live Controls**: Take to program, toggle ticker, banner management with real-time state synchronization
- **Event Logging**: Comprehensive logging of all live control actions and state changes

### Navigation System
- **Global Header**: Consistent navigation bar present on all pages with icon-based buttons for major features
- **Responsive Design**: Desktop icon navigation and mobile menu drawer for optimal experience on all devices
- **Active State Indicators**: Visual feedback showing current page location
- **Feature Access**: Home, Framework Directory, RSS Intelligence, Team Matchup Studio, Content Library, and Live Presentation

### Real-Time Statistics
- Homepage displays live database counts instead of placeholder data
- Statistics include: Total Content, Frameworks, Images, and News Articles
- Data fetched from /api/statistics endpoint using React Query

### Football Data Integration
- **Current Season**: 2025-26 season data (updated September 30, 2025)
- **Team Rosters**: Comprehensive fallback data for all major competitions reflecting current season participants
- **Champions League**: All 36 teams in 2025-26 league phase including Galatasaray, Napoli, Villarreal, Ajax, and all 6 English clubs
- **Data Accuracy**: Fallback team data updated to match current season rosters ensuring content creation uses accurate, real team information
- **API Integration**: RapidAPI Football API with smart caching and fallback system for rate limit resilience

### Team Matchup Studio - Advanced Stats & Squad Analysis
Comprehensive team analysis system combining real-time statistics, squad information, and AI-powered insights for creating compelling YouTube content:

**Performance Statistics Dashboard**
- **Key Metrics Display**: Form guide (e.g., "WWDWL"), goals scored/conceded, clean sheets, win rate percentage
- **Real-Time Data**: Statistics fetched from Football API with 15-minute cache TTL
- **Competition Context**: Stats filtered by selected competition and 2025-26 season
- **Visual Presentation**: Performance metrics displayed in organized card layout with icons

**Interactive Performance Charts**
- **Recharts Integration**: Bar charts visualizing team performance across multiple dimensions
- **Data Points**: Goals scored, goals conceded, clean sheets, yellow cards, red cards
- **Visual Design**: Charts styled with Liverpool FC color palette using shadcn ChartContainer
- **Responsive Layout**: Charts adapt to different screen sizes and data ranges

**Squad Roster Analysis**
- **Position-Based Organization**: Players grouped by Goalkeeper, Defender, Midfielder, Attacker
- **Player Details**: Name, squad number, age, player photo
- **Real-Time Data**: Squad information fetched from Football API with smart caching
- **Visual Cards**: Clean player card design with profile images and key stats

**AI-Powered Tactical Analysis**
- **OpenAI Integration**: GPT-4o-mini model generates Liverpool-focused narrative analysis
- **Context-Aware Prompts**: Analysis tailored based on whether analyzing Liverpool (celebratory) or opponents (tactical exploitation)
- **Generated Content**:
  - **Narrative**: 2-3 sentence compelling story about team performance
  - **Key Insights**: Bullet points highlighting statistical trends and patterns
  - **Tactical Recommendations**: Strategic suggestions for Liverpool's approach
  - **Confidence Score**: AI-generated confidence rating (0-100%)
- **Fallback System**: Graceful degradation when OpenAI unavailable or rate limits hit
- **User-Triggered**: Analysis generated on-demand via "Generate Insights" button

**Technical Implementation**
- **Backend Endpoints**:
  - `GET /api/football/teams/:teamId/statistics?leagueId=X&season=2025` - Team performance stats
  - `GET /api/football/teams/:teamId/squad?season=2025` - Squad roster with player details
  - `POST /api/football/teams/:teamId/analyze` - AI analysis generation from statistics
- **Smart Caching**: Multi-layer caching system (in-memory + database) to minimize API calls and handle rate limits
- **Liverpool FC Context**: Team ID 40 flagged for Liverpool-specific analysis tone and recommendations
- **Error Handling**: Comprehensive error handling with fallback data for API failures
- **Data Validation**: Zod schemas validate API responses and request bodies

**Content Creation Workflow**
1. Select competition (Premier League, Champions League, FA Cup, etc.)
2. Select team for analysis
3. View comprehensive statistics and performance trends
4. Review squad roster organized by position
5. Generate AI-powered insights with tactical recommendations
6. Use analysis for YouTube video scripts, thumbnails, and tactical breakdowns

This feature transforms raw football statistics into engaging, Liverpool-focused narrative content suitable for YouTube video creation, combining quantitative data analysis with AI-generated storytelling.

## External Dependencies

### AI Integration
- **OpenAI GPT-4**: Primary AI engine for content suggestions and creative generation, integrated through the official OpenAI SDK for generating Liverpool FC-focused content recommendations and variations

### Database and Storage
- **Neon Database**: Serverless PostgreSQL provider for data persistence
- **Drizzle ORM**: Type-safe database queries with automatic migration management
- **Drizzle Kit**: Database schema management and migration tooling

### UI Framework and Components
- **Radix UI**: Comprehensive component primitives for accessibility and interaction patterns
- **shadcn/ui**: Pre-built component library built on Radix UI with consistent styling
- **Tailwind CSS**: Utility-first CSS framework with custom configuration for brand colors and spacing
- **Lucide Icons**: Consistent icon library for UI elements

### Development and Build Tools
- **Vite**: Fast development server and build tool with React plugin support
- **TypeScript**: Type safety across frontend and backend with shared type definitions
- **ESBuild**: Fast bundling for production server builds
- **React Query**: Server state management with caching and synchronization

### Content Creation Tools
- **React Hook Form**: Form state management with validation for content creation workflows
- **date-fns**: Date manipulation and formatting for content scheduling and analytics
- **class-variance-authority**: Dynamic styling system for component variants