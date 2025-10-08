import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertImageSchema, 
  insertPresentationStyleSchema,
  insertReportSchema,
  insertReportRenderingSchema,
  insertFrameworkCategorySchema,
  insertFrameworkSchema,
  insertFrameworkVersionSchema,
  insertRssSourceSchema,
  insertRssArticleSchema,
  insertRssAnalysisSchema,
  insertRssComparisonSchema,
  insertLibraryItemSchema,
  insertSceneSchema,
  insertPresentationSetSchema,
  insertTickerPlaylistSchema,
  insertVideoSourceSchema,
  insertSourceTemplateSchema,
  insertSetTemplateSchema,
  insertTemplateSchema,
  type LiveState
} from "@shared/schema";
import OpenAI from "openai";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import express from "express";
import { renderPresentation, wrapWithSecurityHeaders } from "./presentation/renderer";
import { rssService } from "./rss/rssService";
import { footballService } from "./football/footballService";
import { iCalService } from "./football/iCalService";
import { updateAllPremierLeagueStats } from "./football/statsScheduler";
import { getAllSceneTemplates, getSceneTemplate } from "./templates/sceneTemplates";
import { renderOBSScene } from "./obs/obsRenderer";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { db } from "./db";
import { teamSeasonStatistics, teamMatchupAnalysis, footballTeams, footballPlayers, playerSeasonStatistics, footballFixtures, footballCompetitions, historicalHeadToHead } from "@shared/schema";
import { desc, eq, and, gte, lte, or, inArray } from "drizzle-orm";
import { analyzeCutPoints, optimizePacing } from "./video/autoCutter";
import { addRenderJob } from "./video/renderQueue";
import { insertVideoProjectSchema, insertVideoClipSchema } from "@shared/schema";

// Initialize OpenAI with error handling
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Multer configuration for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files but explicitly block SVGs for security
    if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
      cb(null, true);
    } else {
      cb(new Error('Only safe image files are allowed (SVG files blocked for security)'));
    }
  }
});

// Multer configuration for document uploads
const document_storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const documentUpload = multer({
  storage: document_storage_config,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF and Word documents
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// Multer configuration for video recordings
const video_storage_config = multer.diskStorage({
  destination: async (req, file, cb) => {
    const videosDir = '/tmp/videos/';
    try {
      await fs.mkdir(videosDir, { recursive: true });
      cb(null, videosDir);
    } catch (error: any) {
      cb(error, videosDir);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const uniqueSuffix = Math.round(Math.random() * 1E9);
    cb(null, `recording-${timestamp}-${uniqueSuffix}.webm`);
  }
});

const videoUpload = multer({
  storage: video_storage_config,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for video files
  },
  fileFilter: (req, file, cb) => {
    // Allow only video files
    const allowedMimes = [
      'video/webm',
      'video/mp4',
      'video/x-matroska',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only WebM, MP4, and MKV video files are allowed'));
    }
  }
});

// Server-Sent Events Manager for Live Presentation Control
class LiveSSEManager {
  private clients: Map<string, express.Response> = new Map();
  private updateThrottle: Map<string, number> = new Map();
  private readonly MAX_UPDATES_PER_SEC = 15;

  addClient(clientId: string, res: express.Response) {
    this.clients.set(clientId, res);
    this.updateThrottle.set(clientId, 0);
    
    // Send initial connection event
    this.sendToClient(clientId, 'connected', { 
      timestamp: new Date().toISOString(),
      clientId 
    });
    
    console.log(`Live SSE client connected: ${clientId} (total: ${this.clients.size})`);
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
    this.updateThrottle.delete(clientId);
    console.log(`Live SSE client disconnected: ${clientId} (total: ${this.clients.size})`);
  }

  broadcast(eventType: string, data: any) {
    const now = Date.now();
    const message = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    for (const [clientId, res] of Array.from(this.clients.entries())) {
      // Throttle updates per client
      const lastUpdate = this.updateThrottle.get(clientId) || 0;
      if (now - lastUpdate < 1000 / this.MAX_UPDATES_PER_SEC) {
        continue; // Skip if too frequent
      }

      try {
        res.write(`data: ${JSON.stringify(message)}\n\n`);
        this.updateThrottle.set(clientId, now);
      } catch (error) {
        console.error(`Error sending SSE to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  sendToClient(clientId: string, eventType: string, data: any) {
    const res = this.clients.get(clientId);
    if (!res) return;

    const message = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    try {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error(`Error sending SSE to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

const liveSSEManager = new LiveSSEManager();

// Simple token-based authentication for live control commands
const controlTokens = new Map<string, { expires: Date; permissions: string[] }>();

function generateControlToken(permissions: string[] = ['basic']): string {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  controlTokens.set(token, { expires, permissions });
  
  // Cleanup expired tokens
  setTimeout(() => {
    for (const [key, value] of Array.from(controlTokens.entries())) {
      if (value.expires < new Date()) {
        controlTokens.delete(key);
      }
    }
  }, 60000); // Check every minute

  return token;
}

function validateControlToken(token: string, requiredPermission: string = 'basic'): boolean {
  const tokenData = controlTokens.get(token);
  if (!tokenData) return false;
  
  if (tokenData.expires < new Date()) {
    controlTokens.delete(token);
    return false;
  }
  
  return tokenData.permissions.includes(requiredPermission) || tokenData.permissions.includes('admin');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  app.use('/uploads', express.static('uploads'));
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Statistics endpoint
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // AI Suggestions endpoint
  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Fallback suggestions if OpenAI is not available
      if (!openai) {
        const fallbackSuggestions = [
          "Tactical Analysis: How Arne Slot's Formation Changes Are Revolutionizing Liverpool's Attack",
          "Player Spotlight: Mo Salah's Evolution Under Klopp vs Slot - Statistical Breakdown",
          "Transfer Talk: Liverpool's Summer Signings - Hit or Miss? Performance Review",
          "Match Analysis: Breaking Down Liverpool's Defensive Shape Against Top 6 Teams",
          "Future Focus: Liverpool's Academy Stars - Who's Next to Break Into the First Team?"
        ];
        return res.json({ suggestions: fallbackSuggestions });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant specialized in creating engaging Liverpool FC YouTube content for Mailman Media. Generate creative, data-driven content suggestions that would appeal to Liverpool fans and YouTube audiences. Focus on tactical analysis, player performance, transfer insights, and match analysis. Return ONLY a JSON array of 5 suggestions as strings. Context: ${context || 'Liverpool FC YouTube content'}`
          },
          {
            role: "user",
            content: `Generate 5 creative content suggestions based on this prompt: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content || "";
      
      // Parse JSON response with fallback
      let suggestions;
      try {
        const parsed = JSON.parse(content);
        suggestions = parsed.suggestions || parsed.data || Object.values(parsed);
      } catch {
        // Fallback to text parsing if JSON fails
        suggestions = content.split('\n').filter(line => line.trim()).slice(0, 5);
      }

      res.json({ suggestions });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      
      // Fallback suggestions on error
      const fallbackSuggestions = [
        "Liverpool Squad Analysis: Strengths and Weaknesses This Season",
        "Tactical Deep Dive: How Liverpool Press High Under Slot",
        "Player Performance: Rating Every Liverpool Player So Far",
        "Transfer Rumors: What Liverpool Need in January Window",
        "Match Preview: Key Battles in Liverpool's Next Fixture"
      ];
      
      res.json({ suggestions: fallbackSuggestions });
    }
  });

  // Generate Variations endpoint
  app.post("/api/ai/generate-variations", async (req, res) => {
    const { 
      text, 
      images = [], 
      stats = [], 
      ideas = [], 
      outputType, 
      style, 
      priority,
      opponent,
      competition,
      venue,
      hookFormula,
      matchTiming = [],
      targetAudience = [],
      contentGoal = []
    } = req.body;
    
    // Define fallback variations function accessible to both try and catch blocks
    const createFallbackVariations = () => [
      {
        type: outputType || 'content',
        title: `${style?.split(' - ')[0] || 'Liverpool'} Analysis`,
        description: `Comprehensive analysis focusing on ${text?.substring(0, 100) || 'Liverpool FC content'}...`,
        confidence: 85
      },
      {
        type: outputType || 'content',
        title: `Data-Driven ${outputType || 'Content'}`,
        description: `Statistical breakdown with visual emphasis on key metrics`,
        confidence: 78
      },
      {
        type: outputType || 'content',
        title: `Tactical Deep Dive`,
        description: `Formation and strategy analysis with interactive elements`,
        confidence: 82
      },
      {
        type: outputType || 'content',
        title: `Fan Engagement Focus`,
        description: `Community-driven content with interactive polls and reactions`,
        confidence: 75
      }
    ];
    
    try {
      // Check if at least one editorial brief field has content
      const hasEditorialBriefContent = !!(
        opponent ||
        competition ||
        venue ||
        hookFormula ||
        (matchTiming && matchTiming.length > 0) ||
        (targetAudience && targetAudience.length > 0) ||
        (contentGoal && contentGoal.length > 0)
      );

      // Require either custom prompt OR at least one editorial brief field, plus output type
      const hasContent = text || hasEditorialBriefContent;
      
      if (!hasContent || !outputType) {
        return res.status(400).json({ 
          error: "Please provide either a custom prompt or fill at least one editorial brief field, and select an output type" 
        });
      }

      if (!openai) {
        return res.json({ variations: createFallbackVariations() });
      }

      // Build context prompt with both custom prompt and editorial brief fields
      const contextPrompt = `
        Content: ${text || 'N/A'}
        ${opponent ? `Opponent: ${opponent}` : ''}
        ${competition ? `Competition: ${competition}` : ''}
        ${venue ? `Venue: ${venue}` : ''}
        ${hookFormula ? `Hook Formula: ${hookFormula}` : ''}
        ${matchTiming.length > 0 ? `Match Timing: ${matchTiming.join(', ')}` : ''}
        ${targetAudience.length > 0 ? `Target Audience: ${targetAudience.join(', ')}` : ''}
        ${contentGoal.length > 0 ? `Content Goal: ${contentGoal.join(', ')}` : ''}
        Images: ${images.join(', ')}
        Stats: ${stats.join(', ')}
        Ideas: ${ideas.join(', ')}
        Output Type: ${outputType}
        Style: ${style}
        Priority: ${priority}
      `.trim();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert content creator for Liverpool FC YouTube channel Mailman Media. Generate 3-5 distinct variations for the requested content type. Each variation should be unique in approach, angle, or presentation style. Return ONLY a JSON object with "variations" array containing objects with: type, title, description, and confidence (0-100).`
          },
          {
            role: "user",
            content: `Create variations for this Liverpool FC content: ${contextPrompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content || "";
      
      // Try to parse JSON with better error handling
      let variations;
      try {
        const parsed = JSON.parse(content);
        variations = parsed.variations || parsed.data || [parsed]; // Handle different response structures
        if (!Array.isArray(variations)) {
          variations = createFallbackVariations();
        }
      } catch {
        variations = createFallbackVariations();
      }

      res.json({ variations });
    } catch (error) {
      console.error('Error generating variations:', error);
      // Always return a controlled response with fallback data
      res.json({ variations: createFallbackVariations() });
    }
  });

  // Image Search endpoint using Perplexity
  app.post("/api/ai/search-images", async (req, res) => {
    const { query } = req.body;
    
    try {
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      // Create structured image suggestions (using fallback approach for reliability)
      const imageSuggestions = [
        {
          title: `${query} - Action Shot`,
          description: `High-resolution action photo of ${query} during Liverpool FC match`,
          suggestedSources: ['Official Liverpool FC Media', 'Getty Images', 'Reuters Sports'],
          tags: [query, 'action', 'liverpool fc', 'football'],
          category: 'Players'
        },
        {
          title: `${query} - Portrait`,
          description: `Professional portrait or headshot of ${query}`,
          suggestedSources: ['Liverpool FC Official Website', 'Premier League Media'],
          tags: [query, 'portrait', 'liverpool fc'],
          category: 'Players'
        },
        {
          title: `${query} - Celebration`,
          description: `Celebration moment featuring ${query}`,
          suggestedSources: ['Match Highlights', 'Social Media', 'Sports Photography'],
          tags: [query, 'celebration', 'liverpool fc', 'goal'],
          category: 'Moments'
        }
      ];

      // For production, we use structured fallback suggestions for reliability
      // Perplexity API can be unstable and cause unnecessary failures
      if (process.env.PERPLEXITY_API_KEY) {
        try {
          // Use Perplexity to enhance suggestions (optional)
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-online',
              messages: [
                {
                  role: 'user',
                  content: `Find and suggest high-quality image sources for: ${query}. Focus on Liverpool FC, football, or sports-related content. Provide suggestions for where to find these images with descriptions of what types of images would work best.`
                }
              ]
            })
          });

          if (perplexityResponse.ok) {
            const perplexityData = await perplexityResponse.json();
            const searchResults = perplexityData.choices[0]?.message?.content || "";
            
            res.json({ 
              results: searchResults,
              suggestions: imageSuggestions,
              query,
              enhanced: true
            });
            return;
          }
        } catch (error) {
          console.warn('Perplexity API unavailable, using fallback suggestions:', error);
        }
      }

      // Return reliable fallback suggestions
      res.json({ 
        results: `Found relevant image suggestions for ${query}. Check the suggestions below for specific source recommendations.`,
        suggestions: imageSuggestions,
        query 
      });
    } catch (error) {
      console.error('Error searching images:', error);
      // Always return suggestions even on error
      const fallbackSuggestions = [
        {
          title: `${query || 'Liverpool FC'} - General Search`,
          description: `General Liverpool FC content related to ${query || 'the club'}`,
          suggestedSources: ['Official Liverpool FC Website', 'Getty Images'],
          tags: [query || 'liverpool fc', 'football'],
          category: 'General'
        }
      ];
      
      res.json({
        results: `Search for "${query || 'images'}" completed. Found relevant Liverpool FC content.`,
        suggestions: fallbackSuggestions,
        query: query || ''
      });
    }
  });

  // Image Management Routes
  
  // Get all images
  app.get("/api/images", async (req, res) => {
    try {
      const { category, search } = req.query;
      
      let images;
      if (search) {
        images = await storage.searchImages(search as string);
      } else if (category && category !== 'All') {
        images = await storage.getImagesByCategory(category as string);
      } else {
        images = await storage.getImages();
      }
      
      res.json({ images });
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Create new image
  app.post("/api/images", async (req, res) => {
    try {
      const validatedData = insertImageSchema.parse(req.body);
      const image = await storage.createImage(validatedData);
      res.status(201).json({ image });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid image data", details: error.errors });
      }
      console.error('Error creating image:', error);
      res.status(500).json({ error: "Failed to create image" });
    }
  });

  // Update image
  app.patch("/api/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedImage = await storage.updateImage(id, updates);
      if (!updatedImage) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.json({ image: updatedImage });
    } catch (error) {
      console.error('Error updating image:', error);
      res.status(500).json({ error: "Failed to update image" });
    }
  });

  // Delete image
  app.delete("/api/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get image info before deletion to clean up files
      const image = await storage.getImages().then(images => images.find(img => img.id === id));
      
      const deleted = await storage.deleteImage(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Clean up associated files
      if (image?.url && image.url.startsWith('/uploads/')) {
        try {
          await fs.unlink(path.join(process.cwd(), image.url));
        } catch (err) {
          console.warn('Could not delete image file:', image.url);
        }
      }
      
      if (image?.thumbnail && image.thumbnail.startsWith('/uploads/')) {
        try {
          await fs.unlink(path.join(process.cwd(), image.thumbnail));
        } catch (err) {
          console.warn('Could not delete thumbnail file:', image.thumbnail);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // File upload endpoint
  app.post("/api/images/upload", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { title, description, category } = req.body;
      
      // Generate thumbnail
      const thumbnailPath = `uploads/thumbnails/thumb-${req.file.filename}`;
      await sharp(req.file.path)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Create image record in storage
      const imageData = {
        name: title || path.parse(req.file.originalname).name,
        description: description || '',
        category: category || 'General',
        url: `/uploads/images/${req.file.filename}`,
        thumbnail: `/${thumbnailPath}`,
        size: `${Math.round(req.file.size / 1024)}KB`,
        type: req.file.mimetype.split('/')[1],
        tags: [],
        fileSize: req.file.size.toString(),
        fileName: req.file.originalname,
        mimeType: req.file.mimetype
      };

      const validatedData = insertImageSchema.parse(imageData);
      const image = await storage.createImage(validatedData);
      
      res.status(201).json({ image });
    } catch (error) {
      // Clean up uploaded file if processing failed
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.warn('Could not clean up uploaded file:', req.file.path);
        }
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid image data", details: error.errors });
      }
      console.error('Error uploading image:', error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // ===== PRESENTATION ENGINE ROUTES =====

  // Get all presentation styles
  app.get("/api/presentation/styles", async (req, res) => {
    try {
      const styles = await storage.getPresentationStyles();
      res.json({ styles });
    } catch (error) {
      console.error('Error getting presentation styles:', error);
      res.status(500).json({ error: "Failed to get presentation styles" });
    }
  });

  // Get presentation style by key
  app.get("/api/presentation/styles/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const style = await storage.getPresentationStyleByKey(key);
      
      if (!style) {
        return res.status(404).json({ error: "Presentation style not found" });
      }
      
      res.json({ style });
    } catch (error) {
      console.error('Error getting presentation style:', error);
      res.status(500).json({ error: "Failed to get presentation style" });
    }
  });

  // Create presentation style
  app.post("/api/presentation/styles", async (req, res) => {
    try {
      const validatedData = insertPresentationStyleSchema.parse(req.body);
      const style = await storage.createPresentationStyle(validatedData);
      res.status(201).json({ style });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid style data", details: error.errors });
      }
      console.error('Error creating presentation style:', error);
      res.status(500).json({ error: "Failed to create presentation style" });
    }
  });

  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json({ reports });
    } catch (error) {
      console.error('Error getting reports:', error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  // Get report by ID
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getReport(id);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      res.json({ report });
    } catch (error) {
      console.error('Error getting report:', error);
      res.status(500).json({ error: "Failed to get report" });
    }
  });

  // Create report
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.status(201).json({ report });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid report data", details: error.errors });
      }
      console.error('Error creating report:', error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Update report
  app.patch("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertReportSchema.partial().parse(req.body);
      const report = await storage.updateReport(id, validatedData);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      res.json({ report });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid report data", details: error.errors });
      }
      console.error('Error updating report:', error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  // Delete report
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteReport(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // Render report in specific style
  app.get("/api/reports/:id/render", async (req, res) => {
    try {
      const { id } = req.params;
      const { style: styleKey = 'claudeArtifact' } = req.query as { style?: string };
      
      // Get report
      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Get style
      const style = await storage.getPresentationStyleByKey(styleKey);
      if (!style) {
        return res.status(404).json({ error: "Presentation style not found" });
      }
      
      // Check for existing rendering
      let rendering = await storage.getReportRendering(id, styleKey);
      
      if (!rendering) {
        // Generate new rendering
        const renderedContent = await renderPresentation(report, style);
        
        const renderingData = {
          reportId: id,
          styleKey: styleKey,
          contentHtml: renderedContent.html,
          blocksJson: renderedContent.blocks,
          metaJson: renderedContent.meta
        };
        
        const validatedData = insertReportRenderingSchema.parse(renderingData);
        rendering = await storage.createReportRendering(validatedData);
      }
      
      res.json({ 
        rendering,
        report,
        style
      });
    } catch (error) {
      console.error('Error rendering report:', error);
      res.status(500).json({ error: "Failed to render report" });
    }
  });

  // Re-render report (clear cache and generate new)
  app.post("/api/reports/:id/render", async (req, res) => {
    try {
      const { id } = req.params;
      const { style: styleKey = 'claudeArtifact' } = req.body;
      
      // Get report
      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Get style
      const style = await storage.getPresentationStyleByKey(styleKey);
      if (!style) {
        return res.status(404).json({ error: "Presentation style not found" });
      }
      
      // Generate new rendering
      const renderedContent = await renderPresentation(report, style);
      
      const renderingData = {
        reportId: id,
        styleKey: styleKey,
        contentHtml: renderedContent.html,
        blocksJson: renderedContent.blocks,
        metaJson: renderedContent.meta
      };
      
      const validatedData = insertReportRenderingSchema.parse(renderingData);
      const rendering = await storage.createReportRendering(validatedData);
      
      res.json({ 
        rendering,
        report,
        style
      });
    } catch (error) {
      console.error('Error re-rendering report:', error);
      res.status(500).json({ error: "Failed to re-render report" });
    }
  });

  // Export report as secure HTML
  app.get("/api/reports/:id/export", async (req, res) => {
    try {
      const { id } = req.params;
      const { style: styleKey = 'claudeArtifact' } = req.query as { style?: string };
      
      // Get report
      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Get style
      const style = await storage.getPresentationStyleByKey(styleKey);
      if (!style) {
        return res.status(404).json({ error: "Presentation style not found" });
      }
      
      // Get or generate rendering
      let rendering = await storage.getReportRendering(id, styleKey);
      
      if (!rendering) {
        // Generate new rendering
        const renderedContent = await renderPresentation(report, style);
        
        const renderingData = {
          reportId: id,
          styleKey: styleKey,
          contentHtml: renderedContent.html,
          blocksJson: renderedContent.blocks,
          metaJson: renderedContent.meta
        };
        
        const validatedData = insertReportRenderingSchema.parse(renderingData);
        rendering = await storage.createReportRendering(validatedData);
      }
      
      // Generate secure HTML with CSP headers
      const secureHtml = wrapWithSecurityHeaders(rendering.contentHtml, report.title);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-zA-Z0-9]/g, '-')}-${styleKey}.html"`);
      res.send(secureHtml);
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ error: "Failed to export report" });
    }
  });

  // Framework Categories API Routes
  app.get("/api/framework-categories", async (req, res) => {
    try {
      const categories = await storage.getFrameworkCategories();
      res.json({ categories });
    } catch (error) {
      console.error('Error fetching framework categories:', error);
      res.status(500).json({ error: "Failed to fetch framework categories" });
    }
  });

  app.post("/api/framework-categories", async (req, res) => {
    try {
      const validatedData = insertFrameworkCategorySchema.parse(req.body);
      const category = await storage.createFrameworkCategory(validatedData);
      res.json({ category });
    } catch (error) {
      console.error('Error creating framework category:', error);
      res.status(500).json({ error: "Failed to create framework category" });
    }
  });

  app.put("/api/framework-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFrameworkCategorySchema.partial().parse(req.body);
      const category = await storage.updateFrameworkCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ error: "Framework category not found" });
      }
      
      res.json({ category });
    } catch (error) {
      console.error('Error updating framework category:', error);
      res.status(500).json({ error: "Failed to update framework category" });
    }
  });

  app.delete("/api/framework-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFrameworkCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Framework category not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting framework category:', error);
      res.status(500).json({ error: "Failed to delete framework category" });
    }
  });

  // Framework API Routes
  app.get("/api/frameworks", async (req, res) => {
    try {
      const { category, search } = req.query as { category?: string; search?: string };
      
      let frameworks;
      if (search) {
        frameworks = await storage.searchFrameworks(search);
      } else if (category) {
        frameworks = await storage.getFrameworksByCategory(category);
      } else {
        frameworks = await storage.getFrameworks();
      }
      
      res.json({ frameworks });
    } catch (error) {
      console.error('Error fetching frameworks:', error);
      res.status(500).json({ error: "Failed to fetch frameworks" });
    }
  });

  app.get("/api/frameworks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const framework = await storage.getFramework(id);
      
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }
      
      // Get current version and category details
      const currentVersion = framework.currentVersionId 
        ? await storage.getFrameworkVersion(framework.currentVersionId)
        : null;
      const category = await storage.getFrameworkCategory(framework.categoryId);
      
      res.json({ 
        framework,
        currentVersion,
        category
      });
    } catch (error) {
      console.error('Error fetching framework:', error);
      res.status(500).json({ error: "Failed to fetch framework" });
    }
  });

  app.post("/api/frameworks", async (req, res) => {
    try {
      const validatedData = insertFrameworkSchema.parse(req.body);
      const framework = await storage.createFramework(validatedData);
      res.json({ framework });
    } catch (error) {
      console.error('Error creating framework:', error);
      res.status(500).json({ error: "Failed to create framework" });
    }
  });

  app.put("/api/frameworks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFrameworkSchema.partial().parse(req.body);
      const framework = await storage.updateFramework(id, validatedData);
      
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }
      
      res.json({ framework });
    } catch (error) {
      console.error('Error updating framework:', error);
      res.status(500).json({ error: "Failed to update framework" });
    }
  });

  app.delete("/api/frameworks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFramework(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Framework not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting framework:', error);
      res.status(500).json({ error: "Failed to delete framework" });
    }
  });

  // Framework Version API Routes
  app.get("/api/frameworks/:id/versions", async (req, res) => {
    try {
      const { id } = req.params;
      const versions = await storage.getFrameworkVersions(id);
      res.json({ versions });
    } catch (error) {
      console.error('Error fetching framework versions:', error);
      res.status(500).json({ error: "Failed to fetch framework versions" });
    }
  });

  app.get("/api/framework-versions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const version = await storage.getFrameworkVersion(id);
      
      if (!version) {
        return res.status(404).json({ error: "Framework version not found" });
      }
      
      res.json({ version });
    } catch (error) {
      console.error('Error fetching framework version:', error);
      res.status(500).json({ error: "Failed to fetch framework version" });
    }
  });

  app.post("/api/frameworks/:id/versions", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFrameworkVersionSchema.parse({
        ...req.body,
        frameworkId: id
      });
      const version = await storage.createFrameworkVersion(validatedData);
      res.json({ version });
    } catch (error) {
      console.error('Error creating framework version:', error);
      res.status(500).json({ error: "Failed to create framework version" });
    }
  });

  app.put("/api/framework-versions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFrameworkVersionSchema.partial().parse(req.body);
      const version = await storage.updateFrameworkVersion(id, validatedData);
      
      if (!version) {
        return res.status(404).json({ error: "Framework version not found" });
      }
      
      res.json({ version });
    } catch (error) {
      console.error('Error updating framework version:', error);
      res.status(500).json({ error: "Failed to update framework version" });
    }
  });

  app.delete("/api/framework-versions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFrameworkVersion(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Framework version not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting framework version:', error);
      res.status(500).json({ error: "Failed to delete framework version" });
    }
  });

  // Framework Download/Usage tracking
  app.post("/api/frameworks/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const { versionId } = req.body;
      
      // Increment download counts
      const framework = await storage.getFramework(id);
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }
      
      const currentDownloads = parseInt(framework.totalDownloads) + 1;
      await storage.updateFramework(id, { totalDownloads: currentDownloads.toString() });
      
      if (versionId) {
        const version = await storage.getFrameworkVersion(versionId);
        if (version) {
          const versionDownloads = parseInt(version.downloadCount) + 1;
          await storage.updateFrameworkVersion(versionId, { downloadCount: versionDownloads.toString() });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking framework download:', error);
      res.status(500).json({ error: "Failed to track download" });
    }
  });

  // Upload document and create new framework automatically
  app.post("/api/frameworks/upload-document", documentUpload.single('document'), async (req, res) => {
    try {
      const file = req.file;
      const { categoryId, aiProvider = 'claude' } = req.body;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!categoryId) {
        await fs.unlink(file.path).catch(console.error);
        return res.status(400).json({ error: "Category ID is required" });
      }

      // Import document adapter
      const { processDocumentToFramework } = await import('./services/documentAdapter');

      const fileBuffer = await fs.readFile(file.path);
      
      // Process document and convert to framework
      const { framework, extractedText, metadata } = await processDocumentToFramework(
        fileBuffer,
        file.originalname,
        file.mimetype,
        aiProvider as 'openai' | 'claude'
      );

      // Create the framework
      const createdFramework = await storage.createFramework({
        name: framework.name,
        description: framework.description,
        categoryId,
        tags: framework.suggestedTags,
        isPublic: false,
        isStarred: false,
        totalDownloads: '0',
        apiCapabilities: framework.apiCapabilities,
        apiConfig: {}
      });

      // Get file size
      const stats = await fs.stat(file.path);
      const fileSizeKB = Math.round(stats.size / 1024);

      // Create initial version with extracted content
      const versionData = {
        frameworkId: createdFramework.id,
        version: '1.0.0',
        title: 'Imported from ' + file.originalname,
        contentJson: {
          sections: framework.sections,
          extractedMetrics: framework.extractedMetrics || [],
          extractedQueries: framework.extractedQueries || []
        },
        templateStructure: {},
        changelogMarkdown: `Automatically generated from ${file.originalname} using ${aiProvider}`,
        isActive: true,
        downloadCount: '0',
        fileSize: `${fileSizeKB} KB`,
        sourceType: 'upload',
        sourceFileName: file.originalname,
        sourceFileUrl: `/uploads/documents/${file.filename}`,
        processingStatus: 'completed',
        extractedText: extractedText,
        extractionError: null
      };

      const version = await storage.createFrameworkVersion(versionData);

      // Update framework with current version
      await storage.updateFramework(createdFramework.id, {
        currentVersionId: version.id
      });

      res.json({
        framework: createdFramework,
        version,
        metadata,
        success: true,
        message: 'Framework created successfully from document'
      });
    } catch (error) {
      console.error('Error creating framework from document:', error);
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      res.status(500).json({ error: "Failed to create framework from document" });
    }
  });

  // Document upload and processing for frameworks
  app.post("/api/frameworks/:id/upload-document", documentUpload.single('document'), async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const framework = await storage.getFramework(id);
      if (!framework) {
        // Clean up uploaded file
        await fs.unlink(file.path).catch(console.error);
        return res.status(404).json({ error: "Framework not found" });
      }

      // Extract text from document
      let extractedText = '';
      let extractionError = null;

      try {
        const fileBuffer = await fs.readFile(file.path);
        
        if (file.mimetype === 'application/pdf') {
          // Process PDF - use dynamic import to avoid require-time issues
          const pdfParse = (await import('pdf-parse')).default;
          const pdfData = await pdfParse(fileBuffer);
          extractedText = pdfData.text;
        } else {
          // Process Word document (.doc or .docx) - use dynamic import
          const officeParser = (await import('officeparser')).default;
          extractedText = await new Promise<string>((resolve, reject) => {
            officeParser.parseOffice(file.path, (err: Error | null, data: string) => {
              if (err) reject(err);
              else resolve(data);
            });
          });
        }
      } catch (error) {
        console.error('Error extracting text from document:', error);
        extractionError = error instanceof Error ? error.message : 'Failed to extract text from document';
      }

      // Get file size
      const stats = await fs.stat(file.path);
      const fileSizeKB = Math.round(stats.size / 1024);

      // Create framework version from extracted text
      const versionData = {
        frameworkId: id,
        version: '1.0.0', // Default version, can be incremented
        title: file.originalname.replace(/\.[^/.]+$/, ''), // Remove file extension
        contentJson: {
          type: 'document',
          content: extractedText,
          source: file.originalname
        },
        templateStructure: {},
        changelogMarkdown: `Uploaded from ${file.originalname}`,
        isActive: true,
        downloadCount: '0',
        fileSize: `${fileSizeKB} KB`,
        sourceType: 'upload',
        sourceFileName: file.originalname,
        sourceFileUrl: `/uploads/documents/${file.filename}`,
        processingStatus: extractionError ? 'failed' : 'completed',
        extractedText: extractedText,
        extractionError: extractionError
      };

      const version = await storage.createFrameworkVersion(versionData);

      // If extraction failed, return 422 to indicate processing issue
      if (extractionError) {
        return res.status(422).json({ 
          error: "Document uploaded but text extraction failed",
          version,
          extractionError,
          processingStatus: 'failed'
        });
      }

      res.json({ 
        version,
        success: true,
        extractedTextLength: extractedText.length,
        processingStatus: 'completed'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      // Clean up file if it exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      res.status(500).json({ error: "Failed to upload and process document" });
    }
  });

  // Framework execution with API access
  app.post("/api/frameworks/:id/execute", async (req, res) => {
    try {
      const { id } = req.params;
      const inputData = req.body;

      const framework = await storage.getFramework(id);
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }

      const { executeFramework, createExecutionContext } = await import('./services/frameworkExecutor');
      
      const result = await executeFramework(framework, inputData);
      
      res.json(result);
    } catch (error) {
      console.error('Error executing framework:', error);
      res.status(500).json({ error: "Failed to execute framework" });
    }
  });

  // Get framework execution context (available APIs)
  app.get("/api/frameworks/:id/execution-context", async (req, res) => {
    try {
      const { id } = req.params;

      const framework = await storage.getFramework(id);
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }

      const { createExecutionContext } = await import('./services/frameworkExecutor');
      const context = createExecutionContext(framework);
      
      res.json({ context });
    } catch (error) {
      console.error('Error getting execution context:', error);
      res.status(500).json({ error: "Failed to get execution context" });
    }
  });

  // ===== RSS Intelligence System Routes =====

  // RSS Sources Management
  app.get("/api/rss-sources", async (req, res) => {
    try {
      const { category, active } = req.query;
      let sources;

      if (category) {
        sources = await storage.getRssSourcesByCategory(category as string);
      } else if (active === 'true') {
        sources = await storage.getActiveRssSources();
      } else {
        sources = await storage.getRssSources();
      }

      res.json({ sources });
    } catch (error) {
      console.error('Error fetching RSS sources:', error);
      res.status(500).json({ error: "Failed to fetch RSS sources" });
    }
  });

  app.get("/api/rss-sources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const source = await storage.getRssSource(id);
      
      if (!source) {
        return res.status(404).json({ error: "RSS source not found" });
      }
      
      res.json({ source });
    } catch (error) {
      console.error('Error fetching RSS source:', error);
      res.status(500).json({ error: "Failed to fetch RSS source" });
    }
  });

  app.post("/api/rss-sources", async (req, res) => {
    try {
      const validatedData = insertRssSourceSchema.parse(req.body);
      
      // Check if source already exists
      const existingSource = await storage.getRssSourceByUrl(validatedData.feedUrl);
      if (existingSource) {
        return res.status(400).json({ error: "RSS source with this URL already exists" });
      }
      
      const source = await storage.createRssSource(validatedData);
      res.json({ source });
    } catch (error) {
      console.error('Error creating RSS source:', error);
      res.status(500).json({ error: "Failed to create RSS source" });
    }
  });

  app.put("/api/rss-sources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRssSourceSchema.partial().parse(req.body);
      const source = await storage.updateRssSource(id, validatedData);
      
      if (!source) {
        return res.status(404).json({ error: "RSS source not found" });
      }
      
      res.json({ source });
    } catch (error) {
      console.error('Error updating RSS source:', error);
      res.status(500).json({ error: "Failed to update RSS source" });
    }
  });

  app.delete("/api/rss-sources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRssSource(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "RSS source not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting RSS source:', error);
      res.status(500).json({ error: "Failed to delete RSS source" });
    }
  });

  // RSS Feed Fetching
  app.post("/api/rss-sources/:id/fetch", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await rssService.fetchFeed(id);
      res.json(result);
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    }
  });

  app.post("/api/rss-sources/fetch-all", async (req, res) => {
    try {
      const results = await rssService.fetchAllSources();
      res.json({ results });
    } catch (error) {
      console.error('Error fetching all RSS feeds:', error);
      res.status(500).json({ error: "Failed to fetch RSS feeds" });
    }
  });

  // RSS Articles Management
  app.get("/api/rss-articles", async (req, res) => {
    try {
      const { 
        source, 
        sources, 
        search, 
        limit, 
        start_date, 
        end_date,
        includeSentiment,
        includeTopics,
        categoryFilter,
        minSentiment
      } = req.query;
      let articles;

      if (search) {
        articles = await storage.searchRssArticles(search as string);
      } else if (sources) {
        // Handle multiple sources (comma-separated)
        const sourceIds = (sources as string).split(',').map(s => s.trim());
        const allArticles = await Promise.all(
          sourceIds.map(id => storage.getRssArticlesBySource(id))
        );
        articles = allArticles.flat()
          .sort((a, b) => {
            const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const dateB = b.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            return dateB - dateA; // Most recent first
          })
          .slice(0, limit ? parseInt(limit as string) : 100);
      } else if (source) {
        articles = await storage.getRssArticlesBySource(source as string);
      } else if (start_date && end_date) {
        articles = await storage.getRssArticlesByDateRange(
          new Date(start_date as string),
          new Date(end_date as string)
        );
      } else {
        const articleLimit = limit ? parseInt(limit as string) : 50;
        articles = await storage.getRecentRssArticles(articleLimit);
      }

      // Apply category filter if provided
      if (categoryFilter) {
        const filterCategories = (categoryFilter as string).toLowerCase().split(',').map(c => c.trim());
        articles = articles.filter(article => {
          const articleCategories = (article.categories || []).map(c => c.toLowerCase());
          return filterCategories.some(filterCat => 
            articleCategories.some(artCat => artCat.includes(filterCat))
          );
        });
      }

      // Apply sentiment filter if provided
      if (minSentiment !== undefined) {
        const minSentimentValue = parseFloat(minSentiment as string);
        articles = articles.filter(article => {
          // If sentiment data exists in rawDataJson
          const sentimentData = (article.rawDataJson as any)?.sentiment;
          if (sentimentData && typeof sentimentData.score === 'number') {
            return sentimentData.score >= minSentimentValue;
          }
          return false;
        });
      }

      // Enrich articles with sentiment data if requested
      if (includeSentiment === 'true') {
        const { sentimentAnalysisService } = await import('./rss/sentimentAnalysisService');
        
        // Get sentiment data for articles
        const articlesWithSentiment = await Promise.all(
          articles.map(async (article) => {
            // Check if sentiment exists in rawDataJson
            let sentimentData = (article.rawDataJson as any)?.sentiment;
            
            // If not, analyze it
            if (!sentimentData) {
              sentimentData = await sentimentAnalysisService.analyzeSentiment(
                parseInt(article.id),
                article.title,
                article.content || undefined
              );
              
              // Update rawDataJson with sentiment
              if (sentimentData) {
                await storage.updateRssArticle(article.id, {
                  rawDataJson: {
                    ...article.rawDataJson,
                    sentiment: sentimentData
                  } as any
                });
              }
            }
            
            return {
              ...article,
              sentiment: sentimentData || null,
              topics: includeTopics === 'true' ? article.topics : null,
              category: article.categories?.[0] || null
            };
          })
        );
        
        res.json({ articles: articlesWithSentiment });
      } else {
        // Return articles with optional topics
        const enrichedArticles = articles.map(article => ({
          ...article,
          topics: includeTopics === 'true' ? article.topics : null,
          category: article.categories?.[0] || null
        }));
        
        res.json({ articles: enrichedArticles });
      }
    } catch (error) {
      console.error('Error fetching RSS articles:', error);
      res.status(500).json({ error: "Failed to fetch RSS articles" });
    }
  });

  app.get("/api/rss-articles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const article = await storage.getRssArticle(id);
      
      if (!article) {
        return res.status(404).json({ error: "RSS article not found" });
      }
      
      res.json({ article });
    } catch (error) {
      console.error('Error fetching RSS article:', error);
      res.status(500).json({ error: "Failed to fetch RSS article" });
    }
  });

  app.post("/api/rss-articles", async (req, res) => {
    try {
      const validatedData = insertRssArticleSchema.parse(req.body);
      const article = await storage.createRssArticle(validatedData);
      res.json({ article });
    } catch (error) {
      console.error('Error creating RSS article:', error);
      res.status(500).json({ error: "Failed to create RSS article" });
    }
  });

  app.put("/api/rss-articles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRssArticleSchema.partial().parse(req.body);
      const article = await storage.updateRssArticle(id, validatedData);
      
      if (!article) {
        return res.status(404).json({ error: "RSS article not found" });
      }
      
      res.json({ article });
    } catch (error) {
      console.error('Error updating RSS article:', error);
      res.status(500).json({ error: "Failed to update RSS article" });
    }
  });

  app.delete("/api/rss-articles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRssArticle(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "RSS article not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting RSS article:', error);
      res.status(500).json({ error: "Failed to delete RSS article" });
    }
  });

  // RSS Article Analysis
  app.post("/api/rss-articles/:id/analyze", async (req, res) => {
    try {
      const { id } = req.params;
      const { analysisType = 'sentiment' } = req.body;
      
      const article = await storage.getRssArticle(id);
      if (!article) {
        return res.status(404).json({ error: "RSS article not found" });
      }

      if (analysisType === 'sentiment') {
        const sentimentResult = await rssService.analyzeArticleSentiment(id);
        
        // Save analysis
        const analysis = await storage.createRssAnalysis({
          articleId: id,
          analysisType: 'sentiment',
          resultJson: sentimentResult,
          confidence: sentimentResult.confidence,
          status: 'completed'
        });

        // Update article with sentiment
        await storage.updateRssArticle(id, {
          sentiment: sentimentResult.sentiment,
          isAnalyzed: true
        });

        res.json({ analysis, result: sentimentResult });
      } else {
        res.status(400).json({ error: "Unsupported analysis type" });
      }
    } catch (error) {
      console.error('Error analyzing RSS article:', error);
      res.status(500).json({ error: "Failed to analyze RSS article" });
    }
  });

  // RSS Analysis Management
  app.get("/api/rss-analyses", async (req, res) => {
    try {
      const { articleId, type } = req.query;
      let analyses;

      if (articleId) {
        analyses = await storage.getRssAnalysesByArticle(articleId as string);
      } else if (type) {
        analyses = await storage.getRssAnalysesByType(type as string);
      } else {
        analyses = await storage.getRssAnalyses();
      }

      res.json({ analyses });
    } catch (error) {
      console.error('Error fetching RSS analyses:', error);
      res.status(500).json({ error: "Failed to fetch RSS analyses" });
    }
  });

  app.get("/api/rss-analyses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getRssAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "RSS analysis not found" });
      }
      
      res.json({ analysis });
    } catch (error) {
      console.error('Error fetching RSS analysis:', error);
      res.status(500).json({ error: "Failed to fetch RSS analysis" });
    }
  });

  app.post("/api/rss-analyses", async (req, res) => {
    try {
      const validatedData = insertRssAnalysisSchema.parse(req.body);
      const analysis = await storage.createRssAnalysis(validatedData);
      res.json({ analysis });
    } catch (error) {
      console.error('Error creating RSS analysis:', error);
      res.status(500).json({ error: "Failed to create RSS analysis" });
    }
  });

  app.put("/api/rss-analyses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRssAnalysisSchema.partial().parse(req.body);
      const analysis = await storage.updateRssAnalysis(id, validatedData);
      
      if (!analysis) {
        return res.status(404).json({ error: "RSS analysis not found" });
      }
      
      res.json({ analysis });
    } catch (error) {
      console.error('Error updating RSS analysis:', error);
      res.status(500).json({ error: "Failed to update RSS analysis" });
    }
  });

  app.delete("/api/rss-analyses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRssAnalysis(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "RSS analysis not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting RSS analysis:', error);
      res.status(500).json({ error: "Failed to delete RSS analysis" });
    }
  });

  // RSS Comparisons Management
  app.get("/api/rss-comparisons", async (req, res) => {
    try {
      const { type, public_only } = req.query;
      let comparisons;

      if (public_only === 'true') {
        comparisons = await storage.getPublicRssComparisons();
      } else if (type) {
        comparisons = await storage.getRssComparisonsByType(type as string);
      } else {
        comparisons = await storage.getRssComparisons();
      }

      res.json({ comparisons });
    } catch (error) {
      console.error('Error fetching RSS comparisons:', error);
      res.status(500).json({ error: "Failed to fetch RSS comparisons" });
    }
  });

  app.get("/api/rss-comparisons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const comparison = await storage.getRssComparison(id);
      
      if (!comparison) {
        return res.status(404).json({ error: "RSS comparison not found" });
      }
      
      res.json({ comparison });
    } catch (error) {
      console.error('Error fetching RSS comparison:', error);
      res.status(500).json({ error: "Failed to fetch RSS comparison" });
    }
  });

  app.post("/api/rss-comparisons", async (req, res) => {
    try {
      const validatedData = insertRssComparisonSchema.parse(req.body);
      const comparison = await storage.createRssComparison(validatedData);
      res.json({ comparison });
    } catch (error) {
      console.error('Error creating RSS comparison:', error);
      res.status(500).json({ error: "Failed to create RSS comparison" });
    }
  });

  app.put("/api/rss-comparisons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRssComparisonSchema.partial().parse(req.body);
      const comparison = await storage.updateRssComparison(id, validatedData);
      
      if (!comparison) {
        return res.status(404).json({ error: "RSS comparison not found" });
      }
      
      res.json({ comparison });
    } catch (error) {
      console.error('Error updating RSS comparison:', error);
      res.status(500).json({ error: "Failed to update RSS comparison" });
    }
  });

  app.delete("/api/rss-comparisons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRssComparison(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "RSS comparison not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting RSS comparison:', error);
      res.status(500).json({ error: "Failed to delete RSS comparison" });
    }
  });

  // RSS Sentiment Summary Endpoint
  app.get("/api/rss/sentiment-summary", async (req, res) => {
    try {
      const { timeframe = '24h' } = req.query;
      
      // Calculate time range
      const timeframeMap: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const timeRangeMs = timeframeMap[timeframe as string] || timeframeMap['24h'];
      const since = new Date(Date.now() - timeRangeMs);
      
      // Get articles in timeframe
      const articles = await storage.getRssArticlesByDateRange(since, new Date());
      
      if (articles.length === 0) {
        return res.json({
          averageSentiment: 0,
          totalArticles: 0,
          trendingTopics: [],
          topKeywords: [],
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
        });
      }
      
      // Import sentiment analysis service
      const { sentimentAnalysisService } = await import('./rss/sentimentAnalysisService');
      
      // Analyze sentiment for all articles
      let totalSentiment = 0;
      let sentimentCount = 0;
      const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
      const topicCounts: Record<string, { count: number; totalSentiment: number }> = {};
      const keywordCounts: Record<string, number> = {};
      
      for (const article of articles) {
        // Get or analyze sentiment
        let sentimentData = (article.rawDataJson as any)?.sentiment;
        
        if (!sentimentData) {
          sentimentData = await sentimentAnalysisService.analyzeSentiment(
            parseInt(article.id),
            article.title,
            article.content || undefined
          );
          
          // Update article with sentiment
          if (sentimentData) {
            await storage.updateRssArticle(article.id, {
              rawDataJson: {
                ...article.rawDataJson,
                sentiment: sentimentData
              } as any
            });
          }
        }
        
        if (sentimentData && typeof sentimentData.score === 'number') {
          totalSentiment += sentimentData.score;
          sentimentCount++;
          
          // Categorize sentiment
          if (sentimentData.score > 0.3) {
            sentimentBreakdown.positive++;
          } else if (sentimentData.score < -0.3) {
            sentimentBreakdown.negative++;
          } else {
            sentimentBreakdown.neutral++;
          }
          
          // Collect keywords
          if (sentimentData.keywords && Array.isArray(sentimentData.keywords)) {
            sentimentData.keywords.forEach((keyword: string) => {
              keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
            });
          }
        }
        
        // Collect topics
        if (article.topics && Array.isArray(article.topics)) {
          article.topics.forEach(topic => {
            if (!topicCounts[topic]) {
              topicCounts[topic] = { count: 0, totalSentiment: 0 };
            }
            topicCounts[topic].count++;
            topicCounts[topic].totalSentiment += sentimentData?.score || 0;
          });
        }
      }
      
      // Calculate average sentiment
      const averageSentiment = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;
      
      // Get top keywords
      const topKeywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword, frequency]) => ({ keyword, frequency }));
      
      // Get trending topics with sentiment
      const trendingTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([topic, data]) => ({
          topic,
          count: data.count,
          sentiment: data.count > 0 ? data.totalSentiment / data.count : 0
        }));
      
      res.json({
        averageSentiment,
        totalArticles: articles.length,
        trendingTopics,
        topKeywords,
        sentimentBreakdown
      });
    } catch (error) {
      console.error('Error fetching sentiment summary:', error);
      res.status(500).json({ error: "Failed to fetch sentiment summary" });
    }
  });

  // RSS Dashboard Analytics
  app.get("/api/rss-dashboard", async (req, res) => {
    try {
      const sources = await storage.getRssSources();
      const recentArticles = await storage.getRecentRssArticles(20);
      const activeSources = await storage.getActiveRssSources();
      
      // Calculate stats
      const totalArticles = (await storage.getRssArticles()).length;
      const articlesThisWeek = (await storage.getRssArticlesByDateRange(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      )).length;

      const dashboard = {
        totalSources: sources.length,
        activeSources: activeSources.length,
        totalArticles,
        articlesThisWeek,
        recentArticles: recentArticles.slice(0, 10),
        sourceStats: sources.map(source => ({
          id: source.id,
          name: source.name,
          category: source.category,
          totalArticles: source.totalArticles,
          lastFetchedAt: source.lastFetchedAt,
          fetchErrors: source.fetchErrors,
          isActive: source.isActive
        }))
      };

      res.json({ dashboard });
    } catch (error) {
      console.error('Error fetching RSS dashboard:', error);
      res.status(500).json({ error: "Failed to fetch RSS dashboard" });
    }
  });

  // RSS Ticker Configuration Routes
  app.get("/api/rss/ticker-config", async (req, res) => {
    try {
      const config = await storage.getTickerConfig();
      res.json({ config });
    } catch (error) {
      console.error('Error fetching ticker config:', error);
      res.status(500).json({ error: "Failed to fetch ticker configuration" });
    }
  });

  app.patch("/api/rss/ticker-config", async (req, res) => {
    try {
      const updates = z.object({
        speed: z.number().optional(),
        activeFeeds: z.array(z.string()).optional(),
        style: z.object({
          backgroundColor: z.string(),
          textColor: z.string(),
          fontSize: z.number(),
          height: z.number()
        }).optional(),
        mode: z.string().optional(),
        autoRefresh: z.boolean().optional(),
        refreshInterval: z.number().optional()
      }).parse(req.body);

      await storage.updateTickerConfig(updates);
      const config = await storage.getTickerConfig();
      res.json({ config });
    } catch (error) {
      console.error('Error updating ticker config:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update ticker configuration" });
      }
    }
  });

  // Live State API Routes
  app.get("/api/live-state", async (req, res) => {
    try {
      const liveState = await storage.getLiveState();
      res.json({ liveState: liveState || null });
    } catch (error) {
      console.error('Error fetching live state:', error);
      res.status(500).json({ error: "Failed to fetch live state" });
    }
  });

  app.patch("/api/live-state", async (req, res) => {
    try {
      const liveState = await storage.updateLiveState(req.body);
      res.json({ liveState });
    } catch (error) {
      console.error('Error updating live state:', error);
      res.status(500).json({ error: "Failed to update live state" });
    }
  });

  // Football API Routes for Team Matchup Studio
  
  // Get static data statistics
  app.get("/api/football/static-data/stats", async (req, res) => {
    try {
      const StaticDataLoader = (await import('./football/staticDataLoader')).default;
      const stats = StaticDataLoader.getStats();
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching static data stats:', error);
      res.status(500).json({ error: "Failed to fetch static data stats" });
    }
  });
  
  // Get all competitions
  app.get("/api/football/competitions", async (req, res) => {
    try {
      const competitions = await storage.getFootballCompetitions();
      res.json({ competitions });
    } catch (error) {
      console.error('Error fetching competitions:', error);
      res.status(500).json({ error: "Failed to fetch competitions" });
    }
  });

  // Get active competitions with available data
  app.get("/api/football/competitions/active", async (req, res) => {
    try {
      const competitionsFromFixtures = await db
        .selectDistinct({
          id: footballFixtures.leagueId,
          season: footballFixtures.season,
        })
        .from(footballFixtures);
      
      const uniqueCompetitionIds = [...new Set(competitionsFromFixtures.map(c => c.id))];
      
      if (uniqueCompetitionIds.length === 0) {
        return res.json({
          competitions: [
            { id: 39, name: 'Premier League', type: 'league' },
            { id: 2, name: 'UEFA Champions League', type: 'cup' },
            { id: 45, name: 'FA Cup', type: 'cup' }
          ]
        });
      }
      
      const competitions = await db
        .select({
          id: footballCompetitions.id,
          name: footballCompetitions.name,
          type: footballCompetitions.type,
        })
        .from(footballCompetitions)
        .where(inArray(footballCompetitions.id, uniqueCompetitionIds));
      
      const minCompetitions = [
        { id: 39, name: 'Premier League', type: 'league' },
        { id: 2, name: 'UEFA Champions League', type: 'cup' },
        { id: 45, name: 'FA Cup', type: 'cup' }
      ];
      
      const competitionMap = new Map(competitions.map(c => [c.id, c]));
      minCompetitions.forEach(minComp => {
        if (!competitionMap.has(minComp.id)) {
          competitions.push(minComp);
        }
      });
      
      return res.json({ competitions });
    } catch (error) {
      console.error('Error fetching active competitions:', error);
      return res.status(500).json({ error: "Failed to fetch active competitions" });
    }
  });

  // Get teams by competition
  app.get("/api/football/competitions/:competitionId/teams", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      if (isNaN(competitionId)) {
        return res.status(400).json({ error: "Invalid competition ID" });
      }

      const teams = await storage.getFootballTeamsByCompetition(competitionId);
      res.json({ teams });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Get league standings for a specific league and season
  app.get("/api/football/standings/:leagueId/:season", async (req, res) => {
    try {
      const leagueId = parseInt(req.params.leagueId);
      const season = parseInt(req.params.season);
      
      if (isNaN(leagueId) || isNaN(season)) {
        return res.status(400).json({ error: "Invalid league ID or season" });
      }

      const standingsData = await footballService.getStandings(leagueId, season);
      
      if (!standingsData) {
        return res.status(404).json({ error: "No standings data available for this league and season" });
      }

      return res.json(standingsData);
    } catch (error) {
      console.error('Error fetching league standings:', error);
      return res.status(500).json({ error: "Failed to fetch league standings" });
    }
  });

  // Get head-to-head statistics between two teams
  // Uses database-first approach with historical data (2020+) and falls back to API
  app.get("/api/football/head-to-head/:homeTeamId/:awayTeamId", async (req, res) => {
    try {
      const homeTeamId = parseInt(req.params.homeTeamId);
      const awayTeamId = parseInt(req.params.awayTeamId);
      
      if (isNaN(homeTeamId) || isNaN(awayTeamId)) {
        return res.status(400).json({ error: "Invalid team IDs" });
      }

      // First try to get data from database (includes historical data)
      const { historicalDataService } = await import('./services/historicalDataService');
      const dbFixtures = await historicalDataService.getHeadToHeadData(homeTeamId, awayTeamId, 30);
      
      // If we have sufficient data from database, use it
      if (dbFixtures.length >= 5) {
        console.log(`✓ Using database data for teams ${homeTeamId} vs ${awayTeamId} (${dbFixtures.length} matches)`);
        return res.json({ fixtures: dbFixtures, source: 'database' });
      }

      // Otherwise fall back to API
      console.log(`⚠ Insufficient database data, fetching from API for teams ${homeTeamId} vs ${awayTeamId}`);
      const fixtures = await storage.getFootballHeadToHead(homeTeamId, awayTeamId);
      res.json({ fixtures, source: 'api' });
    } catch (error) {
      console.error('Error fetching head-to-head stats:', error);
      res.status(500).json({ error: "Failed to fetch head-to-head statistics" });
    }
  });

  // Initialize historical data and update schedules
  app.post("/api/football/initialize-historical", async (req, res) => {
    try {
      const { historicalDataService } = await import('./services/historicalDataService');
      
      await historicalDataService.initializeHistoricalData();
      await historicalDataService.initializeUpdateSchedules();
      
      const summary = historicalDataService.getUpdateStrategySummary();
      
      res.json({ 
        success: true, 
        message: "Historical data and update schedules initialized",
        summary
      });
    } catch (error) {
      console.error('Error initializing historical data:', error);
      res.status(500).json({ error: "Failed to initialize historical data" });
    }
  });

  // Get update schedule for a competition
  app.get("/api/football/update-schedule/:competitionId", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      if (isNaN(competitionId)) {
        return res.status(400).json({ error: "Invalid competition ID" });
      }

      const { historicalDataService } = await import('./services/historicalDataService');
      const schedule = await historicalDataService.getUpdateSchedule(competitionId);
      
      res.json({ schedule });
    } catch (error) {
      console.error('Error fetching update schedule:', error);
      res.status(500).json({ error: "Failed to fetch update schedule" });
    }
  });

  // Get all active update schedules
  app.get("/api/football/update-schedules", async (req, res) => {
    try {
      const { historicalDataService } = await import('./services/historicalDataService');
      const schedules = await historicalDataService.getActiveSchedules();
      
      res.json({ schedules });
    } catch (error) {
      console.error('Error fetching update schedules:', error);
      res.status(500).json({ error: "Failed to fetch update schedules" });
    }
  });

  // Get team statistics for a specific competition/season
  app.get("/api/football/teams/:teamId/statistics", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const leagueId = parseInt(req.query.leagueId as string);
      const season = parseInt(req.query.season as string);
      
      if (isNaN(teamId) || isNaN(leagueId) || isNaN(season)) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const statistics = await storage.getFootballTeamStatistics(teamId, leagueId, season);
      res.json({ statistics });
    } catch (error) {
      console.error('Error fetching team statistics:', error);
      res.status(500).json({ error: "Failed to fetch team statistics" });
    }
  });

  // Get team squad for a specific season
  app.get("/api/football/teams/:teamId/squad", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const season = parseInt(req.query.season as string);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }
      
      if (isNaN(season)) {
        return res.status(400).json({ error: "Invalid season parameter" });
      }
      
      const squad = await storage.getFootballTeamSquad(teamId, season);
      res.json({ squad });
    } catch (error) {
      console.error('Error fetching team squad:', error);
      res.status(500).json({ error: "Failed to fetch team squad" });
    }
  });

  // Get Liverpool's upcoming fixtures from official iCal feed
  app.get("/api/football/liverpool/upcoming", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const fixtures = await iCalService.getUpcomingFixtures(limit);
      res.json({ fixtures });
    } catch (error) {
      console.error('Error fetching Liverpool upcoming fixtures from iCal:', error);
      res.status(503).json({ 
        error: "Liverpool fixtures temporarily unavailable",
        message: "Unable to fetch fixture data. Please try again later."
      });
    }
  });

  // Get Liverpool top scorers with season statistics
  app.get("/api/football/players/liverpool/top-scorers", async (req, res) => {
    try {
      const season = parseInt(req.query.season as string) || new Date().getFullYear();
      const leagueId = parseInt(req.query.leagueId as string) || 39; // Premier League
      const limit = parseInt(req.query.limit as string) || 5;
      
      const topScorers = await db
        .select({
          id: footballPlayers.id,
          name: footballPlayers.name,
          photo: footballPlayers.photo,
          goals: playerSeasonStatistics.goals,
          assists: playerSeasonStatistics.assists,
          appearances: playerSeasonStatistics.appearances,
          minutes: playerSeasonStatistics.minutes,
          rating: playerSeasonStatistics.rating,
        })
        .from(playerSeasonStatistics)
        .innerJoin(footballPlayers, eq(playerSeasonStatistics.playerId, footballPlayers.id))
        .where(
          and(
            eq(playerSeasonStatistics.teamId, 40), // Liverpool
            eq(playerSeasonStatistics.leagueId, leagueId),
            eq(playerSeasonStatistics.season, season)
          )
        )
        .orderBy(desc(playerSeasonStatistics.goals))
        .limit(limit);

      if (topScorers.length === 0) {
        return res.json({ 
          players: [],
          season,
          message: "No player statistics available for this season. Please populate the database first."
        });
      }

      res.json({ 
        players: topScorers,
        season,
        teamId: 40,
        teamName: "Liverpool FC"
      });
    } catch (error) {
      console.error('Error fetching Liverpool top scorers:', error);
      res.status(500).json({ error: "Failed to fetch Liverpool top scorers" });
    }
  });

  // Get default overlay templates
  app.get("/api/overlays/default-templates", async (req, res) => {
    try {
      const templates = await storage.getDefaultOverlayTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching default overlay templates:', error);
      res.status(500).json({ error: "Failed to fetch default overlay templates" });
    }
  });

  // Seed historical Liverpool players (2020-2025)
  app.post("/api/football/players/seed-historical", async (req, res) => {
    try {
      const { seedHistoricalPlayers } = await import('./football/seedHistoricalPlayers');
      const success = await seedHistoricalPlayers();
      res.json({ 
        success, 
        message: success ? "Historical players seeded successfully" : "Failed to seed historical players" 
      });
    } catch (error) {
      console.error('Error seeding historical players:', error);
      res.status(500).json({ error: "Failed to seed historical players" });
    }
  });

  // Populate Liverpool players from Football API
  app.post("/api/football/players/populate-liverpool", async (req, res) => {
    try {
      const season = parseInt(req.body.season) || new Date().getFullYear();
      const { populateLiverpoolPlayers } = await import('./football/populateLiverpoolPlayers');
      const success = await populateLiverpoolPlayers(season);
      res.json({ 
        success, 
        season,
        message: success ? `Liverpool players populated for ${season}` : "Failed to populate Liverpool players" 
      });
    } catch (error) {
      console.error('Error populating Liverpool players:', error);
      res.status(500).json({ error: "Failed to populate Liverpool players" });
    }
  });

  // Test endpoint to manually trigger AI stats update
  app.post("/api/test-ai-stats", async (req, res) => {
    console.log("[TEST] AI stats update triggered via API");
    try {
      const { updateLiverpoolStatsWithAI } = await import('./football/aiStatsService');
      console.log("[TEST] aiStatsService imported successfully");
      const success = await updateLiverpoolStatsWithAI();
      console.log("[TEST] AI stats update result:", success);
      res.json({ success, message: success ? "AI stats updated successfully" : "AI stats update failed" });
    } catch (error) {
      console.error('[TEST] Error updating AI stats:', error);
      res.status(500).json({ error: "Failed to update AI stats" });
    }
  });

  // Team statistics endpoint for match preview
  app.get("/api/team-stats/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const season = new Date().getFullYear(); // Current season
      const leagueId = 39; // Premier League

      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }

      const stats = await footballService.getTeamStatistics(teamId, leagueId, season);

      if (!stats || !stats.statistics) {
        const dbStats = await storage.getTeamSeasonStatisticsFromDB(teamId, leagueId, season);
        
        if (dbStats) {
          const winRate = dbStats.matchesPlayed > 0 
            ? Math.round((dbStats.wins / dbStats.matchesPlayed) * 100) 
            : 0;
          
          return res.json({
            form: dbStats.form || "N/A",
            goals: { 
              for: dbStats.goalsFor, 
              against: dbStats.goalsAgainst 
            },
            winRate,
            cleanSheets: dbStats.cleanSheets
          });
        }
        
        const staticFallbackData: { [key: number]: any } = {
          40: { form: "WWDWW", goals: { for: 28, against: 12 }, winRate: 76, cleanSheets: 8 },
          49: { form: "DWLWL", goals: { for: 22, against: 18 }, winRate: 52, cleanSheets: 5 },
          50: { form: "WWWDW", goals: { for: 32, against: 10 }, winRate: 82, cleanSheets: 9 },
          33: { form: "WLWDL", goals: { for: 20, against: 16 }, winRate: 48, cleanSheets: 4 },
          42: { form: "WWDWL", goals: { for: 26, against: 14 }, winRate: 68, cleanSheets: 7 },
          47: { form: "WDWLW", goals: { for: 24, against: 19 }, winRate: 58, cleanSheets: 5 }
        };
        
        const teamFallback = staticFallbackData[teamId] || {
          form: "WDWLD",
          goals: { for: 18, against: 15 },
          winRate: 50,
          cleanSheets: 4
        };
        
        return res.json(teamFallback);
      }

      // Helper function to find stat by type
      const findStat = (type: string) => {
        const stat = stats.statistics.find((s: any) => 
          s.type.toLowerCase() === type.toLowerCase()
        );
        return stat?.value;
      };

      // Helper to extract numeric value from nested structures
      // Returns null for unsupported/missing structures to trigger fallback
      const extractNumber = (obj: any): number | null => {
        if (obj === null || obj === undefined) return null;
        if (typeof obj === 'number') return obj;
        
        // Handle nested .total structures recursively
        if (obj.total !== undefined) {
          return extractNumber(obj.total);
        }
        
        // Handle home/away aggregation
        if (obj.home !== undefined && obj.away !== undefined) {
          const home = extractNumber(obj.home);
          const away = extractNumber(obj.away);
          if (home !== null && away !== null) {
            return home + away;
          }
        }
        
        // Unsupported structure - return null to trigger fallback
        return null;
      };

      // Extract form (direct value)
      const formValue = findStat('form');
      const form = typeof formValue === 'string' ? formValue : null;

      // Extract goals (nested in "Goals" category)
      const goalsData = findStat('goals');
      const goalsFor = goalsData?.for ? extractNumber(goalsData.for) : null;
      const goalsAgainst = goalsData?.against ? extractNumber(goalsData.against) : null;

      // Extract fixtures data (nested in "Fixtures" category)
      const fixturesData = findStat('fixtures');
      const fixturesPlayed = fixturesData?.played ? extractNumber(fixturesData.played) : null;
      const fixturesWins = fixturesData?.wins ? extractNumber(fixturesData.wins) : null;

      // Extract clean sheets (nested value)
      const cleanSheetData = findStat('clean sheet');
      const cleanSheets = cleanSheetData ? extractNumber(cleanSheetData) : null;

      // Per-field fallbacks - mix real and fallback data as needed
      const teamFallbacks: { [key: number]: any } = {
        40: { form: "WWDWW", goalsFor: 28, goalsAgainst: 12, played: 10, wins: 7, cleanSheets: 8 },
        49: { form: "DWLWL", goalsFor: 22, goalsAgainst: 18, played: 10, wins: 5, cleanSheets: 5 },
        50: { form: "WWWDW", goalsFor: 32, goalsAgainst: 10, played: 10, wins: 8, cleanSheets: 9 },
        33: { form: "WLWDL", goalsFor: 20, goalsAgainst: 16, played: 10, wins: 4, cleanSheets: 4 },
        42: { form: "WWDWL", goalsFor: 26, goalsAgainst: 14, played: 10, wins: 6, cleanSheets: 7 },
        47: { form: "WDWLW", goalsFor: 24, goalsAgainst: 19, played: 10, wins: 5, cleanSheets: 5 }
      };
      
      const defaultFallback = { form: "WDWLD", goalsFor: 18, goalsAgainst: 15, played: 10, wins: 5, cleanSheets: 4 };
      const fallback = teamFallbacks[teamId] || defaultFallback;

      // Use real data where available, fallback for missing fields
      const finalForm = form || fallback.form;
      const finalGoalsFor = goalsFor ?? fallback.goalsFor;
      const finalGoalsAgainst = goalsAgainst ?? fallback.goalsAgainst;
      const finalPlayed = fixturesPlayed ?? fallback.played;
      const finalWins = fixturesWins ?? fallback.wins;
      const finalCleanSheets = cleanSheets ?? fallback.cleanSheets;

      // Format the response with mixed real/fallback data
      const formattedStats = {
        form: finalForm,
        goals: {
          for: finalGoalsFor,
          against: finalGoalsAgainst
        },
        winRate: finalPlayed > 0 
          ? Math.round((finalWins / finalPlayed) * 100) 
          : 0,
        cleanSheets: finalCleanSheets
      };

      res.json(formattedStats);
    } catch (error) {
      console.error('Error fetching team statistics:', error);
      res.json({
        form: "?????",
        goals: { for: 0, against: 0 },
        winRate: 0,
        cleanSheets: 0
      });
    }
  });

  // AI Analysis endpoint for team statistics
  app.post("/api/football/teams/:teamId/analyze", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { teamName, statistics, isLiverpool } = req.body;

      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }

      if (!statistics) {
        return res.status(400).json({ error: "Statistics data required" });
      }

      // If OpenAI is not configured, return fallback analysis
      if (!openai) {
        return res.json({
          analysis: {
            narrative: `Analysis for ${teamName}: Strong defensive record with solid attacking output. Team shows consistent form across competitions.`,
            keyInsights: [
              "Solid defensive foundation",
              "Balanced attacking approach",
              "Good squad depth"
            ],
            tacticalRecommendations: [
              "Maintain defensive structure",
              "Exploit set-piece opportunities"
            ],
            confidence: 50
          }
        });
      }

      // Build analysis prompt with Liverpool focus
      const isLFC = isLiverpool || teamId === 40;
      const contextPrompt = `
Analyze this football team's statistics with a Liverpool FC perspective:

Team: ${teamName}
${isLFC ? '(Liverpool FC - defending Premier League champions under Arne Slot)' : '(Upcoming opponent/rival)'}

Statistics:
- Form: ${statistics.form || 'N/A'}
- Goals Scored: ${statistics.goals?.for?.total?.total || 0}
- Goals Conceded: ${statistics.goals?.against?.total?.total || 0}
- Clean Sheets: ${statistics.clean_sheet?.total || 0}
- Wins: ${statistics.fixtures?.wins?.total || 0}
- Draws: ${statistics.fixtures?.draws?.total || 0}
- Losses: ${statistics.fixtures?.loses?.total || 0}
- Matches Played: ${statistics.fixtures?.played?.total || 0}

Generate a ${isLFC ? 'celebratory and analytical' : 'tactical and strategic'} analysis focusing on:
1. Compelling narrative suitable for YouTube content
2. Key statistical stories and trends
3. Tactical insights ${isLFC ? 'highlighting strengths' : 'revealing weaknesses to exploit'}
4. ${isLFC ? 'Squad quality and depth' : 'How Liverpool can capitalize'}

Return ONLY a JSON object with this structure:
{
  "narrative": "2-3 sentence compelling story about the team's performance",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "tacticalRecommendations": ["recommendation1", "recommendation2"],
  "confidence": 85
}
`.trim();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert football analyst for Liverpool FC YouTube channel Mailman Media. Generate insightful, engaging analysis that resonates with Liverpool fans. Be specific, use data, and create narratives that work for YouTube content.`
          },
          {
            role: "user",
            content: contextPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content || "{}";
      let analysis;
      
      try {
        analysis = JSON.parse(content);
      } catch {
        analysis = {
          narrative: `Strong performance metrics for ${teamName}`,
          keyInsights: ["Solid team statistics", "Competitive record"],
          tacticalRecommendations: ["Maintain current approach"],
          confidence: 70
        };
      }

      res.json({ analysis });
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      res.json({
        analysis: {
          narrative: "Analysis unavailable at this time",
          keyInsights: ["Data processing in progress"],
          tacticalRecommendations: ["Check back soon"],
          confidence: 50
        }
      });
    }
  });

  // Initialize football data (sync from API)
  app.post("/api/football/initialize", async (req, res) => {
    try {
      await storage.initializeFootballData();
      res.json({ success: true, message: "Football data initialized successfully" });
    } catch (error) {
      console.error('Error initializing football data:', error);
      res.status(500).json({ error: "Failed to initialize football data" });
    }
  });

  // === CACHED STATS ENDPOINTS ===
  // These endpoints serve pre-computed stats from the database
  
  // Get latest team statistics from cache
  app.get("/api/cached-stats/team/:teamId/:leagueId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const leagueId = parseInt(req.params.leagueId);
      const seasonYear = req.query.seasonYear ? parseInt(req.query.seasonYear as string) : undefined;
      
      if (isNaN(teamId) || isNaN(leagueId)) {
        return res.status(400).json({ error: "Invalid team ID or league ID" });
      }

      const currentSeason = seasonYear || new Date().getFullYear();
      
      const stats = await db
        .select()
        .from(teamSeasonStatistics)
        .where(
          and(
            eq(teamSeasonStatistics.teamId, teamId),
            eq(teamSeasonStatistics.leagueId, leagueId),
            eq(teamSeasonStatistics.season, currentSeason)
          )
        )
        .orderBy(desc(teamSeasonStatistics.lastUpdated))
        .limit(1);

      if (!stats || stats.length === 0) {
        return res.status(404).json({ error: "No cached statistics found for this team" });
      }

      res.json({ statistics: stats[0] });
    } catch (error) {
      console.error('Error fetching cached team stats:', error);
      res.status(500).json({ error: "Failed to fetch cached team statistics" });
    }
  });

  // Get latest matchup analysis from cache
  app.get("/api/cached-stats/matchup/:homeTeamId/:awayTeamId", async (req, res) => {
    try {
      const homeTeamId = parseInt(req.params.homeTeamId);
      const awayTeamId = parseInt(req.params.awayTeamId);
      
      if (isNaN(homeTeamId) || isNaN(awayTeamId)) {
        return res.status(400).json({ error: "Invalid team IDs" });
      }

      const analysis = await db
        .select()
        .from(teamMatchupAnalysis)
        .where(
          and(
            eq(teamMatchupAnalysis.homeTeamId, homeTeamId),
            eq(teamMatchupAnalysis.awayTeamId, awayTeamId)
          )
        )
        .orderBy(desc(teamMatchupAnalysis.generatedAt))
        .limit(1);

      if (!analysis || analysis.length === 0) {
        return res.status(404).json({ error: "No cached matchup analysis found" });
      }

      const matchupData = analysis[0];
      const resultJson = matchupData.resultJson as any;
      
      if (resultJson && resultJson.prediction) {
        res.json({
          prediction: resultJson.prediction,
          analysis: matchupData,
          generatedAt: matchupData.generatedAt
        });
      } else {
        res.json({
          analysis: matchupData,
          resultJson: resultJson,
          generatedAt: matchupData.generatedAt
        });
      }
    } catch (error) {
      console.error('Error fetching cached matchup analysis:', error);
      res.status(500).json({ error: "Failed to fetch cached matchup analysis" });
    }
  });

  // Get all teams with cached statistics
  app.get("/api/cached-stats/teams", async (req, res) => {
    try {
      const currentSeason = new Date().getFullYear();
      const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : 39;
      
      const teamsWithStats = await db
        .select({
          teamId: teamSeasonStatistics.teamId,
          teamName: footballTeams.name,
          leagueId: teamSeasonStatistics.leagueId,
          season: teamSeasonStatistics.season,
          lastUpdated: teamSeasonStatistics.lastUpdated,
          matchesPlayed: teamSeasonStatistics.matchesPlayed,
          form: teamSeasonStatistics.form
        })
        .from(teamSeasonStatistics)
        .innerJoin(footballTeams, eq(teamSeasonStatistics.teamId, footballTeams.id))
        .where(
          and(
            eq(teamSeasonStatistics.leagueId, leagueId),
            eq(teamSeasonStatistics.season, currentSeason)
          )
        )
        .orderBy(desc(teamSeasonStatistics.lastUpdated));

      res.json({ teams: teamsWithStats });
    } catch (error) {
      console.error('Error fetching teams with cached stats:', error);
      res.status(500).json({ error: "Failed to fetch teams with cached statistics" });
    }
  });

  // Admin endpoint to update all Premier League team statistics
  app.post("/api/admin/update-all-team-stats", async (req, res) => {
    try {
      console.log('📊 Admin triggered batch update for all Premier League teams...');
      
      const result = await updateAllPremierLeagueStats();
      
      // Return 500 if any errors occurred
      if (result.errors > 0 && result.teamsUpdated === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update any team statistics',
          teamsUpdated: result.teamsUpdated,
          errors: result.errors,
          errorDetails: `All ${result.errors} teams failed to update`
        });
      }
      
      // Return 207 Multi-Status if partial success (some teams updated, some failed)
      if (result.errors > 0 && result.teamsUpdated > 0) {
        return res.status(207).json({
          success: true,
          message: `Partial success: ${result.teamsUpdated} teams updated, ${result.errors} failed`,
          teamsUpdated: result.teamsUpdated,
          errors: result.errors,
          errorDetails: `${result.errors} teams failed to update`
        });
      }
      
      // Return 200 only if all teams updated successfully
      res.status(200).json({
        success: true,
        message: `Successfully updated statistics for all ${result.teamsUpdated} teams`,
        teamsUpdated: result.teamsUpdated,
        errors: result.errors
      });
    } catch (error) {
      console.error('Error in batch team stats update:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to update team statistics",
        message: error instanceof Error ? error.message : 'Unknown error',
        teamsUpdated: 0,
        errors: 1
      });
    }
  });

  // === FIXTURES AND H2H ENDPOINTS ===
  
  // Get fixture results with optional filtering
  app.get("/api/fixtures/results", async (req, res) => {
    try {
      const competitionId = req.query.competitionId ? parseInt(req.query.competitionId as string) : undefined;
      const seasonYear = req.query.seasonYear ? parseInt(req.query.seasonYear as string) : undefined;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      // Build where conditions dynamically
      const conditions = [];
      
      if (competitionId !== undefined && !isNaN(competitionId)) {
        conditions.push(eq(footballFixtures.leagueId, competitionId));
      }
      
      if (seasonYear !== undefined && !isNaN(seasonYear)) {
        conditions.push(eq(footballFixtures.season, seasonYear));
      }
      
      if (dateFrom && !isNaN(dateFrom.getTime())) {
        conditions.push(gte(footballFixtures.date, dateFrom));
      }
      
      if (dateTo && !isNaN(dateTo.getTime())) {
        conditions.push(lte(footballFixtures.date, dateTo));
      }
      
      // Query fixtures with filters
      const query = db
        .select({
          id: footballFixtures.id,
          date: footballFixtures.date,
          homeTeamId: footballFixtures.homeTeamId,
          awayTeamId: footballFixtures.awayTeamId,
          leagueId: footballFixtures.leagueId,
          season: footballFixtures.season,
          round: footballFixtures.round,
          goals: footballFixtures.goals,
          score: footballFixtures.score,
          status: footballFixtures.status,
          venue: footballFixtures.venue,
        })
        .from(footballFixtures);
      
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      const fixtures = await query
        .orderBy(desc(footballFixtures.date))
        .limit(Math.min(limit, 100)); // Cap at 100 for performance
      
      return res.json({ results: fixtures });
    } catch (error) {
      console.error('Error fetching fixture results:', error);
      return res.status(500).json({ error: "Failed to fetch fixture results" });
    }
  });
  
  // Get head-to-head fixtures with optional filtering
  app.get("/api/fixtures/h2h", async (req, res) => {
    try {
      const team1 = req.query.team1 ? parseInt(req.query.team1 as string) : undefined;
      const team2 = req.query.team2 ? parseInt(req.query.team2 as string) : undefined;
      const competitionId = req.query.competitionId ? parseInt(req.query.competitionId as string) : undefined;
      const homeOnly = req.query.homeOnly === 'true';
      const seasonFrom = req.query.seasonFrom ? parseInt(req.query.seasonFrom as string) : undefined;
      const seasonTo = req.query.seasonTo ? parseInt(req.query.seasonTo as string) : undefined;
      const venueFilter = req.query.venueFilter as string || 'all'; // 'home', 'away', 'all'
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!team1 || !team2 || isNaN(team1) || isNaN(team2)) {
        return res.status(400).json({ error: "Both team1 and team2 parameters are required" });
      }
      
      // Build where conditions
      const conditions = [];
      
      // Team matchup condition - check both directions
      conditions.push(
        or(
          and(
            eq(historicalHeadToHead.team1Id, team1),
            eq(historicalHeadToHead.team2Id, team2)
          ),
          and(
            eq(historicalHeadToHead.team1Id, team2),
            eq(historicalHeadToHead.team2Id, team1)
          )
        )
      );
      
      // Competition filter
      if (competitionId !== undefined && !isNaN(competitionId)) {
        conditions.push(eq(historicalHeadToHead.competitionId, competitionId));
      }
      
      // Season range filters
      if (seasonFrom !== undefined && !isNaN(seasonFrom)) {
        conditions.push(gte(historicalHeadToHead.season, seasonFrom));
      }
      
      if (seasonTo !== undefined && !isNaN(seasonTo)) {
        conditions.push(lte(historicalHeadToHead.season, seasonTo));
      }
      
      // Venue filter (home only for team1)
      if (homeOnly || venueFilter === 'home') {
        conditions.push(eq(historicalHeadToHead.homeTeamId, team1));
      } else if (venueFilter === 'away') {
        conditions.push(eq(historicalHeadToHead.awayTeamId, team1));
      }
      
      // Query h2h data
      const h2hMatches = await db
        .select()
        .from(historicalHeadToHead)
        .where(and(...conditions))
        .orderBy(desc(historicalHeadToHead.date))
        .limit(Math.min(limit, 50)); // Cap at 50 for performance
      
      // Calculate statistics from the matches
      let homeWins = 0;
      let awayWins = 0;
      let draws = 0;
      
      h2hMatches.forEach(match => {
        if (match.homeScore > match.awayScore) {
          if (match.homeTeamId === team1) homeWins++;
          else awayWins++;
        } else if (match.awayScore > match.homeScore) {
          if (match.awayTeamId === team1) awayWins++;
          else homeWins++;
        } else {
          draws++;
        }
      });
      
      return res.json({ 
        results: h2hMatches,
        statistics: {
          homeWins,
          awayWins,
          draws,
          totalMatches: h2hMatches.length
        }
      });
    } catch (error) {
      console.error('Error fetching h2h fixtures:', error);
      return res.status(500).json({ error: "Failed to fetch head-to-head fixtures" });
    }
  });
  
  // === LIVE PRESENTATION SYSTEM ROUTES ===

  // Library Items routes
  app.get("/api/library-items", async (req, res) => {
    try {
      const { type, category, search } = req.query;
      
      let items;
      if (search) {
        items = await storage.searchLibraryItems(search as string);
      } else if (type) {
        items = await storage.getLibraryItemsByType(type as string);
      } else if (category) {
        items = await storage.getLibraryItemsByCategory(category as string);
      } else {
        items = await storage.getLibraryItems();
      }
      
      res.json({ libraryItems: items });
    } catch (error) {
      console.error('Error fetching library items:', error);
      res.status(500).json({ error: "Failed to fetch library items" });
    }
  });

  app.get("/api/library-items/:id", async (req, res) => {
    try {
      const item = await storage.getLibraryItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Library item not found" });
      }
      res.json({ libraryItem: item });
    } catch (error) {
      console.error('Error fetching library item:', error);
      res.status(500).json({ error: "Failed to fetch library item" });
    }
  });

  app.post("/api/library-items", async (req, res) => {
    try {
      const validatedData = insertLibraryItemSchema.parse(req.body);
      const item = await storage.createLibraryItem(validatedData);
      res.status(201).json({ libraryItem: item });
    } catch (error) {
      console.error('Error creating library item:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create library item" });
      }
    }
  });

  app.put("/api/library-items/:id", async (req, res) => {
    try {
      const updates = insertLibraryItemSchema.partial().parse(req.body);
      const item = await storage.updateLibraryItem(req.params.id, updates);
      if (!item) {
        return res.status(404).json({ error: "Library item not found" });
      }
      res.json({ libraryItem: item });
    } catch (error) {
      console.error('Error updating library item:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update library item" });
      }
    }
  });

  app.delete("/api/library-items/:id", async (req, res) => {
    try {
      const success = await storage.deleteLibraryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Library item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting library item:', error);
      res.status(500).json({ error: "Failed to delete library item" });
    }
  });

  // Scenes routes
  app.get("/api/scenes", async (req, res) => {
    try {
      const { layout, templates, search } = req.query;
      
      let scenes;
      if (search) {
        scenes = await storage.searchScenes(search as string);
      } else if (layout) {
        scenes = await storage.getScenesByLayout(layout as string);
      } else if (templates === 'true') {
        scenes = await storage.getSceneTemplates();
      } else {
        scenes = await storage.getScenes();
      }
      
      res.json({ scenes });
    } catch (error) {
      console.error('Error fetching scenes:', error);
      res.status(500).json({ error: "Failed to fetch scenes" });
    }
  });

  app.get("/api/scenes/:id", async (req, res) => {
    try {
      const scene = await storage.getScene(req.params.id);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }
      res.json({ scene });
    } catch (error) {
      console.error('Error fetching scene:', error);
      res.status(500).json({ error: "Failed to fetch scene" });
    }
  });

  app.post("/api/scenes", async (req, res) => {
    try {
      const validatedData = insertSceneSchema.parse(req.body);
      const scene = await storage.createScene(validatedData);
      res.status(201).json({ scene });
    } catch (error) {
      console.error('Error creating scene:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create scene" });
      }
    }
  });

  app.put("/api/scenes/:id", async (req, res) => {
    try {
      const updates = insertSceneSchema.partial().parse(req.body);
      const scene = await storage.updateScene(req.params.id, updates);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }
      res.json({ scene });
    } catch (error) {
      console.error('Error updating scene:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update scene" });
      }
    }
  });

  app.delete("/api/scenes/:id", async (req, res) => {
    try {
      const success = await storage.deleteScene(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Scene not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting scene:', error);
      res.status(500).json({ error: "Failed to delete scene" });
    }
  });

  app.post("/api/scenes/:id/duplicate", async (req, res) => {
    try {
      const scene = await storage.duplicateScene(req.params.id);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }
      res.status(201).json({ scene });
    } catch (error) {
      console.error('Error duplicating scene:', error);
      res.status(500).json({ error: "Failed to duplicate scene" });
    }
  });

  // Scene Template routes
  app.get("/api/scene-templates", async (req, res) => {
    try {
      const templates = getAllSceneTemplates();
      res.json({ templates });
    } catch (error) {
      console.error('Error fetching scene templates:', error);
      res.status(500).json({ error: "Failed to fetch scene templates" });
    }
  });

  app.get("/api/scene-templates/:templateId", async (req, res) => {
    try {
      const template = getSceneTemplate(req.params.templateId);
      if (!template) {
        return res.status(404).json({ error: "Scene template not found" });
      }
      res.json({ template });
    } catch (error) {
      console.error('Error fetching scene template:', error);
      res.status(500).json({ error: "Failed to fetch scene template" });
    }
  });

  app.post("/api/scenes/from-template", async (req, res) => {
    try {
      const { templateId, name } = req.body;
      
      if (!templateId || !name) {
        return res.status(400).json({ error: "templateId and name are required" });
      }

      const template = getSceneTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Scene template not found" });
      }

      const sceneData: any = {
        ...template.template,
        name: name,
        isTemplate: false
      };

      const scene = await storage.createScene(sceneData);
      res.status(201).json({ scene });
    } catch (error) {
      console.error('Error creating scene from template:', error);
      res.status(500).json({ error: "Failed to create scene from template" });
    }
  });

  // OBS Browser Source route
  app.get("/obs/scene/:id", async (req, res) => {
    try {
      const scene = await storage.getScene(req.params.id);
      if (!scene) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Scene Not Found</title>
            <style>
              body { 
                background: rgba(0,0,0,0); 
                color: #fff; 
                font-family: sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div>Scene not found</div>
          </body>
          </html>
        `);
      }

      const enableAutoRefresh = req.query.refresh !== 'false';
      const refreshInterval = parseInt(req.query.interval as string) || 5000;

      let rssArticles: any[] = [];
      let rssSources: any[] = [];
      try {
        rssArticles = await storage.getRecentRssArticles(20);
        rssSources = await storage.getRssSources();
      } catch (error) {
        console.error('Error fetching RSS data for OBS scene:', error);
        rssArticles = [];
        rssSources = [];
      }

      const html = renderOBSScene(scene, {
        enableAutoRefresh,
        refreshInterval,
        rssArticles,
        rssSources
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      
      res.send(html);
    } catch (error) {
      console.error('Error rendering OBS scene:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { 
              background: rgba(0,0,0,0); 
              color: #f00; 
              font-family: sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div>Error rendering scene</div>
        </body>
        </html>
      `);
    }
  });

  // Presentation Scenes routes (aliased under /api/presentation/scenes)
  app.get("/api/presentation/scenes/templates", async (req, res) => {
    try {
      const templates = await storage.getSceneTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/presentation/scenes", async (req, res) => {
    try {
      const allScenes = await storage.getScenes();
      const scenes = allScenes.filter(scene => !scene.isTemplate);
      res.json(scenes);
    } catch (error) {
      console.error('Error fetching scenes:', error);
      res.status(500).json({ error: "Failed to fetch scenes" });
    }
  });

  app.post("/api/presentation/scenes", async (req, res) => {
    try {
      const validatedData = insertSceneSchema.parse(req.body);
      const scene = await storage.createScene(validatedData);
      res.status(201).json({ scene });
    } catch (error) {
      console.error('Error creating scene:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create scene" });
      }
    }
  });

  app.get("/api/presentation/scenes/:id", async (req, res) => {
    try {
      const scene = await storage.getScene(req.params.id);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }
      res.json({ scene });
    } catch (error) {
      console.error('Error fetching scene:', error);
      res.status(500).json({ error: "Failed to fetch scene" });
    }
  });

  app.put("/api/presentation/scenes/:id", async (req, res) => {
    try {
      const updates = insertSceneSchema.partial().parse(req.body);
      const scene = await storage.updateScene(req.params.id, updates);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }
      res.json({ scene });
    } catch (error) {
      console.error('Error updating scene:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update scene" });
      }
    }
  });

  app.delete("/api/presentation/scenes/:id", async (req, res) => {
    try {
      const success = await storage.deleteScene(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Scene not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting scene:', error);
      res.status(500).json({ error: "Failed to delete scene" });
    }
  });

  app.post("/api/presentation/scenes/:id/duplicate", async (req, res) => {
    try {
      const scene = await storage.duplicateScene(req.params.id);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }
      res.status(201).json({ scene });
    } catch (error) {
      console.error('Error duplicating scene:', error);
      res.status(500).json({ error: "Failed to duplicate scene" });
    }
  });

  // Presentation Sets routes
  app.get("/api/presentation-sets", async (req, res) => {
    try {
      const { active } = req.query;
      
      let sets;
      if (active === 'true') {
        sets = await storage.getActivePresentationSets();
      } else {
        sets = await storage.getPresentationSets();
      }
      
      res.json({ presentationSets: sets });
    } catch (error) {
      console.error('Error fetching presentation sets:', error);
      res.status(500).json({ error: "Failed to fetch presentation sets" });
    }
  });

  app.get("/api/presentation-sets/:id", async (req, res) => {
    try {
      const set = await storage.getPresentationSet(req.params.id);
      if (!set) {
        return res.status(404).json({ error: "Presentation set not found" });
      }
      res.json({ presentationSet: set });
    } catch (error) {
      console.error('Error fetching presentation set:', error);
      res.status(500).json({ error: "Failed to fetch presentation set" });
    }
  });

  app.post("/api/presentation-sets", async (req, res) => {
    try {
      const validatedData = insertPresentationSetSchema.parse(req.body);
      const set = await storage.createPresentationSet(validatedData);
      res.status(201).json({ presentationSet: set });
    } catch (error) {
      console.error('Error creating presentation set:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create presentation set" });
      }
    }
  });

  app.put("/api/presentation-sets/:id", async (req, res) => {
    try {
      const updates = insertPresentationSetSchema.partial().parse(req.body);
      const set = await storage.updatePresentationSet(req.params.id, updates);
      if (!set) {
        return res.status(404).json({ error: "Presentation set not found" });
      }
      res.json({ presentationSet: set });
    } catch (error) {
      console.error('Error updating presentation set:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update presentation set" });
      }
    }
  });

  app.delete("/api/presentation-sets/:id", async (req, res) => {
    try {
      const success = await storage.deletePresentationSet(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Presentation set not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting presentation set:', error);
      res.status(500).json({ error: "Failed to delete presentation set" });
    }
  });

  app.put("/api/presentation-sets/:id/scenes", async (req, res) => {
    try {
      const { sceneIds } = z.object({
        sceneIds: z.array(z.string())
      }).parse(req.body);
      
      const set = await storage.updatePresentationSet(req.params.id, { sceneIds });
      if (!set) {
        return res.status(404).json({ error: "Presentation set not found" });
      }
      res.json({ presentationSet: set });
    } catch (error) {
      console.error('Error reordering scenes:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to reorder scenes" });
      }
    }
  });

  // Presentation Sets routes (aliased under /api/presentation/sets)
  app.get("/api/presentation/sets", async (req, res) => {
    try {
      const sets = await storage.getPresentationSets();
      res.json(sets);
    } catch (error) {
      console.error('Error fetching presentation sets:', error);
      res.status(500).json({ error: "Failed to fetch presentation sets" });
    }
  });

  app.post("/api/presentation/sets", async (req, res) => {
    try {
      const validatedData = insertPresentationSetSchema.parse(req.body);
      const set = await storage.createPresentationSet(validatedData);
      res.status(201).json({ presentationSet: set });
    } catch (error) {
      console.error('Error creating presentation set:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create presentation set" });
      }
    }
  });

  app.get("/api/presentation/sets/:id", async (req, res) => {
    try {
      const set = await storage.getPresentationSet(req.params.id);
      if (!set) {
        return res.status(404).json({ error: "Presentation set not found" });
      }
      res.json({ presentationSet: set });
    } catch (error) {
      console.error('Error fetching presentation set:', error);
      res.status(500).json({ error: "Failed to fetch presentation set" });
    }
  });

  app.put("/api/presentation/sets/:id", async (req, res) => {
    try {
      const updates = insertPresentationSetSchema.partial().parse(req.body);
      const set = await storage.updatePresentationSet(req.params.id, updates);
      if (!set) {
        return res.status(404).json({ error: "Presentation set not found" });
      }
      res.json({ presentationSet: set });
    } catch (error) {
      console.error('Error updating presentation set:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update presentation set" });
      }
    }
  });

  app.delete("/api/presentation/sets/:id", async (req, res) => {
    try {
      const success = await storage.deletePresentationSet(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Presentation set not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting presentation set:', error);
      res.status(500).json({ error: "Failed to delete presentation set" });
    }
  });

  app.put("/api/presentation/sets/:id/scenes", async (req, res) => {
    try {
      const { sceneIds } = z.object({
        sceneIds: z.array(z.string())
      }).parse(req.body);
      
      const set = await storage.updatePresentationSet(req.params.id, { sceneIds });
      if (!set) {
        return res.status(404).json({ error: "Presentation set not found" });
      }
      res.json({ presentationSet: set });
    } catch (error) {
      console.error('Error reordering scenes:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to reorder scenes" });
      }
    }
  });

  // Ticker Playlists routes
  app.get("/api/ticker-playlists", async (req, res) => {
    try {
      const { active } = req.query;
      
      let playlists;
      if (active === 'true') {
        playlists = await storage.getActiveTickerPlaylists();
      } else {
        playlists = await storage.getTickerPlaylists();
      }
      
      res.json({ tickerPlaylists: playlists });
    } catch (error) {
      console.error('Error fetching ticker playlists:', error);
      res.status(500).json({ error: "Failed to fetch ticker playlists" });
    }
  });

  app.get("/api/ticker-playlists/:id", async (req, res) => {
    try {
      const playlist = await storage.getTickerPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ error: "Ticker playlist not found" });
      }
      res.json({ tickerPlaylist: playlist });
    } catch (error) {
      console.error('Error fetching ticker playlist:', error);
      res.status(500).json({ error: "Failed to fetch ticker playlist" });
    }
  });

  app.post("/api/ticker-playlists", async (req, res) => {
    try {
      const validatedData = insertTickerPlaylistSchema.parse(req.body);
      const playlist = await storage.createTickerPlaylist(validatedData);
      res.status(201).json({ tickerPlaylist: playlist });
    } catch (error) {
      console.error('Error creating ticker playlist:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create ticker playlist" });
      }
    }
  });

  app.put("/api/ticker-playlists/:id", async (req, res) => {
    try {
      const updates = insertTickerPlaylistSchema.partial().parse(req.body);
      const playlist = await storage.updateTickerPlaylist(req.params.id, updates);
      if (!playlist) {
        return res.status(404).json({ error: "Ticker playlist not found" });
      }
      res.json({ tickerPlaylist: playlist });
    } catch (error) {
      console.error('Error updating ticker playlist:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update ticker playlist" });
      }
    }
  });

  app.delete("/api/ticker-playlists/:id", async (req, res) => {
    try {
      const success = await storage.deleteTickerPlaylist(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Ticker playlist not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting ticker playlist:', error);
      res.status(500).json({ error: "Failed to delete ticker playlist" });
    }
  });

  // Template Management Routes (Branded Banners)
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json({ templates });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ template });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(validatedData);
      res.status(201).json({ template });
    } catch (error) {
      console.error('Error creating template:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create template" });
      }
    }
  });

  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const updates = insertTemplateSchema.partial().parse(req.body);
      const template = await storage.updateTemplate(req.params.id, updates);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ template });
    } catch (error) {
      console.error('Error updating template:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update template" });
      }
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const success = await storage.deleteTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Video Source routes
  app.get("/api/video-sources", async (req, res) => {
    try {
      const sources = await storage.getVideoSources();
      res.json({ videoSources: sources });
    } catch (error) {
      console.error('Error fetching video sources:', error);
      res.status(500).json({ error: "Failed to fetch video sources" });
    }
  });

  app.get("/api/video-sources/:id", async (req, res) => {
    try {
      const source = await storage.getVideoSource(req.params.id);
      if (!source) {
        return res.status(404).json({ error: "Video source not found" });
      }
      res.json({ videoSource: source });
    } catch (error) {
      console.error('Error fetching video source:', error);
      res.status(500).json({ error: "Failed to fetch video source" });
    }
  });

  app.post("/api/video-sources", async (req, res) => {
    try {
      const validatedData = insertVideoSourceSchema.parse(req.body);
      const source = await storage.createVideoSource(validatedData);
      res.status(201).json({ videoSource: source });
    } catch (error) {
      console.error('Error creating video source:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create video source" });
      }
    }
  });

  app.put("/api/video-sources/:id", async (req, res) => {
    try {
      const updates = insertVideoSourceSchema.partial().parse(req.body);
      const source = await storage.updateVideoSource(req.params.id, updates);
      if (!source) {
        return res.status(404).json({ error: "Video source not found" });
      }
      res.json({ videoSource: source });
    } catch (error) {
      console.error('Error updating video source:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update video source" });
      }
    }
  });

  app.delete("/api/video-sources/:id", async (req, res) => {
    try {
      const success = await storage.deleteVideoSource(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Video source not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting video source:', error);
      res.status(500).json({ error: "Failed to delete video source" });
    }
  });

  app.post("/api/video-sources/:id/connect", async (req, res) => {
    try {
      const source = await storage.updateVideoSource(req.params.id, {
        isConnected: true
      });
      if (!source) {
        return res.status(404).json({ error: "Video source not found" });
      }
      res.json({ videoSource: source });
    } catch (error) {
      console.error('Error connecting video source:', error);
      res.status(500).json({ error: "Failed to connect video source" });
    }
  });

  app.post("/api/video-sources/:id/disconnect", async (req, res) => {
    try {
      const source = await storage.updateVideoSource(req.params.id, {
        isConnected: false
      });
      if (!source) {
        return res.status(404).json({ error: "Video source not found" });
      }
      res.json({ videoSource: source });
    } catch (error) {
      console.error('Error disconnecting video source:', error);
      res.status(500).json({ error: "Failed to disconnect video source" });
    }
  });

  // Source Template routes
  app.get("/api/source-templates", async (req, res) => {
    try {
      const templates = await storage.getSourceTemplates();
      res.json({ sourceTemplates: templates });
    } catch (error) {
      console.error('Error fetching source templates:', error);
      res.status(500).json({ error: "Failed to fetch source templates" });
    }
  });

  app.get("/api/source-templates/:id", async (req, res) => {
    try {
      const template = await storage.getSourceTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Source template not found" });
      }
      res.json({ sourceTemplate: template });
    } catch (error) {
      console.error('Error fetching source template:', error);
      res.status(500).json({ error: "Failed to fetch source template" });
    }
  });

  app.post("/api/source-templates", async (req, res) => {
    try {
      const validatedData = insertSourceTemplateSchema.parse(req.body);
      const template = await storage.createSourceTemplate(validatedData);
      res.status(201).json({ sourceTemplate: template });
    } catch (error) {
      console.error('Error creating source template:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create source template" });
      }
    }
  });

  app.patch("/api/source-templates/:id", async (req, res) => {
    try {
      const updates = insertSourceTemplateSchema.partial().parse(req.body);
      const template = await storage.updateSourceTemplate(req.params.id, updates);
      res.json({ sourceTemplate: template });
    } catch (error) {
      console.error('Error updating source template:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update source template" });
      }
    }
  });

  app.delete("/api/source-templates/:id", async (req, res) => {
    try {
      await storage.deleteSourceTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting source template:', error);
      res.status(500).json({ error: "Failed to delete source template" });
    }
  });

  // Set Template routes
  app.get("/api/set-templates", async (req, res) => {
    try {
      const templates = await storage.getSetTemplates();
      res.json({ setTemplates: templates });
    } catch (error) {
      console.error('Error fetching set templates:', error);
      res.status(500).json({ error: "Failed to fetch set templates" });
    }
  });

  app.get("/api/set-templates/:id", async (req, res) => {
    try {
      const template = await storage.getSetTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Set template not found" });
      }
      res.json({ setTemplate: template });
    } catch (error) {
      console.error('Error fetching set template:', error);
      res.status(500).json({ error: "Failed to fetch set template" });
    }
  });

  app.post("/api/set-templates", async (req, res) => {
    try {
      const validatedData = insertSetTemplateSchema.parse(req.body);
      const template = await storage.createSetTemplate(validatedData);
      res.status(201).json({ setTemplate: template });
    } catch (error) {
      console.error('Error creating set template:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create set template" });
      }
    }
  });

  app.patch("/api/set-templates/:id", async (req, res) => {
    try {
      const updates = insertSetTemplateSchema.partial().parse(req.body);
      const template = await storage.updateSetTemplate(req.params.id, updates);
      res.json({ setTemplate: template });
    } catch (error) {
      console.error('Error updating set template:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update set template" });
      }
    }
  });

  app.delete("/api/set-templates/:id", async (req, res) => {
    try {
      await storage.deleteSetTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting set template:', error);
      res.status(500).json({ error: "Failed to delete set template" });
    }
  });

  // Live State routes
  app.get("/api/live/state", async (req, res) => {
    try {
      const liveState = await storage.getLiveState();
      res.json(liveState);
    } catch (error) {
      console.error('Error fetching live state:', error);
      res.status(500).json({ error: "Failed to fetch live state" });
    }
  });

  // Old PUT /api/live/state route removed - replaced by PATCH /api/live-state with new schema

  // Server-Sent Events endpoint for real-time live presentation updates
  app.get("/api/live/stream", (req, res) => {
    const clientId = req.query.clientId as string || `client-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Add client to SSE manager
    liveSSEManager.addClient(clientId, res);

    // Send initial state
    storage.getLiveState().then(liveState => {
      liveSSEManager.sendToClient(clientId, 'initial-state', liveState);
    }).catch(error => {
      console.error('Error getting initial live state:', error);
    });

    // Handle client disconnect
    req.on('close', () => {
      liveSSEManager.removeClient(clientId);
    });

    req.on('error', (error) => {
      console.error('SSE connection error:', error);
      liveSSEManager.removeClient(clientId);
    });
  });

  // Old live control commands endpoint removed - used old LiveState schema with programSceneId, previewSceneId, tickerOn, etc.

  // Generate control token endpoint (for authenticated users)
  app.post("/api/live/token", async (req, res) => {
    try {
      const { permissions } = req.body;
      const validPermissions = ['basic', 'admin'];
      const requestedPermissions = Array.isArray(permissions) 
        ? permissions.filter(p => validPermissions.includes(p))
        : ['basic'];
      
      const token = generateControlToken(requestedPermissions);
      
      res.json({ 
        token,
        permissions: requestedPermissions,
        expiresIn: '30 minutes'
      });
    } catch (error) {
      console.error('Error generating control token:', error);
      res.status(500).json({ error: "Failed to generate control token" });
    }
  });

  // Live status endpoint
  app.get("/api/live/status", async (req, res) => {
    try {
      const liveState = await storage.getLiveState();
      const connectedClients = liveSSEManager.getClientCount();
      
      res.json({
        liveState,
        connectedClients,
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching live status:', error);
      res.status(500).json({ error: "Failed to fetch live status" });
    }
  });

  // Quick Setup endpoint - creates a complete setup in one click
  app.post("/api/live/quick-setup", async (req, res) => {
    try {
      // Get available video sources to auto-connect
      const videoSources = await storage.getVideoSources();
      const connectedSource = videoSources.find(s => s.isConnected && s.isActive);
      
      // Create a default scene with basic layers
      const sceneData = {
        name: "Quick Setup Scene",
        description: "Default scene created by Quick Setup",
        layout: "fullscreen",
        aspectRatio: "16:9",
        isTemplate: false,
        tags: ["default", "quick-setup"],
        elements: [
          {
            id: `video-${Date.now()}`,
            type: "video" as const,
            zone: "main",
            position: {
              x: 0,
              y: 0,
              width: 100,
              height: 90
            },
            content: connectedSource ? `Connected: ${connectedSource.name}` : "No source - connect a camera or add source in Sources tab",
            sourceId: connectedSource?.id,
            style: {}
          },
          {
            id: `ticker-${Date.now()}`,
            type: "ticker" as const,
            zone: "overlay",
            position: {
              x: 0,
              y: 90,
              width: 100,
              height: 10
            },
            content: "",
            style: {}
          }
        ]
      };

      const scene = await storage.createScene(sceneData);

      // Create a presentation set with the scene
      const setData = {
        name: "Quick Setup Show",
        description: "Default presentation set created by Quick Setup",
        sceneIds: [scene.id],
        isActive: true
      };

      const presentationSet = await storage.createPresentationSet(setData);

      // Note: Old LiveState update removed (currentSetId, previewSceneId no longer exist in new schema)
      
      // Broadcast the update to all connected SSE clients
      liveSSEManager.broadcast('quick-setup-complete', {
        scene,
        presentationSet
      });

      res.status(201).json({
        success: true,
        message: "Quick setup completed successfully",
        scene,
        presentationSet
      });
    } catch (error) {
      console.error('Error in quick setup:', error);
      res.status(500).json({ error: "Failed to complete quick setup" });
    }
  });

  // Video Recording Endpoints
  
  // Upload a new video recording
  app.post("/api/recordings", videoUpload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      const { duration, resolution, codec, metadata } = req.body;
      
      const recording = await storage.createRecording({
        filename: req.file.filename,
        filepath: req.file.path,
        duration: duration ? parseInt(duration) : undefined,
        size: req.file.size,
        resolution: resolution || undefined,
        format: 'webm',
        codec: codec || undefined,
        metadata: metadata ? JSON.parse(metadata) : {},
      });

      res.status(201).json(recording);
    } catch (error: any) {
      console.error('Error uploading recording:', error);
      res.status(500).json({ error: "Failed to upload recording" });
    }
  });

  // Get all recordings
  app.get("/api/recordings", async (req, res) => {
    try {
      const recordings = await storage.getRecordings();
      res.json(recordings);
    } catch (error: any) {
      console.error('Error fetching recordings:', error);
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  // Get a single recording
  app.get("/api/recordings/:id", async (req, res) => {
    try {
      const recording = await storage.getRecording(req.params.id);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }
      res.json(recording);
    } catch (error: any) {
      console.error('Error fetching recording:', error);
      res.status(500).json({ error: "Failed to fetch recording" });
    }
  });

  // Delete a recording
  app.delete("/api/recordings/:id", async (req, res) => {
    try {
      const recording = await storage.getRecording(req.params.id);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      // Delete the file from filesystem
      try {
        await fs.unlink(recording.filepath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }

      // Delete from database
      await storage.deleteRecording(req.params.id);
      
      res.json({ success: true, message: "Recording deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting recording:', error);
      res.status(500).json({ error: "Failed to delete recording" });
    }
  });

  // Serve video files
  app.get("/api/recordings/:id/video", async (req, res) => {
    try {
      const recording = await storage.getRecording(req.params.id);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      res.sendFile(path.resolve(recording.filepath));
    } catch (error: any) {
      console.error('Error serving video:', error);
      res.status(500).json({ error: "Failed to serve video" });
    }
  });

  // =============== Video Project Routes ===============
  
  // Create a new video project
  app.post("/api/video-projects", async (req, res) => {
    try {
      const validatedData = insertVideoProjectSchema.parse(req.body);
      
      // Get the recording to get its duration
      const recording = await storage.getRecording(validatedData.recordingId);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }
      
      // Create the project
      const project = await storage.createVideoProject(validatedData);
      
      // Create an initial clip that spans the entire recording
      const durationMs = (recording.duration || 0) * 1000;
      await storage.createVideoClip({
        projectId: project.id,
        sourceRecordingId: recording.id,
        startTime: 0,
        endTime: durationMs,
        duration: durationMs,
        order: 0
      });
      
      res.status(201).json(project);
    } catch (error: any) {
      console.error('Error creating video project:', error);
      res.status(400).json({ error: error.message || "Failed to create video project" });
    }
  });

  // Get all video projects
  app.get("/api/video-projects", async (req, res) => {
    try {
      const projects = await storage.getVideoProjects();
      res.json(projects);
    } catch (error: any) {
      console.error('Error fetching video projects:', error);
      res.status(500).json({ error: "Failed to fetch video projects" });
    }
  });

  // Get a single video project
  app.get("/api/video-projects/:id", async (req, res) => {
    try {
      const project = await storage.getVideoProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Video project not found" });
      }
      res.json(project);
    } catch (error: any) {
      console.error('Error fetching video project:', error);
      res.status(500).json({ error: "Failed to fetch video project" });
    }
  });

  // Delete a video project
  app.delete("/api/video-projects/:id", async (req, res) => {
    try {
      const project = await storage.getVideoProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Video project not found" });
      }

      await storage.deleteVideoProject(req.params.id);
      res.json({ success: true, message: "Video project deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting video project:', error);
      res.status(500).json({ error: "Failed to delete video project" });
    }
  });

  // Analyze video for auto-cutting
  app.post("/api/video-projects/:id/analyze", async (req, res) => {
    try {
      const project = await storage.getVideoProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Video project not found" });
      }

      const recording = await storage.getRecording(project.recordingId);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      // Run auto-cut analysis
      const cutPoints = await analyzeCutPoints(recording.filepath);
      const segments = await optimizePacing(cutPoints, recording.duration || 0);

      // Create clips from segments
      const clips = [];
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const clip = await storage.createVideoClip({
          projectId: req.params.id,
          sourceRecordingId: recording.id,
          startTime: Math.floor(segment.startTime * 1000),
          endTime: Math.floor(segment.endTime * 1000),
          duration: Math.floor(segment.duration * 1000),
          order: i,
          trimStart: 0,
          trimEnd: 0,
          effects: {},
          metadata: { type: segment.type }
        });
        clips.push(clip);
      }

      // Update project duration
      const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
      await storage.updateVideoProject(req.params.id, {
        duration: Math.floor(totalDuration),
        aiSettings: { autoAnalyzed: true, cutPoints: cutPoints.length, segments: segments.length }
      });

      res.json({ clips, cutPoints: cutPoints.length, segments: segments.length });
    } catch (error: any) {
      console.error('Error analyzing video:', error);
      res.status(500).json({ error: "Failed to analyze video" });
    }
  });

  // =============== Video Clip Routes ===============

  // Get clips for a project
  app.get("/api/video-projects/:id/clips", async (req, res) => {
    try {
      const clips = await storage.getVideoClips(req.params.id);
      res.json(clips);
    } catch (error: any) {
      console.error('Error fetching clips:', error);
      res.status(500).json({ error: "Failed to fetch clips" });
    }
  });

  // Add or update clips
  app.post("/api/video-projects/:id/clips", async (req, res) => {
    try {
      const { clips } = req.body;
      if (!Array.isArray(clips)) {
        return res.status(400).json({ error: "Clips must be an array" });
      }

      const createdClips = [];
      for (const clipData of clips) {
        const validatedClip = insertVideoClipSchema.parse({
          ...clipData,
          projectId: req.params.id
        });
        const clip = await storage.createVideoClip(validatedClip);
        createdClips.push(clip);
      }

      res.status(201).json({ clips: createdClips });
    } catch (error: any) {
      console.error('Error creating clips:', error);
      res.status(400).json({ error: error.message || "Failed to create clips" });
    }
  });

  // Update a clip
  app.patch("/api/video-projects/:projectId/clips/:clipId", async (req, res) => {
    try {
      const clip = await storage.getVideoClip(req.params.clipId);
      if (!clip) {
        return res.status(404).json({ error: "Clip not found" });
      }

      const updatedClip = await storage.updateVideoClip(req.params.clipId, req.body);
      res.json(updatedClip);
    } catch (error: any) {
      console.error('Error updating clip:', error);
      res.status(400).json({ error: error.message || "Failed to update clip" });
    }
  });

  // Delete a clip
  app.delete("/api/video-projects/:projectId/clips/:clipId", async (req, res) => {
    try {
      const clip = await storage.getVideoClip(req.params.clipId);
      if (!clip) {
        return res.status(404).json({ error: "Clip not found" });
      }

      await storage.deleteVideoClip(req.params.clipId);
      res.json({ success: true, message: "Clip deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting clip:', error);
      res.status(500).json({ error: "Failed to delete clip" });
    }
  });

  // =============== Text Overlay Routes ===============

  // Get text overlays for a project
  app.get("/api/video-projects/:id/text-overlays", async (req, res) => {
    try {
      const overlays = await storage.getTextOverlays(req.params.id);
      res.json(overlays);
    } catch (error: any) {
      console.error('Error fetching text overlays:', error);
      res.status(500).json({ error: "Failed to fetch text overlays" });
    }
  });

  // Create a text overlay
  app.post("/api/video-projects/:id/text-overlays", async (req, res) => {
    try {
      const overlay = await storage.createTextOverlay({
        ...req.body,
        projectId: req.params.id
      });
      res.status(201).json(overlay);
    } catch (error: any) {
      console.error('Error creating text overlay:', error);
      res.status(400).json({ error: error.message || "Failed to create text overlay" });
    }
  });

  // Update a text overlay
  app.patch("/api/video-projects/:projectId/text-overlays/:overlayId", async (req, res) => {
    try {
      const overlay = await storage.updateTextOverlay(req.params.overlayId, req.body);
      res.json(overlay);
    } catch (error: any) {
      console.error('Error updating text overlay:', error);
      res.status(400).json({ error: error.message || "Failed to update text overlay" });
    }
  });

  // Delete a text overlay
  app.delete("/api/video-projects/:projectId/text-overlays/:overlayId", async (req, res) => {
    try {
      await storage.deleteTextOverlay(req.params.overlayId);
      res.json({ success: true, message: "Text overlay deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting text overlay:', error);
      res.status(500).json({ error: "Failed to delete text overlay" });
    }
  });

  // =============== Keyframe Routes ===============

  // Get keyframes for a clip
  app.get("/api/video-clips/:clipId/keyframes", async (req, res) => {
    try {
      const keyframes = await storage.getKeyframes(req.params.clipId);
      res.json(keyframes);
    } catch (error: any) {
      console.error('Error fetching keyframes:', error);
      res.status(500).json({ error: "Failed to fetch keyframes" });
    }
  });

  // Create a keyframe
  app.post("/api/video-clips/:clipId/keyframes", async (req, res) => {
    try {
      const keyframe = await storage.createKeyframe({
        ...req.body,
        clipId: req.params.clipId
      });
      res.status(201).json(keyframe);
    } catch (error: any) {
      console.error('Error creating keyframe:', error);
      res.status(400).json({ error: error.message || "Failed to create keyframe" });
    }
  });

  // Delete a keyframe
  app.delete("/api/video-clips/:clipId/keyframes/:keyframeId", async (req, res) => {
    try {
      await storage.deleteKeyframe(req.params.keyframeId);
      res.json({ success: true, message: "Keyframe deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting keyframe:', error);
      res.status(500).json({ error: "Failed to delete keyframe" });
    }
  });

  // =============== Audio Track Routes ===============

  // Get audio tracks for a project
  app.get("/api/video-projects/:id/audio-tracks", async (req, res) => {
    try {
      const tracks = await storage.getAudioTracks(req.params.id);
      res.json(tracks);
    } catch (error: any) {
      console.error('Error fetching audio tracks:', error);
      res.status(500).json({ error: "Failed to fetch audio tracks" });
    }
  });

  // Create an audio track
  app.post("/api/video-projects/:id/audio-tracks", async (req, res) => {
    try {
      const track = await storage.createAudioTrack({
        ...req.body,
        projectId: req.params.id
      });
      res.status(201).json(track);
    } catch (error: any) {
      console.error('Error creating audio track:', error);
      res.status(400).json({ error: error.message || "Failed to create audio track" });
    }
  });

  // Update an audio track
  app.patch("/api/video-projects/:projectId/audio-tracks/:trackId", async (req, res) => {
    try {
      const track = await storage.updateAudioTrack(req.params.trackId, req.body);
      res.json(track);
    } catch (error: any) {
      console.error('Error updating audio track:', error);
      res.status(400).json({ error: error.message || "Failed to update audio track" });
    }
  });

  // Delete an audio track
  app.delete("/api/video-projects/:projectId/audio-tracks/:trackId", async (req, res) => {
    try {
      await storage.deleteAudioTrack(req.params.trackId);
      res.json({ success: true, message: "Audio track deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting audio track:', error);
      res.status(500).json({ error: "Failed to delete audio track" });
    }
  });

  // =============== Render Job Routes ===============

  // Start a render job
  app.post("/api/video-projects/:id/render", async (req, res) => {
    try {
      const project = await storage.getVideoProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Video project not found" });
      }

      const clips = await storage.getVideoClips(req.params.id);
      if (clips.length === 0) {
        return res.status(400).json({ error: "Project has no clips to render" });
      }

      const settings = req.body.settings || {
        format: 'mp4',
        resolution: { width: 1920, height: 1080 },
        bitrate: '8M',
        fps: 30
      };

      const jobId = await addRenderJob(req.params.id, clips, settings);
      
      await storage.updateVideoProject(req.params.id, { status: 'processing' });
      
      res.status(201).json({ renderJobId: jobId });
    } catch (error: any) {
      console.error('Error starting render:', error);
      res.status(500).json({ error: "Failed to start render" });
    }
  });

  // Get all render jobs
  app.get("/api/render-jobs", async (req, res) => {
    try {
      const jobs = await storage.getRenderJobs();
      res.json(jobs);
    } catch (error: any) {
      console.error('Error fetching render jobs:', error);
      res.status(500).json({ error: "Failed to fetch render jobs" });
    }
  });

  // Get render job status
  app.get("/api/render-jobs/:id/status", async (req, res) => {
    try {
      const job = await storage.getRenderJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Render job not found" });
      }

      res.json({
        id: job.id,
        status: job.status,
        progress: job.progress,
        processingSteps: job.processingSteps,
        errorMessage: job.errorMessage
      });
    } catch (error: any) {
      console.error('Error fetching render job status:', error);
      res.status(500).json({ error: "Failed to fetch render job status" });
    }
  });

  // Download rendered video
  app.get("/api/render-jobs/:id/download", async (req, res) => {
    try {
      const job = await storage.getRenderJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Render job not found" });
      }

      if (job.status !== 'completed' || !job.outputPath) {
        return res.status(400).json({ error: "Render not completed yet" });
      }

      const project = await storage.getVideoProject(job.projectId);
      const filename = `${project?.name || 'video'}_${job.id}.${job.outputPath.endsWith('.webm') ? 'webm' : 'mp4'}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(path.resolve(job.outputPath));
    } catch (error: any) {
      console.error('Error downloading render:', error);
      res.status(500).json({ error: "Failed to download render" });
    }
  });

  // Delete a render job
  app.delete("/api/render-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getRenderJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Render job not found" });
      }

      // Delete output file if it exists
      if (job.outputPath) {
        try {
          await fs.unlink(job.outputPath);
        } catch (error) {
          console.error('Error deleting render file:', error);
        }
      }

      await storage.deleteRenderJob(req.params.id);
      res.json({ success: true, message: "Render job deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting render job:', error);
      res.status(500).json({ error: "Failed to delete render job" });
    }
  });

  // =============== Database Status Route ===============
  
  // Get database status and data availability
  app.get("/api/database-status", async (req, res) => {
    try {
      // Get player season statistics using raw SQL
      const playerSeasonsResult = await db.execute(
        `SELECT 
          season,
          COUNT(*) as player_count,
          SUM(goals) as total_goals,
          SUM(assists) as total_assists,
          MIN(last_updated) as earliest_update,
          MAX(last_updated) as latest_update
        FROM player_season_statistics
        GROUP BY season
        ORDER BY season DESC`
      );

      // Get other table stats
      const rssArticles = await storage.getRssArticles();
      const players = await db.select().from(footballPlayers);
      const teamStats = await db.select().from(teamSeasonStatistics);
      const recordings = await storage.getRecordings();
      const videoProjects = await storage.getVideoProjects();

      // Get historical head to head data
      const h2hResult = await db.execute(
        `SELECT COUNT(*) as count, MIN(date) as earliest, MAX(date) as latest FROM historical_head_to_head`
      );

      const h2hData = h2hResult.rows[0] || { count: 0, earliest: null, latest: null };

      // Helper function to safely get dates from articles
      const getArticleDates = (articles: typeof rssArticles) => {
        const articlesWithDates = articles.filter(a => a.publishedAt);
        if (articlesWithDates.length === 0) return { earliest: null, latest: null };
        
        const timestamps = articlesWithDates.map(a => new Date(a.publishedAt!).getTime());
        return {
          earliest: new Date(Math.min(...timestamps)).toISOString(),
          latest: new Date(Math.max(...timestamps)).toISOString()
        };
      };

      const articleDates = getArticleDates(rssArticles);

      // Helper function to safely get recording dates
      const getRecordingDates = (recs: typeof recordings) => {
        if (recs.length === 0) return { earliest: null, latest: null };
        
        const timestamps = recs.map(r => new Date(r.createdAt).getTime());
        return {
          earliest: new Date(Math.min(...timestamps)).toISOString(),
          latest: new Date(Math.max(...timestamps)).toISOString()
        };
      };

      const recordingDates = getRecordingDates(recordings);

      const tables = [
        {
          tableName: 'RSS Articles',
          recordCount: rssArticles.length,
          earliestDate: articleDates.earliest,
          latestDate: articleDates.latest
        },
        {
          tableName: 'Football Players',
          recordCount: players.length,
          earliestDate: null,
          latestDate: null
        },
        {
          tableName: 'Team Season Statistics',
          recordCount: teamStats.length,
          earliestDate: null,
          latestDate: null
        },
        {
          tableName: 'Historical Head-to-Head',
          recordCount: Number(h2hData.count) || 0,
          earliestDate: h2hData.earliest ? new Date(String(h2hData.earliest)).toISOString() : null,
          latestDate: h2hData.latest ? new Date(String(h2hData.latest)).toISOString() : null
        },
        {
          tableName: 'Video Projects',
          recordCount: videoProjects.length,
          earliestDate: null,
          latestDate: null
        },
        {
          tableName: 'Recordings',
          recordCount: recordings.length,
          earliestDate: recordingDates.earliest,
          latestDate: recordingDates.latest
        }
      ];

      res.json({
        tables,
        playerSeasons: playerSeasonsResult.rows.map((s: any) => ({
          season: Number(s.season),
          playerCount: Number(s.player_count) || 0,
          totalGoals: Number(s.total_goals) || 0,
          totalAssists: Number(s.total_assists) || 0,
          earliestUpdate: s.earliest_update ? new Date(s.earliest_update).toISOString() : new Date().toISOString(),
          latestUpdate: s.latest_update ? new Date(s.latest_update).toISOString() : new Date().toISOString()
        })),
        lastApiUpdate: null,
        dataSource: 'historical' as const
      });
    } catch (error: any) {
      console.error('Error fetching database status:', error);
      res.status(500).json({ error: "Failed to fetch database status" });
    }
  });

  registerAnalyticsRoutes(app, storage);

  const httpServer = createServer(app);

  return httpServer;
}
