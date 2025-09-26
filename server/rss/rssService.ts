import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { storage } from '../storage';
import type { InsertRssArticle } from '@shared/schema';

export interface RssServiceConfig {
  requestTimeout: number;
  userAgent: string;
  maxArticlesPerFetch: number;
}

export class RssService {
  private parser: Parser;
  private config: RssServiceConfig;

  constructor(config: Partial<RssServiceConfig> = {}) {
    this.config = {
      requestTimeout: 10000, // 10 seconds
      userAgent: 'Mailman Media RSS Intelligence System/1.0',
      maxArticlesPerFetch: 50,
      ...config
    };

    this.parser = new Parser({
      timeout: this.config.requestTimeout,
      headers: {
        'User-Agent': this.config.userAgent
      }
    });
  }

  /**
   * Fetch and parse RSS feed from a source
   */
  async fetchFeed(sourceId: string): Promise<{ success: boolean; articlesAdded: number; error?: string }> {
    try {
      const source = await storage.getRssSource(sourceId);
      if (!source || !source.isActive) {
        return { success: false, articlesAdded: 0, error: 'Source not found or inactive' };
      }

      // Update last fetched timestamp
      await storage.updateRssSource(sourceId, { 
        lastFetchedAt: new Date() 
      });

      console.log(`Fetching RSS feed from: ${source.feedUrl}`);
      
      const feed = await this.parser.parseURL(source.feedUrl);
      
      if (!feed.items) {
        return { success: false, articlesAdded: 0, error: 'No items found in feed' };
      }

      let articlesAdded = 0;
      const maxArticles = Math.min(feed.items.length, this.config.maxArticlesPerFetch);

      for (let i = 0; i < maxArticles; i++) {
        const item = feed.items[i];
        
        try {
          // Check if article already exists
          const contentHash = this.generateContentHash(item.title || '', item.link || '');
          const existingArticle = await storage.getRssArticleByContentHash(contentHash);
          
          if (existingArticle) {
            continue; // Skip duplicate
          }

          // Also check by GUID if available
          if (item.guid) {
            const existingByGuid = await storage.getRssArticleByGuid(item.guid);
            if (existingByGuid) {
              continue;
            }
          }

          const article = await this.parseArticle(item, sourceId, contentHash);
          await storage.createRssArticle(article);
          articlesAdded++;

        } catch (error) {
          console.error(`Error processing article: ${item.title}`, error);
          continue; // Skip this article but continue with others
        }
      }

      // Update source with success stats
      await storage.updateRssSource(sourceId, {
        fetchErrors: 0,
        lastArticleDate: feed.items[0]?.pubDate ? new Date(feed.items[0].pubDate) : undefined
      });

      console.log(`Successfully fetched ${articlesAdded} new articles from ${source.name}`);
      
      return { success: true, articlesAdded };

    } catch (error) {
      console.error(`Error fetching RSS feed for source ${sourceId}:`, error);
      
      // Update source with error stats
      const source = await storage.getRssSource(sourceId);
      if (source) {
        await storage.updateRssSource(sourceId, {
          fetchErrors: source.fetchErrors + 1
        });
      }

      return { 
        success: false, 
        articlesAdded: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Fetch all active RSS sources
   */
  async fetchAllSources(): Promise<{ sourceId: string; result: { success: boolean; articlesAdded: number; error?: string } }[]> {
    const activeSources = await storage.getActiveRssSources();
    const results = [];

    for (const source of activeSources) {
      const result = await this.fetchFeed(source.id);
      results.push({ sourceId: source.id, result });
      
      // Add delay between requests to be respectful
      await this.delay(1000);
    }

    return results;
  }

  /**
   * Parse RSS item into article format
   */
  private async parseArticle(item: any, sourceId: string, contentHash: string): Promise<InsertRssArticle> {
    // Extract and clean content
    const title = this.cleanText(item.title || '');
    const description = this.cleanText(item.contentSnippet || item.summary || '');
    const content = this.cleanText(item.content || item['content:encoded'] || description);
    
    // Parse publication date
    let publishedAt: Date | null = null;
    if (item.pubDate) {
      try {
        publishedAt = new Date(item.pubDate);
        if (isNaN(publishedAt.getTime())) {
          publishedAt = null;
        }
      } catch {
        publishedAt = null;
      }
    }

    // Extract categories
    const categories = this.extractCategories(item);
    
    // Calculate reading time and word count
    const wordCount = this.calculateWordCount(content);
    const readingTime = Math.ceil(wordCount / 200); // Average 200 words per minute

    // Extract image URL
    const imageUrl = this.extractImageUrl(item);

    // Extract topics and keywords
    const { topics, keywords } = this.extractTopicsAndKeywords(title, description, content, categories);

    return {
      sourceId,
      title,
      description: description || null,
      content: content || null,
      link: item.link || '',
      guid: item.guid || null,
      author: item.creator || item.author || null,
      categories,
      publishedAt,
      imageUrl,
      wordCount,
      readingTime,
      topics,
      keywords,
      contentHash,
      rawDataJson: {
        originalItem: item,
        feedMetadata: {
          fetchedAt: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Generate content hash for duplicate detection
   */
  private generateContentHash(title: string, link: string): string {
    return createHash('md5').update(`${title}${link}`).digest('hex');
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  /**
   * Extract categories from RSS item
   */
  private extractCategories(item: any): string[] {
    const categories: string[] = [];
    
    if (item.categories) {
      if (Array.isArray(item.categories)) {
        categories.push(...item.categories);
      } else if (typeof item.categories === 'string') {
        categories.push(item.categories);
      }
    }

    if (item.category) {
      if (Array.isArray(item.category)) {
        categories.push(...item.category);
      } else if (typeof item.category === 'string') {
        categories.push(item.category);
      }
    }

    // Clean and deduplicate
    const uniqueCategories = new Set(categories.filter(cat => cat && cat.trim()).map(cat => cat.trim()));
    return Array.from(uniqueCategories);
  }

  /**
   * Calculate word count
   */
  private calculateWordCount(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract image URL from RSS item
   */
  private extractImageUrl(item: any): string | null {
    // Try various image fields
    if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
      return item.enclosure.url;
    }
    
    if (item['media:thumbnail']?.['@_url']) {
      return item['media:thumbnail']['@_url'];
    }
    
    if (item['media:content']?.['@_url'] && item['media:content']['@_type']?.startsWith('image/')) {
      return item['media:content']['@_url'];
    }

    // Look for images in content
    const content = item.content || item['content:encoded'] || '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) {
      return imgMatch[1];
    }

    return null;
  }

  /**
   * Extract topics and keywords from content
   */
  private extractTopicsAndKeywords(title: string, description: string, content: string, categories: string[]): { topics: string[]; keywords: string[] } {
    const text = `${title} ${description} ${content}`.toLowerCase();
    
    // Football-specific topics
    const footballTopics = [
      'transfer', 'signing', 'goal', 'match', 'premier league', 'champions league',
      'europa league', 'fa cup', 'injury', 'training', 'tactics', 'formation',
      'manager', 'player', 'contract', 'loan', 'academy', 'youth', 'women',
      'anfield', 'klopp', 'slot', 'salah', 'mane', 'firmino', 'van dijk',
      'alisson', 'henderson', 'liverpool', 'reds', 'kop'
    ];

    const foundTopics = footballTopics.filter(topic => 
      text.includes(topic) || categories.some(cat => cat.toLowerCase().includes(topic))
    );

    // Extract keywords (common football terms and player names)
    const keywords = text
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => /^[a-zA-Z]+$/.test(word))
      .slice(0, 10); // Limit to 10 keywords

    return {
      topics: Array.from(new Set([...foundTopics, ...categories])),
      keywords: Array.from(new Set(keywords))
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyze article sentiment (basic implementation)
   */
  async analyzeArticleSentiment(articleId: string): Promise<{ sentiment: string; confidence: number }> {
    const article = await storage.getRssArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Basic sentiment analysis (in production, use proper NLP service)
    const text = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
    
    const positiveWords = ['win', 'victory', 'goal', 'success', 'brilliant', 'amazing', 'excellent', 'fantastic'];
    const negativeWords = ['lose', 'defeat', 'injury', 'failure', 'terrible', 'awful', 'disappointing', 'poor'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    let sentiment: string;
    let confidence: number;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.8, 0.5 + (positiveCount - negativeCount) * 0.1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.8, 0.5 + (negativeCount - positiveCount) * 0.1);
    } else {
      sentiment = 'neutral';
      confidence = 0.6;
    }

    return { sentiment, confidence: Math.round(confidence * 100) };
  }
}

export const rssService = new RssService();