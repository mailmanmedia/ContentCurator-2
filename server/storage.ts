import { 
  type User, type InsertUser, 
  type Image, type InsertImage,
  type PresentationStyle, type InsertPresentationStyle,
  type Report, type InsertReport,
  type ReportRendering, type InsertReportRendering
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private images: Map<string, Image>;
  private presentationStyles: Map<string, PresentationStyle>;
  private reports: Map<string, Report>;
  private reportRenderings: Map<string, ReportRendering>;

  constructor() {
    this.users = new Map();
    this.images = new Map();
    this.presentationStyles = new Map();
    this.reports = new Map();
    this.reportRenderings = new Map();
    
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
}

export const storage = new MemStorage();
