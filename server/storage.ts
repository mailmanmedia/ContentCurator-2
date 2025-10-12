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
  type Template, type InsertTemplate,
  type LiveState, type InsertLiveState,
  type Recording, type InsertRecording,
  type VideoProject, type InsertVideoProject,
  type VideoClip, type InsertVideoClip,
  type RenderJob, type InsertRenderJob,
  type TextOverlay, type InsertTextOverlay,
  type Keyframe, type InsertKeyframe,
  type AudioTrack, type InsertAudioTrack,
  type SelectDataImport, type InsertDataImport,
  videoSources as videoSourcesTable,
  scenes as scenesTable,
  presentationSets as presentationSetsTable,
  rssSources as rssSourcesTable,
  rssArticles as rssArticlesTable,
  rssAnalysis as rssAnalysisTable,
  rssComparisons as rssComparisonsTable,
  liveStates as liveStatesTable,
  recordings as recordingsTable,
  videoProjects as videoProjectsTable,
  videoClips as videoClipsTable,
  renderJobs as renderJobsTable,
  textOverlays as textOverlaysTable,
  keyframes as keyframesTable,
  audioTracks as audioTracksTable,
  sourceTemplates as sourceTemplatesTable,
  setTemplates as setTemplatesTable,
  data_imports as dataImportsTable
} from "@shared/schema";
import { randomUUID } from "crypto";
import { footballService } from "./football/footballService";
import { db, pool } from "./db";
import { teamSeasonStatistics, teamMatchupAnalysis, footballTeams, footballPlayers, playerSeasonStatistics, footballFixtures, footballCompetitions, historicalHeadToHead, data_sync_logs, data_sync_status, football_standings, football_leagues, library_items, scenes, rssArticles, football_players, recordings as recordingsTable } from "@shared/schema";
import { desc, eq, and, gte, lte, or, inArray, sql, isNull, ilike } from "drizzle-orm";

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
  createRssArticle(article: InsertRssArticle): Promise<RssArticle | null>;
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
  getTeamSeasonStatisticsFromDB(teamId: number, leagueId: number, season: number): Promise<any | null>;

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
  getSourceTemplateById(id: string): Promise<SourceTemplate | undefined>;
  createSourceTemplate(template: InsertSourceTemplate): Promise<SourceTemplate>;
  updateSourceTemplate(id: string, template: Partial<InsertSourceTemplate>): Promise<SourceTemplate>;
  deleteSourceTemplate(id: string): Promise<void>;

  // Set Template methods
  getSetTemplates(): Promise<SetTemplate[]>;
  getSetTemplateById(id: string): Promise<SetTemplate | undefined>;
  createSetTemplate(template: InsertSetTemplate): Promise<SetTemplate>;
  updateSetTemplate(id: string, template: Partial<InsertSetTemplate>): Promise<SetTemplate>;
  deleteSetTemplate(id: string): Promise<void>;

  // Source Name Preset methods
  getSourceNamePresets(): Promise<SourceNamePreset[]>;
  getSourceNamePreset(id: string): Promise<SourceNamePreset | undefined>;
  getSourceNamePresetsByCategory(category: string): Promise<SourceNamePreset[]>;
  createSourceNamePreset(preset: InsertSourceNamePreset): Promise<SourceNamePreset>;
  incrementSourceNameUsage(id: string): Promise<void>;
  deleteSourceNamePreset(id: string): Promise<boolean>;

  // Template methods
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  getTemplatesByCategory(category: string): Promise<Template[]>;
  getTemplatesByType(templateType: string): Promise<Template[]>;
  getActiveTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, updates: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<boolean>;

  // Ticker Config methods
  getTickerConfig(): Promise<{
    speed: number;
    activeFeeds: string[];
    style: {
      backgroundColor: string;
      textColor: string;
      fontSize: number;
      height: number;
    };
    mode: string;
    autoRefresh: boolean;
    refreshInterval: number;
  }>;
  updateTickerConfig(config: Partial<{
    speed: number;
    activeFeeds: string[];
    style: {
      backgroundColor: string;
      textColor: string;
      fontSize: number;
      height: number;
    };
    mode: string;
    autoRefresh: boolean;
    refreshInterval: number;
  }>): Promise<void>;

  // Live State methods
  getLiveState(): Promise<LiveState | undefined>;
  updateLiveState(updates: Partial<InsertLiveState>): Promise<LiveState>;

  // Recording methods
  getRecordings(): Promise<import("@shared/schema").Recording[]>;
  getRecording(id: string): Promise<import("@shared/schema").Recording | undefined>;
  createRecording(recording: import("@shared/schema").InsertRecording): Promise<import("@shared/schema").Recording>;
  updateRecording(id: string, updates: Partial<import("@shared/schema").InsertRecording>): Promise<import("@shared/schema").Recording | undefined>;
  deleteRecording(id: string): Promise<boolean>;

  // Video Project methods
  getVideoProjects(): Promise<import("@shared/schema").VideoProject[]>;
  getVideoProject(id: string): Promise<import("@shared/schema").VideoProject | undefined>;
  createVideoProject(project: import("@shared/schema").InsertVideoProject): Promise<import("@shared/schema").VideoProject>;
  updateVideoProject(id: string, updates: Partial<import("@shared/schema").InsertVideoProject>): Promise<import("@shared/schema").VideoProject | undefined>;
  deleteVideoProject(id: string): Promise<boolean>;

  // Video Clip methods
  getVideoClips(projectId: string): Promise<import("@shared/schema").VideoClip[]>;
  getVideoClip(id: string): Promise<import("@shared/schema").VideoClip | undefined>;
  createVideoClip(clip: import("@shared/schema").InsertVideoClip): Promise<import("@shared/schema").VideoClip>;
  updateVideoClip(id: string, updates: Partial<import("@shared/schema").InsertVideoClip>): Promise<import("@shared/schema").VideoClip | undefined>;
  deleteVideoClip(id: string): Promise<boolean>;

  // Text Overlay methods
  getTextOverlays(projectId: string): Promise<import("@shared/schema").TextOverlay[]>;
  getTextOverlay(id: string): Promise<import("@shared/schema").TextOverlay | undefined>;
  createTextOverlay(overlay: import("@shared/schema").InsertTextOverlay): Promise<import("@shared/schema").TextOverlay>;
  updateTextOverlay(id: string, updates: Partial<import("@shared/schema").InsertTextOverlay>): Promise<import("@shared/schema").TextOverlay | undefined>;
  deleteTextOverlay(id: string): Promise<boolean>;

  // Keyframe methods
  getKeyframes(clipId: string): Promise<import("@shared/schema").Keyframe[]>;
  getKeyframe(id: string): Promise<import("@shared/schema").Keyframe | undefined>;
  createKeyframe(keyframe: import("@shared/schema").InsertKeyframe): Promise<import("@shared/schema").Keyframe>;
  updateKeyframe(id: string, updates: Partial<import("@shared/schema").InsertKeyframe>): Promise<import("@shared/schema").Keyframe | undefined>;
  deleteKeyframe(id: string): Promise<boolean>;

  // Audio Track methods
  getAudioTracks(projectId: string): Promise<import("@shared/schema").AudioTrack[]>;
  getAudioTrack(id: string): Promise<import("@shared/schema").AudioTrack | undefined>;
  createAudioTrack(track: import("@shared/schema").InsertAudioTrack): Promise<import("@shared/schema").AudioTrack>;
  updateAudioTrack(id: string, updates: Partial<import("@shared/schema").InsertAudioTrack>): Promise<import("@shared/schema").AudioTrack | undefined>;
  deleteAudioTrack(id: string): Promise<boolean>;

  // Render Job methods
  getRenderJobs(): Promise<RenderJob[]>;
  getRenderJob(id: string): Promise<RenderJob | undefined>;
  getProjectRenderJobs(projectId: string): Promise<RenderJob[]>;
  createRenderJob(job: InsertRenderJob): Promise<RenderJob>;
  updateRenderJob(id: string, updates: Partial<InsertRenderJob>): Promise<RenderJob | undefined>;
  deleteRenderJob(id: string): Promise<boolean>;

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

  // Default Overlay Templates
  getDefaultOverlayTemplates(): Promise<any>;

  // Data Import methods
  createDataImport(data: InsertDataImport): Promise<SelectDataImport>;
  getDataImports(): Promise<SelectDataImport[]>;
  updateDataImport(id: number, data: Partial<InsertDataImport>): Promise<SelectDataImport>;
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
  private libraryItems: Map<string, LibraryItem>;
  private scenes: Map<string, Scene>;
  private presentationSets: Map<string, PresentationSet>;
  private tickerPlaylists: Map<string, TickerPlaylist>;
  private videoSources: Map<string, VideoSource>;
  private sourceTemplates: Map<string, SourceTemplate>;
  private setTemplates: Map<string, SetTemplate>;
  private sourceNamePresets: Map<string, SourceNamePreset>;
  private templates: Map<string, Template>;
  private tickerConfig: {
    speed: number;
    activeFeeds: string[];
    style: {
      backgroundColor: string;
      textColor: string;
      fontSize: number;
      height: number;
    };
    mode: string;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  private liveState: LiveState;
  // In-memory storage for recordings, as a fallback or for testing
  private recordings: Map<string, Recording>;


  constructor() {
    this.users = new Map();
    this.images = new Map();
    this.presentationStyles = new Map();
    this.reports = new Map();
    this.reportRenderings = new Map();
    this.frameworkCategories = new Map();
    this.frameworks = new Map();
    this.frameworkVersions = new Map();
    this.libraryItems = new Map();
    this.scenes = new Map();
    this.presentationSets = new Map();
    this.tickerPlaylists = new Map();
    this.videoSources = new Map();
    this.sourceTemplates = new Map();
    this.setTemplates = new Map();
    this.sourceNamePresets = new Map();
    this.templates = new Map();
    this.recordings = new Map(); // Initialize in-memory recordings map
    this.tickerConfig = {
      speed: 50,
      activeFeeds: [],
      style: {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        fontSize: 16,
        height: 40
      },
      mode: 'loop',
      autoRefresh: true,
      refreshInterval: 300
    };
    this.liveState = {
      id: 1,
      key: 'default',
      value: JSON.stringify({
        activeSources: [],
        overlays: [],
        outputResolution: { width: 3840, height: 2160 },
        globalFitMode: 'contain',
        sourceFitModes: {},
        sourceSettings: {},
        isBroadcasting: false
      }),
      updated_at: new Date()
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
        config: JSON.stringify({
          showMetrics: true,
          showFormations: true,
          allowInteractions: true,
          colorScheme: "liverpool"
        })
      },
      {
        key: "analystBrief",
        name: "Analyst Brief",
        description: "Professional executive summary with data tables and recommendations",
        config: JSON.stringify({
          twoColumn: true,
          showExecutiveSummary: true,
          includeDataTables: true,
          colorScheme: "professional"
        })
      },
      {
        key: "timelineDigest",
        name: "Timeline Digest",
        description: "Chronological story format with historical context and comparisons",
        config: JSON.stringify({
          showTimeline: true,
          includeHistoricalContext: true,
          allowComparisons: true,
          colorScheme: "neutral"
        })
      },
      {
        key: "cardGridBoard",
        name: "Card Grid Board",
        description: "Kanban-style cards with visual hierarchy and action items",
        config: JSON.stringify({
          gridLayout: true,
          draggableCards: false,
          showPriority: true,
          colorScheme: "vibrant"
        })
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
        icon: "target"
      },
      {
        name: "Player Profiles",
        description: "Frameworks for detailed player analysis and statistics",
        icon: "user"
      },
      {
        name: "Tactical Breakdowns",
        description: "Strategic analysis templates for formations and tactics",
        icon: "layout"
      },
      {
        name: "Transfer Analysis",
        description: "Templates for evaluating transfers and market moves",
        icon: "refresh-cw"
      },
      {
        name: "Season Reviews",
        description: "Comprehensive season retrospective frameworks",
        icon: "calendar"
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
        feed_url: "https://www.thisisanfield.com/feed",
        category: "fan_site",
        is_active: true,
        is_verified: true
      },
      {
        name: "Empire of the Kop",
        description: "Liverpool FC fan site with breaking news and transfer updates",
        feed_url: "https://empireofthekop.com/feed",
        category: "fan_site",
        is_active: true,
        is_verified: true
      },
      {
        name: "LFC Globe",
        description: "Liverpool FC news focusing on transfers and tactical analysis",
        feed_url: "https://lfcglobe.co.uk/feed",
        category: "fan_site",
        is_active: true,
        is_verified: true
      },
      {
        name: "BBC Sport Liverpool",
        description: "Official BBC coverage of Liverpool FC news and match reports",
        feed_url: "https://feeds.bbci.co.uk/sport/football/teams/liverpool/rss.xml",
        category: "media",
        is_active: true,
        is_verified: true
      },
      {
        name: "Sky Sports Liverpool",
        description: "Sky Sports dedicated Liverpool FC news and analysis",
        feed_url: "https://www.skysports.com/rss/football/teams/liverpool",
        category: "media",
        is_active: true,
        is_verified: true
      },
      {
        name: "The Anfield Wrap",
        description: "Independent Liverpool FC podcast and analysis platform",
        feed_url: "https://feeds.acast.com/public/shows/the-anfield-wrap",
        category: "podcast",
        is_active: true,
        is_verified: true
      },
      {
        name: "The Official Liverpool FC Podcast",
        description: "Official podcast from Liverpool Football Club",
        feed_url: "https://audioboom.com/channels/5027131.rss",
        category: "official",
        is_active: true,
        is_verified: true
      },
      {
        name: "Liverpool.com",
        description: "Local Liverpool news including LFC coverage",
        feed_url: "https://www.liverpool.com/liverpool-fc-news/?service=rss",
        category: "media",
        is_active: true,
        is_verified: true
      }
    ];

    for (const sourceData of rssSources) {
      const existing = await this.getRssSourceByUrl(sourceData.feed_url);
      if (!existing) {
        await this.createRssSource(sourceData);
      }
    }

    // Seed sample images
    const sampleImages: InsertImage[] = [
      {
        url: "/placeholder.jpg",
        filename: "arne-slot-portrait.jpg",
        alt_text: "Manager portrait photo",
        caption: "Arne Slot - Liverpool FC Manager",
        category: "Staff",
        width: 1920,
        height: 1080,
        size: 2411520
      },
      {
        url: "/placeholder.jpg",
        filename: "salah-celebration.jpg",
        alt_text: "Player celebration moment",
        caption: "Mohamed Salah celebrating a goal",
        category: "Players",
        width: 1920,
        height: 1080,
        size: 1887436
      },
      {
        url: "/placeholder.jpg",
        filename: "anfield-atmosphere.jpg",
        alt_text: "Stadium atmosphere and crowd",
        caption: "Anfield atmosphere on match day",
        category: "Stadium",
        width: 1920,
        height: 1080,
        size: 3250585
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
        elements: JSON.stringify([
          {id: '1', type: 'video', zone: 'main', position: {x: 0, y: 0, width: 70, height: 100}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'overlay-right', position: {x: 70, y: 0, width: 30, height: 100}},
          {id: '3', type: 'text', zone: 'header', position: {x: 72, y: 5, width: 26, height: 10}, content: 'TEAM NEWS'},
          {id: '4', type: 'graphic', zone: 'ticker', position: {x: 0, y: 92, width: 100, height: 8}}
        ]),
        background_config: JSON.stringify({type: 'color', value: '#000000'}),
        transition_config: JSON.stringify({effect: 'fade', duration: 800}),
        aspect_ratio: '16:9',
        is_template: true,
        tags: ['pre-match', 'lineup', 'team-sheet', 'analysis']
      },
      {
        name: 'Live Commentary',
        description: 'Multi-camera live production with score overlay and scrolling news ticker. Industry-standard broadcast layout.',
        layout: 'single',
        elements: JSON.stringify([
          {id: '1', type: 'video', zone: 'main', position: {x: 0, y: 0, width: 100, height: 100}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'scorebug', position: {x: 2, y: 5, width: 25, height: 12}},
          {id: '3', type: 'graphic', zone: 'ticker', position: {x: 0, y: 92, width: 100, height: 8}},
          {id: '4', type: 'text', zone: 'live-badge', position: {x: 90, y: 3, width: 8, height: 6}, content: 'LIVE'}
        ]),
        background_config: JSON.stringify({type: 'color', value: '#000000'}),
        transition_config: JSON.stringify({effect: 'slide', duration: 600}),
        aspect_ratio: '16:9',
        is_template: true,
        tags: ['live', 'match', 'commentary', 'scorebug']
      },
      {
        name: 'Post-Match Wrap',
        description: 'Stats review dashboard with match highlights recap. Perfect for post-match analysis and player ratings display.',
        layout: 'grid',
        elements: JSON.stringify([
          {id: '1', type: 'video', zone: 'main', position: {x: 0, y: 0, width: 50, height: 100}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'stats-panel', position: {x: 50, y: 0, width: 50, height: 50}},
          {id: '3', type: 'graphic', zone: 'ratings-panel', position: {x: 50, y: 50, width: 50, height: 50}},
          {id: '4', type: 'text', zone: 'title', position: {x: 52, y: 3, width: 46, height: 10}, content: 'FULL TIME ANALYSIS'}
        ]),
        background_config: JSON.stringify({type: 'color', value: '#0F1419'}),
        transition_config: JSON.stringify({effect: 'zoom', duration: 1000}),
        aspect_ratio: '16:9',
        is_template: true,
        tags: ['post-match', 'analysis', 'stats', 'ratings']
      },
      {
        name: 'Tactical Breakdown',
        description: 'Formation diagram with heat map visualization. Ideal for in-depth tactical analysis and player positioning breakdown.',
        layout: 'stack',
        elements: JSON.stringify([
          {id: '1', type: 'video', zone: 'main', position: {x: 0, y: 0, width: 100, height: 60}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'formation', position: {x: 10, y: 15, width: 80, height: 50}},
          {id: '3', type: 'text', zone: 'title', position: {x: 10, y: 5, width: 80, height: 10}, content: 'TACTICAL ANALYSIS'},
          {id: '4', type: 'graphic', zone: 'ticker', position: {x: 0, y: 92, width: 100, height: 8}}
        ]),
        background_config: JSON.stringify({type: 'color', value: '#000000'}),
        transition_config: JSON.stringify({effect: 'wipe', duration: 700}),
        aspect_ratio: '16:9',
        is_template: true,
        tags: ['tactical', 'formation', 'analysis', 'heatmap']
      },
      {
        name: 'Transfer News',
        description: 'Player spotlight with dynamic stats and scrolling news. Perfect for transfer rumors, player profiles, and breaking news.',
        layout: 'split',
        elements: JSON.stringify([
          {id: '1', type: 'video', zone: 'background', position: {x: 0, y: 0, width: 100, height: 100}, sourceId: 'camera1'},
          {id: '2', type: 'graphic', zone: 'player-card', position: {x: 10, y: 15, width: 35, height: 70}},
          {id: '3', type: 'graphic', zone: 'stats-panel', position: {x: 50, y: 15, width: 45, height: 70}},
          {id: '4', type: 'text', zone: 'breaking', position: {x: 10, y: 5, width: 30, height: 8}, content: 'BREAKING NEWS'},
          {id: '5', type: 'graphic', zone: 'ticker', position: {x: 0, y: 92, width: 100, height: 8}}
        ]),
        background_config: JSON.stringify({type: 'color', value: '#000000'}),
        transition_config: JSON.stringify({effect: 'slide', duration: 800}),
        aspect_ratio: '16:9',
        is_template: true,
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
    const id = parseInt(randomUUID().replace(/-/g, '').substring(0, 8), 16);
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      password_hash: insertUser.password_hash || null,
      role: insertUser.role || null,
      preferences: insertUser.preferences || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(id.toString(), user);
    return user;
  }

  // Image methods
  async getImages(): Promise<Image[]> {
    return Array.from(this.images.values()).sort(
      (a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0)
    );
  }

  async getImage(id: string): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = parseInt(randomUUID().replace(/-/g, '').substring(0, 8), 16);
    const image: Image = {
      id,
      url: insertImage.url,
      filename: insertImage.filename || null,
      alt_text: insertImage.alt_text || null,
      caption: insertImage.caption || null,
      category: insertImage.category || null,
      width: insertImage.width || null,
      height: insertImage.height || null,
      size: insertImage.size || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.images.set(id.toString(), image);
    return image;
  }

  async updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const existing = this.images.get(id);
    if (!existing) return undefined;

    const updated: Image = { ...existing, ...updates, updated_at: new Date() };
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
      (img.filename && img.filename.toLowerCase().includes(lowerQuery)) ||
      (img.category && img.category.toLowerCase().includes(lowerQuery)) ||
      (img.alt_text && img.alt_text.toLowerCase().includes(lowerQuery))
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
    const id = parseInt(randomUUID().replace(/-/g, '').substring(0, 8), 16);
    const style: PresentationStyle = {
      id,
      key: insertStyle.key,
      name: insertStyle.name,
      description: insertStyle.description || null,
      config: insertStyle.config || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.presentationStyles.set(id.toString(), style);
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
      (a, b) => (b.updated_at ? new Date(b.updated_at).getTime() : 0) - (a.updated_at ? new Date(a.updated_at).getTime() : 0)
    );
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = parseInt(randomUUID().replace(/-/g, '').substring(0, 8), 16);
    const now = new Date();
    const report: Report = {
      id,
      name: insertReport.name,
      description: insertReport.description || null,
      content: insertReport.content || null,
      type: insertReport.type || null,
      status: insertReport.status || null,
      created_at: now,
      updated_at: now
    };
    this.reports.set(id.toString(), report);
    return report;
  }

  async updateReport(id: string, updates: Partial<InsertReport>): Promise<Report | undefined> {
    const existing = this.reports.get(id);
    if (!existing) return undefined;

    const updated: Report = { 
      ...existing, 
      ...updates,
      updated_at: new Date()
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
    return Array.from(this.frameworkCategories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getFrameworkCategory(id: string): Promise<FrameworkCategory | undefined> {
    return this.frameworkCategories.get(id);
  }

  async createFrameworkCategory(insertCategory: InsertFrameworkCategory): Promise<FrameworkCategory> {
    const id = parseInt(randomUUID().replace(/-/g, '').substring(0, 8), 16);
    const category: FrameworkCategory = {
      id,
      name: insertCategory.name,
      description: insertCategory.description || null,
      icon: insertCategory.icon || null,
      created_at: new Date()
    };
    this.frameworkCategories.set(id.toString(), category);
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
      apiCapabilities: insertFramework.apiCapabilities || { database: false, perplexity: false, claude: false, openai: false, football: false },
      apiConfig: insertFramework.apiConfig || {},
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
      sourceType: insertVersion.sourceType || 'manual',
      sourceFileName: insertVersion.sourceFileName || null,
      sourceFileUrl: insertVersion.sourceFileUrl || null,
      processingStatus: insertVersion.processingStatus || 'completed',
      extractedText: insertVersion.extractedText || null,
      extractionError: insertVersion.extractionError || null,
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
    const results = await db.select().from(rssSourcesTable).orderBy(desc(rssSourcesTable.createdAt));
    return results;
  }

  async getRssSource(id: string): Promise<RssSource | undefined> {
    const results = await db.select().from(rssSourcesTable).where(eq(rssSourcesTable.id, id));
    return results[0];
  }

  async getRssSourceByUrl(feedUrl: string): Promise<RssSource | undefined> {
    const results = await db.select().from(rssSourcesTable).where(eq(rssSourcesTable.feed_url, feedUrl));
    return results[0];
  }

  async getActiveRssSources(): Promise<RssSource[]> {
    const results = await db.select().from(rssSourcesTable).where(eq(rssSourcesTable.is_active, true));
    return results;
  }

  async getRssSourcesByCategory(category: string): Promise<RssSource[]> {
    const results = await db.select().from(rssSourcesTable).where(eq(rssSourcesTable.category, category));
    return results;
  }

  async createRssSource(insertSource: InsertRssSource): Promise<RssSource> {
    const results = await db.insert(rssSourcesTable).values(insertSource).returning();
    return results[0];
  }

  async updateRssSource(id: string, updates: Partial<InsertRssSource>): Promise<RssSource | undefined> {
    const results = await db.update(rssSourcesTable)
      .set(updates)
      .where(eq(rssSourcesTable.id, id))
      .returning();
    return results[0];
  }

  async deleteRssSource(id: string): Promise<boolean> {
    const articlesToDelete = await db.select().from(rssArticlesTable).where(eq(rssArticlesTable.sourceId, id));
    for (const article of articlesToDelete) {
      await this.deleteRssArticle(article.id);
    }
    const results = await db.delete(rssSourcesTable).where(eq(rssSourcesTable.id, id)).returning();
    return results.length > 0;
  }

  // RSS Article methods
  async getRssArticles(): Promise<RssArticle[]> {
    const results = await db.select().from(rssArticlesTable).orderBy(rssArticlesTable.published_at.desc());
    return results;
  }

  async getRssArticle(id: string): Promise<RssArticle | undefined> {
    const results = await db.select().from(rssArticlesTable).where(eq(rssArticlesTable.id, id));
    return results[0];
  }

  async getRssArticlesBySource(sourceId: string): Promise<RssArticle[]> {
    const results = await db.select().from(rssArticlesTable)
      .where(eq(rssArticlesTable.sourceId, sourceId))
      .orderBy(rssArticlesTable.published_at.desc());
    return results;
  }

  async getRssArticleByGuid(guid: string): Promise<RssArticle | undefined> {
    const results = await db.select().from(rssArticlesTable).where(eq(rssArticlesTable.guid, guid));
    return results[0];
  }

  async getRssArticleByContentHash(contentHash: string): Promise<RssArticle | undefined> {
    const results = await db.select().from(rssArticlesTable).where(eq(rssArticlesTable.contentHash, contentHash));
    return results[0];
  }

  async getRecentRssArticles(limit: number = 50): Promise<RssArticle[]> {
    const results = await db.select().from(rssArticlesTable)
      .orderBy(rssArticlesTable.published_at.desc())
      .limit(limit);
    return results;
  }

  async getRssArticlesByDateRange(startDate: Date, endDate: Date): Promise<RssArticle[]> {
    const results = await db.select().from(rssArticlesTable)
      .where(
        and(
          gte(rssArticlesTable.published_at, startDate),
          lte(rssArticlesTable.published_at, endDate)
        )
      )
      .orderBy(rssArticlesTable.published_at.desc());
    return results;
  }

  async searchRssArticles(query: string): Promise<RssArticle[]> {
    const results = await db.select().from(rssArticlesTable)
      .where(
        or(
          ilike(rssArticlesTable.title, `%${query}%`),
          ilike(rssArticlesTable.description, `%${query}%`),
          ilike(rssArticlesTable.content, `%${query}%`),
          ilike(rssArticlesTable.author, `%${query}%`)
        )
      )
      .orderBy(rssArticlesTable.published_at.desc());
    return results;
  }

  async createRssArticle(insertArticle: InsertRssArticle): Promise<RssArticle | null> {
    const results = await db.insert(rssArticlesTable).values(insertArticle).onConflictDoNothing().returning();

    if (results.length === 0) {
      return null;
    }

    const source = await this.getRssSource(insertArticle.sourceId);
    if (source) {
      await this.updateRssSource(insertArticle.sourceId, { 
        totalArticles: source.totalArticles + 1,
        lastArticleDate: insertArticle.published_at || new Date()
      });
    }

    return results[0];
  }

  async updateRssArticle(id: string, updates: Partial<InsertRssArticle>): Promise<RssArticle | undefined> {
    const results = await db.update(rssArticlesTable)
      .set(updates)
      .where(eq(rssArticlesTable.id, id))
      .returning();
    return results[0];
  }

  async deleteRssArticle(id: string): Promise<boolean> {
    const analysesToDelete = await db.select().from(rssAnalysisTable).where(eq(rssAnalysisTable.articleId, id));
    for (const analysis of analysesToDelete) {
      await db.delete(rssAnalysisTable).where(eq(rssAnalysisTable.id, analysis.id));
    }
    const results = await db.delete(rssArticlesTable).where(eq(rssArticlesTable.id, id)).returning();
    return results.length > 0;
  }

  // RSS Analysis methods
  async getRssAnalyses(): Promise<RssAnalysis[]> {
    const results = await db.select().from(rssAnalysisTable).orderBy(rssAnalysisTable.updatedAt.desc());
    return results;
  }

  async getRssAnalysis(id: string): Promise<RssAnalysis | undefined> {
    const results = await db.select().from(rssAnalysisTable).where(eq(rssAnalysisTable.id, id));
    return results[0];
  }

  async getRssAnalysesByArticle(articleId: string): Promise<RssAnalysis[]> {
    const results = await db.select().from(rssAnalysisTable)
      .where(eq(rssAnalysisTable.articleId, articleId))
      .orderBy(rssAnalysisTable.createdAt.desc());
    return results;
  }

  async getRssAnalysesByType(analysisType: string): Promise<RssAnalysis[]> {
    const results = await db.select().from(rssAnalysisTable)
      .where(eq(rssAnalysisTable.analysisType, analysisType))
      .orderBy(rssAnalysisTable.createdAt.desc());
    return results;
  }

  async createRssAnalysis(insertAnalysis: InsertRssAnalysis): Promise<RssAnalysis> {
    const results = await db.insert(rssAnalysisTable).values(insertAnalysis).returning();
    return results[0];
  }

  async updateRssAnalysis(id: string, updates: Partial<InsertRssAnalysis>): Promise<RssAnalysis | undefined> {
    const results = await db.update(rssAnalysisTable)
      .set(updates)
      .where(eq(rssAnalysisTable.id, id))
      .returning();
    return results[0];
  }

  async deleteRssAnalysis(id: string): Promise<boolean> {
    const results = await db.delete(rssAnalysisTable).where(eq(rssAnalysisTable.id, id)).returning();
    return results.length > 0;
  }

  // RSS Comparison methods
  async getRssComparisons(): Promise<RssComparison[]> {
    const results = await db.select().from(rssComparisonsTable).orderBy(rssComparisonsTable.updatedAt.desc());
    return results;
  }

  async getRssComparison(id: string): Promise<RssComparison | undefined> {
    const results = await db.select().from(rssComparisonsTable).where(eq(rssComparisonsTable.id, id));
    return results[0];
  }

  async getRssComparisonsByType(comparisonType: string): Promise<RssComparison[]> {
    const results = await db.select().from(rssComparisonsTable)
      .where(eq(rssComparisonsTable.comparisonType, comparisonType))
      .orderBy(rssComparisonsTable.createdAt.desc());
    return results;
  }

  async getPublicRssComparisons(): Promise<RssComparison[]> {
    const results = await db.select().from(rssComparisonsTable)
      .where(eq(rssComparisonsTable.isPublic, true))
      .orderBy(rssComparisonsTable.createdAt.desc());
    return results;
  }

  async createRssComparison(insertComparison: InsertRssComparison): Promise<RssComparison> {
    const results = await db.insert(rssComparisonsTable).values(insertComparison).returning();
    return results[0];
  }

  async updateRssComparison(id: string, updates: Partial<InsertRssComparison>): Promise<RssComparison | undefined> {
    const results = await db.update(rssComparisonsTable)
      .set(updates)
      .where(eq(rssComparisonsTable.id, id))
      .returning();
    return results[0];
  }

  async deleteRssComparison(id: string): Promise<boolean> {
    const results = await db.delete(rssComparisonsTable).where(eq(rssComparisonsTable.id, id)).returning();
    return results.length > 0;
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

  async getTeamSeasonStatisticsFromDB(teamId: number, leagueId: number, season: number): Promise<any | null> {
    const { db } = await import('./db');
    const { teamSeasonStatistics } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const stats = await db
      .select()
      .from(teamSeasonStatistics)
      .where(
        and(
          eq(teamSeasonStatistics.teamId, teamId),
          eq(teamSeasonStatistics.leagueId, leagueId),
          eq(teamSeasonStatistics.season, season)
        )
      )
      .limit(1);

    return stats.length > 0 ? stats[0] : null;
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
    const results = await db.select().from(scenesTable).orderBy(scenesTable.updatedAt.desc());
    return results;
  }

  async getScene(id: string): Promise<Scene | undefined> {
    const results = await db.select().from(scenesTable).where(eq(scenesTable.id, id));
    return results[0];
  }

  async getScenesByLayout(layout: string): Promise<Scene[]> {
    const results = await db.select().from(scenesTable)
      .where(eq(scenesTable.layout, layout))
      .orderBy(scenesTable.updatedAt.desc());
    return results;
  }

  async getSceneTemplates(): Promise<Scene[]> {
    const results = await db.select().from(scenesTable)
      .where(eq(scenesTable.isTemplate, true))
      .orderBy(scenesTable.updatedAt.desc());
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
      .orderBy(scenesTable.updatedAt.desc());
    return results;
  }

  async createScene(insertScene: InsertScene): Promise<Scene> {
    // Ensure JSON fields are properly stringified
    const sceneData = {
      ...insertScene,
      elements: typeof insertScene.elements === 'string' 
        ? insertScene.elements 
        : JSON.stringify(insertScene.elements || []),
      background_config: typeof insertScene.background_config === 'string'
        ? insertScene.background_config
        : JSON.stringify(insertScene.background_config || {}),
      transition_config: typeof insertScene.transition_config === 'string'
        ? insertScene.transition_config
        : JSON.stringify(insertScene.transition_config || {})
    };

    const results = await db.insert(scenesTable).values(sceneData).returning();
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
    const results = await db.select().from(presentationSetsTable).orderBy(presentationSetsTable.updatedAt.desc());
    return results;
  }

  async getPresentationSet(id: string): Promise<PresentationSet | undefined> {
    const results = await db.select().from(presentationSetsTable).where(eq(presentationSetsTable.id, id));
    return results[0];
  }

  async getActivePresentationSets(): Promise<PresentationSet[]> {
    const results = await db.select().from(presentationSetsTable)
      .where(eq(presentationSetsTable.isActive, true))
      .orderBy(presentationSetsTable.updatedAt.desc());
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
    const results = await db.select().from(videoSourcesTable).orderBy(videoSourcesTable.updatedAt.desc());
    return results;
  }

  async getVideoSource(id: string): Promise<VideoSource | undefined> {
    const results = await db.select().from(videoSourcesTable).where(eq(videoSourcesTable.id, id));
    return results[0];
  }

  async createVideoSource(insertSource: InsertVideoSource): Promise<VideoSource> {
    if (insertSource.sourceType === 'youtube') {
      const config = insertSource.configJson as any;
      if (config?.youtubeUrl) {
        const videoId = this.extractYouTubeVideoId(config.youtubeUrl);
        if (videoId) {
          insertSource.configJson = {
            ...config,
            videoId,
            youtubeUrl: config.youtubeUrl
          };
        }
      }
    }
    const results = await db.insert(videoSourcesTable).values(insertSource).returning();
    return results[0];
  }

  async updateVideoSource(id: string, updates: Partial<InsertVideoSource>): Promise<VideoSource | undefined> {
    if (updates.sourceType === 'youtube' || (await this.getVideoSource(id))?.sourceType === 'youtube') {
      const config = updates.configJson as any;
      if (config?.youtubeUrl) {
        const videoId = this.extractYouTubeVideoId(config.youtubeUrl);
        if (videoId) {
          updates.configJson = {
            ...config,
            videoId,
            youtubeUrl: config.youtubeUrl
          };
        }
      }
    }
    const results = await db.update(videoSourcesTable)
      .set(updates)
      .where(eq(videoSourcesTable.id, id))
      .returning();
    return results[0];
  }

  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async deleteVideoSource(id: string): Promise<boolean> {
    const results = await db.delete(videoSourcesTable).where(eq(videoSourcesTable.id, id)).returning();
    return results.length > 0;
  }

  // Source Template methods
  async getSourceTemplates(): Promise<SourceTemplate[]> {
    const results = await db.select().from(sourceTemplatesTable).orderBy(sourceTemplatesTable.createdAt.desc());
    return results;
  }

  async getSourceTemplateById(id: string): Promise<SourceTemplate | undefined> {
    const results = await db.select().from(sourceTemplatesTable).where(eq(sourceTemplatesTable.id, id));
    return results[0];
  }

  async createSourceTemplate(template: InsertSourceTemplate): Promise<SourceTemplate> {
    const results = await db.insert(sourceTemplatesTable).values(template).returning();
    return results[0];
  }

  async updateSourceTemplate(id: string, template: Partial<InsertSourceTemplate>): Promise<SourceTemplate> {
    const results = await db.update(sourceTemplatesTable)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(sourceTemplatesTable.id, id))
      .returning();
    if (!results[0]) {
      throw new Error(`Source template with id ${id} not found`);
    }
    return results[0];
  }

  async deleteSourceTemplate(id: string): Promise<void> {
    await db.delete(sourceTemplatesTable).where(eq(sourceTemplatesTable.id, id));
  }

  // Set Template methods
  async getSetTemplates(): Promise<SetTemplate[]> {
    const results = await db.select().from(setTemplatesTable).orderBy(setTemplatesTable.createdAt.desc());
    return results;
  }

  async getSetTemplateById(id: string): Promise<SetTemplate | undefined> {
    const results = await db.select().from(setTemplatesTable).where(eq(setTemplatesTable.id, id));
    return results[0];
  }

  async createSetTemplate(template: InsertSetTemplate): Promise<SetTemplate> {
    const results = await db.insert(setTemplatesTable).values(template).returning();
    return results[0];
  }

  async updateSetTemplate(id: string, template: Partial<InsertSetTemplate>): Promise<SetTemplate> {
    const results = await db.update(setTemplatesTable)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(setTemplatesTable.id, id))
      .returning();
    if (!results[0]) {
      throw new Error(`Set template with id ${id} not found`);
    }
    return results[0];
  }

  async deleteSetTemplate(id: string): Promise<void> {
    await db.delete(setTemplatesTable).where(eq(setTemplatesTable.id, id));
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
      name: preset.name,
      category: preset.category || 'Custom',
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

  // Template methods
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(template => template.category === category)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getTemplatesByType(templateType: string): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(template => template.templateType === templateType)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getActiveTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(template => template.isActive)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = randomUUID();
    const now = new Date();
    const template: Template = {
      id,
      name: insertTemplate.name,
      description: insertTemplate.description || '',
      category: insertTemplate.category,
      templateType: insertTemplate.templateType,
      styling: insertTemplate.styling || {},
      defaultContent: insertTemplate.defaultContent || {},
      isActive: insertTemplate.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };
    this.templates.set(id, template);
    return template;
  }

  async updateTemplate(id: string, updates: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;

    const updated: Template = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  // Ticker Config methods
  async getTickerConfig(): Promise<{
    speed: number;
    activeFeeds: string[];
    style: {
      backgroundColor: string;
      textColor: string;
      fontSize: number;
      height: number;
    };
    mode: string;
    autoRefresh: boolean;
    refreshInterval: number;
  }> {
    return { ...this.tickerConfig };
  }

  async updateTickerConfig(config: Partial<{
    speed: number;
    activeFeeds: string[];
    style: {
      backgroundColor: string;
      textColor: string;
      fontSize: number;
      height: number;
    };
    mode: string;
    autoRefresh: boolean;
    refreshInterval: number;
  }>): Promise<void> {
    if (config.style) {
      this.tickerConfig.style = {
        ...this.tickerConfig.style,
        ...config.style
      };
    }

    if (config.speed !== undefined) {
      this.tickerConfig.speed = config.speed;
    }
    if (config.activeFeeds !== undefined) {
      this.tickerConfig.activeFeeds = config.activeFeeds;
    }
    if (config.mode !== undefined) {
      this.tickerConfig.mode = config.mode;
    }
    if (config.autoRefresh !== undefined) {
      this.tickerConfig.autoRefresh = config.autoRefresh;
    }
    if (config.refreshInterval !== undefined) {
      this.tickerConfig.refreshInterval = config.refreshInterval;
    }
  }

  // Live State methods
  async getLiveState(): Promise<LiveState | undefined> {
    try {
      const states = await db
        .select()
        .from(liveStatesTable)
        .where(eq(liveStatesTable.id, 1))
        .limit(1);

      if (states.length > 0) {
        return states[0];
      }

      // Return in-memory fallback if no database state
      return this.liveState;
    } catch (error) {
      console.error('Error fetching live state from database:', error);
      return this.liveState;
    }
  }

  async updateLiveState(updates: Partial<InsertLiveState>): Promise<LiveState> {
    try {
      const existing = await this.getLiveState();
      if (existing) {
        const results = await db.update(liveStatesTable)
          .set({ ...updates, updated_at: new Date() })
          .where(eq(liveStatesTable.id, 1))
          .returning();
        return results[0];
      } else {
        const results = await db.insert(liveStatesTable)
          .values({ id: 1, key: 'default', ...updates })
          .returning();
        return results[0];
      }
    } catch (error: any) {
      console.warn('Error updating live state (table/column may not exist):', error.message);
      // Return a default live state object
      return {
        id: 0,
        key: 'default',
        value: updates.value || null,
        updated_at: new Date()
      };
    }
  }

  // Recording methods
  async getRecordings(): Promise<Recording[]> {
    try {
      const recordings = await db
        .select()
        .from(recordingsTable)
        .orderBy(desc(recordingsTable.createdAt));
      return recordings;
    } catch (error) {
      console.error('Error fetching recordings from database:', error);
      // Fallback to in-memory if database fails
      return Array.from(this.recordings.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  async getRecording(id: string): Promise<Recording | undefined> {
    const results = await db.select().from(recordingsTable).where(eq(recordingsTable.id, id));
    return results[0];
  }

  async createRecording(recording: InsertRecording): Promise<Recording> {
    const results = await db.insert(recordingsTable).values(recording).returning();
    return results[0];
  }

  async updateRecording(id: string, updates: Partial<InsertRecording>): Promise<Recording | undefined> {
    const results = await db.update(recordingsTable)
      .set(updates)
      .where(eq(recordingsTable.id, id))
      .returning();
    return results[0];
  }

  async deleteRecording(id: string): Promise<boolean> {
    await db.delete(recordingsTable).where(eq(recordingsTable.id, id));
    return true;
  }

  // Video Project methods
  async getVideoProjects(): Promise<VideoProject[]> {
    const results = await db.select().from(videoProjectsTable).orderBy(videoProjectsTable.createdAt.desc());
    return results;
  }

  async getVideoProject(id: string): Promise<VideoProject | undefined> {
    const results = await db.select().from(videoProjectsTable).where(eq(videoProjectsTable.id, id));
    return results[0];
  }

  async createVideoProject(project: InsertVideoProject): Promise<VideoProject> {
    const results = await db.insert(videoProjectsTable).values(project).returning();
    return results[0];
  }

  async updateVideoProject(id: string, updates: Partial<InsertVideoProject>): Promise<VideoProject | undefined> {
    const results = await db.update(videoProjectsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoProjectsTable.id, id))
      .returning();
    return results[0];
  }

  async deleteVideoProject(id: string): Promise<boolean> {
    await db.delete(videoClipsTable).where(eq(videoClipsTable.projectId, id));
    await db.delete(videoProjectsTable).where(eq(videoProjectsTable.id, id));
    return true;
  }

  // Video Clip methods
  async getVideoClips(projectId: string): Promise<VideoClip[]> {
    const results = await db.select().from(videoClipsTable)
      .where(eq(videoClipsTable.projectId, projectId))
      .orderBy(videoClipsTable.order);
    return results;
  }

  async getVideoClip(id: string): Promise<VideoClip | undefined> {
    const results = await db.select().from(videoClipsTable).where(eq(videoClipsTable.id, id));
    return results[0];
  }

  async createVideoClip(clip: InsertVideoClip): Promise<VideoClip> {
    const results = await db.insert(videoClipsTable).values(clip).returning();
    return results[0];
  }

  async updateVideoClip(id: string, updates: Partial<InsertVideoClip>): Promise<VideoClip | undefined> {
    const results = await db.update(videoClipsTable)
      .set(updates)
      .where(eq(videoClipsTable.id, id))
      .returning();
    return results[0];
  }

  async deleteVideoClip(id: string): Promise<boolean> {
    await db.delete(videoClipsTable).where(eq(videoClipsTable.id, id));
    return true;
  }

  // Text Overlay methods
  async getTextOverlays(projectId: string): Promise<import("@shared/schema").TextOverlay[]> {
    const results = await db.select().from(textOverlaysTable)
      .where(eq(textOverlaysTable.projectId, projectId))
      .orderBy(textOverlaysTable.startTime);
    return results;
  }

  async getTextOverlay(id: string): Promise<import("@shared/schema").TextOverlay | undefined> {
    const results = await db.select().from(textOverlaysTable).where(eq(textOverlaysTable.id, id));
    return results[0];
  }

  async createTextOverlay(overlay: import("@shared/schema").InsertTextOverlay): Promise<import("@shared/schema").TextOverlay> {
    const results = await db.insert(textOverlaysTable).values(overlay).returning();
    return results[0];
  }

  async updateTextOverlay(id: string, updates: Partial<import("@shared/schema").InsertTextOverlay>): Promise<import("@shared/schema").TextOverlay | undefined> {
    const results = await db.update(textOverlaysTable)
      .set(updates)
      .where(eq(textOverlaysTable.id, id))
      .returning();
    return results[0];
  }

  async deleteTextOverlay(id: string): Promise<boolean> {
    await db.delete(textOverlaysTable).where(eq(textOverlaysTable.id, id));
    return true;
  }

  // Keyframe methods
  async getKeyframes(clipId: string): Promise<import("@shared/schema").Keyframe[]> {
    const results = await db.select().from(keyframesTable)
      .where(eq(keyframesTable.clipId, clipId))
      .orderBy(keyframesTable.time);
    return results;
  }

  async getKeyframe(id: string): Promise<import("@shared/schema").Keyframe | undefined> {
    const results = await db.select().from(keyframesTable).where(eq(keyframesTable.id, id));
    return results[0];
  }

  async createKeyframe(keyframe: import("@shared/schema").InsertKeyframe): Promise<import("@shared/schema").Keyframe> {
    const results = await db.insert(keyframesTable).values(keyframe).returning();
    return results[0];
  }

  async updateKeyframe(id: string, updates: Partial<import("@shared/schema").InsertKeyframe>): Promise<import("@shared/schema").Keyframe | undefined> {
    const results = await db.update(keyframesTable)
      .set(updates)
      .where(eq(keyframesTable.id, id))
      .returning();
    return results[0];
  }

  async deleteKeyframe(id: string): Promise<boolean> {
    await db.delete(keyframesTable).where(eq(keyframesTable.id, id));
    return true;
  }

  // Audio Track methods
  async getAudioTracks(projectId: string): Promise<import("@shared/schema").AudioTrack[]> {
    const results = await db.select().from(audioTracksTable)
      .where(eq(audioTracksTable.projectId, projectId))
      .orderBy(audioTracksTable.startTime);
    return results;
  }

  async getAudioTrack(id: string): Promise<import("@shared/schema").AudioTrack | undefined> {
    const results = await db.select().from(audioTracksTable).where(eq(audioTracksTable.id, id));
    return results[0];
  }

  async createAudioTrack(track: import("@shared/schema").InsertAudioTrack): Promise<import("@shared/schema").AudioTrack> {
    const results = await db.insert(audioTracksTable).values(track).returning();
    return results[0];
  }

  async updateAudioTrack(id: string, updates: Partial<import("@shared/schema").InsertAudioTrack>): Promise<import("@shared/schema").AudioTrack | undefined> {
    const results = await db.update(audioTracksTable)
      .set(updates)
      .where(eq(audioTracksTable.id, id))
      .returning();
    return results[0];
  }

  async deleteAudioTrack(id: string): Promise<boolean> {
    await db.delete(audioTracksTable).where(eq(audioTracksTable.id, id));
    return true;
  }

  // Render Job methods
  async getRenderJobs(): Promise<RenderJob[]> {
    const results = await db.select().from(renderJobsTable).orderBy(renderJobsTable.createdAt.desc());
    return results;
  }

  async getRenderJob(id: string): Promise<RenderJob | undefined> {
    const results = await db.select().from(renderJobsTable).where(eq(renderJobsTable.id, id));
    return results[0];
  }

  async getProjectRenderJobs(projectId: string): Promise<RenderJob[]> {
    const results = await db.select().from(renderJobsTable)
      .where(eq(renderJobsTable.projectId, projectId))
      .orderBy(renderJobsTable.createdAt.desc());
    return results;
  }

  async createRenderJob(job: InsertRenderJob): Promise<RenderJob> {
    const results = await db.insert(renderJobsTable).values(job).returning();
    return results[0];
  }

  async updateRenderJob(id: string, updates: Partial<InsertRenderJob>): Promise<RenderJob | undefined> {
    const results = await db.update(renderJobsTable)
      .set(updates)
      .where(eq(renderJobsTable.id, id))
      .returning();
    return results[0];
  }

  async deleteRenderJob(id: string): Promise<boolean> {
    await db.delete(renderJobsTable).where(eq(renderJobsTable.id, id));
    return true;
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
    const rssArticlesCount = await db.select().from(rssArticlesTable);
    const rssArticles = rssArticlesCount.length;
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

  async getDefaultOverlayTemplates(): Promise<any> {
    const currentSeason = new Date().getFullYear();

    return {
      playerStats: {
        id: 'default-player-stats',
        metricType: 'player-stats',
        metricData: { 
          playerId: 306,
          season: currentSeason 
        },
        position: 'bottom',
        width: 25,
        height: 200,
        x: 10,
        y: 75,
        opacity: 0.92,
        visible: true,
      },
      h2hCard: {
        id: 'default-h2h',
        metricType: 'h2h-card',
        metricData: { 
          homeTeamId: 40,
          awayTeamId: 47
        },
        position: 'bottom',
        width: 28,
        height: 160,
        x: 50,
        y: 80,
        opacity: 0.92,
        visible: true,
      },
      formGuide: {
        id: 'default-form-guide',
        metricType: 'form-guide',
        metricData: { 
          teamId: 40,
          leagueId: 39
        },
        position: 'top',
        width: 30,
        height: 100,
        x: 30,
        y: 10,
        opacity: 0.92,
        visible: true,
      },
      leagueTable: {
        id: 'default-league-table',
        metricType: 'league-table',
        metricData: {
          leagueId: 39,
          highlightTeamId: 40
        },
        position: 'bottom',
        width: 20,
        height: 300,
        x: 65,
        y: 75,
        opacity: 0.92,
        visible: true,
      },
      rssSentiment: {
        id: 'default-rss-sentiment',
        metricType: 'rss-sentiment',
        metricData: {
          teamName: 'Liverpool'
        },
        position: 'top',
        width: 25,
        height: 85,
        x: 60,
        y: 5,
        opacity: 0.92,
        visible: true,
      }
    };
  }

  async createDataImport(data: InsertDataImport): Promise<SelectDataImport> {
    const results = await db.insert(dataImportsTable).values(data).returning();
    return results[0];
  }

  async getDataImports(): Promise<SelectDataImport[]> {
    const results = await db.select().from(dataImportsTable).orderBy(dataImportsTable.created_at.desc());
    return results;
  }

  async updateDataImport(id: number, data: Partial<InsertDataImport>): Promise<SelectDataImport> {
    const results = await db.update(dataImportsTable)
      .set(data)
      .where(eq(dataImportsTable.id, id))
      .returning();
    return results[0];
  }
}

export const storage = new MemStorage();