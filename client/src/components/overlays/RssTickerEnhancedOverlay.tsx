import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface RssTickerEnhancedOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  rssSourceIds: string[];
  maxArticles?: number;
  showSentiment?: boolean;
  showTopics?: boolean;
  showKeywords?: boolean;
  showCredibility?: boolean;
  sentimentFilter?: { min: number; max: number };
  categoryFilter?: string[];
}

interface Article {
  id: string;
  title: string;
  sourceId: string;
  publishedAt: string;
  sentiment?: {
    score: number;
    label: string;
    confidence: number;
    keywords: string[];
  } | null;
  topics?: string[] | null;
  category?: string | null;
}

export default function RssTickerEnhancedOverlay({
  width,
  height,
  opacity = 0.9,
  rssSourceIds,
  maxArticles = 20,
  showSentiment = true,
  showTopics = true,
  showKeywords = false,
  showCredibility = true,
  sentimentFilter,
  categoryFilter,
}: RssTickerEnhancedOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set('sources', rssSourceIds.join(','));
  queryParams.set('limit', maxArticles.toString());
  queryParams.set('includeSentiment', 'true');
  queryParams.set('includeTopics', 'true');
  
  if (categoryFilter && categoryFilter.length > 0) {
    queryParams.set('categoryFilter', categoryFilter.join(','));
  }
  
  if (sentimentFilter?.min !== undefined) {
    queryParams.set('minSentiment', sentimentFilter.min.toString());
  }

  const { data: articlesData, isLoading } = useQuery<{ articles: Article[] }>({
    queryKey: ['/api/rss-articles', queryParams.toString()],
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const articles = articlesData?.articles || [];
  
  // Filter by sentiment if max is set
  const filteredArticles = sentimentFilter?.max !== undefined
    ? articles.filter(article => 
        article.sentiment && article.sentiment.score <= sentimentFilter.max
      )
    : articles;

  // Filter by selected topic
  const displayArticles = selectedTopic
    ? filteredArticles.filter(article => article.topics?.includes(selectedTopic))
    : filteredArticles;

  // Get all unique topics for filtering
  const allTopics = Array.from(
    new Set(
      filteredArticles.flatMap(article => article.topics || [])
    )
  ).slice(0, 10);

  // Auto-advance ticker
  useEffect(() => {
    if (displayArticles.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [displayArticles.length]);

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return '#00FF87';
    if (score >= -0.3) return '#F6EB61';
    return '#FF4444';
  };

  const getCredibilityStars = (sourceId: string) => {
    // Simple tier system based on source ID
    // In production, this would come from source metadata
    const tierMap: Record<string, number> = {
      'official': 3,
      'tier1': 3,
      'tier2': 2,
      'tier3': 1,
    };
    
    // Default tier 2 for unknown sources
    return tierMap[sourceId] || 2;
  };

  if (isLoading) {
    return (
      <div
        style={{
          width: `${width}%`,
          height: `${height}px`,
          backgroundColor: `rgba(0, 33, 71, ${opacity})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontFamily: 'League Spartan, sans-serif',
          fontSize: '14px',
        }}
        data-testid="ticker-loading"
      >
        Loading articles...
      </div>
    );
  }

  if (displayArticles.length === 0) {
    return (
      <div
        style={{
          width: `${width}%`,
          height: `${height}px`,
          backgroundColor: `rgba(0, 33, 71, ${opacity})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#CCCCCC',
          fontFamily: 'League Spartan, sans-serif',
          fontSize: '12px',
        }}
        data-testid="ticker-no-articles"
      >
        No articles match the current filters
      </div>
    );
  }

  const currentArticle = displayArticles[currentIndex];
  const sentimentColor = currentArticle.sentiment 
    ? getSentimentColor(currentArticle.sentiment.score)
    : '#F6EB61';

  return (
    <div
      style={{
        width: `${width}%`,
        height: `${height}px`,
        backgroundColor: `rgba(0, 33, 71, ${opacity})`,
        fontFamily: 'League Spartan, sans-serif',
        borderRadius: '8px',
        border: '2px solid #C8102E',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid="ticker-enhanced-overlay"
    >
      {/* Topic filters */}
      {showTopics && allTopics.length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(200, 16, 46, 0.3)',
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
          data-testid="topic-filters"
        >
          <TrendingUp size={12} color="#F6EB61" />
          <span style={{ fontSize: '10px', color: '#F6EB61', marginRight: '4px' }}>TOPICS:</span>
          
          <Badge
            variant="outline"
            onClick={() => setSelectedTopic(null)}
            style={{
              backgroundColor: selectedTopic === null ? 'rgba(246, 235, 97, 0.3)' : 'transparent',
              borderColor: '#F6EB61',
              color: '#FFFFFF',
              fontSize: '9px',
              padding: '2px 8px',
              cursor: 'pointer',
            }}
            data-testid="topic-filter-all"
          >
            All
          </Badge>
          
          {allTopics.map((topic, index) => (
            <Badge
              key={topic}
              variant="outline"
              onClick={() => setSelectedTopic(topic)}
              style={{
                backgroundColor: selectedTopic === topic ? 'rgba(246, 235, 97, 0.3)' : 'transparent',
                borderColor: '#C8102E',
                color: '#FFFFFF',
                fontSize: '9px',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
              data-testid={`topic-filter-${index}`}
            >
              {topic}
            </Badge>
          ))}
        </div>
      )}

      {/* Main ticker content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 16px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%' }}
            data-testid={`article-${currentIndex}`}
          >
            {/* Headline with sentiment indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              {showSentiment && currentArticle.sentiment && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: sentimentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#000000',
                    flexShrink: 0,
                  }}
                  data-testid="sentiment-badge"
                >
                  {currentArticle.sentiment.score > 0 ? '+' : ''}
                  {(currentArticle.sentiment.score * 100).toFixed(0)}
                </motion.div>
              )}
              
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: sentimentColor,
                    lineHeight: '1.3',
                    marginBottom: '4px',
                  }}
                  data-testid="article-headline"
                >
                  {currentArticle.title}
                </div>
                
                {showCredibility && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[...Array(getCredibilityStars(currentArticle.sourceId))].map((_, i) => (
                      <Star key={i} size={10} fill="#F6EB61" color="#F6EB61" />
                    ))}
                    <span style={{ fontSize: '9px', color: '#CCCCCC', marginLeft: '4px' }}>
                      Tier {getCredibilityStars(currentArticle.sourceId)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Keywords */}
            {showKeywords && currentArticle.sentiment?.keywords && currentArticle.sentiment.keywords.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginTop: '8px',
                }}
                data-testid="article-keywords"
              >
                {currentArticle.sentiment.keywords.slice(0, 3).map((keyword, index) => (
                  <motion.span
                    key={keyword}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    style={{
                      fontSize: '9px',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      backgroundColor: 'rgba(200, 16, 46, 0.4)',
                      borderRadius: '4px',
                      border: '1px solid rgba(200, 16, 46, 0.6)',
                    }}
                    data-testid={`keyword-${index}`}
                  >
                    #{keyword}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress indicator */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(200, 16, 46, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: '#CCCCCC' }}>
            {currentIndex + 1} / {displayArticles.length}
          </span>
          <span style={{ fontSize: '9px', color: '#CCCCCC' }}>
            {new Date(currentArticle.publishedAt).toLocaleDateString()} {new Date(currentArticle.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div
          style={{
            height: '3px',
            backgroundColor: 'rgba(200, 16, 46, 0.3)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            key={currentIndex}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 8, ease: 'linear' }}
            style={{
              height: '100%',
              backgroundColor: sentimentColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
