import TemplateCard from '../TemplateCard';

export default function TemplateCardExample() {
  // todo: remove mock functionality
  const mockTemplates = [
    {
      title: "Contrarian Take",
      category: "Mailman Monday" as const,
      description: "Challenge conventional narratives with data-driven insights",
      thumbnail: "/placeholder.jpg",
      dimensions: "1920x1080",
      lastUsed: "2 days ago"
    },
    {
      title: "Squad Analysis",
      category: "Data Dive Wednesday" as const,
      description: "Deep dive into tactical formations and player statistics",
      thumbnail: "/placeholder.jpg",
      dimensions: "1280x720"
    },
    {
      title: "Transfer Prediction",
      category: "Future Focus Friday" as const,
      description: "Predictive analysis with confidence meters and risk factors",
      thumbnail: "/placeholder.jpg",
      dimensions: "1920x1080",
      lastUsed: "1 week ago"
    }
  ];

  return (
    <div className="dark p-6 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTemplates.map((template, index) => (
          <TemplateCard key={index} {...template} />
        ))}
      </div>
    </div>
  );
}