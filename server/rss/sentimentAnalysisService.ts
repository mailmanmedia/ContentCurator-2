import OpenAI from "openai";
import { db } from "../db";
import { rssAnalyses, rssArticles } from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { z } from "zod";

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Sentiment score schema
const sentimentSchema = z.object({
  score: z.number().min(-1).max(1), // -1 (very negative) to 1 (very positive)
  label: z.enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  reasoning: z.string()
});

interface SentimentCache {
  articleId: number;
  sentiment: z.infer<typeof sentimentSchema>;
  timestamp: Date;
  cacheKey: string;
}

class SentimentAnalysisService {
  private cache: Map<string, SentimentCache> = new Map();
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  async analyzeSentiment(articleId: number, title: string, content?: string): Promise<z.infer<typeof sentimentSchema> | null> {
    if (!openai) {
      console.error('OpenAI not configured');
      return this.getFallbackSentiment(title, content);
    }

    const cacheKey = `sentiment-${articleId}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
      return cached.sentiment;
    }

    // Check database for recent analysis
    const dbAnalysis = await db.select()
      .from(rssAnalyses)
      .where(
        and(
          eq(rssAnalyses.articleId, articleId),
          gte(rssAnalyses.createdAt, new Date(Date.now() - this.cacheExpiry))
        )
      )
      .orderBy(desc(rssAnalyses.createdAt))
      .limit(1);

    if (dbAnalysis.length > 0 && dbAnalysis[0].sentiment) {
      const sentiment = dbAnalysis[0].sentiment as z.infer<typeof sentimentSchema>;
      this.cache.set(cacheKey, {
        articleId,
        sentiment,
        timestamp: dbAnalysis[0].createdAt,
        cacheKey
      });
      return sentiment;
    }

    // Analyze with OpenAI
    try {
      const textToAnalyze = content ? `Title: ${title}\n\nContent: ${content}` : title;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a sentiment analysis expert for Liverpool FC football news. Analyze the sentiment of the given article and return a JSON object with:
            - score: number between -1 (very negative) and 1 (very positive)
            - label: one of 'very_negative', 'negative', 'neutral', 'positive', 'very_positive'
            - confidence: number between 0 and 1 indicating confidence in the analysis
            - keywords: array of key emotional/sentiment words from the text
            - reasoning: brief explanation of the sentiment assessment
            
            Consider context like:
            - Liverpool wins/losses
            - Player injuries/recoveries
            - Transfer news (positive/negative)
            - Team performance
            - Manager statements
            - Fan reactions`
          },
          {
            role: "user",
            content: textToAnalyze
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 300
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      const sentiment = sentimentSchema.parse(JSON.parse(result));

      // Save to database
      await db.insert(rssAnalyses).values({
        articleId,
        analysisType: 'sentiment',
        sentiment: sentiment as any,
        createdAt: new Date()
      }).onConflictDoNothing();

      // Cache the result
      this.cache.set(cacheKey, {
        articleId,
        sentiment,
        timestamp: new Date(),
        cacheKey
      });

      return sentiment;
    } catch (error) {
      console.error('Error analyzing sentiment with OpenAI:', error);
      return this.getFallbackSentiment(title, content);
    }
  }

  // Fallback sentiment analysis using keyword matching
  private getFallbackSentiment(title: string, content?: string): z.infer<typeof sentimentSchema> {
    const text = (title + ' ' + (content || '')).toLowerCase();
    
    const positiveWords = ['win', 'victory', 'success', 'brilliant', 'excellent', 'great', 'amazing', 'scored', 'goal', 'clean sheet', 'signed', 'breakthrough', 'comeback'];
    const negativeWords = ['loss', 'defeat', 'injury', 'injured', 'poor', 'struggling', 'crisis', 'concern', 'doubt', 'setback', 'banned', 'suspended'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords: string[] = [];
    
    positiveWords.forEach(word => {
      if (text.includes(word)) {
        positiveCount++;
        foundKeywords.push(word);
      }
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) {
        negativeCount++;
        foundKeywords.push(word);
      }
    });
    
    const netSentiment = positiveCount - negativeCount;
    let score = 0;
    let label: z.infer<typeof sentimentSchema>['label'] = 'neutral';
    
    if (netSentiment > 2) {
      score = 0.7;
      label = 'positive';
    } else if (netSentiment > 0) {
      score = 0.3;
      label = 'positive';
    } else if (netSentiment < -2) {
      score = -0.7;
      label = 'negative';
    } else if (netSentiment < 0) {
      score = -0.3;
      label = 'negative';
    }
    
    return {
      score,
      label,
      confidence: 0.5, // Lower confidence for fallback
      keywords: foundKeywords.slice(0, 5),
      reasoning: 'Fallback keyword-based analysis'
    };
  }

  async analyzeBatchSentiments(articles: Array<{ id: number; title: string; content?: string }>): Promise<Map<number, z.infer<typeof sentimentSchema>>> {
    const results = new Map<number, z.infer<typeof sentimentSchema>>();
    
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const promises = batch.map(article => 
        this.analyzeSentiment(article.id, article.title, article.content)
      );
      
      const batchResults = await Promise.all(promises);
      
      batch.forEach((article, index) => {
        const sentiment = batchResults[index];
        if (sentiment) {
          results.set(article.id, sentiment);
        }
      });
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async getAggregatedSentiment(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<{
    averageScore: number;
    totalArticles: number;
    sentimentBreakdown: Record<string, number>;
    topKeywords: string[];
    trend: 'improving' | 'declining' | 'stable';
  }> {
    const hoursMap = { day: 24, week: 168, month: 720 };
    const hours = hoursMap[timeRange];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Get recent articles
    const articles = await db.select()
      .from(rssArticles)
      .where(gte(rssArticles.publishedAt, since))
      .orderBy(desc(rssArticles.publishedAt));
    
    if (articles.length === 0) {
      return {
        averageScore: 0,
        totalArticles: 0,
        sentimentBreakdown: {},
        topKeywords: [],
        trend: 'stable'
      };
    }
    
    // Analyze sentiments for articles without analysis
    const sentiments = await this.analyzeBatchSentiments(
      articles.map(a => ({ id: a.id, title: a.title, content: a.content || undefined }))
    );
    
    // Calculate aggregates
    let totalScore = 0;
    const breakdown: Record<string, number> = {
      very_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      very_negative: 0
    };
    const keywordCount: Record<string, number> = {};
    
    sentiments.forEach(sentiment => {
      totalScore += sentiment.score;
      breakdown[sentiment.label]++;
      
      sentiment.keywords.forEach(keyword => {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      });
    });
    
    // Calculate trend by comparing first half vs second half
    const midPoint = Math.floor(articles.length / 2);
    const firstHalf = Array.from(sentiments.values()).slice(0, midPoint);
    const secondHalf = Array.from(sentiments.values()).slice(midPoint);
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.score, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.score, 0) / (secondHalf.length || 1);
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondAvg - firstAvg > 0.1) trend = 'improving';
    else if (firstAvg - secondAvg > 0.1) trend = 'declining';
    
    // Get top keywords
    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);
    
    return {
      averageScore: totalScore / sentiments.size,
      totalArticles: articles.length,
      sentimentBreakdown: breakdown,
      topKeywords,
      trend
    };
  }
}

export const sentimentAnalysisService = new SentimentAnalysisService();