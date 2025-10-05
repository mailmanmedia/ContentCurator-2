import { 
  type User, type InsertUser, 
  type Image, type InsertImage,
  type PresentationStyle, type InsertPresentationStyle,
  type Report, type InsertReport,
  type ReportRendering, type InsertReportRendering,
  type FrameworkCategory, type InsertFrameworkCategory,
  type Framework, type InsertFramework,
  type FrameworkVersion, type InsertFrameworkVersion,
  type RssSource, type InsertRssSource,
  type RssArticle, type InsertRssArticle,
  type RssAnalysis, type InsertRssAnalysis,
  type RssComparison, type InsertRssComparison,
  type LibraryItem, type InsertLibraryItem,
  type Scene, type InsertScene,
  type PresentationSet, type InsertPresentationSet,
  type TickerPlaylist, type InsertTickerPlaylist,
  type VideoSource, type InsertVideoSource,
  type SourceTemplate, type InsertSourceTemplate,
  type SetTemplate, type InsertSetTemplate,
  type SourceNamePreset, type InsertSourceNamePreset,
  type LiveState,
  videoSources as videoSourcesTable,
  scenes as scenesTable,
  presentationSets as presentationSetsTable
} from "@shared/schema";
import { randomUUID } from "crypto";
import { footballService } from "./football/footballService";
import { db } from "./db";
import { eq, desc, ilike, or } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Image methods
  getImages(): Promise<Image[]>;
  getImage(id: string): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined>;
  deleteImage(id: string): Promise<boolean>;
  getImagesByCategory(category: string): Promise<Image[]>;
  searchImages(query: string): Promise<Image[]>;

  // Presentation Style methods
  getPresentationStyles(): Promise<PresentationStyle[]>;
  getPresentationStyle(id: string): Promise<PresentationStyle | undefined>;
  getPresentationStyleByKey(key: string): Promise<PresentationStyle | undefined>;
  createPresentationStyle(style: InsertPresentationStyle): Promise<PresentationStyle>;
  updatePresentationStyle(id: string, updates: Partial<InsertPresentationStyle>): Promise<PresentationStyle | undefined>;

  // Report methods
  getReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, updates: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: string): Promise<boolean>;

  // Report Rendering methods
  getReportRenderings(reportId: string): Promise<ReportRendering[]>;
  getReportRendering(reportId: string, styleKey: string): Promise<ReportRendering | undefined>;
  createReportRendering(rendering: InsertReportRendering): Promise<ReportRendering>;
  deleteReportRenderings(reportId: string): Promise<boolean>;

  // Framework Category methods
  getFrameworkCategories(): Promise<FrameworkCategory[]>;
  getFrameworkCategory(id: string): Promise<FrameworkCategory | undefined>;
  createFrameworkCategory(category: InsertFrameworkCategory): Promise<FrameworkCategory>;
  updateFrameworkCategory(id: string, updates: Partial<InsertFrameworkCategory>): Promise<FrameworkCategory | undefined>;
  deleteFrameworkCategory(id: string): Promise<boolean>;

  // Framework methods
  getFrameworks(): Promise<Framework[]>;
  getFramework(id: string): Promise<Framework | undefined>;
  getFrameworksByCategory(categoryId: string): Promise<Framework[]>;
  createFramework(framework: InsertFramework): Promise<Framework>;
  updateFramework(id: string, updates: Partial<InsertFramework>): Promise<Framework | undefined>;
  deleteFramework(id: string): Promise<boolean>;
  searchFrameworks(query: string): Promise<Framework[]>;

  // Framework Version methods
  getFrameworkVersions(frameworkId: string): Promise<FrameworkVersion[]>;
  getFrameworkVersion(id: string): Promise<FrameworkVersion | undefined>;
  getCurrentFrameworkVersion(frameworkId: string): Promise<FrameworkVersion | undefined>;
  createFrameworkVersion(version: InsertFrameworkVersion): Promise<FrameworkVersion>;
  updateFrameworkVersion(id: string, updates: Partial<InsertFrameworkVersion>): Promise<FrameworkVersion | undefined>;
  deleteFrameworkVersion(id: string): Promise<boolean>;

  // RSS Source methods
  getRssSources(): Promise<RssSource[]>;
  getRssSource(id: string): Promise<RssSource | undefined>;
  getRssSourceByUrl(feedUrl: string): Promise<RssSource | undefined>;
  getActiveRssSources(): Promise<RssSource[]>;
  getRssSourcesByCategory(category: string): Promise<RssSource[]>;
  createRssSource(source: InsertRssSource): Promise<RssSource>;
  updateRssSource(id: string, updates: Partial<InsertRssSource>): Promise<RssSource | undefined>;
  deleteRssSource(id: string): Promise<boolean>;

  // RSS Article methods
  getRssArticles(): Promise<RssArticle[]>;
  getRssArticle(id: string): Promise<RssArticle | undefined>;
  getRssArticlesBySource(sourceId: string): Promise<RssArticle[]>;
  getRssArticleByGuid(guid: string): Promise<RssArticle | undefined>;
  getRssArticleByContentHash(contentHash: string): Promise<RssArticle | undefined>;
  getRecentRssArticles(limit?: number): Promise<RssArticle[]>;
  getRssArticlesByDateRange(startDate: Date, endDate: Date): Promise<RssArticle[]>;
  searchRssArticles(query: string): Promise<RssArticle[]>;
  createRssArticle(article: InsertRssArticle): Promise<RssArticle>;
  updateRssArticle(id: string, updates: Partial<InsertRssArticle>): Promise<RssArticle | undefined>;
  deleteRssArticle(id: string): Promise<boolean>;

  // RSS Analysis methods
  getRssAnalyses(): Promise<RssAnalysis[]>;
  getRssAnalysis(id: string): Promise<RssAnalysis | undefined>;
  getRssAnalysesByArticle(articleId: string): Promise<RssAnalysis[]>;
  getRssAnalysesByType(analysisType: string): Promise<RssAnalysis[]>;
  createRssAnalysis(analysis: InsertRssAnalysis): Promise<RssAnalysis>;
  updateRssAnalysis(id: string, updates: Partial<InsertRssAnalysis>): Promise<RssAnalysis | undefined>;
  deleteRssAnalysis(id: string): Promise<boolean>;

  // RSS Comparison methods
  getRssComparisons(): Promise<RssComparison[]>;
  getRssComparison(id: string): Promise<RssComparison | undefined>;
  getRssComparisonsByType(comparisonType: string): Promise<RssComparison[]>;
  getPublicRssComparisons(): Promise<RssComparison[]>;
  createRssComparison(comparison: InsertRssComparison): Promise<RssComparison>;
  updateRssComparison(id: string, updates: Partial<InsertRssComparison>): Promise<RssComparison | undefined>;
  deleteRssComparison(id: string): Promise<boolean>;

  // Football methods (delegated to footballService)
  getFootballCompetitions(): Promise<any[]>;
  getFootballTeamsByCompetition(competitionId: number): Promise<any[]>;
  getFootballHeadToHead(homeTeamId: number, awayTeamId: number): Promise<any[]>;
  getFootballTeamStatistics(teamId: number, leagueId: number, season: number): Promise<any>;
  getFootballTeamSquad(teamId: number, season: number): Promise<any[]>;
  getLiverpoolUpcomingFixtures(limit: number): Promise<any[]>;
  initializeFootballData(): Promise<void>;

  // Library Item methods
  getLibraryItems(): Promise<LibraryItem[]>;
  getLibraryItem(id: string): Promise<LibraryItem | undefined>;
  getLibraryItemsByType(type: string): Promise<LibraryItem[]>;
  getLibraryItemsByCategory(category: string): Promise<LibraryItem[]>;
  searchLibraryItems(query: string): Promise<LibraryItem[]>;
  createLibraryItem(item: InsertLibraryItem): Promise<LibraryItem>;
  updateLibraryItem(id: string, updates: Partial<InsertLibraryItem>): Promise<LibraryItem | undefined>;
  deleteLibraryItem(id: string): Promise<boolean>;

  // Scene methods
  getScenes(): Promise<Scene[]>;
  getScene(id: string): Promise<Scene | undefined>;
  getScenesByLayout(layout: string): Promise<Scene[]>;
  getSceneTemplates(): Promise<Scene[]>;
  searchScenes(query: string): Promise<Scene[]>;
  createScene(scene: InsertScene): Promise<Scene>;
  updateScene(id: string, updates: Partial<InsertScene>): Promise<Scene | undefined>;
  deleteScene(id: string): Promise<boolean>;
  duplicateScene(id: string): Promise<Scene | undefined>;

  // Presentation Set methods
  getPresentationSets(): Promise<PresentationSet[]>;
  getPresentationSet(id: string): Promise<PresentationSet | undefined>;
  getActivePresentationSets(): Promise<PresentationSet[]>;
  createPresentationSet(set: InsertPresentationSet): Promise<PresentationSet>;
  updatePresentationSet(id: string, updates: Partial<InsertPresentationSet>): Promise<PresentationSet | undefined>;
  deletePresentationSet(id: string): Promise<boolean>;

  // Ticker Playlist methods
  getTickerPlaylists(): Promise<TickerPlaylist[]>;
  getTickerPlaylist(id: string): Promise<TickerPlaylist | undefined>;
  getActiveTickerPlaylists(): Promise<TickerPlaylist[]>;
  createTickerPlaylist(playlist: InsertTickerPlaylist): Promise<TickerPlaylist>;
  updateTickerPlaylist(id: string, updates: Partial<InsertTickerPlaylist>): Promise<TickerPlaylist | undefined>;
  deleteTickerPlaylist(id: string): Promise<boolean>;

  // Video Source methods
  getVideoSources(): Promise<VideoSource[]>;
  getVideoSource(id: string): Promise<VideoSource | undefined>;
  createVideoSource(source: InsertVideoSource): Promise<VideoSource>;
  updateVideoSource(id: string, updates: Partial<InsertVideoSource>): Promise<VideoSource | undefined>;
  deleteVideoSource(id: string): Promise<boolean>;

  // Source Template methods
  getSourceTemplates(): Promise<SourceTemplate[]>;
  getSourceTemplate(id: string): Promise<SourceTemplate | undefined>;
  getSourceTemplatesByType(sourceType: string): Promise<SourceTemplate[]>;
  getDefaultSourceTemplates(): Promise<SourceTemplate[]>;
  createSourceTemplate(template: InsertSourceTemplate): Promise<SourceTemplate>;
  updateSourceTemplate(id: string, updates: Partial<InsertSourceTemplate>): Promise<SourceTemplate | undefined>;
  deleteSourceTemplate(id: string): Promise<boolean>;

  // Set Template methods
  getSetTemplates(): Promise<SetTemplate[]>;
  getSetTemplate(id: string): Promise<SetTemplate | undefined>;
  getDefaultSetTemplates(): Promise<SetTemplate[]>;
  createSetTemplate(template: InsertSetTemplate): Promise<SetTemplate>;
  updateSetTemplate(id: string, updates: Partial<InsertSetTemplate>): Promise<SetTemplate | undefined>;
  deleteSetTemplate(id: string): Promise<boolean>;

  // Source Name Preset methods
  getSourceNamePresets(): Promise<SourceNamePreset[]>;
  getSourceNamePreset(id: string): Promise<SourceNamePreset | undefined>;
  getSourceNamePresetsByCategory(category: string): Promise<SourceNamePreset[]>;
  createSourceNamePreset(preset: InsertSourceNamePreset): Promise<SourceNamePreset>;
  incrementSourceNameUsage(id: string): Promise<void>;
  deleteSourceNamePreset(id: string): Promise<boolean>;

  // Live State methods (in-memory only)
  getLiveState(): Promise<LiveState>;
  updateLiveState(updates: Partial<LiveState>): Promise<LiveState>;

  // Statistics methods
  getStatistics(): Promise<{
    totalContent: number;
    frameworks: number;
    images: number;
    rssArticles: number;
    libraryItems: number;
    scenes: number;
    presentationSets: number;
    tickerPlaylists: number;
    reports: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private images: Map<string, Image>;
  private presentationStyles: Map<string, PresentationStyle>;
  private reports: Map<string, Report>;
  private reportRenderings: Map<string, ReportRendering>;
  private frameworkCategories: Map<string, FrameworkCategory>;
  private frameworks: Map<string, Framework>;
  private frameworkVersions: Map<string, FrameworkVersion>;
  private rssSources: Map<string, RssSource>;
  private rssArticles: Map<string, RssArticle>;
  private rssAnalyses: Map<string, RssAnalysis>;
  private rssComparisons: Map<string, RssComparison>;
  private libraryItems: Map<string, LibraryItem>;
  private scenes: Map<string, Scene>;
  private presentationSets: Map<string, PresentationSet>;
  private tickerPlaylists: Map<string, TickerPlaylist>;
  private videoSources: Map<string, VideoSource>;
  private sourceTemplates: Map<string, SourceTemplate>;
  private setTemplates: Map<string, SetTemplate>;
  private sourceNamePresets: Map<string, SourceNamePreset>;
  private liveState: LiveState;

  constructor() {
    this.users = new Map();
    this.images = new Map();
    this.presentationStyles = new Map();
    this.reports = new Map();
    this.reportRenderings = new Map();
    this.frameworkCategories = new Map();
    this.frameworks = new Map();
    this.frameworkVersions = new Map();
    this.rssSources = new Map();
    this.rssArticles = new Map();
    this.rssAnalyses = new Map();
    this.rssComparisons = new Map();
    this.libraryItems = new Map();
    this.scenes = new Map();
    this.presentationSets = new Map();
    this.tickerPlaylists = new Map();
    this.videoSources = new Map();
    this.sourceTemplates = new Map();
    this.setTemplates = new Map();
    this.sourceNamePresets = new Map();
    this.liveState = {
      currentSetId: null,
      programSceneId: null,
      previewSceneId: null,
      tickerOn: false,
      tickerPlaylistId: null,
      bannerOn: false,
      bannerText: '',
      bannerConfig: {},
      transitionDuration: 500,
      transitionEffect: 'fade',
      activeVideoSources: {},
      lastUpdate: new Date()
    };
    
    // Add some sample data
    this.seedData();
  }

  private async seedData() {
    // Seed presentation styles
    const presentationStyles: InsertPresentationStyle[] = [
      {
        key: "claudeArtifact",
        name: "Claude Artifact Style",
        description: "Interactive modular components with metrics, progress bars, and tactical displays",
        configJson: {
          showMetrics: true,
          showFormations: true,
          allowInteractions: true,
          colorScheme: "liverpool"
        },
        isActive: true
      },
      {
        key: "analystBrief",
        name: "Analyst Brief",
        description: "Professional executive summary with data tables and recommendations",
        configJson: {
          twoColumn: true,
          showExecutiveSummary: true,
          includeDataTables: true,
          colorScheme: "professional"
        },
        isActive: true
      },
      {
        key: "timelineDigest",
        name: "Timeline Digest",
        description: "Chronological story format with historical context and comparisons",
        configJson: {
          showTimeline: true,
          includeHistoricalContext: true,
          allowComparisons: true,
          colorScheme: "neutral"
        },
        isActive: true
      },
      {
        key: "cardGridBoard",
        name: "Card Grid Board",
        description: "Kanban-style cards with visual hierarchy and action items",
        configJson: {
          gridLayout: true,
          draggableCards: false,
          showPriority: true,
          colorScheme: "vibrant"
        },
        isActive: true
      }
    ];

    for (const styleData of presentationStyles) {
      await this.createPresentationStyle(styleData);
    }

    // Seed framework categories
    const frameworkCategories: InsertFrameworkCategory[] = [
      {
        name: "Match Analysis",
        description: "Templates for analyzing individual match performances",
        color: "#DC2626",
        icon: "target",
        isActive: true
      },
      {
        name: "Player Profiles",
        description: "Frameworks for detailed player analysis and statistics",
        color: "#059669",
        icon: "user",
        isActive: true
      },
      {
        name: "Tactical Breakdowns",
        description: "Strategic analysis templates for formations and tactics",
        color: "#7C3AED",
        icon: "layout",
        isActive: true
      },
      {
        name: "Transfer Analysis",
        description: "Templates for evaluating transfers and market moves",
        color: "#EA580C",
        icon: "refresh-cw",
        isActive: true
      },
      {
        name: "Season Reviews",
        description: "Comprehensive season retrospective frameworks",
        color: "#0284C7",
        icon: "calendar",
        isActive: true
      }
    ];

    for (const categoryData of frameworkCategories) {
      await this.createFrameworkCategory(categoryData);
    }

    // Seed RSS sources for Liverpool FC
    const rssSources: InsertRssSource[] = [
      {
        name: "This Is Anfield",
        description: "The most popular Liverpool FC fan site with daily news, match reports, and analysis",
        feedUrl: "https://www.thisisanfield.com/feed",
        category: "fan_site",
        language: "en",
        updateFrequency: 30,
        isActive: true,
        isVerified: true,
        metadataJson: {
          website: "https://www.thisisanfield.com",
          color: "#C8102E",
          description: "Leading LFC fan community"
        }
      },
      {
        name: "Empire of the Kop",
        description: "Liverpool FC fan site with breaking news and transfer updates",
        feedUrl: "https://empireofthekop.com/feed",
        category: "fan_site",
        language: "en",
        updateFrequency: 45,
        isActive: true,
        isVerified: true,
        metadataJson: {
          website: "https://empireofthekop.com",
          color: "#00B2A9",
          description: "Kop culture and news"
        }
      },
      {
        name: "LFC Globe",
        description: "Liverpool FC news focusing on transfers and tactical analysis",
        feedUrl: "https://lfcglobe.co.uk/feed",
        category: "fan_site",
        language: "en",
        updateFrequency: 60,
        isActive: true,
        isVerified: true,
        metadataJson: {
          website: "https://lfcglobe.co.uk",
          color: "#DC143C",
          description: "Transfer news and tactical insights"
        }
      },
      {
        name: "BBC Sport Liverpool",
        description: "Official BBC coverage of Liverpool FC news and match reports",
        feedUrl: "https://feeds.bbci.co.uk/sport/football/teams/liverpool/rss.xml",
        category: "media",
        language: "en",
        updateFrequency: 20,
        isActive: true,
        isVerified: true,
        metadataJson: {
          website: "https://www.bbc.com/sport/football/teams/liverpool",
          color: "#BB1919",
          description: "Official BBC sports coverage"
        }
      },
      {
        name: "Sky Sports Liverpool",
        description: "Sky Sports dedicated Liverpool FC news and analysis",
        feedUrl: "https://www.skysports.com/rss/football/teams/liverpool",
        category: "media",
        language: "en",
        updateFrequency: 25,
        isActive: true,
        isVerified: true,
        metadataJson: {
          website: "https://www.skysports.com/liverpool-news",
          color: "#00629B",
          description: "Premier Sky Sports coverage"
        }
      },
      {
        name: "The Anfield Wrap",
        description: "Independent Liverpool FC podcast and analysis platform",
        feedUrl: "https://feeds.acast.com/public/shows/the-anfield-wrap",
        category: "podcast",
        language: "en",
        updateFrequency: 120,
        isActive: true,
        isVerified: true,
        metadataJson: {
          website: "https://www.theanfieldwrap.com",
          color: "#E31B23",
          description: "Independent LFC analysis"
        }
      },
      {
        name: "The Official Liverpool FC Podcast",
        description: "Official podcast from Liverpool Football Club",
        feedUrl: "https://audioboom.com/channels/5027131.rss",
        category: "official",
        language: "en",
        updateFrequency: 180,
        isActive: true,
        isVerified: true,
        metadataJson: {
          website: "https://www.liverpoolfc.com",
          color: "#C8102E",
          description: "Official club podcast"
        }
      },
      {
        name: "Liverpool.com",
        description: "Local Liverpool news including LFC coverage",
        feedUrl: "https://www.liverpool.com/liverpool-fc-news/?service=rss",
        category: "media",
        language: "en",
        updateFrequency: 40,
        isActive: true,
        isVerified: true,
        metadataJson: {
          website: "https://www.liverpool.com/liverpool-fc-news/",
          color: "#C41E3A",
          description: "Local media coverage"
        }
      }
    ];

    for (const sourceData of rssSources) {
      await this.createRssSource(sourceData);
    }

    // Seed sample images
    const sampleImages: InsertImage[] = [
      {
        name: "arne-slot-portrait.jpg",
        description: "Manager portrait photo",
        url: "/placeholder.jpg",
        thumbnail: "/placeholder.jpg",
        size: "2.3 MB",
        type: "JPEG",
        tags: ["arne slot", "manager", "portrait", "headshot"],
        category: "Staff",
        isStarred: true,
        fileSize: "2.3 MB",
        fileName: "arne-slot-portrait.jpg",
        mimeType: "image/jpeg"
      },
      {
        name: "salah-celebration.jpg",
        description: "Player celebration moment",
        url: "/placeholder.jpg",
        thumbnail: "/placeholder.jpg",
        size: "1.8 MB",
        type: "JPEG",
        tags: ["salah", "goal", "celebration", "premier league"],
        category: "Players",
        isStarred: false,
        fileSize: "1.8 MB",
        fileName: "salah-celebration.jpg",
        mimeType: "image/jpeg"
      },
      {
        name: "anfield-atmosphere.jpg",
        description: "Stadium atmosphere and crowd",
        url: "/placeholder.jpg",
        thumbnail: "/placeholder.jpg",
        size: "3.1 MB",
        type: "JPEG",
        tags: ["anfield", "atmosphere", "crowd", "stadium"],
        category: "Stadium",
        isStarred: true,
        fileSize: "3.1 MB",
        fileName: "anfield-atmosphere.jpg",
        mimeType: "image/jpeg"
      }
    ];
    
    for (const imageData of sampleImages) {
      await this.createImage(imageData);
    }

    // Seed broadcast templates for Live Presentation Studio
    const sceneTemplates: InsertScene[] = [
      {
        name: 'Pre-Match Analysis',
        description: 'Full screen lineup display with stats comparison overlay. Perfect for pre-match team sheet reveals and tactical preview.',
        layout: 'split',
        elements: [
          {id: '1', type: 'video', zone: 'main', position: {x: 0, y: 0, width: 70, height: 100}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'overlay-right', position: {x: 70, y: 0, width: 30, height: 100}},
          {id: '3', type: 'text', zone: 'header', position: {x: 72, y: 5, width: 26, height: 10}, content: 'TEAM NEWS'},
          {id: '4', type: 'graphic', zone: 'ticker', position: {x: 0, y: 92, width: 100, height: 8}}
        ],
        backgroundConfig: {type: 'color', value: '#000000'},
        transitionConfig: {effect: 'fade', duration: 800},
        aspectRatio: '16:9',
        isTemplate: true,
        tags: ['pre-match', 'lineup', 'team-sheet', 'analysis']
      },
      {
        name: 'Live Commentary',
        description: 'Multi-camera live production with score overlay and scrolling news ticker. Industry-standard broadcast layout.',
        layout: 'single',
        elements: [
          {id: '1', type: 'video', zone: 'main', position: {x: 0, y: 0, width: 100, height: 100}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'scorebug', position: {x: 2, y: 5, width: 25, height: 12}},
          {id: '3', type: 'graphic', zone: 'ticker', position: {x: 0, y: 92, width: 100, height: 8}},
          {id: '4', type: 'text', zone: 'live-badge', position: {x: 90, y: 3, width: 8, height: 6}, content: 'LIVE'}
        ],
        backgroundConfig: {type: 'color', value: '#000000'},
        transitionConfig: {effect: 'slide', duration: 600},
        aspectRatio: '16:9',
        isTemplate: true,
        tags: ['live', 'match', 'commentary', 'scorebug']
      },
      {
        name: 'Post-Match Wrap',
        description: 'Stats review dashboard with match highlights recap. Perfect for post-match analysis and player ratings display.',
        layout: 'grid',
        elements: [
          {id: '1', type: 'video', zone: 'main', position: {x: 0, y: 0, width: 50, height: 100}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'stats-panel', position: {x: 50, y: 0, width: 50, height: 50}},
          {id: '3', type: 'graphic', zone: 'ratings-panel', position: {x: 50, y: 50, width: 50, height: 50}},
          {id: '4', type: 'text', zone: 'title', position: {x: 52, y: 3, width: 46, height: 10}, content: 'FULL TIME ANALYSIS'}
        ],
        backgroundConfig: {type: 'color', value: '#0F1419'},
        transitionConfig: {effect: 'zoom', duration: 1000},
        aspectRatio: '16:9',
        isTemplate: true,
        tags: ['post-match', 'analysis', 'stats', 'ratings']
      },
      {
        name: 'Tactical Breakdown',
        description: 'Formation diagram with heat map visualization. Ideal for in-depth tactical analysis and player positioning breakdown.',
        layout: 'stack',
        elements: [
          {id: '1', type: 'video', zone: 'main', position: {x: 0, y: 0, width: 100, height: 60}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'formation', position: {x: 10, y: 15, width: 80, height: 50}},
          {id: '3', type: 'text', zone: 'title', position: {x: 10, y: 5, width: 80, height: 10}, content: 'TACTICAL ANALYSIS'},
          {id: '4', type: 'graphic', zone: 'ticker', position: {x: 0, y: 92, width: 100, height: 8}}
        ],
        backgroundConfig: {type: 'color', value: '#000000'},
        transitionConfig: {effect: 'wipe', duration: 700},
        aspectRatio: '16:9',
        isTemplate: true,
        tags: ['tactical', 'formation', 'analysis', 'heatmap']
      },
      {
        name: 'Transfer News',
        description: 'Player spotlight with dynamic stats and scrolling news. Perfect for transfer rumors, player profiles, and breaking news.',
        layout: 'split',
        elements: [
          {id: '1', type: 'video', zone: 'background', position: {x: 0, y: 0, width: 100, height: 100}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'player-card', position: {x: 10, y: 15, width: 35, height: 70}},
          {id: '3', type: 'graphic', zone: 'stats-panel', position: {x: 50, y: 15, width: 45, height: 70}},
          {id: '4', type: 'text', zone: 'breaking', position: {x: 10, y: 5, width: 30, height: 8}, content: 'BREAKING NEWS'},
          {id: '5', type: 'graphic', zone: 'ticker', position: {x: 0, y: 92, width: 100, height: 8}}
        ],
        backgroundConfig: {type: 'color', value: '#000000'},
        transitionConfig: {effect: 'slide', duration: 800},
        aspectRatio: '16:9',
        isTemplate: true,
        tags: ['transfer', 'news', 'player', 'breaking']
      }
    ];

    for (const templateData of sceneTemplates) {
      await this.createScene(templateData);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Image methods
  async getImages(): Promise<Image[]> {
    return Array.from(this.images.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getImage(id: string): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = randomUUID();
    const image: Image = {
      id,
      name: insertImage.name,
      description: insertImage.description || null,
      url: insertImage.url,
      thumbnail: insertImage.thumbnail,
      size: insertImage.size,
      type: insertImage.type,
      tags: insertImage.tags || [],
      category: insertImage.category || 'Uploads',
      isStarred: insertImage.isStarred || false,
      fileSize: insertImage.fileSize || null,
      fileName: insertImage.fileName || null,
      mimeType: insertImage.mimeType || null,
      createdAt: new Date()
    };
    this.images.set(id, image);
    return image;
  }

  async updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const existing = this.images.get(id);
    if (!existing) return undefined;
    
    const updated: Image = { ...existing, ...updates };
    this.images.set(id, updated);
    return updated;
  }

  async deleteImage(id: string): Promise<boolean> {
    return this.images.delete(id);
  }

  async getImagesByCategory(category: string): Promise<Image[]> {
    const allImages = await this.getImages();
    return allImages.filter(img => img.category === category);
  }

  async searchImages(query: string): Promise<Image[]> {
    const allImages = await this.getImages();
    const lowerQuery = query.toLowerCase();
    
    return allImages.filter(img => 
      img.name.toLowerCase().includes(lowerQuery) ||
      img.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      img.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Presentation Style methods
  async getPresentationStyles(): Promise<PresentationStyle[]> {
    return Array.from(this.presentationStyles.values()).sort(
      (a, b) => a.name.localeCompare(b.name)
    );
  }

  async getPresentationStyle(id: string): Promise<PresentationStyle | undefined> {
    return this.presentationStyles.get(id);
  }

  async getPresentationStyleByKey(key: string): Promise<PresentationStyle | undefined> {
    return Array.from(this.presentationStyles.values()).find(style => style.key === key);
  }

  async createPresentationStyle(insertStyle: InsertPresentationStyle): Promise<PresentationStyle> {
    const id = randomUUID();
    const style: PresentationStyle = {
      id,
      key: insertStyle.key,
      name: insertStyle.name,
      description: insertStyle.description,
      configJson: insertStyle.configJson || {},
      isActive: insertStyle.isActive !== undefined ? insertStyle.isActive : true,
      createdAt: new Date()
    };
    this.presentationStyles.set(id, style);
    return style;
  }

  async updatePresentationStyle(id: string, updates: Partial<InsertPresentationStyle>): Promise<PresentationStyle | undefined> {
    const existing = this.presentationStyles.get(id);
    if (!existing) return undefined;
    
    const updated: PresentationStyle = { ...existing, ...updates };
    this.presentationStyles.set(id, updated);
    return updated;
  }

  // Report methods
  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const now = new Date();
    const report: Report = {
      id,
      title: insertReport.title,
      bodyJson: insertReport.bodyJson,
      contextJson: insertReport.contextJson || {},
      status: insertReport.status || 'draft',
      createdAt: now,
      updatedAt: now
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: string, updates: Partial<InsertReport>): Promise<Report | undefined> {
    const existing = this.reports.get(id);
    if (!existing) return undefined;
    
    const updated: Report = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.reports.set(id, updated);
    return updated;
  }

  async deleteReport(id: string): Promise<boolean> {
    const deleted = this.reports.delete(id);
    if (deleted) {
      // Also delete all renderings for this report
      await this.deleteReportRenderings(id);
    }
    return deleted;
  }

  // Report Rendering methods
  async getReportRenderings(reportId: string): Promise<ReportRendering[]> {
    return Array.from(this.reportRenderings.values()).filter(
      rendering => rendering.reportId === reportId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getReportRendering(reportId: string, styleKey: string): Promise<ReportRendering | undefined> {
    return Array.from(this.reportRenderings.values()).find(
      rendering => rendering.reportId === reportId && rendering.styleKey === styleKey
    );
  }

  async createReportRendering(insertRendering: InsertReportRendering): Promise<ReportRendering> {
    const id = randomUUID();
    const rendering: ReportRendering = {
      id,
      reportId: insertRendering.reportId,
      styleKey: insertRendering.styleKey,
      contentHtml: insertRendering.contentHtml,
      blocksJson: insertRendering.blocksJson || {},
      metaJson: insertRendering.metaJson || {},
      createdAt: new Date()
    };
    this.reportRenderings.set(id, rendering);
    return rendering;
  }

  async deleteReportRenderings(reportId: string): Promise<boolean> {
    const renderingsToDelete = Array.from(this.reportRenderings.entries()).filter(
      ([_, rendering]) => rendering.reportId === reportId
    );
    
    let deletedAny = false;
    for (const [id, _] of renderingsToDelete) {
      this.reportRenderings.delete(id);
      deletedAny = true;
    }
    
    return deletedAny;
  }

  // Framework Category methods
  async getFrameworkCategories(): Promise<FrameworkCategory[]> {
    return Array.from(this.frameworkCategories.values()).filter(
      category => category.isActive
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getFrameworkCategory(id: string): Promise<FrameworkCategory | undefined> {
    return this.frameworkCategories.get(id);
  }

  async createFrameworkCategory(insertCategory: InsertFrameworkCategory): Promise<FrameworkCategory> {
    const id = randomUUID();
    const category: FrameworkCategory = {
      id,
      name: insertCategory.name,
      description: insertCategory.description,
      color: insertCategory.color || '#3B82F6',
      icon: insertCategory.icon || 'folder',
      isActive: insertCategory.isActive ?? true,
      createdAt: new Date()
    };
    this.frameworkCategories.set(id, category);
    return category;
  }

  async updateFrameworkCategory(id: string, updates: Partial<InsertFrameworkCategory>): Promise<FrameworkCategory | undefined> {
    const existing = this.frameworkCategories.get(id);
    if (!existing) return undefined;
    
    const updated: FrameworkCategory = { ...existing, ...updates };
    this.frameworkCategories.set(id, updated);
    return updated;
  }

  async deleteFrameworkCategory(id: string): Promise<boolean> {
    return this.frameworkCategories.delete(id);
  }

  // Framework methods
  async getFrameworks(): Promise<Framework[]> {
    return Array.from(this.frameworks.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getFramework(id: string): Promise<Framework | undefined> {
    return this.frameworks.get(id);
  }

  async getFrameworksByCategory(categoryId: string): Promise<Framework[]> {
    return Array.from(this.frameworks.values()).filter(
      framework => framework.categoryId === categoryId
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createFramework(insertFramework: InsertFramework): Promise<Framework> {
    const id = randomUUID();
    const now = new Date();
    const framework: Framework = {
      id,
      name: insertFramework.name,
      description: insertFramework.description,
      categoryId: insertFramework.categoryId,
      tags: insertFramework.tags || [],
      isPublic: insertFramework.isPublic ?? false,
      isStarred: insertFramework.isStarred ?? false,
      totalDownloads: insertFramework.totalDownloads || '0',
      currentVersionId: insertFramework.currentVersionId || null,
      createdAt: now,
      updatedAt: now
    };
    this.frameworks.set(id, framework);
    return framework;
  }

  async updateFramework(id: string, updates: Partial<InsertFramework>): Promise<Framework | undefined> {
    const existing = this.frameworks.get(id);
    if (!existing) return undefined;
    
    const updated: Framework = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.frameworks.set(id, updated);
    return updated;
  }

  async deleteFramework(id: string): Promise<boolean> {
    const deleted = this.frameworks.delete(id);
    if (deleted) {
      // Also delete all versions for this framework
      const versionsToDelete = Array.from(this.frameworkVersions.entries()).filter(
        ([_, version]) => version.frameworkId === id
      );
      for (const [versionId, _] of versionsToDelete) {
        this.frameworkVersions.delete(versionId);
      }
    }
    return deleted;
  }

  async searchFrameworks(query: string): Promise<Framework[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.frameworks.values()).filter(framework => 
      framework.name.toLowerCase().includes(lowerQuery) ||
      framework.description.toLowerCase().includes(lowerQuery) ||
      framework.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Framework Version methods
  async getFrameworkVersions(frameworkId: string): Promise<FrameworkVersion[]> {
    return Array.from(this.frameworkVersions.values()).filter(
      version => version.frameworkId === frameworkId && version.isActive
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFrameworkVersion(id: string): Promise<FrameworkVersion | undefined> {
    return this.frameworkVersions.get(id);
  }

  async getCurrentFrameworkVersion(frameworkId: string): Promise<FrameworkVersion | undefined> {
    const framework = await this.getFramework(frameworkId);
    if (!framework?.currentVersionId) return undefined;
    return this.getFrameworkVersion(framework.currentVersionId);
  }

  async createFrameworkVersion(insertVersion: InsertFrameworkVersion): Promise<FrameworkVersion> {
    const id = randomUUID();
    const version: FrameworkVersion = {
      id,
      frameworkId: insertVersion.frameworkId,
      version: insertVersion.version,
      title: insertVersion.title,
      contentJson: insertVersion.contentJson,
      templateStructure: insertVersion.templateStructure || {},
      changelogMarkdown: insertVersion.changelogMarkdown || '',
      isActive: insertVersion.isActive ?? true,
      downloadCount: insertVersion.downloadCount || '0',
      fileSize: insertVersion.fileSize || null,
      createdAt: new Date()
    };
    this.frameworkVersions.set(id, version);
    
    // Update framework's current version if this is the first version
    const framework = await this.getFramework(insertVersion.frameworkId);
    if (framework && !framework.currentVersionId) {
      await this.updateFramework(insertVersion.frameworkId, { currentVersionId: id });
    }
    
    return version;
  }

  async updateFrameworkVersion(id: string, updates: Partial<InsertFrameworkVersion>): Promise<FrameworkVersion | undefined> {
    const existing = this.frameworkVersions.get(id);
    if (!existing) return undefined;
    
    const updated: FrameworkVersion = { ...existing, ...updates };
    this.frameworkVersions.set(id, updated);
    return updated;
  }

  async deleteFrameworkVersion(id: string): Promise<boolean> {
    return this.frameworkVersions.delete(id);
  }

  // RSS Source methods
  async getRssSources(): Promise<RssSource[]> {
    return Array.from(this.rssSources.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getRssSource(id: string): Promise<RssSource | undefined> {
    return this.rssSources.get(id);
  }

  async getRssSourceByUrl(feedUrl: string): Promise<RssSource | undefined> {
    return Array.from(this.rssSources.values()).find(source => source.feedUrl === feedUrl);
  }

  async getActiveRssSources(): Promise<RssSource[]> {
    return Array.from(this.rssSources.values()).filter(source => source.isActive);
  }

  async getRssSourcesByCategory(category: string): Promise<RssSource[]> {
    return Array.from(this.rssSources.values()).filter(source => source.category === category);
  }

  async createRssSource(insertSource: InsertRssSource): Promise<RssSource> {
    const id = randomUUID();
    const now = new Date();
    const source: RssSource = {
      id,
      name: insertSource.name,
      description: insertSource.description,
      feedUrl: insertSource.feedUrl,
      category: insertSource.category,
      language: insertSource.language || 'en',
      updateFrequency: insertSource.updateFrequency || 60,
      isActive: insertSource.isActive ?? true,
      isVerified: insertSource.isVerified ?? false,
      totalArticles: insertSource.totalArticles || 0,
      lastFetchedAt: insertSource.lastFetchedAt || null,
      lastArticleDate: insertSource.lastArticleDate || null,
      fetchErrors: insertSource.fetchErrors || 0,
      metadataJson: insertSource.metadataJson || {},
      createdAt: now,
      updatedAt: now
    };
    this.rssSources.set(id, source);
    return source;
  }

  async updateRssSource(id: string, updates: Partial<InsertRssSource>): Promise<RssSource | undefined> {
    const existing = this.rssSources.get(id);
    if (!existing) return undefined;
    
    const updated: RssSource = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.rssSources.set(id, updated);
    return updated;
  }

  async deleteRssSource(id: string): Promise<boolean> {
    const deleted = this.rssSources.delete(id);
    if (deleted) {
      // Also delete all articles and analyses for this source
      const articlesToDelete = Array.from(this.rssArticles.entries()).filter(
        ([_, article]) => article.sourceId === id
      );
      for (const [articleId, _] of articlesToDelete) {
        await this.deleteRssArticle(articleId);
      }
    }
    return deleted;
  }

  // RSS Article methods
  async getRssArticles(): Promise<RssArticle[]> {
    return Array.from(this.rssArticles.values())
      .sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bDate - aDate;
      });
  }

  async getRssArticle(id: string): Promise<RssArticle | undefined> {
    return this.rssArticles.get(id);
  }

  async getRssArticlesBySource(sourceId: string): Promise<RssArticle[]> {
    return Array.from(this.rssArticles.values())
      .filter(article => article.sourceId === sourceId)
      .sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bDate - aDate;
      });
  }

  async getRssArticleByGuid(guid: string): Promise<RssArticle | undefined> {
    return Array.from(this.rssArticles.values()).find(article => article.guid === guid);
  }

  async getRssArticleByContentHash(contentHash: string): Promise<RssArticle | undefined> {
    return Array.from(this.rssArticles.values()).find(article => article.contentHash === contentHash);
  }

  async getRecentRssArticles(limit: number = 50): Promise<RssArticle[]> {
    const articles = await this.getRssArticles();
    return articles.slice(0, limit);
  }

  async getRssArticlesByDateRange(startDate: Date, endDate: Date): Promise<RssArticle[]> {
    return Array.from(this.rssArticles.values()).filter(article => {
      if (!article.publishedAt) return false;
      const publishedAt = new Date(article.publishedAt);
      return publishedAt >= startDate && publishedAt <= endDate;
    }).sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  async searchRssArticles(query: string): Promise<RssArticle[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.rssArticles.values()).filter(article => 
      article.title.toLowerCase().includes(lowerQuery) ||
      (article.description && article.description.toLowerCase().includes(lowerQuery)) ||
      (article.content && article.content.toLowerCase().includes(lowerQuery)) ||
      (article.author && article.author.toLowerCase().includes(lowerQuery)) ||
      article.topics?.some(topic => topic.toLowerCase().includes(lowerQuery)) ||
      article.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery))
    ).sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  async createRssArticle(insertArticle: InsertRssArticle): Promise<RssArticle> {
    const id = randomUUID();
    const now = new Date();
    const article: RssArticle = {
      id,
      sourceId: insertArticle.sourceId,
      title: insertArticle.title,
      description: insertArticle.description || null,
      content: insertArticle.content || null,
      link: insertArticle.link,
      guid: insertArticle.guid || null,
      author: insertArticle.author || null,
      categories: insertArticle.categories || [],
      publishedAt: insertArticle.publishedAt || null,
      imageUrl: insertArticle.imageUrl || null,
      wordCount: insertArticle.wordCount || null,
      readingTime: insertArticle.readingTime || null,
      sentiment: insertArticle.sentiment || null,
      topics: insertArticle.topics || [],
      keywords: insertArticle.keywords || [],
      isAnalyzed: insertArticle.isAnalyzed ?? false,
      qualityScore: insertArticle.qualityScore || null,
      engagementPotential: insertArticle.engagementPotential || null,
      contentHash: insertArticle.contentHash || null,
      rawDataJson: insertArticle.rawDataJson || {},
      createdAt: now,
      updatedAt: now
    };
    this.rssArticles.set(id, article);
    
    // Update source article count
    const source = await this.getRssSource(insertArticle.sourceId);
    if (source) {
      await this.updateRssSource(insertArticle.sourceId, { 
        totalArticles: source.totalArticles + 1,
        lastArticleDate: insertArticle.publishedAt || now
      });
    }
    
    return article;
  }

  async updateRssArticle(id: string, updates: Partial<InsertRssArticle>): Promise<RssArticle | undefined> {
    const existing = this.rssArticles.get(id);
    if (!existing) return undefined;
    
    const updated: RssArticle = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.rssArticles.set(id, updated);
    return updated;
  }

  async deleteRssArticle(id: string): Promise<boolean> {
    const deleted = this.rssArticles.delete(id);
    if (deleted) {
      // Also delete all analyses for this article
      const analysesToDelete = Array.from(this.rssAnalyses.entries()).filter(
        ([_, analysis]) => analysis.articleId === id
      );
      for (const [analysisId, _] of analysesToDelete) {
        this.rssAnalyses.delete(analysisId);
      }
    }
    return deleted;
  }

  // RSS Analysis methods
  async getRssAnalyses(): Promise<RssAnalysis[]> {
    return Array.from(this.rssAnalyses.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getRssAnalysis(id: string): Promise<RssAnalysis | undefined> {
    return this.rssAnalyses.get(id);
  }

  async getRssAnalysesByArticle(articleId: string): Promise<RssAnalysis[]> {
    return Array.from(this.rssAnalyses.values())
      .filter(analysis => analysis.articleId === articleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRssAnalysesByType(analysisType: string): Promise<RssAnalysis[]> {
    return Array.from(this.rssAnalyses.values())
      .filter(analysis => analysis.analysisType === analysisType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createRssAnalysis(insertAnalysis: InsertRssAnalysis): Promise<RssAnalysis> {
    const id = randomUUID();
    const now = new Date();
    const analysis: RssAnalysis = {
      id,
      articleId: insertAnalysis.articleId,
      analysisType: insertAnalysis.analysisType,
      resultJson: insertAnalysis.resultJson,
      confidence: insertAnalysis.confidence || null,
      aiModel: insertAnalysis.aiModel || 'gpt-4',
      processingTime: insertAnalysis.processingTime || null,
      tokensUsed: insertAnalysis.tokensUsed || null,
      status: insertAnalysis.status || 'pending',
      errorMessage: insertAnalysis.errorMessage || null,
      createdAt: now,
      updatedAt: now
    };
    this.rssAnalyses.set(id, analysis);
    return analysis;
  }

  async updateRssAnalysis(id: string, updates: Partial<InsertRssAnalysis>): Promise<RssAnalysis | undefined> {
    const existing = this.rssAnalyses.get(id);
    if (!existing) return undefined;
    
    const updated: RssAnalysis = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.rssAnalyses.set(id, updated);
    return updated;
  }

  async deleteRssAnalysis(id: string): Promise<boolean> {
    return this.rssAnalyses.delete(id);
  }

  // RSS Comparison methods
  async getRssComparisons(): Promise<RssComparison[]> {
    return Array.from(this.rssComparisons.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getRssComparison(id: string): Promise<RssComparison | undefined> {
    return this.rssComparisons.get(id);
  }

  async getRssComparisonsByType(comparisonType: string): Promise<RssComparison[]> {
    return Array.from(this.rssComparisons.values())
      .filter(comparison => comparison.comparisonType === comparisonType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPublicRssComparisons(): Promise<RssComparison[]> {
    return Array.from(this.rssComparisons.values())
      .filter(comparison => comparison.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createRssComparison(insertComparison: InsertRssComparison): Promise<RssComparison> {
    const id = randomUUID();
    const now = new Date();
    const comparison: RssComparison = {
      id,
      title: insertComparison.title,
      description: insertComparison.description || null,
      articleIds: insertComparison.articleIds,
      comparisonType: insertComparison.comparisonType,
      timeRange: insertComparison.timeRange,
      resultJson: insertComparison.resultJson,
      insights: insertComparison.insights || [],
      visualizationConfig: insertComparison.visualizationConfig || {},
      isPublic: insertComparison.isPublic ?? false,
      generatedBy: insertComparison.generatedBy || 'system',
      createdAt: now,
      updatedAt: now
    };
    this.rssComparisons.set(id, comparison);
    return comparison;
  }

  async updateRssComparison(id: string, updates: Partial<InsertRssComparison>): Promise<RssComparison | undefined> {
    const existing = this.rssComparisons.get(id);
    if (!existing) return undefined;
    
    const updated: RssComparison = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.rssComparisons.set(id, updated);
    return updated;
  }

  async deleteRssComparison(id: string): Promise<boolean> {
    return this.rssComparisons.delete(id);
  }

  // Football methods (delegated to footballService)
  async getFootballCompetitions(): Promise<any[]> {
    return footballService.getCompetitions();
  }

  async getFootballTeamsByCompetition(competitionId: number): Promise<any[]> {
    return footballService.getTeamsByCompetition(competitionId);
  }

  async getFootballHeadToHead(homeTeamId: number, awayTeamId: number): Promise<any[]> {
    return footballService.getHeadToHeadStats(homeTeamId, awayTeamId);
  }

  async getFootballTeamStatistics(teamId: number, leagueId: number, season: number): Promise<any> {
    return footballService.getTeamStatistics(teamId, leagueId, season);
  }

  async getFootballTeamSquad(teamId: number, season: number): Promise<any[]> {
    return footballService.getTeamSquad(teamId, season);
  }

  async getLiverpoolUpcomingFixtures(limit: number): Promise<any[]> {
    return footballService.getLiverpoolUpcomingFixtures(limit);
  }

  async initializeFootballData(): Promise<void> {
    return footballService.initializeData();
  }

  // Library Item methods
  async getLibraryItems(): Promise<LibraryItem[]> {
    return Array.from(this.libraryItems.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getLibraryItem(id: string): Promise<LibraryItem | undefined> {
    return this.libraryItems.get(id);
  }

  async getLibraryItemsByType(type: string): Promise<LibraryItem[]> {
    return Array.from(this.libraryItems.values())
      .filter(item => item.type === type)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getLibraryItemsByCategory(category: string): Promise<LibraryItem[]> {
    return Array.from(this.libraryItems.values())
      .filter(item => item.category === category)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async searchLibraryItems(query: string): Promise<LibraryItem[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.libraryItems.values())
      .filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createLibraryItem(insertItem: InsertLibraryItem): Promise<LibraryItem> {
    const id = randomUUID();
    const now = new Date();
    const item: LibraryItem = {
      id,
      type: insertItem.type,
      name: insertItem.name,
      description: insertItem.description || '',
      metaJson: insertItem.metaJson || {},
      tags: insertItem.tags || [],
      category: insertItem.category || 'General',
      isStarred: insertItem.isStarred ?? false,
      isActive: insertItem.isActive ?? true,
      thumbnailUrl: insertItem.thumbnailUrl || null,
      contentUrl: insertItem.contentUrl || null,
      fileSize: insertItem.fileSize || null,
      mimeType: insertItem.mimeType || null,
      createdAt: now,
      updatedAt: now
    };
    this.libraryItems.set(id, item);
    return item;
  }

  async updateLibraryItem(id: string, updates: Partial<InsertLibraryItem>): Promise<LibraryItem | undefined> {
    const existing = this.libraryItems.get(id);
    if (!existing) return undefined;
    
    const updated: LibraryItem = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.libraryItems.set(id, updated);
    return updated;
  }

  async deleteLibraryItem(id: string): Promise<boolean> {
    return this.libraryItems.delete(id);
  }

  // Scene methods
  async getScenes(): Promise<Scene[]> {
    const results = await db.select().from(scenesTable).orderBy(desc(scenesTable.updatedAt));
    return results;
  }

  async getScene(id: string): Promise<Scene | undefined> {
    const results = await db.select().from(scenesTable).where(eq(scenesTable.id, id));
    return results[0];
  }

  async getScenesByLayout(layout: string): Promise<Scene[]> {
    const results = await db.select().from(scenesTable)
      .where(eq(scenesTable.layout, layout))
      .orderBy(desc(scenesTable.updatedAt));
    return results;
  }

  async getSceneTemplates(): Promise<Scene[]> {
    const results = await db.select().from(scenesTable)
      .where(eq(scenesTable.isTemplate, true))
      .orderBy(desc(scenesTable.updatedAt));
    return results;
  }

  async searchScenes(query: string): Promise<Scene[]> {
    const results = await db.select().from(scenesTable)
      .where(
        or(
          ilike(scenesTable.name, `%${query}%`),
          ilike(scenesTable.description, `%${query}%`)
        )
      )
      .orderBy(desc(scenesTable.updatedAt));
    return results;
  }

  async createScene(insertScene: InsertScene): Promise<Scene> {
    const results = await db.insert(scenesTable).values(insertScene).returning();
    return results[0];
  }

  async updateScene(id: string, updates: Partial<InsertScene>): Promise<Scene | undefined> {
    const results = await db.update(scenesTable)
      .set(updates)
      .where(eq(scenesTable.id, id))
      .returning();
    return results[0];
  }

  async deleteScene(id: string): Promise<boolean> {
    const results = await db.delete(scenesTable).where(eq(scenesTable.id, id)).returning();
    return results.length > 0;
  }

  async duplicateScene(id: string): Promise<Scene | undefined> {
    const original = await this.getScene(id);
    if (!original) return undefined;

    // Auto-assign video sources to video elements that don't have them
    const videoSources = await this.getVideoSources();
    const connectedSource = videoSources.find(s => s.isConnected && s.isActive);
    
    const updatedElements = (original.elements as any[]).map((element: any) => {
      if (element.type === 'video' && !element.sourceId && connectedSource) {
        return {
          ...element,
          sourceId: connectedSource.id,
          content: `Auto-connected: ${connectedSource.name}`
        };
      }
      return element;
    });

    const duplicated = await db.insert(scenesTable).values({
      name: `${original.name} (Copy)`,
      description: original.description,
      layout: original.layout,
      elements: updatedElements,
      backgroundConfig: original.backgroundConfig,
      transitionConfig: original.transitionConfig,
      aspectRatio: original.aspectRatio,
      isTemplate: false,
      tags: original.tags
    }).returning();
    
    return duplicated[0];
  }

  // Presentation Set methods
  async getPresentationSets(): Promise<PresentationSet[]> {
    const results = await db.select().from(presentationSetsTable).orderBy(desc(presentationSetsTable.updatedAt));
    return results;
  }

  async getPresentationSet(id: string): Promise<PresentationSet | undefined> {
    const results = await db.select().from(presentationSetsTable).where(eq(presentationSetsTable.id, id));
    return results[0];
  }

  async getActivePresentationSets(): Promise<PresentationSet[]> {
    const results = await db.select().from(presentationSetsTable)
      .where(eq(presentationSetsTable.isActive, true))
      .orderBy(desc(presentationSetsTable.updatedAt));
    return results;
  }

  async createPresentationSet(insertSet: InsertPresentationSet): Promise<PresentationSet> {
    const results = await db.insert(presentationSetsTable).values(insertSet).returning();
    return results[0];
  }

  async updatePresentationSet(id: string, updates: Partial<InsertPresentationSet>): Promise<PresentationSet | undefined> {
    const results = await db.update(presentationSetsTable)
      .set(updates)
      .where(eq(presentationSetsTable.id, id))
      .returning();
    return results[0];
  }

  async deletePresentationSet(id: string): Promise<boolean> {
    const results = await db.delete(presentationSetsTable).where(eq(presentationSetsTable.id, id)).returning();
    return results.length > 0;
  }

  // Ticker Playlist methods
  async getTickerPlaylists(): Promise<TickerPlaylist[]> {
    return Array.from(this.tickerPlaylists.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getTickerPlaylist(id: string): Promise<TickerPlaylist | undefined> {
    return this.tickerPlaylists.get(id);
  }

  async getActiveTickerPlaylists(): Promise<TickerPlaylist[]> {
    return Array.from(this.tickerPlaylists.values())
      .filter(playlist => playlist.isActive)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createTickerPlaylist(insertPlaylist: InsertTickerPlaylist): Promise<TickerPlaylist> {
    const id = randomUUID();
    const now = new Date();
    const playlist: TickerPlaylist = {
      id,
      name: insertPlaylist.name,
      description: insertPlaylist.description || '',
      items: insertPlaylist.items || [],
      speed: insertPlaylist.speed || 50,
      mode: insertPlaylist.mode || 'loop',
      isActive: insertPlaylist.isActive ?? true,
      backgroundColor: insertPlaylist.backgroundColor || '#1a1a1a',
      textColor: insertPlaylist.textColor || '#ffffff',
      fontSize: insertPlaylist.fontSize || 16,
      height: insertPlaylist.height || 40,
      autoRefresh: insertPlaylist.autoRefresh ?? true,
      refreshInterval: insertPlaylist.refreshInterval || 300,
      createdAt: now,
      updatedAt: now
    };
    this.tickerPlaylists.set(id, playlist);
    return playlist;
  }

  async updateTickerPlaylist(id: string, updates: Partial<InsertTickerPlaylist>): Promise<TickerPlaylist | undefined> {
    const existing = this.tickerPlaylists.get(id);
    if (!existing) return undefined;
    
    const updated: TickerPlaylist = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.tickerPlaylists.set(id, updated);
    return updated;
  }

  async deleteTickerPlaylist(id: string): Promise<boolean> {
    return this.tickerPlaylists.delete(id);
  }

  // Video Source methods
  async getVideoSources(): Promise<VideoSource[]> {
    const results = await db.select().from(videoSourcesTable).orderBy(desc(videoSourcesTable.updatedAt));
    return results;
  }

  async getVideoSource(id: string): Promise<VideoSource | undefined> {
    const results = await db.select().from(videoSourcesTable).where(eq(videoSourcesTable.id, id));
    return results[0];
  }

  async createVideoSource(insertSource: InsertVideoSource): Promise<VideoSource> {
    const results = await db.insert(videoSourcesTable).values(insertSource).returning();
    return results[0];
  }

  async updateVideoSource(id: string, updates: Partial<InsertVideoSource>): Promise<VideoSource | undefined> {
    const results = await db.update(videoSourcesTable)
      .set(updates)
      .where(eq(videoSourcesTable.id, id))
      .returning();
    return results[0];
  }

  async deleteVideoSource(id: string): Promise<boolean> {
    const results = await db.delete(videoSourcesTable).where(eq(videoSourcesTable.id, id)).returning();
    return results.length > 0;
  }

  // Source Template methods
  async getSourceTemplates(): Promise<SourceTemplate[]> {
    return Array.from(this.sourceTemplates.values());
  }

  async getSourceTemplate(id: string): Promise<SourceTemplate | undefined> {
    return this.sourceTemplates.get(id);
  }

  async getSourceTemplatesByType(sourceType: string): Promise<SourceTemplate[]> {
    return Array.from(this.sourceTemplates.values())
      .filter(template => template.sourceType === sourceType);
  }

  async getDefaultSourceTemplates(): Promise<SourceTemplate[]> {
    return Array.from(this.sourceTemplates.values())
      .filter(template => template.isDefault);
  }

  async createSourceTemplate(template: InsertSourceTemplate): Promise<SourceTemplate> {
    const newTemplate: SourceTemplate = {
      id: randomUUID(),
      ...template,
      usageCount: template.usageCount ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sourceTemplates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async updateSourceTemplate(id: string, updates: Partial<InsertSourceTemplate>): Promise<SourceTemplate | undefined> {
    const template = this.sourceTemplates.get(id);
    if (!template) return undefined;
    
    const updated = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };
    this.sourceTemplates.set(id, updated);
    return updated;
  }

  async deleteSourceTemplate(id: string): Promise<boolean> {
    return this.sourceTemplates.delete(id);
  }

  // Set Template methods
  async getSetTemplates(): Promise<SetTemplate[]> {
    return Array.from(this.setTemplates.values());
  }

  async getSetTemplate(id: string): Promise<SetTemplate | undefined> {
    return this.setTemplates.get(id);
  }

  async getDefaultSetTemplates(): Promise<SetTemplate[]> {
    return Array.from(this.setTemplates.values())
      .filter(template => template.isDefault);
  }

  async createSetTemplate(template: InsertSetTemplate): Promise<SetTemplate> {
    const newTemplate: SetTemplate = {
      id: randomUUID(),
      ...template,
      usageCount: template.usageCount ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.setTemplates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async updateSetTemplate(id: string, updates: Partial<InsertSetTemplate>): Promise<SetTemplate | undefined> {
    const template = this.setTemplates.get(id);
    if (!template) return undefined;
    
    const updated = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };
    this.setTemplates.set(id, updated);
    return updated;
  }

  async deleteSetTemplate(id: string): Promise<boolean> {
    return this.setTemplates.delete(id);
  }

  // Source Name Preset methods
  async getSourceNamePresets(): Promise<SourceNamePreset[]> {
    return Array.from(this.sourceNamePresets.values());
  }

  async getSourceNamePreset(id: string): Promise<SourceNamePreset | undefined> {
    return this.sourceNamePresets.get(id);
  }

  async getSourceNamePresetsByCategory(category: string): Promise<SourceNamePreset[]> {
    return Array.from(this.sourceNamePresets.values())
      .filter(preset => preset.category === category);
  }

  async createSourceNamePreset(preset: InsertSourceNamePreset): Promise<SourceNamePreset> {
    const newPreset: SourceNamePreset = {
      id: randomUUID(),
      ...preset,
      usageCount: preset.usageCount ?? 0,
      createdAt: new Date()
    };
    this.sourceNamePresets.set(newPreset.id, newPreset);
    return newPreset;
  }

  async incrementSourceNameUsage(id: string): Promise<void> {
    const preset = this.sourceNamePresets.get(id);
    if (preset) {
      preset.usageCount++;
      this.sourceNamePresets.set(id, preset);
    }
  }

  async deleteSourceNamePreset(id: string): Promise<boolean> {
    return this.sourceNamePresets.delete(id);
  }

  // Live State methods (in-memory only)
  async getLiveState(): Promise<LiveState> {
    return { ...this.liveState };
  }

  async updateLiveState(updates: Partial<LiveState>): Promise<LiveState> {
    this.liveState = {
      ...this.liveState,
      ...updates,
      lastUpdate: new Date()
    };
    return { ...this.liveState };
  }

  // Statistics methods
  async getStatistics(): Promise<{
    totalContent: number;
    frameworks: number;
    images: number;
    rssArticles: number;
    libraryItems: number;
    scenes: number;
    presentationSets: number;
    tickerPlaylists: number;
    reports: number;
  }> {
    const frameworks = this.frameworks.size;
    const images = this.images.size;
    const rssArticles = this.rssArticles.size;
    const libraryItems = this.libraryItems.size;
    const scenes = this.scenes.size;
    const presentationSets = this.presentationSets.size;
    const tickerPlaylists = this.tickerPlaylists.size;
    const reports = this.reports.size;
    
    const totalContent = frameworks + images + rssArticles + libraryItems + scenes + presentationSets + tickerPlaylists + reports;
    
    return {
      totalContent,
      frameworks,
      images,
      rssArticles,
      libraryItems,
      scenes,
      presentationSets,
      tickerPlaylists,
      reports
    };
  }
}

export const storage = new MemStorage();
