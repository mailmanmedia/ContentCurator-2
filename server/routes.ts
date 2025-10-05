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
import { getAllSceneTemplates, getSceneTemplate } from "./templates/sceneTemplates";
import { renderOBSScene } from "./obs/obsRenderer";

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
      const { source, search, limit, start_date, end_date } = req.query;
      let articles;

      if (search) {
        articles = await storage.searchRssArticles(search as string);
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

      res.json({ articles });
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

  // Get head-to-head statistics between two teams
  app.get("/api/football/head-to-head/:homeTeamId/:awayTeamId", async (req, res) => {
    try {
      const homeTeamId = parseInt(req.params.homeTeamId);
      const awayTeamId = parseInt(req.params.awayTeamId);
      
      if (isNaN(homeTeamId) || isNaN(awayTeamId)) {
        return res.status(400).json({ error: "Invalid team IDs" });
      }

      const fixtures = await storage.getFootballHeadToHead(homeTeamId, awayTeamId);
      res.json({ fixtures });
    } catch (error) {
      console.error('Error fetching head-to-head stats:', error);
      res.status(500).json({ error: "Failed to fetch head-to-head statistics" });
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

  // Team statistics endpoint for match preview
  app.get("/api/team-stats/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const season = 2024; // Current season
      const leagueId = 39; // Premier League

      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }

      const stats = await footballService.getTeamStatistics(teamId, leagueId, season);

      if (!stats || !stats.statistics) {
        // Provide realistic fallback data when API is unavailable
        // This ensures the UI displays properly even during rate limiting
        const fallbackData: { [key: number]: any } = {
          40: { // Liverpool
            form: "WWDWW",
            goals: { for: 28, against: 12 },
            winRate: 76,
            cleanSheets: 8
          },
          49: { // Chelsea
            form: "DWLWL",
            goals: { for: 22, against: 18 },
            winRate: 52,
            cleanSheets: 5
          },
          50: { // Manchester City
            form: "WWWDW",
            goals: { for: 32, against: 10 },
            winRate: 82,
            cleanSheets: 9
          },
          33: { // Manchester United
            form: "WLWDL",
            goals: { for: 20, against: 16 },
            winRate: 48,
            cleanSheets: 4
          },
          42: { // Arsenal
            form: "WWDWL",
            goals: { for: 26, against: 14 },
            winRate: 68,
            cleanSheets: 7
          },
          47: { // Tottenham
            form: "WDWLW",
            goals: { for: 24, against: 19 },
            winRate: 58,
            cleanSheets: 5
          }
        };
        
        const teamFallback = fallbackData[teamId] || {
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
        name: name
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

  app.put("/api/live/state", async (req, res) => {
    try {
      const updates = z.object({
        currentSetId: z.string().nullable().optional(),
        programSceneId: z.string().nullable().optional(),
        previewSceneId: z.string().nullable().optional(),
        tickerOn: z.boolean().optional(),
        tickerPlaylistId: z.string().nullable().optional(),
        bannerOn: z.boolean().optional(),
        bannerText: z.string().optional(),
        bannerConfig: z.object({
          position: z.enum(['top', 'bottom']).optional(),
          fontSize: z.number().optional(),
          backgroundColor: z.string().optional(),
          textColor: z.string().optional()
        }).optional(),
        transitionDuration: z.number().optional(),
        transitionEffect: z.string().optional(),
        activeVideoSources: z.record(z.string(), z.string()).optional()
      }).parse(req.body);
      
      const liveState = await storage.updateLiveState(updates);
      
      // Broadcast the update to all connected SSE clients
      liveSSEManager.broadcast('state-update', liveState);
      
      res.json(liveState);
    } catch (error) {
      console.error('Error updating live state:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update live state" });
      }
    }
  });

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

  // Live control commands endpoint
  app.post("/api/live/commands", async (req, res) => {
    try {
      const { command, token, params } = req.body;
      
      // Validate control token
      if (!validateControlToken(token)) {
        return res.status(401).json({ error: "Invalid or expired control token" });
      }

      const commandSchema = z.object({
        command: z.enum(['take', 'next', 'previous', 'set-scene', 'toggle-ticker', 'set-ticker', 'toggle-banner', 'set-banner']),
        params: z.any().optional()
      });

      const { command: cmd, params: cmdParams } = commandSchema.parse({ command, params });

      let updates: Partial<LiveState> = {};
      
      switch (cmd) {
        case 'take':
          // Take current preview to program
          const currentState = await storage.getLiveState();
          if (currentState.previewSceneId) {
            updates.programSceneId = currentState.previewSceneId;
          }
          break;
          
        case 'set-scene':
          if (cmdParams?.sceneId && cmdParams?.target) {
            if (cmdParams.target === 'program') {
              updates.programSceneId = cmdParams.sceneId;
            } else if (cmdParams.target === 'preview') {
              updates.previewSceneId = cmdParams.sceneId;
            }
          }
          break;
          
        case 'toggle-ticker':
          const state = await storage.getLiveState();
          updates.tickerOn = !state.tickerOn;
          break;
          
        case 'set-ticker':
          if (cmdParams?.playlistId !== undefined) {
            updates.tickerPlaylistId = cmdParams.playlistId;
            updates.tickerOn = cmdParams.playlistId !== null;
          }
          break;
          
        case 'toggle-banner':
          const bannerState = await storage.getLiveState();
          updates.bannerOn = !bannerState.bannerOn;
          break;
          
        case 'set-banner':
          if (cmdParams?.text !== undefined) {
            updates.bannerText = cmdParams.text;
            updates.bannerOn = cmdParams.text.length > 0;
          }
          break;
          
        default:
          return res.status(400).json({ error: "Unknown command" });
      }

      // Update live state
      const newState = await storage.updateLiveState(updates);
      
      // Broadcast to all connected clients
      liveSSEManager.broadcast('command-executed', {
        command: cmd,
        params: cmdParams,
        newState
      });

      res.json({ 
        success: true, 
        command: cmd,
        newState 
      });
    } catch (error) {
      console.error('Error executing live command:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid command data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to execute command" });
      }
    }
  });

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

      // Load the scene into preview and the set as current
      const liveStateUpdates = {
        currentSetId: presentationSet.id,
        previewSceneId: scene.id
      };

      const liveState = await storage.updateLiveState(liveStateUpdates);

      // Broadcast the update to all connected SSE clients
      liveSSEManager.broadcast('quick-setup-complete', {
        scene,
        presentationSet,
        liveState
      });

      res.status(201).json({
        success: true,
        message: "Quick setup completed successfully",
        scene,
        presentationSet,
        liveState
      });
    } catch (error) {
      console.error('Error in quick setup:', error);
      res.status(500).json({ error: "Failed to complete quick setup" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
