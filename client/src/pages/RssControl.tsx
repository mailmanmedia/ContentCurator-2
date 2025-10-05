import Header from "@/components/Header";
import RssControlPanel from "@/components/RssControlPanel";

export default function RssControl() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-league-spartan font-bold text-foreground">
            RSS Ticker Control Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage RSS feed sources and configure ticker display settings
          </p>
        </div>
        <RssControlPanel />
      </main>
    </div>
  );
}
