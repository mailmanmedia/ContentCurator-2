import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, Activity, PieChart, Hash, Tag, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RssSentimentOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  timeframe?: '24h' | '7d' | '30d';
  showTrendingTopics?: boolean;
  showSentimentBreakdown?: boolean;
  minSentiment?: number;
}

export default function RssSentimentOverlay({
  width,
  height,
  opacity = 0.9,
  timeframe = '24h',
  showTrendingTopics = true,
  showSentimentBreakdown = true,
  minSentiment,
}: RssSentimentOverlayProps) {
  const { data: sentimentSummary, isLoading } = useQuery<{
    averageSentiment: number;
    totalArticles: number;
    trendingTopics: Array<{ topic: string; count: number; sentiment: number }>;
    topKeywords: Array<{ keyword: string; frequency: number }>;
    sentimentBreakdown: { positive: number; neutral: number; negative: number };
    lastFetched?: string;
  }>({
    queryKey: ['/api/rss/sentiment-summary', { timeframe }],
    refetchInterval: 60000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/rss/sentiment-summary/refresh', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rss/sentiment-summary'] });
    },
  });

  if (!isLoading && sentimentSummary?.totalArticles === 0) {
    return (
      <div
        style={{
          width: `${width}%`,
          height: `${height}px`,
          backgroundColor: `rgba(0, 33, 71, ${opacity})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontFamily: 'League Spartan, sans-serif',
          borderRadius: '8px',
          border: '2px solid #C8102E',
          padding: '24px',
          gap: '16px',
        }}
        data-testid="overlay-sentiment-empty"
      >
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#F6EB61', textAlign: 'center' }}>
          No RSS articles available
        </div>
        <div style={{ fontSize: '12px', color: '#CCCCCC', textAlign: 'center' }}>
          Click refresh to fetch latest news
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#C8102E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: refreshMutation.isPending ? 'not-allowed' : 'pointer',
            opacity: refreshMutation.isPending ? 0.6 : 1,
          }}
          data-testid="button-refresh-empty"
        >
          <RefreshCw 
            size={16} 
            className={refreshMutation.isPending ? 'animate-spin' : ''} 
          />
          {refreshMutation.isPending ? 'Fetching...' : 'Refresh'}
        </button>
      </div>
    );
  }

  if (isLoading || !sentimentSummary) {
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
        data-testid="overlay-sentiment-loading"
      >
        Loading sentiment data...
      </div>
    );
  }

  const {
    averageSentiment,
    totalArticles,
    trendingTopics,
    topKeywords,
    sentimentBreakdown,
    lastFetched
  } = sentimentSummary;

  const getSentimentColor = (value: number) => {
    if (value > 0.3) return '#00FF87';
    if (value > 0) return '#F6EB61';
    if (value > -0.3) return '#FF9500';
    return '#FF4444';
  };

  const getSentimentLabel = (value: number) => {
    if (value > 0.5) return 'Very Positive';
    if (value > 0.3) return 'Positive';
    if (value > -0.3) return 'Neutral';
    if (value > -0.5) return 'Negative';
    return 'Very Negative';
  };

  const sentimentColor = getSentimentColor(averageSentiment);
  const total = sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative;
  
  const positivePercent = total > 0 ? (sentimentBreakdown.positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (sentimentBreakdown.neutral / total) * 100 : 0;
  const negativePercent = total > 0 ? (sentimentBreakdown.negative / total) * 100 : 0;

  const timeframeLabels: Record<string, string> = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days'
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        width: `${width}%`,
        height: `${height}px`,
        backgroundColor: `rgba(0, 33, 71, ${opacity})`,
        color: '#FFFFFF',
        fontFamily: 'League Spartan, sans-serif',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '8px',
        border: '2px solid #C8102E',
        overflow: 'hidden',
      }}
      data-testid="overlay-sentiment-summary"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F6EB61' }}>
          RSS SENTIMENT ANALYSIS
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '10px', color: '#CCCCCC' }}>
            {timeframeLabels[timeframe]}
          </div>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={isLoading || refreshMutation.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              backgroundColor: 'transparent',
              color: '#F6EB61',
              border: '1px solid #F6EB61',
              borderRadius: '4px',
              cursor: (isLoading || refreshMutation.isPending) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || refreshMutation.isPending) ? 0.5 : 1,
            }}
            data-testid="button-refresh-sentiment"
          >
            <RefreshCw 
              size={12} 
              className={refreshMutation.isPending ? 'animate-spin' : ''} 
            />
          </button>
        </div>
      </div>

      {refreshMutation.isPending && (
        <div style={{ 
          fontSize: '10px', 
          color: '#F6EB61', 
          marginBottom: '8px',
          textAlign: 'center' 
        }} data-testid="text-fetching">
          Fetching...
        </div>
      )}

      {refreshMutation.isSuccess && refreshMutation.data?.articlesAdded !== undefined && (
        <div style={{ 
          fontSize: '10px', 
          color: '#00FF87', 
          marginBottom: '8px',
          textAlign: 'center' 
        }} data-testid="text-articles-added">
          {refreshMutation.data.articlesAdded} new articles added
        </div>
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '12px',
          padding: '12px',
          backgroundColor: 'rgba(246, 235, 97, 0.1)',
          borderRadius: '8px',
        }}
        data-testid="sentiment-average-display"
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: sentimentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#000000',
          }}
        >
          {averageSentiment > 0 ? '+' : ''}{(averageSentiment * 100).toFixed(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: sentimentColor }}>
            {getSentimentLabel(averageSentiment)}
          </div>
          <div style={{ fontSize: '11px', color: '#CCCCCC', marginTop: '2px' }}>
            {totalArticles} articles analyzed
          </div>
          {lastFetched && (
            <div style={{ fontSize: '9px', color: '#999999', marginTop: '2px' }} data-testid="text-last-fetched">
              Last updated: {new Date(lastFetched).toLocaleTimeString()}
            </div>
          )}
        </div>
      </motion.div>

      {showSentimentBreakdown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: '12px' }}
          data-testid="sentiment-breakdown"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <PieChart size={14} color="#F6EB61" />
            <span style={{ fontSize: '11px', color: '#F6EB61', fontWeight: 'bold' }}>SENTIMENT BREAKDOWN</span>
          </div>
          
          <div style={{
            height: '24px',
            display: 'flex',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '6px',
          }}>
            {positivePercent > 0 && (
              <div
                style={{
                  width: `${positivePercent}%`,
                  backgroundColor: '#00FF87',
                  transition: 'width 0.5s ease',
                }}
              />
            )}
            {neutralPercent > 0 && (
              <div
                style={{
                  width: `${neutralPercent}%`,
                  backgroundColor: '#F6EB61',
                  transition: 'width 0.5s ease',
                }}
              />
            )}
            {negativePercent > 0 && (
              <div
                style={{
                  width: `${negativePercent}%`,
                  backgroundColor: '#FF4444',
                  transition: 'width 0.5s ease',
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#CCCCCC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#00FF87' }} />
              Positive: {sentimentBreakdown.positive}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#F6EB61' }} />
              Neutral: {sentimentBreakdown.neutral}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#FF4444' }} />
              Negative: {sentimentBreakdown.negative}
            </div>
          </div>
        </motion.div>
      )}

      {showTrendingTopics && trendingTopics && trendingTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginBottom: '12px' }}
          data-testid="trending-topics"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <TrendingUp size={14} color="#F6EB61" />
            <span style={{ fontSize: '11px', color: '#F6EB61', fontWeight: 'bold' }}>TRENDING TOPICS</span>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {trendingTopics.slice(0, 6).map((topic: { topic: string; count: number; sentiment: number }, index: number) => (
              <motion.div
                key={topic.topic}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                data-testid={`topic-badge-${index}`}
              >
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: 'rgba(200, 16, 46, 0.3)',
                    borderColor: getSentimentColor(topic.sentiment),
                    color: '#FFFFFF',
                    fontSize: '9px',
                    padding: '4px 8px',
                  }}
                >
                  {topic.topic} ({topic.count})
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {topKeywords && topKeywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            borderTop: '1px solid rgba(246, 235, 97, 0.3)',
            paddingTop: '10px',
          }}
          data-testid="top-keywords"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Hash size={14} color="#CCCCCC" />
            <span style={{ fontSize: '10px', color: '#CCCCCC' }}>Top Keywords</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {topKeywords.slice(0, 8).map((keyword: { keyword: string; frequency: number }, index: number) => (
              <span
                key={keyword.keyword}
                style={{
                  fontSize: '9px',
                  color: '#CCCCCC',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                }}
                data-testid={`keyword-${index}`}
              >
                {keyword.keyword}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
