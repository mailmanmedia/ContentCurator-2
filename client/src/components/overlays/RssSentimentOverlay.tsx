import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, Activity, Radio, Users } from "lucide-react";

interface RssSentimentOverlayProps {
  width: number;
  height: number;
  opacity?: number;
}

export default function RssSentimentOverlay({
  width,
  height,
  opacity = 0.9,
}: RssSentimentOverlayProps) {
  const { data: rssMetrics, isLoading } = useQuery({
    queryKey: ['/api/analytics/rss-metrics'],
  });

  if (isLoading || !rssMetrics) {
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
      >
        Loading...
      </div>
    );
  }

  const { sentiment, trending, coverage } = rssMetrics;
  const sentimentValue = sentiment?.aggregatedScore?.value || 0;
  const trendingScore = trending?.topicScore?.value || 0;
  const intensityValue = coverage?.intensity?.value || 0;
  const diversityValue = coverage?.diversity?.value || 0;

  const getSentimentColor = (value: number) => {
    if (value > 0.5) return '#00FF87';
    if (value > 0) return '#F6EB61';
    if (value > -0.3) return '#FF9500';
    return '#FF4444';
  };

  const getSentimentLabel = (value: number) => {
    if (value > 0.5) return 'Very Positive';
    if (value > 0) return 'Positive';
    if (value > -0.3) return 'Neutral';
    return 'Negative';
  };

  const sentimentColor = getSentimentColor(sentimentValue);

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
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F6EB61', marginBottom: '12px' }}>
        RSS SENTIMENT ANALYSIS
      </div>

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
          {sentimentValue > 0 ? '+' : ''}{(sentimentValue * 100).toFixed(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: sentimentColor }}>
            {getSentimentLabel(sentimentValue)}
          </div>
          <div style={{ fontSize: '11px', color: '#CCCCCC', marginTop: '2px' }}>
            Overall Media Sentiment
          </div>
        </div>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: 'rgba(200, 16, 46, 0.2)',
            padding: '10px',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <TrendingUp size={14} color="#F6EB61" />
            <span style={{ fontSize: '10px', color: '#CCCCCC' }}>TRENDING</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F6EB61' }}>
            {(trendingScore * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '9px', color: '#CCCCCC' }}>
            Topic Heat
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            backgroundColor: 'rgba(200, 16, 46, 0.2)',
            padding: '10px',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Radio size={14} color="#F6EB61" />
            <span style={{ fontSize: '10px', color: '#CCCCCC' }}>COVERAGE</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F6EB61' }}>
            {(intensityValue * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '9px', color: '#CCCCCC' }}>
            Intensity
          </div>
        </motion.div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(246, 235, 97, 0.3)',
        paddingTop: '10px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} color="#CCCCCC" />
            <span style={{ color: '#CCCCCC' }}>Source Diversity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: i < Math.round(diversityValue * 5) ? '#00FF87' : 'rgba(255, 255, 255, 0.2)',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} color="#CCCCCC" />
            <span style={{ color: '#CCCCCC' }}>Recent Articles</span>
          </div>
          <span style={{ fontWeight: 'bold', color: '#F6EB61' }}>
            {rssMetrics.recentArticles || 0}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
