export interface OverlayTemplate {
  id: string;
  name: string;
  description: string;
  category: 'match' | 'stats' | 'analytics' | 'social';
  overlayType: 'text' | 'image' | 'rss' | 'video' | 'metric';
  width: number;
  height: number;
  position: 'top' | 'bottom';
  zIndex: number;
  opacity: number;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  animationType: 'scroll' | 'fade' | 'static';
  scrollSpeed?: number;
  scrollDirection?: 'left' | 'right' | 'up' | 'down';
  isBold: boolean;
  isItalic: boolean;
  metricType?: string;
  templateStyle: 'ticker' | 'banner' | 'corner';
}

export const overlayTemplates: Record<string, OverlayTemplate> = {
  'match-card': {
    id: 'match-card',
    name: 'Match Card (H2H)',
    description: 'Head-to-head stats with team logos and score prediction',
    category: 'match',
    overlayType: 'metric',
    width: 35,
    height: 220,
    position: 'top',
    zIndex: 100,
    opacity: 0.95,
    backgroundColor: '#002147',
    textColor: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'League Spartan',
    animationType: 'fade',
    isBold: true,
    isItalic: false,
    metricType: 'h2h-card',
    templateStyle: 'banner',
  },
  
  'form-guide': {
    id: 'form-guide',
    name: 'Form Guide',
    description: 'Last 5 matches with win/loss/draw color coding',
    category: 'match',
    overlayType: 'metric',
    width: 30,
    height: 120,
    position: 'top',
    zIndex: 150,
    opacity: 0.9,
    backgroundColor: '#C8102E',
    textColor: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'League Spartan',
    animationType: 'static',
    isBold: true,
    isItalic: false,
    metricType: 'form-guide',
    templateStyle: 'corner',
  },
  
  'player-stat-card': {
    id: 'player-stat-card',
    name: 'Player Stat Card',
    description: 'Goals per 90, assists, and rating display',
    category: 'stats',
    overlayType: 'metric',
    width: 28,
    height: 180,
    position: 'bottom',
    zIndex: 120,
    opacity: 0.92,
    backgroundColor: '#F6EB61',
    textColor: '#002147',
    fontSize: 18,
    fontFamily: 'League Spartan',
    animationType: 'fade',
    isBold: true,
    isItalic: false,
    metricType: 'player-stats',
    templateStyle: 'banner',
  },
  
  'league-position': {
    id: 'league-position',
    name: 'League Position Chart',
    description: 'Current league standings visualization',
    category: 'stats',
    overlayType: 'metric',
    width: 40,
    height: 450,
    position: 'top',
    zIndex: 110,
    opacity: 0.88,
    backgroundColor: '#002147',
    textColor: '#F6EB61',
    fontSize: 14,
    fontFamily: 'League Spartan',
    animationType: 'static',
    isBold: false,
    isItalic: false,
    metricType: 'league-table',
    templateStyle: 'banner',
  },

  'upcoming-fixtures': {
    id: 'upcoming-fixtures',
    name: 'Upcoming Fixtures',
    description: 'Next matches with dates, venues, and countdown',
    category: 'match',
    overlayType: 'metric',
    width: 35,
    height: 280,
    position: 'bottom',
    zIndex: 130,
    opacity: 0.9,
    backgroundColor: '#002147',
    textColor: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'League Spartan',
    animationType: 'static',
    isBold: true,
    isItalic: false,
    metricType: 'upcoming-fixtures',
    templateStyle: 'banner',
  },
  
  'metric-ticker': {
    id: 'metric-ticker',
    name: 'Metric Ticker',
    description: 'Scrolling live analytics and statistics',
    category: 'analytics',
    overlayType: 'metric',
    width: 100,
    height: 60,
    position: 'bottom',
    zIndex: 200,
    opacity: 0.85,
    backgroundColor: '#C8102E',
    textColor: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'League Spartan',
    animationType: 'scroll',
    scrollSpeed: 45,
    scrollDirection: 'left',
    isBold: true,
    isItalic: false,
    metricType: 'live-metrics',
    templateStyle: 'ticker',
  },

  'video-overlay-pip': {
    id: 'video-overlay-pip',
    name: 'Video Picture-in-Picture',
    description: 'Small video overlay for replay or secondary footage',
    category: 'match',
    overlayType: 'video',
    width: 25,
    height: 140,
    position: 'top',
    zIndex: 300,
    opacity: 1,
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'League Spartan',
    animationType: 'static',
    isBold: false,
    isItalic: false,
    templateStyle: 'corner',
  },

  'breaking-news-narrow': {
    id: 'breaking-news-narrow',
    name: 'Breaking News (Narrow)',
    description: 'Narrow ticker for urgent updates',
    category: 'social',
    overlayType: 'text',
    width: 60,
    height: 50,
    position: 'bottom',
    zIndex: 180,
    opacity: 0.95,
    backgroundColor: '#C8102E',
    textColor: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'League Spartan',
    animationType: 'scroll',
    scrollSpeed: 55,
    scrollDirection: 'left',
    isBold: true,
    isItalic: false,
    templateStyle: 'ticker',
  },

  'match-score-corner': {
    id: 'match-score-corner',
    name: 'Match Score Corner',
    description: 'Compact score display in corner',
    category: 'match',
    overlayType: 'metric',
    width: 20,
    height: 80,
    position: 'top',
    zIndex: 250,
    opacity: 0.9,
    backgroundColor: '#F6EB61',
    textColor: '#002147',
    fontSize: 24,
    fontFamily: 'League Spartan',
    animationType: 'static',
    isBold: true,
    isItalic: false,
    metricType: 'live-score',
    templateStyle: 'corner',
  },

  'rss-sentiment': {
    id: 'rss-sentiment',
    name: 'RSS Sentiment Analysis',
    description: 'Media sentiment, trending topics, and coverage intensity',
    category: 'analytics',
    overlayType: 'metric',
    width: 35,
    height: 240,
    position: 'top',
    zIndex: 140,
    opacity: 0.9,
    backgroundColor: '#002147',
    textColor: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'League Spartan',
    animationType: 'fade',
    isBold: true,
    isItalic: false,
    metricType: 'rss-sentiment',
    templateStyle: 'banner',
  },
};

export const getTemplatesByCategory = (category: string) => {
  return Object.values(overlayTemplates).filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
  return overlayTemplates[id];
};

export const getAllTemplateCategories = () => {
  return Array.from(new Set(Object.values(overlayTemplates).map(t => t.category)));
};
