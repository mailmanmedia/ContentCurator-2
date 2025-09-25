import DataChart from '../DataChart';

export default function DataChartExample() {
  // todo: remove mock functionality
  const mockChartData = {
    playerStats: [
      { label: 'Salah', value: 28, trend: 'up' as const },
      { label: 'Mané', value: 22, trend: 'up' as const },
      { label: 'Firmino', value: 18, trend: 'neutral' as const },
      { label: 'Jota', value: 15, trend: 'down' as const }
    ],
    squadRotation: [
      { label: 'Squad Depth', value: 87 },
      { label: 'Injury Impact', value: 23 },
      { label: 'Form Rating', value: 92 }
    ],
    keyMetrics: [
      { label: 'Goals', value: 89, trend: 'up' as const },
      { label: 'Clean Sheets', value: 16, trend: 'up' as const },
      { label: 'Assists', value: 52, trend: 'neutral' as const },
      { label: 'Red Cards', value: 3, trend: 'down' as const }
    ]
  };

  return (
    <div className="dark p-6 bg-background space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataChart 
          title="Goal Scorers" 
          subtitle="Premier League 2024/25"
          data={mockChartData.playerStats}
          type="bar"
          color="primary"
        />
        <DataChart 
          title="Squad Analysis" 
          subtitle="Current season metrics"
          data={mockChartData.squadRotation}
          type="progress"
          color="chart-2"
        />
      </div>
      <DataChart 
        title="Season Statistics" 
        subtitle="Key performance indicators"
        data={mockChartData.keyMetrics}
        type="stat"
        color="chart-3"
      />
    </div>
  );
}