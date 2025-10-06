import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface H2HMatchCardOverlayProps {
  homeTeamId: number;
  awayTeamId: number;
  width: number;
  height: number;
  opacity?: number;
}

export default function H2HMatchCardOverlay({
  homeTeamId,
  awayTeamId,
  width,
  height,
  opacity = 0.95,
}: H2HMatchCardOverlayProps) {
  const { data: prediction, isLoading } = useQuery({
    queryKey: ['/api/cached-stats/matchup', homeTeamId, awayTeamId],
    queryFn: async () => {
      const res = await fetch(`/api/cached-stats/matchup/${homeTeamId}/${awayTeamId}`);
      if (!res.ok) throw new Error('Failed to fetch match prediction');
      return res.json();
    },
  });

  if (isLoading || !prediction) {
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
          fontSize: '16px',
        }}
      >
        Loading...
      </div>
    );
  }

  const { fixture, prediction: pred, context } = prediction;
  const { matchOutcome } = pred;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
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
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F6EB61', marginBottom: '8px' }}>
        HEAD-TO-HEAD PREDICTION
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fixture.homeTeam.name}</div>
          <div style={{ fontSize: '12px', color: '#F6EB61', marginTop: '4px' }}>
            {context.liverpoolForm}
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F6EB61', padding: '0 16px' }}>
          VS
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{fixture.awayTeam.name}</div>
          <div style={{ fontSize: '12px', color: '#F6EB61', marginTop: '4px' }}>
            {context.opponentForm}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(246, 235, 97, 0.3)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00FF87' }}>
              {Math.round(matchOutcome.winProbability * 100)}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>WIN</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F6EB61' }}>
              {Math.round(matchOutcome.drawProbability * 100)}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>DRAW</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF4444' }}>
              {Math.round(matchOutcome.lossProbability * 100)}%
            </div>
            <div style={{ fontSize: '11px', color: '#CCCCCC' }}>LOSS</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px' }}>
          <div>
            H2H: {context.h2hRecord.wins}W-{context.h2hRecord.draws}D-{context.h2hRecord.losses}L
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {pred.momentumDifference > 0 ? (
              <>
                <TrendingUp size={12} color="#00FF87" />
                <span style={{ color: '#00FF87' }}>Momentum</span>
              </>
            ) : (
              <>
                <TrendingDown size={12} color="#FF4444" />
                <span style={{ color: '#FF4444' }}>Momentum</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
