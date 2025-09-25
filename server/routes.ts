import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express): Promise<Server> {
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

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant specialized in creating engaging Liverpool FC YouTube content for Mailman Media. Generate creative, data-driven content suggestions that would appeal to Liverpool fans and YouTube audiences. Focus on tactical analysis, player performance, transfer insights, and match analysis. Context: ${context || 'Liverpool FC YouTube content'}`
          },
          {
            role: "user",
            content: `Generate 5 creative content suggestions based on this prompt: ${prompt}`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      const content = completion.choices[0]?.message?.content || "";
      const suggestions = content.split('\n').filter(line => line.trim()).slice(0, 5);

      res.json({ suggestions });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  // Generate Variations endpoint
  app.post("/api/ai/generate-variations", async (req, res) => {
    try {
      const { text, images, stats, ideas, outputType, style, priority } = req.body;
      
      if (!text || !outputType) {
        return res.status(400).json({ error: "Text and output type are required" });
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
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert content creator for Liverpool FC YouTube channel Mailman Media. Generate 3-5 distinct variations for the requested content type. Each variation should be unique in approach, angle, or presentation style. Return a JSON array of variations with: type, title, description, and confidence (0-100).`
          },
          {
            role: "user",
            content: `Create variations for this Liverpool FC content: ${contextPrompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = completion.choices[0]?.message?.content || "";
      
      // Try to parse JSON, fallback to mock data if parsing fails
      let variations;
      try {
        variations = JSON.parse(content);
      } catch {
        // Fallback variations if JSON parsing fails
        variations = [
          {
            type: outputType,
            title: `${style?.split(' - ')[0] || 'Liverpool'} Analysis`,
            description: `Comprehensive analysis focusing on ${text.substring(0, 100)}...`,
            confidence: 85
          },
          {
            type: outputType,
            title: `Data-Driven ${outputType}`,
            description: `Statistical breakdown with visual emphasis on key metrics`,
            confidence: 78
          },
          {
            type: outputType,
            title: `Tactical Deep Dive`,
            description: `Formation and strategy analysis with interactive elements`,
            confidence: 82
          }
        ];
      }

      res.json({ variations });
    } catch (error) {
      console.error('Error generating variations:', error);
      res.status(500).json({ error: "Failed to generate variations" });
    }
  });

  // Image Search endpoint using Perplexity
  app.post("/api/ai/search-images", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      // Use Perplexity to find relevant images
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
              content: `Find high-quality images of: ${query}. Focus on Liverpool FC, football, or sports-related content. Provide direct image URLs if possible.`
            }
          ]
        })
      });

      const perplexityData = await perplexityResponse.json();
      const searchResults = perplexityData.choices[0]?.message?.content || "";

      res.json({ 
        results: searchResults,
        query 
      });
    } catch (error) {
      console.error('Error searching images:', error);
      res.status(500).json({ error: "Failed to search images" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
