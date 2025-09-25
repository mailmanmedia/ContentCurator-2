# Mailman Media Visual Assistant App - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern content creation platforms like Canva, Figma, and Notion, combined with sports analytics tools like StatsBomb and FBRef. The design prioritizes visual creativity tools while maintaining professional data presentation standards.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Navy (Primary): #002147 - Main backgrounds, headers, primary actions
- Red (Brand): #C8102E - Accent elements, CTAs, brand highlights  
- Cream: #F5F1E9 - Text, light backgrounds, contrast elements
- Accent Blue: #4CA9E0 - Secondary actions, data highlights, links

**Dark Mode Implementation:**
- Primary backgrounds: Navy variations (210 100% 14%)
- Secondary backgrounds: Navy lighter (210 85% 18%)
- Text: Cream variations for hierarchy
- Interactive elements: Red and Accent Blue maintained

### B. Typography
**Primary Font Stack:**
- **League Spartan**: Headlines, section titles, ALL CAPS treatments (Bold/Black weights)
- **Libre Franklin**: Body text, descriptions, form labels (Regular/Semibold)
- **JetBrains Mono**: Code snippets, data values, technical displays

**Hierarchy:**
- Hero Headlines: League Spartan Bold, 3.5rem+
- Section Headers: League Spartan Bold, 2.5rem, ALL CAPS
- Body Text: Libre Franklin Regular, 1rem
- Data Labels: Libre Franklin Semibold, 0.875rem

### C. Layout System
**Tailwind Spacing Primitives:**
- Primary spacing units: 4, 8, 12, 16 (p-4, m-8, h-12, w-16)
- Component spacing: 6, 10, 14 for fine-tuned layouts
- Section spacing: 20, 24, 32 for major content blocks

**Grid Structure:**
- Main container: max-width-7xl with responsive padding
- Dashboard grid: 12-column responsive system
- Content cards: 4-column grid on desktop, stacked on mobile

### D. Component Library

**Navigation:**
- Top navigation bar with Mailman Media logo (left)
- Icon-based tool selection (center): Templates, Analytics, Export
- User actions and settings (right)
- Sidebar for template categories and recent projects

**Content Creation Tools:**
- Canvas workspace with zoom/pan controls
- Template selector with preview thumbnails
- Property panel for text, colors, and data binding
- Layer management for complex compositions

**Data Displays:**
- Statistical cards with large numbers and context
- Progress bars and confidence meters
- Team/player comparison tables
- Interactive charts (bar, line, heatmap)

**Forms & Inputs:**
- Search bars for player/team data with autocomplete
- Date range selectors for historical analysis
- Toggle switches for data sources and display options
- Color pickers maintaining brand compliance

**Overlays:**
- Modal dialogs for export settings and sharing
- Tooltip overlays for data explanations
- Progress indicators for data fetching and rendering

### E. Visual Content Templates

**Template Categories:**
1. **Mailman Monday**: Bold typography, contrarian alerts, red accent highlights
2. **Data Dive Wednesday**: Chart-heavy layouts, green data visualization theme
3. **Future Focus Friday**: Prediction layouts, purple mystical gradient themes

**Template Structure:**
- Header area: Logo watermark, episode branding
- Hero section: Main headline with supporting data
- Content grid: Flexible layout for stats, charts, analysis
- Footer: Call-to-action and social proof elements

**Export Specifications:**
- YouTube-optimized dimensions (1920x1080, 1280x720)
- High contrast for mobile viewing
- Brand watermark placement (bottom-right)
- Text legibility at thumbnail sizes

## Images
- **Hero Section**: No large hero image required - focus on workspace canvas and template previews
- **Template Thumbnails**: Grid of branded template previews showing Mailman Monday, Data Dive Wednesday, and Future Focus Friday styles
- **Logo Integration**: Mailman Media logo prominently displayed in navigation and as watermark option
- **Data Visualizations**: Generated charts, graphs, and infographics as primary visual content

## Accessibility & Performance
- Consistent dark mode across all components including forms
- High contrast ratios maintained between Navy backgrounds and Cream text
- Keyboard navigation for all creation tools
- Progressive loading for large datasets and template libraries
- Responsive design optimized for content creation workflow