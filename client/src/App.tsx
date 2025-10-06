import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { CameraStreamProvider } from "@/contexts/CameraStreamContext";
import VisualAssistant from "@/components/VisualAssistant";
import FrameworkDirectory from "@/pages/FrameworkDirectory";
import CreateFramework from "@/pages/CreateFramework";
import RssIntelligence from "@/pages/RssIntelligence";
import RssControl from "@/pages/RssControl";
import TeamMatchupStudio from "@/pages/TeamMatchupStudio";
import ContentLibrary from "@/pages/ContentLibrary";
import LivePresentation from "@/pages/LivePresentation";
import Templates from "@/pages/Templates";
import OverlayTemplateBuilder from "@/pages/OverlayTemplateBuilder";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={VisualAssistant} />
      <Route path="/frameworks" component={FrameworkDirectory} />
      <Route path="/frameworks/create" component={CreateFramework} />
      <Route path="/rss" component={RssIntelligence} />
      <Route path="/rss-control" component={RssControl} />
      <Route path="/team-matchup-studio" component={TeamMatchupStudio} />
      <Route path="/team-matchup" component={TeamMatchupStudio} />
      <Route path="/content-library" component={ContentLibrary} />
      <Route path="/live-presentation" component={LivePresentation} />
      <Route path="/live" component={LivePresentation} />
      <Route path="/templates" component={Templates} />
      <Route path="/overlay-templates" component={OverlayTemplateBuilder} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CameraStreamProvider>
          <Toaster />
          <Router />
        </CameraStreamProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
