import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface FormGuideOverlayProps {
  width: number;
  height: number;
  opacity?: number;
  layout?: 'horizontal' | 'vertical';
}

export default function FormGuideOverlay({
  width,
  height,
  opacity = 0.9,
  layout = 'horizontal',
}: FormGuideOverlayProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/cached-stats/team', 40, 39],
    queryFn: async () => {
      const res = await fetch(`/api/cached-stats/team/40/39`);
      if (!res.ok) throw new Error('Failed to fetch team stats');
      return res.json();
    },
  });

  if (isLoading || !metrics) {
    return (
      <div
        style={{
          width: `${width}%`,
          height: `${height}px`,
          backgroundColor: `rgba(200, 16, 46, ${opacity})`,
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

  const formString = metrics.statistics?.form || '';
  const formArray = formString.split('').slice(0, 5);

  const getResultColor = (result: string) => {
    switch (result) {
      case 'W': return '#00FF87';
      case 'D': return '#F6EB61';
      case 'L': return '#FF4444';
      default: return '#CCCCCC';
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'W': return 'WIN';
      case 'D': return 'DRAW';
      case 'L': return 'LOSS';
      default: return result;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        width: `${width}%`,
        height: `${height}px`,
        backgroundColor: `rgba(200, 16, 46, ${opacity})`,
        color: '#FFFFFF',
        fontFamily: 'League Spartan, sans-serif',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '8px',
        border: '2px solid #002147',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#F6EB61', marginBottom: '8px' }}>
        RECENT FORM
      </div>

      <div style={{
        display: 'flex',
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        gap: layout === 'horizontal' ? '8px' : '6px',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {formArray.map((result: string, index: number) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            style={{
              display: 'flex',
              flexDirection: layout === 'horizontal' ? 'column' : 'row',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: layout === 'horizontal' ? '40px' : '30px',
                height: layout === 'horizontal' ? '40px' : '30px',
                borderRadius: '50%',
                backgroundColor: getResultColor(result),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: layout === 'horizontal' ? '18px' : '14px',
                fontWeight: 'bold',
                color: '#000000',
              }}
            >
              {result}
            </div>
            <div style={{
              fontSize: '10px',
              color: '#CCCCCC',
              textAlign: 'center',
            }}>
              {getResultText(result)}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{
        borderTop: '1px solid rgba(246, 235, 97, 0.3)',
        paddingTop: '8px',
        fontSize: '11px',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Last 5 Matches</span>
        <span style={{ color: '#F6EB61' }}>
          {formArray.filter((r: string) => r === 'W').length}W-
          {formArray.filter((r: string) => r === 'D').length}D-
          {formArray.filter((r: string) => r === 'L').length}L
        </span>
      </div>
    </motion.div>
  );
}
