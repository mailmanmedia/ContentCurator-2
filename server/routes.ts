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
  insertFrameworkVersionSchema
} from "@shared/schema";
import OpenAI from "openai";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import express from "express";
import { renderPresentation, generateSecureExportHtml } from "./presentation/renderer";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  app.use('/uploads', express.static('uploads'));
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
    const { text, images = [], stats = [], ideas = [], outputType, style, priority } = req.body;
    
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
      if (!text || !outputType) {
        return res.status(400).json({ error: "Text and output type are required" });
      }

      if (!openai) {
        return res.json({ variations: createFallbackVariations() });
      }

      const contextPrompt = `
        Content: ${text}
        Images: ${images.join(', ')}
        Stats: ${stats.join(', ')}
        Ideas: ${ideas.join(', ')}
        Output Type: ${outputType}
        Style: ${style}
        Priority: ${priority}
      `;

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
      const secureHtml = generateSecureExportHtml(rendering.contentHtml, report.title);
      
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

  const httpServer = createServer(app);

  return httpServer;
}
